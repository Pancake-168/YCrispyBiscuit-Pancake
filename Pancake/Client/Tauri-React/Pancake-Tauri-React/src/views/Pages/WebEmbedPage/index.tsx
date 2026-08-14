import { useEffect } from 'react';
import { listen, type UnlistenFn } from '@tauri-apps/api/event';
import { Input, toast } from '@/components/common';
import { isTauri } from '@/utils/isTauri';
import { useWebEmbedStore, DEFAULT_URL } from '@/stores/webEmbed.store';
import styles from './index.module.css';

/** WebEmbedPage — 内嵌网页页面。
 * 桌面宽度时地址输入位于顶部导航栏右侧（RouterBar），窄屏时回落到本页顶部工具栏。
 * 内嵌页面发起的下载由 Rust 侧拦截到指定目录，本页监听事件并以 Toast 告知用户。 */
export default function WebEmbedPage() {
  // 输入框与生效地址：与导航栏（RouterBar）共用同一份 store
  const urlInput = useWebEmbedStore((s) => s.urlInput);
  const setUrlInput = useWebEmbedStore((s) => s.setUrlInput);
  const appliedUrl = useWebEmbedStore((s) => s.appliedUrl);
  const applyUrl = useWebEmbedStore((s) => s.applyUrl);

  // 监听下载事件：Rust 侧拦截下载后发出开始/结束事件，这里用 Toast 告知用户文件状况
  useEffect(() => {
    // 非 Tauri 环境（纯浏览器 dev）没有事件通道，直接跳过
    if (!isTauri()) return;
    // disposed 标记：组件卸载后到达的注册结果不再挂接
    let disposed = false;
    // 收集反注册函数，组件卸载时统一解绑
    const unlisteners: UnlistenFn[] = [];
    // 下载开始事件：提示文件名
    void listen<{ url: string; filename: string }>('pancake-download-started', (e) => {
      toast(`开始下载: ${e.payload.filename}`, 'info');
    }).then((un) => {
      if (disposed) un();
      else unlisteners.push(un);
    });
    // 下载结束事件：提示真实落盘路径或失败
    void listen<{ url: string; path: string | null; success: boolean }>(
      'pancake-download-finished',
      (e) => {
        if (e.payload.success && e.payload.path) {
          // 路径较长，延长展示时间便于查看
          toast({ message: `下载完成: ${e.payload.path}`, variant: 'success', duration: 8000 });
        } else {
          toast('下载失败', 'error');
        }
      },
    ).then((un) => {
      if (disposed) un();
      else unlisteners.push(un);
    });
    return () => {
      // 卸载清理：标记 disposed 并解绑全部监听
      disposed = true;
      unlisteners.forEach((un) => un());
    };
  }, []);

  return (
    // 页面容器：纵向布局占满 app-content 全高
    <div className={styles.page}>
      {/* 窄屏工具栏：桌面宽度由 CSS 隐藏，此时地址输入显示在导航栏右侧 */}
      <div className={styles.toolbar}>
        <Input
          className={styles.urlField}
          label="页面地址"
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
      {/* iframe 本体：加载已应用地址，无 sandbox 以便内页正常使用自身存储 */}
      <iframe className={styles.frame} src={appliedUrl} title="AI 助手" allow="clipboard-write" />
    </div>
  );
}
