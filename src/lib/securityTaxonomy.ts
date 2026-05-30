import {
  BarChart3,
  DatabaseZap,
  FileSearch,
  Fingerprint,
  GitCompare,
  History,
  LucideIcon,
  PackageSearch,
  Radar,
  ShieldCheck,
  ShieldHalf,
  Target,
  Zap,
} from 'lucide-react';

export type SecurityCategory = 'attack' | 'defense' | 'audit' | 'evidence';

export type SecurityModuleId =
  | 'membership_inference'
  | 'interaction_reconstruction'
  | 'target_poisoning'
  | 'dp_noise'
  | 'secure_aggregation_sim'
  | 'robust_aggregation'
  | 'recommendation_audit'
  | 'privacy_audit'
  | 'defense_audit'
  | 'recommendation_comparison'
  | 'target_trajectory'
  | 'membership_result'
  | 'interaction_candidates'
  | 'defense_summary'
  | 'artifact_archive';

export interface SecurityModule {
  id: SecurityModuleId;
  category: SecurityCategory;
  title: string;
  shortTitle: string;
  description: string;
  color: 'rose' | 'cyan' | 'emerald' | 'violet' | 'amber' | 'slate';
  icon: LucideIcon;
  aliases: string[];
}

export const SECURITY_ATTACKS: SecurityModule[] = [
  {
    id: 'membership_inference',
    category: 'attack',
    title: '成员推断攻击',
    shortTitle: '成员推断',
    description: '判断某条用户-商品记录是否参与训练。',
    color: 'violet',
    icon: Fingerprint,
    aliases: ['membership_inference', 'mia', 'privacy_attack', 'member inference'],
  },
  {
    id: 'interaction_reconstruction',
    category: 'attack',
    title: '客户端更新泄露',
    shortTitle: '更新泄露',
    description: '从客户端上传更新中推断候选交互。',
    color: 'cyan',
    icon: PackageSearch,
    aliases: ['interaction_reconstruction', 'client_update', 'preference_leakage', 'reconstruction'],
  },
  {
    id: 'target_poisoning',
    category: 'attack',
    title: '目标商品投毒',
    shortTitle: '目标投毒',
    description: '恶意客户端注入目标商品正反馈，推动目标商品排序。',
    color: 'rose',
    icon: Target,
    aliases: ['target_interaction_injection', 'target_promotion', 'poison', 'injection', 'target_rank'],
  },
];

export const SECURITY_DEFENSES: SecurityModule[] = [
  {
    id: 'dp_noise',
    category: 'defense',
    title: '差分隐私风格加噪',
    shortTitle: '更新扰动',
    description: '给更新加入噪声，降低泄露风险；当前不写成 formal DP。',
    color: 'amber',
    icon: Zap,
    aliases: ['dp_noise', 'differential_privacy', 'noise', 'dp-style'],
  },
  {
    id: 'secure_aggregation_sim',
    category: 'defense',
    title: '安全聚合模拟',
    shortTitle: '安全聚合',
    description: '隐藏单个客户端更新，只暴露聚合结果；当前是模拟验证。',
    color: 'emerald',
    icon: ShieldHalf,
    aliases: ['secure_aggregation_sim', 'secure_agg', 'secagg', 'secure aggregation'],
  },
  {
    id: 'robust_aggregation',
    category: 'defense',
    title: '鲁棒聚合防御',
    shortTitle: '鲁棒聚合',
    description: 'Krum / Median / TrimmedMean / Bulyan 削弱异常客户端更新。',
    color: 'emerald',
    icon: ShieldCheck,
    aliases: ['krum', 'median', 'trimmed_mean', 'bulyan', 'robust', 'robust_aggregation'],
  },
];

