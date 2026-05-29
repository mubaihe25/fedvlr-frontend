import React from 'react';
import {motion} from 'motion/react';
import {ChevronDown, ChevronUp, ImageOff, Target} from 'lucide-react';
import {cn} from '../../lib/utils';
import type {ShowcaseRecommendationComparison, ShowcaseRecommendationItem} from '../../types/showcase';

interface RecommendationComparisonBoardProps {
  comparison?: ShowcaseRecommendationComparison | null;
  targetItemId?: string | number | null;
}

const DEFAULT_VISIBLE_COUNT = 5;
const EXPANDED_VISIBLE_COUNT = 15;
const MAX_VISIBLE_COUNT = 50;

const columns = [
  {key: 'baseline', title: '正常推荐', tone: 'cyan', empty: '暂无正常推荐'},
  {key: 'attack', title: '攻击后推荐', tone: 'rose', empty: '暂无攻击后推荐'},
  {key: 'defense', title: '防御后推荐 / 暂无防御', tone: 'emerald', empty: '暂无防御结果'},
] as const;

const toneClass = {
  cyan: 'border-sky-200/30 bg-sky-200/10 text-sky-100',
  rose: 'border-rose-200/30 bg-rose-200/10 text-rose-100',
  emerald: 'border-emerald-200/30 bg-emerald-200/10 text-emerald-100',
} as const;

const blockedImage = (value?: string | null) => !value || /^[a-zA-Z]:[\\/]/.test(value) || value.startsWith('\\\\');

const imageSources = (item: ShowcaseRecommendationItem) =>
  [item.localImageUrl, item.imageUrl].filter((value): value is string => !blockedImage(value));

const ProductImage: React.FC<{item: ShowcaseRecommendationItem; title: string; tone: keyof typeof toneClass}> = ({item, title, tone}) => {
  const sources = imageSources(item);
  const [sourceIndex, setSourceIndex] = React.useState(0);
  const source = sources[sourceIndex];

  React.useEffect(() => {
    setSourceIndex(0);
  }, [item.itemId, item.localImageUrl, item.imageUrl]);

  if (source) {
    return (
      <img
        className="h-20 w-20 rounded-2xl object-cover"
        src={source}
        alt={title}
        referrerPolicy="no-referrer"
        onError={() => setSourceIndex((index) => index + 1)}
      />
    );
  }

  return (
    <div className={cn('flex h-20 w-20 items-center justify-center rounded-2xl border', toneClass[tone])}>
      <ImageOff className="h-6 w-6" />
    </div>
  );
};

const getTitle = (item: ShowcaseRecommendationItem) => item.title ?? (item.itemId ? `商品 ${item.itemId}` : '未命名商品');

const sameItem = (left?: string | number | null, right?: string | number | null) =>
  left !== undefined && left !== null && right !== undefined && right !== null && String(left) === String(right);

