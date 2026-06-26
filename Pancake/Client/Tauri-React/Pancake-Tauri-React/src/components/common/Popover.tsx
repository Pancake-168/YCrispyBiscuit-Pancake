import type { ReactNode } from 'react';
import * as RadixPopover from '@radix-ui/react-popover';
import styles from './Popover.module.css';

interface PopoverProps {
  trigger: ReactNode;
  children: ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
  align?: 'start' | 'center' | 'end';
}

/**
 * Popover — 轻量弹出卡片，点击触发，可内置表单或操作按钮。
 * Radix Popover 做骨架，卡片引用 .glass Token。
 */
export default function Popover({
  trigger,
  children,
  side = 'bottom',
  align = 'center',
}: PopoverProps) {
  return (
    <RadixPopover.Root>
      <RadixPopover.Trigger asChild>
        {trigger}
      </RadixPopover.Trigger>
      <RadixPopover.Portal>
        <RadixPopover.Content
          className={styles.content}
          side={side}
          align={align}
          sideOffset={6}
        >
          {children}
          <RadixPopover.Arrow className={styles.arrow} />
        </RadixPopover.Content>
      </RadixPopover.Portal>
    </RadixPopover.Root>
  );
}
