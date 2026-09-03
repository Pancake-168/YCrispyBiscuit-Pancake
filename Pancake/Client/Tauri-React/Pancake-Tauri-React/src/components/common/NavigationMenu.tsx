import type { ReactNode } from 'react';
import * as RadixNavigationMenu from '@radix-ui/react-navigation-menu';
import styles from './NavigationMenu.module.css';

interface NavigationMenuItem {
  label: string;
  content?: ReactNode;
  onClick?: () => void;
}

interface NavigationMenuProps {
  items: NavigationMenuItem[];
  className?: string;
}

/**
 * NavigationMenu — 导航菜单。
 * 有 content 的项渲染成可展开菜单，没有 content 的项直接触发点击。
 */
export default function NavigationMenu({ items, className = '' }: NavigationMenuProps) {
  return (
    <RadixNavigationMenu.Root className={`${styles.root} ${className}`}>
      <RadixNavigationMenu.List className={styles.list}>
        {items.map((item) => (
          <RadixNavigationMenu.Item key={item.label} className={styles.item}>
            {item.content ? (
              <>
                <RadixNavigationMenu.Trigger className={styles.trigger}>
                  {item.label}
                </RadixNavigationMenu.Trigger>
                <RadixNavigationMenu.Content className={styles.panel}>
                  {item.content}
                </RadixNavigationMenu.Content>
              </>
            ) : (
              <RadixNavigationMenu.Link className={styles.trigger} onSelect={item.onClick}>
                {item.label}
              </RadixNavigationMenu.Link>
            )}
          </RadixNavigationMenu.Item>
        ))}
      </RadixNavigationMenu.List>
      {/* Viewport 负责承载展开面板的定位与动画 */}
      <RadixNavigationMenu.Viewport className={styles.viewport} />
    </RadixNavigationMenu.Root>
  );
}

export type { NavigationMenuItem, NavigationMenuProps };
