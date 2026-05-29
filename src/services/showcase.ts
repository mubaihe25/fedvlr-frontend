import {
  attackDefenseCases,
  datasetProfile as mockDatasetProfile,
  deliverySummary,
  showcaseSampleNotice,
} from '../mock/showcase';
import type {
  ShowcaseBundle,
  ShowcaseDataSource,
  ShowcaseDatasetProfile,
  ShowcaseDefenseTrace,
  ShowcaseFetchResult,
  ShowcaseJsonRecord,
  ShowcaseMetricsSummary,
  ShowcaseModelCapabilityMatrix,
  ShowcaseModelCapabilityRow,
  ShowcaseRecommendationComparison,
  ShowcaseRecommendationItem,
  ShowcaseReport,
  ShowcaseScenario,
  ShowcaseTargetRankEntry,
  ShowcaseTargetRankSummary,
  ShowcaseV25Summary,
} from '../types/showcase';
import {apiGet, buildApiUrl} from './api';

const SHOWCASE_BASE_PATH = '/showcase/scenarios';
export const DEFAULT_SHOWCASE_SCENARIO_PREFERENCE = [
  'amazon_beauty_poc_v25_backend_smoke',
  'mmfedrap_ku_attack_defense_demo',
  'model_security_capability_matrix',
  'security_matrix_krum_demo',
] as const;

const isRecord = (value: unknown): value is ShowcaseJsonRecord =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value);

const unwrapPayload = (payload: unknown): unknown => {
  if (isRecord(payload) && 'data' in payload) {
    return payload.data;
  }

  return payload;
};

const readField = (record: ShowcaseJsonRecord | undefined, keys: string[]) => {
  if (!record) {
    return undefined;
  }

  for (const key of keys) {
    if (key in record) {
      return record[key];
    }
  }

  return undefined;
};

const pickRecord = (payload: unknown, keys: string[]) => {
  const value = unwrapPayload(payload);

  if (!isRecord(value)) {
    return undefined;
  }

  for (const key of keys) {
    const nested = value[key];
    if (isRecord(nested)) {
      return nested;
    }
  }

  return value;
};

const pickArray = (payload: unknown, keys: string[]) => {
  const value = unwrapPayload(payload);

  if (Array.isArray(value)) {
    return value;
  }

  if (!isRecord(value)) {
    return undefined;
  }

  for (const key of keys) {
    const nested = value[key];
    if (Array.isArray(nested)) {
      return nested;
    }
    if (isRecord(nested)) {
      const innerArray = pickArray(nested, keys);
      if (innerArray) {
        return innerArray;
      }
    }
  }

  return undefined;
};

const toErrorMessage = (error: unknown) => (error instanceof Error ? error.message : String(error));

const toStringValue = (value: unknown): string | null => {
  if (typeof value === 'string') {
    return value.trim() || null;
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  return null;
};

const toNumberValue = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const parsed = Number(value.replace('%', '').trim());
    if (Number.isFinite(parsed)) {
      return value.includes('%') ? parsed / 100 : parsed;
    }
  }
  return null;
};

const toBooleanValue = (value: unknown): boolean | null => {
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (['true', 'yes', '1', 'available'].includes(normalized)) {
      return true;
    }
    if (['false', 'no', '0', 'unavailable', 'not_available'].includes(normalized)) {
      return false;
    }
  }
  return null;
};

const toStringList = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.map(toStringValue).filter((item): item is string => Boolean(item));
  }
  const singleValue = toStringValue(value);
  return singleValue ? [singleValue] : [];
};

const toIdList = (value: unknown): Array<string | number> => {
  if (!Array.isArray(value)) {
    const single = toStringValue(value);
    return single ? [single] : [];
  }

  return value
    .map((item) => {
      if (typeof item === 'number' || typeof item === 'string') {
        return item;
      }
      if (isRecord(item)) {
        return toStringValue(readField(item, ['client_id', 'clientId', 'id', 'name']));
      }
      return null;
    })
    .filter((item): item is string | number => item !== null);
};

const firstString = (record: ShowcaseJsonRecord | undefined, keys: string[]) => toStringValue(readField(record, keys));

const firstNumber = (record: ShowcaseJsonRecord | undefined, keys: string[]) => toNumberValue(readField(record, keys));

const firstBoolean = (record: ShowcaseJsonRecord | undefined, keys: string[]) => toBooleanValue(readField(record, keys));

const firstStringList = (record: ShowcaseJsonRecord | undefined, keys: string[]) => toStringList(readField(record, keys));

const isLocalFilePath = (value: string) => /^[a-zA-Z]:[\\/]/.test(value) || value.startsWith('\\\\');

const toPublicUrl = (value: unknown): string | null => {
  const stringValue = toStringValue(value);
  if (!stringValue || isLocalFilePath(stringValue)) {
    return null;
  }
  return stringValue;
};

const toPublicAssetUrl = (value: unknown): string | null => {
  const publicUrl = toPublicUrl(value);
  if (!publicUrl) {
    return null;
  }
  return publicUrl.startsWith('/showcase/') ? buildApiUrl(publicUrl) : publicUrl;
};

