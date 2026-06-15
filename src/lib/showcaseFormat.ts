import type {
  ShowcaseDatasetProfile,
  ShowcaseRecommendationComparison,
  ShowcaseReport,
  ShowcaseScenario,
} from '../types/showcase';

export const EMPTY_VALUE = '暂无 / 不适用';

export const showcaseLabelMap: Record<string, string> = {
  target_hit_rate_attack: '攻击后目标命中率',
  target_exposure_gain: '目标曝光增益',
  target_rank_summary: '目标排序诊断',
  target_rank_comparison: '目标排序对照',
  target_rank_score: '目标排序与分数',
  unmasked_rank: '未屏蔽排序',
  'unmasked rank': '未屏蔽排序',
  masked_topk: '最终推荐列表',
  'masked TopK': '最终推荐列表',
  proxy_only: '代理证据',
  proxy: '代理证据',
  demo_only: '演示验证',
  demo: '演示验证',
  smoke: '冒烟验证',
  future_adapter: '后续适配',
  not_available: '暂无数据',
  unavailable: '暂无数据',
  secure_aggregation_sim: '安全聚合模拟',
  secure_agg_sim: '安全聚合模拟',
  secure_aggregation_demo: '安全聚合演示',
  dp_noise: '差分隐私风格加噪',
  interaction_reconstruction: '交互候选还原',
  membership_inference: '成员推断攻击',
  target_interaction_injection: '目标交互注入',
  target_promotion_loss: '目标排序推动损失',
  robust_aggregation: '鲁棒聚合防御',
  krum: 'Krum 鲁棒防御',
  median: 'Median 鲁棒防御',
  trimmed_mean: 'TrimmedMean 鲁棒防御',
  supported: '已支持',
  partial: '部分支持',
  unsupported: '暂不支持',
  not_tested: '未测试',
  smoke_verified: '已通过小规模链路验证',
  partial_smoke_verified: '部分支持，已通过基础 smoke',
  validate_only: '仅完成配置校验',
  adapter_required: '需要适配器',
  failed_smoke: 'smoke 未通过',
  baseline: '正常推荐',
  attack: '攻击后推荐',
  defense: '防御后推荐',
  recall_drop: '召回下降',
  recovery_rate: '恢复率',
  model_security_capability_matrix: '模型安全能力矩阵',
  target_manipulation_metrics: '推荐操纵证据',
  membership_inference_panel: '成员推断证据',
  update_leakage_panel: '更新泄露证据',
  aggregation_defense_panel: '聚合防御证据',
  mixed_proxy: '排名/混合证据',
  rank_proxy: '排名/混合证据',
  configured_only: '已配置，未形成完整 benchmark',
  formal_dp_available: '正式差分隐私不可用',
  has_v3: 'V3 证据',
  runtime_timeline: '运行时间线',
  training_curves: '训练曲线',
  client_sampling_ratio_clamped_to_bounded_smoke_default: '采样比例已按受限 smoke 收束',
  dataset_not_smoke_verified_for_model: '该模型/数据集尚未完成 smoke 验证',
  target_item_not_in_target_options: '目标商品不在推荐候选中',
  candidate_k_clamped_to_50: '候选数量已收束到 Top50',
  secure_aggregation_conflicts_with_robust_aggregation: '安全聚合与鲁棒聚合互斥',
  adapter_required_model: '模型需要适配器',
  unknown_model: '未知模型',
  unknown_dataset: '未知数据集',
};

export const toChineseLabel = (value?: string | number | null) => {
  if (value === null || value === undefined || value === '') {
    return EMPTY_VALUE;
  }

  const rawValue = String(value);
  const trimmedValue = rawValue.trim();
  const prefix = trimmedValue.split(':')[0];
  return showcaseLabelMap[rawValue] ?? showcaseLabelMap[trimmedValue] ?? showcaseLabelMap[prefix] ?? rawValue.replaceAll('_', ' ');
};

export const formatMetricValue = (value?: number | null) =>
  typeof value === 'number' && Number.isFinite(value) ? value.toFixed(4) : EMPTY_VALUE;

/**
 * 统一格式化"排名提升 / rank gain"类指标：
 * - 强制 2 位小数（510.06 / 53.02 / 167.00）
 * - 缺失值 / null / undefined / 非有限数：返回 EMPTY_VALUE
 * - 不影响原始排名（before / after）、hit@k、AUC 等其他指标
 */
export const formatRankGain = (value?: number | null) =>
  typeof value === 'number' && Number.isFinite(value) ? value.toFixed(2) : EMPTY_VALUE;

