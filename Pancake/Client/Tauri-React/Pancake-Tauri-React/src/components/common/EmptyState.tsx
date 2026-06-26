import type { ReactNode } from 'react';
import { VscFolderOpened } from 'react-icons/vsc';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

/**
 * EmptyState — 空状态占位。
 * 列表无数据、搜索无结果时显示。纯布局，使用全局 Token，不需要 module.css。
 */
export default function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 'var(--spacing-md)',
        padding: 'var(--spacing-2xl)',
        border: '1px dashed var(--glass-brd)',
        borderRadius: 'var(--radius-xl)',
        textAlign: 'center',
      }}
    >
      <div style={{ color: 'var(--muted)', fontSize: 48, lineHeight: 1 }}>
        {icon ?? <VscFolderOpened />}
      </div>
      <span
        style={{
          color: 'var(--text)',
          fontWeight: 600,
          fontSize: 'var(--text-md)',
        }}
      >
        {title}
      </span>
      {description && (
        <span style={{ color: 'var(--muted)', fontSize: 'var(--text-sm)' }}>{description}</span>
      )}
      {action && <div style={{ marginTop: 'var(--spacing-sm)' }}>{action}</div>}
    </div>
  );
}