const inferFlagFromText = (record: ShowcaseJsonRecord, fragments: string[]) => {
  const text = [
    firstString(record, ['id', 'scenario_id', 'scenarioId', 'case_id', 'caseId']),
    firstString(record, ['name', 'title', 'label', 'scenario_name', 'scenarioName']),
    firstString(record, ['dataset', 'dataset_name', 'datasetName']),
    ...firstStringList(record, ['tags', 'scenario_tags', 'scenarioTags']),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return fragments.some((fragment) => text.includes(fragment));
};

const normalizeScenario = (
  value: unknown,
  index: number,
  dataSource: Extract<ShowcaseDataSource, 'api' | 'mock'>,
): ShowcaseScenario => {
  const record = isRecord(value) ? value : {};
  const id =
    firstString(record, ['scenario_id', 'scenarioId', 'id', 'key', 'case_id', 'caseId']) ??
    `showcase-scenario-${index + 1}`;
  const name = firstString(record, ['name', 'title', 'label', 'scenario_name', 'scenarioName']) ?? id;

  return {
    id,
    scenarioId: id,
    name,
    dataset: firstString(record, ['dataset', 'dataset_name', 'datasetName']),
    model: firstString(record, ['model', 'model_name', 'modelName']),
    tags: firstStringList(record, ['tags', 'scenario_tags', 'scenarioTags']),
    warnings: firstStringList(record, ['warnings', 'warning', 'notes', 'limitations']),
    dataSource,
    unavailable: firstBoolean(record, ['unavailable']),
    notAvailable: firstBoolean(record, ['not_available', 'notAvailable']),
    smoke: firstBoolean(record, ['smoke', 'is_smoke', 'isSmoke']) ?? inferFlagFromText(record, ['smoke']),
    proxy: firstBoolean(record, ['proxy', 'is_proxy', 'isProxy']) ?? inferFlagFromText(record, ['proxy']),
    demo: firstBoolean(record, ['demo', 'is_demo', 'isDemo']) ?? inferFlagFromText(record, ['demo']),
    demoOnly: firstBoolean(record, ['demo_only', 'demoOnly']) ?? inferFlagFromText(record, ['demo_only', 'demo-only', 'demo']),
    raw: isRecord(value) ? value : undefined,
  };
};

const normalizeScenarioList = (payload: unknown, dataSource: Extract<ShowcaseDataSource, 'api' | 'mock'>) => {
  const scenarios = pickArray(payload, ['scenarios', 'items', 'results']);

  if (!scenarios?.length) {
    throw new Error('No showcase scenarios returned by API');
  }

  return scenarios.map((item, index) => normalizeScenario(item, index, dataSource));
};

const normalizeDatasetProfile = (payload: unknown): ShowcaseDatasetProfile => {
  const record = pickRecord(payload, ['dataset_profile', 'datasetProfile', 'profile', 'dataset']) ?? {};

  return {
    dataset: firstString(record, ['dataset', 'name', 'dataset_name', 'datasetName']),
    name: firstString(record, ['name', 'dataset', 'dataset_name', 'datasetName']),
    source: firstString(record, ['source', 'artifact', 'artifact_source', 'artifactSource']),
    users: readField(record, ['users', 'num_users', 'numUsers', 'user_count', 'userCount']) as string | number | null | undefined,
    items: readField(record, ['items', 'num_items', 'numItems', 'item_count', 'itemCount']) as string | number | null | undefined,
    interactions: readField(record, ['interactions', 'num_interactions', 'numInteractions', 'interaction_count', 'interactionCount']) as
      | string
      | number
      | null
      | undefined,
    train: readField(record, ['train', 'train_size', 'trainSize']) as string | number | null | undefined,
    valid: readField(record, ['valid', 'validation', 'valid_size', 'validSize']) as string | number | null | undefined,
    test: readField(record, ['test', 'test_size', 'testSize']) as string | number | null | undefined,
    sparsity: readField(record, ['sparsity']) as string | number | null | undefined,
    modalities: firstStringList(record, ['modalities', 'available_modalities', 'availableModalities']),
    textFeatureMethod: firstString(record, ['text_feature_method', 'textFeatureMethod', 'text_features', 'textFeatures']),
    imageFeatureMethod: firstString(record, ['image_feature_method', 'imageFeatureMethod', 'image_features', 'imageFeatures']),
    note: firstString(record, ['note', 'description', 'summary']),
    warnings: firstStringList(record, ['warnings', 'warning', 'notes', 'limitations']),
    raw: isRecord(record) ? record : undefined,
  };
};

const normalizeMetricSet = (payload: unknown): Record<string, unknown> => {
  const record = isRecord(payload) ? payload : {};

  return {
    ...record,
    recall50: firstNumber(record, ['recall50', 'recall_50', 'recall@50', 'Recall@50', 'recall_at_50']),
    ndcg50: firstNumber(record, ['ndcg50', 'ndcg_50', 'ndcg@50', 'NDCG@50', 'ndcg_at_50']),
  };
};

const normalizeMetricsSummary = (payload: unknown): ShowcaseMetricsSummary => {
  const record = pickRecord(payload, ['metrics_summary', 'metricsSummary', 'metrics', 'summary']) ?? {};
  const attackImpact = pickRecord(record.attack_impact ?? record.attackImpact, ['attack_impact', 'attackImpact']);
  const manipulationRecord =
    pickRecord(record.recommendation_manipulation ?? record.recommendationManipulation, [
      'recommendation_manipulation',
      'recommendationManipulation',
    ]) ?? {};
  const baselinePayload = readField(record, ['baseline', 'baseline_metrics', 'baselineMetrics', 'clean']) ?? record;
  const baseline = normalizeMetricSet(baselinePayload);
  const attack = normalizeMetricSet(readField(record, ['attack', 'attack_metrics', 'attackMetrics', 'attacked']));
  const defense = normalizeMetricSet(readField(record, ['defense', 'defense_metrics', 'defenseMetrics', 'defended']));
  const recallDrop =
    firstNumber(record, ['recall_drop', 'recallDrop', 'attack_recall_drop', 'attackRecallDrop']) ??
    firstNumber(attackImpact, ['recall_drop', 'recallDrop']);
  const ndcgDrop =
    firstNumber(record, ['ndcg_drop', 'ndcgDrop', 'attack_ndcg_drop', 'attackNdcgDrop']) ??
    firstNumber(attackImpact, ['ndcg_drop', 'ndcgDrop']);

  return {
    baseline,
    attack,
    defense,
    recallDrop,
    ndcgDrop,
    recoveryRate: firstNumber(record, [
      'recovery_rate',
      'recoveryRate',
      'recall_recovery_rate',
      'recallRecoveryRate',
      'defense_recovery_rate',
      'defenseRecoveryRate',
    ]),
    targetHitRate:
      firstNumber(record, ['target_hit_rate', 'targetHitRate', 'target_hit_rate_attack', 'targetHitRateAttack']) ??
      firstNumber(manipulationRecord, [
        'target_hit_rate_attack',
        'targetHitRateAttack',
        'target_hit_rate_at_k_attack',
        'targetHitRateAtKAttack',
        'injected_target_hit_rate_attack',
        'injectedTargetHitRateAttack',
      ]),
    warnings: firstStringList(record, ['warnings', 'warning', 'notes']),
    unavailable: firstBoolean(record, ['unavailable', 'not_available', 'notAvailable']),
    raw: record,
  };
};

const normalizeRecommendationItem = (value: unknown, index: number): ShowcaseRecommendationItem => {
  if (!isRecord(value)) {
    return {
      rank: index + 1,
      title: toStringValue(value),
    };
  }

  return {
    rank: firstNumber(value, ['rank', 'position']),
    itemId: readField(value, ['item_id', 'itemId', 'id', 'asin', 'product_id', 'productId']) as string | number | null | undefined,
    title: firstString(value, ['title', 'item_title', 'itemTitle', 'name', 'product_title', 'productTitle']),
    category: firstString(value, ['category', 'item_category', 'itemCategory']),
    localImageUrl: toPublicAssetUrl(readField(value, ['local_image_url', 'localImageUrl'])),
    imageUrl: toPublicAssetUrl(readField(value, ['image_url', 'imageUrl', 'image', 'thumbnail', 'thumbnail_url', 'thumbnailUrl'])),
    score: firstNumber(value, ['score', 'prediction', 'predicted_score', 'predictedScore']),
    reason: firstString(value, ['reason', 'note', 'description']),
    mainModality: firstString(value, ['main_modality', 'mainModality', 'modality']),
    status: firstString(value, ['status', 'state']),
    rankChange: readField(value, ['rank_change', 'rankChange', 'delta_rank', 'deltaRank']) as string | number | null | undefined,
    raw: value,
  };
};

const normalizeRecommendationList = (value: unknown) => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map(normalizeRecommendationItem);
};

