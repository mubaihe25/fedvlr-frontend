import React from 'react';
import {Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis} from 'recharts';
import type {CompareExperiment} from '../../lib/workbenchCompare';
import {CompareMetricMatrix, type CompareMetricRow} from './CompareMetricMatrix';

const ratio = (value: number | string | boolean) => typeof value === 'number' ? `${(value * 100).toFixed(2)}%` : String(value);

interface RecommendationManipulationCompareProps { experiments: CompareExperiment[]; }

export const RecommendationManipulationCompare: React.FC<RecommendationManipulationCompareProps> = ({experiments}) => {
  const colors = ['#fb7185', '#f59e0b', '#c084fc', '#60a5fa'];
  const rows: CompareMetricRow[] = [
    {key: 'baseline_rank', label: 'baseline 未屏蔽排名', unit: 'rank', stage: 'baseline', tone: 'quality', value: (item) => item.recommendation.baselineRank},
    {key: 'attack_rank', label: 'attack 未屏蔽排名', unit: 'rank', stage: 'attack', tone: 'attack', value: (item) => item.recommendation.attackRank},
    {key: 'defense_rank', label: 'defense 未屏蔽排名', unit: 'rank', stage: 'defense', tone: 'defense', value: (item) => item.recommendation.defenseRank},
    {key: 'masked_rank', label: 'masked target rank', unit: 'rank', stage: '最终屏蔽后', tone: 'attack', value: (item) => item.recommendation.maskedTargetRank},
    {key: 'attack_rank_change', label: '攻击排名变化', unit: '位', stage: 'baseline → attack', tone: 'attack', value: (item) => item.recommendation.attackRankChange},
    {key: 'defense_rank_change', label: '防御排名变化', unit: '位', stage: 'attack → defense', tone: 'defense', value: (item) => item.recommendation.defenseRankChange},
    {key: 'attack_hit_count', label: '攻击 Top50 命中数', unit: '用户', stage: 'attack', tone: 'attack', value: (item) => item.recommendation.attackTop50HitCount},
    {key: 'attack_hit_rate', label: '攻击 Top50 命中率', unit: '%', stage: 'attack', tone: 'attack', value: (item) => item.recommendation.attackTop50HitRate, format: ratio},
    {key: 'defense_hit_count', label: '防御 Top50 命中数', unit: '用户', stage: 'defense', tone: 'defense', value: (item) => item.recommendation.defenseTop50HitCount},
    {key: 'defense_hit_rate', label: '防御 Top50 命中率', unit: '%', stage: 'defense', tone: 'defense', value: (item) => item.recommendation.defenseTop50HitRate, format: ratio},
    {key: 'attack_jaccard', label: 'attack vs baseline Jaccard', stage: 'attack', tone: 'attack', value: (item) => item.recommendation.attackJaccard},
    {key: 'defense_jaccard', label: 'defense vs baseline Jaccard', stage: 'defense', tone: 'defense', value: (item) => item.recommendation.defenseJaccard},
    ...(['baseline', 'attack', 'defense'] as const).flatMap((stage) => ([
      {key: `${stage}_recall`, label: `${stage} Recall@50`, stage, tone: stage === 'attack' ? 'attack' : stage === 'defense' ? 'defense' : 'quality', value: (item: CompareExperiment) => item.recommendation.stages[stage].recall50},
      {key: `${stage}_ndcg`, label: `${stage} NDCG@50`, stage, tone: stage === 'attack' ? 'attack' : stage === 'defense' ? 'defense' : 'quality', value: (item: CompareExperiment) => item.recommendation.stages[stage].ndcg50},
      {key: `${stage}_loss`, label: `${stage} Loss`, stage, tone: stage === 'attack' ? 'attack' : stage === 'defense' ? 'defense' : 'quality', value: (item: CompareExperiment) => item.recommendation.stages[stage].loss},
    ] as CompareMetricRow[])),
  ];
  const rankData = [
    {stage: '正常', ...Object.fromEntries(experiments.map((item) => [item.jobId, item.recommendation.baselineRank]))},
    {stage: '攻击', ...Object.fromEntries(experiments.map((item) => [item.jobId, item.recommendation.attackRank]))},
    {stage: '防御', ...Object.fromEntries(experiments.map((item) => [item.jobId, item.recommendation.defenseRank]))},
  ];
  const qualityData = experiments.map((item, index) => ({name: `${index + 1}. ${item.model}`, attackHit: item.recommendation.attackTop50HitRate, defenseHit: item.recommendation.defenseTop50HitRate, recall: item.recommendation.stages.attack.recall50, ndcg: item.recommendation.stages.attack.ndcg50}));
  return <div className="space-y-5"><CompareMetricMatrix experiments={experiments} rows={rows} /><section className="grid gap-4 xl:grid-cols-2"><div className="sandbox-panel min-w-0 rounded-[28px] p-5"><p className="font-black text-white">目标排名轨迹</p><p className="mt-1 text-xs text-slate-500">排名轴反向：数值越小越靠前；每条线对应一个实验。</p><div className="mt-4 h-72 min-w-0"><ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} initialDimension={{width: 640, height: 288}}><LineChart data={rankData}><CartesianGrid stroke="#334155" strokeDasharray="3 3" /><XAxis dataKey="stage" stroke="#94a3b8" /><YAxis reversed stroke="#94a3b8" /><Tooltip contentStyle={{background:'#0f172a',border:'1px solid #334155'}} /><Legend />{experiments.map((item, index) => <Line key={item.jobId} dataKey={item.jobId} name={`${index + 1}. ${item.model}`} stroke={colors[index]} strokeWidth={2} connectNulls={false} />)}</LineChart></ResponsiveContainer></div></div><div className="sandbox-panel min-w-0 rounded-[28px] p-5"><p className="font-black text-white">Top50 命中率与推荐质量</p><div className="mt-4 h-72 min-w-0"><ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} initialDimension={{width: 640, height: 288}}><BarChart data={qualityData}><CartesianGrid stroke="#334155" strokeDasharray="3 3" /><XAxis dataKey="name" stroke="#94a3b8" /><YAxis stroke="#94a3b8" /><Tooltip contentStyle={{background:'#0f172a',border:'1px solid #334155'}} /><Legend /><Bar dataKey="attackHit" name="攻击命中率" fill="#fb7185" /><Bar dataKey="defenseHit" name="防御命中率" fill="#34d399" /><Bar dataKey="recall" name="攻击 Recall@50" fill="#67e8f9" /><Bar dataKey="ndcg" name="攻击 NDCG@50" fill="#818cf8" /></BarChart></ResponsiveContainer></div></div></section></div>;
};
