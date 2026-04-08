import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

/**
 * APP设置
 * 包括但不限于：
 * - 主题

 */

export type AppTheme = "soft-pink" | "soft-blue";




type PersistedAppState = {
  theme?: string;

};

function normalizeTheme(theme?: string): AppTheme {
  if (theme === "soft-pink" || theme === "soft-blue") {
    return theme;
  }

  // 如果存储的主题无效，返回默认主题
  return "soft-pink";
}

type AppStore = {
  theme: AppTheme;


  setTheme: (theme: AppTheme) => void;

};

export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      theme: "soft-pink",
      setTheme: (theme) => {
        set({ theme });
      },

    }),
    {
      name: "pancake-app-store",
      version: 3,
      storage: createJSONStorage(() => localStorage),
      migrate: (persistedState) => {
        const state = persistedState as PersistedAppState;

        return {
          theme: normalizeTheme(state.theme),

        };
      },
      partialize: (state) => ({
        theme: state.theme,

      }),
    },
  ),
);