const normalizeRecommendationComparison = (payload: unknown): ShowcaseRecommendationComparison => {
  const record = pickRecord(payload, ['recommendation_comparison', 'recommendationComparison', 'recommendations', 'comparison']) ?? {};

  return {
    baseline: normalizeRecommendationList(
      readField(record, ['baseline', 'baseline_recommendations', 'baselineRecommendations', 'clean', 'baseline_items']),
    ),
    attack: normalizeRecommendationList(
      readField(record, ['attack', 'attacked', 'attack_recommendations', 'attacked_recommendations', 'attackedRecommendations', 'attack_items']),
    ),
    defense: normalizeRecommendationList(
      readField(record, ['defense', 'defended', 'defense_recommendations', 'defended_recommendations', 'defendedRecommendations', 'defense_items']),
    ),
    warnings: firstStringList(record, ['warnings', 'warning', 'notes']),
    unavailable: firstBoolean(record, ['unavailable', 'not_available', 'notAvailable']),
    raw: record,
  };
};

const normalizeTargetRankEntry = (value: unknown): ShowcaseTargetRankEntry => {
  const record = isRecord(value) ? value : {};
  const baselineRecord = pickRecord(record.baseline, ['baseline']);
  const attackRecord = pickRecord(record.attack, ['attack', 'attacked']);
  const defenseRecord = pickRecord(record.defense, ['defense', 'defended']);

  return {
    itemId: readField(record, ['item_id', 'itemId', 'target_item_id', 'targetItemId', 'id']) as string | number | null | undefined,
    title: firstString(record, ['title', 'target_title', 'targetTitle', 'name']),
    baselineRank:
      firstNumber(record, [
        'baseline_rank',
        'baselineRank',
        'clean_rank',
        'cleanRank',
        'baseline_best_unmasked_rank',
        'baselineBestUnmaskedRank',
        'baseline_mean_unmasked_rank',
        'baselineMeanUnmaskedRank',
      ]) ?? firstNumber(baselineRecord, ['best_unmasked_rank', 'bestUnmaskedRank', 'mean_unmasked_rank', 'meanUnmaskedRank']),
    attackRank:
      firstNumber(record, [
        'attack_rank',
        'attackRank',
        'attacked_rank',
        'attackedRank',
        'attack_best_unmasked_rank',
        'attackBestUnmaskedRank',
        'attack_mean_unmasked_rank',
        'attackMeanUnmaskedRank',
      ]) ?? firstNumber(attackRecord, ['best_unmasked_rank', 'bestUnmaskedRank', 'mean_unmasked_rank', 'meanUnmaskedRank']),
    defenseRank:
      firstNumber(record, ['defense_rank', 'defenseRank', 'defended_rank', 'defendedRank']) ??
      firstNumber(defenseRecord, ['best_unmasked_rank', 'bestUnmaskedRank', 'mean_unmasked_rank', 'meanUnmaskedRank']),
    rankGain: firstNumber(record, [
      'rank_gain',
      'rankGain',
      'rank_delta',
      'rankDelta',
      'best_rank_shift_positive_is_better',
      'bestRankShiftPositiveIsBetter',
      'mean_rank_shift_positive_is_better',
      'meanRankShiftPositiveIsBetter',
    ]),
    scoreGain: firstNumber(record, [
      'score_gain',
      'scoreGain',
      'score_delta',
      'scoreDelta',
      'best_score_gain',
      'bestScoreGain',
      'mean_score_gain',
      'meanScoreGain',
    ]),
    targetHitRate: firstNumber(record, ['target_hit_rate', 'targetHitRate']),
    inTop50: firstBoolean(record, ['in_top50', 'inTop50', 'top50_hit', 'top50Hit', 'entered_top50', 'enteredTop50', 'target_entered_top50']),
    raw: isRecord(value) ? value : undefined,
  };
};

const normalizeTargetRankSummary = (payload: unknown): ShowcaseTargetRankSummary => {
  const record = pickRecord(payload, ['target_rank_summary', 'targetRankSummary', 'target_rank_comparison', 'targetRankComparison']) ?? {};
  const nestedRankScore = pickRecord(readField(record, ['target_rank_score', 'targetRankScore']), ['target_rank_score', 'targetRankScore']);
  const sourceRecord = nestedRankScore ?? record;
  const entries =
    pickArray(sourceRecord, ['entries', 'items', 'targets', 'rows', 'target_rank_comparison', 'targetRankComparison']) ??
    (Array.isArray(sourceRecord) ? sourceRecord : []);

  return {
    entries: entries.map(normalizeTargetRankEntry),
    targetHitRate: firstNumber(sourceRecord, [
      'target_hit_rate',
      'targetHitRate',
      'target_hit_rate_attack',
      'targetHitRateAttack',
      'target_hit_rate_at_k_attack',
      'targetHitRateAtKAttack',
    ]),
    note: firstString(sourceRecord, ['note', 'summary', 'description']),
    warnings: firstStringList(sourceRecord, ['warnings', 'warning', 'notes']),
    unavailable: firstBoolean(sourceRecord, ['unavailable', 'not_available', 'notAvailable']),
    raw: sourceRecord,
  };
};

