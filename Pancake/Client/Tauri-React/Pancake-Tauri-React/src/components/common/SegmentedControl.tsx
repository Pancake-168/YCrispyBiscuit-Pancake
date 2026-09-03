import type { ReactNode } from 'react';
import * as RadixRadioGroup from '@radix-ui/react-radio-group';
import styles from './SegmentedControl.module.css';

interface SegmentedOption {
  value: string;
  label: ReactNode;
  disabled?: boolean;
}

interface SegmentedControlProps {
  value: string;
  onChange: (value: string) => void;
  options: SegmentedOption[];
  disabled?: boolean;
  className?: string;
}

/**
 * SegmentedControl — 分段选择器。
 * 使用 Radix RadioGroup 做单选语义，选中态通过 data-state 高亮。
 */
export default function SegmentedControl({
  value,
  onChange,
  options,
  disabled = false,
  className = '',
}: SegmentedControlProps) {
  return (
    <RadixRadioGroup.Root
      className={`${styles.root} ${className}`}
      value={value}
      onValueChange={onChange}
      disabled={disabled}
    >
      {options.map((option) => (
        <RadixRadioGroup.Item
          key={option.value}
          value={option.value}
          disabled={disabled || option.disabled}
          className={styles.item}
        >
          {option.label}
        </RadixRadioGroup.Item>
      ))}
    </RadixRadioGroup.Root>
  );
}

export type { SegmentedOption, SegmentedControlProps };
