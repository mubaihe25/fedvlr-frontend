import React from 'react';
import {Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis} from 'recharts';
import type {CompareExperiment} from '../../lib/workbenchCompare';
import {CompareMetricMatrix, type CompareMetricRow} from './CompareMetricMatrix';

interface MembershipInferenceCompareProps { experiments: CompareExperiment[]; }

export const MembershipInferenceCompare: React.FC<MembershipInferenceCompareProps> = ({experiments}) => {
  const colors = ['#c084fc', '#60a5fa', '#f472b6', '#f59e0b'];
  const rows: CompareMetricRow[] = [
    ...(['auc', 'accuracy', 'precision', 'recall', 'f1'] as const).map((key) => ({key, label: key === 'auc' ? 'AUC' : key[0].toUpperCase() + key.slice(1), stage: 'MIA 评估', tone: 'privacy' as const, value: (item: CompareExperiment) => item.membership[key]})),
    {key: 'score_gap', label: 'score gap', stage: '成员/非成员分数', tone: 'privacy', value: (item) => item.membership.scoreGap},
    {key: 'threshold', label: 'threshold', stage: '判别阈值', tone: 'neutral', value: (item) => item.membership.threshold},
    {key: 'member_count', label: '成员样本数', stage: '审计样本', tone: 'neutral', value: (item) => item.membership.memberCount},
    {key: 'non_member_count', label: '非成员样本数', stage: '审计样本', tone: 'neutral', value: (item) => item.membership.nonMemberCount},
    {key: 'evidence', label: '证据来源', stage: '审计配置', tone: 'neutral', value: (item) => item.membership.evidenceSource},
    {key: 'label_source', label: '标签来源', stage: '审计配置', tone: 'neutral', value: (item) => item.membership.labelSource},
  ];
  const barData = experiments.map((item, index) => ({name: `${index + 1}. ${item.model}`, AUC: item.membership.auc, Accuracy: item.membership.accuracy, F1: item.membership.f1}));
  const allHaveRoc = experiments.every((item) => item.membership.roc.length > 1);
  const rocFprs: number[] = allHaveRoc ? Array.from(new Set<number>(experiments.flatMap((item) => item.membership.roc.map((point) => point.fpr)))).sort((left, right) => left - right) : [];
  const rocData = rocFprs.map((fpr) => ({fpr, ...Object.fromEntries(experiments.map((item) => [item.jobId, item.membership.roc.find((point) => point.fpr === fpr)?.tpr ?? null]))}));
  const gapData = experiments.map((item, index) => ({name: `${index + 1}. ${item.model}`, scoreGap: item.membership.scoreGap, memberMean: item.membership.memberScoreMean, nonMemberMean: item.membership.nonMemberScoreMean}));
  return <div className="space-y-5"><CompareMetricMatrix experiments={experiments} rows={rows} /><section className="grid gap-4 xl:grid-cols-2"><div className="sandbox-panel min-w-0 rounded-[28px] p-5"><p className="font-black text-white">MIA 核心指标</p><div className="mt-4 h-72 min-w-0"><ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} initialDimension={{width: 640, height: 288}}><BarChart data={barData}><CartesianGrid stroke="#334155" strokeDasharray="3 3" /><XAxis dataKey="name" stroke="#94a3b8" /><YAxis domain={[0,1]} stroke="#94a3b8" /><Tooltip contentStyle={{background:'#0f172a',border:'1px solid #334155'}} /><Legend /><Bar dataKey="AUC" fill="#c084fc" /><Bar dataKey="Accuracy" fill="#818cf8" /><Bar dataKey="F1" fill="#f0abfc" /></BarChart></ResponsiveContainer></div></div><div className="sandbox-panel min-w-0 rounded-[28px] p-5"><p className="font-black text-white">{allHaveRoc ? '真实 ROC points' : 'score gap 数据条'}</p><p className="mt-1 text-xs text-slate-500">{allHaveRoc ? '仅使用 result 导出的 ROC 点，每条线对应一个实验。' : '部分实验未导出 ROC，不伪造曲线。'}</p><div className="mt-4 h-72 min-w-0"><ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} initialDimension={{width: 640, height: 288}}>{allHaveRoc ? <LineChart data={rocData}><CartesianGrid stroke="#334155" strokeDasharray="3 3" /><XAxis dataKey="fpr" type="number" domain={[0,1]} stroke="#94a3b8" /><YAxis domain={[0,1]} stroke="#94a3b8" /><Tooltip contentStyle={{background:'#0f172a',border:'1px solid #334155'}} /><Legend />{experiments.map((item, index) => <Line key={item.jobId} dataKey={item.jobId} name={`${index + 1}. ${item.model}`} stroke={colors[index]} connectNulls dot />)}</LineChart> : <BarChart data={gapData} layout="vertical"><CartesianGrid stroke="#334155" strokeDasharray="3 3" /><XAxis type="number" stroke="#94a3b8" /><YAxis dataKey="name" type="category" stroke="#94a3b8" /><Tooltip contentStyle={{background:'#0f172a',border:'1px solid #334155'}} /><Bar dataKey="scoreGap" name="score gap" fill="#c084fc" /></BarChart>}</ResponsiveContainer></div></div></section></div>;
};
