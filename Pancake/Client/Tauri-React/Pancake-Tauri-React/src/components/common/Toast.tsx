import { useCallback, useState, useEffect, type ReactNode } from 'react';
import * as RadixToast from '@radix-ui/react-toast';
import { VscClose } from 'react-icons/vsc';
import styles from './Toast.module.css';

type ToastVariant = 'success' | 'error' | 'warn' | 'info';

interface ToastAction {
  label: string;
  onClick: () => void;
}

interface ToastInstance {
  id: string;
  message: string;
  variant?: ToastVariant;
  duration?: number;
  action?: ToastAction;
}

// ---- 全局 Toast 状态管理 ----

let toastListeners: Array<(toast: ToastInstance) => void> = [];
let toastCounter = 0;

function notifyListeners(toast: ToastInstance) {
  for (const fn of toastListeners) {
    fn(toast);
  }
}

/**
 * 触发一条 Toast。可在组件外部直接调用。
 *
 * @example
 *   import { toast } from '@/components/common/Toast';
 *   toast('操作成功', 'success');
 *   toast({ message: '已删除', variant: 'error', action: { label: '撤销', onClick: undo } });
 */
function toast(messageOrConfig: string | Omit<ToastInstance, 'id'>, variant?: ToastVariant): void {
  const config =
    typeof messageOrConfig === 'string' ? { message: messageOrConfig, variant } : messageOrConfig;

  notifyListeners({
    id: `toast-${++toastCounter}`,
    variant: 'info',
    duration: 3000,
    ...config,
  });
}

// ---- Toast Provider 组件 ----

interface ToastProviderProps {
  children: ReactNode;
}

/**
 * ToastProvider — 包裹应用根节点，提供全局通知通道。
 * 使用方式：在 App.tsx 中 <ToastProvider><App /></ToastProvider>
 */
function ToastProvider({ children }: ToastProviderProps) {
  return (
    <RadixToast.Provider swipeDirection="right">
      {children}
      <ToastViewport />
    </RadixToast.Provider>
  );
}

// ---- 内部 Viewport（订阅全局事件） ----

function ToastViewport() {
  const [toasts, setToasts] = useState<ToastInstance[]>([]);

  useEffect(() => {
    const listener = (toast: ToastInstance) => {
      setToasts((prev) => [...prev, toast]);
    };
    toastListeners.push(listener);
    return () => {
      toastListeners = toastListeners.filter((fn) => fn !== listener);
    };
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <RadixToast.Viewport className={styles.viewport}>
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onRemove={removeToast} />
      ))}
    </RadixToast.Viewport>
  );
}

// ---- 单条 Toast ----

function ToastItem({
  toast: t,
  onRemove,
}: {
  toast: ToastInstance;
  onRemove: (id: string) => void;
}) {
  const pillClass = `pill ${t.variant ?? 'info'}`;

  return (
    <RadixToast.Root
      className={styles.root}
      duration={t.duration}
      onOpenChange={(open) => {
        if (!open) onRemove(t.id);
      }}
    >
      {/* 左边色点 — 复用全局 .pill 色值逻辑 */}
      <div
        className={pillClass}
        style={{ width: 8, height: 8, padding: 0, minWidth: 8, borderRadius: '50%' }}
      />
      <span className={styles.message}>{t.message}</span>
      {t.action && (
        <button className={styles.action} onClick={t.action.onClick}>
          {t.action.label}
        </button>
      )}
      <RadixToast.Close className={styles.close} aria-label="关闭">
        <VscClose size={14} />
      </RadixToast.Close>
    </RadixToast.Root>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export { toast, ToastProvider };
export type { ToastVariant, ToastInstance, ToastAction };
