import React from 'react';
import {ChevronDown, ChevronUp} from 'lucide-react';
import {cn} from '../../lib/utils';
import {fetchShowcaseRecommendations} from '../../services/showcase';
import type {ShowcaseRecommendationComparison, ShowcaseRecommendationItem} from '../../types/showcase';
import {RecommendationProductCard, type RecommendationChangeStatus} from './RecommendationProductCard';

interface RecommendationComparisonBoardProps {
  comparison?: ShowcaseRecommendationComparison | null;
  scenarioId?: string | null;
  targetItemId?: string | number | null;
  // 数据集名（来自 workbench metrics.dataset）。当推荐条目没有图片 URL 时，
  // 用 /api/showcase/images/{dataset}/{itemId}?size=thumb 兜底拼缩略图，404 走 <ImageOff />。
  dataset?: string | null;
  resultVariant?: 'baseline' | 'attack' | 'attack_defense' | string | null;
  robustAggregator?: string | null;
  hasIndependentDefenseRun?: boolean;
  showIndependentDefense?: boolean;
}

type ColumnKey = 'baseline' | 'attack' | 'defense';

const DEFAULT_VISIBLE_COUNT = 5;
const EXPANDED_VISIBLE_COUNT = 15;
const MAX_VISIBLE_COUNT = 50;

const columns: Array<{key: ColumnKey; title: string; subtitle: string; tone: 'cyan' | 'rose' | 'emerald'; empty: string}> = [
  {key: 'baseline', title: '正常推荐', subtitle: '攻击前的基准排序', tone: 'cyan', empty: '暂无正常推荐'},
  {key: 'attack', title: '攻击后推荐', subtitle: '观察目标操纵后的排序变化', tone: 'rose', empty: '暂无攻击后推荐'},
  {key: 'defense', title: '防御后推荐', subtitle: '独立攻击+防御训练的推荐结果', tone: 'emerald', empty: '暂无防御结果'},
];

const aggregatorLabels: Record<string, string> = {
  Krum: 'Krum',
  Median: '坐标中位数',
  TrimmedMean: '截尾均值',
  Bulyan: 'Bulyan',
};

const toneClass = {
  cyan: 'border-sky-200/30 bg-sky-200/10 text-sky-100',
  rose: 'border-rose-200/30 bg-rose-200/10 text-rose-100',
  emerald: 'border-emerald-200/30 bg-emerald-200/10 text-emerald-100',
} as const;

const sameItem = (left?: string | number | null, right?: string | number | null) =>
  left !== undefined && left !== null && right !== undefined && right !== null && String(left) === String(right);

const getTitle = (item: ShowcaseRecommendationItem) => item.title ?? (item.itemId ? `商品 ${item.itemId}` : '未命名商品');

const rankOf = (items: ShowcaseRecommendationItem[] | undefined, itemId?: string | number | null) => {
  if (itemId === undefined || itemId === null) return null;
  const matched = items?.find((item) => sameItem(item.itemId, itemId));
  return typeof matched?.rank === 'number' ? matched.rank : null;
};

const getChangeStatus = (item: ShowcaseRecommendationItem, columnKey: ColumnKey, comparison?: ShowcaseRecommendationComparison | null): RecommendationChangeStatus => {
  const currentRank = typeof item.rank === 'number' ? item.rank : null;
  if (columnKey === 'baseline') {
    const attackRank = rankOf(comparison?.attack, item.itemId);
    if (attackRank === null || currentRank === null) return '保持';
    if (attackRank < currentRank) return '上升';
    if (attackRank > currentRank) return '下降';
    return '保持';
  }

  const previous = columnKey === 'attack' ? comparison?.baseline : comparison?.attack;
  const previousRank = rankOf(previous, item.itemId);
  if (previousRank === null || currentRank === null) return '新增';
  if (currentRank < previousRank) return '上升';
  if (currentRank > previousRank) return '下降';
  return '保持';
};

const getColumnChangeSummary = (items: ShowcaseRecommendationItem[], columnKey: ColumnKey, comparison?: ShowcaseRecommendationComparison | null) => {
  const counts: Record<RecommendationChangeStatus, number> = {新增: 0, 上升: 0, 下降: 0, 保持: 0};
  items.forEach((item) => {
    counts[getChangeStatus(item, columnKey, comparison)] += 1;
  });
  return counts;
};

const columnTotalCount = (comparison: ShowcaseRecommendationComparison | null | undefined, key: ColumnKey, fallback: number) => {
  const totalCounts = comparison?.totalCounts;
  if (!totalCounts) return fallback;
  const apiKey = key === 'defense' ? 'defended_recommendations' : `${key}_recommendations`;
  const value = totalCounts[key] ?? totalCounts[apiKey];
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
};

