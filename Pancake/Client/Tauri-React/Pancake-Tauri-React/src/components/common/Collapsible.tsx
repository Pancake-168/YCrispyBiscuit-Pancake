import type { ReactNode } from 'react';
import * as RadixCollapsible from '@radix-ui/react-collapsible';
import { VscChevronDown } from 'react-icons/vsc';
import styles from './Collapsible.module.css';

interface CollapsibleProps {
  trigger: ReactNode;
  children: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  defaultOpen?: boolean;
  className?: string;
}

/**
 * Collapsible — 可展开/收起的折叠内容区。
 * Radix Collapsible 做骨架，触发区与内容区都使用项目 Token。
 */
export default function Collapsible({
  trigger,
  children,
  open,
  onOpenChange,
  defaultOpen,
  className = '',
}: CollapsibleProps) {
  return (
    <RadixCollapsible.Root
      className={`${styles.root} ${className}`}
      open={open}
      onOpenChange={onOpenChange}
      defaultOpen={defaultOpen}
    >
      {/* Trigger 直接使用 Radix 原语，避免在封装里写原生 button */}
      <RadixCollapsible.Trigger className={styles.trigger}>
        <span>{trigger}</span>
        {/* 箭头方向通过 data-state 在 CSS 中旋转 */}
        <VscChevronDown className={styles.chevron} />
      </RadixCollapsible.Trigger>
      <RadixCollapsible.Content className={styles.content}>
        <div className={styles.contentInner}>{children}</div>
      </RadixCollapsible.Content>
    </RadixCollapsible.Root>
  );
}

export type { CollapsibleProps };
