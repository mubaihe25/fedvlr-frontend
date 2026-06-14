import type {ShowcaseBundle, ShowcaseRecommendationItem, ShowcaseReport, ShowcaseScenario} from '../types/showcase';
import {EXPERIMENT_PLAYS, SECURITY_MODULES, translateSecurityKey} from './securityTaxonomy';
import {EMPTY_VALUE} from './showcaseFormat';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value);

export const readField = (record: unknown, keys: string[]) => {
  if (!isRecord(record)) return undefined;
  for (const key of keys) {
    if (key in record) return record[key];
  }
  return undefined;
};

export const readNumber = (record: unknown, keys: string[]) => {
  const value = readField(record, keys);
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value.replace('%', '').trim());
    if (Number.isFinite(parsed)) return value.includes('%') ? parsed / 100 : parsed;
  }
  return null;
};

export const readString = (record: unknown, keys: string[]) => {
  const value = readField(record, keys);
  if (typeof value === 'string') return value.trim() || null;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return null;
};

export const pickRecord = (record: unknown, keys: string[]) => {
  if (!isRecord(record)) return null;
  for (const key of keys) {
    const value = record[key];
    if (isRecord(value)) return value;
  }
  return null;
};

export const datasetLabel = (value?: string | null) => {
  if (!value) return EMPTY_VALUE;
  const upper = value.toUpperCase();
  if (upper.includes('AMAZON')) return 'Amazon Beauty';
  if (upper === 'KU') return 'KU 多模态数据集';
  return value;
};

// 规范化数据集名为 FedVLR 后端 /showcase/images/{dataset}/... 路径使用的 ID。
// 后端 image 路由不接受展示名称（"Amazon Beauty" / "KU 多模态数据集"），
// 必须落到注册过的数据集 ID（AMAZON_BEAUTY_POC / KU 等）；不在已知集合内则原样返回。
const DATASET_ID_NORMALIZATION: Record<string, string> = {
  'AMAZON BEAUTY': 'AMAZON_BEAUTY_POC',
  'KU 多模态数据集': 'KU',
  'KU': 'KU',
  'AMAZON_BEAUTY_POC': 'AMAZON_BEAUTY_POC',
};