export const RecommendationComparisonBoard: React.FC<RecommendationComparisonBoardProps> = ({
  comparison,
  scenarioId,
  targetItemId,
  dataset,
  resultVariant,
  robustAggregator,
  hasIndependentDefenseRun,
  showIndependentDefense,
}) => {
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
  const hasDefenseColumn = showIndependentDefense ?? true;
  const attackColumnIsCombined = resultVariant === 'attack_defense' && hasIndependentDefenseRun === false;
  const aggregatorLabel = robustAggregator ? aggregatorLabels[robustAggregator] ?? robustAggregator : null;
  const visibleColumns = columns
    .filter((column) => column.key !== 'defense' || hasDefenseColumn)
    .map((column) => {
      if (column.key === 'attack' && attackColumnIsCombined) {
        return {
          ...column,
          title: '攻击+防御后推荐',
          subtitle: aggregatorLabel ? `已启用鲁棒聚合：${aggregatorLabel}` : '攻击与防御共同作用后的排序',
        };
      }
      if (column.key === 'attack' && hasIndependentDefenseRun) {
        return {...column, subtitle: '独立攻击训练结果（未启用鲁棒聚合）'};
      }
      if (column.key === 'defense' && aggregatorLabel) {
        return {...column, subtitle: `独立攻击+防御训练 · ${aggregatorLabel}`};
      }
      return column;
    });
  const canRequestMore = visibleColumns.some((column) => {
    const items = currentComparison?.[column.key] ?? [];
    return columnTotalCount(currentComparison, column.key, items.length) > Math.min(visibleLimit, MAX_VISIBLE_COUNT);
  });

  return (
    <section className="sandbox-panel sandbox-glow rounded-[28px] p-5">
      <div className="mb-5 flex flex-col justify-between gap-3 md:flex-row md:items-end">
        <div>
          <p className="text-xs font-bold tracking-[0.2em] text-cyan-100/75">推荐对照</p>
          <h3 className="mt-1 text-xl font-bold text-white">{visibleColumns.length === 3 ? '三列' : '两列'}推荐商品变化</h3>
        </div>
        <p className="max-w-2xl text-xs leading-5 text-slate-400">
          每列默认 5 条，展开 15 / 50 条时按需读取。目标商品未进入最终推荐列表时不会被强行插入，只在目标轨迹里说明边界。
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

      <div className={cn('grid grid-cols-1 gap-4', visibleColumns.length === 3 ? 'xl:grid-cols-3' : 'xl:grid-cols-2')}>
        {visibleColumns.map((column) => {
          const allItems = currentComparison?.[column.key] ?? [];
          const items = allItems.slice(0, Math.min(visibleLimit, MAX_VISIBLE_COUNT));
          const totalCount = columnTotalCount(currentComparison, column.key, allItems.length);
          const changeSummary = getColumnChangeSummary(items, column.key, currentComparison);

          return (
            <div key={column.key} className="rounded-3xl border border-white/10 analysis-column p-4">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className={cn('inline-flex rounded-full border px-3 py-1 text-xs font-bold', toneClass[column.tone])}>{column.title}</div>
                  <p className="mt-2 text-xs text-slate-500">{column.subtitle}</p>
                </div>
                <span className="rounded-full bg-slate-950/45 px-2.5 py-1 text-[11px] font-semibold text-slate-300">
                  共 {totalCount} 条，当前 {items.length} 条
                </span>
              </div>
              <div className="mb-4 rounded-2xl border border-white/10 analysis-summary px-3 py-2">
                <p className="text-[11px] font-bold text-slate-500">推荐变化摘要</p>
                <p className="mt-1 text-xs font-semibold text-slate-300">
                  新增 {changeSummary.新增} 个 / 上升 {changeSummary.上升} 个 / 下降 {changeSummary.下降} 个 / 保持 {changeSummary.保持} 个
                </p>
              </div>
              <div className="space-y-3">
                {items.length ? (
                  items.map((item, index) => {
                    const title = getTitle(item);
                    const isTarget = sameItem(item.itemId, targetItemId);
                    const changeStatus = getChangeStatus(item, column.key, currentComparison);
                    return <RecommendationProductCard key={`${column.key}-${item.itemId ?? index}-${item.rank ?? index}`} item={item} title={title} tone={column.tone} dataset={dataset} changeStatus={changeStatus} isTarget={isTarget} index={index} cardKey={`${column.key}-${item.itemId ?? index}-${item.rank ?? index}`} />;
                  })
                ) : (
                  <div className="rounded-2xl border border-white/10 analysis-empty px-4 py-6 text-sm text-slate-400">{column.empty}</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
