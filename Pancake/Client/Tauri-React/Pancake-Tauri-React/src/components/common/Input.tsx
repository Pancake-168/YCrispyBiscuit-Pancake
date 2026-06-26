import { useId, type InputHTMLAttributes } from 'react';
import styles from './Input.module.css';

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'type'> {
  value: string;
  onChange: (v: string) => void;
  label?: string;
  helper?: string;
  error?: string;
  type?: 'text' | 'password' | 'number';
}

/**
 * Input — 单行文本输入。
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
  ...rest
}: InputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  return (
    <div className={`${styles.wrapper} ${className}`}>
      {label && (
        <label className={styles.label} htmlFor={inputId}>
          {label}
        </label>
      )}
      <input
        id={inputId}
        type={type}
        className={`${styles.field} ${error ? styles.hasError : ''}`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
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
