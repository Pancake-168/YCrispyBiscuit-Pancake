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
import styles from './TauriBar.module.css';

const isTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;

export default function TauriBar() {
  const [maximized, setMaximized] = useState(false);
  const appWindowRef = useRef<Window | null>(null);

  useEffect(() => {
    if (!isTauri) return;
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

  if (!isTauri) return null;

  return (
    <header className={styles.bar}>
      <span className={styles.left}>
        <img className={styles.logo} src="/2.png" alt="" />
        <span className={styles.title}>Pancake</span>
      </span>

      <span className={styles.spacer} />

      <button onClick={toggleTheme} className={styles.btn} title="切换主题">
        {theme === 'dark' ? <MdLightMode size={16} /> : <MdDarkMode size={16} />}
      </button>
      <button onClick={minimize} className={styles.btn} title="最小化">
        <VscChromeMinimize size={14} />
      </button>
      <button onClick={toggleMaximize} className={styles.btn} title={maximized ? '还原' : '最大化'}>
        {maximized ? <VscChromeRestore size={14} /> : <VscChromeMaximize size={14} />}
      </button>
      <button onClick={close} className={`${styles.btn} ${styles.btnClose}`} title="关闭">
        <VscChromeClose size={14} />
      </button>
    </header>
  );
}
