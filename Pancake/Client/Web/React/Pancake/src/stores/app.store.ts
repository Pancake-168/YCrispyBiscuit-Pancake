import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { createLogger } from "@/utils/logger";

/**
 * APP设置
 * 包括但不限于：
 * - 主题

 */

export type AppTheme = "soft-pink" | "soft-blue";

const appStoreLogger = createLogger("stores/app.store.ts", "useAppStore");

type PersistedAppState = {
  theme?: string;
};

function normalizeTheme(theme?: string): AppTheme {
  if (theme === "soft-pink" || theme === "soft-blue") {
    return theme;
  }

  // 如果存储的主题无效，返回默认主题
  if (theme) {
    appStoreLogger.warn("发现无效主题配置，已回退默认主题", theme);
  }
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
        appStoreLogger.info("更新主题", theme);
        set({ theme });
      },
    }),
    {
      name: "pancake-app-store",
      version: 3,
      storage: createJSONStorage(() => localStorage),
      migrate: (persistedState) => {
        const state = persistedState as PersistedAppState;
        const normalizedTheme = normalizeTheme(state.theme);

        appStoreLogger.info("持久化配置迁移完成", {
          previousTheme: state.theme,
          nextTheme: normalizedTheme,
        });

        return {
          theme: normalizedTheme,
        };
      },
      partialize: (state) => ({
        theme: state.theme,
      }),
    },
  ),
);