export const SECURITY_AUDITS: SecurityModule[] = [
  {
    id: 'recommendation_audit',
    category: 'audit',
    title: '推荐观测',
    shortTitle: '推荐观测',
    description: 'Recall@50、NDCG@50、推荐列表变化和目标排序。',
    color: 'cyan',
    icon: BarChart3,
    aliases: ['recall', 'ndcg', 'recommendation', 'target_rank'],
  },
  {
    id: 'privacy_audit',
    category: 'audit',
    title: '隐私观测',
    shortTitle: '隐私观测',
    description: 'MIA AUC、交互还原 hit@10 / hit@20 / hit@50。',
    color: 'violet',
    icon: Radar,
    aliases: ['mia', 'privacy', 'hit@10', 'hit@20', 'hit@50'],
  },
  {
    id: 'defense_audit',
    category: 'audit',
    title: '防御观测',
    shortTitle: '防御观测',
    description: '恢复率、异常更新过滤和安全聚合残差。',
    color: 'emerald',
    icon: FileSearch,
    aliases: ['recovery', 'filtered', 'residual', 'defense_trace'],
  },
];

export const SECURITY_EVIDENCE: SecurityModule[] = [
  {
    id: 'recommendation_comparison',
    category: 'evidence',
    title: '三列推荐对比',
    shortTitle: '推荐对比',
    description: '正常推荐、攻击后推荐和防御后推荐的同场对照。',
    color: 'cyan',
    icon: GitCompare,
    aliases: ['recommendation_comparison', 'baseline', 'attack', 'defense'],
  },
  {
    id: 'target_trajectory',
    category: 'evidence',
    title: '目标商品轨迹',
    shortTitle: '目标轨迹',
    description: '展示目标商品未屏蔽排序提升和最终曝光边界。',
    color: 'rose',
    icon: Target,
    aliases: ['target_rank_summary', 'target_rank_comparison'],
  },
  {
    id: 'membership_result',
    category: 'evidence',
    title: '成员推断结果',
    shortTitle: '成员推断',
    description: '展示 AUC、准确率和证据类型。',
    color: 'violet',
    icon: Fingerprint,
    aliases: ['membership_inference', 'mia'],
  },
  {
    id: 'interaction_candidates',
    category: 'evidence',
    title: '交互候选还原',
    shortTitle: '候选还原',
    description: '展示候选商品和 hit@10 / hit@20 / hit@50。',
    color: 'cyan',
    icon: PackageSearch,
    aliases: ['interaction_reconstruction'],
  },
  {
    id: 'defense_summary',
    category: 'evidence',
    title: '防御摘要',
    shortTitle: '防御摘要',
    description: '展示过滤、恢复率、残差和边界说明。',
    color: 'emerald',
    icon: ShieldCheck,
    aliases: ['defense_trace', 'krum', 'secure_aggregation'],
  },
  {
    id: 'artifact_archive',
    category: 'evidence',
    title: '历史实验档案',
    shortTitle: '实验档案',
    description: '展示已导出的场景、证据和适用用途。',
    color: 'slate',
    icon: History,
    aliases: ['artifact', 'scenario', 'archive'],
  },
];

export const SECURITY_MODULES = [
  ...SECURITY_ATTACKS,
  ...SECURITY_DEFENSES,
  ...SECURITY_AUDITS,
  ...SECURITY_EVIDENCE,
] as const;

export type ExperimentPlayId = 'target_poisoning_play' | 'membership_privacy_play' | 'update_leakage_play' | 'robust_defense_play';

export interface ExperimentPlay {
  id: ExperimentPlayId;
  title: string;
  purpose: string;
  attackModules: SecurityModuleId[];
  optionalDefenses: SecurityModuleId[];
  auditModules: SecurityModuleId[];
  recommendedDataset: string;
  recommendedModel: string;
  evidenceKeywords: string[];
}

