import type { ReactNode, ButtonHTMLAttributes } from 'react';

// ButtonVariant 意思是按钮等级，不同等级有不同颜色和语义
type ButtonVariant = 'primary' | 'secondary' | 'subtle' | 'danger';

// 按钮接收传参
interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'type'> {
  variant?: ButtonVariant;
  loading?: boolean;
  loadingText?: string;
  icon?: ReactNode;
  type?: 'button' | 'submit';
}

/**
 * Button — 原子按钮组件。
 * 封装 loading 态（spinning + disabled + 文字替换），样式完全来自全局 .btn.* 类。
 */
export default function Button({
  variant = 'primary',
  loading = false,
  loadingText = '请稍候...',
  icon,
  children,
  type = 'button',
  className = '',
  disabled,
  onClick,
  ...rest
}: ButtonProps) {
  const isDisabled = disabled || loading;

  const classNames = ['btn', variant, loading ? 'spinning' : '', className]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      type={type}
      className={classNames}
      disabled={isDisabled}
      onClick={isDisabled ? undefined : onClick}
      {...rest}
    >
      {!loading && icon}
      {loading ? loadingText : children}
    </button>
  );
}

export type { ButtonVariant };
