import {resolveTargetItemZhName} from './targetItemZhNames';
import type {ShowcaseRecommendationItem} from '../types/showcase';
import type {WorkbenchJobListItem, WorkbenchJobStatusResponse, WorkbenchResultResponse} from '../types/workbench';

export type CompareDirection =
  | 'recommendation_manipulation'
  | 'membership_inference'
  | 'update_leakage'
  | 'aggregation_defense';

export type CompareStage = 'baseline' | 'attack' | 'defense';

export interface CompareStageMetrics {
  loss: number | null;
  recall50: number | null;
  ndcg50: number | null;
}

export interface CompareRocPoint {
  fpr: number;
  tpr: number;
  threshold: number | null;
}

export interface CompareLeakageCandidate extends ShowcaseRecommendationItem {
  isGroundTruth: boolean | null;
}

export interface CompareDefenseRound {
  round: number;
  baseline: CompareStageMetrics;
  attack: CompareStageMetrics;
  defense: CompareStageMetrics;
  acceptedClients: number | null;
  rejectedClients: number | null;
  falseRejectedNormal: number | null;
  missedMalicious: number | null;
}

export interface CompareExperiment {
  jobId: string;
  experimentName: string;
  direction: CompareDirection;
  dataset: string;
  model: string;
  status: string;
  source: string;
  startedAt: string | null;
  finishedAt: string | null;
  missingEvidence: string[];
  config: Record<string, unknown>;
  trainingConfig: Record<string, unknown>;
  attackConfig: Record<string, unknown>;
  privacyConfig: Record<string, unknown>;
  defenseConfig: Record<string, unknown>;
  aggregationMode: string | null;
  robustAggregators: string[];
  dpNoiseEnabled: boolean | null;
  performance: Record<string, unknown>;
  training: CompareStageMetrics & {epochs: number | null};
  recommendation: {
    targetItemId: string | null;
    targetItemTitle: string | null;
    baselineRank: number | null;
    attackRank: number | null;
    defenseRank: number | null;
    maskedTargetRank: number | null;
    attackRankChange: number | null;
    defenseRankChange: number | null;
    attackTop50HitCount: number | null;
    attackTop50HitRate: number | null;
    defenseTop50HitCount: number | null;
    defenseTop50HitRate: number | null;
    attackJaccard: number | null;
    defenseJaccard: number | null;
    stages: Record<CompareStage, CompareStageMetrics>;
    recommendations: Record<CompareStage, ShowcaseRecommendationItem[]>;
    hasIndependentDefense: boolean;
  };
  membership: {
    auc: number | null;
    accuracy: number | null;
    precision: number | null;
    recall: number | null;
    f1: number | null;
    scoreGap: number | null;
    threshold: number | null;
    memberCount: number | null;
    nonMemberCount: number | null;
    evidenceSource: string | null;
    labelSource: string | null;
    miaModel: string | null;
    thresholdStrategy: string | null;
    roc: CompareRocPoint[];
    memberScoreMean: number | null;
    nonMemberScoreMean: number | null;
  };
  leakage: {
    hit10: number | null;
    hit20: number | null;
    hit50: number | null;
    candidateCount: number | null;
    candidatePoolSize: number | null;
    groundTruthRank: number | null;
    riskModality: string | null;
    similarityMethod: string | null;
    mrr: number | null;
    inputSource: string | null;
    auditClientCount: number | null;
    candidates: CompareLeakageCandidate[];
    candidateIds: string[];
  };
  defense: {
    baseAttack: string | null;
    algorithm: string | null;
    maliciousRatio: number | null;
    stages: Record<CompareStage, CompareStageMetrics>;
    recoveryRecall: number | null;
    recoveryNdcg: number | null;
    retainedClients: number | null;
    rejectedClients: number | null;
    filteredMalicious: number | null;
    falseRejectedNormal: number | null;
    missedMalicious: number | null;
    aggregationSeconds: number | null;
    defenseSeconds: number | null;
    parameters: Record<string, unknown>;
    rounds: CompareDefenseRound[];
  };
}

export interface CompareCompatibility {
  compatible: boolean;
  metricCompatible: boolean;
  recommendationListsCompatible: boolean;
  messages: string[];
}

const directionLabels: Record<CompareDirection, string> = {
  recommendation_manipulation: '推荐操纵',
  membership_inference: '成员推断',
  update_leakage: '更新泄露',
  aggregation_defense: '聚合防御',
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value);

const record = (value: unknown): Record<string, unknown> => isRecord(value) ? value : {};

const number = (value: unknown): number | null =>
  typeof value === 'number' && Number.isFinite(value) ? value : null;

