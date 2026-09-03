import * as RadixRadioGroup from '@radix-ui/react-radio-group';
import { VscStarFull } from 'react-icons/vsc';
import styles from './Rating.module.css';

interface RatingProps {
  value: number;
  onChange: (value: number) => void;
  max?: number;
  disabled?: boolean;
  className?: string;
}

/**
 * Rating — 星级评分。
 * 使用 Radix RadioGroup 实现单选与键盘方向键切换。
 */
export default function Rating({
  value,
  onChange,
  max = 5,
  disabled = false,
  className = '',
}: RatingProps) {
  const current = Math.min(max, Math.max(0, Math.round(value)));

  return (
    <RadixRadioGroup.Root
      className={`${styles.root} ${className}`}
      value={String(current)}
      onValueChange={(next) => onChange(Number(next))}
      disabled={disabled}
    >
      {Array.from({ length: max }, (_, index) => {
        const starValue = index + 1;
        return (
          <RadixRadioGroup.Item
            key={starValue}
            value={String(starValue)}
            aria-label={`${starValue} 星`}
            className={`${styles.item} ${starValue <= current ? styles.active : ''}`}
          >
            {/* 未选中星用相同图标 + CSS 灰度，保持图形一致 */}
            <VscStarFull className={styles.star} />
          </RadixRadioGroup.Item>
        );
      })}
    </RadixRadioGroup.Root>
  );
}

export type { RatingProps };
