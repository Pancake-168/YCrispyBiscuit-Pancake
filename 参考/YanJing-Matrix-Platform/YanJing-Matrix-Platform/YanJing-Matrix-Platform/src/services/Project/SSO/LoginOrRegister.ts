import { API_URLS } from '@/apiUrls';

export type SmsCodeScene = 'login' | 'register' | 'bind'

export type CaptchaResponse = {
    captchaId: string
    image: string
}

export type CaptchaVerificationPayload = {
    captchaId: string
    captchaText: string
}

export type SmsAuthResponse = {
    message: string
    token: string
    matrix_token?: string | null
    expires_at?: string
}

export async function generateCaptcha(): Promise<CaptchaResponse> {

    const apiurl = API_URLS.GenerateCaptcha();
    const response = await fetch(apiurl, {
        method: 'GET',
        headers: {
            'accept': 'application/json'
        }
    });

    if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        throw new Error(`获取图片验证码失败: ${response.status} ${errorText}`.trim());
    }

    return await response.json();
}


/**
 * 调用后端统一的登录接口获取 SSO LoginToken (JWT)
 * 使用 application/x-www-form-urlencoded 格式
 */
export async function login(
    username: string,
    password: string,
    captcha?: CaptchaVerificationPayload,
): Promise<{ token: string; message: string }> {

    const apiurl = API_URLS.Login();

    const params = new URLSearchParams();
    // params.append('grant_type', 'password');
    params.append('username', username);
    params.append('password', password);
    if (captcha?.captchaId) {
        params.append('captcha_id', captcha.captchaId);
    }
    if (captcha?.captchaText) {
        params.append('captcha_text', captcha.captchaText);
    }
    //params.append('scope', '');
    //params.append('client_id', 'string');
    //params.append('client_secret', 'string');

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











export async function register(username: string, password: string): Promise<unknown> {

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

export async function sendSmsCode(
    phone: string,
    scene: SmsCodeScene,
    captcha: CaptchaVerificationPayload,
): Promise<{ message: string; cooldown_seconds: number }> {

    const apiurl = API_URLS.SendCode();

    const response = await fetch(apiurl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'accept': 'application/json'
        },
        body: JSON.stringify({
            phone,
            scene,
            captcha_id: captcha.captchaId,
            captcha_text: captcha.captchaText,
        }),
    });

    if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        throw new Error(`短信验证码发送失败: ${response.status} ${errorText}`.trim());
    }

    return await response.json();
}

export async function smsLogin(phone: string, code: string): Promise<SmsAuthResponse> {

    const apiurl = API_URLS.SmsLogin();

    const response = await fetch(apiurl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'accept': 'application/json'
        },
        body: JSON.stringify({ phone, code }),
    });

    if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        throw new Error(`手机号登录失败: ${response.status} ${errorText}`.trim());
    }

    return await response.json();
}

export async function smsRegister(phone: string, code: string, nickname: string): Promise<SmsAuthResponse> {

    const apiurl = API_URLS.SmsRegister();

    const response = await fetch(apiurl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'accept': 'application/json'
        },
        body: JSON.stringify({ phone, code, nickname }),
    });

    if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        throw new Error(`手机号注册失败: ${response.status} ${errorText}`.trim());
    }

    return await response.json();
}





export type MatrixAccessTokenExchange = {
    access_token: string
    user_id?: string
    device_id?: string
    home_server?: string
    [key: string]: unknown
}

// 兑换：使用LoginToken去获取Matrix的AccessToken
export async function LoginTokenToAccessToken(loginToken: string): Promise<{ accessData: MatrixAccessTokenExchange }> {
    const apiurl = API_URLS.GenerateMatrixToken();
    const exchangeResponse = await fetch(apiurl, {
        method: 'POST',
        headers: {
            'accept': 'application/json',
            'Authorization': `Bearer ${loginToken}`
        },
        body: '' // POST 请求通常需要 body，即使为空
    });

    if (!exchangeResponse.ok) {
        const errorText = await exchangeResponse.text().catch(() => '');
        throw new Error(`Matrix Token 兑换失败 (${exchangeResponse.status}) ${errorText}`);
    }


    const rawExchangeData = (await exchangeResponse.json().catch(() => ({}))) as unknown;
    const rawObj = (rawExchangeData && typeof rawExchangeData === 'object'
        ? (rawExchangeData as Record<string, unknown>)
        : {})

    const dataCandidate = (rawObj['data'] || rawObj['result'] || rawObj) as unknown
    const dataObj = (dataCandidate && typeof dataCandidate === 'object'
        ? (dataCandidate as Record<string, unknown>)
        : {})

    if (!dataObj['access_token']) {
        throw new Error('兑换成功但结果中缺少 access_token');
    }

    const access_token = dataObj['access_token']
    if (typeof access_token !== 'string' || !access_token) {
        throw new Error('兑换成功但 access_token 类型不正确');
    }

    const accessData: MatrixAccessTokenExchange = {
        ...(dataObj as Record<string, unknown>),
        access_token,
    }

    return { accessData };

}