const boolean = (value: unknown): boolean | null => typeof value === 'boolean' ? value : null;

const string = (value: unknown): string | null => {
  if (typeof value === 'string' && value.trim()) return value.trim();
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return null;
};

const firstNumber = (source: Record<string, unknown>, keys: string[]) => {
  for (const key of keys) {
    const value = number(source[key]);
    if (value !== null) return value;
  }
  return null;
};

const firstString = (source: Record<string, unknown>, keys: string[]) => {
  for (const key of keys) {
    const value = string(source[key]);
    if (value !== null) return value;
  }
  return null;
};

const stageMetrics = (value: unknown): CompareStageMetrics => {
  const source = record(value);
  return {
    loss: firstNumber(source, ['loss', 'train_loss']),
    recall50: firstNumber(source, ['recall_at_50', 'recall50', 'recall']),
    ndcg50: firstNumber(source, ['ndcg_at_50', 'ndcg50', 'ndcg']),
  };
};

const normalizeRecommendation = (value: unknown): ShowcaseRecommendationItem | null => {
  const source = record(value);
  const itemId = firstString(source, ['item_id', 'itemId']);
  if (!itemId) return null;
  return {
    itemId,
    rank: firstNumber(source, ['rank']),
    title: firstString(source, ['title', 'raw_title']),
    category: firstString(source, ['category', 'category_zh']),
    score: firstNumber(source, ['score', 'similarity', 'distance']),
    thumbnailUrl: firstString(source, ['thumbnail_url', 'thumbnailUrl']),
    localImageUrl: firstString(source, ['local_image_url', 'localImageUrl']),
    imageUrl: firstString(source, ['image_url', 'imageUrl']),
    status: firstString(source, ['status']),
    rankChange: firstString(source, ['rank_change', 'rankChange']),
  };
};

const recommendations = (value: unknown) =>
  Array.isArray(value)
    ? value.map(normalizeRecommendation).filter((item): item is ShowcaseRecommendationItem => Boolean(item))
    : [];

const normalizeRoc = (value: unknown): CompareRocPoint[] => {
  if (!Array.isArray(value)) return [];
  return value.flatMap((point) => {
    const source = record(point);
    const fpr = firstNumber(source, ['fpr', 'false_positive_rate']);
    const tpr = firstNumber(source, ['tpr', 'true_positive_rate']);
    if (fpr === null || tpr === null) return [];
    return [{fpr, tpr, threshold: firstNumber(source, ['threshold'])}];
  });
};

const readDirection = (value: unknown): CompareDirection | null => {
  const candidate = string(value);
  return candidate === 'recommendation_manipulation'
    || candidate === 'membership_inference'
    || candidate === 'update_leakage'
    || candidate === 'aggregation_defense'
    ? candidate
    : null;
};

const valueOrNull = (value: unknown) => value === undefined ? null : value;

export const hasRealWorkbenchResult = (result: WorkbenchResultResponse | null | undefined) => {
  const metrics = record(result?.metrics_summary ?? result?.result);
  return Boolean(metrics.job_id || metrics.direction || Object.keys(record(metrics.direction_result)).length || Object.keys(record(metrics.metrics)).length);
};

