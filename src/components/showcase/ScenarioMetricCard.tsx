import React from 'react';
import {cn} from '../../lib/utils';

interface ScenarioMetricCardProps {
  label: string;
  value: string;
  description: string;
  tone: 'primary' | 'secondary' | 'error' | 'tertiary' | 'neutral';
}

const toneClasses = {
  primary: 'border-primary/20 bg-primary/10 text-primary',
  secondary: 'border-secondary/20 bg-secondary/10 text-secondary',
  error: 'border-error/20 bg-error/10 text-error',
  tertiary: 'border-tertiary/20 bg-tertiary/10 text-tertiary',
  neutral: 'border-outline-variant/10 bg-surface-container-low text-on-surface',
} as const;

export const ScenarioMetricCard: React.FC<ScenarioMetricCardProps> = ({label, value, description, tone}) => (
  <div className={cn('rounded-2xl border p-5', toneClasses[tone])}>
    <p className="text-xs font-bold uppercase tracking-widest opacity-80">{label}</p>
    <p className="mt-3 text-2xl font-bold">{value}</p>
    <p className="mt-2 text-xs leading-5 text-on-surface-variant">{description}</p>
  </div>
);
