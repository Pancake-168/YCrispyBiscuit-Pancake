import * as RadixProgress from '@radix-ui/react-progress';
import styles from './Progress.module.css';

interface ProgressProps {
  value: number;
  max?: number;
  className?: string;
}

/**
 * Progress — 进度条。
 * Radix Progress 做骨架，Indicator 通过 translateX 展示当前进度。
 */
export default function Progress({ value, max = 100, className = '' }: ProgressProps) {
  // 计算 0-100 的百分比，避免外部传入越界值破坏样式
  const percent = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;

  return (
    <RadixProgress.Root className={`${styles.root} ${className}`} value={value} max={max}>
      {/* 初始占满整条轨道，再向左平移露出未完成区域 */}
      <RadixProgress.Indicator
        className={styles.indicator}
        style={{ transform: `translateX(-${100 - percent}%)` }}
      />
    </RadixProgress.Root>
  );
}

export type { ProgressProps };
