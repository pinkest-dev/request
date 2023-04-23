import { RequestInit, Response } from 'node-fetch';
import { Cookie } from 'tough-cookie';
declare class HttpRequest {
    private fetchOptions;
    private timeout;
    private cookieJar;
    private defaultHeaders;
    constructor(proxy?: string, timeout?: number);
    request(url: string, requestOptions?: RequestInit, options?: {
        isJson?: boolean;
        customTimeout?: number;
    }): Promise<{
        body: any;
        response: Response;
    }>;
    setCookie(cookie: Cookie, url: string): Promise<void>;
    getCookie(url: string): Promise<string | null>;
    deleteAllCookies(): Promise<void>;
    cookiesFromString(cookieString: string): Cookie[];
    stringFromCookies(cookies: Cookie[]): string;
}
export default HttpRequest;
