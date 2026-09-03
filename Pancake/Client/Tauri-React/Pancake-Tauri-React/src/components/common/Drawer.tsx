import type { CSSProperties, ReactNode } from 'react';
import Dialog from './Dialog';
import styles from './Drawer.module.css';

type DrawerSide = 'left' | 'right' | 'top' | 'bottom';

interface DrawerProps {
  trigger?: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  title?: ReactNode;
  children: ReactNode;
  side?: DrawerSide;
  size?: number | string;
}

/**
 * Drawer — 从屏幕边缘滑出的抽屉面板。
 * 基于公共 Dialog 封装，保证焦点锁定、Esc 关闭等可访问性行为。
 */
export default function Drawer({
  trigger,
  open,
  onOpenChange,
  title,
  children,
  side = 'right',
  size = 320,
}: DrawerProps) {
  const sideClass =
    side === 'left'
      ? styles.sideLeft
      : side === 'top'
        ? styles.sideTop
        : side === 'bottom'
          ? styles.sideBottom
          : styles.sideRight;

  const sizeStyle: CSSProperties =
    side === 'top' || side === 'bottom'
      ? { height: size, width: '100%' }
      : { width: size, maxWidth: '100vw', height: '100%' };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      trigger={trigger}
      overlayClassName={styles.overlay}
      contentClassName={`${styles.content} ${sideClass}`}
      contentStyle={sizeStyle}
      bodyClassName={styles.body}
      hideTitle
      bareContent
      bareBody
    >
      {title && <div className={styles.header}>{title}</div>}
      {children}
    </Dialog>
  );
}

export type { DrawerSide, DrawerProps };
