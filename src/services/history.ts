import {buildTrainConfigSummary, defaultTrainConfig} from '../mock/configuration';
import {formatAttackSemanticGroups, formatDefenseSemanticGroups} from '../lib/experimentLabels';
import type {AttackTaxonomyMap} from '../lib/experimentLabels';
import type {
  ExperimentResultDetail,
  ExperimentResultResponse,
  ExperimentResultRoundMetric,
  ExperimentRoundSummary,
  ExperimentSummaryDetail,
  ExperimentSummaryListItem,
  ExperimentSummaryListResponse,
  ExperimentSummaryResponse,
  HistoryListResponse,
  HistoryRecord,
  ReuseHistoryResponse,
} from '../types/history';
import type {AttackType, DefenseType, ExperimentMode, TrainConfig} from '../types/train';
import {apiGet, buildApiUrl} from './api';
import {simulateRequest} from './mockAdapter';
import {mockStore} from './mockStore';

const apiHistoryCache = new Map<string, HistoryRecord>();
const apiHistorySummaryCache = new Map<string, HistoryRecord>();
const apiHistoryResultCache = new Map<string, HistoryRecord>();

interface ApiSummaryShape extends Partial<ExperimentSummaryDetail> {
  experiment_key: string;
  file_name: string;
  relative_path: string;
  experiment_id?: string | null;
  model?: string | null;
  dataset?: string | null;
  experiment_mode?: string | null;
  scenario_tags?: string[];
  active_attacks?: string[];
  active_defenses?: string[];
  active_privacy_metrics?: string[];
  final_eval?: ExperimentSummaryDetail['final_eval'];
}

interface ApiResultShape extends Partial<ExperimentResultDetail> {
  experiment_key: string;
  file_name: string;
  relative_path: string;
}

const parseExperimentTimestamp = (...candidates: Array<string | null | undefined>) => {
  for (const candidate of candidates) {
    if (!candidate) {
      continue;
    }

    const normalized = String(candidate);
    const compactMatch = normalized.match(/(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})(?!\d)/);
    const underscoredMatch = normalized.match(/(\d{4})(\d{2})(\d{2})_(\d{2})(\d{2})(\d{2})(?:_\d{1,6})?/);
    const match = underscoredMatch ?? compactMatch;

    if (match) {
      const [, year, month, day, hour, minute, second] = match;
      return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
    }
  }

  return '未知时间';
};

const shortModeLabels: Record<string, string> = {
  baseline: '基线',
  attack_only: '投毒',
  defense_only: '防御',
  attack_and_defense: '攻防对照',
  privacy_observation: '隐私观测',
};

const buildApiRecordTitle = (payload: {
  model?: string | null;
  dataset?: string | null;
  experiment_mode?: string | null;
}) => {
  const model = payload.model || '未知模型';
  const dataset = payload.dataset || '未知数据集';
  const mode = shortModeLabels[payload.experiment_mode || ''] || '实验';
  return `${model} / ${dataset} / ${mode}`;
};

const buildApiSourceName = (payload: {
  experiment_id?: string | null;
  file_name?: string | null;
  relative_path?: string | null;
}) => payload.experiment_id || payload.file_name || payload.relative_path || '未记录原始标识';

const extractExperimentKeyFromRecordId = (recordId: string) => {
  if (!recordId.startsWith('api::')) {
    return null;
  }

  return recordId.slice(5);
};