const normalizeDefenseTrace = (payload: unknown): ShowcaseDefenseTrace => {
  const record =
    pickRecord(payload, ['defense_trace', 'defenseTrace', 'security', 'security_matrix', 'securityMatrix', 'robust_defense']) ?? {};
  const krumRecord = pickRecord(record.krum ?? record.krum_trace ?? record.krumTrace, ['krum', 'krum_trace', 'krumTrace']);

  return {
    totalClients: firstNumber(record, ['total_clients', 'totalClients', 'clients']),
    maliciousClients: firstNumber(record, ['malicious_clients', 'maliciousClients', 'attack_clients', 'attackClients']),
    clippedClients: firstNumber(record, ['clipped_clients', 'clippedClients', 'clipped_client_count', 'clippedClientCount']),
    filteredClients: firstNumber(record, ['filtered_clients', 'filteredClients', 'filtered_client_count', 'filteredClientCount']),
    trimmedUpdates: firstNumber(record, ['trimmed_updates', 'trimmedUpdates']),
    aggregationRule: firstString(record, ['aggregation_rule', 'aggregationRule', 'aggregator', 'defense_type', 'defenseType']),
    notes: firstStringList(record, ['notes', 'warnings', 'summary']),
    krumSelected: toIdList(
      readField(record, ['krum_selected', 'krumSelected', 'selected', 'selected_indices', 'selectedIndices']) ??
        readField(krumRecord, ['selected', 'selected_clients', 'selected_indices']),
    ),
    krumRejected: toIdList(
      readField(record, ['krum_rejected', 'krumRejected', 'rejected', 'rejected_indices', 'rejectedIndices']) ??
        readField(krumRecord, ['rejected', 'rejected_clients', 'rejected_indices']),
    ),
    trimmedMean: readField(record, ['trimmed_mean', 'trimmedMean']),
    median: readField(record, ['median']),
    dpNoise: readField(record, ['dp_noise', 'dpNoise']),
    secureAggSim: readField(record, ['secure_agg_sim', 'secureAggSim', 'secure_aggregation_sim', 'secureAggregationSim']),
    unavailable: firstBoolean(record, ['unavailable', 'not_available', 'notAvailable']),
    warnings: firstStringList(record, ['warnings', 'warning']),
    raw: record,
  };
};

const normalizeCapabilityRow = (value: unknown): ShowcaseModelCapabilityRow => {
  const record = isRecord(value) ? value : {};

  return {
    model: firstString(record, ['model', 'model_name', 'modelName']),
    dataset: firstString(record, ['dataset', 'dataset_name', 'datasetName']),
    capability: firstString(record, ['capability', 'capability_name', 'capabilityName', 'demo', 'feature']),
    status: firstString(record, ['status', 'state']),
    evidence: firstString(record, ['evidence', 'source', 'artifact', 'summary']),
    reason: firstString(record, ['reason', 'note', 'description']),
    recommendedDemoUsage: firstString(record, ['recommended_demo_usage', 'recommendedDemoUsage', 'usage', 'recommended_usage']),
    raw: isRecord(value) ? value : undefined,
  };
};

const normalizeCapabilityRows = (payload: unknown): ShowcaseModelCapabilityRow[] => {
  const rows = pickArray(payload, ['entries', 'rows', 'items', 'supported_demos', 'supportedDemos', 'unsupported_reasons', 'unsupportedReasons']);
  return rows?.map(normalizeCapabilityRow) ?? [];
};

const normalizeStatusCounts = (value: unknown): Record<string, number> | undefined => {
  if (!isRecord(value)) {
    return undefined;
  }

  const counts = Object.entries(value).reduce<Record<string, number>>((accumulator, [key, item]) => {
    const numberValue = toNumberValue(item);
    if (numberValue !== null) {
      accumulator[key] = numberValue;
    }
    return accumulator;
  }, {});

  return Object.keys(counts).length ? counts : undefined;
};

const normalizeModelCapabilityMatrix = (payload: unknown): ShowcaseModelCapabilityMatrix | null => {
  const payloadRecord = isRecord(payload) ? payload : {};
  const record = pickRecord(payloadRecord, ['model_security_capability_matrix', 'modelSecurityCapabilityMatrix', 'matrix']) ?? {};
  const supportedRecord = pickRecord(readField(payloadRecord, ['supported_demos', 'supportedDemos']), [
    'supported_demos',
    'supportedDemos',
  ]);
  const unsupportedRecord = pickRecord(readField(payloadRecord, ['unsupported_reasons', 'unsupportedReasons']), [
    'unsupported_reasons',
    'unsupportedReasons',
  ]);
  const labelsRecord = pickRecord(readField(payloadRecord, ['recommended_frontend_labels', 'recommendedFrontendLabels']), [
    'recommended_frontend_labels',
    'recommendedFrontendLabels',
  ]);
  const entries = normalizeCapabilityRows(record);
  const supportedDemos = normalizeCapabilityRows(supportedRecord);
  const unsupportedReasons = normalizeCapabilityRows(unsupportedRecord);

  if (!entries.length && !supportedDemos.length && !unsupportedReasons.length) {
    return null;
  }

  return {
    entries,
    supportedDemos,
    unsupportedReasons,
    statusCounts: normalizeStatusCounts(readField(record, ['status_counts', 'statusCounts'])),
    recommendedFrontendLabels: labelsRecord,
    warnings: uniqueStrings([
      ...firstStringList(record, ['warnings', 'warning']),
      ...firstStringList(labelsRecord, ['warnings', 'warning']),
    ]),
    raw: isRecord(payload) ? payload : undefined,
  };
};