export const normalizeShowcaseDataset = (value?: string | null): string | null => {
  if (!value || typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const upper = trimmed.toUpperCase();
  if (DATASET_ID_NORMALIZATION[upper]) return DATASET_ID_NORMALIZATION[upper];
  if (DATASET_ID_NORMALIZATION[trimmed]) return DATASET_ID_NORMALIZATION[trimmed];
  if (upper.includes('AMAZON')) return 'AMAZON_BEAUTY_POC';
  if (upper === 'KU') return 'KU';
  return trimmed;
};

export const sourceLabel = (source: ShowcaseBundle['dataSource']) => {
  if (source === 'api') return '真实数据';
  if (source === 'mixed') return '真实数据 / 部分缺失';
  return 'API 未连接 / 演示数据';
};

export const scenarioText = (scenario: ShowcaseScenario, report?: ShowcaseReport) =>
  [
    scenario.scenarioId,
    scenario.name,
    scenario.displayName,
    scenario.dataset,
    scenario.model,
    ...(scenario.tags ?? []),
    report?.title,
    report?.dataset,
    report?.model,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

export const getScenarioTitle = (scenario: ShowcaseScenario, report?: ShowcaseReport) => {
  const text = scenarioText(scenario, report);
  if (scenario.hasV3 || text.includes('security_v3')) return 'Amazon V3 安全证据链路';
  if (text.includes('v25')) return 'Amazon V2.5 定向投毒链路';
  if (text.includes('target rank comparison')) return 'Amazon 目标排序对照';
  if (text.includes('target injection')) return 'Amazon 目标交互注入';
  if (text.includes('target manipulation observation')) return 'Amazon 目标操纵观测';
  if (text.includes('target manipulation')) return 'Amazon 目标操纵验证';
  if (text.includes('baseline smoke')) return 'Amazon 基线推荐冒烟';
  if (text.includes('product security smoke') || text.includes('security smoke')) return 'Amazon 商品安全冒烟';
  if (text.includes('krum') || text.includes('security_matrix')) return '鲁棒聚合防御链路';
  if (text.includes('matrix') || text.includes('capability')) return '模型能力矩阵';
  if (text.includes('ku')) return 'KU 多模态攻防展示';
  if (text.includes('amazon')) return 'Amazon 商品推荐安全';
  return scenario.displayName ?? scenario.name;
};

export const inferAttackType = (scenario: ShowcaseScenario, report?: ShowcaseReport) => {
  const text = scenarioText(scenario, report);
  if (report?.v3?.targetManipulation || text.includes('target') || text.includes('poison') || text.includes('rank') || report?.v25Summary?.targetRankAfter) {
    return '目标商品投毒';
  }
  if (report?.v3?.membership || text.includes('membership') || text.includes('mia') || report?.v25Summary?.miaAuc) {
    return '成员推断攻击';
  }
  if (report?.v3?.updateLeakage || text.includes('interaction') || text.includes('reconstruction') || report?.v25Summary?.interactionReconstructionHit50) {
    return '客户端更新泄露';
  }
  if (text.includes('security') || text.includes('smoke')) return '安全链路验证';
  return '未标注攻击';
};

export const inferDefenseType = (scenario: ShowcaseScenario, report?: ShowcaseReport) => {
  const text = scenarioText(scenario, report);
  if (report?.v3?.aggregationDefense?.status === 'configured_only') return '已配置，未形成完整 benchmark';
  if (report?.v3?.aggregationDefense?.defenseAlgorithm) return `${report.v3.aggregationDefense.defenseAlgorithm} 鲁棒防御`;
  if (text.includes('krum') || text.includes('robust') || report?.defenseTrace?.aggregationRule) return '鲁棒聚合防御';
  if (text.includes('secure') || text.includes('secagg') || report?.v25Summary?.secAggResidual !== undefined) return '安全聚合模拟';
  if (text.includes('dp') || text.includes('noise') || report?.defenseTrace?.dpNoise) return '差分隐私风格加噪';
  return '暂无防御结果';
};

export const inferScenarioUsage = (scenario: ShowcaseScenario, report?: ShowcaseReport) => {
  const text = scenarioText(scenario, report);
  if (scenario.hasV3 || report?.v3) return '主展示';
  if (text.includes('v25') || text.includes('mmfedrap_ku')) return '主展示';
  if (text.includes('krum') || text.includes('security') || text.includes('privacy')) return '链路验证';
  if (text.includes('matrix') || text.includes('capability')) return '配置验证';
  return scenario.isDisplayReady ? '可展示' : '配置验证';
};

export const inferEvidenceLabels = (scenario: ShowcaseScenario, report?: ShowcaseReport) => {
  const labels: string[] = [];
  if (scenario.hasV3 || report?.v3) labels.push('V3 证据');
  if (scenario.hasRuntime || report?.v3?.runtime?.events.length) labels.push('运行时间线');
  if (scenario.hasCurves || report?.v3?.curves) labels.push('曲线');
  if (scenario.hasTargetManipulation || report?.v3?.targetManipulation) labels.push('推荐操纵');
  if (scenario.hasMembership || report?.v3?.membership) labels.push('成员推断');
  if (scenario.hasUpdateLeakage || report?.v3?.updateLeakage) labels.push('更新泄露');
  if (scenario.hasAggregationDefense || report?.v3?.aggregationDefense) labels.push('聚合防御');
  if (scenario.hasRecommendations || report?.recommendationComparison) labels.push('推荐列表');
  if (scenario.hasPrivacy || report?.privacyRiskSummary || report?.v25Summary?.miaAuc) labels.push('隐私审计');
  if (scenario.hasImages || report?.recommendationComparison?.baseline.some((item) => item.thumbnailUrl || item.localImageUrl || item.imageUrl)) {
    labels.push('商品图片');
  }
  if (scenario.hasMetrics || report?.metricsSummary) labels.push('指标');
  if (!labels.length) labels.push('摘要');
  return labels;
};

export const getPlayEvidenceState = (playId: string, scenarios: ShowcaseScenario[]) => {
  const play = EXPERIMENT_PLAYS.find((item) => item.id === playId);
  if (!play) return false;
  return scenarios.some((scenario) => {
    const text = scenarioText(scenario);
    return play.evidenceKeywords.some((keyword) => text.includes(keyword));
  });
};

export const getMatchedModules = (scenario: ShowcaseScenario, report?: ShowcaseReport) => {
  const text = scenarioText(scenario, report);
  return SECURITY_MODULES.filter((module) => module.aliases.some((alias) => text.includes(alias.toLowerCase())));
};

export const normalizeEvidenceType = (value?: string | null) => {
  if (!value) return '混合证据';
  const normalized = value.toLowerCase();
  if (normalized.includes('mixed_proxy') || normalized.includes('rank_proxy')) return '排名/混合证据';
  if (normalized.includes('checkpoint')) return 'checkpoint score';
  if (normalized.includes('rank')) return '排名证据';
  if (normalized.includes('mixed') || normalized.includes('hybrid')) return '混合证据';
  return translateSecurityKey(value);
};

export interface WorkbenchTargetContext {
  itemId?: string | number | null;
  title?: string | null;
  category?: string | null;
  thumbnailUrl?: string | null;
  localImageUrl?: string | null;
  imageUrl?: string | null;
}

const hasAnyTargetField = (target: WorkbenchTargetContext | null | undefined): target is WorkbenchTargetContext => {
  if (!target) return false;
  return (
    target.itemId !== undefined && target.itemId !== null && String(target.itemId).trim() !== ''
  ) || Boolean(target.title) || Boolean(target.thumbnailUrl) || Boolean(target.localImageUrl) || Boolean(target.imageUrl);
};

export const getTargetProduct = (report: ShowcaseReport, workbenchTarget?: WorkbenchTargetContext | null) => {
  // Workbench job result takes priority over V3 / legacy summaries. The single-analysis
  // Tab must reflect the current job's target, not the V3 showcase fixture (e.g. amber
  // glass bottle). When only an itemId is present, show "商品 {itemId}" with a placeholder
  // image; never fall back to a stale V3 default.
  if (hasAnyTargetField(workbenchTarget)) {
    const ctx = workbenchTarget as WorkbenchTargetContext;
    const itemId = ctx.itemId !== undefined && ctx.itemId !== null ? String(ctx.itemId) : null;
    return {
      itemId,
      title: ctx.title ?? (itemId ? `商品 ${itemId}` : null),
      category: ctx.category ?? null,
      thumbnailUrl: ctx.thumbnailUrl ?? null,
      localImageUrl: ctx.localImageUrl ?? null,
      imageUrl: ctx.imageUrl ?? null,
    };
  }
  if (report.v3?.targetManipulation?.targetItem) {
    const item = report.v3.targetManipulation.targetItem;
    return {
      itemId: item.itemId ?? null,
      title: item.title ?? null,
      category: item.category ?? null,
      thumbnailUrl: item.thumbnailUrl ?? null,
      localImageUrl: item.localImageUrl ?? null,
      imageUrl: item.imageUrl ?? null,
    };
  }
  const entry = report.targetRankSummary?.entries?.[0];
  if (!entry) return null;
  const id = entry.itemId;
  const allItems = [
    ...(report.recommendationComparison?.baseline ?? []),
    ...(report.recommendationComparison?.attack ?? []),
    ...(report.recommendationComparison?.defense ?? []),
  ];
  const matched = allItems.find((item) => id !== undefined && id !== null && String(item.itemId) === String(id));
  return {
    itemId: id ?? matched?.itemId ?? null,
    title: entry.title ?? matched?.title ?? null,
    category: entry.category ?? matched?.category ?? null,
    thumbnailUrl: entry.thumbnailUrl ?? matched?.thumbnailUrl ?? null,
    localImageUrl: entry.localImageUrl ?? matched?.localImageUrl ?? null,
    imageUrl: entry.imageUrl ?? matched?.imageUrl ?? null,
  };
};

export const getPublicImage = (item?: Pick<ShowcaseRecommendationItem, 'thumbnailUrl' | 'localImageUrl' | 'imageUrl'> | null) => {
  const source = item?.thumbnailUrl ?? item?.localImageUrl ?? item?.imageUrl;
  if (!source || /^[a-zA-Z]:[\\/]/.test(source) || source.startsWith('\\\\')) return null;
  return source;
};

export const getTargetRanks = (report: ShowcaseReport) => {
  const entry = report.targetRankSummary?.entries?.[0];
  const v3Target = report.v3?.targetManipulation;
  const before = v3Target?.baselineUnmaskedRank ?? report.v25Summary?.targetRankBefore ?? entry?.baselineRank ?? null;
  const after = v3Target?.attackUnmaskedRank ?? report.v25Summary?.targetRankAfter ?? entry?.attackRank ?? null;
  const rankLift = v3Target?.rankGain ?? (typeof before === 'number' && typeof after === 'number' ? before - after : null);
  const normalizedLift = v3Target?.normalizedRankGain ?? (rankLift !== null && typeof before === 'number' && before > 1 ? rankLift / (before - 1) : null);
  const reciprocalGain = v3Target?.reciprocalRankGain ?? (typeof before === 'number' && typeof after === 'number' && before > 0 && after > 0 ? 1 / after - 1 / before : null);
  const manipulationRisk = v3Target?.targetManipulationIndex ?? (normalizedLift !== null ? Math.max(0, Math.min(100, normalizedLift * 100)) : null);

  return {before, after, entry, rankLift, normalizedLift, reciprocalGain, manipulationRisk};
};

export const getFinalExposureText = (report: ShowcaseReport) => {
  if (report.v3?.targetManipulation?.attackTopkHit === false) return '最终曝光未命中';
  if (report.v3?.targetManipulation?.attackTopkHit === true) return '以结果文件记录为准';
  const hitRate = report.v25Summary?.maskedTopkHitRate ?? report.targetRankSummary?.targetHitRate ?? report.metricsSummary?.targetHitRate ?? 0;
  return hitRate === 0 ? '最终曝光未命中' : '以结果文件记录为准';
};

export const getPrivacyMetrics = (report: ShowcaseReport) => {
  const v3Membership = report.v3?.membership;
  const v3Leakage = report.v3?.updateLeakage;
  const rawPrivacy = report.v25Summary?.raw && isRecord(report.v25Summary.raw) ? report.v25Summary.raw.privacyRiskSummary : report.privacyRiskSummary;
  const miaRecord = pickRecord(rawPrivacy, ['membership_inference', 'membershipInference', 'mia']) ?? pickRecord(report.privacy, ['membership_inference', 'membershipInference', 'mia']);
  const interactionRecord =
    pickRecord(rawPrivacy, ['interaction_reconstruction', 'interactionReconstruction']) ??
    pickRecord(report.privacy, ['interaction_reconstruction', 'interactionReconstruction']);

  return {
    miaAuc: v3Membership?.auc ?? report.v25Summary?.miaAuc ?? readNumber(miaRecord, ['auc', 'attack_auc', 'attackAuc', 'mia_auc', 'miaAuc']),
    miaAccuracy: v3Membership?.accuracy ?? readNumber(miaRecord, ['accuracy', 'attack_accuracy', 'attackAccuracy', 'acc']),
    miaPrecision: v3Membership?.precision ?? null,
    miaRecall: v3Membership?.recall ?? null,
    miaF1: v3Membership?.f1 ?? null,
    miaScoreGap: v3Membership?.scoreGap ?? null,
    miaEvidence: normalizeEvidenceType(v3Membership?.evidenceType ?? readString(miaRecord, ['score_source', 'scoreSource', 'evidence_type', 'evidenceType', 'source'])),
    memberCount: v3Membership?.memberCount ?? null,
    nonMemberCount: v3Membership?.nonMemberCount ?? null,
    anonymizedExamples: v3Membership?.anonymizedExamples ?? [],
    hit10: v3Leakage?.hit10 ?? report.v25Summary?.interactionReconstructionHit10 ?? readNumber(interactionRecord, ['hit@10', 'hit_at_10', 'hitAt10', 'hit10']),
    hit20: v3Leakage?.hit20 ?? report.v25Summary?.interactionReconstructionHit20 ?? readNumber(interactionRecord, ['hit@20', 'hit_at_20', 'hitAt20', 'hit20']),
    hit50: v3Leakage?.hit50 ?? report.v25Summary?.interactionReconstructionHit50 ?? readNumber(interactionRecord, ['hit@50', 'hit_at_50', 'hitAt50', 'hit50']),
    riskyModality: translateSecurityKey(v3Leakage?.highestRiskModality ?? readString(interactionRecord, ['highest_risk_modality', 'highestRiskModality', 'risk_modality', 'modality']) ?? 'item_embedding'),
  };
};
