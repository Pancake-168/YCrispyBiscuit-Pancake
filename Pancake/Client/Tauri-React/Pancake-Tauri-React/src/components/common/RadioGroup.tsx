import { useId, type ReactNode } from 'react';
import * as RadixLabel from '@radix-ui/react-label';
import * as RadixRadioGroup from '@radix-ui/react-radio-group';
import styles from './RadioGroup.module.css';

interface RadioOption {
  value: string;
  label: ReactNode;
  disabled?: boolean;
}

interface RadioGroupProps {
  value: string;
  onChange: (value: string) => void;
  options: RadioOption[];
  label?: string;
  disabled?: boolean;
  className?: string;
}

/**
 * RadioGroup — 单选组。
 * Radix RadioGroup 做骨架，键盘方向键切换选项。
 */
export default function RadioGroup({
  value,
  onChange,
  options,
  label,
  disabled = false,
  className = '',
}: RadioGroupProps) {
  const generatedId = useId();

  return (
    <div className={`${styles.wrapper} ${className}`}>
      {label && <span className={styles.label}>{label}</span>}
      <RadixRadioGroup.Root value={value} onValueChange={onChange} className={styles.group}>
        {options.map((option) => {
          const optionId = `${generatedId}-${option.value}`;
          return (
            <div className={styles.option} key={option.value}>
              <RadixRadioGroup.Item
                id={optionId}
                value={option.value}
                disabled={disabled || option.disabled}
                className={styles.item}
              >
                {/* 选中时显示内圆点 */}
                <RadixRadioGroup.Indicator className={styles.indicator} />
              </RadixRadioGroup.Item>
              {/* 使用 Radix Label 替代原生 label */}
              <RadixLabel.Root className={styles.optionLabel} htmlFor={optionId}>
                {option.label}
              </RadixLabel.Root>
            </div>
          );
        })}
      </RadixRadioGroup.Root>
    </div>
  );
}

export type { RadioOption, RadioGroupProps };
