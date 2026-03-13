import { API_URLS } from '../../../apiUrls.ts';


export async function register(username: string, password: string): Promise<void> {

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
        throw new Error('注册失败');
    }
}