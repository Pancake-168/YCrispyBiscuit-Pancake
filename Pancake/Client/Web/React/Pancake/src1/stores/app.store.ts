import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

/**
 * APP设置
 * 包括但不限于：
 * - 主题
 * - 语言
 * - 桌面窗口尺寸
 * - 桌面字体以及字体大小
 */

export type AppTheme = "soft-pink" | "soft-blue";
export type AppLanguage = "zh-CN" | "en-US";

// 窗口大小，单位为像素
export type AppWindowsSize = [number, number];
export type AppFont = "system";
export type AppFontSize = number;

type PersistedAppState = {
  theme?: string;
  language?: AppLanguage;
  windowSize?: AppWindowsSize;
  font?: AppFont;
  fontSize?: AppFontSize;
};

function normalizeTheme(theme?: string): AppTheme {
  if (theme === "soft-pink" || theme === "soft-blue") {
    return theme;
  }

  if (theme === "github-light") {
    return "soft-blue";
  }

  if (theme === "vscode-dark") {
    return "soft-pink";
  }

  return "soft-pink";
}

type AppStore = {
  theme: AppTheme;
  language: AppLanguage;
  windowSize: AppWindowsSize;
  font: AppFont;
  fontSize: AppFontSize;

  setTheme: (theme: AppTheme) => void;
  setLanguage: (language: AppLanguage) => void;
  setWindowSize: (size: AppWindowsSize) => void;
  setFont: (font: AppFont) => void;
  setFontSize: (size: AppFontSize) => void;
};

export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      theme: "soft-pink",
      language: "zh-CN",
      windowSize: [1200, 800],
      font: "system",
      fontSize: 14,
      setTheme: (theme) => {
        set({ theme });
      },
      setLanguage: (language) => {
        set({ language });
      },
      setWindowSize: (windowSize) => {
        set({ windowSize });
      },
      setFont: (font) => {
        set({ font });
      },
      setFontSize: (fontSize) => {
        set({ fontSize });
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
          language: state.language ?? "zh-CN",
          windowSize: state.windowSize ?? [1200, 800],
          font: state.font ?? "system",
          fontSize: state.fontSize ?? 14,
        };
      },
      partialize: (state) => ({
        theme: state.theme,
        language: state.language,
        windowSize: state.windowSize,
        font: state.font,
        fontSize: state.fontSize,
      }),
    },
  ),
);
