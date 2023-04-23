import fetch from 'node-fetch';
import HttpsProxyAgent from 'https-proxy-agent';
import { CookieJar, Cookie } from 'tough-cookie';
import settings from './settings';
class HttpRequest {
    fetchOptions;
    timeout;
    cookieJar;
    defaultHeaders;
    constructor(proxy, timeout = 10000) {
        this.fetchOptions = proxy ? { agent: HttpsProxyAgent(proxy) } : {};
        this.timeout = timeout;
        this.cookieJar = new CookieJar();
        this.defaultHeaders = {
            'User-Agent': settings.userAgent
        };
    }
    async request(url, requestOptions = {}, options = {}) {
        const { isJson = true, customTimeout } = options;
        // Merge default headers with custom headers
        let headers = { ...this.defaultHeaders, ...requestOptions.headers };
        // Add cookies to headers
        const cookies = await this.getCookie(url);
        if (cookies) {
            headers['Cookie'] = cookies;
        }
        const fetchTimeout = new Promise((_, reject) => setTimeout(() => reject(new Error('Request timeout')), customTimeout ? customTimeout : this.timeout));
        const response = (await Promise.race([
            fetch(url, { ...this.fetchOptions, ...requestOptions, headers }),
            fetchTimeout,
        ]));
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const body = await response.text();
        // Save cookies
        await this.cookieJar.setCookie(response.headers.get('set-cookie') || '', url);
        try {
            const data = isJson ? JSON.parse(body) : body;
            return { body: data, response };
        }
        catch (error) {
            throw new Error('Body is not json!');
        }
    }
    async setCookie(cookie, url) {
        await this.cookieJar.setCookie(cookie, url);
    }
    async getCookie(url) {
        return this.cookieJar.getCookieString(url);
    }
    async deleteAllCookies() {
        this.cookieJar.removeAllCookies();
    }
    cookiesFromString(cookieString) {
        const cookies = cookieString.split(';').map((cookie) => Cookie.parse(cookie.trim()));
        const filtered = cookies.filter(el => typeof (el) != 'undefined');
        return filtered;
    }
    stringFromCookies(cookies) {
        return cookies.map((cookie) => `${cookie.key}=${cookie.value}`).join('; ');
    }
}
export default HttpRequest;
