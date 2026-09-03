import { useMemo, useState } from 'react';
import * as RadixPopover from '@radix-ui/react-popover';
import { VscChevronDown, VscChevronRight } from 'react-icons/vsc';
import Button from './Button';
import ScrollArea from './ScrollArea';
import styles from './TreeSelect.module.css';

interface TreeSelectOption {
  value: string;
  label: string;
  children?: TreeSelectOption[];
  disabled?: boolean;
}

interface TreeSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: TreeSelectOption[];
  placeholder?: string;
  emptyText?: string;
  className?: string;
}

function findLabelPath(
  options: TreeSelectOption[],
  target: string,
  trail: string[] = [],
): string[] | null {
  for (const option of options) {
    const nextTrail = [...trail, String(option.label)];
    if (option.value === target) return nextTrail;
    if (option.children) {
      const found = findLabelPath(option.children, target, nextTrail);
      if (found) return found;
    }
  }
  return null;
}

function renderTreeNodes({
  nodes,
  depth,
  expanded,
  toggleExpanded,
  selectedValue,
  onSelect,
}: {
  nodes: TreeSelectOption[];
  depth: number;
  expanded: Set<string>;
  toggleExpanded: (value: string) => void;
  selectedValue: string;
  onSelect: (value: string) => void;
}) {
  return nodes.map((node) => {
    const hasChildren = Boolean(node.children?.length);
    const isExpanded = hasChildren && expanded.has(node.value);
    const isSelected = node.value === selectedValue;
    return (
      <div key={node.value}>
        <div className={styles.nodeRow} style={{ paddingLeft: depth * 16 }}>
          {hasChildren ? (
            <Button
              variant="subtle"
              className={styles.expandBtn}
              onClick={() => toggleExpanded(node.value)}
              aria-label={isExpanded ? '折叠' : '展开'}
            >
              {isExpanded ? <VscChevronDown size={14} /> : <VscChevronRight size={14} />}
            </Button>
          ) : (
            <span className={styles.spacer} />
          )}
          <Button
            variant="subtle"
            block
            className={`${styles.option} ${isSelected ? styles.selected : ''}`}
            disabled={node.disabled}
            onClick={() => onSelect(node.value)}
          >
            {node.label}
          </Button>
        </div>
        {hasChildren && isExpanded && (
          <div>
            {renderTreeNodes({
              nodes: node.children ?? [],
              depth: depth + 1,
              expanded,
              toggleExpanded,
              selectedValue,
              onSelect,
            })}
          </div>
        )}
      </div>
    );
  });
}

/**
 * TreeSelect — 树形选择。
 * 使用 Radix Popover 承载弹层，支持展开/折叠和选择叶子或父节点。
 */
export default function TreeSelect({
  value,
  onChange,
  options,
  placeholder = '请选择',
  emptyText = '无数据',
  className = '',
}: TreeSelectProps) {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const selectedPath = useMemo(() => findLabelPath(options, value), [options, value]);

  const toggleExpanded = (nodeValue: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(nodeValue)) {
        next.delete(nodeValue);
      } else {
        next.add(nodeValue);
      }
      return next;
    });
  };

  return (
    <div className={`${styles.wrapper} ${className}`}>
      <RadixPopover.Root open={open} onOpenChange={setOpen}>
        <RadixPopover.Trigger asChild>
          <Button variant="secondary" block className={styles.trigger}>
            <span className={selectedPath?.length ? styles.text : styles.placeholder}>
              {selectedPath?.length ? selectedPath.join(' / ') : placeholder}
            </span>
          </Button>
        </RadixPopover.Trigger>
        <RadixPopover.Portal>
          <RadixPopover.Content className={styles.content} align="start" sideOffset={4}>
            <ScrollArea maxHeight={280}>
              {options.length > 0 ? (
                renderTreeNodes({
                  nodes: options,
                  depth: 0,
                  expanded,
                  toggleExpanded,
                  selectedValue: value,
                  onSelect: (nextValue) => {
                    onChange(nextValue);
                    setOpen(false);
                  },
                })
              ) : (
                <div className={styles.empty}>{emptyText}</div>
              )}
            </ScrollArea>
          </RadixPopover.Content>
        </RadixPopover.Portal>
      </RadixPopover.Root>
    </div>
  );
}

export type { TreeSelectOption, TreeSelectProps };
