import { useId, useCallback, type InputHTMLAttributes, type Ref } from 'react';
import * as RadixLabel from '@radix-ui/react-label';
import styles from './Input.module.css';

interface InputProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'onChange' | 'type' | 'ref'
> {
  value: string;
  onChange: (v: string) => void;
  label?: string;
  helper?: string;
  error?: string;
  type?: 'text' | 'password' | 'number';
  inputRef?: Ref<HTMLInputElement>;
}

/**
 * Input — 单行文本输入。
 * type="number" 时自动附加无底色的自定义 ↑↓ 箭头按钮，跟随主题色。
 */
export default function Input({
  value,
  onChange,
  placeholder,
  label,
  helper,
  error,
  disabled = false,
  type = 'text',
  className = '',
  id,
  min,
  max,
  step,
  inputRef,
  ...rest
}: InputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  // number 类型步进：取 step 否则默认 1
  const numStep = step !== undefined ? Number(step) : 1;

  const spin = useCallback(
    // delta: +1 或 -1
    (delta: number) => {
      const cur = Number(value);
      if (isNaN(cur)) return;
      let next = (cur * 10 + delta * numStep * 10) / 10; // 避免浮点精度问题
      // 按 0 位小数四舍五入
      next = Math.round(next * 10) / 10;
      if (min !== undefined && next < Number(min)) return;
      if (max !== undefined && next > Number(max)) return;
      onChange(String(next));
    },
    [value, onChange, numStep, min, max],
  );

  const isNumber = type === 'number';

  const inputEl = (
    <input
      id={inputId}
      ref={inputRef}
      type={type}
      className={`${styles.field} ${error ? styles.hasError : ''}`}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      min={min}
      max={max}
      step={step}
      {...rest}
    />
  );

  const fieldArea = isNumber ? (
    // number 类型：外层包容器 + 自定义 ↑↓ 箭头
    <div className={styles.numberWrapper}>
      {inputEl}
      <span className={styles.spinBtnGroup}>
        <button
          type="button"
          className={styles.spinBtn}
          disabled={disabled}
          tabIndex={-1}
          onClick={() => spin(1)}
          aria-label="增加"
        >
          ▲
        </button>
        <button
          type="button"
          className={styles.spinBtn}
          disabled={disabled}
          tabIndex={-1}
          onClick={() => spin(-1)}
          aria-label="减少"
        >
          ▼
        </button>
      </span>
    </div>
  ) : (
    inputEl
  );

  return (
    <div className={`${styles.wrapper} ${className}`}>
      {label && (
        // 使用 Radix Label 替代原生 label，保证可访问性行为一致
        <RadixLabel.Root className={styles.label} htmlFor={inputId}>
          {label}
        </RadixLabel.Root>
      )}
      {fieldArea}
      {error ? (
        <span className={styles.errorText}>{error}</span>
      ) : helper ? (
        <span className={styles.helper}>{helper}</span>
      ) : null}
    </div>
  );
}
