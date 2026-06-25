import { useState, useEffect, useCallback, useRef } from 'react';
import { getCurrentWindow } from '@tauri-apps/api/window';
import type { Window } from '@tauri-apps/api/window';
import { useThemeStore } from '@/stores/theme.store';
import {
  VscChromeMinimize,
  VscChromeMaximize,
  VscChromeRestore,
  VscChromeClose,
} from 'react-icons/vsc';
import { MdDarkMode, MdLightMode } from 'react-icons/md';

export default function TauriBar() {
  const [maximized, setMaximized] = useState(false);
  const appWindowRef = useRef<Window | null>(null);

  useEffect(() => {
    // 组件挂载后才获取窗口引用（确保 Tauri API 已初始化）
    const appWindow = getCurrentWindow();
    appWindowRef.current = appWindow;

    appWindow.isMaximized().then(setMaximized);

    const unlisten = appWindow.onResized(() => {
      appWindow.isMaximized().then(setMaximized);
    });

    return () => {
      unlisten.then((fn) => fn());
    };
  }, []);

  const theme = useThemeStore((s) => s.theme);
  const toggleTheme = useThemeStore((s) => s.toggleTheme);

  const minimize = useCallback(() => appWindowRef.current?.minimize(), []);
  const toggleMaximize = useCallback(() => appWindowRef.current?.toggleMaximize(), []);
  const close = useCallback(() => appWindowRef.current?.close(), []);

  return (
    <header className="titlebar">
      {/* 左侧：图标 + 标题 */}
      <span className="titlebar-drag">
        <img src="/2.png" alt="" />
        <span>Pancake</span>
      </span>

      {/* 中间：拖拽区域 */}
      <span className="titlebar-drag" />

      {/* 右侧：主题切换 + 窗口控制按钮 */}
      <button onClick={toggleTheme} className="titlebar-btn" title="切换主题">
        {theme === "dark" ? <MdLightMode size={16} /> : <MdDarkMode size={16} />}
      </button>
      <button onClick={minimize} className="titlebar-btn" title="最小化">
        <VscChromeMinimize size={14} />
      </button>
      <button
        onClick={toggleMaximize}
        className="titlebar-btn"
        title={maximized ? '还原' : '最大化'}
      >
        {maximized ? <VscChromeRestore size={14} /> : <VscChromeMaximize size={14} />}
      </button>
      <button onClick={close} className="titlebar-btn titlebar-btn-close" title="关闭">
        <VscChromeClose size={14} />
      </button>
    </header>
  );
}
