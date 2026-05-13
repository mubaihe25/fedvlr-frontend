import React from 'react';
import {cn} from '../../lib/utils';

interface ShowcasePageHeaderProps {
  eyebrow: string;
  title: string;
  description: string;
  chips?: string[];
  icon?: React.ComponentType<{className?: string}>;
  tone?: 'primary' | 'secondary' | 'tertiary' | 'error';
}

const toneClasses = {
  primary: 'border-primary/20 bg-primary/10 text-primary',
  secondary: 'border-secondary/20 bg-secondary/10 text-secondary',
  tertiary: 'border-tertiary/20 bg-tertiary/10 text-tertiary',
  error: 'border-error/20 bg-error/10 text-error',
} as const;

export const ShowcasePageHeader: React.FC<ShowcasePageHeaderProps> = ({
  eyebrow,
  title,
  description,
  chips = [],
  icon: Icon,
  tone = 'primary',
}) => (
  <section className="rounded-2xl border border-outline-variant/10 bg-surface-container-low p-8">
    <div className={cn('mb-4 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-bold', toneClasses[tone])}>
      {Icon ? <Icon className="h-3.5 w-3.5" /> : null}
      {eyebrow}
    </div>
    <h2 className="font-headline text-4xl font-bold tracking-tight text-on-surface md:text-5xl">{title}</h2>
    <p className="mt-4 max-w-4xl text-sm leading-7 text-on-surface-variant">{description}</p>
    {chips.length ? (
      <div className="mt-5 flex flex-wrap gap-2">
        {chips.map((chip) => (
          <span key={chip} className="rounded-full border border-outline-variant/10 bg-surface-container-high px-3 py-1 text-xs font-semibold text-on-surface">
            {chip}
          </span>
        ))}
      </div>
    ) : null}
  </section>
);