const normalizeV25Summary = (
  scenarioId: string,
  attackDefenseSummaryPayload: unknown,
  privacyRiskSummaryPayload: unknown,
  defenseTracePayload: unknown,
): ShowcaseV25Summary | null => {
  const text = scenarioId.toLowerCase();
  const attackDefenseRecord = isRecord(attackDefenseSummaryPayload) ? attackDefenseSummaryPayload : {};
  const privacyRecord = isRecord(privacyRiskSummaryPayload) ? privacyRiskSummaryPayload : {};
  const defenseRecord = isRecord(defenseTracePayload) ? defenseTracePayload : {};
  const rankRecord = pickRecord(readField(attackDefenseRecord, ['target_rank_score', 'targetRankScore']), [
    'target_rank_score',
    'targetRankScore',
  ]);
  const firstRankRow = normalizeTargetRankEntry((pickArray(rankRecord, ['rows', 'entries', 'items']) ?? [])[0]);
  const manipulationRecord =
    pickRecord(readField(attackDefenseRecord, ['recommendation_manipulation', 'recommendationManipulation']), [
      'recommendation_manipulation',
      'recommendationManipulation',
    ]) ?? {};
  const interactionRecord =
    pickRecord(readField(privacyRecord, ['interaction_reconstruction', 'interactionReconstruction']), [
      'interaction_reconstruction',
      'interactionReconstruction',
    ]) ?? {};
  const miaRecord =
    pickRecord(readField(privacyRecord, ['membership_inference', 'membershipInference', 'mia']), [
      'membership_inference',
      'membershipInference',
      'mia',
    ]) ?? {};
  const secAggRecord =
    pickRecord(readField(defenseRecord, ['secure_aggregation_demo', 'secureAggregationDemo', 'secure_agg', 'secureAgg']), [
      'secure_aggregation_demo',
      'secureAggregationDemo',
      'secure_agg',
      'secureAgg',
    ]) ??
    pickRecord(readField(privacyRecord, ['secure_aggregation_demo', 'secureAggregationDemo']), [
      'secure_aggregation_demo',
      'secureAggregationDemo',
    ]) ??
    {};
  const opacusRecord =
    pickRecord(readField(privacyRecord, ['opacus_feasibility', 'opacusFeasibility', 'opacus_toy', 'opacusToy']), [
      'opacus_feasibility',
      'opacusFeasibility',
      'opacus_toy',
      'opacusToy',
    ]) ?? {};

  if (!text.includes('v25') && !firstRankRow.baselineRank && !firstRankRow.attackRank && !miaRecord.attack_auc) {
    return null;
  }

  return {
    targetRankBefore: firstRankRow.baselineRank,
    targetRankAfter: firstRankRow.attackRank,
    rankMove: firstRankRow.rankGain,
    scoreGain: firstRankRow.scoreGain,
    maskedTopkHitRate:
      firstNumber(manipulationRecord, ['target_hit_rate_at_k_attack', 'targetHitRateAtKAttack', 'masked_topk_hit_rate', 'maskedTopkHitRate']) ??
      firstNumber(manipulationRecord, ['target_hit_rate_attack', 'targetHitRateAttack']),
    interactionReconstructionHit10: firstNumber(interactionRecord, ['hit@10', 'hit_at_10', 'hitAt10', 'hit10']),
    interactionReconstructionHit20: firstNumber(interactionRecord, ['hit@20', 'hit_at_20', 'hitAt20', 'hit20']),
    interactionReconstructionHit50: firstNumber(interactionRecord, ['hit@50', 'hit_at_50', 'hitAt50', 'hit50']),
    interactionReconstructionStatus: firstString(interactionRecord, ['status', 'state']),
    miaAuc: firstNumber(miaRecord, ['attack_auc', 'attackAuc', 'auc', 'mia_auc', 'miaAuc']),
    secAggResidual: firstNumber(secAggRecord, ['aggregate_residual_norm', 'aggregateResidualNorm', 'residual', 'secagg_residual']),
    opacusStatus: firstString(opacusRecord, ['status', 'state']),
    opacusBoundary: firstString(opacusRecord, ['note', 'warning', 'summary']),
    warnings: uniqueStrings([
      ...firstStringList(privacyRecord, ['warnings', 'warning']),
      ...firstStringList(opacusRecord, ['warnings', 'warning']),
    ]),
    raw: {
      attackDefenseSummary: attackDefenseRecord,
      privacyRiskSummary: privacyRecord,
      defenseTrace: defenseRecord,
    },
  };
};

const uniqueStrings = (values: string[]) => Array.from(new Set(values.filter(Boolean)));

const normalizeReport = (payload: unknown, scenario?: ShowcaseScenario): ShowcaseReport => {
  const record = pickRecord(payload, ['report', 'artifact', 'showcase_report', 'showcaseReport']) ?? {};
  const scenarioRecord = pickRecord(record.scenario, ['scenario']) ?? undefined;
  const metricsSummaryPayload = readField(record, ['metrics_summary', 'metricsSummary', 'metrics']) ?? record;
  const attackDefenseSummaryPayload = readField(record, ['attack_defense_summary', 'attackDefenseSummary']);
  const privacyRiskSummaryPayload = readField(record, ['privacy_risk_summary', 'privacyRiskSummary', 'privacy']);
  const defenseTracePayload = readField(record, ['defense_trace', 'defenseTrace', 'security', 'security_matrix', 'securityMatrix']);
  const metricsSummary = normalizeMetricsSummary(metricsSummaryPayload);
  const attackDefenseMetrics = attackDefenseSummaryPayload ? normalizeMetricsSummary(attackDefenseSummaryPayload) : null;
  const targetRankPayload =
    readField(record, ['target_rank_summary', 'targetRankSummary', 'target_rank_comparison', 'targetRankComparison']) ??
    attackDefenseSummaryPayload ??
    record;
  const scenarioId =
    firstString(record, ['scenario_id', 'scenarioId', 'id', 'case_id', 'caseId']) ??
    firstString(scenarioRecord, ['scenario_id', 'scenarioId', 'id']) ??
    scenario?.scenarioId ??
    'showcase-scenario';

  const warnings = uniqueStrings([
    ...(scenario?.warnings ?? []),
    ...firstStringList(record, ['warnings', 'warning', 'notes']),
  ]);

  return {
    scenarioId,
    title: firstString(record, ['title', 'name']) ?? scenario?.name,
    dataset: firstString(record, ['dataset', 'dataset_name', 'datasetName']) ?? scenario?.dataset,
    model: firstString(record, ['model', 'model_name', 'modelName']) ?? scenario?.model,
    datasetProfile: normalizeDatasetProfile(readField(record, ['dataset_profile', 'datasetProfile', 'dataset']) ?? record),
    metricsSummary: {
      ...metricsSummary,
      baseline: attackDefenseMetrics?.baseline ?? metricsSummary.baseline,
      attack: attackDefenseMetrics?.attack ?? metricsSummary.attack,
      defense: attackDefenseMetrics?.defense ?? metricsSummary.defense,
      recallDrop: attackDefenseMetrics?.recallDrop ?? metricsSummary.recallDrop,
      ndcgDrop: attackDefenseMetrics?.ndcgDrop ?? metricsSummary.ndcgDrop,
      recoveryRate: attackDefenseMetrics?.recoveryRate ?? metricsSummary.recoveryRate,
      targetHitRate: attackDefenseMetrics?.targetHitRate ?? metricsSummary.targetHitRate,
    },
    attackDefenseSummary: attackDefenseSummaryPayload,
    privacyRiskSummary: privacyRiskSummaryPayload,
    recommendationComparison: normalizeRecommendationComparison(readField(record, ['recommendation_comparison', 'recommendationComparison', 'recommendations']) ?? record),
    targetRankSummary: normalizeTargetRankSummary(targetRankPayload),
    defenseTrace: normalizeDefenseTrace(defenseTracePayload ?? record),
    modelCapabilityMatrix: normalizeModelCapabilityMatrix(record),
    v25Summary: normalizeV25Summary(scenarioId, attackDefenseSummaryPayload, privacyRiskSummaryPayload, defenseTracePayload),
    security: readField(record, ['security', 'security_matrix', 'securityMatrix']),
    privacy: readField(record, ['privacy']),
    delivery: readField(record, ['delivery', 'delivery_summary', 'deliverySummary']),
    warnings,
    boundaries: uniqueStrings(firstStringList(record, ['boundaries', 'limitations', 'boundary_notes', 'boundaryNotes'])),
    unavailable: firstBoolean(record, ['unavailable']),
    notAvailable: firstBoolean(record, ['not_available', 'notAvailable']),
    smoke: firstBoolean(record, ['smoke', 'is_smoke', 'isSmoke']) ?? scenario?.smoke,
    proxy: firstBoolean(record, ['proxy', 'is_proxy', 'isProxy']) ?? scenario?.proxy,
    demo: firstBoolean(record, ['demo', 'is_demo', 'isDemo']) ?? scenario?.demo,
    demoOnly: firstBoolean(record, ['demo_only', 'demoOnly']) ?? scenario?.demoOnly,
    raw: record,
  };
};

