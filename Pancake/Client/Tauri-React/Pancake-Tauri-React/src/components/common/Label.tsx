import type { ReactNode } from 'react';
import * as RadixLabel from '@radix-ui/react-label';
import styles from './Label.module.css';

interface LabelProps {
  children: ReactNode;
  htmlFor?: string;
  className?: string;
}

/**
 * Label — 表单标签。
 * 使用 Radix Label 保证点击标签可聚焦关联表单控件。
 */
export default function Label({ children, htmlFor, className = '' }: LabelProps) {
  return (
    <RadixLabel.Root htmlFor={htmlFor} className={`${styles.label} ${className}`}>
      {children}
    </RadixLabel.Root>
  );
}

export type { LabelProps };