export const RecommendationComparisonBoard: React.FC<RecommendationComparisonBoardProps> = ({comparison, targetItemId}) => {
  const [visibleCounts, setVisibleCounts] = React.useState<Record<string, number>>({});

  const setColumnLimit = (key: string, count: number) => {
    setVisibleCounts((current) => ({...current, [key]: count}));
  };

  return (
    <section className="sandbox-panel sandbox-glow rounded-[28px] p-5">
      <div className="mb-5 flex flex-col justify-between gap-3 md:flex-row md:items-end">
        <div>
          <p className="text-xs font-bold tracking-[0.2em] text-cyan-100/75">推荐对照</p>
          <h3 className="mt-1 text-xl font-bold text-white">三列推荐商品变化</h3>
        </div>
        <p className="max-w-2xl text-xs leading-5 text-slate-400">
          每列默认展示 5 个商品，可展开查看更多；图片优先使用本地缓存，其次使用原始链接，失败时显示占位图。分数缺失时不显示。
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        {columns.map((column) => {
          const allItems = comparison?.[column.key] ?? [];
          const visibleCount = visibleCounts[column.key] ?? DEFAULT_VISIBLE_COUNT;
          const items = allItems.slice(0, Math.min(visibleCount, MAX_VISIBLE_COUNT));
          const hiddenCount = Math.max(0, allItems.length - DEFAULT_VISIBLE_COUNT);
          const maxCount = Math.min(MAX_VISIBLE_COUNT, allItems.length);

          return (
            <div key={column.key} className="rounded-3xl border border-white/10 bg-white/[0.045] p-4">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <div className={cn('inline-flex rounded-full border px-3 py-1 text-xs font-bold', toneClass[column.tone])}>
                  {column.title}
                </div>
                <span className="rounded-full bg-slate-950/45 px-2.5 py-1 text-[11px] font-semibold text-slate-300">
                  共 {allItems.length} 条
                </span>
              </div>
              <div className="space-y-3">
                {items.length ? (
                  items.map((item, index) => {
                    const title = getTitle(item);
                    const isTarget = sameItem(item.itemId, targetItemId);
                    return (
                      <motion.div
                        key={`${column.key}-${item.itemId ?? index}-${item.rank ?? index}`}
                        className={cn(
                          'grid grid-cols-[80px_minmax(0,1fr)] gap-3 rounded-2xl border bg-slate-900/35 p-3',
                          isTarget ? 'border-rose-300/50 shadow-[0_0_22px_rgba(244,63,94,0.18)]' : 'border-white/10',
                        )}
                        initial={{opacity: 0, y: 18}}
                        animate={{opacity: 1, y: 0}}
                        transition={{delay: index * 0.05, type: 'spring', stiffness: 160, damping: 22}}
                        whileHover={{scale: 1.012}}
                      >
                        <ProductImage item={item} title={title} tone={column.tone} />
                        <div className="min-w-0">
                          <div className="mb-2 flex flex-wrap items-center gap-2">
                            <span className={cn('rounded-full border px-2 py-0.5 font-mono text-[11px] font-bold', toneClass[column.tone])}>
                              rank #{item.rank ?? index + 1}
                            </span>
                            {isTarget ? (
                              <span className="inline-flex items-center gap-1 rounded-full border border-rose-300/40 bg-rose-400/15 px-2 py-0.5 text-[11px] font-bold text-rose-100">
                                <Target className="h-3 w-3" />
                                定向投毒目标
                              </span>
                            ) : null}
                          </div>
                          <h4 className="line-clamp-2 text-sm font-bold leading-5 text-slate-50">{title}</h4>
                          {item.category ? <p className="mt-1 text-[11px] text-slate-400">{item.category}</p> : null}
                          {typeof item.score === 'number' && Number.isFinite(item.score) ? (
                            <p className="mt-2 font-mono text-xs text-slate-300">分数 {item.score.toFixed(3)}</p>
                          ) : null}
                        </div>
                      </motion.div>
                    );
                  })
                ) : (
                  <div className="rounded-2xl border border-white/10 bg-slate-900/25 px-4 py-6 text-sm text-slate-400">
                    {column.empty}
                  </div>
                )}
              </div>

              {hiddenCount > 0 ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setColumnLimit(column.key, EXPANDED_VISIBLE_COUNT)}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm font-semibold text-slate-200 transition hover:border-cyan-200/35 hover:bg-cyan-300/10"
                  >
                    <ChevronDown className="h-4 w-4" />
                    展开 15 条
                  </button>
                  <button
                    type="button"
                    onClick={() => setColumnLimit(column.key, MAX_VISIBLE_COUNT)}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm font-semibold text-slate-200 transition hover:border-cyan-200/35 hover:bg-cyan-300/10"
                  >
                    <ChevronDown className="h-4 w-4" />
                    展开 {maxCount} 条
                  </button>
                  {visibleCount > DEFAULT_VISIBLE_COUNT ? (
                    <button
                      type="button"
                      onClick={() => setColumnLimit(column.key, DEFAULT_VISIBLE_COUNT)}
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm font-semibold text-slate-200 transition hover:border-cyan-200/35 hover:bg-cyan-300/10"
                    >
                      <ChevronUp className="h-4 w-4" />
                      收起
                    </button>
                  ) : null}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
};
