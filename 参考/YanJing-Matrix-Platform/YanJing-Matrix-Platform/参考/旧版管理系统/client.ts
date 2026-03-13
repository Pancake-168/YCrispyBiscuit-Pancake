import { APIClient } from '@nocobase/sdk'

const NOCOBASE_BASE_URL = '/nocobase-proxy/api'

class NocobaseService {
    private noAuthenticatedClient: APIClient | null = null
    private authenticatedClient: APIClient | null = null
    private baseURL: string = NOCOBASE_BASE_URL

    public constructor() {
        this.createNoAuthenticatedClient(this.baseURL)
    }

    public createNoAuthenticatedClient(baseURL: string): APIClient {
        this.baseURL = baseURL
        this.noAuthenticatedClient = new APIClient({
            baseURL: baseURL
        })
        this.authenticatedClient = null
        return this.noAuthenticatedClient
    }

    public setToken(token: string): APIClient {
        if (!this.noAuthenticatedClient) {
            this.createNoAuthenticatedClient(this.baseURL)
        }
        this.noAuthenticatedClient!.auth.setToken(token)
        this.authenticatedClient = this.noAuthenticatedClient
        return this.authenticatedClient!
    }

    public getAuthedClient(): APIClient | null {
        if (!this.authenticatedClient) {
            console.warn('[System:NocobaseClient:getAuthedClient] 尚未设置 token 或客户端未初始化')
            return null
        }
        return this.authenticatedClient
    }

    private getResourceAction(table: string, action: 'list' | 'get') {
        const client = this.getAuthedClient()
        if (!client) {
            throw new Error('NocoBase 客户端未认证，请先调用 setToken')
        }
        const resource = client.resource(table) as Record<string, (params?: unknown) => Promise<unknown>>
        const actionFn = resource[action]
        if (!actionFn) {
            throw new Error(`NocoBase 资源动作不存在: ${table}:${action}`)
        }
        return actionFn
    }

    public listTable(table: string, pageSize = 20) {
        return this.getResourceAction(table, 'list')({ pageSize })
    }

    public getRow(table: string, id: number | string) {
        return this.getResourceAction(table, 'get')({ filterByTk: id })
    }
}

export const nocobaseService = new NocobaseService()