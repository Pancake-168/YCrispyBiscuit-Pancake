import { useId, type TextareaHTMLAttributes } from 'react';
import * as RadixLabel from '@radix-ui/react-label';
import styles from './Input.module.css';

interface TextareaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'onChange'> {
  value: string;
  onChange: (v: string) => void;
  label?: string;
  helper?: string;
  error?: string;
  rows?: number;
  maxLength?: number;
}

/**
 * Textarea — 多行文本输入。
 * 复用 Input 的全部颜色/边框/focus/error Token。
 */
export default function Textarea({
  value,
  onChange,
  placeholder,
  label,
  helper,
  error,
  disabled = false,
  rows = 4,
  maxLength,
  className = '',
  id,
  ...rest
}: TextareaProps) {
  const generatedId = useId();
  const textareaId = id ?? generatedId;

  return (
    <div className={`${styles.wrapper} ${className}`}>
      {label && (
        // 使用 Radix Label 替代原生 label，保证可访问性行为一致
        <RadixLabel.Root className={styles.label} htmlFor={textareaId}>
          {label}
        </RadixLabel.Root>
      )}
      <textarea
        id={textareaId}
        className={`${styles.field} ${styles.textarea} ${error ? styles.hasError : ''}`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        rows={rows}
        maxLength={maxLength}
        {...rest}
      />
      {error ? (
        <span className={styles.errorText}>{error}</span>
      ) : helper ? (
        <span className={styles.helper}>{helper}</span>
      ) : null}
    </div>
  );
}