export const normalizeCompareExperiment = (
  job: WorkbenchJobListItem | WorkbenchJobStatusResponse,
  response: WorkbenchResultResponse,
): CompareExperiment | null => {
  const metrics = record(response.metrics_summary ?? response.result);
  const directionResult = record(metrics.direction_result);
  const flatMetrics = {...record(metrics.metrics), ...directionResult};
  const jobConfigSummary = 'config_summary' in job ? job.config_summary : null;
  const config = record(metrics.config_summary ?? jobConfigSummary);
  const trainingConfig = record(config.training);
  const attackConfig = record(config.attack);
  const privacyConfig = record(config.privacy);
  const defenseConfig = record(config.defense);
  const direction = readDirection(metrics.direction ?? job.direction);
  const dataset = string(metrics.dataset ?? job.dataset);
  if (!direction || !dataset) return null;

  const model = string(metrics.model ?? job.model) ?? '未导出';
  const targetItem = record(directionResult.target_item_info);
  const targetItemId = firstString(directionResult, ['target_item_id', 'targetItemId'])
    ?? firstString(targetItem, ['item_id', 'itemId'])
    ?? firstString(attackConfig, ['target_item_id']);
  const targetItemTitle = firstString(directionResult, ['target_item_title', 'targetItemTitle'])
    ?? firstString(targetItem, ['title'])
    ?? firstString(attackConfig, ['target_item_title'])
    ?? (targetItemId ? resolveTargetItemZhName(targetItemId) : null);

  const baselineMetrics = stageMetrics(directionResult.baseline_metrics ?? directionResult.baseline);
  const attackMetrics = stageMetrics(directionResult.attack_metrics ?? directionResult.attacked);
  const defenseMetrics = stageMetrics(directionResult.defense_metrics ?? directionResult.defended);
  const baselineRecommendations = recommendations(directionResult.baseline_recommendations);
  const attackRecommendations = recommendations(directionResult.attack_recommendations);
  const defenseRecommendations = recommendations(directionResult.defended_recommendations ?? directionResult.defense_recommendations);
  const hasIndependentDefense = boolean(directionResult.has_independent_defense_run) === true
    || defenseRecommendations.length > 0
    || Object.values(defenseMetrics).some((item) => item !== null);
  const legacyTop50Count = firstNumber(directionResult, ['masked_top50_hit_count', 'top50_hit_count']);
  const legacyTop50Rate = firstNumber(directionResult, ['masked_top50_hit_rate', 'top50_hit_rate']);
  const legacyJaccard = firstNumber(directionResult, ['recommendation_jaccard']);
  const maliciousCount = firstNumber(directionResult, ['malicious_client_count']);
  const filteredMalicious = firstNumber(directionResult, ['correctly_filtered_malicious_count', 'filtered_malicious_count']);
  const missedMalicious = maliciousCount !== null && filteredMalicious !== null
    ? Math.max(0, maliciousCount - filteredMalicious)
    : firstNumber(directionResult, ['missed_malicious_count']);
  const performance = record(response.performance_summary);
  const scoreDistribution = record(directionResult.score_distribution);
  const memberDistribution = record(scoreDistribution.member);
  const nonMemberDistribution = record(scoreDistribution.non_member ?? scoreDistribution.nonMember);
  const perClientEvidence = record(directionResult.per_client_evidence);
  const trueIds = new Set<string>();
  Object.values(perClientEvidence).forEach((entry) => {
    const current = record(entry);
    if (Array.isArray(current.true_item_ids)) {
      current.true_item_ids.forEach((id) => {
        const normalized = string(id);
        if (normalized) trueIds.add(normalized);
      });
    }
  });
  const leakageCandidates = recommendations(directionResult.candidates).map((item) => ({
    ...item,
    isGroundTruth: trueIds.size ? trueIds.has(String(item.itemId)) : null,
  }));
  const rounds = Array.isArray(directionResult.rounds)
    ? directionResult.rounds.flatMap((roundValue) => {
        const round = record(roundValue);
        const roundNumber = firstNumber(round, ['round', 'epoch']);
        if (roundNumber === null) return [];
        const roundMalicious = firstNumber(round, ['malicious_client_count']);
        const roundFiltered = firstNumber(round, ['correctly_filtered_malicious_count']);
        return [{
          round: roundNumber,
          baseline: stageMetrics(round.baseline),
          attack: stageMetrics(round.attacked ?? round.attack),
          defense: stageMetrics(round.defended ?? round.defense),
          acceptedClients: firstNumber(round, ['accepted_client_count', 'selected_client_count']),
          rejectedClients: firstNumber(round, ['rejected_client_count']),
          falseRejectedNormal: firstNumber(round, ['false_rejected_normal_count']),
          missedMalicious: roundMalicious !== null && roundFiltered !== null ? Math.max(0, roundMalicious - roundFiltered) : null,
        }];
      })
    : [];

  const trainingSource = record(metrics.training);
  const trainingMetrics = stageMetrics(trainingSource);
  const attackRank = firstNumber(directionResult, ['attack_target_rank', 'attack_unmasked_rank', 'target_rank_after']);
  const baselineRank = firstNumber(directionResult, ['baseline_target_rank', 'baseline_unmasked_rank', 'target_rank_before']);
  const defenseRank = firstNumber(directionResult, ['defended_target_rank', 'defense_unmasked_rank']);

  return {
    jobId: string(metrics.job_id ?? response.job_id ?? job.job_id) ?? job.job_id,
    experimentName: string(job.experiment_name) ?? string(metrics.experiment_name) ?? job.job_id,
    direction,
    dataset,
    model,
    status: string(response.status ?? metrics.status ?? job.status) ?? 'unknown',
    source: string(response.source ?? metrics.source ?? job.source) ?? '未导出',
    startedAt: string(metrics.started_at ?? job.started_at ?? job.created_at),
    finishedAt: string(metrics.finished_at ?? job.finished_at),
    missingEvidence: Array.isArray(response.missing_evidence) ? response.missing_evidence.map(String) : [],
    config,
    trainingConfig,
    attackConfig,
    privacyConfig,
    defenseConfig,
    aggregationMode: firstString(config, ['aggregation_mode']),
    robustAggregators: Array.isArray(config.robust_aggregators) ? config.robust_aggregators.map(String) : [],
    dpNoiseEnabled: boolean(config.dp_noise_enabled),
    performance,
    training: {...trainingMetrics, epochs: firstNumber(trainingSource, ['epochs', 'total_rounds'])},
    recommendation: {
      targetItemId,
      targetItemTitle,
      baselineRank,
      attackRank,
      defenseRank,
      maskedTargetRank: firstNumber(directionResult, ['masked_target_rank']),
      attackRankChange: baselineRank !== null && attackRank !== null ? baselineRank - attackRank : null,
      defenseRankChange: attackRank !== null && defenseRank !== null ? attackRank - defenseRank : null,
      attackTop50HitCount: firstNumber(directionResult, ['attack_top50_hit_count']) ?? (!hasIndependentDefense ? legacyTop50Count : null),
      attackTop50HitRate: firstNumber(directionResult, ['attack_top50_hit_rate']) ?? (!hasIndependentDefense ? legacyTop50Rate : null),
      defenseTop50HitCount: firstNumber(directionResult, ['defended_top50_hit_count', 'defense_top50_hit_count']) ?? (hasIndependentDefense ? legacyTop50Count : null),
      defenseTop50HitRate: firstNumber(directionResult, ['defended_top50_hit_rate', 'defense_top50_hit_rate']) ?? (hasIndependentDefense ? legacyTop50Rate : null),
      attackJaccard: firstNumber(directionResult, ['attack_vs_baseline_jaccard', 'attack_recommendation_jaccard']) ?? (!hasIndependentDefense ? legacyJaccard : null),
      defenseJaccard: firstNumber(directionResult, ['defense_vs_baseline_jaccard']) ?? (hasIndependentDefense ? legacyJaccard : null),
      stages: {baseline: baselineMetrics, attack: attackMetrics, defense: defenseMetrics},
      recommendations: {baseline: baselineRecommendations, attack: attackRecommendations, defense: defenseRecommendations},
      hasIndependentDefense,
    },
    membership: {
      auc: firstNumber(flatMetrics, ['auc', 'mia_auc']),
      accuracy: firstNumber(flatMetrics, ['accuracy']),
      precision: firstNumber(flatMetrics, ['precision']),
      recall: firstNumber(flatMetrics, ['recall']),
      f1: firstNumber(flatMetrics, ['f1']),
      scoreGap: firstNumber(flatMetrics, ['score_gap']),
      threshold: firstNumber(flatMetrics, ['threshold']),
      memberCount: firstNumber(flatMetrics, ['member_count']),
      nonMemberCount: firstNumber(flatMetrics, ['non_member_count']),
      evidenceSource: firstString(flatMetrics, ['evidence_source', 'evidence_type']),
      labelSource: firstString(flatMetrics, ['label_source']),
      miaModel: firstString(flatMetrics, ['mia_model']),
      thresholdStrategy: firstString(flatMetrics, ['threshold_strategy']),
      roc: normalizeRoc(directionResult.roc_curve ?? flatMetrics.roc_curve),
      memberScoreMean: firstNumber(memberDistribution, ['mean']),
      nonMemberScoreMean: firstNumber(nonMemberDistribution, ['mean']),
    },
    leakage: {
      hit10: firstNumber(flatMetrics, ['hit_at_10', 'hit10']),
      hit20: firstNumber(flatMetrics, ['hit_at_20', 'hit20']),
      hit50: firstNumber(flatMetrics, ['hit_at_50', 'hit50']),
      candidateCount: firstNumber(flatMetrics, ['returned_candidate_count', 'candidate_count']) ?? (leakageCandidates.length || null),
      candidatePoolSize: firstNumber(flatMetrics, ['candidate_pool_size']),
      groundTruthRank: firstNumber(flatMetrics, ['ground_truth_rank', 'true_item_rank']),
      riskModality: firstString(flatMetrics, ['highest_risk_modality', 'target_modality', 'risk_modality']),
      similarityMethod: firstString(flatMetrics, ['similarity_method']),
      mrr: firstNumber(flatMetrics, ['mrr', 'mean_reciprocal_rank']),
      inputSource: firstString(flatMetrics, ['input_source', 'update_input_source']),
      auditClientCount: firstNumber(flatMetrics, ['audit_client_count', 'client_count']),
      candidates: leakageCandidates,
      candidateIds: leakageCandidates.map((item) => String(item.itemId)),
    },
    defense: {
      baseAttack: firstString(flatMetrics, ['base_attack']),
      algorithm: firstString(flatMetrics, ['defense_algorithm', 'aggregation_algorithm'])
        ?? (Array.isArray(config.robust_aggregators) ? string(config.robust_aggregators[0]) : null),
      maliciousRatio: firstNumber(flatMetrics, ['malicious_client_ratio']) ?? firstNumber(attackConfig, ['malicious_client_ratio']),
      stages: {baseline: baselineMetrics, attack: attackMetrics, defense: defenseMetrics},
      recoveryRecall: firstNumber(flatMetrics, ['recovery_rate_recall', 'performance_recovery_rate']),
      recoveryNdcg: firstNumber(flatMetrics, ['recovery_rate_ndcg']),
      retainedClients: firstNumber(flatMetrics, ['accepted_client_count', 'selected_client_count', 'retained_client_count']),
      rejectedClients: firstNumber(flatMetrics, ['rejected_client_count']),
      filteredMalicious,
      falseRejectedNormal: firstNumber(flatMetrics, ['false_rejected_normal_count']),
      missedMalicious,
      aggregationSeconds: firstNumber(performance, ['server_aggregation_seconds', 'aggregation_seconds']),
      defenseSeconds: firstNumber(performance, ['defense_total_seconds', 'security_audit_seconds']),
      parameters: record(directionResult.defense_parameters ?? defenseConfig),
      rounds,
    },
  };
};

