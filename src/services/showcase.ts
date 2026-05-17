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
  ShowcaseRecommendationComparison,
  ShowcaseRecommendationItem,
  ShowcaseReport,
  ShowcaseScenario,
  ShowcaseTargetRankEntry,
  ShowcaseTargetRankSummary,
} from '../types/showcase';
import {apiGet} from './api';

const SHOWCASE_BASE_PATH = '/showcase/scenarios';

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
    smoke: firstBoolean(record, ['smoke', 'is_smoke', 'isSmoke']),
    proxy: firstBoolean(record, ['proxy', 'is_proxy', 'isProxy']),
    demo: firstBoolean(record, ['demo', 'is_demo', 'isDemo']),
    demoOnly: firstBoolean(record, ['demo_only', 'demoOnly']),
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
  const baseline = normalizeMetricSet(readField(record, ['baseline', 'baseline_metrics', 'baselineMetrics', 'clean']));
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
    recoveryRate: firstNumber(record, ['recovery_rate', 'recoveryRate', 'defense_recovery_rate', 'defenseRecoveryRate']),
    targetHitRate: firstNumber(record, ['target_hit_rate', 'targetHitRate']),
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
    imageUrl: firstString(value, ['image_url', 'imageUrl', 'image', 'thumbnail', 'thumbnail_url', 'thumbnailUrl']),
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

  return {
    itemId: readField(record, ['item_id', 'itemId', 'target_item_id', 'targetItemId', 'id']) as string | number | null | undefined,
    title: firstString(record, ['title', 'target_title', 'targetTitle', 'name']),
    baselineRank: firstNumber(record, ['baseline_rank', 'baselineRank', 'clean_rank', 'cleanRank']),
    attackRank: firstNumber(record, ['attack_rank', 'attackRank', 'attacked_rank', 'attackedRank']),
    defenseRank: firstNumber(record, ['defense_rank', 'defenseRank', 'defended_rank', 'defendedRank']),
    rankGain: firstNumber(record, ['rank_gain', 'rankGain', 'rank_delta', 'rankDelta']),
    scoreGain: firstNumber(record, ['score_gain', 'scoreGain', 'score_delta', 'scoreDelta']),
    targetHitRate: firstNumber(record, ['target_hit_rate', 'targetHitRate']),
    inTop50: firstBoolean(record, ['in_top50', 'inTop50', 'top50_hit', 'top50Hit']),
    raw: isRecord(value) ? value : undefined,
  };
};

const normalizeTargetRankSummary = (payload: unknown): ShowcaseTargetRankSummary => {
  const record = pickRecord(payload, ['target_rank_summary', 'targetRankSummary', 'target_rank_comparison', 'targetRankComparison']) ?? {};
  const entries =
    pickArray(record, ['entries', 'items', 'targets', 'target_rank_comparison', 'targetRankComparison']) ??
    (Array.isArray(record) ? record : []);

  return {
    entries: entries.map(normalizeTargetRankEntry),
    targetHitRate: firstNumber(record, ['target_hit_rate', 'targetHitRate']),
    note: firstString(record, ['note', 'summary', 'description']),
    warnings: firstStringList(record, ['warnings', 'warning', 'notes']),
    unavailable: firstBoolean(record, ['unavailable', 'not_available', 'notAvailable']),
    raw: record,
  };
};

const normalizeDefenseTrace = (payload: unknown): ShowcaseDefenseTrace => {
  const record =
    pickRecord(payload, ['defense_trace', 'defenseTrace', 'security', 'security_matrix', 'securityMatrix', 'robust_defense']) ?? {};
  const krumRecord = pickRecord(record.krum ?? record.krum_trace ?? record.krumTrace, ['krum', 'krum_trace', 'krumTrace']);

  return {
    totalClients: firstNumber(record, ['total_clients', 'totalClients', 'clients']),
    maliciousClients: firstNumber(record, ['malicious_clients', 'maliciousClients', 'attack_clients', 'attackClients']),
    clippedClients: firstNumber(record, ['clipped_clients', 'clippedClients']),
    filteredClients: firstNumber(record, ['filtered_clients', 'filteredClients']),
    trimmedUpdates: firstNumber(record, ['trimmed_updates', 'trimmedUpdates']),
    aggregationRule: firstString(record, ['aggregation_rule', 'aggregationRule', 'aggregator', 'defense_type', 'defenseType']),
    notes: firstStringList(record, ['notes', 'warnings', 'summary']),
    krumSelected: toIdList(readField(record, ['krum_selected', 'krumSelected', 'selected']) ?? readField(krumRecord, ['selected', 'selected_clients'])),
    krumRejected: toIdList(readField(record, ['krum_rejected', 'krumRejected', 'rejected']) ?? readField(krumRecord, ['rejected', 'rejected_clients'])),
    trimmedMean: readField(record, ['trimmed_mean', 'trimmedMean']),
    median: readField(record, ['median']),
    dpNoise: readField(record, ['dp_noise', 'dpNoise']),
    secureAggSim: readField(record, ['secure_agg_sim', 'secureAggSim', 'secure_aggregation_sim', 'secureAggregationSim']),
    unavailable: firstBoolean(record, ['unavailable', 'not_available', 'notAvailable']),
    warnings: firstStringList(record, ['warnings', 'warning']),
    raw: record,
  };
};

const uniqueStrings = (values: string[]) => Array.from(new Set(values.filter(Boolean)));

