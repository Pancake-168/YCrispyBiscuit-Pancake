import type { ComponentProps } from 'react';
import * as RadixSlot from '@radix-ui/react-slot';

type SlotProps = ComponentProps<typeof RadixSlot.Slot>;

/**
 * Slot — Radix Slot 透传封装。
 * 把父组件传入的 props/className/style 合并到子元素上，常用于做复合组件。
 */
export default function Slot({ children, ...props }: SlotProps) {
  return <RadixSlot.Slot {...props}>{children}</RadixSlot.Slot>;
}

export type { SlotProps };
