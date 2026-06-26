import type { ReactNode } from 'react';
import * as RadixTabs from '@radix-ui/react-tabs';
import styles from './Tabs.module.css';

interface TabItem {
  id: string;
  label: string;
  icon?: ReactNode;
  content: ReactNode;
}

interface TabsProps {
  tabs: TabItem[];
  defaultTab?: string;
  onChange?: (id: string) => void;
}

/**
 * Tabs — 标签页切换容器。
 * Radix Tabs 做骨架，样式引用全局 Token。
 */
export default function Tabs({ tabs, defaultTab, onChange }: TabsProps) {
  return (
    <RadixTabs.Root
      className={styles.root}
      defaultValue={defaultTab ?? tabs[0]?.id}
      onValueChange={onChange}
    >
      <RadixTabs.List className={styles.list}>
        {tabs.map((tab) => (
          <RadixTabs.Trigger key={tab.id} className={styles.trigger} value={tab.id}>
            {tab.icon}
            {tab.label}
          </RadixTabs.Trigger>
        ))}
      </RadixTabs.List>

      {tabs.map((tab) => (
        <RadixTabs.Content key={tab.id} className={styles.panel} value={tab.id}>
          {tab.content}
        </RadixTabs.Content>
      ))}
    </RadixTabs.Root>
  );
}

export type { TabItem, TabsProps };
