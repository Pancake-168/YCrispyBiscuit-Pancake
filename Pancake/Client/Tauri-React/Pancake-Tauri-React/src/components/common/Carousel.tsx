import { useState, useCallback, type ReactNode } from 'react';
import { MdKeyboardArrowUp, MdKeyboardArrowDown } from 'react-icons/md';
import styles from './Carousel.module.css';

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

/** 可视偏移槽位：相对于 activeIndex */
const VISIBLE_OFFSETS = [-2, -1, 0, 1, 2];

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

  /** 顺时针（↓）：前进一个 */
  const stepDown = useCallback(() => {
    setActiveIndex((prev) => (prev + 1) % items.length);
  }, [items.length]);

  /** 逆时针（↑）：后退一个 */
  const stepUp = useCallback(() => {
    setActiveIndex((prev) => (prev - 1 + items.length) % items.length);
  }, [items.length]);

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
    const angle = offset * ANGLE_STEP; // -90° ~ 90°
    const cosA = Math.cos(angle);
    const sinA = Math.sin(angle);

    // 圆上锚点（容器坐标系）
    const ax = containerWidth - radius * (1 - cosA); // 锚点 x
    const ay = radius - radius * sinA; // 锚点 y

    const abs = Math.abs(offset);
    const scale = 1 - abs * 0.18;
    const opacity = 1 - abs * 0.35;
    const zIndex = 10 - abs;

    // 卡片右边缘 = 锚点 x，向左摆 cardWidth
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

  /** 循环取 items 下标 */
  const getItemIndex = (offset: number) => {
    return (((activeIndex + offset) % items.length) + items.length) % items.length;
  };

  return (
    <div
      className={styles.container}
      style={{
        width: containerWidth,
        height: containerHeight,
      }}
    >
      {/* 箭头：右边缘内侧，不参与圆弧坐标 */}
      <button
        className={`${styles.arrow} ${styles.arrowUp}`}
        onClick={stepUp}
        aria-label="上一个"
      >
        <MdKeyboardArrowUp size={20} />
      </button>

      <button
        className={`${styles.arrow} ${styles.arrowDown}`}
        onClick={stepDown}
        aria-label="下一个"
      >
        <MdKeyboardArrowDown size={20} />
      </button>

      {/* 卡片 */}
      {VISIBLE_OFFSETS.map((offset) => {
        const itemIndex = getItemIndex(offset);
        const item = items[itemIndex];
        if (!item) return null;

        const isActive = offset === 0;
        const pos = getCardStyle(offset);

        return (
          <div
            key={`${item.id}-${itemIndex}`}
            className={`${styles.card} ${isActive ? styles.cardActive : ''}`}
            style={{
              width: pos.width,
              height: pos.height,
              left: pos.left,
              top: pos.top,
              transform: pos.transform,
              opacity: pos.opacity,
              zIndex: pos.zIndex,
            }}
            onClick={item.onClick}
          >
            {renderItem ? (
              renderItem(item, itemIndex, isActive)
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
                  {item.subtitle && (
                    <span className={styles.cardSubtitle}>{item.subtitle}</span>
                  )}
                </div>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
