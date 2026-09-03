import * as RadixSeparator from '@radix-ui/react-separator';
import styles from './Separator.module.css';

interface SeparatorProps {
  orientation?: 'horizontal' | 'vertical';
  decorative?: boolean;
  className?: string;
}

/**
 * Separator — 视觉分隔线。
 * Radix Separator 做骨架，横/竖方向自适应。
 */
export default function Separator({
  orientation = 'horizontal',
  decorative = true,
  className = '',
}: SeparatorProps) {
  return (
    <RadixSeparator.Root
      orientation={orientation}
      decorative={decorative}
      className={`${styles.root} ${orientation === 'horizontal' ? styles.horizontal : styles.vertical} ${className}`}
    />
  );
}

export type { SeparatorProps };
