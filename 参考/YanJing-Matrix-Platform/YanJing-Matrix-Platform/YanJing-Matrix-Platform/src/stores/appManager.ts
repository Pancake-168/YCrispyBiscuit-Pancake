import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getSetting, setSetting } from '@/utils/storage'
import type { FunctionListMode} from '@/types/UserConfig'


/**
 * 全局加载状态与主题管理
 */


export const useAppManagerStore = defineStore('ManagerApp', () => {
    // 全局加载状态
    const isLoading = ref(false)
    // 全局加载状态时的加载文案
    const loadingText = ref('加载中...')

    // 全局主题切换
    const theme = ref<'dark' | 'light'>('dark')
    const functionListMode = ref<FunctionListMode>('fixed')
    const functionListCollapsed = ref(false)

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
       
    }

    async function setFunctionListMode(mode: FunctionListMode) {
        functionListMode.value = mode
        if (mode === 'drawer') {
            functionListCollapsed.value = false
        }
    }

    async function setFunctionListCollapsed(collapsed: boolean) {
        if (functionListMode.value !== 'fixed') {
            return
        }
        functionListCollapsed.value = collapsed
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
        setLoading,
        toggleTheme,
        setTheme,
        initTheme,
        setFunctionListMode,
        setFunctionListCollapsed,
       
    }
})


