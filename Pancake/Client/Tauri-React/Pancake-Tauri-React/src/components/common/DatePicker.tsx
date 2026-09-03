import { useState } from 'react';
import * as RadixPopover from '@radix-ui/react-popover';
import { VscCalendar } from 'react-icons/vsc';
import Button from './Button';
import Calendar from './Calendar';
import styles from './DatePicker.module.css';

interface DatePickerProps {
  value?: Date;
  defaultValue?: Date;
  onChange?: (date: Date) => void;
  placeholder?: string;
  label?: string;
  disabled?: boolean;
  min?: Date;
  max?: Date;
  className?: string;
}

function pad(value: number) {
  return String(value).padStart(2, '0');
}

function formatDate(date?: Date) {
  if (!date) return '';
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/**
 * DatePicker — 日期选择。
 * 使用 Radix Popover 承载 Calendar，选择日期后关闭并回填文本。
 */
export default function DatePicker({
  value,
  defaultValue,
  onChange,
  placeholder = '选择日期',
  label,
  disabled = false,
  min,
  max,
  className = '',
}: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const display = formatDate(value ?? defaultValue);

  return (
    <div className={`${styles.wrapper} ${className}`}>
      {label && <span className={styles.label}>{label}</span>}
      <RadixPopover.Root
        open={open}
        onOpenChange={(next) => {
          if (disabled) return;
          setOpen(next);
        }}
      >
        <RadixPopover.Trigger asChild>
          <Button
            variant="secondary"
            className={styles.trigger}
            disabled={disabled}
            aria-label="选择日期"
          >
            <VscCalendar className={styles.icon} />
            <span className={display ? styles.text : styles.placeholder}>
              {display || placeholder}
            </span>
          </Button>
        </RadixPopover.Trigger>
        <RadixPopover.Portal>
          <RadixPopover.Content className={styles.content} align="start" sideOffset={4}>
            <Calendar
              value={value}
              defaultValue={defaultValue}
              onChange={(date) => {
                onChange?.(date);
                setOpen(false);
              }}
              min={min}
              max={max}
            />
          </RadixPopover.Content>
        </RadixPopover.Portal>
      </RadixPopover.Root>
    </div>
  );
}

export type { DatePickerProps };
