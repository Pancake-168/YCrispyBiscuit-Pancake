import type { ReactNode } from 'react';
import * as RadixAspectRatio from '@radix-ui/react-aspect-ratio';
import styles from './AspectRatio.module.css';

interface AspectRatioProps {
  ratio?: number;
  children: ReactNode;
  className?: string;
}

/**
 * AspectRatio — 固定宽高比容器。
 * Radix AspectRatio 做骨架，适合放图片、视频等需要保持比例的内容。
 */
export default function AspectRatio({
  ratio = 16 / 9,
  children,
  className = '',
}: AspectRatioProps) {
  return (
    <RadixAspectRatio.Root ratio={ratio} className={`${styles.root} ${className}`}>
      {children}
    </RadixAspectRatio.Root>
  );
}

export type { AspectRatioProps };
