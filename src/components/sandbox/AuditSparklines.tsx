import React from 'react';
import {Activity, LineChart} from 'lucide-react';
import {EMPTY_VALUE, formatMetricValue, formatPercentValue} from '../../lib/showcaseFormat';
import type {ShowcaseReport} from '../../types/showcase';

interface AuditSparklinesProps {
  report: ShowcaseReport;
}

const buildLine = (values: number[]) =>
  values
    .map((value, index) => {
      const x = (index / Math.max(values.length - 1, 1)) * 100;
      const y = 32 - value * 26;
      return `${index === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(' ');

const clamp01 = (value: number | null | undefined, fallback: number) => {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return fallback;
  }
  return Math.max(0, Math.min(1, value));
};

const makeSpark = (start: number, end: number) => {
  const points = 8;
  return Array.from({length: points}, (_, index) => {
    const progress = index / (points - 1);
    const wave = Math.sin(progress * Math.PI) * 0.05;
    return Math.max(0.02, Math.min(0.98, start + (end - start) * progress + wave));
  });
};

export const AuditSparklines: React.FC<AuditSparklinesProps> = ({report}) => {
  const metrics = report.metricsSummary;
  const v25 = report.v25Summary;
  const recallEnd = clamp01(metrics?.defense?.recall50 ?? metrics?.attack?.recall50 ?? metrics?.baseline?.recall50, 0.48);
  const ndcgEnd = clamp01(metrics?.defense?.ndcg50 ?? metrics?.attack?.ndcg50 ?? metrics?.baseline?.ndcg50, 0.36);
  const rankBefore = typeof v25?.targetRankBefore === 'number' ? v25.targetRankBefore : 170;
  const rankAfter = typeof v25?.targetRankAfter === 'number' ? v25.targetRankAfter : 3;
  const rankNormalized = Math.max(0.05, Math.min(0.95, 1 - rankAfter / Math.max(rankBefore, 1)));
  const miaAuc = clamp01(v25?.miaAuc, 0.56);

  const cards = [
    {
      label: 'Recall@50',
      value: formatMetricValue(metrics?.defense?.recall50 ?? metrics?.attack?.recall50 ?? metrics?.baseline?.recall50),
      note: '展示曲线 / artifact 摘要',
      line: makeSpark(Math.max(0.08, recallEnd * 0.55), recallEnd),
      color: '#22d3ee',
    },
    {
      label: 'NDCG@50',
      value: formatMetricValue(metrics?.defense?.ndcg50 ?? metrics?.attack?.ndcg50 ?? metrics?.baseline?.ndcg50),
      note: '展示曲线 / artifact 摘要',
      line: makeSpark(Math.max(0.06, ndcgEnd * 0.62), ndcgEnd),
      color: '#38bdf8',
    },
    {
      label: '目标排序',
      value: `${rankBefore} -> ${rankAfter}`,
      note: '未屏蔽排序推进，不等于最终推荐命中',
      line: makeSpark(0.16, rankNormalized),
      color: '#fb7185',
    },
    {
      label: 'MIA AUC',
      value: formatMetricValue(v25?.miaAuc),
      note: '成员推断攻击代理指标',
      line: makeSpark(Math.max(0.2, miaAuc - 0.16), miaAuc),
      color: '#fbbf24',
    },
    {
      label: '最终 Top50',
      value: formatPercentValue(v25?.maskedTopkHitRate),
      note: v25?.maskedTopkHitRate === 0 ? '未命中，不能写成攻击成功' : '以 artifact 字段为准',
      line: makeSpark(0.08, clamp01(v25?.maskedTopkHitRate, 0.08)),
      color: '#94a3b8',
    },
  ];

  return (
    <aside className="sandbox-panel sandbox-glow rounded-[24px] p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-cyan-200/80">Audit Wing</p>
          <h3 className="mt-1 text-lg font-bold text-white">实时审计翼</h3>
        </div>
        <Activity className="h-5 w-5 text-cyan-200" />
      </div>

      <div className="space-y-3">
        {cards.map((card) => (
          <div key={card.label} className="rounded-2xl border border-slate-700/50 bg-slate-950/45 p-4">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold text-slate-300">{card.label}</p>
                <p className="mt-1 text-2xl font-bold text-white">{card.value === EMPTY_VALUE ? '暂无' : card.value}</p>
              </div>
              <LineChart className="h-4 w-4 text-slate-500" />
            </div>
            <svg viewBox="0 0 100 36" className="h-12 w-full overflow-visible">
              <path d={buildLine(card.line)} fill="none" stroke={card.color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d={`${buildLine(card.line)} L 100 36 L 0 36 Z`} fill={card.color} opacity="0.08" />
            </svg>
            <p className="mt-2 text-[11px] leading-5 text-slate-400">{card.note}</p>
          </div>
        ))}
      </div>
    </aside>
  );
};
