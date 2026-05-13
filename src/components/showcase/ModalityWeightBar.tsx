import React from 'react';
import {cn} from '../../lib/utils';

interface WeightItem {
  key: string;
  label: string;
  value: number;
  tone?: 'primary' | 'secondary' | 'tertiary' | 'error';
}

interface ModalityWeightBarProps {
  items: WeightItem[];
  compact?: boolean;
}

const toneClasses = {
  primary: 'bg-primary text-primary',
  secondary: 'bg-secondary text-secondary',
  tertiary: 'bg-tertiary text-tertiary',
  error: 'bg-error text-error',
} as const;

export const ModalityWeightBar: React.FC<ModalityWeightBarProps> = ({items, compact = false}) => {
  return (
    <div className={cn('space-y-3', compact && 'space-y-2')}>
      {items.map((item) => {
        const tone = toneClasses[item.tone ?? 'primary'];
        const percent = Math.round(item.value * 100);

        return (
          <div key={item.key}>
            <div className="mb-1.5 flex items-center justify-between gap-3 text-xs">
              <span className="font-medium text-on-surface-variant">{item.label}</span>
              <span className={cn('font-mono font-bold', tone.split(' ')[1])}>{percent}%</span>
            </div>
            <div className={cn('rounded-full bg-surface-container-highest', compact ? 'h-1.5' : 'h-2')}>
              <div className={cn('rounded-full transition-all duration-500', tone.split(' ')[0], compact ? 'h-1.5' : 'h-2')} style={{width: `${percent}%`}} />
            </div>
          </div>
        );
      })}
    </div>
  );
};
