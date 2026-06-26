import type { ReactNode, ComponentType } from 'react';
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

/** renderMenuItem 所需的 Radix 原语注入 */
interface MenuItemRenderParts {
  Item: ComponentType<{
    className?: string;
    disabled?: boolean;
    onClick?: () => void;
    children: ReactNode;
    key?: React.Key;
  }>;
  Separator: ComponentType<{ className?: string; key?: React.Key }>;
}

/**
 * 渲染单个菜单项（内容逻辑，供 DropdownMenu 和 ContextMenu 共用）。
 * `parts` 由调用方注入各自 Radix 库的 Item / Separator 组件，
 * 避免跨库混用 Radix 原语。
 */
// eslint-disable-next-line react-refresh/only-export-components
export function renderMenuItem(item: MenuItem, index: number, parts: MenuItemRenderParts) {
  const { Item, Separator } = parts;

  if (item.separator) {
    return <Separator key={index} className={styles.separator} />;
  }

  return (
    <Item
      key={index}
      className={`${styles.item} ${item.danger ? styles.itemDanger : ''}`}
      disabled={item.disabled}
      onClick={item.onClick}
    >
      {item.icon}
      <span className={styles.itemLabel}>{item.label}</span>
      {item.shortcut && <span className={styles.shortcut}>{item.shortcut}</span>}
    </Item>
  );
}

/** DropdownMenu 专用的 parts */
const dropdownParts: MenuItemRenderParts = {
  Item: RadixDropdown.Item,
  Separator: RadixDropdown.Separator,
};

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
      <RadixDropdown.Trigger asChild>{trigger}</RadixDropdown.Trigger>
      <RadixDropdown.Portal>
        <RadixDropdown.Content className={styles.content} side={side} align={align} sideOffset={4}>
          {items.map((item, i) => renderMenuItem(item, i, dropdownParts))}
        </RadixDropdown.Content>
      </RadixDropdown.Portal>
    </RadixDropdown.Root>
  );
}

export type { MenuItem, DropdownMenuProps, MenuItemRenderParts };
