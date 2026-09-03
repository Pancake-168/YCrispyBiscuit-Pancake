import type { ReactNode } from 'react';
import Button from './Button';
import IconContainer from './IconContainer';
import styles from './Breadcrumb.module.css';
import { getIcon } from '@/icons';

interface BreadcrumbItem {
  label: ReactNode;
  onClick?: () => void;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

/**
 * Breadcrumb — 面包屑导航。
 * 点击项使用 Button 封装，最后一项作为当前页纯文本展示。
 */
export default function Breadcrumb({ items, className = '' }: BreadcrumbProps) {
  return (
    <nav className={`${styles.root} ${className}`} aria-label="面包屑">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <span className={styles.itemWrap} key={index}>
            {isLast ? (
              <span className={styles.current} aria-current="page">
                {item.label}
              </span>
            ) : item.onClick ? (
              <Button variant="subtle" className={styles.link} onClick={item.onClick}>
                {item.label}
              </Button>
            ) : (
              <span className={styles.muted}>{item.label}</span>
            )}
            {!isLast && (
              <IconContainer size={16} src={getIcon('chevronRight', 16, styles.separator)} />
            )}
          </span>
        );
      })}
    </nav>
  );
}

export type { BreadcrumbItem, BreadcrumbProps };
