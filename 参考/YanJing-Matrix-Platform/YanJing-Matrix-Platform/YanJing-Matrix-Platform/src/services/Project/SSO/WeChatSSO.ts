import { API_URLS } from '@/apiUrls'
import { useWechatStore } from '@/stores/WeChat'
import type { RegisterParams, SSOCallbackParams, WechatNocobaseSession } from '@/types/WeChat'
import type { CaptchaVerificationPayload } from './LoginOrRegister'

export type WechatLoginFlowResult = {
    status: 'login_success' | 'register_required' | 'error'
    token?: string
    message?: string
}

type SendCodeResult = {
    message: string
    cooldown_seconds: number
}

type BindPhoneResult = {
    message: string
    phone: string
}



export const wechatSSOService = {

    async sendBindCode(phone: string, captcha: CaptchaVerificationPayload): Promise<SendCodeResult> {
        const url = API_URLS.SendCode()
        const payload = {
            phone,
            scene: 'bind',
            captcha_id: captcha.captchaId,
            captcha_text: captcha.captchaText,
        }

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        })

        if (!response.ok) {
            const errorText = await response.text().catch(() => '')
            throw new Error(`发送验证码失败 (${response.status}) ${url} ${errorText}`.trim())
        }

        return await response.json()
    },

    async bindPhone(phone: string, code: string, loginToken?: string): Promise<BindPhoneResult> {
        const wechatStore = useWechatStore()
        const token = loginToken ?? wechatStore.ssoParams.loginToken

        if (!token) {
            throw new Error('缺少 SSO loginToken')
        }

        const url = API_URLS.BindPhone()
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ phone, code }),
        })

        if (!response.ok) {
            const errorText = await response.text().catch(() => '')
            throw new Error(`绑定手机号失败 (${response.status}) ${url} ${errorText}`.trim())
        }

        const data = await response.json() as BindPhoneResult
        if (String(data.phone) !== String(phone)) {
            throw new Error('绑定返回的手机号与提交手机号不一致')
        }

        return data
    },


    /**
     * 启用微信登录流程
     * 直接重定向到后端微信登录接口
     */
    async startLogin(): Promise<WechatLoginFlowResult | void> {
        const loginApiUrl = API_URLS.WechatLoginUrl()
        console.log('[System:WechatSSO:startLogin] 重定向到微信登录接口:', loginApiUrl)

        // Electron: 优先在应用内打开 SSO 窗口（不调用系统浏览器）
        const api = (window as unknown as { electronAPI?: import('@/types/electron').IElectronAPI }).electronAPI
        if (api && typeof api.startWechatSSO === 'function') {
            const result = await api.startWechatSSO(loginApiUrl)
            if (result?.success && result.callbackUrl) {
                // 在桌面端不依赖主窗口 URL 跳转，直接用回调 URL 解析参数并写入 store
                return await this.handleCallback(result.callbackUrl)
            }
            return { status: 'error', message: result?.message || '微信登录窗口已关闭或未获取到回调' }
        }

        // Web: 按原逻辑重定向
        window.location.href = loginApiUrl
    },


    /**
     * 解析URL中的 SSO 回调参数
     */

    getCallbackParams(rawUrl?: string): SSOCallbackParams {
        const pickParams = (u: string) => {
            // 兼容：参数在 search 或 hash（hash 内也可能带 ?query）
            try {
                const parsed = new URL(u)
                const fromSearch = new URLSearchParams(parsed.search)
                const hash = parsed.hash || ''
                const qIndex = hash.indexOf('?')
                const fromHashQuery = qIndex >= 0 ? new URLSearchParams(hash.slice(qIndex + 1)) : new URLSearchParams('')
                return {
                    get: (k: string) => fromSearch.get(k) ?? fromHashQuery.get(k),
                }
            } catch {
                // 兜底：把它当作“可能的 search 字符串或 hash 字符串”
                const s = u.startsWith('?') ? u : (u.startsWith('#') ? u.slice(1) : u)
                const q = s.includes('?') ? s.slice(s.indexOf('?') + 1) : s
                const params = new URLSearchParams(q)
                return { get: (k: string) => params.get(k) }
            }
        }

        const urlParams = rawUrl ? pickParams(rawUrl) : pickParams(window.location.href)

        console.log('[System:WechatSSO:getCallbackParams] 回调参数:', {
            state: urlParams.get('state'),
            sub: urlParams.get('sub'),
            code: urlParams.get('code'),
            loginToken: urlParams.get('loginToken'),
            err_msg: urlParams.get('err_msg')
        });

        return {
            state: urlParams.get('state') || '',
            sub: urlParams.get('sub') || '',
            code: urlParams.get('code') || '',
            loginToken: urlParams.get('loginToken') || undefined,
            err_msg: urlParams.get('err_msg') || undefined
        }
    },


    /**
     * 处理统一的 SSO 回调
     */
    async handleCallback(rawUrl?: string): Promise<WechatLoginFlowResult> {
        
        console.log('[System:WechatSSO:handleCallback] 处理SSO开始');

        
        const params = this.getCallbackParams(rawUrl)
        const wechatStore = useWechatStore()

        // 存储必要参数
        await wechatStore.setSSOParams({
            sub: params.sub,
            code: params.code,
            state: params.state,
            loginToken: params.loginToken
        })

        if (params.state === 'ok' && params.loginToken) {
            // 用户已注册，直接返回 Token
            return { status: 'login_success', token: params.loginToken }
        } else if (params.state === 'bind_required') {
            // 用户未注册，需要绑定/注册
            return { status: 'register_required' }
        } else {
            // 其他错误或未知状态
            return { status: 'error', message: params.err_msg || '未知的 SSO 状态' }
        }
    },






    /**
     * 未注册用户进行注册 (调用 Wechatsignup)
     */
    async register(params: RegisterParams) {
        const wechatStore = useWechatStore()
        const { sub, code } = wechatStore.ssoParams

        if (!sub || !code) {
            throw new Error('缺少 SSO 参数 (sub/code)')
        }

        const url = API_URLS.Wechatsignup()

        // 后端有时将 sub 视为数值：如果是纯数字字符串则转为 number
        const normalizedSub: string | number = (() => {
            const raw = String(sub)
            return /^\d+$/.test(raw) ? Number(raw) : raw
        })()

        // 4. 调用注册接口 - 使用 apiUrls.ts 注释中的参数结构
         const payload = {
            phone: params.password,
            nickname:"",
            password: params.password,
            sub: normalizedSub,
            code: code
        }

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        })

        if (!response.ok) {
            const errorText = await response.text().catch(() => '')
            throw new Error(`注册失败 (${response.status}) ${url} ${errorText}`.trim())
        }

        return await response.json()
    },

    /**
     * V3版sso-微信登录换nocobase token
     * authScope 默认值在“服务层”处理（默认 root），URL 生成器不写死默认值。
     */
    async generateNocobaseToken(loginToken?: string, authScope: string = 'root'): Promise<WechatNocobaseSession | null> {
        try {
            const wechatStore = useWechatStore()
            // 此处不再直接访问 localStorage，通过 store (后端持久化在 userInfoManager) 获取
            const token = loginToken ?? wechatStore.ssoParams.loginToken

            if (!token) {
                // 正常情况：非微信SSO路径进入（例如 Matrix 自动登录/刷新）时没有 loginToken
                console.log('[System:WeChatSSO:generateNocobaseToken] 没有 SSO loginToken，跳过 NocoBase token 获取')
                return null
            }

            const url = API_URLS.GenerateNocobaseToken(authScope)
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`
                }
            })

            if (!response.ok) {
                const errorText = await response.text().catch(() => '')
                console.warn(
                    `[System:WeChatSSO:generateNocobaseToken] NocoBase token 获取失败 (${response.status}) ${url} ${errorText}`.trim()
                )
                return null
            }

            // 后端直接返回 token（可能带有双引号的 JSON 字符串或纯文本）
            const tokenText = await response.text().catch(() => '')
            let nocobaseToken = tokenText.trim()

            // 如果返回的是带引号的 JSON 字符串，我们需要去除引号
            if (nocobaseToken.startsWith('"') && nocobaseToken.endsWith('"')) {
                nocobaseToken = nocobaseToken.slice(1, -1)
            }

            if (!nocobaseToken) {
                console.warn('[System:WeChatSSO:generateNocobaseToken] NocoBase token 响应为空')
                return null
            }

            const session: WechatNocobaseSession = { token: nocobaseToken }
            wechatStore.setNocobaseSession(authScope, session)
            console.log(`[System:WeChatSSO:generateNocobaseToken] 成功获取 NocoBase token (scope: ${authScope}):`, session)
            return session
        } catch (err) {
            console.warn('[System:WeChatSSO:generateNocobaseToken] NocoBase token 获取错误', err)
            return null
        }
    }
}