const normalizeReport = (payload: unknown, scenario?: ShowcaseScenario): ShowcaseReport => {
  const record = pickRecord(payload, ['report', 'artifact', 'showcase_report', 'showcaseReport']) ?? {};
  const scenarioRecord = pickRecord(record.scenario, ['scenario']) ?? undefined;
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
    metricsSummary: normalizeMetricsSummary(readField(record, ['metrics_summary', 'metricsSummary', 'metrics']) ?? record),
    attackDefenseSummary: readField(record, ['attack_defense_summary', 'attackDefenseSummary']),
    privacyRiskSummary: readField(record, ['privacy_risk_summary', 'privacyRiskSummary', 'privacy']),
    recommendationComparison: normalizeRecommendationComparison(readField(record, ['recommendation_comparison', 'recommendationComparison', 'recommendations']) ?? record),
    targetRankSummary: normalizeTargetRankSummary(
      readField(record, ['target_rank_summary', 'targetRankSummary', 'target_rank_comparison', 'targetRankComparison']) ?? record,
    ),
    defenseTrace: normalizeDefenseTrace(readField(record, ['defense_trace', 'defenseTrace', 'security', 'security_matrix', 'securityMatrix']) ?? record),
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
    model: 'FedVLR showcase mock',
    tags: ['mock', 'sample structure', 'Recall@50', 'NDCG@50'],
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
    privacyRiskSummary: 'Mock fallback only. Privacy/security planning labels must not be read as implemented DP or secure aggregation.',
    recommendationComparison: normalizeRecommendationComparison(fallbackCase.recommendationComparison),
    targetRankSummary: {
      entries: [],
      note: 'Mock fallback does not include target rank comparison artifacts.',
      unavailable: true,
    },
    defenseTrace,
    delivery: deliverySummary,
    warnings: [showcaseSampleNotice],
    boundaries: [
      'Mock fallback sample structure.',
      'No formal differential privacy accountant is implemented in this fallback.',
      'Secure aggregation is not implemented in this fallback.',
    ],
    demo: true,
    demoOnly: true,
  };
};

export const fallbackToMockShowcase = (scenarioId?: string, fallbackReason?: string): ShowcaseBundle => {
  const selectedScenario = buildFallbackScenario(scenarioId);
  const fallbackWarning = fallbackReason ? `API fallback: ${fallbackReason}` : undefined;

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

const combineSources = (sources: Array<Extract<ShowcaseDataSource, 'api' | 'mock'>>): ShowcaseDataSource => {
  const uniqueSources = new Set(sources);
  if (uniqueSources.size > 1) {
    return 'mixed';
  }
  return sources[0] ?? 'mock';
};

export const loadShowcaseBundle = async (requestedScenarioId?: string): Promise<ShowcaseBundle> => {
  const scenariosResult = await fetchShowcaseScenarios();
  const selectedScenario =
    scenariosResult.data.find((scenario) => scenario.scenarioId === requestedScenarioId || scenario.id === requestedScenarioId) ??
    scenariosResult.data[0];

  if (!selectedScenario || scenariosResult.source === 'mock') {
    return fallbackToMockShowcase(requestedScenarioId, scenariosResult.error);
  }

  const scenarioId = selectedScenario.scenarioId;
  const [reportResult, datasetResult, metricsResult, recommendationsResult, securityResult, privacyResult] = await Promise.all([
    fetchShowcaseReport(scenarioId),
    fetchShowcaseDataset(scenarioId),
    fetchShowcaseMetrics(scenarioId),
    fetchShowcaseRecommendations(scenarioId),
    fetchShowcaseSecurity(scenarioId),
    fetchShowcasePrivacy(scenarioId),
  ]);

  const report: ShowcaseReport = {
    ...reportResult.data,
    scenarioId,
    title: reportResult.data.title ?? selectedScenario.name,
    dataset: reportResult.data.dataset ?? selectedScenario.dataset,
    model: reportResult.data.model ?? selectedScenario.model,
    datasetProfile: datasetResult.source === 'api' ? datasetResult.data : reportResult.data.datasetProfile,
    metricsSummary: metricsResult.source === 'api' ? metricsResult.data : reportResult.data.metricsSummary,
    recommendationComparison:
      recommendationsResult.source === 'api' ? recommendationsResult.data : reportResult.data.recommendationComparison,
    defenseTrace: securityResult.source === 'api' ? securityResult.data.defenseTrace ?? null : reportResult.data.defenseTrace,
    security: securityResult.source === 'api' ? securityResult.data.security : reportResult.data.security,
    privacyRiskSummary: privacyResult.source === 'api' ? privacyResult.data.privacyRiskSummary : reportResult.data.privacyRiskSummary,
    privacy: privacyResult.source === 'api' ? privacyResult.data.privacy : reportResult.data.privacy,
    warnings: uniqueStrings([...(selectedScenario.warnings ?? []), ...(reportResult.data.warnings ?? [])]),
  };
  const sources = [
    scenariosResult.source,
    reportResult.source,
    datasetResult.source,
    metricsResult.source,
    recommendationsResult.source,
    securityResult.source,
    privacyResult.source,
  ];
  const fallbackReason = uniqueStrings(
    [scenariosResult.error, reportResult.error, datasetResult.error, metricsResult.error, recommendationsResult.error, securityResult.error, privacyResult.error].filter(
      (item): item is string => Boolean(item),
    ),
  ).join(' / ');

  return {
    scenarios: scenariosResult.data,
    selectedScenario,
    report,
    dataSource: combineSources(sources),
    scenarioSource: scenariosResult.source,
    fallbackReason: fallbackReason || undefined,
    fetchedAt: new Date().toISOString(),
  };
};
