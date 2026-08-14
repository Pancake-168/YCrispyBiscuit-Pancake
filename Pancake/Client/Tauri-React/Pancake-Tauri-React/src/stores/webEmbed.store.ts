import { create } from 'zustand';

/** 内嵌页未输入任何地址时使用的默认地址 */
export const DEFAULT_URL = 'http://127.0.0.1:3080';

interface WebEmbedState {
  /** 输入框内的原始内容，为空表示使用默认地址 */
  urlInput: string;
  /** 当前真正加载进 iframe 的地址 */
  appliedUrl: string;
  /** 更新输入框内容（仅改输入，不触发加载） */
  setUrlInput: (v: string) => void;
  /** 把输入应用到 iframe 地址（去首尾空格，为空回落默认地址） */
  applyUrl: () => void;
}

/** 内嵌页地址状态：导航栏（RouterBar）与 WebEmbedPage 共用，保证两处输入同步 */
export const useWebEmbedStore = create<WebEmbedState>((set, get) => ({
  // 初始输入为空，页面首屏即加载默认地址
  urlInput: '',
  appliedUrl: DEFAULT_URL,
  // 仅同步输入框内容，回车/失焦时才真正应用
  setUrlInput: (v) => set({ urlInput: v }),
  // 应用输入：去首尾空格，为空则回落默认地址
  applyUrl: () => {
    const trimmed = get().urlInput.trim();
    set({ appliedUrl: trimmed || DEFAULT_URL });
  },
}));
