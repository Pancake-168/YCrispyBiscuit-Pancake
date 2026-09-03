import { useId } from 'react';
import * as RadixCheckbox from '@radix-ui/react-checkbox';
import * as RadixLabel from '@radix-ui/react-label';
import { VscCheck } from 'react-icons/vsc';
import styles from './Checkbox.module.css';

interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
}

/**
 * Checkbox — 复选框。
 * Radix Checkbox 做骨架，支持键盘空格切换与受控状态。
 */
export default function Checkbox({
  checked,
  onChange,
  label,
  disabled = false,
}: CheckboxProps) {
  const generatedId = useId();

  return (
    <div className={styles.wrapper}>
      {/* Radix Checkbox 会传入 true / false / 'indeterminate'，本封装只暴露布尔语义 */}
      <RadixCheckbox.Root
        id={generatedId}
        className={styles.root}
        checked={checked}
        onCheckedChange={(next) => onChange(next === true)}
        disabled={disabled}
      >
        <RadixCheckbox.Indicator className={styles.indicator}>
          {/* 勾选图标放在 Indicator 内，只有选中态才渲染 */}
          <VscCheck size={12} />
        </RadixCheckbox.Indicator>
      </RadixCheckbox.Root>
      {label && (
        // 使用 Radix Label 而不是原生 label，保持封装内不直接写原生控件
        <RadixLabel.Root className={styles.label} htmlFor={generatedId}>
          {label}
        </RadixLabel.Root>
      )}
    </div>
  );
}

export type { CheckboxProps };
