import { useState } from 'react';
import Button from './Button';
import IconContainer from './IconContainer';
import styles from './Calendar.module.css';
import { getIcon } from '@/icons';

interface CalendarProps {
  value?: Date;
  defaultValue?: Date;
  onChange?: (date: Date) => void;
  min?: Date;
  max?: Date;
  className?: string;
}

const WEEK_LABELS = ['一', '二', '三', '四', '五', '六', '日'];

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function isSameDay(a: Date | undefined, b: Date) {
  return (
    a !== undefined &&
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/**
 * Calendar — 日历面板。
 * 支持受控/非受控日期、月份翻页、最小/最大日期限制。
 */
export default function Calendar({
  value,
  defaultValue,
  onChange,
  min,
  max,
  className = '',
}: CalendarProps) {
  const today = startOfDay(new Date());
  const initialDate = startOfDay(value ?? defaultValue ?? today);
  const [viewDate, setViewDate] = useState(
    () => new Date(initialDate.getFullYear(), initialDate.getMonth(), 1),
  );
  const [selectedInternal, setSelectedInternal] = useState<Date | undefined>(defaultValue);
  const [prevValueKey, setPrevValueKey] = useState(value ? value.toDateString() : '');

  // 外部受控 value 的日期变化时，把视图同步到对应月份
  const valueKey = value ? value.toDateString() : '';
  if (valueKey !== prevValueKey) {
    setPrevValueKey(valueKey);
    if (value) {
      setViewDate(new Date(value.getFullYear(), value.getMonth(), 1));
    }
  }

  const selected = value ?? selectedInternal;
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1);
  // 周一开始：周日偏移 6，周一到周六偏移 0-5
  const leadingBlanks = (firstDay.getDay() + 6) % 7;
  const cells = Array.from({ length: 42 }, (_, index) => {
    const date = new Date(year, month, index - leadingBlanks + 1);
    const inCurrentMonth = date.getMonth() === month;
    const disabled =
      (min !== undefined && date < startOfDay(min)) ||
      (max !== undefined && date > startOfDay(max));
    return { date, inCurrentMonth, disabled };
  });

  const changeMonth = (delta: number) => {
    setViewDate(new Date(year, month + delta, 1));
  };

  const selectDate = (date: Date) => {
    if (min !== undefined && date < startOfDay(min)) return;
    if (max !== undefined && date > startOfDay(max)) return;
    setSelectedInternal(date);
    onChange?.(date);
  };

  return (
    <div className={`${styles.root} ${className}`}>
      <div className={styles.header}>
        <Button
          variant="subtle"
          className={styles.navBtn}
          onClick={() => changeMonth(-1)}
          aria-label="上个月"
        >
          <IconContainer size={16} src={getIcon('chevronLeft', 16)} />
        </Button>
        <span className={styles.title}>
          {year} 年 {month + 1} 月
        </span>
        <Button
          variant="subtle"
          className={styles.navBtn}
          onClick={() => changeMonth(1)}
          aria-label="下个月"
        >
          <IconContainer size={16} src={getIcon('chevronRight', 16)} />
        </Button>
      </div>
      <div className={styles.weekRow}>
        {WEEK_LABELS.map((label) => (
          <span key={label} className={styles.weekLabel}>
            {label}
          </span>
        ))}
      </div>
      <div className={styles.grid}>
        {cells.map(({ date, inCurrentMonth, disabled }, index) => {
          const selectedClass = isSameDay(selected, date) ? styles.selected : '';
          const outsideClass = inCurrentMonth ? '' : styles.outside;
          const todayClass = isSameDay(today, date) ? styles.today : '';
          return (
            <Button
              key={index}
              variant="subtle"
              className={`${styles.day} ${outsideClass} ${todayClass} ${selectedClass}`}
              disabled={disabled}
              onClick={() => selectDate(date)}
            >
              {date.getDate()}
            </Button>
          );
        })}
      </div>
    </div>
  );
}

export type { CalendarProps };
