import React from 'react';
import {Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis} from 'recharts';
import {resolveTargetItemThumbnailUrl} from '../../lib/targetItemZhNames';
import {candidateJaccard, type CompareExperiment, type CompareLeakageCandidate} from '../../lib/workbenchCompare';
import {CompareMetricMatrix, type CompareMetricRow} from './CompareMetricMatrix';

interface UpdateLeakageCompareProps { experiments: CompareExperiment[]; }

// 横向对比页「更新泄露 → 候选商品证据」专用名称解析。
// 严格按英文原名优先级，禁止调用目标商品选择器的 resolver：
//   raw_title → title → item_title → product_name → `商品 {item_id}`
// 这里**不**汉化、**不**走 `resolveTargetItemZhName`、**不**回退为「未分类商品」。
const RAW_TITLE_KEYS = ['raw_title', 'rawTitle'] as const;
const ITEM_TITLE_KEYS = ['item_title', 'itemTitle'] as const;
const PRODUCT_NAME_KEYS = ['product_name', 'productName'] as const;

const readString = (record: unknown, keys: readonly string[]): string | null => {
  if (!record || typeof record !== 'object') return null;
  const obj = record as Record<string, unknown>;
  for (const key of keys) {
    const value = obj[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return null;
};

const resolveLeakageCandidateDisplayName = (candidate: CompareLeakageCandidate): string => {
  const raw = candidate.raw;
  const rawTitle = readString(raw, RAW_TITLE_KEYS);
  if (rawTitle) return rawTitle;
  if (candidate.title && candidate.title.trim()) return candidate.title.trim();
  const itemTitle = readString(raw, ITEM_TITLE_KEYS);
  if (itemTitle) return itemTitle;
  const productName = readString(raw, PRODUCT_NAME_KEYS);
  if (productName) return productName;
  const itemId = candidate.itemId;
  if (itemId === null || itemId === undefined || itemId === '') return '商品';
  return `商品 ${itemId}`;
};

export const UpdateLeakageCompare: React.FC<UpdateLeakageCompareProps> = ({experiments}) => {
  const rows: CompareMetricRow[] = [
    ...([10, 20, 50] as const).map((k) => ({key: `hit${k}`, label: `Hit@${k}`, stage: '候选还原', tone: 'privacy' as const, value: (item: CompareExperiment) => item.leakage[`hit${k}` as 'hit10' | 'hit20' | 'hit50']})),
    {key: 'candidate_count', label: '候选数量', stage: '候选导出', tone: 'neutral', value: (item) => item.leakage.candidateCount},
    {key: 'truth_rank', label: '真值排名', stage: '候选还原', tone: 'privacy', value: (item) => item.leakage.groundTruthRank},
    {key: 'modality', label: '风险模态', stage: '泄露配置', tone: 'privacy', value: (item) => item.leakage.riskModality},
    {key: 'similarity', label: '相似度方法', stage: '泄露配置', tone: 'neutral', value: (item) => item.leakage.similarityMethod},
    {key: 'mrr', label: 'MRR', stage: '候选还原', tone: 'privacy', value: (item) => item.leakage.mrr},
  ];
  const hitData = experiments.map((item) => ({name: item.model, 'Hit@10': item.leakage.hit10, 'Hit@20': item.leakage.hit20, 'Hit@50': item.leakage.hit50}));
  const sizeData = experiments.map((item) => ({name: item.model, 候选数: item.leakage.candidateCount, 候选池: item.leakage.candidatePoolSize}));
  const jaccards = experiments.slice(1).map((item, index) => ({key: item.jobId, name: `1. ${experiments[0].model} vs ${index + 2}. ${item.model}`, value: candidateJaccard(experiments[0].leakage.candidateIds, item.leakage.candidateIds)}));
  return <div className="space-y-5"><CompareMetricMatrix experiments={experiments} rows={rows} /><section className="grid gap-4 xl:grid-cols-2"><div className="sandbox-panel min-w-0 rounded-[28px] p-5"><p className="font-black text-white">Hit@K 对比</p><div className="mt-4 h-72 min-w-0"><ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} initialDimension={{width: 640, height: 288}}><BarChart data={hitData}><CartesianGrid stroke="#334155" strokeDasharray="3 3" /><XAxis dataKey="name" stroke="#94a3b8" /><YAxis domain={[0,1]} stroke="#94a3b8" /><Tooltip contentStyle={{background:'#0f172a',border:'1px solid #334155'}} /><Legend /><Bar dataKey="Hit@10" fill="#c084fc" /><Bar dataKey="Hit@20" fill="#818cf8" /><Bar dataKey="Hit@50" fill="#67e8f9" /></BarChart></ResponsiveContainer></div></div><div className="sandbox-panel min-w-0 rounded-[28px] p-5"><p className="font-black text-white">候选规模与集合交集</p><div className="mt-4 h-56 min-w-0"><ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} initialDimension={{width: 640, height: 288}}><BarChart data={sizeData}><CartesianGrid stroke="#334155" strokeDasharray="3 3" /><XAxis dataKey="name" stroke="#94a3b8" /><YAxis stroke="#94a3b8" /><Tooltip contentStyle={{background:'#0f172a',border:'1px solid #334155'}} /><Legend /><Bar dataKey="候选数" fill="#c084fc" /><Bar dataKey="候选池" fill="#475569" /></BarChart></ResponsiveContainer></div><div className="mt-3 flex flex-wrap gap-2">{jaccards.map((item) => <span key={item.key} className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300">{item.name} Jaccard：{item.value === null ? '未导出' : item.value.toFixed(3)}</span>)}</div></div></section><section className="sandbox-panel rounded-[28px] p-5"><p className="font-black text-white">候选商品证据</p><div className="mt-4 grid gap-4 xl:grid-cols-3">{experiments.map((experiment) => <article key={experiment.jobId} className="rounded-3xl border border-white/10 bg-white/[0.035] p-4"><p className="truncate font-bold text-white">{experiment.experimentName}</p><div className="mt-3 space-y-2">{experiment.leakage.candidates.slice(0, 10).map((candidate) => {const src=resolveTargetItemThumbnailUrl({datasetId:experiment.dataset,itemId:candidate.itemId,thumbnailUrl:candidate.thumbnailUrl,localImageUrl:candidate.localImageUrl,imageUrl:candidate.imageUrl}); return <div key={String(candidate.itemId)} className="grid grid-cols-[44px_minmax(0,1fr)] gap-3 rounded-2xl border border-white/10 p-2">{src ? <img src={src} alt="" loading="lazy" className="h-11 w-11 rounded-xl object-cover" /> : <span className="h-11 w-11 rounded-xl bg-slate-900" />}<div className="min-w-0"><p className="truncate text-sm font-bold text-slate-100">{resolveLeakageCandidateDisplayName(candidate)}</p><p className="mt-1 text-[11px] text-slate-500">rank #{candidate.rank ?? '未导出'} · {candidate.isGroundTruth === null ? '真值未导出' : candidate.isGroundTruth ? '真值' : '非真值'}</p></div></div>})}</div></article>)}</div></section></div>;
};
