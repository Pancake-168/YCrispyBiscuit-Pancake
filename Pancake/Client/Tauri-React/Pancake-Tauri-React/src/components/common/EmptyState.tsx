import type { ReactNode } from 'react';
import IconContainer from './IconContainer';
import { getIcon } from '@/icons';
import styles from './EmptyState.module.css';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

/**
 * EmptyState — 空状态占位。
 * 列表无数据、搜索无结果时显示。纯布局，使用全局 Token。
 */
export default function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className={styles.root}>
      <div className={styles.icon}>
        {icon ?? <IconContainer size={16} src={getIcon('folderOpened', 16)} />}
      </div>
      <span className={styles.title}>{title}</span>
      {description && <span className={styles.description}>{description}</span>}
      {action && <div className={styles.action}>{action}</div>}
    </div>
  );
}
