import React from 'react';
import {cn} from '../../lib/utils';
import type {ShowcaseRecommendationItem} from '../../types/showcase';

interface RecommendationListProps {
  title: string;
  description: string;
  items: ShowcaseRecommendationItem[];
  tone: 'baseline' | 'attack' | 'defense';
}

const MAX_VISIBLE_ITEMS = 12;

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

const statusLabels: Record<string, string> = {
  stable: '正常保留',
  shifted: '排名下降',
  injected: '异常注入',
  recovered: '防御恢复',
  suppressed: '异常压制',
};

const statusClasses: Record<string, string> = {
  stable: 'bg-primary/10 text-primary',
  shifted: 'bg-error/10 text-error',
  injected: 'bg-error/15 text-error',
  recovered: 'bg-tertiary/10 text-tertiary',
  suppressed: 'bg-secondary/10 text-secondary',
};

const formatScore = (score?: number | null) => (typeof score === 'number' && Number.isFinite(score) ? score.toFixed(2) : null);

const getItemTitle = (item: ShowcaseRecommendationItem) => item.title ?? (item.itemId ? `Item ${item.itemId}` : '未命名物品');

const getStatusLabel = (status?: string | null) => {
  if (!status) {
    return 'artifact';
  }

  return statusLabels[status] ?? status;
};

const getStatusClass = (status?: string | null) => {
  if (!status) {
    return 'bg-surface-container-highest text-on-surface-variant';
  }

  return statusClasses[status] ?? 'bg-secondary/10 text-secondary';
};

export const RecommendationList: React.FC<RecommendationListProps> = ({title, description, items, tone}) => {
  const toneClass = toneClasses[tone];
  const visibleItems = items.slice(0, MAX_VISIBLE_ITEMS);

  return (
    <div className={cn('rounded-2xl border bg-surface-container-low p-5', toneClass.border)}>
      <div className="mb-5">
        <div className={cn('mb-2 inline-flex rounded-full px-3 py-1 text-xs font-bold', toneClass.badge)}>{title}</div>
        <p className="text-sm leading-6 text-on-surface-variant">{description}</p>
        {items.length > MAX_VISIBLE_ITEMS ? (
          <p className="mt-2 text-xs text-on-surface-variant">
            当前 artifact 共 {items.length} 条，页面展示前 {MAX_VISIBLE_ITEMS} 条用于快速检查。
          </p>
        ) : null}
      </div>
      <div className="space-y-3">
        {items.length ? (
          visibleItems.map((item, index) => {
            const score = formatScore(item.score);
            const itemTitle = getItemTitle(item);

            return (
              <div key={`${item.rank ?? index}-${item.itemId ?? itemTitle}`} className="rounded-xl border border-outline-variant/10 bg-surface-container-high p-4">
                <div className="mb-3 grid grid-cols-[56px_minmax(0,1fr)] gap-3">
                  {item.imageUrl ? (
                    <img
                      className="h-14 w-14 rounded-lg object-cover"
                      src={item.imageUrl}
                      alt={itemTitle}
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className={cn('flex h-14 w-14 items-center justify-center rounded-lg border font-mono text-xs font-bold', toneClass.border, toneClass.icon)}>
                      #{item.rank ?? index + 1}
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <span className={cn('font-mono text-xs font-bold', toneClass.icon)}>#{item.rank ?? index + 1}</span>
                      {item.itemId ? (
                        <span className="rounded bg-surface-container-highest px-2 py-0.5 font-mono text-[10px] text-on-surface-variant">
                          {item.itemId}
                        </span>
                      ) : null}
                      {item.rankChange ? (
                        <span className="rounded bg-surface-container-highest px-2 py-0.5 font-mono text-[10px] text-on-surface-variant">
                          {item.rankChange}
                        </span>
                      ) : null}
                    </div>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h4 className="break-words font-bold text-on-surface">{itemTitle}</h4>
                        {item.category ? <p className="mt-1 text-[11px] text-on-surface-variant">{item.category}</p> : null}
                      </div>
                      {score ? (
                        <span className="shrink-0 rounded-full bg-surface-container-highest px-3 py-1 font-mono text-xs text-on-surface">
                          {score}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>
                {item.reason ? <p className="text-xs leading-5 text-on-surface-variant">{item.reason}</p> : null}
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {item.mainModality ? (
                    <span className="rounded-full bg-surface-container-highest px-2.5 py-1 text-[11px] text-on-surface">
                      {item.mainModality}
                    </span>
                  ) : null}
                  {item.rankChange ? (
                    <span className="rounded-full bg-surface-container-highest px-2.5 py-1 text-[11px] text-on-surface-variant">
                      rank {item.rankChange}
                    </span>
                  ) : null}
                  <span className={cn('rounded-full px-2.5 py-1 text-[11px] font-bold', getStatusClass(item.status))}>
                    {getStatusLabel(item.status)}
                  </span>
                </div>
              </div>
            );
          })
        ) : (
          <div className="rounded-xl border border-outline-variant/10 bg-surface-container-high px-4 py-5 text-sm text-on-surface-variant">
            暂无 / 不适用
          </div>
        )}
      </div>
    </div>
  );
};
