import type { UserConfig } from '@/types/UserConfig'

import { SystemStorageManager } from '@/utils/SystemStorage'
import { API_URLS } from '@/apiUrls'
import { useWechatStore } from '@/stores/WeChat'


type UserConfigApiEnvelope = {
    config?: UserConfig
}

function normalizeUserConfigPayload(payload: unknown): UserConfig | null {
    if (!payload || typeof payload !== 'object') return null

    const raw = payload as Record<string, unknown>
    const nested = raw.config

    if (nested && typeof nested === 'object' && !Array.isArray(nested)) {
        return nested as UserConfig
    }

    // 兼容历史后端直接返回平铺对象
    return raw as UserConfig
}




export async function GetUserConfig(): Promise<UserConfig | null> {


    const wechatStore = useWechatStore();
    const token = wechatStore.ssoParams.loginToken || await SystemStorageManager.getLoginToken() || '';

    if (!token) {
        console.log('[System:UserConfig:GetUserConfig] 没有 SSO loginToken，无法获取用户配置')
        return null
    }



    // 从服务器获取用户配置
    try {
        const response = await fetch(API_URLS.GetUserConfig(), {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        })
        if (response.ok) {
            console.log('[System:UserConfig:GetUserConfig] 成功获取用户配置', response)
            const data: unknown = await response.json()
            const normalized = normalizeUserConfigPayload(data)
            return normalized
        }
    } catch (error) {
        console.warn('[System:UserConfig:GetUserConfig]', error)
    }

    return null

}






export async function UpdateUserConfig(config: UserConfig): Promise<boolean> {


    const wechatStore = useWechatStore();
    const token = wechatStore.ssoParams.loginToken || await SystemStorageManager.getLoginToken() || '';

    if (!token) {
        console.log('[System:UserConfig:UpdateUserConfig] 没有 SSO loginToken，无法更新用户配置')
        return false
    }



    // 向服务器更新用户配置
    try {
        const response = await fetch(API_URLS.UpdateUserConfig(), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ config } as UserConfigApiEnvelope)
        })
        return response.ok
    } catch (error) {
        console.warn('[System:UserConfig:UpdateUserConfig]', error)
    }

    return false

}








export async function StartApplyUserConfig(): Promise<void> {



    const config = await GetUserConfig()

    if (config) {

        console.log('[System:UserConfig:StartApplyUserConfig] 获取到用户配置，正在应用中...', config)
        // 1.将数据写进本地存储中
        await SystemStorageManager.setUserConfig(config)



    }




}