const getCsvFileNameFromHeader = (contentDisposition: string | null, fallbackName: string) => {
  if (!contentDisposition) {
    return fallbackName;
  }

  const encodedMatch = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (encodedMatch?.[1]) {
    try {
      return decodeURIComponent(encodedMatch[1].replace(/"/g, ''));
    } catch {
      return encodedMatch[1].replace(/"/g, '');
    }
  }

  const plainMatch = contentDisposition.match(/filename="?([^";]+)"?/i);
  return plainMatch?.[1] ?? fallbackName;
};

const triggerBrowserDownload = (blob: Blob, fileName: string) => {
  const downloadUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = downloadUrl;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(downloadUrl);
};

const mapExperimentMode = (experimentMode?: string | null): ExperimentMode => {
  switch (experimentMode) {
    case 'attack_only':
      return 'attack';
    case 'defense_only':
      return 'defense';
    case 'attack_and_defense':
      return 'comparison';
    case 'baseline':
    case 'privacy_observation':
    default:
      return 'baseline';
  }
};

const mapAttackType = (activeAttacks?: string[]): AttackType => {
  const attackName = activeAttacks?.[0];
  if (!attackName) {
    return 'none';
  }

  if (
    attackName === 'poisoning_attack' ||
    attackName === 'poisoning' ||
    attackName === 'nondirected_poisoning' ||
    attackName === 'client_update_scale' ||
    attackName === 'sign_flip' ||
    attackName === 'model_replacement' ||
    attackName === 'client_preference_leakage_probe'
  ) {
    return attackName;
  }

  return 'gradient-noise';
};

const mapDefenseType = (activeDefenses?: string[]): DefenseType => {
  const defenseName = activeDefenses?.[0];
  if (!defenseName) {
    return 'none';
  }

  if (
    defenseName === 'robust_defense' ||
    defenseName === 'robust' ||
    defenseName === 'robust_aggregation_defense' ||
    defenseName === 'norm_clip' ||
    defenseName === 'update_filter' ||
    defenseName === 'trimmed_mean' ||
    defenseName === 'client_update_anomaly' ||
    defenseName === 'client_update_anomaly_detector'
  ) {
    return defenseName;
  }

  return 'anomaly-detection';
};

const getSummaryRounds = (summary: ApiSummaryShape): ExperimentRoundSummary[] =>
  Array.isArray(summary.round_summaries) ? summary.round_summaries : [];

const getResultRounds = (result: ApiResultShape): ExperimentResultRoundMetric[] =>
  Array.isArray(result.round_metrics) ? result.round_metrics : [];

const getParticipantCount = (counts: Array<number | null | undefined>) => {
  const normalized = counts
    .map((value) => Number(value ?? 0))
    .filter((value) => Number.isFinite(value) && value > 0);

  if (!normalized.length) {
    return defaultTrainConfig.clientCount;
  }

  return Math.max(...normalized);
};

const asOptionalNumber = (value: unknown) =>
  typeof value === 'number' && Number.isFinite(value) ? value : undefined;

const readMetricValue = (source: unknown, ...keys: string[]) => {
  if (!source || typeof source !== 'object') {
    return undefined;
  }

  const record = source as Record<string, unknown>;
  for (const key of keys) {
    const value = asOptionalNumber(record[key]);
    if (value !== undefined) {
      return value;
    }
  }

  return undefined;
};

const readEvalMetric = (
  finalEval: unknown,
  metadata: Record<string, unknown> | undefined,
  metric: 'recall' | 'ndcg',
  cutoff: 20 | 50,
) => {
  const compactKey = `${metric}${cutoff}`;
  const atKey = `${metric}@${cutoff}`;
  const directValue =
    readMetricValue(finalEval, compactKey, atKey) ??
    readMetricValue((finalEval as {extra?: unknown} | undefined)?.extra, compactKey, atKey);

  if (directValue !== undefined) {
    return directValue;
  }

  if (cutoff === 50) {
    return (
      readMetricValue(metadata?.best_test_result, compactKey, atKey) ??
      readMetricValue(metadata?.best_valid_result, compactKey, atKey)
    );
  }

  return undefined;
};

const buildPreviewBarsFromValues = (values: Array<number | null | undefined>) => {
  const normalized = values
    .map((value) => Number(value ?? 0))
    .filter((value) => Number.isFinite(value) && value > 0)
    .slice(0, 8)
    .map((value) => Math.max(12, Math.min(100, Math.round(value * 100))));

  if (normalized.length) {
    return normalized;
  }

  const base = Math.max(12, Math.min(100, Math.round(0.1 * 100)));
  return [Math.max(12, base - 18), Math.max(16, base - 10), Math.max(20, base - 4), base];
};

const buildSummaryPreviewBars = (summary: ApiSummaryShape) => {
  const roundValues = getSummaryRounds(summary).map((round) => round.test_score ?? round.valid_score ?? 0);
  if (roundValues.length) {
    return buildPreviewBarsFromValues(roundValues);
  }

  return buildPreviewBarsFromValues([
    readEvalMetric(summary.final_eval, undefined, 'recall', 50) ??
      readEvalMetric(summary.final_eval, undefined, 'ndcg', 50) ??
      summary.final_eval?.recall20 ??
      summary.final_eval?.ndcg20 ??
      0.1,
  ]);
};

const buildResultPreviewBars = (result: ApiResultShape) => {
  const roundValues = getResultRounds(result).map((round) => round.test_score ?? round.valid_score ?? 0);
  if (roundValues.length) {
    return buildPreviewBarsFromValues(roundValues);
  }

  return buildPreviewBarsFromValues([
    readEvalMetric(result.final_eval, result.metadata, 'recall', 50) ??
      readEvalMetric(result.final_eval, result.metadata, 'ndcg', 50) ??
      result.final_eval?.recall20 ??
      result.final_eval?.ndcg20 ??
      0.1,
  ]);
};

const getNestedMetricCandidate = (value: unknown, fields: string[]): number => {
  if (!value || typeof value !== 'object') {
    return 0;
  }

  const record = value as Record<string, unknown>;
  const directMax = fields.reduce((fieldMax, field) => Math.max(fieldMax, Number(record[field] ?? 0)), 0);
  const childMax = Object.values(record).reduce<number>(
    (maxValue, child) => Math.max(maxValue, getNestedMetricCandidate(child, fields)),
    0,
  );
  const candidate = Math.max(directMax, childMax);
  return Number.isFinite(candidate) ? candidate : 0;
};

const getMaxNestedMetricCount = (
  rounds: ExperimentResultRoundMetric[],
  bucket: 'attack_metrics' | 'defense_metrics',
  fields: string[],
) =>
  rounds.reduce((maxValue, round) => {
    const metrics = round.extra?.[bucket];
    if (!metrics) {
      return maxValue;
    }

    const roundMax = Object.values(metrics).reduce(
      (valueMax, value) => Math.max(valueMax, getNestedMetricCandidate(value, fields)),
      0,
    );

    return Math.max(maxValue, roundMax);
  }, 0);

const countPrivacyObservationRounds = (rounds: ExperimentResultRoundMetric[]) =>
  rounds.filter((round) => {
    const outputs = round.extra?.privacy_metric_outputs;
    return outputs && Object.keys(outputs).length > 0;
  }).length;

const buildSummaryText = (summary: ApiSummaryShape) => {
  const mode = summary.experiment_mode || 'baseline';
  const scenarioTags = summary.scenario_tags?.length ? summary.scenario_tags.join(' / ') : '未标注';
  const attackGroups = formatAttackSemanticGroups(summary.active_attacks, summary.attack_taxonomy as AttackTaxonomyMap | undefined);
  const defenseGroups = formatDefenseSemanticGroups(summary.active_defenses);
  const privacyCount = summary.active_privacy_metrics?.length ?? 0;
  const maliciousCount = summary.malicious_client_summary?.unique_malicious_client_count ?? 0;
  const recall50 = readEvalMetric(summary.final_eval, undefined, 'recall', 50);
  const ndcg50 = readEvalMetric(summary.final_eval, undefined, 'ndcg', 50);
  const roundCount = getSummaryRounds(summary).length;

  return `实验场景：${mode}；场景标签：${scenarioTags}；投毒攻击：${attackGroups.poisoningLabel}；隐私泄露观测：${attackGroups.privacyProbeLabel}；鲁棒防御：${defenseGroups.robustLabel}；防御检测：${defenseGroups.observationLabel}；观测模块 ${privacyCount} 个；恶意客户端占位 ${maliciousCount} 个，共记录 ${roundCount} 轮摘要。最终 Recall@50=${recall50?.toFixed(3) ?? '--'}，NDCG@50=${ndcg50?.toFixed(3) ?? '--'}。`;
};

const buildResultText = (result: ApiResultShape) => {
  const mode = result.experiment_mode || 'baseline';
  const scenarioTags = result.scenario_tags?.length ? result.scenario_tags.join(' / ') : '未标注';
  const roundCount = getResultRounds(result).length;
  const attackGroups = formatAttackSemanticGroups(result.active_attacks, result.metadata?.attack_taxonomy as AttackTaxonomyMap | undefined);
  const defenseGroups = formatDefenseSemanticGroups(result.active_defenses);
  const privacyCount = result.active_privacy_metrics?.length ?? 0;
  const maliciousSummary = result.metadata?.malicious_client_summary;
  const maliciousCount = maliciousSummary?.unique_malicious_client_count ?? result.malicious_clients?.length ?? 0;
  const attackedCount = getMaxNestedMetricCount(getResultRounds(result), 'attack_metrics', [
    'attacked_client_count',
    'poisoned_client_count',
  ]);
  const clippedCount = getMaxNestedMetricCount(getResultRounds(result), 'defense_metrics', [
    'clipped_client_count',
    'total_clipped_clients',
  ]);
  const filteredCount = getMaxNestedMetricCount(getResultRounds(result), 'defense_metrics', [
    'filtered_client_count',
    'total_filtered_clients',
  ]);
  const trimCount = getMaxNestedMetricCount(getResultRounds(result), 'defense_metrics', [
    'effective_trim_count',
    'trimmed_client_count',
  ]);
  const privacyRounds = countPrivacyObservationRounds(getResultRounds(result));
  const recall50 = readEvalMetric(result.final_eval, result.metadata, 'recall', 50);
  const ndcg50 = readEvalMetric(result.final_eval, result.metadata, 'ndcg', 50);

  return `实验场景：${mode}；场景标签：${scenarioTags}；共记录 ${roundCount} 轮真实结果。投毒攻击：${attackGroups.poisoningLabel}；隐私泄露观测：${attackGroups.privacyProbeLabel}；鲁棒防御：${defenseGroups.robustLabel}；防御检测：${defenseGroups.observationLabel}；观测模块 ${privacyCount} 个；恶意客户端占位 ${maliciousCount} 个，最大攻击命中客户端 ${attackedCount} 个，最大裁剪客户端 ${clippedCount} 个，最大过滤客户端 ${filteredCount} 个，截尾处理计数 ${trimCount}，隐私观测命中 ${privacyRounds} 轮。最终 Recall@50=${recall50?.toFixed(3) ?? '--'}，NDCG@50=${ndcg50?.toFixed(3) ?? '--'}。`;
};

const buildApiConfigFromSummary = (summary: ApiSummaryShape): TrainConfig => {
  const rounds = getSummaryRounds(summary);
  const activeAttacks = summary.active_attacks ?? [];
  const activeDefenses = summary.active_defenses ?? [];
  const activePrivacyMetrics = summary.active_privacy_metrics ?? [];
  const mode = mapExperimentMode(summary.experiment_mode);
  const attackType = mapAttackType(activeAttacks);
  const defenseType = mapDefenseType(activeDefenses);

  return {
    ...defaultTrainConfig,
    dataset: summary.dataset || defaultTrainConfig.dataset,
    model: (summary.model || defaultTrainConfig.model).toLowerCase(),
    mode,
    attackEnabled: activeAttacks.length > 0,
    attackType,
    enabledAttacks: activeAttacks,
    defenseEnabled: activeDefenses.length > 0,
    defenseType,
    enabledDefenses: activeDefenses,
    enabledPrivacyMetrics: activePrivacyMetrics,
    clientCount: getParticipantCount(rounds.map((round) => round.num_participants)),
    clientSamplingRate: 1,
    totalRounds: rounds.length || defaultTrainConfig.totalRounds,
    poisoningRatio: summary.malicious_client_summary?.ratio ?? defaultTrainConfig.poisoningRatio,
  };
};

const buildApiConfigFromResult = (result: ApiResultShape): TrainConfig => {
  const rounds = getResultRounds(result);
  const activeAttacks = result.active_attacks ?? [];
  const activeDefenses = result.active_defenses ?? [];
  const activePrivacyMetrics = result.active_privacy_metrics ?? [];
  const mode = mapExperimentMode(result.experiment_mode);
  const attackType = mapAttackType(activeAttacks);
  const defenseType = mapDefenseType(activeDefenses);

  return {
    ...defaultTrainConfig,
    dataset: result.dataset || defaultTrainConfig.dataset,
    model: (result.model || defaultTrainConfig.model).toLowerCase(),
    mode,
    attackEnabled: activeAttacks.length > 0,
    attackType,
    enabledAttacks: activeAttacks,
    defenseEnabled: activeDefenses.length > 0,
    defenseType,
    enabledDefenses: activeDefenses,
    enabledPrivacyMetrics: activePrivacyMetrics,
    clientCount: getParticipantCount(rounds.map((round) => round.num_participants)),
    clientSamplingRate: 1,
    totalRounds: rounds.length || defaultTrainConfig.totalRounds,
    poisoningRatio: result.metadata?.malicious_client_summary?.ratio ?? defaultTrainConfig.poisoningRatio,
  };
};

const buildConfigSummary = (config: TrainConfig) => ({
  ...buildTrainConfigSummary(config),
  dataset: config.dataset,
  model: config.model,
  clientCount: config.clientCount,
  clientSamplingRate: config.clientSamplingRate,
  totalRounds: config.totalRounds,
  learningRate: config.learningRate,
  localEpochs: config.advanced.localEpochs,
});

const mapApiSummaryToHistoryRecord = (
  summary: ApiSummaryShape,
  detailLevel: HistoryRecord['detailLevel'] = 'list',
): HistoryRecord => {
  const config = buildApiConfigFromSummary(summary);
  const rounds = getSummaryRounds(summary);
  const lastRound = rounds[rounds.length - 1];
  const recall20 = readEvalMetric(summary.final_eval, undefined, 'recall', 20);
  const recall50 = readEvalMetric(summary.final_eval, undefined, 'recall', 50);
  const ndcg20 = readEvalMetric(summary.final_eval, undefined, 'ndcg', 20);
  const ndcg50 = readEvalMetric(summary.final_eval, undefined, 'ndcg', 50);

  return {
    id: `api::${summary.experiment_key}`,
    taskId: `api::${summary.experiment_key}`,
    name: buildApiRecordTitle(summary),
    sourceName: buildApiSourceName(summary),
    createdAt: parseExperimentTimestamp(summary.experiment_id, summary.file_name, summary.relative_path),
    dataset: summary.dataset || config.dataset,
    model: summary.model || config.model,
    mode: config.mode,
    attackType: config.attackType,
    defenseType: config.defenseType,
    keyParams: {
      learningRate: config.learningRate,
      clientSamplingRate: config.clientSamplingRate,
      localEpochs: config.advanced.localEpochs,
      totalRounds: rounds.length || config.totalRounds,
      clientCount: config.clientCount,
      optimizer: config.advanced.optimizer,
      poisoningRatio: config.poisoningRatio,
      privacyBudget: config.advanced.differentialPrivacyEpsilon ?? null,
    },
    metrics: {
      recall10: recall20,
      recall20,
      recall50,
      ndcg10: ndcg20,
      ndcg20,
      ndcg50,
      loss: summary.final_eval?.loss ?? lastRound?.avg_train_loss ?? undefined,
    },
    status: 'completed',
    config,
    configSummary: buildConfigSummary(config),
    summary: buildSummaryText(summary),
    previewBars: buildSummaryPreviewBars(summary),
    detailLevel,
    dataSource: 'api',
  };
};

const mapApiResultToHistoryRecord = (result: ApiResultShape): HistoryRecord => {
  const config = buildApiConfigFromResult(result);
  const rounds = getResultRounds(result);
  const lastRound = rounds[rounds.length - 1];
  const recall20 = readEvalMetric(result.final_eval, result.metadata, 'recall', 20);
  const recall50 = readEvalMetric(result.final_eval, result.metadata, 'recall', 50);
  const ndcg20 = readEvalMetric(result.final_eval, result.metadata, 'ndcg', 20);
  const ndcg50 = readEvalMetric(result.final_eval, result.metadata, 'ndcg', 50);

  return {
    id: `api::${result.experiment_key}`,
    taskId: `api::${result.experiment_key}`,
    name: buildApiRecordTitle(result),
    sourceName: buildApiSourceName(result),
    createdAt: parseExperimentTimestamp(result.experiment_id, result.file_name, result.relative_path),
    dataset: result.dataset || config.dataset,
    model: result.model || config.model,
    mode: config.mode,
    attackType: config.attackType,
    defenseType: config.defenseType,
    keyParams: {
      learningRate: config.learningRate,
      clientSamplingRate: config.clientSamplingRate,
      localEpochs: config.advanced.localEpochs,
      totalRounds: rounds.length || config.totalRounds,
      clientCount: config.clientCount,
      optimizer: config.advanced.optimizer,
      poisoningRatio: config.poisoningRatio,
      privacyBudget: config.advanced.differentialPrivacyEpsilon ?? null,
    },
    metrics: {
      recall10: recall20,
      recall20,
      recall50,
      ndcg10: ndcg20,
      ndcg20,
      ndcg50,
      loss: result.final_eval?.loss ?? lastRound?.avg_train_loss ?? undefined,
    },
    status: 'completed',
    config,
    configSummary: buildConfigSummary(config),
    summary: buildResultText(result),
    previewBars: buildResultPreviewBars(result),
    detailLevel: 'result',
    dataSource: 'api',
  };
};

const loadHistoryFromApi = async (): Promise<HistoryListResponse> => {
  const response = await apiGet<ExperimentSummaryListResponse>('/experiments/summaries');
  const records = response.items.map((summary) => {
    const recordId = `api::${summary.experiment_key}`;
    return (
      apiHistoryResultCache.get(recordId) ??
      apiHistorySummaryCache.get(recordId) ??
      mapApiSummaryToHistoryRecord(summary, 'list')
    );
  });

  if (!records.length) {
    throw new Error('API returned no experiment summaries');
  }

  apiHistoryCache.clear();
  for (const record of records) {
    apiHistoryCache.set(record.id, record);
  }

  return {
    records,
    total: response.count,
    source: 'api',
  };
};

const loadHistorySummaryFromApi = async (recordId: string): Promise<HistoryRecord> => {
  const experimentKey = extractExperimentKeyFromRecordId(recordId);
  if (!experimentKey) {
    throw new Error(`Record ${recordId} is not an API-backed history item`);
  }

  const response = await apiGet<ExperimentSummaryResponse>(`/experiments/${encodeURIComponent(experimentKey)}/summary`);
  const upgradedResult = apiHistoryResultCache.get(recordId);
  if (upgradedResult) {
    return upgradedResult;
  }

  const record = mapApiSummaryToHistoryRecord(
    {
      experiment_key: response.experiment_key,
      file_name: response.file_name,
      relative_path: response.relative_path,
      ...response.summary,
    },
    'summary',
  );

  apiHistorySummaryCache.set(record.id, record);
  apiHistoryCache.set(record.id, record);

  return record;
};

const loadHistoryResultFromApi = async (recordId: string): Promise<HistoryRecord> => {
  const experimentKey = extractExperimentKeyFromRecordId(recordId);
  if (!experimentKey) {
    throw new Error(`Record ${recordId} is not an API-backed history item`);
  }

  const response = await apiGet<ExperimentResultResponse>(`/experiments/${encodeURIComponent(experimentKey)}/result`);
  const record = mapApiResultToHistoryRecord({
    experiment_key: response.experiment_key,
    file_name: response.file_name,
    relative_path: response.relative_path,
    ...response.result,
  });

  apiHistoryResultCache.set(record.id, record);
  apiHistoryCache.set(record.id, record);

  return record;
};

export const getHistoryList = async (): Promise<HistoryListResponse> => {
  try {
    return await loadHistoryFromApi();
  } catch (error) {
    return simulateRequest(() => {
      const records = mockStore.getHistoryRecords().map((record) => ({...record, dataSource: 'mock' as const}));
      return {
        records,
        total: records.length,
        source: 'mock' as const,
        fallbackReason: error instanceof Error ? error.message : 'API unavailable',
      };
    });
  }
};

export const downloadHistoryCsv = async (id: string): Promise<void> => {
  const experimentKey = extractExperimentKeyFromRecordId(id);
  if (!experimentKey) {
    throw new Error('Mock 记录暂无真实 CSV 原始数据。');
  }

  const response = await fetch(buildApiUrl(`/experiments/${encodeURIComponent(experimentKey)}/csv`), {
    headers: {
      Accept: 'text/csv',
    },
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`CSV 下载失败：${response.status} ${response.statusText}${detail ? ` - ${detail}` : ''}`);
  }

  const blob = await response.blob();
  const keyParts = experimentKey.split('__');
  const fallbackName = `${keyParts[keyParts.length - 1] || 'experiment'}.csv`;
  const fileName = getCsvFileNameFromHeader(response.headers.get('content-disposition'), fallbackName);
  triggerBrowserDownload(blob, fileName);
};

export const getHistorySummaryPreview = async (id: string): Promise<HistoryRecord> => {
  const cachedResultRecord = apiHistoryResultCache.get(id);
  if (cachedResultRecord) {
    return structuredClone(cachedResultRecord);
  }

  const cachedApiRecord = apiHistorySummaryCache.get(id);
  if (cachedApiRecord) {
    return structuredClone(cachedApiRecord);
  }

  if (id.startsWith('api::')) {
    try {
      const record = await loadHistorySummaryFromApi(id);
      return structuredClone(record);
    } catch (error) {
      const fallback = apiHistoryCache.get(id);
      if (fallback) {
        return structuredClone(fallback);
      }

      throw error;
    }
  }

  return simulateRequest(() => {
    const record = mockStore.getHistoryRecord(id);
    if (!record) {
      throw new Error(`未找到历史实验 ${id}`);
    }

    return {...record, dataSource: 'mock' as const};
  });
};

export const getHistoryResultPreview = async (id: string): Promise<HistoryRecord> => {
  const cachedResultRecord = apiHistoryResultCache.get(id);
  if (cachedResultRecord) {
    return structuredClone(cachedResultRecord);
  }

  if (id.startsWith('api::')) {
    const record = await loadHistoryResultFromApi(id);
    return structuredClone(record);
  }

  return simulateRequest(() => {
    const record = mockStore.getHistoryRecord(id);
    if (!record) {
      throw new Error(`未找到历史实验 ${id}`);
    }

    return {...record, dataSource: 'mock' as const};
  });
};

export const deleteHistory = async (id: string): Promise<{success: boolean; id: string}> => {
  return simulateRequest(() => {
    apiHistoryCache.delete(id);
    apiHistorySummaryCache.delete(id);
    apiHistoryResultCache.delete(id);
    mockStore.deleteHistoryRecord(id);
    return {success: true, id};
  });
};

export const reuseHistoryConfig = async (id: string): Promise<ReuseHistoryResponse> => {
  return simulateRequest(() => {
    const apiRecord = apiHistoryResultCache.get(id) ?? apiHistorySummaryCache.get(id) ?? apiHistoryCache.get(id);
    if (apiRecord) {
      return {
        success: true,
        id,
        taskId: null,
        config: apiRecord.config,
        message: `已复用 ${apiRecord.name} 的实验配置。`,
      };
    }

    const record = mockStore.getHistoryRecord(id);
    if (!record) {
      throw new Error(`未找到历史实验 ${id}`);
    }

    return {
      success: true,
      id,
      taskId: record.taskId,
      config: record.config,
      message: `已复用 ${record.name} 的实验配置。`,
    };
  });
};
