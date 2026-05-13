import React from 'react';
import {cn} from '../../lib/utils';

interface VectorPreviewProps {
  values: number[];
  tone?: 'primary' | 'secondary' | 'tertiary';
}

const toneClasses = {
  primary: 'bg-primary',
  secondary: 'bg-secondary',
  tertiary: 'bg-tertiary',
} as const;

export const VectorPreview: React.FC<VectorPreviewProps> = ({values, tone = 'primary'}) => {
  const maxAbs = Math.max(0.1, ...values.map((value) => Math.abs(value)));

  return (
    <div className="flex h-24 items-end gap-1.5 rounded-xl border border-outline-variant/10 bg-surface-container-high px-3 py-3">
      {values.map((value, index) => {
        const height = 20 + (Math.abs(value) / maxAbs) * 56;

        return (
          <div key={`${value}-${index}`} className="flex flex-1 flex-col items-center justify-end gap-1">
            <div
              className={cn('w-full max-w-4 rounded-t-sm opacity-80', value < 0 ? 'bg-error' : toneClasses[tone])}
              style={{height: `${height}px`}}
              title={value.toFixed(2)}
            />
            <div className={cn('h-1 w-1 rounded-full', value < 0 ? 'bg-error' : toneClasses[tone])} />
          </div>
        );
      })}
    </div>
  );
};
