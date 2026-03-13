import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getSetting, setSetting } from '@/utils/storage'
import { SystemStorageManager } from '@/utils/SystemStorage'
import type { FunctionListMode, UserConfig } from '@/types/UserConfig'
import { UpdateUserConfig } from '@/services/Project/UserConfig'


/**
 * 全局加载状态与主题管理
 */


export const useAppStore = defineStore('app', () => {
    // 全局加载状态
    const isLoading = ref(false)
    // 全局加载状态时的加载文案
    const loadingText = ref('加载中...')

    // 全局主题切换
    const theme = ref<'dark' | 'light'>('dark')
    const functionListMode = ref<FunctionListMode>('fixed')
    const functionListCollapsed = ref(false)
    const notificationSoundEnabled = ref(false)

    // 设置加载状态
    function setLoading(loading: boolean, text?: string) {
        isLoading.value = loading
        if (text !== undefined) {
            loadingText.value = text
        }
    }
    
    // 更新DOM的data-theme属性
    function updateThemeAttribute() {
        if (typeof document !== 'undefined') {
            document.documentElement.setAttribute('data-theme', theme.value)
        }
    }

    // 切换主题
    async function toggleTheme() {
        theme.value = theme.value === 'dark' ? 'light' : 'dark'
        updateThemeAttribute()
        await setSetting('theme', theme.value)
    }

    // 设置特定主题
    async function setTheme(newTheme: 'dark' | 'light') {
        theme.value = newTheme
        updateThemeAttribute()
        await setSetting('theme', newTheme)
        try {
            const localConfig = await SystemStorageManager.getUserConfig<UserConfig>()
            const nextConfig: UserConfig = { ...(localConfig ?? {}), theme: newTheme }
            await SystemStorageManager.setUserConfig(nextConfig)
            await UpdateUserConfig(nextConfig)
        } catch {
            // ignore
        }
    }

    async function setFunctionListMode(mode: FunctionListMode) {
        functionListMode.value = mode
        if (mode === 'drawer') {
            functionListCollapsed.value = false
        }

        try {
            const localConfig = await SystemStorageManager.getUserConfig<UserConfig>()
            const nextConfig: UserConfig = {
                ...(localConfig ?? {}),
                functionListMode: mode,
                functionListCollapsed: mode === 'drawer' ? false : functionListCollapsed.value
            }
            await SystemStorageManager.setUserConfig(nextConfig)
            await UpdateUserConfig(nextConfig)
        } catch {
            // ignore
        }
    }

    async function setFunctionListCollapsed(collapsed: boolean) {
        if (functionListMode.value !== 'fixed') {
            return
        }
        functionListCollapsed.value = collapsed

        try {
            const localConfig = await SystemStorageManager.getUserConfig<UserConfig>()
            const nextConfig: UserConfig = {
                ...(localConfig ?? {}),
                functionListMode: functionListMode.value,
                functionListCollapsed: collapsed
            }
            await SystemStorageManager.setUserConfig(nextConfig)
            await UpdateUserConfig(nextConfig)
        } catch {
            // ignore
        }
    }

    function applyFunctionListConfig(config?: UserConfig | null) {
        if (config?.functionListMode === 'drawer' || config?.functionListMode === 'fixed') {
            functionListMode.value = config.functionListMode
        }
        if (typeof config?.functionListCollapsed === 'boolean') {
            functionListCollapsed.value = config.functionListCollapsed
        }
        if (functionListMode.value === 'drawer') {
            functionListCollapsed.value = false
        }
    }

    async function setNotificationSoundEnabled(enabled: boolean) {
        notificationSoundEnabled.value = enabled

        try {
            const localConfig = await SystemStorageManager.getUserConfig<UserConfig>()
            const nextConfig: UserConfig = {
                ...(localConfig ?? {}),
                notificationSoundEnabled: enabled,
            }
            await SystemStorageManager.setUserConfig(nextConfig)
            await UpdateUserConfig(nextConfig)
        } catch {
            // ignore
        }
    }

    function applyNotificationSoundConfig(config?: UserConfig | null) {
        if (typeof config?.notificationSoundEnabled === 'boolean') {
            notificationSoundEnabled.value = config.notificationSoundEnabled
            return
        }

        notificationSoundEnabled.value = true
    }

    // 初始化主题
    async function initTheme() {
        try {
            const saved = await getSetting('theme')
            if (saved === 'dark' || saved === 'light') {
                theme.value = saved
            }
        } catch {
            // ignore
        }
        updateThemeAttribute()
    }

    return {
        isLoading,
        loadingText,
        theme,
        functionListMode,
        functionListCollapsed,
        notificationSoundEnabled,
        setLoading,
        toggleTheme,
        setTheme,
        initTheme,
        setFunctionListMode,
        setFunctionListCollapsed,
        setNotificationSoundEnabled,
        applyFunctionListConfig,
        applyNotificationSoundConfig
    }
})


