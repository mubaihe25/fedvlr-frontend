import React from 'react';
import {CheckCircle2, CircleAlert, X} from 'lucide-react';
import {datasetLabel} from '../../lib/scenarioNarratives';
import {cn} from '../../lib/utils';
import type {CompareCompatibility, CompareExperiment} from '../../lib/workbenchCompare';

const directionLabels: Record<string, string> = {
  recommendation_manipulation: '推荐操纵',
  membership_inference: '成员推断',
  update_leakage: '更新泄露',
  aggregation_defense: '聚合防御',
};

const statusLabels: Record<string, string> = {
  completed: '已完成',
  partial: '部分完成',
  failed: '失败',
  running: '运行中',
  queued: '排队中',
};

const formatTime = (value: string | null) => {
  if (!value) return '未导出';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString('zh-CN', {hour12: false});
};

interface CompareExperimentHeaderProps {
  experiments: CompareExperiment[];
  compatibility: CompareCompatibility;
  onRemove: (jobId: string) => void;
}

export const CompareExperimentHeader: React.FC<CompareExperimentHeaderProps> = ({experiments, compatibility, onRemove}) => (
  <section className="sandbox-panel rounded-[28px] p-5">
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div>
        <p className="text-xs font-bold tracking-[0.2em] text-cyan-100/75">对比对象</p>
        <h2 className="mt-2 text-2xl font-black text-white">同方向历史实验</h2>
      </div>
      <div className={cn(
        'inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-bold',
        compatibility.compatible ? 'border-emerald-200/25 bg-emerald-300/10 text-emerald-100' : 'border-rose-200/25 bg-rose-300/10 text-rose-100',
      )}>
        {compatibility.compatible ? <CheckCircle2 className="h-4 w-4" /> : <CircleAlert className="h-4 w-4" />}
        {compatibility.compatible ? '方向与数据集兼容' : '存在不兼容选择'}
      </div>
    </div>
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      {experiments.map((experiment) => (
        <article key={experiment.jobId} className="min-w-0 rounded-3xl border border-white/10 bg-white/[0.04] p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-black text-white" title={experiment.experimentName}>{experiment.experimentName}</p>
              <p className="mt-1 text-xs text-slate-500">{formatTime(experiment.startedAt)}</p>
            </div>
            <button type="button" onClick={() => onRemove(experiment.jobId)} className="rounded-xl border border-white/10 p-1.5 text-slate-400 transition hover:border-rose-200/30 hover:text-rose-100" aria-label={`移除 ${experiment.experimentName}`}>
              <X className="h-4 w-4" />
            </button>
          </div>
          <dl className="mt-4 grid grid-cols-2 gap-3 text-xs">
            <div><dt className="text-slate-500">方向</dt><dd className="mt-1 font-bold text-slate-200">{directionLabels[experiment.direction]}</dd></div>
            <div><dt className="text-slate-500">状态</dt><dd className="mt-1 font-bold text-slate-200">{statusLabels[experiment.status] ?? experiment.status}</dd></div>
            <div><dt className="text-slate-500">数据集</dt><dd className="mt-1 font-bold text-slate-200">{datasetLabel(experiment.dataset)}</dd></div>
            <div><dt className="text-slate-500">模型</dt><dd className="mt-1 truncate font-bold text-slate-200">{experiment.model}</dd></div>
          </dl>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="rounded-full border border-cyan-200/20 bg-cyan-300/10 px-2.5 py-1 text-[11px] font-bold text-cyan-100">指标兼容</span>
            {experiment.direction === 'recommendation_manipulation' ? (
              <span className={cn(
                'rounded-full border px-2.5 py-1 text-[11px] font-bold',
                compatibility.recommendationListsCompatible
                  ? 'border-emerald-200/20 bg-emerald-300/10 text-emerald-100'
                  : 'border-amber-200/20 bg-amber-300/10 text-amber-100',
              )}>
                {compatibility.recommendationListsCompatible ? '商品列表兼容' : '仅指标可比'}
              </span>
            ) : null}
          </div>
        </article>
      ))}
    </div>
    {compatibility.messages.length ? (
      <div className="mt-4 space-y-2">
        {compatibility.messages.map((message) => (
          <p key={message} className="rounded-2xl border border-amber-200/20 bg-amber-300/10 px-4 py-3 text-sm font-semibold text-amber-100">{message}</p>
        ))}
      </div>
    ) : null}
  </section>
);

export {directionLabels as compareDirectionLabels};