export const compareCompatibility = (experiments: CompareExperiment[]): CompareCompatibility => {
  if (!experiments.length) {
    return {compatible: true, metricCompatible: true, recommendationListsCompatible: true, messages: []};
  }
  const first = experiments[0];
  const directionMismatch = experiments.some((item) => item.direction !== first.direction);
  const datasetMismatch = experiments.some((item) => item.dataset !== first.dataset);
  const targetValues = experiments.map((item) => item.recommendation.targetItemId);
  const targetIds = new Set(targetValues.filter((item): item is string => Boolean(item)));
  const targetMismatch = first.direction === 'recommendation_manipulation' && targetIds.size > 1;
  const targetMissing = first.direction === 'recommendation_manipulation' && targetValues.some((item) => !item);
  const messages: string[] = [];
  if (directionMismatch) messages.push('所选实验方向不一致，不能进入指标对比。');
  if (datasetMismatch) messages.push('所选实验数据集不一致，不能进入指标对比。');
  if (targetMismatch) messages.push('目标商品不一致：指标仍可比较，推荐商品列表已禁用。');
  if (targetMissing) messages.push('部分实验未导出目标商品：指标仍可比较，推荐商品列表已禁用。');
  return {
    compatible: !directionMismatch && !datasetMismatch,
    metricCompatible: !directionMismatch && !datasetMismatch,
    recommendationListsCompatible: !directionMismatch && !datasetMismatch && !targetMismatch && !targetMissing,
    messages,
  };
};