const buildFallbackScenario = (scenarioId?: string): ShowcaseScenario => {
  const fallbackCase = attackDefenseCases.find((item) => item.caseId === scenarioId) ?? attackDefenseCases[0];

  return {
    id: fallbackCase.caseId,
    scenarioId: fallbackCase.caseId,
    name: fallbackCase.title,
    dataset: fallbackCase.dataset || mockDatasetProfile.name,
    model: 'FedVLR showcase 演示数据',
    tags: ['演示数据', '样例结构', 'Recall@50', 'NDCG@50'],
    warnings: [showcaseSampleNotice],
    dataSource: 'mock',
    demo: true,
    demoOnly: true,
  };
};

const buildFallbackReport = (scenario: ShowcaseScenario): ShowcaseReport => {
  const fallbackCase = attackDefenseCases.find((item) => item.caseId === scenario.scenarioId) ?? attackDefenseCases[0];
  const metricsSummary: ShowcaseMetricsSummary = {
    baseline: {
      recall50: fallbackCase.baselineMetrics.recall50,
      ndcg50: fallbackCase.baselineMetrics.ndcg50,
    },
    attack: {
      recall50: fallbackCase.attackMetrics.recall50,
      ndcg50: fallbackCase.attackMetrics.ndcg50,
    },
    defense: {
      recall50: fallbackCase.defenseMetrics.recall50,
      ndcg50: fallbackCase.defenseMetrics.ndcg50,
    },
    recallDrop: fallbackCase.attackImpact.recallDrop,
    ndcgDrop: fallbackCase.attackImpact.ndcgDrop,
    recoveryRate: fallbackCase.recoveryRate,
    warnings: [showcaseSampleNotice],
  };
  const defenseTrace: ShowcaseDefenseTrace = {
    totalClients: fallbackCase.defenseTrace.totalClients,
    maliciousClients: fallbackCase.defenseTrace.maliciousClients,
    clippedClients: fallbackCase.defenseTrace.clippedClients,
    filteredClients: fallbackCase.defenseTrace.filteredClients,
    trimmedUpdates: fallbackCase.defenseTrace.trimmedUpdates,
    aggregationRule: fallbackCase.defenseTrace.aggregationRule,
    notes: fallbackCase.defenseTrace.notes,
  };

  return {
    scenarioId: scenario.scenarioId,
    title: fallbackCase.title,
    dataset: fallbackCase.dataset,
    model: scenario.model,
    datasetProfile: normalizeDatasetProfile(mockDatasetProfile),
    metricsSummary,
    attackDefenseSummary: fallbackCase.note,
    privacyRiskSummary: 'API 未连接时的演示数据。隐私与安全规划标签不能解读为已实现的正式差分隐私或生产级安全聚合。',
    recommendationComparison: normalizeRecommendationComparison(fallbackCase.recommendationComparison),
    targetRankSummary: {
      entries: [],
      note: 'API 未连接时的演示数据不包含目标排序对比 artifact。',
      unavailable: true,
    },
    defenseTrace,
    delivery: deliverySummary,
    warnings: [showcaseSampleNotice],
    boundaries: [
      'API 未连接时使用演示数据结构。',
      'No formal differential privacy accountant is implemented in this fallback.',
      'Secure aggregation is not implemented in this fallback.',
    ],
    demo: true,
    demoOnly: true,
  };
};

export const fallbackToMockShowcase = (scenarioId?: string, fallbackReason?: string): ShowcaseBundle => {
  const selectedScenario = buildFallbackScenario(scenarioId);
  const fallbackWarning = fallbackReason ? `API 未连接，已切换到演示数据：${fallbackReason}` : undefined;

  return {
    scenarios: [
      {
        ...selectedScenario,
        warnings: uniqueStrings([...(selectedScenario.warnings ?? []), ...(fallbackWarning ? [fallbackWarning] : [])]),
      },
    ],
    selectedScenario,
    report: buildFallbackReport(selectedScenario),
    dataSource: 'mock',
    scenarioSource: 'mock',
    fallbackReason,
    fetchedAt: new Date().toISOString(),
  };
};

export const fetchShowcaseScenarios = async (): Promise<ShowcaseFetchResult<ShowcaseScenario[]>> => {
  try {
    const payload = await apiGet<unknown>(SHOWCASE_BASE_PATH);
    return {
      source: 'api',
      data: normalizeScenarioList(payload, 'api'),
    };
  } catch (error) {
    const fallback = fallbackToMockShowcase(undefined, toErrorMessage(error));
    return {
      source: 'mock',
      data: fallback.scenarios,
      error: toErrorMessage(error),
    };
  }
};

