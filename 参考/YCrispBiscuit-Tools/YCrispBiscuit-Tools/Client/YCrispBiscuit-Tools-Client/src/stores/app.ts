import { defineStore } from 'pinia'
import { ref, watchEffect } from 'vue'

type ThemeMode = 'light' | 'dark' | 'system'

export const useAppStore = defineStore('app', () => {
  // 全局加载状态
  const isLoading = ref(false)
  
  // 侧边栏折叠状态
  const isSidebarCollapsed = ref(false)

  // 主题模式
  const theme = ref<ThemeMode>(
    (localStorage.getItem('theme') as ThemeMode) || 'light'
  )
  const isDark = ref(false)

  // 检测系统主题
  const systemDark = window.matchMedia('(prefers-color-scheme: dark)')
  
  // 应用主题
  const applyTheme = () => {
    const darkMode = theme.value === 'system' 
      ? systemDark.matches 
      : theme.value === 'dark'
    
    isDark.value = darkMode
    document.documentElement.setAttribute(
      'data-theme', 
      darkMode ? 'dark' : 'light'
    )
    document.documentElement.classList.add('theme-transition')
  }

  // 切换主题
  const toggleTheme = (mode?: ThemeMode) => {
    if (mode) {
      theme.value = mode
    } else {
      theme.value = theme.value === 'light' ? 'dark' : 'light'
    }
    localStorage.setItem('theme', theme.value)
    applyTheme()
  }

  // 监听系统主题变化
  systemDark.addEventListener('change', applyTheme)
  
  // 初始化主题
  watchEffect(applyTheme)

  const setLoading = (loading: boolean) => {
    isLoading.value = loading
  }

  return {
    isLoading,
    isSidebarCollapsed,
    theme,
    isDark,
    setLoading,
    toggleTheme
  }
})