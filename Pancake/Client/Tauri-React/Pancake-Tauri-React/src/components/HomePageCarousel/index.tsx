import { useState, useCallback, type ReactNode } from 'react';
import { MdKeyboardArrowUp, MdKeyboardArrowDown } from 'react-icons/md';
import styles from './index.module.css';

export interface CarouselItem {
  id: string;
  image: string;
  title: string;
  subtitle?: string;
  onClick?: () => void;
}

interface CarouselProps {
  items: CarouselItem[];
  /** 圆心（右边缘）到 A0 中心节点的距离，= 半圆半径 */
  radius?: number;
  /** 卡片总宽度（横向长条） */
  cardWidth?: number;
  /** 卡片总高度 */
  cardHeight?: number;
  /** 卡片内图片尺寸 */
  imageSize?: number;
  /** 自定义渲染，不传则用默认 image + title 长条布局 */
  renderItem?: (item: CarouselItem, index: number, isActive: boolean) => ReactNode;
}

/** 半圆角度步长：180° / 4 间隔 = 45° */
const ANGLE_STEP = Math.PI / 4;
/** 可见范围：A-2 ~ A2 */
const RANGE = 2;

/**
 * SemicircularCarousel — 纵向半圆弧轮播。
 *
 * 5 张横向长条卡片沿右边缘排成 180° 半圆弧，
 * 圆心紧贴右边缘，A0 距右边缘 R 且永久高亮，
 * 两端卡片渐变消失。上下箭头每次切换一个。
 */
export default function Carousel({
  items,
  radius = 160,
  cardWidth = 210,
  cardHeight = 56,
  imageSize = 44,
  renderItem,
}: CarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  /** 顺时针（↓）：前进一个，activeIndex 单调递增，不取模 */
  const stepDown = useCallback(() => {
    setActiveIndex((prev) => prev + 1);
  }, []);

  /** 逆时针（↑）：后退一个 */
  const stepUp = useCallback(() => {
    setActiveIndex((prev) => prev - 1);
  }, []);

  /** 容器：R + cardWidth 宽（容纳 A0 卡片向左延伸），2R 高 */
  const containerWidth = radius + cardWidth;
  const containerHeight = radius * 2;

  /**
   * 计算卡片在容器内的绝对定位。
   * 圆心 = 容器右侧 (containerWidth, radius)，即右边缘中点。
   * 卡片右边缘锚定在圆上坐标点，向左延伸 cardWidth。
   * 角度从水平向左（0° = A0）量起，+90° = 正上方 A2。
   */
  const getCardStyle = (offset: number) => {
    const angle = offset * ANGLE_STEP;
    const cosA = Math.cos(angle);
    const sinA = Math.sin(angle);

    // 圆上锚点（容器坐标系）
    const ax = containerWidth - radius * cosA; // 锚点 x
    const ay = radius - radius * sinA; // 锚点 y

    const abs = Math.abs(offset);
    const scale = 1 - Math.min(abs, RANGE) * 0.18;
    const opacity = Math.max(0, 1 - abs * 0.35);
    const zIndex = 10 - abs;

    return {
      left: ax - cardWidth,
      top: ay - cardHeight / 2,
      width: cardWidth,
      height: cardHeight,
      transform: `scale(${scale})`,
      opacity,
      zIndex,
    };
  };

  /** 可见窗口半径 */
  const fullRange = RANGE;

  return (
    <div
      className={styles.container}
      style={{
        width: containerWidth,
        height: containerHeight,
      }}
    >
      {/* 箭头：右边缘内侧，不参与圆弧坐标 */}
      <button className={`${styles.arrow} ${styles.arrowUp}`} onClick={stepUp} aria-label="上一个">
        <MdKeyboardArrowUp size={20} />
      </button>

      <button
        className={`${styles.arrow} ${styles.arrowDown}`}
        onClick={stepDown}
        aria-label="下一个"
      >
        <MdKeyboardArrowDown size={20} />
      </button>

      {/* 卡片：以 vp 为 key，始终渲染 5 张，位置随 activeIndex 变化动画过渡 */}
      {Array.from({ length: 2 * fullRange + 1 }, (_, i) => {
        const vp = activeIndex - fullRange + i;
        const offset = vp - activeIndex;
        const realIndex = ((vp % items.length) + items.length) % items.length;
        const item = items[realIndex];
        if (!item) return null;

        const inView = Math.abs(offset) <= RANGE;
        const isActive = offset === 0;
        const pos = getCardStyle(offset);

        return (
          <div
            key={vp}
            className={`${styles.card} ${isActive ? styles.cardActive : ''}`}
            style={{
              width: pos.width,
              height: pos.height,
              left: pos.left,
              top: pos.top,
              transform: pos.transform,
              opacity: inView ? pos.opacity : 0,
              zIndex: inView ? pos.zIndex : -1,
              pointerEvents: inView ? undefined : 'none',
            }}
            onClick={inView ? item.onClick : undefined}
          >
            {renderItem ? (
              renderItem(item, realIndex, isActive)
            ) : (
              <>
                <img
                  className={styles.cardImage}
                  src={item.image}
                  alt={item.title}
                  style={{ width: imageSize, height: imageSize }}
                  draggable={false}
                />
                <div className={styles.cardText}>
                  <span className={`${styles.cardTitle} ${isActive ? styles.cardTitleActive : ''}`}>
                    {item.title}
                  </span>
                  {item.subtitle && <span className={styles.cardSubtitle}>{item.subtitle}</span>}
                </div>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