export const fetchShowcaseReport = async (scenarioId: string): Promise<ShowcaseFetchResult<ShowcaseReport>> => {
  try {
    const payload = await apiGet<unknown>(`${SHOWCASE_BASE_PATH}/${encodeURIComponent(scenarioId)}/report`);
    return {
      source: 'api',
      data: normalizeReport(payload),
    };
  } catch (error) {
    const fallback = fallbackToMockShowcase(scenarioId, toErrorMessage(error));
    return {
      source: 'mock',
      data: fallback.report,
      error: toErrorMessage(error),
    };
  }
};

export const fetchShowcaseDataset = async (scenarioId: string): Promise<ShowcaseFetchResult<ShowcaseDatasetProfile>> => {
  try {
    const payload = await apiGet<unknown>(`${SHOWCASE_BASE_PATH}/${encodeURIComponent(scenarioId)}/dataset`);
    return {
      source: 'api',
      data: normalizeDatasetProfile(payload),
    };
  } catch (error) {
    const fallback = fallbackToMockShowcase(scenarioId, toErrorMessage(error));
    return {
      source: 'mock',
      data: fallback.report.datasetProfile ?? {},
      error: toErrorMessage(error),
    };
  }
};

export const fetchShowcaseRecommendations = async (
  scenarioId: string,
): Promise<ShowcaseFetchResult<ShowcaseRecommendationComparison>> => {
  try {
    const payload = await apiGet<unknown>(`${SHOWCASE_BASE_PATH}/${encodeURIComponent(scenarioId)}/recommendations`);
    return {
      source: 'api',
      data: normalizeRecommendationComparison(payload),
    };
  } catch (error) {
    const fallback = fallbackToMockShowcase(scenarioId, toErrorMessage(error));
    return {
      source: 'mock',
      data: fallback.report.recommendationComparison ?? {baseline: [], attack: [], defense: []},
      error: toErrorMessage(error),
    };
  }
};

const fetchShowcaseMetrics = async (scenarioId: string): Promise<ShowcaseFetchResult<ShowcaseMetricsSummary>> => {
  try {
    const payload = await apiGet<unknown>(`${SHOWCASE_BASE_PATH}/${encodeURIComponent(scenarioId)}/metrics`);
    return {
      source: 'api',
      data: normalizeMetricsSummary(payload),
    };
  } catch (error) {
    const fallback = fallbackToMockShowcase(scenarioId, toErrorMessage(error));
    return {
      source: 'mock',
      data: fallback.report.metricsSummary ?? {},
      error: toErrorMessage(error),
    };
  }
};

const fetchShowcaseSecurity = async (scenarioId: string): Promise<ShowcaseFetchResult<Partial<ShowcaseReport>>> => {
  try {
    const payload = await apiGet<unknown>(`${SHOWCASE_BASE_PATH}/${encodeURIComponent(scenarioId)}/security`);
    return {
      source: 'api',
      data: {
        defenseTrace: normalizeDefenseTrace(payload),
        security: unwrapPayload(payload),
      },
    };
  } catch (error) {
    const fallback = fallbackToMockShowcase(scenarioId, toErrorMessage(error));
    return {
      source: 'mock',
      data: {
        defenseTrace: fallback.report.defenseTrace,
        security: fallback.report.security,
      },
      error: toErrorMessage(error),
    };
  }
};

const fetchShowcasePrivacy = async (scenarioId: string): Promise<ShowcaseFetchResult<Partial<ShowcaseReport>>> => {
  try {
    const payload = await apiGet<unknown>(`${SHOWCASE_BASE_PATH}/${encodeURIComponent(scenarioId)}/privacy`);
    const record = pickRecord(payload, ['privacy', 'privacy_risk_summary', 'privacyRiskSummary']) ?? {};
    return {
      source: 'api',
      data: {
        privacyRiskSummary: record,
        privacy: unwrapPayload(payload),
      },
    };
  } catch (error) {
    const fallback = fallbackToMockShowcase(scenarioId, toErrorMessage(error));
    return {
      source: 'mock',
      data: {
        privacyRiskSummary: fallback.report.privacyRiskSummary,
        privacy: fallback.report.privacy,
      },
      error: toErrorMessage(error),
    };
  }
};

const hasRecommendationRows = (comparison?: ShowcaseRecommendationComparison | null) =>
  Boolean(comparison && (comparison.baseline.length || comparison.attack.length || comparison.defense.length));

const pickDefaultScenario = (scenarios: ShowcaseScenario[], requestedScenarioId?: string) => {
  const requested = scenarios.find((scenario) => scenario.scenarioId === requestedScenarioId || scenario.id === requestedScenarioId);
  if (requested) {
    return requested;
  }

  for (const preferredId of DEFAULT_SHOWCASE_SCENARIO_PREFERENCE) {
    const preferred = scenarios.find((scenario) => scenario.scenarioId === preferredId || scenario.id === preferredId);
    if (preferred) {
      return preferred;
    }
  }

  return scenarios[0];
};

const emptyRecommendationComparison = (): ShowcaseRecommendationComparison => ({
  baseline: [],
  attack: [],
  defense: [],
});

const buildApiScenarioShell = (scenarioId = DEFAULT_SHOWCASE_SCENARIO_PREFERENCE[0]): ShowcaseScenario => ({
  id: scenarioId,
  scenarioId,
  name: '正在连接真实 artifact',
  dataset: null,
  model: null,
  tags: ['api'],
  warnings: [],
  dataSource: 'api',
});

const buildApiReportShell = (scenario: ShowcaseScenario, warning?: string): ShowcaseReport => ({
  scenarioId: scenario.scenarioId,
  title: scenario.name,
  dataset: scenario.dataset,
  model: scenario.model,
  datasetProfile: null,
  metricsSummary: null,
  recommendationComparison: emptyRecommendationComparison(),
  targetRankSummary: {
    entries: [],
    unavailable: true,
  },
  defenseTrace: null,
  warnings: warning ? [warning] : [],
  raw: scenario.raw,
});

