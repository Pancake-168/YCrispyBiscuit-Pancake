import type { ReactNode } from 'react';
import * as RadixHoverCard from '@radix-ui/react-hover-card';
import styles from './Popover.module.css';

interface HoverCardProps {
  trigger: ReactNode;
  children: ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
  align?: 'start' | 'center' | 'end';
  sideOffset?: number;
  openDelay?: number;
  closeDelay?: number;
}

/**
 * HoverCard — 鼠标悬停后弹出的卡片。
 * Radix HoverCard 做骨架，视觉与 Popover 卡片一致。
 */
export default function HoverCard({
  trigger,
  children,
  side = 'bottom',
  align = 'center',
  sideOffset = 6,
  openDelay = 300,
  closeDelay = 200,
}: HoverCardProps) {
  return (
    <RadixHoverCard.Root openDelay={openDelay} closeDelay={closeDelay}>
      <RadixHoverCard.Trigger asChild>{trigger}</RadixHoverCard.Trigger>
      <RadixHoverCard.Portal>
        <RadixHoverCard.Content
          className={styles.content}
          side={side}
          align={align}
          sideOffset={sideOffset}
        >
          {children}
          {/* 箭头与 Popover 共用同一套毛玻璃 Token */}
          <RadixHoverCard.Arrow className={styles.arrow} />
        </RadixHoverCard.Content>
      </RadixHoverCard.Portal>
    </RadixHoverCard.Root>
  );
}

export type { HoverCardProps };
