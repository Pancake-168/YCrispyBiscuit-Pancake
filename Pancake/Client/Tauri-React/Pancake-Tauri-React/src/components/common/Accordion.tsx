import type { ReactNode } from 'react';
import * as RadixAccordion from '@radix-ui/react-accordion';
import IconContainer from './IconContainer';
import styles from './Accordion.module.css';
import { getIcon } from '@/icons';

interface AccordionItem {
  value: string;
  trigger: ReactNode;
  content: ReactNode;
  disabled?: boolean;
}

interface AccordionProps {
  items: AccordionItem[];
  type?: 'single' | 'multiple';
  collapsible?: boolean;
  className?: string;
}

/**
 * Accordion — 手风琴折叠面板。
 * Radix Accordion 做骨架，样式使用项目 Token。
 */
export default function Accordion({
  items,
  type = 'single',
  collapsible = false,
  className = '',
}: AccordionProps) {
  return (
    <RadixAccordion.Root
      className={`${styles.root} ${className}`}
      type={type}
      collapsible={collapsible}
    >
      {items.map((item) => (
        <RadixAccordion.Item
          key={item.value}
          value={item.value}
          disabled={item.disabled}
          className={styles.item}
        >
          <RadixAccordion.Header className={styles.header}>
            <RadixAccordion.Trigger className={styles.trigger}>
              <span className={styles.triggerText}>{item.trigger}</span>
              {/* 展开方向箭头，data-state 变化时由 CSS 旋转 */}
              <IconContainer size={16} src={getIcon('chevronDown', 16, styles.chevron)} />
            </RadixAccordion.Trigger>
          </RadixAccordion.Header>
          <RadixAccordion.Content className={styles.content}>
            <div className={styles.contentInner}>{item.content}</div>
          </RadixAccordion.Content>
        </RadixAccordion.Item>
      ))}
    </RadixAccordion.Root>
  );
}

export type { AccordionItem, AccordionProps };
