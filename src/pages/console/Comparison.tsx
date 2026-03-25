import React, {useEffect, useState} from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {ArrowRight, Layers, ShieldCheck, Table, XCircle} from 'lucide-react';
import {getComparisonResult} from '../../services/result';
import {cn} from '../../lib/utils';
import type {AsyncState} from '../../types/common';
import type {ComparisonResult} from '../../types/result';

interface ComparisonProps {
  comparisonSelectionIds: string[];
}

const accentClasses = {
  neutral: {
    line: 'bg-on-surface-variant',
    icon: 'text-on-surface-variant',
    badge: 'bg-on-surface-variant/10 text-on-surface-variant',
  },
  danger: {
    line: 'bg-error',
    icon: 'text-error',
    badge: 'bg-error/10 text-error',
  },
  tertiary: {
    line: 'bg-tertiary',
    icon: 'text-tertiary',
    badge: 'bg-tertiary/10 text-tertiary',
  },
  primary: {
    line: 'bg-primary',
    icon: 'text-primary',
    badge: 'bg-primary/10 text-primary',
  },
  secondary: {
    line: 'bg-secondary',
    icon: 'text-secondary',
    badge: 'bg-secondary/10 text-secondary',
  },
  info: {
    line: 'bg-primary',
    icon: 'text-primary',
    badge: 'bg-primary/10 text-primary',
  },
  success: {
    line: 'bg-tertiary',
    icon: 'text-tertiary',
    badge: 'bg-tertiary/10 text-tertiary',
  },
  warning: {
    line: 'bg-error',
    icon: 'text-error',
    badge: 'bg-error/10 text-error',
  },
} as const;

