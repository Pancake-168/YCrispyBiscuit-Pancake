import {
    APIClient
} from '@nocobase/sdk'



class NocoBaseService {

    // 基础客户端实例（未认证）
    private NoAuthenticatedClient: APIClient | null = null

    // 已认证客户端实例
    private AuthenticatedClient: APIClient | null = null

    // 已认证客户端的 baseURL
    private AuthedBaseURL: string | null = null

    // 创建客户端（传入 token、服务器地址）
    createClient(token: string, serverUrl: string): APIClient {
        let finalServerUrl = serverUrl.trim()
        if (finalServerUrl.startsWith('/')) {
            // 相对路径代理，保持原样
        } else if (!finalServerUrl.startsWith('http://') && !finalServerUrl.startsWith('https://')) {
            finalServerUrl = `https://${finalServerUrl}`
        }

        this.NoAuthenticatedClient = new APIClient({
            baseURL: finalServerUrl,
        })

        this.AuthenticatedClient = this.NoAuthenticatedClient
        this.AuthenticatedClient.auth.setToken(token)
        this.AuthedBaseURL = finalServerUrl

        return this.AuthenticatedClient
    }

    // 获取基础客户端
    getNoAuthedClient(): APIClient | null {
        if (!this.NoAuthenticatedClient) {
            console.warn('[System:NocoBaseService:getNoAuthedClient] 尚未初始化基础客户端')
            return null
        }
        return this.NoAuthenticatedClient
    }

    // 设置已认证客户端
    setAuthedClient(client: APIClient) {
        this.AuthenticatedClient = client
        const maybeBaseURL = (client as any)?.axios?.defaults?.baseURL || (client as any)?.baseURL
        this.AuthedBaseURL = typeof maybeBaseURL === 'string' ? maybeBaseURL : this.AuthedBaseURL
    }

    // 获取已认证客户端
    getAuthedClient(): APIClient | null {
        if (!this.AuthenticatedClient) {
            console.warn('[System:NocoBaseService:getAuthedClient] 尚未初始化已认证客户端')
            return null
        }
        return this.AuthenticatedClient
    }

    // 清理已认证客户端
    clearAuthedClient() {
        this.AuthenticatedClient = null
        this.NoAuthenticatedClient = null
        this.AuthedBaseURL = null
    }




    // 返回已认证客户端的token
    getAuthedToken(): string | null {
        if (!this.AuthenticatedClient) {
            console.warn('[System:NocoBaseService:getAuthedToken] 尚未初始化已认证客户端')
            return null
        }

        const token = this.AuthenticatedClient.auth.getToken?.() || this.AuthenticatedClient.auth.token
        if (!token) {
            console.warn('[System:NocoBaseService:getAuthedToken] 当前已认证客户端中未找到token')
            return null
        }

        return token
    }

    // 返回已认证客户端 baseURL
    getAuthedBaseURL(): string | null {
        if (!this.AuthedBaseURL) {
            const fallback = (this.AuthenticatedClient as any)?.axios?.defaults?.baseURL || (this.AuthenticatedClient as any)?.baseURL
            if (typeof fallback === 'string' && fallback.trim()) {
                this.AuthedBaseURL = fallback.trim()
            }
        }

        if (!this.AuthedBaseURL) {
            console.warn('[System:NocoBaseService:getAuthedBaseURL] 当前未记录已认证 baseURL')
            return null
        }

        return this.AuthedBaseURL
    }
 
}


export default NocoBaseService

export const nocoBaseService = new NocoBaseService()
