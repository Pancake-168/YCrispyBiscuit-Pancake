import { Link, useLocation } from 'react-router-dom';
import { Input } from '@/components/common';
import { useWebEmbedStore, DEFAULT_URL } from '@/stores/webEmbed.store';
import styles from './RouterBar.module.css';

export default function RouterBar() {
  // 当前路由路径，用于判断是否显示内嵌页专属的地址输入
  const { pathname } = useLocation();
  // 内嵌页地址状态：与 WebEmbedPage 共用同一份 store，两处输入保持同步
  const urlInput = useWebEmbedStore((s) => s.urlInput);
  const setUrlInput = useWebEmbedStore((s) => s.setUrlInput);
  const applyUrl = useWebEmbedStore((s) => s.applyUrl);

  return (
    <nav className="app-nav">
      <Link to="/">首页</Link>
      {/* 内嵌页专属地址输入：位于导航栏右侧，仅桌面宽度显示（窄屏回落到页面内工具栏） */}
      {pathname === '/web_embed' && (
        <div className={styles.navAddress}>
          {/* 标签与输入框同一行，文字不换行 */}
          <span className={styles.navLabel}>页面地址</span>
          <Input
            className={styles.navInput}
            value={urlInput}
            onChange={setUrlInput}
            placeholder={DEFAULT_URL}
            spellCheck={false}
            onKeyDown={(e) => {
              // 回车确认：立即应用当前输入
              if (e.key === 'Enter') {
                applyUrl();
              }
            }}
            onBlur={applyUrl}
          />
        </div>
      )}
    </nav>
  );
}
