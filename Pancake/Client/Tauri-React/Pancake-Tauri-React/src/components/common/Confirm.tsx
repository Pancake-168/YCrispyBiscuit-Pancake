import type { ReactNode } from 'react';
import Button, { type ButtonVariant } from './Button';
import Dialog from './Dialog';
import styles from './Dialog.module.css';

interface ConfirmProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  variant?: 'default' | 'danger';
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel?: () => void;
  extraButtons?: {
    label: string;
    variant: ButtonVariant;
    onClick: () => void;
  }[];
  children?: ReactNode;
}

/**
 * Confirm — Dialog 的预设子集，预置按钮槽位。
 * 适用于删除确认、提交确认等场景。
 * 按钮栏布局：[取消] [...额外按钮] [确认]
 */
export default function Confirm({
  open,
  onOpenChange,
  title,
  description,
  variant = 'default',
  confirmLabel = '确认',
  cancelLabel = '取消',
  onConfirm,
  onCancel,
  extraButtons,
  children,
}: ConfirmProps) {
  const confirmVariant: ButtonVariant = variant === 'danger' ? 'danger' : 'primary';

  const handleCancel = () => {
    onCancel?.();
    onOpenChange(false);
  };

  const handleConfirm = () => {
    onConfirm();
    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
    >
      {children}
      <div className={styles.footer}>
        <div className={styles.footerLeft}>
          {extraButtons?.map((btn, i) => (
            <Button key={i} variant={btn.variant} onClick={btn.onClick}>
              {btn.label}
            </Button>
          ))}
        </div>
        <Button variant="subtle" onClick={handleCancel}>
          {cancelLabel}
        </Button>
        <Button variant={confirmVariant} onClick={handleConfirm}>
          {confirmLabel}
        </Button>
      </div>
    </Dialog>
  );
}
