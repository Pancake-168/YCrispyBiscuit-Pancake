import { useState } from 'react';
import Button from './Button';
import Calendar from './Calendar';
import IconContainer from './IconContainer';
import Popover from './Popover';
import styles from './DatePicker.module.css';
import { getIcon } from '@/icons';

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
 * 使用 Popover 承载 Calendar，选择日期后关闭并回填文本。
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
          <Button
            variant="secondary"
            className={styles.trigger}
            disabled={disabled}
            aria-label="选择日期"
          >
            <IconContainer size={16} src={getIcon('calendar', 16, styles.icon)} />
            <span className={display ? styles.text : styles.placeholder}>
              {display || placeholder}
            </span>
          </Button>
        }
      >
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
      </Popover>
    </div>
  );
}

export type { DatePickerProps };
