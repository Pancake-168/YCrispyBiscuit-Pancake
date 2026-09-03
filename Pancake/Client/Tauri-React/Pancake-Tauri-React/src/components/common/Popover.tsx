import type { ReactNode } from 'react';
import * as RadixPopover from '@radix-ui/react-popover';
import styles from './Popover.module.css';

interface PopoverProps {
  trigger: ReactNode;
  children: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  side?: 'top' | 'right' | 'bottom' | 'left';
  align?: 'start' | 'center' | 'end';
  sideOffset?: number;
  contentClassName?: string;
  showArrow?: boolean;
  bareContent?: boolean;
}

/**
 * Popover — 轻量弹出卡片，点击触发，可内置表单或操作按钮。
 * Radix Popover 做骨架，卡片引用 .glass Token。
 */
export default function Popover({
  trigger,
  children,
  open,
  onOpenChange,
  side = 'bottom',
  align = 'center',
  sideOffset = 6,
  contentClassName = '',
  showArrow = true,
  bareContent = false,
}: PopoverProps) {
  return (
    <RadixPopover.Root open={open} onOpenChange={onOpenChange}>
      <RadixPopover.Trigger asChild>{trigger}</RadixPopover.Trigger>
      <RadixPopover.Portal>
        <RadixPopover.Content
          className={bareContent ? contentClassName : `${styles.content} ${contentClassName}`}
          side={side}
          align={align}
          sideOffset={sideOffset}
        >
          {children}
          {showArrow && <RadixPopover.Arrow className={styles.arrow} />}
        </RadixPopover.Content>
      </RadixPopover.Portal>
    </RadixPopover.Root>
  );
}

export type { PopoverProps };