export const Comparison: React.FC<ComparisonProps> = ({comparisonSelectionIds}) => {
  const [loadState, setLoadState] = useState<AsyncState>('loading');
  const [comparison, setComparison] = useState<ComparisonResult | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let cancelled = false;

    const loadComparison = async () => {
      try {
        setLoadState('loading');
        setErrorMessage('');
        const nextComparison = await getComparisonResult(comparisonSelectionIds);
        if (!cancelled) {
          setComparison(nextComparison);
          setLoadState('success');
        }
      } catch (error) {
        if (!cancelled) {
          setComparison(null);
          setLoadState('error');
          setErrorMessage(error instanceof Error ? error.message : '对比结果加载失败。');
        }
      }
    };

    loadComparison();

    return () => {
      cancelled = true;
    };
  }, [comparisonSelectionIds]);

  if (loadState === 'loading') {
    return (
      <div className="rounded-2xl border border-outline-variant/10 bg-surface-container-low p-10 text-center text-on-surface-variant">
        正在加载对比结果...
      </div>
    );
  }

  if (loadState === 'error' || !comparison) {
    return (
      <div className="rounded-2xl border border-error/20 bg-error/10 p-10 text-center">
        <h2 className="text-2xl font-bold text-error">对比分析加载失败</h2>
        <p className="mt-3 text-sm text-on-surface-variant">{errorMessage || '请稍后重试。'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
        <div>
          <span className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-primary">Multi-Experiment Benchmarking</span>
          <h3 className="text-4xl font-bold tracking-tight text-on-background">对比分析</h3>
          <p className="mt-3 text-sm text-on-surface-variant">
            {comparisonSelectionIds.length < 2
              ? '当前展示默认三组样例数据；从历史实验加入对比后，这里会切换为动态组合结果。'
              : `当前已加载 ${comparisonSelectionIds.length} 条历史实验记录生成的对比结果。`}
          </p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 rounded-lg bg-surface-container-high px-6 py-2.5 text-sm font-semibold text-on-surface transition-all hover:bg-surface-container-highest">
            <Layers className="h-4 w-4" />
            已选实验 {comparisonSelectionIds.length || 3} 项
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {comparison.groups.slice(0, 3).map((group, index) => {
          const accent = accentClasses[group.accent] ?? accentClasses.neutral;

          return (
            <div key={group.id} className="glass-panel group relative overflow-hidden rounded-2xl p-6">
              <div className={cn('absolute left-0 top-0 h-full w-1', accent.line)} />
              <div className="mb-4 flex items-start justify-between">
                {index === 1 ? (
                  <XCircle className={cn('h-6 w-6', accent.icon)} />
                ) : (
                  <ShieldCheck className={cn('h-6 w-6', accent.icon)} />
                )}
                <span className={cn('rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider', accent.badge)}>
                  {group.status}
                </span>
              </div>
              <h4 className="mb-1 text-sm font-bold text-on-surface-variant">{group.name}</h4>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-on-surface">{(group.metrics.recall10 * 100).toFixed(1)}%</span>
                <span className="text-[10px] font-bold uppercase text-on-surface-variant">Recall@10</span>
              </div>
              <p className="mt-3 text-xs text-on-surface-variant">
                攻击：{group.attackLabel} | 防御：{group.defenseLabel}
              </p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="glass-panel rounded-2xl p-8 lg:col-span-8">
          <div className="mb-12 flex items-center justify-between">
            <h3 className="text-lg font-bold">核心指标多维对比</h3>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded bg-primary" />
                <span className="text-[10px] font-bold text-on-surface-variant">RECALL@10</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded bg-secondary" />
                <span className="text-[10px] font-bold text-on-surface-variant">NDCG@10</span>
              </div>
            </div>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={comparison.metricComparison} barGap={12}>
                <CartesianGrid stroke="#1d2730" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" stroke="#a5acb4" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#a5acb4" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{backgroundColor: '#121a22', border: '1px solid #1d2730', borderRadius: '8px'}} cursor={{fill: '#1d2730'}} />
                <Bar dataKey="recall" fill="#81ecff" radius={[4, 4, 0, 0]} barSize={32} />
                <Bar dataKey="ndcg" fill="#00affe" radius={[4, 4, 0, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-panel flex flex-col rounded-2xl p-8 lg:col-span-4">
          <h3 className="mb-8 text-sm font-bold uppercase tracking-widest text-on-surface-variant">演进阶段追踪</h3>
          <div className="relative flex-1 space-y-8">
            <div className="absolute bottom-2 left-[11px] top-2 w-0.5 bg-surface-container-highest" />
            {comparison.stages.map((stage) => {
              const accent = accentClasses[stage.tone] ?? accentClasses.neutral;

              return (
                <div key={stage.stage} className="relative z-10 flex gap-6">
                  <div className={cn('flex h-6 w-6 items-center justify-center rounded-full border-4 border-surface', accent.line)}>
                    <div className="h-1.5 w-1.5 rounded-full bg-surface" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-on-surface">{stage.stage}</p>
                    <p className={cn('mt-1 text-[10px] font-bold uppercase tracking-widest', accent.icon)}>{stage.status}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="glass-panel overflow-hidden rounded-2xl lg:col-span-12">
          <div className="flex items-center justify-between border-b border-outline-variant/10 bg-surface-container-highest/30 px-8 py-6">
            <div className="flex items-center gap-3">
              <Table className="h-5 w-5 text-primary" />
              <h3 className="font-bold">实验配置矩阵</h3>
            </div>
            <button className="flex items-center gap-1 text-xs font-bold text-primary hover:underline">
              查看完整参数 <ArrowRight className="h-3 w-3" />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-surface-container-highest/50 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                  <th className="px-8 py-4">字段</th>
                  <th className="px-8 py-4">基线</th>
                  <th className="px-8 py-4">攻击</th>
                  <th className="px-8 py-4">防御</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10">
                {comparison.configDiff.map((row) => (
                  <tr key={row.label} className="transition-colors hover:bg-surface-container-highest/30">
                    <td className="px-8 py-4 text-primary">{row.label}</td>
                    <td className="px-8 py-4 text-on-surface">{row.baseline}</td>
                    <td className="px-8 py-4 text-on-surface-variant">{row.attack}</td>
                    <td className="px-8 py-4 text-tertiary">{row.defense}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-6 lg:col-span-12">
          <p className="text-sm leading-relaxed text-on-surface-variant">{comparison.summary}</p>
          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
            {comparison.findings.map((finding) => (
              <div key={finding} className="rounded-xl bg-surface-container-low p-4 text-sm text-on-surface">
                {finding}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
