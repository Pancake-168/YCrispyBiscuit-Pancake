import type { ReactNode } from 'react';
import * as RadixAvatar from '@radix-ui/react-avatar';
import { VscAccount } from 'react-icons/vsc';
import styles from './Avatar.module.css';

interface AvatarProps {
  src: string;
  alt: string;
  fallback?: ReactNode;
  size?: number;
  shape?: 'circle' | 'rounded';
  className?: string;
}

/**
 * Avatar — 用户头像容器。
 * 图片加载完成前/失败时显示 fallback，统一处理尺寸与裁剪。
 * fallback 不传时默认使用 VscAccount。
 */
export default function Avatar({
  src,
  alt,
  fallback,
  size = 32,
  shape = 'circle',
  className = '',
}: AvatarProps) {
  // 圆角形状：圆形或普通圆角，数字尺寸作为布局宽高
  const radius = shape === 'circle' ? '50%' : 'var(--radius-md)';

  return (
    <RadixAvatar.Root
      className={`${styles.root} ${className}`}
      style={{ width: size, height: size, borderRadius: radius }}
    >
      <RadixAvatar.Image className={styles.image} src={src} alt={alt} />
      <RadixAvatar.Fallback className={styles.fallback} delayMs={600}>
        {fallback ?? <VscAccount />}
      </RadixAvatar.Fallback>
    </RadixAvatar.Root>
  );
}

export type { AvatarProps };
