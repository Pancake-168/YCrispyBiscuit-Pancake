import type { ReactNode } from 'react';
import * as RadixScroll from '@radix-ui/react-scroll-area';
import styles from './ScrollArea.module.css';

interface ScrollAreaProps {
  children: ReactNode;
  maxHeight?: number | string;
  className?: string;
}

/**
 * ScrollArea — 统一样式的滚动容器，替换原生滚动条。
 * Radix ScrollArea 做骨架，滚动条样式与全局 ::-webkit-scrollbar 一致。
 *
 * 部件结构：Root → Viewport → Scrollbar → Thumb
 */
export default function ScrollArea({
  children,
  maxHeight,
  className = '',
}: ScrollAreaProps) {
  return (
    <RadixScroll.Root className={`${styles.root} ${className}`}>
      <RadixScroll.Viewport
        className={styles.viewport}
        style={maxHeight ? { maxHeight } : undefined}
      >
        {children}
      </RadixScroll.Viewport>
      <RadixScroll.Scrollbar className={styles.scrollbar} orientation="vertical">
        <RadixScroll.Thumb className={styles.thumb} />
      </RadixScroll.Scrollbar>
      <RadixScroll.Scrollbar className={styles.scrollbar} orientation="horizontal">
        <RadixScroll.Thumb className={styles.thumb} />
      </RadixScroll.Scrollbar>
    </RadixScroll.Root>
  );
}
