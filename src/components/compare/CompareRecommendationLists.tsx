import React, {useEffect, useMemo, useState} from 'react';
import {resolveCompareItemTitle, withNormalizedCompareItemImages} from '../../lib/compareItemPresentation';
import {cn} from '../../lib/utils';
import type {CompareExperiment, CompareStage} from '../../lib/workbenchCompare';
import type {ShowcaseRecommendationItem} from '../../types/showcase';
import {RecommendationProductCard, type RecommendationChangeStatus} from '../sandbox/RecommendationProductCard';

const stageLabels: Record<CompareStage, string> = {baseline: '正常阶段', attack: '攻击阶段', defense: '防御阶段'};
const limits = [5, 15, 50];

const itemRank = (items: ShowcaseRecommendationItem[], itemId: string | number | null | undefined) =>
  items.find((item) => String(item.itemId) === String(itemId))?.rank ?? null;

const changeLabel = (experiment: CompareExperiment, stage: CompareStage, item: ShowcaseRecommendationItem): RecommendationChangeStatus => {
  if (stage === 'baseline') return '保持';
  const previous = stage === 'attack' ? experiment.recommendation.recommendations.baseline : experiment.recommendation.recommendations.attack;
  const previousRank = itemRank(previous, item.itemId);
  if (previousRank === null || previousRank === undefined) return '新增';
  const currentRank = item.rank ?? null;
  if (currentRank === null) return '保持';
  if (currentRank < previousRank) return '上升';
  if (currentRank > previousRank) return '下降';
  return '保持';
};

interface CompareRecommendationListsProps {
  experiments: CompareExperiment[];
}

export const CompareRecommendationLists: React.FC<CompareRecommendationListsProps> = ({experiments}) => {
  const [stage, setStage] = useState<CompareStage>('attack');
  const [limit, setLimit] = useState(5);
  const [visibleJobIds, setVisibleJobIds] = useState<string[]>(() => experiments.slice(0, 3).map((item) => item.jobId));

  useEffect(() => {
    setVisibleJobIds((current) => {
      const valid = current.filter((id) => experiments.some((item) => item.jobId === id)).slice(0, 3);
      return valid.length ? valid : experiments.slice(0, 3).map((item) => item.jobId);
    });
  }, [experiments]);

  const visible = useMemo(() => experiments.filter((item) => visibleJobIds.includes(item.jobId)).slice(0, 3), [experiments, visibleJobIds]);
  const toggleVisible = (jobId: string) => setVisibleJobIds((current) => {
    if (current.includes(jobId)) return current.length > 1 ? current.filter((id) => id !== jobId) : current;
    return current.length >= 3 ? current : [...current, jobId];
  });

  return (
    <section className="sandbox-panel rounded-[28px] p-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div><p className="text-xs font-bold tracking-[0.2em] text-cyan-100/75">商品列表对比</p><p className="mt-2 text-sm text-slate-400">只展示当前选择阶段；目标商品不一致时整块隐藏。</p></div>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(stageLabels) as CompareStage[]).map((value) => (
            <button key={value} type="button" onClick={() => setStage(value)} className={cn('rounded-2xl border px-3 py-2 text-xs font-bold', stage === value ? 'border-cyan-200/35 bg-cyan-300/10 text-cyan-100' : 'border-white/10 text-slate-400')}>{stageLabels[value]}</button>
          ))}
        </div>
      </div>
      {experiments.length === 4 ? (
        <div className="mt-4 flex flex-wrap items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.035] p-3">
          <span className="text-xs font-bold text-slate-500">最多选择 3 个实验查看列表：</span>
          {experiments.map((item) => <button key={item.jobId} type="button" onClick={() => toggleVisible(item.jobId)} className={cn('rounded-full border px-3 py-1 text-xs font-bold', visibleJobIds.includes(item.jobId) ? 'border-cyan-200/30 bg-cyan-300/10 text-cyan-100' : 'border-white/10 text-slate-500')}>{item.model}</button>)}
        </div>
      ) : null}
      <div className="mt-4 flex flex-wrap gap-2">
        {limits.map((value) => <button key={value} type="button" onClick={() => setLimit(value)} className={cn('rounded-full border px-3 py-1 text-xs font-bold', limit === value ? 'border-cyan-200/30 bg-cyan-300/10 text-cyan-100' : 'border-white/10 text-slate-500')}>{value === 5 ? '默认 5 条' : `展开 ${value} 条`}</button>)}
      </div>
      <div className={cn('mt-4 grid gap-4', visible.length === 3 ? 'xl:grid-cols-3' : 'xl:grid-cols-2')}>
        {visible.map((experiment) => {
          const items = experiment.recommendation.recommendations[stage].slice(0, limit);
          return (
            <article key={experiment.jobId} className="min-w-0 rounded-3xl border border-white/10 bg-white/[0.035] p-4">
              <div className="mb-4"><p className="truncate font-black text-white">{experiment.experimentName}</p><p className="mt-1 text-xs text-slate-500">{stageLabels[stage]} · {items.length} 条</p></div>
              <div className="space-y-2">
                {items.length ? items.map((item, index) => {
                  const isTarget = String(item.itemId) === String(experiment.recommendation.targetItemId);
                  const title = resolveCompareItemTitle(item);
                  const safeItem = withNormalizedCompareItemImages(item);
                  return (
                    <RecommendationProductCard key={`${experiment.jobId}-${stage}-${item.itemId}-${index}`} item={safeItem} title={title} tone={stage === 'baseline' ? 'cyan' : stage === 'attack' ? 'rose' : 'emerald'} dataset={experiment.dataset} changeStatus={changeLabel(experiment, stage, item)} isTarget={isTarget} index={index} cardKey={`${experiment.jobId}-${stage}-${item.itemId}-${index}`} />
                  );
                }) : <p className="rounded-2xl border border-white/10 px-4 py-8 text-center text-sm text-slate-500">该阶段未导出推荐商品列表。</p>}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
};
