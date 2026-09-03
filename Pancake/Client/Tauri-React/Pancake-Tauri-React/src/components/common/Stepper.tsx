import type { ReactNode } from 'react';
import Button from './Button';
import IconContainer from './IconContainer';
import styles from './Stepper.module.css';
import { getIcon } from '@/icons';

interface StepItem {
  title: ReactNode;
  description?: ReactNode;
}

interface StepperProps {
  steps: StepItem[];
  current: number;
  onChange?: (index: number) => void;
  className?: string;
}

/**
 * Stepper — 步骤条。
 * 使用 current 控制当前步骤；可点击已到达步骤切换。
 */
export default function Stepper({ steps, current, onChange, className = '' }: StepperProps) {
  const activeIndex = Math.min(steps.length - 1, Math.max(0, current));

  return (
    <ol className={`${styles.root} ${className}`}>
      {steps.map((step, index) => {
        const isCompleted = index < activeIndex;
        const isActive = index === activeIndex;
        const clickable = isCompleted || isActive || onChange === undefined;

        return (
          <li key={index} className={styles.item}>
            <Button
              variant="subtle"
              className={`${styles.indicator} ${isActive ? styles.indicatorActive : ''} ${isCompleted ? styles.indicatorDone : ''}`}
              disabled={!clickable || (!isCompleted && !isActive)}
              onClick={() => onChange?.(index)}
              aria-current={isActive ? 'step' : undefined}
            >
              {isCompleted ? <IconContainer size={14} src={getIcon('check', 14)} /> : index + 1}
            </Button>
            <div className={styles.text}>
              <span className={styles.title}>{step.title}</span>
              {step.description && <span className={styles.description}>{step.description}</span>}
            </div>
            {index < steps.length - 1 && <span className={styles.line} />}
          </li>
        );
      })}
    </ol>
  );
}

export type { StepItem, StepperProps };
