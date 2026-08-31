import { create } from 'zustand';

/** DeepSeek Harness 本地代理地址：由 Pancake 后端启动，用于解决 SameSite=Strict 跨站 iframe 401 */
export const DSH_PROXY_BASE =
  (import.meta.env.VITE_DSH_PROXY_BASE as string | undefined) ?? 'http://127.0.0.1:3081';

/** DeepSeek Harness 原生地址：用户直接填这个地址时自动替换成上面的本地代理 */
const DSH_UPSTREAM_BASE = 'http://127.0.0.1:3080';

/** 内嵌页未输入任何地址时使用的默认地址 */
export const DEFAULT_URL = DSH_PROXY_BASE;

/** 若用户输入了没有协议前缀的地址（如 127.0.0.1:3080），自动补上 http://，
 *  避免被 iframe 当作相对路径解析成 http://tauri.localhost/127.0.0.1:3080 */
const normalizeEmbedUrl = (raw: string): string => {
  const trimmed = raw.trim();
  if (!trimmed) return DEFAULT_URL;
  const withProtocol = /^[a-z][a-z\d+.-]*:\/\//i.test(trimmed) ? trimmed : `http://${trimmed}`;
  // 用户若直接粘贴 deepseek-harness 原生 3080 地址，保持路径与查询参数不变，仅替换为本地代理
  if (withProtocol.startsWith(DSH_UPSTREAM_BASE)) {
    return DSH_PROXY_BASE + withProtocol.slice(DSH_UPSTREAM_BASE.length);
  }
  return withProtocol;
};

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
  // 应用输入：去首尾空格、自动补协议；为空则回落默认地址
  applyUrl: () => {
    set({ appliedUrl: normalizeEmbedUrl(get().urlInput) });
  },
}));
