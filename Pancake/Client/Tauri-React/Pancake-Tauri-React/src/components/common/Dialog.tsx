import type { ReactNode } from 'react';
import * as RadixDialog from '@radix-ui/react-dialog';
import { VscClose } from 'react-icons/vsc';
import styles from './Dialog.module.css';

interface DialogProps {
  trigger?: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
}

/**
 * Dialog — 通用弹窗。
 * Radix Dialog 做骨架，弹窗主体引用 .glass Token。
 * 内部可自由组合任意下层组件。
 */
export default function Dialog({
  trigger,
  open,
  onOpenChange,
  title,
  description,
  children,
}: DialogProps) {
  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      {trigger && (
        <RadixDialog.Trigger asChild>
          {trigger}
        </RadixDialog.Trigger>
      )}
      <RadixDialog.Portal>
        <RadixDialog.Overlay className={styles.overlay} />
        <RadixDialog.Content className={styles.content}>
          <RadixDialog.Title className={styles.title}>
            {title}
          </RadixDialog.Title>
          {description && (
            <RadixDialog.Description className={styles.description}>
              {description}
            </RadixDialog.Description>
          )}
          <div className={styles.body}>{children}</div>
          <RadixDialog.Close asChild>
            <button className="icon-btn" aria-label="关闭" style={{ position: 'absolute', top: 'var(--spacing-lg)', right: 'var(--spacing-lg)' }}>
              <VscClose size={16} />
            </button>
          </RadixDialog.Close>
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}
