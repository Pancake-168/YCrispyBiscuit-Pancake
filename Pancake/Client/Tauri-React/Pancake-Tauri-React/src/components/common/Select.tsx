import { useId } from 'react';
import * as RadixSelect from '@radix-ui/react-select';
import IconContainer from './IconContainer';
import styles from './Select.module.css';
import { getIcon } from '@/icons';

interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SelectProps {
  value: string;
  onChange: (v: string) => void;
  options: SelectOption[];
  placeholder?: string;
  label?: string;
  disabled?: boolean;
}

/**
 * Select — 下拉选择器。
 * Radix Select 做骨架，样式用自己的 CSS Module。
 */
export default function Select({
  value,
  onChange,
  options,
  placeholder,
  label,
  disabled = false,
}: SelectProps) {
  const generatedId = useId();

  return (
    <div className={styles.wrapper}>
      {label && (
        <span className={styles.label} id={`${generatedId}-label`}>
          {label}
        </span>
      )}
      <RadixSelect.Root value={value} onValueChange={onChange} disabled={disabled}>
        <RadixSelect.Trigger
          className={styles.trigger}
          aria-labelledby={label ? `${generatedId}-label` : undefined}
        >
          <RadixSelect.Value placeholder={placeholder}>
            {options.find((o) => o.value === value)?.label}
          </RadixSelect.Value>
          <RadixSelect.Icon>
            <IconContainer size={16} src={getIcon('chevronDown', 16, styles.chevron)} />
          </RadixSelect.Icon>
        </RadixSelect.Trigger>

        <RadixSelect.Portal>
          <RadixSelect.Content className={styles.content} position="popper" sideOffset={4}>
            <RadixSelect.Viewport>
              {options.map((opt) => (
                <RadixSelect.Item
                  key={opt.value}
                  value={opt.value}
                  disabled={opt.disabled}
                  className={styles.item}
                >
                  <RadixSelect.ItemText>{opt.label}</RadixSelect.ItemText>
                </RadixSelect.Item>
              ))}
            </RadixSelect.Viewport>
          </RadixSelect.Content>
        </RadixSelect.Portal>
      </RadixSelect.Root>
    </div>
  );
}

export type { SelectOption, SelectProps };
