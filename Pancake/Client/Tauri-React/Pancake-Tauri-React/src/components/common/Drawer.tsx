import type { CSSProperties, ReactNode } from 'react';
import * as RadixDialog from '@radix-ui/react-dialog';
import { VscClose } from 'react-icons/vsc';
import Button from './Button';
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
 * 底层使用 Radix Dialog，保证焦点锁定、Esc 关闭等可访问性行为。
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

  // 横边控制 width，竖边控制 height
  const sizeStyle: CSSProperties =
    side === 'top' || side === 'bottom'
      ? { height: size, width: '100%' }
      : { width: size, maxWidth: '100vw', height: '100%' };

  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      {trigger && <RadixDialog.Trigger asChild>{trigger}</RadixDialog.Trigger>}
      <RadixDialog.Portal>
        <RadixDialog.Overlay className={styles.overlay} />
        <RadixDialog.Content className={`${styles.content} ${sideClass}`} style={sizeStyle}>
          {title && <div className={styles.header}>{title}</div>}
          <div className={styles.body}>{children}</div>
          <RadixDialog.Close asChild>
            <Button
              variant="subtle"
              className="icon-btn"
              aria-label="关闭抽屉"
              style={{ position: 'absolute', top: 'var(--spacing-md)', right: 'var(--spacing-md)' }}
            >
              <VscClose size={16} />
            </Button>
          </RadixDialog.Close>
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}

export type { DrawerSide, DrawerProps };