export const compareSelectionDisabledReason = (
  job: WorkbenchJobListItem,
  resultState: 'loading' | 'available' | 'missing' | 'error' | undefined,
  selectedJobs: WorkbenchJobListItem[],
) => {
  const selected = selectedJobs.some((item) => item.job_id === job.job_id);
  if (selected) return null;
  if (job.status !== 'completed' && job.status !== 'partial') return `状态为${job.status ?? '未知'}，仅 completed 或有真实结果的 partial 可选。`;
  if (resultState === 'loading' || resultState === undefined) return '正在确认该任务是否存在真实 result。';
  if (resultState === 'missing' || resultState === 'error') return '任务结果缺失，不能加入对比。';
  if (selectedJobs.length >= 4) return '对比篮最多选择 4 个实验。';
  const first = selectedJobs[0];
  if (first && first.direction !== job.direction) return `方向不一致：已锁定${directionLabels[first.direction as CompareDirection] ?? first.direction ?? '未知方向'}。`;
  if (first && first.dataset !== job.dataset) return `数据集不一致：已锁定${first.dataset ?? '未知数据集'}。`;
  return null;
};

export const parameterValue = (value: unknown) => valueOrNull(value);

export const candidateJaccard = (left: string[], right: string[]) => {
  const a = new Set(left);
  const b = new Set(right);
  if (!a.size || !b.size) return null;
  let intersection = 0;
  a.forEach((value) => {
    if (b.has(value)) intersection += 1;
  });
  return intersection / (a.size + b.size - intersection);
};
