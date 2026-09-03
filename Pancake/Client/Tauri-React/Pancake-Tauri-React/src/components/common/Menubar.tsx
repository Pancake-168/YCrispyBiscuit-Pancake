import type { ReactNode } from 'react';
import * as RadixMenubar from '@radix-ui/react-menubar';
import menuStyles from './DropdownMenu.module.css';
import styles from './Menubar.module.css';

interface MenubarItem {
  label: string;
  disabled?: boolean;
  danger?: boolean;
  separator?: true;
  onClick?: () => void;
}

interface MenubarMenu {
  label: string;
  items?: MenubarItem[];
  content?: ReactNode;
}

interface MenubarProps {
  menus: MenubarMenu[];
}

/**
 * Menubar — 顶部菜单栏，支持多个菜单及下拉内容。
 * Radix Menubar 做骨架，下拉面板视觉复用 DropdownMenu 样式。
 */
export default function Menubar({ menus }: MenubarProps) {
  return (
    <RadixMenubar.Root className={styles.root}>
      {menus.map((menu) => (
        <RadixMenubar.Menu key={menu.label}>
          <RadixMenubar.Trigger className={styles.trigger}>{menu.label}</RadixMenubar.Trigger>
          <RadixMenubar.Portal>
            <RadixMenubar.Content className={menuStyles.content} align="start" sideOffset={4}>
              {/* 自定义内容优先放在菜单项上方 */}
              {menu.content}
              {menu.items?.map((item, index) => {
                if (item.separator) {
                  return <RadixMenubar.Separator key={index} className={menuStyles.separator} />;
                }
                return (
                  <RadixMenubar.Item
                    key={index}
                    className={`${menuStyles.item} ${item.danger ? menuStyles.itemDanger : ''}`}
                    disabled={item.disabled}
                    onSelect={item.onClick}
                  >
                    <span className={menuStyles.itemLabel}>{item.label}</span>
                  </RadixMenubar.Item>
                );
              })}
            </RadixMenubar.Content>
          </RadixMenubar.Portal>
        </RadixMenubar.Menu>
      ))}
    </RadixMenubar.Root>
  );
}

export type { MenubarItem, MenubarMenu, MenubarProps };