export const EXPERIMENT_PLAYS: ExperimentPlay[] = [
  {
    id: 'target_poisoning_play',
    title: '目标商品投毒实验',
    purpose: '观察恶意交互注入是否会推动目标商品在模型内部排序中前移。',
    attackModules: ['target_poisoning'],
    optionalDefenses: ['robust_aggregation', 'dp_noise'],
    auditModules: ['recommendation_audit', 'defense_audit'],
    recommendedDataset: 'Amazon Beauty',
    recommendedModel: 'FedAvg',
    evidenceKeywords: ['v25', 'target', 'poison', 'amazon', 'rank'],
  },
  {
    id: 'membership_privacy_play',
    title: '成员推断隐私实验',
    purpose: '观察攻击者能否判断某条用户-商品记录是否参与训练。',
    attackModules: ['membership_inference'],
    optionalDefenses: ['dp_noise', 'secure_aggregation_sim'],
    auditModules: ['privacy_audit'],
    recommendedDataset: 'Amazon Beauty / KU',
    recommendedModel: 'FedAvg / MMFedRAP',
    evidenceKeywords: ['mia', 'membership', 'privacy'],
  },
  {
    id: 'update_leakage_play',
    title: '客户端更新泄露实验',
    purpose: '观察客户端上传更新中是否泄露候选交互信息。',
    attackModules: ['interaction_reconstruction'],
    optionalDefenses: ['secure_aggregation_sim', 'dp_noise'],
    auditModules: ['privacy_audit'],
    recommendedDataset: 'Amazon Beauty',
    recommendedModel: 'FedAvg',
    evidenceKeywords: ['interaction', 'reconstruction', 'privacy'],
  },
  {
    id: 'robust_defense_play',
    title: '鲁棒聚合防御实验',
    purpose: '观察 Krum / Median / TrimmedMean / Bulyan 如何削弱异常客户端更新。',
    attackModules: ['target_poisoning'],
    optionalDefenses: ['robust_aggregation'],
    auditModules: ['recommendation_audit', 'defense_audit'],
    recommendedDataset: 'KU / Amazon Beauty',
    recommendedModel: 'MMFedRAP / FedAvg',
    evidenceKeywords: ['krum', 'robust', 'security_matrix', 'defense'],
  },
];

export type AggregationVisibilityMode = 'plain_updates' | 'secure_aggregation';

export const AGGREGATION_VISIBILITY_MODES: Record<
  AggregationVisibilityMode,
  {title: string; description: string; compatibleDefenses: SecurityModuleId[]}
> = {
  plain_updates: {
    title: '明文更新聚合',
    description: '服务端可观察单客户端更新，可使用 Krum / Median / TrimmedMean / Bulyan。',
    compatibleDefenses: ['robust_aggregation', 'dp_noise'],
  },
  secure_aggregation: {
    title: '安全聚合模拟',
    description: '服务端只看到聚合结果，不适合同时做逐客户端鲁棒筛选。',
    compatibleDefenses: ['secure_aggregation_sim', 'dp_noise'],
  },
};

export const ROBUST_AGGREGATORS = ['Krum', 'Median', 'TrimmedMean', 'Bulyan'];

export const getSecurityModule = (id: SecurityModuleId) => SECURITY_MODULES.find((module) => module.id === id);

export const securityToneClass = (color: SecurityModule['color']) => {
  switch (color) {
    case 'rose':
      return 'border-rose-200/30 bg-rose-300/10 text-rose-100';
    case 'cyan':
      return 'border-cyan-200/30 bg-cyan-300/10 text-cyan-100';
    case 'emerald':
      return 'border-emerald-200/30 bg-emerald-300/10 text-emerald-100';
    case 'violet':
      return 'border-violet-200/30 bg-violet-300/10 text-violet-100';
    case 'amber':
      return 'border-amber-200/30 bg-amber-300/10 text-amber-100';
    default:
      return 'border-slate-200/20 bg-slate-300/10 text-slate-100';
  }
};

export const translateSecurityKey = (value?: string | number | null) => {
  if (value === null || value === undefined || value === '') return '暂无 / 不适用';
  const raw = String(value);
  const normalized = raw.trim().toLowerCase().replaceAll('-', '_').replaceAll(' ', '_');
  const module = SECURITY_MODULES.find((item) => item.aliases.some((alias) => alias.toLowerCase().replaceAll('-', '_').replaceAll(' ', '_') === normalized));
  if (module) return module.title;

  const map: Record<string, string> = {
    target_interaction_injection: '目标交互注入',
    recommendation_manipulation_summary: '推荐操纵分析',
    proxy_only: '代理证据',
    demo_only: '演示验证',
    future_adapter: '后续适配',
    not_available: '暂无数据',
    score_null: '分数缺失时不展示',
    checkpoint_score: 'checkpoint score',
    rank_evidence: '排名证据',
    mixed_evidence: '混合证据',
    item_embedding: 'item embedding',
  };

  return map[normalized] ?? raw.replaceAll('_', ' ');
};
