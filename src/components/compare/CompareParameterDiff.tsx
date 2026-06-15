import React, {useMemo, useState} from 'react';
import {ChevronDown, ChevronUp, SlidersHorizontal} from 'lucide-react';
import type {CompareDirection, CompareExperiment} from '../../lib/workbenchCompare';

interface ParameterDefinition {
  key: string;
  label: string;
  read: (experiment: CompareExperiment) => unknown;
}

const read = (source: Record<string, unknown>, key: string) => source[key] ?? null;

const commonParameters: ParameterDefinition[] = [
  {key: 'model', label: '模型', read: (item) => item.model},
  {key: 'epochs', label: '训练轮数', read: (item) => read(item.trainingConfig, 'epochs') ?? read(item.trainingConfig, 'total_rounds')},
  {key: 'local_epochs', label: '本地轮数', read: (item) => read(item.trainingConfig, 'local_epochs')},
  {key: 'batch_size', label: '批大小', read: (item) => read(item.trainingConfig, 'batch_size')},
  {key: 'seed', label: '随机种子', read: (item) => read(item.trainingConfig, 'seed')},
  {key: 'client_sampling_ratio', label: '客户端采样比例', read: (item) => read(item.trainingConfig, 'client_sampling_ratio')},
  {key: 'learning_rate', label: '学习率', read: (item) => read(item.trainingConfig, 'learning_rate')},
  {key: 'weight_decay', label: '权重衰减', read: (item) => read(item.trainingConfig, 'weight_decay')},
];

const directionParameters: Record<CompareDirection, ParameterDefinition[]> = {
  recommendation_manipulation: [
    {key: 'target_item_id', label: '目标商品', read: (item) => item.recommendation.targetItemId},
    {key: 'malicious_client_ratio', label: '恶意客户端比例', read: (item) => read(item.attackConfig, 'malicious_client_ratio')},
    {key: 'injection_ratio', label: '注入比例', read: (item) => read(item.attackConfig, 'injection_ratio')},
    {key: 'attack_strength', label: '攻击强度', read: (item) => read(item.attackConfig, 'attack_strength')},
    {key: 'target_loss_weight', label: '目标损失权重', read: (item) => read(item.attackConfig, 'target_loss_weight')},
  ],
  membership_inference: [
    {key: 'mia_evidence_source', label: '证据来源', read: (item) => read(item.privacyConfig, 'mia_evidence_source')},
    {key: 'label_source', label: '标签来源', read: (item) => read(item.privacyConfig, 'label_source')},
    {key: 'membership_sample_count', label: '样本数量', read: (item) => read(item.privacyConfig, 'membership_sample_count')},
    {key: 'threshold_strategy', label: '阈值策略', read: (item) => read(item.privacyConfig, 'threshold_strategy')},
  ],
  update_leakage: [
    {key: 'update_input_source', label: '输入来源', read: (item) => read(item.privacyConfig, 'update_input_source')},
    {key: 'candidate_pool_size', label: '候选池规模', read: (item) => read(item.privacyConfig, 'candidate_pool_size')},
    {key: 'risk_modality', label: '风险模态', read: (item) => read(item.privacyConfig, 'risk_modality')},
    {key: 'hit_k', label: 'Hit K', read: (item) => read(item.privacyConfig, 'hit_k')},
  ],
  aggregation_defense: [
    {key: 'base_attack', label: '基础攻击', read: (item) => item.defense.baseAttack},
    {key: 'malicious_client_ratio', label: '恶意客户端比例', read: (item) => item.defense.maliciousRatio},
    {key: 'aggregator', label: '聚合算法', read: (item) => item.defense.algorithm},
    {key: 'krum_f', label: 'Krum f', read: (item) => read(item.defense.parameters, 'krum_f')},
    {key: 'multi_krum_enabled', label: 'Multi-Krum', read: (item) => read(item.defense.parameters, 'multi_krum_enabled')},
    {key: 'distance_metric', label: '距离度量', read: (item) => read(item.defense.parameters, 'distance_metric')},
    {key: 'gradient_clip_norm', label: 'Median 裁剪', read: (item) => read(item.defense.parameters, 'gradient_clip_norm')},
    {key: 'trim_ratio', label: '截尾比例', read: (item) => read(item.defense.parameters, 'trim_ratio')},
    {key: 'trim_min_keep', label: '最少保留客户端', read: (item) => read(item.defense.parameters, 'trim_min_keep')},
    {key: 'bulyan_f', label: 'Bulyan f', read: (item) => read(item.defense.parameters, 'bulyan_f')},
    {key: 'bulyan_selection_ratio', label: 'Bulyan 候选比例', read: (item) => read(item.defense.parameters, 'bulyan_selection_ratio')},
    {key: 'dp_noise_std', label: '差分隐私风格噪声', read: (item) => read(item.defense.parameters, 'dp_noise_std')},
    {key: 'max_grad_norm', label: '扰动裁剪上限', read: (item) => read(item.defense.parameters, 'max_grad_norm')},
  ],
};