/**
 * 同 formatRankGain，但在正数前加 + 号：用于"目标排序提升"等
 * 期望表达方向（提升 / 下降）的指标。0 显示为 `+0.00`，缺失值
 * 仍走 EMPTY_VALUE。
 */
export const formatSignedRankGain = (value?: number | null) =>
  typeof value === 'number' && Number.isFinite(value) ? `${value >= 0 ? '+' : ''}${value.toFixed(2)}` : EMPTY_VALUE;

/**
 * 归一化提升 (normalized_rank_gain) 等比例类排名增益：
 * - 0-1 比例 × 100 后保留 2 位小数 + %（如 0.988 -> "98.80%"）
 * - 缺失值走 EMPTY_VALUE
 * - 复用 (value * 100) 的换算约定，不修改原始 ratio
 */
export const formatPercentRank = (value?: number | null) =>
  typeof value === 'number' && Number.isFinite(value) ? `${(value * 100).toFixed(2)}%` : EMPTY_VALUE;

export const formatPercentValue = (value?: number | null) =>
  typeof value === 'number' && Number.isFinite(value) ? `${Math.round(value * 100)}%` : EMPTY_VALUE;

export const formatPlainValue = (value?: string | number | null) => {
  if (value === null || value === undefined || value === '') {
    return EMPTY_VALUE;
  }

  return String(value);
};

export const summarizeArtifactValue = (value: unknown): string => {
  if (value === null || value === undefined || value === false) {
    return EMPTY_VALUE;
  }
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  if (Array.isArray(value)) {
    return value.length ? value.slice(0, 4).map(summarizeArtifactValue).join(' / ') : EMPTY_VALUE;
  }
  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>).slice(0, 4);
    return entries.length ? entries.map(([key, item]) => `${toChineseLabel(key)}：${summarizeArtifactValue(item)}`).join(' / ') : EMPTY_VALUE;
  }

  return EMPTY_VALUE;
};

export const getDatasetLabel = (dataset?: ShowcaseDatasetProfile | null) =>
  dataset?.dataset ?? dataset?.name ?? EMPTY_VALUE;

export const getRecommendationCounts = (comparison?: ShowcaseRecommendationComparison | null) => ({
  baseline: comparison?.totalCounts?.baseline ?? comparison?.totalCounts?.baseline_recommendations ?? comparison?.baseline.length ?? 0,
  attack: comparison?.totalCounts?.attack ?? comparison?.totalCounts?.attack_recommendations ?? comparison?.attack.length ?? 0,
  defense: comparison?.totalCounts?.defense ?? comparison?.totalCounts?.defended_recommendations ?? comparison?.defense.length ?? 0,
});

export const getBoundaryItems = (report: ShowcaseReport, scenario?: ShowcaseScenario) => {
  const items = [...(report.boundaries ?? [])];
  const hasFlag = (key: keyof Pick<ShowcaseReport, 'smoke' | 'proxy' | 'demo' | 'demoOnly' | 'unavailable' | 'notAvailable'>) =>
    Boolean(report[key] ?? scenario?.[key]);

  if (hasFlag('smoke')) {
    items.push('冒烟验证：只读安全冒烟结果，不能当作完整训练结论。');
  }
  if (hasFlag('proxy')) {
    items.push('代理证据：部分字段来自代理指标或替代 artifact，不代表完整实现链路。');
  }
  if (hasFlag('demo') || hasFlag('demoOnly')) {
    items.push('演示验证：用于展示结构和解释链路，不等同于生产级能力。');
  }
  if (hasFlag('unavailable') || hasFlag('notAvailable')) {
    items.push('暂无数据：当前场景未导出该模块 artifact。');
  }
  items.push('URL-hash placeholder：Amazon image_features 若标记为 URL-hash，只是占位特征，不是真实视觉 embedding。');
  items.push('安全聚合模拟：只表示模拟或占位说明，不是正式安全聚合协议。');
  items.push('差分隐私风格加噪：没有正式隐私会计，不能写成 formal DP 已实现。');

  return Array.from(new Set(items));
};

export const hasAmazonUrlHashPlaceholder = (dataset?: ShowcaseDatasetProfile | null, scenario?: ShowcaseScenario) => {
  const text = [dataset?.dataset, dataset?.name, dataset?.source, dataset?.imageFeatureMethod, scenario?.dataset, scenario?.name]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return text.includes('amazon') || (text.includes('url') && text.includes('hash'));
};
