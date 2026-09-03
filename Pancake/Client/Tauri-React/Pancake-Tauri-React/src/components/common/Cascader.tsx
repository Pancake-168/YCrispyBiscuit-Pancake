import { useMemo, useState } from 'react';
import Popover from './Popover';
import Button from './Button';
import styles from './Cascader.module.css';

interface CascaderOption {
  value: string;
  label: string;
  children?: CascaderOption[];
  disabled?: boolean;
}

interface CascaderProps {
  value: string[];
  onChange: (value: string[]) => void;
  options: CascaderOption[];
  placeholder?: string;
  className?: string;
}

function findPathLabels(options: CascaderOption[], path: string[]) {
  const labels: string[] = [];
  let currentOptions = options;
  for (const segment of path) {
    const node = currentOptions.find((option) => option.value === segment);
    if (!node) break;
    labels.push(node.label);
    currentOptions = node.children ?? [];
  }
  return labels;
}

function buildColumns(options: CascaderOption[], path: string[]) {
  const columns: CascaderOption[][] = [options];
  let currentOptions = options;
  for (const segment of path) {
    const node = currentOptions.find((option) => option.value === segment);
    if (!node || !node.children) break;
    currentOptions = node.children;
    columns.push(currentOptions);
  }
  return columns;
}

/**
 * Cascader — 级联选择。
 * 使用 Radix Popover 承载多列面板，逐级选择后回填完整路径。
 */
export default function Cascader({
  value,
  onChange,
  options,
  placeholder = '请选择',
  className = '',
}: CascaderProps) {
  const [open, setOpen] = useState(false);
  const [activePath, setActivePath] = useState<string[]>(value);
  const columns = useMemo(() => buildColumns(options, activePath), [options, activePath]);
  const selectedLabels = useMemo(() => findPathLabels(options, value), [options, value]);

  const selectOption = (columnIndex: number, option: CascaderOption) => {
    // 点击当前列时，先丢弃该列之后已选路径
    const nextPath = activePath.slice(0, columnIndex);
    if (option.children?.length) {
      setActivePath([...nextPath, option.value]);
      return;
    }
    const fullPath = [...nextPath, option.value];
    onChange(fullPath);
    setOpen(false);
  };

  return (
    <div className={`${styles.wrapper} ${className}`}>
      <Popover
        open={open}
        onOpenChange={(next) => {
          // 打开时把当前已选路径作为浏览起点
          if (next) setActivePath(value);
          setOpen(next);
        }}
        contentClassName={styles.content}
        bareContent
        align="start"
        sideOffset={4}
        showArrow={false}
        trigger={
          <Button variant="secondary" block className={styles.trigger}>
            <span className={selectedLabels.length ? styles.text : styles.placeholder}>
              {selectedLabels.length ? selectedLabels.join(' / ') : placeholder}
            </span>
          </Button>
        }
      >
        <div className={styles.columns}>
          {columns.map((column, columnIndex) => (
            <div className={styles.column} key={columnIndex}>
              {column.map((option) => {
                const isActive = activePath[columnIndex] === option.value;
                const hasChildren = Boolean(option.children?.length);
                return (
                  <Button
                    key={option.value}
                    variant="subtle"
                    block
                    className={`${styles.option} ${isActive ? styles.active : ''}`}
                    disabled={option.disabled}
                    onClick={() => selectOption(columnIndex, option)}
                  >
                    <span className={styles.optionText}>{option.label}</span>
                    {hasChildren && <span className={styles.arrow}>›</span>}
                  </Button>
                );
              })}
            </div>
          ))}
        </div>
      </Popover>
    </div>
  );
}

export type { CascaderOption, CascaderProps };
