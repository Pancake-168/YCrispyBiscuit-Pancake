import { useMemo, useState } from 'react';
import Button from './Button';
import Input from './Input';
import ScrollArea from './ScrollArea';
import IconContainer from './IconContainer';
import Popover from './Popover';
import styles from './Combobox.module.css';
import { getIcon } from '@/icons';

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
 * 使用 Popover 承载弹层，Input 负责输入，选中后回填 option.label。
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
  const [draft, setDraft] = useState<string | null>(null);
  const [committedValue, setCommittedValue] = useState(value);
  const [open, setOpen] = useState(false);

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
    setDraft(null);
    onChange(option.value);
    setOpen(false);
  };

  return (
    <div className={`${styles.wrapper} ${className}`}>
      {label && <span className={styles.label}>{label}</span>}
      <Popover
        open={open}
        onOpenChange={(next) => {
          if (disabled) return;
          setOpen(next);
        }}
        contentClassName={styles.content}
        bareContent
        align="start"
        sideOffset={4}
        showArrow={false}
        trigger={
          <div className={styles.trigger}>
            <IconContainer size={16} className={styles.searchIcon} src={getIcon('search', 16)} />
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
            <IconContainer size={16} className={styles.chevron} src={getIcon('chevronDown', 16)} />
          </div>
        }
      >
        {filtered.length > 0 ? (
          <ScrollArea maxHeight={220}>
            <div className={styles.list}>
              {filtered.map((option) => (
                <Button
                  key={option.value}
                  variant="subtle"
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
      </Popover>
    </div>
  );
}

export type { ComboboxOption, ComboboxProps };
