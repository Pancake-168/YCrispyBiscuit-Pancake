import { APIClient } from '@nocobase/sdk'
import { useWechatStore } from '@/stores/wechat'

// 默认的基础 API 路径 (电话局/总台)
const ROOT_BASE_URL = '/nocobase-proxy/api/'


class NocoBaseService {
    private static instance: NocoBaseService
    public client: APIClient

    private constructor() {
        console.log(`[NocoBase] 初始化SDK客户端...`)

        // 初始化单一客户端实例，始终指向 Root API
        // 就像你说的，这是“进门”，必须先连上总台
        this.client = new APIClient({
            baseURL: ROOT_BASE_URL,
            storageType: 'localStorage',
            storagePrefix: 'NOCOBASE_',
        })

        // 临时硬编码 Token (假设这是 Root Admin 的 Token)
        const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEwLCJqdGkiOiI5YmJiNTBhOS02NWU3LTQzMjktOTcwMy00NGQyOWZiZjc0MTYiLCJzaWduSW5UaW1lIjoxNzY3NzUyNjExMDAwLCJ0ZW1wIjp0cnVlLCJleHAiOjE3Njc3NTM4MTEsImlhdCI6MTc2Nzc1MjYxMX0.Z5mxIWeQzDSnvg645jLUQNUgFxM--WRxyrBj5G8dTQ4'
        


        this.client.auth.setToken(token)
    }

    public static getInstance(): NocoBaseService {
        if (!NocoBaseService.instance) {
            NocoBaseService.instance = new NocoBaseService()
        }
        return NocoBaseService.instance
    }

    /**
     * 使用 Token 直接登录
     */
    public async loginWithToken(token: string) {
        this.client.auth.setToken(token)
        try {
            await this.client.resource('users').get({ filterByTk: 'me' })
            return true
        } catch (error) {
            console.error('NocoBase Token validation failed:', error)
            return false
        }
    }

    public async login(values: any) {
        return await this.client.auth.signIn(values)
    }

    public async logout() {
        return await this.client.auth.signOut()
    }
}

export const nocoBaseService = NocoBaseService.getInstance()
export const nocoClient = nocoBaseService.client
