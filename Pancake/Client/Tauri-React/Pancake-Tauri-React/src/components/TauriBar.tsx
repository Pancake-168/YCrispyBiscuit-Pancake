import { useState, useEffect, useCallback, useRef } from 'react';
import { useIsHome } from '@/utils/isHomePage';
import type { Window } from '@tauri-apps/api/window';
import { useThemeStore } from '@/stores/theme.store';
import { IconContainer } from '@/components/common';
import styles from './TauriBar.module.css';
import { isTauri } from '@/utils/isTauri';
import { getIcon } from '@/icons';

export default function TauriBar() {
  const [maximized, setMaximized] = useState(false);
  const appWindowRef = useRef<Window | null>(null);

  const isHome = useIsHome();

  useEffect(() => {
    if (!isTauri()) return;
    import('@tauri-apps/api/window').then(({ getCurrentWindow }) => {
      const appWindow = getCurrentWindow();
      appWindowRef.current = appWindow;

      appWindow.isMaximized().then(setMaximized);

      appWindow.onResized(() => {
        appWindow.isMaximized().then(setMaximized);
      });
    });
  }, []);

  const theme = useThemeStore((s) => s.theme);
  const toggleTheme = useThemeStore((s) => s.toggleTheme);

  const minimize = useCallback(() => appWindowRef.current?.minimize(), []);
  const toggleMaximize = useCallback(() => appWindowRef.current?.toggleMaximize(), []);
  const close = useCallback(() => appWindowRef.current?.close(), []);

  if (!isTauri()) return null;

  return (
    <header className={styles.bar}>
      <span className={styles.left}>
        <IconContainer
          size={16}
          className={styles.logo}
          src={`${import.meta.env.BASE_URL}3.png`}
          alt=""
        />
        <span className={styles.title}>Pancake</span>
      </span>

      <span className={styles.spacer} />

      {!isHome && (
        <button onClick={toggleTheme} className={styles.btn} title="切换主题">
          {theme === 'dark' ? (
            <IconContainer size={16} src={getIcon('lightMode', 16)} />
          ) : (
            <IconContainer size={16} src={getIcon('darkMode', 16)} />
          )}
        </button>
      )}
      <button onClick={minimize} className={styles.btn} title="最小化">
        <IconContainer size={14} src={getIcon('chromeMinimize', 14)} />
      </button>
      <button onClick={toggleMaximize} className={styles.btn} title={maximized ? '还原' : '最大化'}>
        {maximized ? (
          <IconContainer size={14} src={getIcon('chromeRestore', 14)} />
        ) : (
          <IconContainer size={14} src={getIcon('chromeMaximize', 14)} />
        )}
      </button>
      <button onClick={close} className={`${styles.btn} ${styles.btnClose}`} title="关闭">
        <IconContainer size={14} src={getIcon('chromeClose', 14)} />
      </button>
    </header>
  );
}
