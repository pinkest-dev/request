import fetch, { RequestInit, Response } from 'node-fetch';
import HttpsProxyAgent from 'https-proxy-agent';
import { CookieJar, Cookie } from 'tough-cookie';
import settings from './settings';

class HttpRequest {
    private fetchOptions: RequestInit;
    private timeout: number;
    private cookieJar: CookieJar;
    private defaultHeaders: { [key: string]: string };

    constructor(proxy?: string, timeout: number = 10000) {
        this.fetchOptions = proxy ? { agent: HttpsProxyAgent(proxy) } : {};
        this.timeout = timeout;
        this.cookieJar = new CookieJar();
        this.defaultHeaders = {
            'User-Agent': settings.userAgent
        };
    }

    public async request(
        url: string,
        requestOptions: RequestInit = {},
        options: { isJson?: boolean, customTimeout?: number } = {},
    ): Promise<{ body: any; response: Response }> {
        const { isJson = true, customTimeout } = options;

        // Merge default headers with custom headers
        let headers: any = { ...this.defaultHeaders, ...requestOptions.headers };

        // Add cookies to headers
        const cookies = await this.getCookie(url);
        if (cookies) {
            headers['Cookie'] = cookies;
        }

        const fetchTimeout = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Request timeout')), customTimeout ? customTimeout : this.timeout),
        );

        const response: Response = (await Promise.race([
            fetch(url, { ...this.fetchOptions, ...requestOptions, headers }),
            fetchTimeout,
        ])) as Response;

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const body = await response.text();

        // Save cookies
        await this.cookieJar.setCookie(response.headers.get('set-cookie') || '', url);

        try {
            const data = isJson ? JSON.parse(body) : body;
            return { body: data, response };
        } catch (error) {
            throw new Error('Body is not json!');
        }
    }

    public async setCookie(cookie: Cookie, url: string): Promise<void> {
        await this.cookieJar.setCookie(cookie, url);
    }

    public async getCookie(url: string): Promise<string | null> {
        return this.cookieJar.getCookieString(url);
    }

    public async deleteAllCookies(): Promise<void> {
        this.cookieJar.removeAllCookies()
    }

    public cookiesFromString(cookieString: string): Cookie[] {
        const cookies = cookieString.split(';').map((cookie) => Cookie.parse(cookie.trim()));
        const filtered: Cookie[] = cookies.filter(el => typeof (el) != 'undefined') as Cookie[];
        return filtered;
    }

    public stringFromCookies(cookies: Cookie[]): string {
        return cookies.map((cookie) => `${cookie.key}=${cookie.value}`).join('; ');
    }
}

export default HttpRequest;