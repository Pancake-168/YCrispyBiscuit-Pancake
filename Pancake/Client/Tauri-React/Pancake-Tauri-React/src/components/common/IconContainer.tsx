import { useState, type ReactNode } from 'react';
import { VscQuestion } from 'react-icons/vsc';
import styles from './IconContainer.module.css';

interface IconContainerProps {
  size: number;
  shape?: 'rounded' | 'circle';
  src: string | ReactNode;
  alt?: string;
  fallback?: ReactNode;
  className?: string;
}

/**
 * IconContainer — 统一图片/图标容器。
 * 容器固定 size×size，图片 object-fit: cover 居中裁剪。
 * src 为字符串时渲染 <img>，为 ReactNode 时直接渲染该组件。
 */
export default function IconContainer({
  size,
  shape = 'rounded',
  src,
  alt = '',
  fallback,
  className = '',
}: IconContainerProps) {
  const [imgError, setImgError] = useState(false);

  const shapeClass = shape === 'circle' ? styles.circle : styles.rounded;

  const containerStyle = {
    width: size,
    height: size,
    minWidth: size,
    minHeight: size,
  };

  // React 图标组件
  if (typeof src !== 'string') {
    return (
      <div className={`${styles.container} ${shapeClass} ${className}`} style={containerStyle}>
        {src}
      </div>
    );
  }

  // 图片地址 — 加载失败时显示 fallback
  const defaultFallback = (
    <div className={styles.fallback}>
      <VscQuestion size={Math.round(size * 0.45)} />
    </div>
  );

  if (imgError) {
    return (
      <div className={`${styles.container} ${shapeClass} ${className}`} style={containerStyle}>
        {fallback ?? defaultFallback}
      </div>
    );
  }

  return (
    <div className={`${styles.container} ${shapeClass} ${className}`} style={containerStyle}>
      <img className={styles.image} src={src} alt={alt} onError={() => setImgError(true)} />
    </div>
  );
}
