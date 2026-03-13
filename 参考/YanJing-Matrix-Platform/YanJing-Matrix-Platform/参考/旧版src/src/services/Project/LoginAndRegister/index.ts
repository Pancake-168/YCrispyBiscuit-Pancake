import { API_URLS } from '../../../apiUrls';


/**
 * 调用后端统一的登录接口（后端会在不存在时注册，存在时直接返回 token）
 * 返回示例：{ username, access_token, device_id }
 */
export async function login(username: string, password: string): Promise<{ username: string; access_token: string; device_id: string }> {

    const apiurl = API_URLS.createNocobaseUser;

    const response = await fetch(apiurl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            username,
            password,
        }),
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
