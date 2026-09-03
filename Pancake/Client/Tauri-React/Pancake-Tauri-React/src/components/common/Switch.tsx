import { useId } from 'react';
import * as RadixSwitch from '@radix-ui/react-switch';
import styles from './Switch.module.css';
import Label from './Label';

interface SwitchProps {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: string;
  disabled?: boolean;
}

/**
 * Switch — 布尔值开关。
 * Radix Switch 做骨架，样式用自己的 CSS Module。
 */
export default function Switch({ checked, onChange, label, disabled = false }: SwitchProps) {
  const generatedId = useId();

  return (
    <div className={styles.wrapper}>
      <RadixSwitch.Root
        id={generatedId}
        className={styles.root}
        checked={checked}
        onCheckedChange={onChange}
        disabled={disabled}
      >
        <RadixSwitch.Thumb className={styles.thumb} />
      </RadixSwitch.Root>
      {label && (
        // 使用 Radix Label 而不是原生 label，保持封装内不直接写原生控件
        <Label className={styles.label} htmlFor={generatedId}>
          {label}
        </Label>
      )}
    </div>
  );
}
