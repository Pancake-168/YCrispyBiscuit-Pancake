import IconContainer from './IconContainer';
import RadioGroup from './RadioGroup';
import styles from './Rating.module.css';
import { getIcon } from '@/icons';

interface RatingProps {
  value: number;
  onChange: (value: number) => void;
  max?: number;
  disabled?: boolean;
  className?: string;
}

/**
 * Rating — 星级评分。
 * 基于公共 RadioGroup 实现单选与键盘方向键切换。
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
    <RadioGroup
      value={String(current)}
      onChange={(next) => onChange(Number(next))}
      options={Array.from({ length: max }, (_, index) => {
        const starValue = index + 1;
        return {
          value: String(starValue),
          content: <IconContainer size={16} src={getIcon('starFull', 16, styles.star)} />,
          itemClassName: starValue <= current ? styles.active : '',
        };
      })}
      disabled={disabled}
      bare
      wrapOptions={false}
      className={className}
      groupClassName={styles.root}
      itemClassName={styles.item}
    />
  );
}

export type { RatingProps };
