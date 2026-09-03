import type { ReactNode } from 'react';
import * as RadixVisuallyHidden from '@radix-ui/react-visually-hidden';

interface VisuallyHiddenProps {
  children: ReactNode;
}

/**
 * VisuallyHidden — 视觉隐藏但保留给读屏器/搜索引擎的内容容器。
 */
export default function VisuallyHidden({ children }: VisuallyHiddenProps) {
  return <RadixVisuallyHidden.Root>{children}</RadixVisuallyHidden.Root>;
}

export type { VisuallyHiddenProps };
