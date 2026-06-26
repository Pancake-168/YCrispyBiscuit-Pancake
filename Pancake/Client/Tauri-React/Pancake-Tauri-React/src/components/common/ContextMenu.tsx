import type { ReactNode } from 'react';
import * as RadixContext from '@radix-ui/react-context-menu';
import { renderMenuItem, type MenuItem } from './DropdownMenu';
import styles from './DropdownMenu.module.css';

interface ContextMenuProps {
  children: ReactNode;
  items: MenuItem[];
  disabled?: boolean;
}

/**
 * ContextMenu — 右键菜单。
 * 菜单结构与样式完全复用 DropdownMenu。
 */
export default function ContextMenu({
  children,
  items,
  disabled = false,
}: ContextMenuProps) {
  return (
    <RadixContext.Root>
      <RadixContext.Trigger asChild disabled={disabled}>
        {children}
      </RadixContext.Trigger>
      <RadixContext.Portal>
        <RadixContext.Content
          className={styles.content}
        >
          {items.map((item, i) => renderMenuItem(item, i))}
        </RadixContext.Content>
      </RadixContext.Portal>
    </RadixContext.Root>
  );
}

export type { MenuItem, ContextMenuProps };
