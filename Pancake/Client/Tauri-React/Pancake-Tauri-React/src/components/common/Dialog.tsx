import type { CSSProperties, ReactNode } from 'react';
import * as RadixDialog from '@radix-ui/react-dialog';
import Button from './Button';
import IconContainer from './IconContainer';
import styles from './Dialog.module.css';
import { getIcon } from '@/icons';

interface DialogProps {
  trigger?: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  title?: string;
  description?: string;
  children: ReactNode;
  overlayClassName?: string;
  contentClassName?: string;
  contentStyle?: CSSProperties;
  bodyClassName?: string;
  hideClose?: boolean;
  hideTitle?: boolean;
  bareContent?: boolean;
  bareBody?: boolean;
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
  overlayClassName = '',
  contentClassName = '',
  contentStyle,
  bodyClassName = '',
  hideClose = false,
  hideTitle = false,
  bareContent = false,
  bareBody = false,
}: DialogProps) {
  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      {trigger && <RadixDialog.Trigger asChild>{trigger}</RadixDialog.Trigger>}
      <RadixDialog.Portal>
        <RadixDialog.Overlay className={`${styles.overlay} ${overlayClassName}`} />
        <RadixDialog.Content
          className={bareContent ? contentClassName : `${styles.content} ${contentClassName}`}
          style={contentStyle}
        >
          {title && !hideTitle && (
            <RadixDialog.Title className={styles.title}>{title}</RadixDialog.Title>
          )}
          {description && (
            <RadixDialog.Description className={styles.description}>
              {description}
            </RadixDialog.Description>
          )}
          <div className={bareBody ? bodyClassName : `${styles.body} ${bodyClassName}`}>
            {children}
          </div>
          {!hideClose && (
            <RadixDialog.Close asChild>
              <Button
                variant="subtle"
                className={`icon-btn ${styles.closeButton}`}
                aria-label="关闭"
              >
                <IconContainer size={16} src={getIcon('close', 16)} />
              </Button>
            </RadixDialog.Close>
          )}
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}

export type { DialogProps };