const serialize = (value: unknown) => {
  if (value === null || value === undefined || value === '') return '未导出';
  if (typeof value === 'boolean') return value ? '是' : '否';
  if (Array.isArray(value)) return value.length ? value.join(' / ') : '空';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
};

interface CompareParameterDiffProps {
  experiments: CompareExperiment[];
}

export const CompareParameterDiff: React.FC<CompareParameterDiffProps> = ({experiments}) => {
  const [showAll, setShowAll] = useState(false);
  const definitions = useMemo(() => {
    const direction = experiments[0]?.direction;
    return direction ? [...commonParameters, ...directionParameters[direction]] : commonParameters;
  }, [experiments]);
  const rows = useMemo(() => definitions.map((definition) => {
    const values = experiments.map((experiment) => serialize(definition.read(experiment)));
    return {...definition, values, differs: new Set(values).size > 1};
  }), [definitions, experiments]);
  const different = rows.filter((row) => row.differs);
  const common = rows.filter((row) => !row.differs);
  const visibleRows = showAll ? rows : different;

  return (
    <section className="sandbox-panel overflow-hidden rounded-[28px]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-5 py-4">
        <div className="flex items-center gap-3">
          <SlidersHorizontal className="h-5 w-5 text-cyan-200" />
          <div><p className="font-black text-white">参数差异</p><p className="text-xs text-slate-500">默认只显示不同参数，共同参数单独归档。</p></div>
        </div>
        <button type="button" onClick={() => setShowAll((value) => !value)} className="inline-flex items-center gap-2 rounded-2xl border border-white/10 px-3 py-2 text-xs font-bold text-slate-300 hover:border-cyan-200/30 hover:text-cyan-100">
          {showAll ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          {showAll ? '只看差异' : '展开全部参数'}
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="bg-white/[0.04] text-xs text-slate-500"><tr><th className="w-56 px-4 py-3">参数</th>{experiments.map((item) => <th key={item.jobId} className="px-4 py-3">{item.experimentName}</th>)}</tr></thead>
          <tbody className="divide-y divide-white/10">
            {visibleRows.length ? visibleRows.map((row) => <tr key={row.key}><th className="px-4 py-3 font-bold text-cyan-100">{row.label}</th>{row.values.map((value, index) => <td key={`${row.key}-${experiments[index].jobId}`} className={value === '未导出' ? 'px-4 py-3 text-slate-600' : 'px-4 py-3 text-slate-200'}>{value}</td>)}</tr>) : <tr><td colSpan={experiments.length + 1} className="px-4 py-8 text-center text-slate-500">当前重点参数完全一致。</td></tr>}
          </tbody>
        </table>
      </div>
      {!showAll && common.length ? (
        <details className="border-t border-white/10 px-5 py-4 text-sm text-slate-400">
          <summary className="cursor-pointer font-bold text-slate-300">共同参数（{common.length} 项）</summary>
          <div className="mt-3 flex flex-wrap gap-2">{common.map((row) => <span key={row.key} className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs">{row.label}：{row.values[0]}</span>)}</div>
        </details>
      ) : null}
    </section>
  );
};
