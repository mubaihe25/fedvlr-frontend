import React from 'react';
import {cn} from '../../lib/utils';
import type {CompareExperiment} from '../../lib/workbenchCompare';

export type MetricTone = 'quality' | 'attack' | 'privacy' | 'defense' | 'neutral';

export interface CompareMetricRow {
  key: string;
  label: string;
  unit?: string;
  stage?: string;
  tone: MetricTone;
  value: (experiment: CompareExperiment) => number | string | boolean | null;
  format?: (value: number | string | boolean) => string;
}

const toneClasses: Record<MetricTone, string> = {
  quality: 'border-l-cyan-300 text-cyan-100',
  attack: 'border-l-rose-300 text-rose-100',
  privacy: 'border-l-violet-300 text-violet-100',
  defense: 'border-l-emerald-300 text-emerald-100',
  neutral: 'border-l-slate-400 text-slate-200',
};

const defaultFormat = (value: number | string | boolean) => {
  if (typeof value === 'boolean') return value ? '是' : '否';
  if (typeof value === 'number') return Number.isInteger(value) ? String(value) : value.toFixed(4);
  return value;
};

interface CompareMetricMatrixProps {
  experiments: CompareExperiment[];
  rows: CompareMetricRow[];
}

export const CompareMetricMatrix: React.FC<CompareMetricMatrixProps> = ({experiments, rows}) => (
  <section className="sandbox-panel overflow-hidden rounded-[28px]">
    <div className="border-b border-white/10 px-5 py-4">
      <p className="text-xs font-bold tracking-[0.2em] text-cyan-100/75">核心指标矩阵</p>
      <p className="mt-2 text-sm text-slate-400">仅展示 result 中真实存在的字段；缺失值统一标记为“未导出”。</p>
    </div>
    <div className="overflow-x-auto">
      <table className="w-full min-w-[760px] table-fixed text-left">
        <thead className="bg-white/[0.04] text-xs text-slate-400">
          <tr>
            <th className="w-56 px-4 py-3">指标 / 阶段</th>
            {experiments.map((experiment) => <th key={experiment.jobId} className="px-4 py-3">{experiment.experimentName}</th>)}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/10">
          {rows.map((row) => (
            <tr key={row.key} className="transition hover:bg-white/[0.025]">
              <th className={cn('border-l-4 px-4 py-3', toneClasses[row.tone])}>
                <p className="text-sm font-black">{row.label}{row.unit ? ` (${row.unit})` : ''}</p>
                <p className="mt-1 text-[11px] font-medium text-slate-500">来源阶段：{row.stage ?? '方向结果'}</p>
              </th>
              {experiments.map((experiment) => {
                const value = row.value(experiment);
                return (
                  <td key={`${row.key}-${experiment.jobId}`} className={cn('px-4 py-3 font-mono text-sm', value === null ? 'text-slate-600' : 'text-slate-100')}>
                    {value === null ? '未导出' : (row.format ?? defaultFormat)(value)}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </section>
);
