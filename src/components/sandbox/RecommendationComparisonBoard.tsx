import React from 'react';
import {motion} from 'motion/react';
import {ChevronDown, ChevronUp, ImageOff, Target} from 'lucide-react';
import {cn} from '../../lib/utils';
import {fetchShowcaseRecommendations} from '../../services/showcase';
import type {ShowcaseRecommendationComparison, ShowcaseRecommendationItem} from '../../types/showcase';

interface RecommendationComparisonBoardProps {
  comparison?: ShowcaseRecommendationComparison | null;
  scenarioId?: string | null;
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
  [item.thumbnailUrl, item.localImageUrl, item.imageUrl].filter((value): value is string => !blockedImage(value));

const ProductImage: React.FC<{item: ShowcaseRecommendationItem; title: string; tone: keyof typeof toneClass}> = ({item, title, tone}) => {
  const sources = imageSources(item);
  const [sourceIndex, setSourceIndex] = React.useState(0);
  const [loaded, setLoaded] = React.useState(false);
  const source = sources[sourceIndex];

  React.useEffect(() => {
    setSourceIndex(0);
    setLoaded(false);
  }, [item.itemId, item.thumbnailUrl, item.localImageUrl, item.imageUrl]);

  if (source) {
    return (
      <div className="relative h-20 w-20 overflow-hidden rounded-2xl bg-slate-800/70">
        {!loaded ? <div className="absolute inset-0 animate-pulse bg-slate-700/70" /> : null}
        <img
          className={cn('h-20 w-20 object-cover transition-opacity', loaded ? 'opacity-100' : 'opacity-0')}
          src={source}
          alt={title}
          loading="lazy"
          referrerPolicy="no-referrer"
          onLoad={() => setLoaded(true)}
          onError={() => {
            setLoaded(false);
            setSourceIndex((index) => index + 1);
          }}
        />
      </div>
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

const columnTotalCount = (comparison: ShowcaseRecommendationComparison | null | undefined, key: string, fallback: number) => {
  const totalCounts = comparison?.totalCounts;
  if (!totalCounts) {
    return fallback;
  }
  const value = totalCounts[key] ?? totalCounts[`${key}_recommendations`];
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
};

export const RecommendationComparisonBoard: React.FC<RecommendationComparisonBoardProps> = ({comparison, scenarioId, targetItemId}) => {
  const [activeComparison, setActiveComparison] = React.useState<ShowcaseRecommendationComparison | null | undefined>(comparison);
  const [visibleLimit, setVisibleLimit] = React.useState(DEFAULT_VISIBLE_COUNT);
  const [isLoadingLimit, setIsLoadingLimit] = React.useState(false);
  const [loadError, setLoadError] = React.useState<string | null>(null);

  React.useEffect(() => {
    setActiveComparison(comparison);
    setVisibleLimit(DEFAULT_VISIBLE_COUNT);
    setLoadError(null);
  }, [comparison, scenarioId]);

  const loadLimit = async (limit: number) => {
    if (!scenarioId) {
      setVisibleLimit(limit);
      return;
    }
    try {
      setIsLoadingLimit(true);
      setLoadError(null);
      const result = await fetchShowcaseRecommendations(scenarioId, {limit, column: 'all'});
      if (result.error) {
        setLoadError('推荐列表暂未返回，保留当前展示。');
        setVisibleLimit(limit);
        return;
      }
      setActiveComparison(result.data);
      setVisibleLimit(limit);
    } catch {
      setLoadError('推荐列表暂未返回，保留当前展示。');
      setVisibleLimit(limit);
    } finally {
      setIsLoadingLimit(false);
    }
  };

  const currentComparison = activeComparison ?? comparison;
  const canRequestMore = columns.some((column) => {
    const items = currentComparison?.[column.key] ?? [];
    return columnTotalCount(currentComparison, column.key, items.length) > Math.min(visibleLimit, MAX_VISIBLE_COUNT);
  });

  return (
    <section className="sandbox-panel sandbox-glow rounded-[28px] p-5">
      <div className="mb-5 flex flex-col justify-between gap-3 md:flex-row md:items-end">
        <div>
          <p className="text-xs font-bold tracking-[0.2em] text-cyan-100/75">推荐对照</p>
          <h3 className="mt-1 text-xl font-bold text-white">三列推荐商品变化</h3>
        </div>
        <p className="max-w-2xl text-xs leading-5 text-slate-400">
          每列默认请求 5 个商品，展开 15 / 50 条时按需请求 API；图片优先使用缩略图，其次本地原图，再其次原始链接。分数缺失时不显示。
        </p>
      </div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {[
          {label: '收起 5 条', limit: DEFAULT_VISIBLE_COUNT, icon: ChevronUp},
          {label: '展开 15 条', limit: EXPANDED_VISIBLE_COUNT, icon: ChevronDown},
          {label: '展开 50 条', limit: MAX_VISIBLE_COUNT, icon: ChevronDown},
        ].map((action) => {
          const Icon = action.icon;
          const active = visibleLimit === action.limit;
          return (
            <button
              key={action.limit}
              type="button"
              disabled={isLoadingLimit || (action.limit > DEFAULT_VISIBLE_COUNT && !canRequestMore)}
              onClick={() => loadLimit(action.limit)}
              className={cn(
                'inline-flex items-center gap-2 rounded-2xl border px-3 py-2 text-sm font-semibold transition',
                active
                  ? 'border-cyan-200/40 bg-cyan-200/14 text-cyan-50'
                  : 'border-white/10 bg-white/[0.04] text-slate-200 hover:border-cyan-200/35 hover:bg-cyan-300/10',
                isLoadingLimit || (action.limit > DEFAULT_VISIBLE_COUNT && !canRequestMore) ? 'cursor-not-allowed opacity-60' : '',
              )}
            >
              <Icon className="h-4 w-4" />
              {action.label}
            </button>
          );
        })}
        {isLoadingLimit ? <span className="text-xs font-semibold text-cyan-100">正在读取推荐切片...</span> : null}
        {loadError ? <span className="text-xs font-semibold text-amber-100">{loadError}</span> : null}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        {columns.map((column) => {
          const allItems = currentComparison?.[column.key] ?? [];
          const items = allItems.slice(0, Math.min(visibleLimit, MAX_VISIBLE_COUNT));
          const totalCount = columnTotalCount(currentComparison, column.key, allItems.length);

          return (
            <div key={column.key} className="rounded-3xl border border-white/10 bg-white/[0.045] p-4">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <div className={cn('inline-flex rounded-full border px-3 py-1 text-xs font-bold', toneClass[column.tone])}>
                  {column.title}
                </div>
                <span className="rounded-full bg-slate-950/45 px-2.5 py-1 text-[11px] font-semibold text-slate-300">
                  共 {totalCount} 条，当前 {items.length} 条
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

            </div>
          );
        })}
      </div>
    </section>
  );
};
