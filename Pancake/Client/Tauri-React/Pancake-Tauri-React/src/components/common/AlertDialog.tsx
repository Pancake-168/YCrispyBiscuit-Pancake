import type { ReactNode } from 'react';
import * as RadixAlertDialog from '@radix-ui/react-alert-dialog';
import Button from './Button';
import styles from './Dialog.module.css';

interface AlertDialogProps {
  trigger?: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  title: string;
  description?: string;
  children?: ReactNode;
  cancelLabel?: string;
  actionLabel?: string;
  onCancel?: () => void;
  onAction?: () => void;
}

/**
 * AlertDialog — 需要用户明确确认的关键操作弹窗。
 * 视觉与 Dialog 一致，交互使用 Radix AlertDialog 的 Cancel/Action 语义。
 */
export default function AlertDialog({
  trigger,
  open,
  onOpenChange,
  title,
  description,
  children,
  cancelLabel = '取消',
  actionLabel = '确定',
  onCancel,
  onAction,
}: AlertDialogProps) {
  return (
    <RadixAlertDialog.Root open={open} onOpenChange={onOpenChange}>
      {trigger && <RadixAlertDialog.Trigger asChild>{trigger}</RadixAlertDialog.Trigger>}
      <RadixAlertDialog.Portal>
        <RadixAlertDialog.Overlay className={styles.overlay} />
        <RadixAlertDialog.Content className={styles.content}>
          <RadixAlertDialog.Title className={styles.title}>{title}</RadixAlertDialog.Title>
          {description && (
            <RadixAlertDialog.Description className={styles.description}>
              {description}
            </RadixAlertDialog.Description>
          )}
          {children && <div className={styles.body}>{children}</div>}
          <div className={styles.footer}>
            {/* 取消按钮自动关闭弹窗，再触发外部 onCancel */}
            <RadixAlertDialog.Cancel asChild>
              <Button variant="subtle" onClick={onCancel}>
                {cancelLabel}
              </Button>
            </RadixAlertDialog.Cancel>
            {/* 确认按钮自动关闭弹窗，再触发外部 onAction */}
            <RadixAlertDialog.Action asChild>
              <Button variant="primary" onClick={onAction}>
                {actionLabel}
              </Button>
            </RadixAlertDialog.Action>
          </div>
        </RadixAlertDialog.Content>
      </RadixAlertDialog.Portal>
    </RadixAlertDialog.Root>
  );
}

export type { AlertDialogProps };