export const createLoadingShowcaseBundle = (): ShowcaseBundle => {
  const selectedScenario = buildApiScenarioShell();
  return {
    scenarios: [selectedScenario],
    selectedScenario,
    report: buildApiReportShell(selectedScenario),
    dataSource: 'api',
    scenarioSource: 'api',
    fetchedAt: new Date().toISOString(),
  };
};

interface ApiOnlyResult<T> {
  data: T | null;
  error?: string;
}

const fetchApiOnly = async <T>(path: string, normalizer: (payload: unknown) => T): Promise<ApiOnlyResult<T>> => {
  try {
    const payload = await apiGet<unknown>(path);
    return {data: normalizer(payload)};
  } catch (error) {
    return {
      data: null,
      error: toErrorMessage(error),
    };
  }
};

const mergeMetricsSummary = (
  reportMetrics?: ShowcaseMetricsSummary | null,
  endpointMetrics?: ShowcaseMetricsSummary | null,
): ShowcaseMetricsSummary | null => {
  if (!reportMetrics && !endpointMetrics) {
    return null;
  }

  return {
    ...(endpointMetrics ?? {}),
    ...(reportMetrics ?? {}),
    baseline: reportMetrics?.baseline ?? endpointMetrics?.baseline,
    attack: reportMetrics?.attack ?? endpointMetrics?.attack,
    defense: reportMetrics?.defense ?? endpointMetrics?.defense,
    recallDrop: reportMetrics?.recallDrop ?? endpointMetrics?.recallDrop,
    ndcgDrop: reportMetrics?.ndcgDrop ?? endpointMetrics?.ndcgDrop,
    recoveryRate: reportMetrics?.recoveryRate ?? endpointMetrics?.recoveryRate,
    targetHitRate: reportMetrics?.targetHitRate ?? endpointMetrics?.targetHitRate,
    warnings: uniqueStrings([...(endpointMetrics?.warnings ?? []), ...(reportMetrics?.warnings ?? [])]),
  };
};

const optionalWarning = (label: string, error?: string) => (error ? `${label} 暂未返回，页面保留已有 artifact 内容并对缺失指标显示暂无。` : null);

export const loadShowcaseBundle = async (requestedScenarioId?: string): Promise<ShowcaseBundle> => {
  const scenariosResult = await fetchShowcaseScenarios();
  const selectedScenario = pickDefaultScenario(scenariosResult.data, requestedScenarioId);

  if (!selectedScenario || scenariosResult.source === 'mock') {
    return fallbackToMockShowcase(requestedScenarioId, scenariosResult.error);
  }

  const scenarioId = selectedScenario.scenarioId;
  const [reportOnlyResult, datasetOnlyResult, metricsOnlyResult, securityOnlyResult, privacyOnlyResult] = await Promise.all([
    fetchApiOnly(`${SHOWCASE_BASE_PATH}/${encodeURIComponent(scenarioId)}/report`, (payload) => normalizeReport(payload, selectedScenario)),
    fetchApiOnly(`${SHOWCASE_BASE_PATH}/${encodeURIComponent(scenarioId)}/dataset`, normalizeDatasetProfile),
    fetchApiOnly(`${SHOWCASE_BASE_PATH}/${encodeURIComponent(scenarioId)}/metrics`, normalizeMetricsSummary),
    fetchApiOnly(`${SHOWCASE_BASE_PATH}/${encodeURIComponent(scenarioId)}/security`, (payload) => ({
      defenseTrace: normalizeDefenseTrace(payload),
      security: unwrapPayload(payload),
    })),
    fetchApiOnly(`${SHOWCASE_BASE_PATH}/${encodeURIComponent(scenarioId)}/privacy`, (payload) => {
      const record = pickRecord(payload, ['privacy', 'privacy_risk_summary', 'privacyRiskSummary']) ?? {};
      return {
        privacyRiskSummary: record,
        privacy: unwrapPayload(payload),
      };
    }),
  ]);
  const reportResult = reportOnlyResult.data ?? buildApiReportShell(selectedScenario, '当前场景 report 暂未返回，页面只展示已可读取的场景信息。');
  const recommendationsOnlyResult = await fetchApiOnly(
    `${SHOWCASE_BASE_PATH}/${encodeURIComponent(scenarioId)}/recommendations`,
    normalizeRecommendationComparison,
  );
  const metricsSummary = mergeMetricsSummary(reportResult.metricsSummary, metricsOnlyResult.data);
  const attackDefenseSummary = reportResult.attackDefenseSummary;
  const privacyRiskSummary =
    privacyOnlyResult.data?.privacyRiskSummary ?? reportResult.privacyRiskSummary;
  const securityRaw = securityOnlyResult.data?.security ?? reportResult.security;
  const defenseTrace = securityOnlyResult.data?.defenseTrace ?? reportResult.defenseTrace;
  const v25Summary =
    reportResult.v25Summary ??
    normalizeV25Summary(scenarioId, attackDefenseSummary, privacyRiskSummary, securityRaw ?? defenseTrace);
  const warnings = uniqueStrings([
    ...(selectedScenario.warnings ?? []),
    ...(reportResult.warnings ?? []),
    optionalWarning('数据画像 artifact', datasetOnlyResult.error),
    optionalWarning('指标 artifact', metricsOnlyResult.error),
    optionalWarning('安全 artifact', securityOnlyResult.error),
    optionalWarning('隐私 artifact', privacyOnlyResult.error),
    optionalWarning('推荐列表 artifact', recommendationsOnlyResult?.error),
  ].filter((item): item is string => Boolean(item)));

  const report: ShowcaseReport = {
    ...reportResult,
    scenarioId,
    title: reportResult.title ?? selectedScenario.name,
    dataset: reportResult.dataset ?? selectedScenario.dataset,
    model: reportResult.model ?? selectedScenario.model,
    datasetProfile: datasetOnlyResult.data ?? reportResult.datasetProfile,
    metricsSummary,
    recommendationComparison:
      hasRecommendationRows(recommendationsOnlyResult.data)
        ? recommendationsOnlyResult.data
        : reportResult.recommendationComparison ?? emptyRecommendationComparison(),
    defenseTrace,
    security: securityRaw,
    privacyRiskSummary,
    privacy: privacyOnlyResult.data?.privacy ?? reportResult.privacy,
    v25Summary,
    warnings,
  };

  return {
    scenarios: scenariosResult.data,
    selectedScenario,
    report,
    dataSource: 'api',
    scenarioSource: scenariosResult.source,
    fetchedAt: new Date().toISOString(),
  };
};
