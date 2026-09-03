import type { ReactNode } from 'react';
import * as RadixToolbar from '@radix-ui/react-toolbar';
import styles from './Toolbar.module.css';

interface ToolbarProps {
  children: ReactNode;
  className?: string;
  'aria-label'?: string;
}

/**
 * Toolbar — 工具条容器。
 * 使用 Radix Toolbar 的 Root 做语义骨架，内部放 Button / Toggle / Separator 等控件。
 */
export default function Toolbar({
  children,
  className = '',
  'aria-label': ariaLabel = '工具栏',
}: ToolbarProps) {
  return (
    <RadixToolbar.Root aria-label={ariaLabel} className={`${styles.root} ${className}`}>
      {children}
    </RadixToolbar.Root>
  );
}

export type { ToolbarProps };
