import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

export type AppTheme = 'soft-pink' | 'soft-blue'
export type AppLanguage = 'zh-CN' | 'en-US'

type PersistedAppState = {
  sidebarCollapsed?: boolean
  theme?: string
  language?: AppLanguage
}

function normalizeTheme(theme?: string): AppTheme {
  if (theme === 'soft-pink' || theme === 'soft-blue') {
    return theme
  }

  if (theme === 'github-light') {
    return 'soft-blue'
  }

  if (theme === 'vscode-dark') {
    return 'soft-pink'
  }

  return 'soft-pink'
}

type AppStore = {
  sidebarCollapsed: boolean
  theme: AppTheme
  language: AppLanguage
  toggleSidebar: () => void
  setTheme: (theme: AppTheme) => void
  setLanguage: (language: AppLanguage) => void
}

export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      theme: 'soft-pink',
      language: 'zh-CN',
      toggleSidebar: () => {
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed }))
      },
      setTheme: (theme) => {
        set({ theme })
      },
      setLanguage: (language) => {
        set({ language })
      },
    }),
    {
      name: 'pancake-app-store',
      version: 2,
      storage: createJSONStorage(() => localStorage),
      migrate: (persistedState) => {
        const state = persistedState as PersistedAppState

        return {
          sidebarCollapsed: state.sidebarCollapsed ?? false,
          theme: normalizeTheme(state.theme),
          language: state.language ?? 'zh-CN',
        }
      },
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        theme: state.theme,
        language: state.language,
      }),
    },
  ),
)