import type { ReactNode } from 'react';
import * as RadixDropdown from '@radix-ui/react-dropdown-menu';
import styles from './DropdownMenu.module.css';

/**
 * MenuItem — 菜单项类型，与 ContextMenu 共用。
 */
interface MenuItem {
  label: string;
  icon?: ReactNode;
  shortcut?: string;
  disabled?: boolean;
  danger?: boolean;
  separator?: true;
  onClick?: () => void;
}

interface DropdownMenuProps {
  trigger: ReactNode;
  items: MenuItem[];
  side?: 'top' | 'right' | 'bottom' | 'left';
  align?: 'start' | 'center' | 'end';
}

/**
 * 渲染单个菜单项（内容逻辑，供 DropdownMenu 和 ContextMenu 共用）。
 */
export function renderMenuItem(item: MenuItem, index: number) {
  if (item.separator) {
    return (
      <RadixDropdown.Separator key={index} className={styles.separator} />
    );
  }

  return (
    <RadixDropdown.Item
      key={index}
      className={`${styles.item} ${item.danger ? styles.itemDanger : ''}`}
      disabled={item.disabled}
      onClick={item.onClick}
    >
      {item.icon}
      <span className={styles.itemLabel}>{item.label}</span>
      {item.shortcut && (
        <span className={styles.shortcut}>{item.shortcut}</span>
      )}
    </RadixDropdown.Item>
  );
}

/**
 * DropdownMenu — 下拉菜单，点击触发。
 * Radix DropdownMenu 做骨架，样式引用 .glass Token。
 */
export default function DropdownMenu({
  trigger,
  items,
  side = 'bottom',
  align = 'start',
}: DropdownMenuProps) {
  return (
    <RadixDropdown.Root>
      <RadixDropdown.Trigger asChild>
        {trigger}
      </RadixDropdown.Trigger>
      <RadixDropdown.Portal>
        <RadixDropdown.Content
          className={styles.content}
          side={side}
          align={align}
          sideOffset={4}
        >
          {items.map((item, i) => renderMenuItem(item, i))}
        </RadixDropdown.Content>
      </RadixDropdown.Portal>
    </RadixDropdown.Root>
  );
}

export type { MenuItem, DropdownMenuProps };
