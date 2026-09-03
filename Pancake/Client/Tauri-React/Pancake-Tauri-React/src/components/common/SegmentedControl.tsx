import type { ReactNode } from 'react';
import RadioGroup from './RadioGroup';
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
 * 基于公共 RadioGroup 实现单选语义，选中态通过 data-state 高亮。
 */
export default function SegmentedControl({
  value,
  onChange,
  options,
  disabled = false,
  className = '',
}: SegmentedControlProps) {
  return (
    <RadioGroup
      value={value}
      onChange={onChange}
      options={options.map((option) => ({
        value: option.value,
        content: option.label,
        disabled: option.disabled,
      }))}
      disabled={disabled}
      bare
      wrapOptions={false}
      className={className}
      groupClassName={styles.root}
      itemClassName={styles.item}
    />
  );
}

export type { SegmentedOption, SegmentedControlProps };
