import { Fragment, useId, type ReactNode } from 'react';
import * as RadixRadioGroup from '@radix-ui/react-radio-group';
import styles from './RadioGroup.module.css';
import Label from './Label';

interface RadioOption {
  value: string;
  label?: ReactNode;
  content?: ReactNode;
  disabled?: boolean;
  hideIndicator?: boolean;
  itemClassName?: string;
}

interface RadioGroupProps {
  value: string;
  onChange: (value: string) => void;
  options: RadioOption[];
  label?: string;
  disabled?: boolean;
  className?: string;
  groupClassName?: string;
  optionClassName?: string;
  itemClassName?: string;
  bare?: boolean;
  wrapOptions?: boolean;
}

/**
 * RadioGroup — 单选组。
 * Radix RadioGroup 做骨架，键盘方向键切换选项。
 */
export default function RadioGroup({
  value,
  onChange,
  options,
  label,
  disabled = false,
  className = '',
  groupClassName = '',
  optionClassName = '',
  itemClassName = '',
  bare = false,
  wrapOptions = true,
}: RadioGroupProps) {
  const generatedId = useId();

  const renderItem = (option: RadioOption) => {
    const optionId = `${generatedId}-${option.value}`;
    const hasContent = option.content !== undefined;
    const item = (
      <RadixRadioGroup.Item
        id={optionId}
        value={option.value}
        disabled={disabled || option.disabled}
        className={`${styles.item} ${itemClassName} ${option.itemClassName ?? ''}`}
      >
        {hasContent ? (
          option.content
        ) : (
          <>{!option.hideIndicator && <RadixRadioGroup.Indicator className={styles.indicator} />}</>
        )}
      </RadixRadioGroup.Item>
    );

    if (!wrapOptions) return item;

    return (
      <div className={`${styles.option} ${optionClassName}`} key={option.value}>
        {item}
        {!hasContent && option.label !== undefined && (
          <Label className={styles.optionLabel} htmlFor={optionId}>
            {option.label}
          </Label>
        )}
      </div>
    );
  };

  const root = (
    <RadixRadioGroup.Root
      value={value}
      onValueChange={onChange}
      className={bare ? groupClassName : `${styles.group} ${groupClassName}`}
    >
      {options.map((option) => (
        <Fragment key={option.value}>{renderItem(option)}</Fragment>
      ))}
    </RadixRadioGroup.Root>
  );

  if (bare) return root;

  return (
    <div className={`${styles.wrapper} ${className}`}>
      {label && <span className={styles.label}>{label}</span>}
      {root}
    </div>
  );
}

export type { RadioOption, RadioGroupProps };
