import React, {useState} from 'react';
import {Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis} from 'recharts';
import type {CompareExperiment} from '../../lib/workbenchCompare';
import {CompareMetricMatrix, type CompareMetricRow} from './CompareMetricMatrix';

interface AggregationDefenseCompareProps { experiments: CompareExperiment[]; }

export const AggregationDefenseCompare: React.FC<AggregationDefenseCompareProps> = ({experiments}) => {
  const [secondaryChart, setSecondaryChart] = useState<'clients' | 'rounds'>('clients');
  const colors = ['#34d399', '#60a5fa', '#c084fc', '#f59e0b'];
  const rows: CompareMetricRow[] = [
    ...(['baseline', 'attack', 'defense'] as const).flatMap((stage) => ([
      {key: `${stage}_recall`, label: `${stage} Recall@50`, stage, tone: stage === 'attack' ? 'attack' : stage === 'defense' ? 'defense' : 'quality', value: (item: CompareExperiment) => item.defense.stages[stage].recall50},
      {key: `${stage}_ndcg`, label: `${stage} NDCG@50`, stage, tone: stage === 'attack' ? 'attack' : stage === 'defense' ? 'defense' : 'quality', value: (item: CompareExperiment) => item.defense.stages[stage].ndcg50},
    ] as CompareMetricRow[])),
    {key: 'recovery', label: 'Recall 性能恢复率', stage: 'defense', tone: 'defense', value: (item) => item.defense.recoveryRecall},
    {key: 'retained', label: '保留客户端数', stage: '聚合筛选', tone: 'defense', value: (item) => item.defense.retainedClients},
    {key: 'rejected', label: '筛除客户端数', stage: '聚合筛选', tone: 'defense', value: (item) => item.defense.rejectedClients},
    {key: 'filtered_bad', label: '筛除恶意客户端数', stage: '聚合筛选', tone: 'defense', value: (item) => item.defense.filteredMalicious},
    {key: 'false_reject', label: '错杀正常客户端数', stage: '聚合筛选', tone: 'attack', value: (item) => item.defense.falseRejectedNormal},
    {key: 'missed_bad', label: '漏过恶意客户端数', stage: '聚合筛选', tone: 'attack', value: (item) => item.defense.missedMalicious},
    {key: 'aggregation_time', label: '聚合耗时', unit: 's', stage: 'runtime', tone: 'neutral', value: (item) => item.defense.aggregationSeconds},
    {key: 'defense_time', label: '防御审计耗时', unit: 's', stage: 'runtime', tone: 'neutral', value: (item) => item.defense.defenseSeconds},
    {key: 'algorithm', label: '防御算法', stage: '配置', tone: 'defense', value: (item) => item.defense.algorithm},
  ];
  const qualityData = experiments.map((item, index) => ({name:`${index + 1}. ${item.model}`, baselineRecall:item.defense.stages.baseline.recall50, attackRecall:item.defense.stages.attack.recall50, defenseRecall:item.defense.stages.defense.recall50, baselineNdcg:item.defense.stages.baseline.ndcg50, attackNdcg:item.defense.stages.attack.ndcg50, defenseNdcg:item.defense.stages.defense.ndcg50}));
  const clientData = experiments.map((item, index) => ({name:`${index + 1}. ${item.model}`, 保留:item.defense.retainedClients, 筛除:item.defense.filteredMalicious, 错杀:item.defense.falseRejectedNormal, 漏过:item.defense.missedMalicious}));
  const hasRounds = experiments.some((item) => item.defense.rounds.length > 1);
  const roundNumbers: number[] = hasRounds ? Array.from(new Set<number>(experiments.flatMap((item) => item.defense.rounds.map((round) => round.round)))).sort((left, right) => left - right) : [];
  const roundData = roundNumbers.map((roundNumber) => ({round: roundNumber, ...Object.fromEntries(experiments.map((item) => [item.jobId, item.defense.rounds.find((round) => round.round === roundNumber)?.defense.recall50 ?? null]))}));
  return <div className="space-y-5"><CompareMetricMatrix experiments={experiments} rows={rows} /><section className="grid gap-4 xl:grid-cols-2"><div className="sandbox-panel min-w-0 rounded-[28px] p-5"><p className="font-black text-white">正常 / 攻击 / 防御推荐质量</p><div className="mt-4 h-72 min-w-0"><ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} initialDimension={{width: 640, height: 288}}><BarChart data={qualityData}><CartesianGrid stroke="#334155" strokeDasharray="3 3" /><XAxis dataKey="name" stroke="#94a3b8" /><YAxis stroke="#94a3b8" /><Tooltip contentStyle={{background:'#0f172a',border:'1px solid #334155'}} /><Legend /><Bar dataKey="baselineRecall" name="正常 Recall" fill="#67e8f9" /><Bar dataKey="attackRecall" name="攻击 Recall" fill="#fb7185" /><Bar dataKey="defenseRecall" name="防御 Recall" fill="#34d399" /><Bar dataKey="baselineNdcg" name="正常 NDCG" fill="#38bdf8" /><Bar dataKey="attackNdcg" name="攻击 NDCG" fill="#f43f5e" /><Bar dataKey="defenseNdcg" name="防御 NDCG" fill="#10b981" /></BarChart></ResponsiveContainer></div></div><div className="sandbox-panel min-w-0 rounded-[28px] p-5"><div className="flex flex-wrap items-center justify-between gap-3"><p className="font-black text-white">{secondaryChart === 'rounds' && hasRounds ? '真实逐轮防御 Recall@50' : '客户端筛选结果'}</p>{hasRounds ? <div className="flex gap-2"><button type="button" onClick={() => setSecondaryChart('clients')} className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300">筛选结果</button><button type="button" onClick={() => setSecondaryChart('rounds')} className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300">逐轮证据</button></div> : null}</div><div className="mt-4 h-72 min-w-0"><ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} initialDimension={{width: 640, height: 288}}>{secondaryChart === 'rounds' && hasRounds ? <LineChart data={roundData}><CartesianGrid stroke="#334155" strokeDasharray="3 3" /><XAxis dataKey="round" stroke="#94a3b8" /><YAxis stroke="#94a3b8" /><Tooltip contentStyle={{background:'#0f172a',border:'1px solid #334155'}} /><Legend />{experiments.map((item, index) => <Line key={item.jobId} dataKey={item.jobId} name={`${index + 1}. ${item.model}`} stroke={colors[index]} connectNulls dot />)}</LineChart> : <BarChart data={clientData}><CartesianGrid stroke="#334155" strokeDasharray="3 3" /><XAxis dataKey="name" stroke="#94a3b8" /><YAxis stroke="#94a3b8" /><Tooltip contentStyle={{background:'#0f172a',border:'1px solid #334155'}} /><Legend /><Bar dataKey="保留" stackId="clients" fill="#34d399" /><Bar dataKey="筛除" stackId="clients" fill="#64748b" /><Bar dataKey="错杀" stackId="clients" fill="#f59e0b" /><Bar dataKey="漏过" stackId="clients" fill="#fb7185" /></BarChart>}</ResponsiveContainer></div></div></section></div>;
};
