import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getSetting, setSetting } from '@/utils/storage'


export const useAppStore = defineStore('app', () => {
    // 全局加载状态
    const isLoading = ref(false)

    // 全局主题切换
    const theme = ref<'dark' | 'light'>('dark')

    // 设置加载状态
    function setLoading(loading: boolean) {
        isLoading.value = loading
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
        theme,
        setLoading,
        toggleTheme,
        setTheme,
        initTheme
    }
})


