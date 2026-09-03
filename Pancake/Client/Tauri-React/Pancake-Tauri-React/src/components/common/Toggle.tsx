import type { ReactNode } from 'react';
import * as RadixToggle from '@radix-ui/react-toggle';
import styles from './Toggle.module.css';

interface ToggleProps {
  pressed?: boolean;
  defaultPressed?: boolean;
  onPressedChange?: (pressed: boolean) => void;
  disabled?: boolean;
  className?: string;
  children?: ReactNode;
  'aria-label'?: string;
}

/**
 * Toggle — 按压态按钮。
 * Radix Toggle 做骨架，适合图标开关、选中态按钮等场景。
 */
export default function Toggle({
  pressed,
  defaultPressed,
  onPressedChange,
  disabled = false,
  className = '',
  children,
  'aria-label': ariaLabel,
}: ToggleProps) {
  return (
    <RadixToggle.Root
      className={`${styles.root} ${className}`}
      pressed={pressed}
      defaultPressed={defaultPressed}
      onPressedChange={onPressedChange}
      disabled={disabled}
      aria-label={ariaLabel}
    >
      {children}
    </RadixToggle.Root>
  );
}

export type { ToggleProps };
