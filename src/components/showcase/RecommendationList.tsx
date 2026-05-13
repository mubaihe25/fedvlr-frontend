import React from 'react';
import {cn} from '../../lib/utils';
import type {AttackDefenseRecommendation, RecommendationStatus} from '../../mock/showcase';

interface RecommendationListProps {
  title: string;
  description: string;
  items: AttackDefenseRecommendation[];
  tone: 'baseline' | 'attack' | 'defense';
}

const toneClasses = {
  baseline: {
    icon: 'text-primary',
    border: 'border-primary/20',
    badge: 'bg-primary/10 text-primary',
  },
  attack: {
    icon: 'text-error',
    border: 'border-error/20',
    badge: 'bg-error/10 text-error',
  },
  defense: {
    icon: 'text-tertiary',
    border: 'border-tertiary/20',
    badge: 'bg-tertiary/10 text-tertiary',
  },
} as const;

const statusLabels: Record<RecommendationStatus, string> = {
  stable: '正常保留',
  shifted: '排名下降',
  injected: '异常注入',
  recovered: '防御恢复',
  suppressed: '异常压制',
};

const statusClasses: Record<RecommendationStatus, string> = {
  stable: 'bg-primary/10 text-primary',
  shifted: 'bg-error/10 text-error',
  injected: 'bg-error/15 text-error',
  recovered: 'bg-tertiary/10 text-tertiary',
  suppressed: 'bg-secondary/10 text-secondary',
};

export const RecommendationList: React.FC<RecommendationListProps> = ({title, description, items, tone}) => {
  const toneClass = toneClasses[tone];

  return (
    <div className={cn('rounded-2xl border bg-surface-container-low p-5', toneClass.border)}>
      <div className="mb-5">
        <div className={cn('mb-2 inline-flex rounded-full px-3 py-1 text-xs font-bold', toneClass.badge)}>{title}</div>
        <p className="text-sm leading-6 text-on-surface-variant">{description}</p>
      </div>
      <div className="space-y-3">
        {items.map((item) => (
          <div key={`${item.rank}-${item.itemTitle}`} className="rounded-xl border border-outline-variant/10 bg-surface-container-high p-4">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="mb-1 flex items-center gap-2">
                  <span className={cn('font-mono text-xs font-bold', toneClass.icon)}>#{item.rank}</span>
                  {item.rankChange ? (
                    <span className="rounded bg-surface-container-highest px-2 py-0.5 font-mono text-[10px] text-on-surface-variant">
                      {item.rankChange}
                    </span>
                  ) : null}
                </div>
                <h4 className="font-bold text-on-surface">{item.itemTitle}</h4>
              </div>
              <span className="rounded-full bg-surface-container-highest px-3 py-1 font-mono text-xs text-on-surface">
                {item.score.toFixed(2)}
              </span>
            </div>
            <p className="text-xs leading-5 text-on-surface-variant">{item.reason}</p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-surface-container-highest px-2.5 py-1 text-[11px] text-on-surface">
                {item.mainModality}
              </span>
              <span className={cn('rounded-full px-2.5 py-1 text-[11px] font-bold', statusClasses[item.status])}>
                {statusLabels[item.status]}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
