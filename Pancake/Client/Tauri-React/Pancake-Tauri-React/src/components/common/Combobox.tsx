import { useMemo, useState } from 'react';
import * as RadixPopover from '@radix-ui/react-popover';
import { VscChevronDown, VscSearch } from 'react-icons/vsc';
import Button from './Button';
import Input from './Input';
import ScrollArea from './ScrollArea';
import styles from './Combobox.module.css';

interface ComboboxOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface ComboboxProps {
  value: string;
  onChange: (value: string) => void;
  options: ComboboxOption[];
  placeholder?: string;
  label?: string;
  disabled?: boolean;
  emptyText?: string;
  className?: string;
}

/**
 * Combobox — 可输入过滤的下拉选择框。
 * 使用 Radix Popover 承载弹层，Input 负责输入，选中后回填 option.label。
 */
export default function Combobox({
  value,
  onChange,
  options,
  placeholder,
  label,
  disabled = false,
  emptyText = '无匹配选项',
  className = '',
}: ComboboxProps) {
  const selectedLabel = options.find((option) => option.value === value)?.label ?? '';
  // draft 表示用户正在输入的文本；未输入时回退到受控 value 对应的 label
  const [draft, setDraft] = useState<string | null>(null);
  const [committedValue, setCommittedValue] = useState(value);
  const [open, setOpen] = useState(false);

  // 受控 value 变化时，清除尚未提交的输入草稿
  if (committedValue !== value) {
    setCommittedValue(value);
    setDraft(null);
  }

  const query = draft ?? selectedLabel;

  const filtered = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return options;
    return options.filter((option) => option.label.toLowerCase().includes(keyword));
  }, [query, options]);

  const selectOption = (option: ComboboxOption) => {
    // 选中后清除草稿，让显示值回到受控 value 的 label
    setDraft(null);
    onChange(option.value);
    setOpen(false);
  };

  return (
    <div className={`${styles.wrapper} ${className}`}>
      {label && <span className={styles.label}>{label}</span>}
      <RadixPopover.Root
        open={open}
        onOpenChange={(next) => {
          // 禁用状态下不允许展开
          if (disabled) return;
          setOpen(next);
        }}
      >
        <RadixPopover.Trigger asChild>
          <div className={styles.trigger}>
            <VscSearch className={styles.searchIcon} />
            <Input
              className={styles.input}
              value={query}
              onChange={(next) => {
                setDraft(next);
                setOpen(true);
              }}
              placeholder={placeholder}
              disabled={disabled}
            />
            <VscChevronDown className={styles.chevron} />
          </div>
        </RadixPopover.Trigger>
        <RadixPopover.Portal>
          <RadixPopover.Content className={styles.content} align="start" sideOffset={4}>
            {filtered.length > 0 ? (
              <ScrollArea maxHeight={220}>
                <div className={styles.list}>
                  {filtered.map((option) => (
                    <Button
                      key={option.value}
                      variant="subtle"
                      block
                      className={styles.option}
                      disabled={option.disabled}
                      onClick={() => selectOption(option)}
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <div className={styles.empty}>{emptyText}</div>
            )}
          </RadixPopover.Content>
        </RadixPopover.Portal>
      </RadixPopover.Root>
    </div>
  );
}

export type { ComboboxOption, ComboboxProps };
