

import { API_URLS } from '@/apiUrls';


/**
 * 调用后端统一的登录接口获取 SSO LoginToken (JWT)
 * 使用 application/x-www-form-urlencoded 格式
 */
export async function login(username: string, password: string): Promise<{ token: string; message: string }> {

    const apiurl = API_URLS.Login();

    const params = new URLSearchParams();
    params.append('grant_type', 'password');
    params.append('username', username);
    params.append('password', password);
    params.append('scope', '');
    params.append('client_id', 'string');
    params.append('client_secret', 'string');

    const response = await fetch(apiurl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'accept': 'application/json'
        },
        body: params
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`登录失败: ${response.status} ${errorText}`);
    }

    return await response.json();
}




//没记错的话这个应该是给后端nocobase更新账户数据的，通常在第一个登录注册之后调用，传递一些额外的信息给后端
//并且因为是与matrix账户绑定的但与matrix系统无关，所以是单独的一个接口
export async function updateAccountData(accountData: any): Promise<any> {
    const apiurl = API_URLS.updateAccountData;
    try {
        const res = await fetch(apiurl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(accountData)
        });

        const contentType = res.headers.get('content-type') || '';
        const data = contentType.includes('application/json') ? await res.json() : await res.text();

        if (!res.ok) {
            const errMsg = typeof data === 'string' ? data : JSON.stringify(data);
            throw new Error(`Request failed: ${res.status} ${res.statusText} ${errMsg}`);
        }

        return data;
    } catch (error) {
        console.error('更新后端账户数据时出错:', error);
        throw error;
    }
}










export async function register(username: string, password: string): Promise<any> {

    const apiurl = API_URLS.Register();

    const response = await fetch(apiurl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'accept': 'application/json'
        },
        body: JSON.stringify({
            username,
            password,
        }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`注册失败: ${response.status} ${errorText}`);
    }

    return await response.json();
}