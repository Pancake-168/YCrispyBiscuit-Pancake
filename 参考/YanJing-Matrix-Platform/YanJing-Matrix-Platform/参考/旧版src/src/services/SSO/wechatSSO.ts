import { API_URLS } from '@/apiUrls'
import { useWechatStore } from '@/stores/wechat'
import type { RegisterParams, SSOCallbackParams, WechatNocobaseSession } from '@/types/wechat'


export const wechatSSOService = {
    /**
     * 启动微信登录流程
     * 直接重定向到后端配置的微信登录 URL
     */
    startLogin() {
        const loginApiUrl = API_URLS.WechatLoginUrl()
        window.location.href = loginApiUrl
    },




    /**
     * 解析 URL 中的回调参数
     */
    getCallbackParams(): SSOCallbackParams {
        const urlParams = new URLSearchParams(window.location.search)

        console.log('Parsed SSO callback params:', {
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
     * 处理回调逻辑
     * @returns 返回下一步操作指令
     */
    async handleCallback(): Promise<{ status: 'login_success' | 'register_required' | 'error', token?: string, message?: string }> {
        const params = this.getCallbackParams()
        const wechatStore = useWechatStore()

        // 存储必要参数
        wechatStore.setSSOParams({
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
            password: "newpassword",
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
                    `[wechatSSOService] NocoBase token 获取失败 (${response.status}) ${url} ${errorText}`.trim()
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
                console.warn('[wechatSSOService] NocoBase token 响应为空')
                return null
            }

            const session: WechatNocobaseSession = { token: nocobaseToken }
            wechatStore.setNocobaseSession(authScope, session)
            console.log(`[wechatSSOService] 成功获取 NocoBase token (scope: ${authScope}):`, session)
            return session
        } catch (err) {
            console.warn('[wechatSSOService] NocoBase token 获取错误', err)
            return null
        }
    }
}
