import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import * as RadixDialog from '@radix-ui/react-dialog';
import { VscSearch } from 'react-icons/vsc';
import Button from './Button';
import Input from './Input';
import styles from './CommandPalette.module.css';

interface CommandItem {
  id: string;
  label: ReactNode;
  keywords?: string;
  onSelect: () => void;
}

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: CommandItem[];
  placeholder?: string;
  emptyText?: string;
}

/**
 * CommandPalette — 命令面板。
 * 使用 Radix Dialog 做模态层，支持输入过滤、上下键选择、回车执行。
 */
export default function CommandPalette({
  open,
  onOpenChange,
  items,
  placeholder = '输入命令或搜索...',
  emptyText = '没有匹配命令',
}: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const [prevOpen, setPrevOpen] = useState(open);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // 每次从关闭切到打开时重置搜索和高亮，放在渲染期处理，避免 effect 级联
  if (prevOpen !== open) {
    setPrevOpen(open);
    if (open) {
      setQuery('');
      setActiveIndex(0);
    }
  }

  const filtered = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return items;
    return items.filter((item) =>
      (item.keywords ?? (typeof item.label === 'string' ? item.label : ''))
        .toLowerCase()
        .includes(keyword),
    );
  }, [items, query]);

  // 高亮索引只在渲染期收敛，不在 effect 中 setState
  const safeActiveIndex = filtered.length > 0 ? Math.min(activeIndex, filtered.length - 1) : 0;

  // 打开后聚焦输入框；聚焦属于外部 DOM 操作，不在此处重置 React 状态
  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  const runItem = (item: CommandItem) => {
    onOpenChange(false);
    item.onSelect();
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((prev) => (filtered.length ? (prev + 1) % filtered.length : 0));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((prev) =>
        filtered.length ? (prev - 1 + filtered.length) % filtered.length : 0,
      );
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const item = filtered[safeActiveIndex];
      if (item) runItem(item);
    } else if (event.key === 'Escape') {
      onOpenChange(false);
    }
  };

  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay className={styles.overlay} />
        <RadixDialog.Content className={styles.content} onKeyDown={handleKeyDown}>
          <div className={styles.searchBox}>
            <VscSearch className={styles.searchIcon} />
            <Input
              className={styles.input}
              value={query}
              onChange={(next) => {
                setQuery(next);
                setActiveIndex(0);
              }}
              placeholder={placeholder}
              inputRef={inputRef}
            />
          </div>
          <div className={styles.list}>
            {filtered.length > 0 ? (
              filtered.map((item, index) => (
                <Button
                  key={item.id}
                  variant="subtle"
                  block
                  className={`${styles.item} ${index === safeActiveIndex ? styles.active : ''}`}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => runItem(item)}
                >
                  {item.label}
                </Button>
              ))
            ) : (
              <div className={styles.empty}>{emptyText}</div>
            )}
          </div>
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}

export type { CommandItem, CommandPaletteProps };
