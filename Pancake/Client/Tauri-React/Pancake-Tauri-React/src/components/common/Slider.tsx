import * as RadixSlider from '@radix-ui/react-slider';
import styles from './Slider.module.css';

interface SliderProps {
  value?: number[];
  defaultValue?: number[];
  onValueChange?: (value: number[]) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  label?: string;
  className?: string;
}

/**
 * Slider — 滑块。
 * Radix Slider 做骨架，支持单/多滑块（传入 value/defaultValue 数组长度控制数量）。
 */
export default function Slider({
  value,
  defaultValue,
  onValueChange,
  min = 0,
  max = 100,
  step = 1,
  disabled = false,
  label,
  className = '',
}: SliderProps) {
  // 未受控时至少渲染一个滑块，让用户可以直接拖动
  const thumbCount = value?.length ?? defaultValue?.length ?? 1;

  return (
    <RadixSlider.Root
      className={`${styles.root} ${className}`}
      value={value}
      defaultValue={defaultValue}
      onValueChange={onValueChange}
      min={min}
      max={max}
      step={step}
      disabled={disabled}
      aria-label={label}
    >
      <RadixSlider.Track className={styles.track}>
        <RadixSlider.Range className={styles.range} />
      </RadixSlider.Track>
      {Array.from({ length: thumbCount }, (_, index) => (
        <RadixSlider.Thumb key={index} className={styles.thumb} />
      ))}
    </RadixSlider.Root>
  );
}

export type { SliderProps };
