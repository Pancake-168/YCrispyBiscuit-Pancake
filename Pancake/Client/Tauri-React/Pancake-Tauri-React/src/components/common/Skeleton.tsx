import styles from './Skeleton.module.css';

interface SkeletonProps {
  variant?: 'text' | 'circle' | 'rect';
  width?: number | string;
  height?: number | string;
  count?: number;
}

/**
 * Skeleton — 骨架屏，内容加载中的占位动画。
 */
export default function Skeleton({ variant = 'text', width, height, count = 1 }: SkeletonProps) {
  const variantClass =
    variant === 'circle' ? styles.circle : variant === 'rect' ? styles.rect : styles.text;

  const baseStyle: React.CSSProperties = {
    width: width ?? (variant === 'circle' ? height || 32 : '100%'),
    height: height ?? (variant === 'circle' ? width || 32 : variant === 'rect' ? 60 : 14),
  };

  if (variant === 'text' && count > 1) {
    // 多行段落：最后一行短一截 (70%)
    return (
      <div className={styles.wrapper}>
        {Array.from({ length: count }, (_, i) => (
          <div
            key={i}
            className={`${styles.root} ${variantClass} ${styles.shimmer} ${styles.row}`}
            style={{
              ...baseStyle,
              width: i === count - 1 ? '70%' : '100%',
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          className={`${styles.root} ${variantClass} ${styles.shimmer}`}
          style={baseStyle}
        />
      ))}
    </>
  );
}
