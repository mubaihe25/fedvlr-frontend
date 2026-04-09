import {buildTrainConfigSummary, defaultTrainConfig} from '../mock/configuration';
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
import {apiGet} from './api';
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

const parseExperimentTimestamp = (experimentId?: string | null) => {
  if (!experimentId) {
    return '未知时间';
  }

  const match = experimentId.match(/(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})$/);
  if (!match) {
    return experimentId;
  }

  const [, year, month, day, hour, minute, second] = match;
  return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
};

const extractExperimentKeyFromRecordId = (recordId: string) => {
  if (!recordId.startsWith('api::')) {
    return null;
  }

  return recordId.slice(5);
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

  if (attackName === 'client_update_scale' || attackName === 'client_preference_leakage_probe') {
    return attackName;
  }

  return 'gradient-noise';
};

const mapDefenseType = (activeDefenses?: string[]): DefenseType => {
  const defenseName = activeDefenses?.[0];
  if (!defenseName) {
    return 'none';
  }

  if (defenseName === 'norm_clip' || defenseName === 'client_update_anomaly') {
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

  return buildPreviewBarsFromValues([summary.final_eval?.recall20 ?? summary.final_eval?.ndcg20 ?? 0.1]);
};

const buildResultPreviewBars = (result: ApiResultShape) => {
  const roundValues = getResultRounds(result).map((round) => round.test_score ?? round.valid_score ?? 0);
  if (roundValues.length) {
    return buildPreviewBarsFromValues(roundValues);
  }

  return buildPreviewBarsFromValues([result.final_eval?.recall20 ?? result.final_eval?.ndcg20 ?? 0.1]);
};

const getMaxNestedMetricCount = (
  rounds: ExperimentResultRoundMetric[],
  bucket: 'attack_metrics' | 'defense_metrics',
  field: 'attacked_client_count' | 'clipped_client_count',
) =>
  rounds.reduce((maxValue, round) => {
    const metrics = round.extra?.[bucket];
    if (!metrics) {
      return maxValue;
    }

    const roundMax = Object.values(metrics).reduce((valueMax, value) => {
      const candidate = Number(value?.[field] ?? 0);
      return Number.isFinite(candidate) ? Math.max(valueMax, candidate) : valueMax;
    }, 0);

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
  const attackCount = summary.active_attacks?.length ?? 0;
  const defenseCount = summary.active_defenses?.length ?? 0;
  const privacyCount = summary.active_privacy_metrics?.length ?? 0;
  const maliciousCount = summary.malicious_client_summary?.unique_malicious_client_count ?? 0;
  const recall20 = summary.final_eval?.recall20;
  const ndcg20 = summary.final_eval?.ndcg20;
  const roundCount = getSummaryRounds(summary).length;

  return `实验场景：${mode}；场景标签：${scenarioTags}；攻击模块 ${attackCount} 个，防御模块 ${defenseCount} 个，隐私观测 ${privacyCount} 个；恶意客户端占位 ${maliciousCount} 个，共记录 ${roundCount} 轮摘要。最终 Recall@20=${recall20?.toFixed(3) ?? '--'}，NDCG@20=${ndcg20?.toFixed(3) ?? '--'}。`;
};

const buildResultText = (result: ApiResultShape) => {
  const mode = result.experiment_mode || 'baseline';
  const scenarioTags = result.scenario_tags?.length ? result.scenario_tags.join(' / ') : '未标注';
  const roundCount = getResultRounds(result).length;
  const attackCount = result.active_attacks?.length ?? 0;
  const defenseCount = result.active_defenses?.length ?? 0;
  const privacyCount = result.active_privacy_metrics?.length ?? 0;
  const maliciousSummary = result.metadata?.malicious_client_summary;
  const maliciousCount = maliciousSummary?.unique_malicious_client_count ?? result.malicious_clients?.length ?? 0;
  const attackedCount = getMaxNestedMetricCount(getResultRounds(result), 'attack_metrics', 'attacked_client_count');
  const clippedCount = getMaxNestedMetricCount(getResultRounds(result), 'defense_metrics', 'clipped_client_count');
  const privacyRounds = countPrivacyObservationRounds(getResultRounds(result));
  const recall20 = result.final_eval?.recall20;
  const ndcg20 = result.final_eval?.ndcg20;

  return `实验场景：${mode}；场景标签：${scenarioTags}；共记录 ${roundCount} 轮真实结果。攻击模块 ${attackCount} 个，防御模块 ${defenseCount} 个，隐私观测 ${privacyCount} 个；恶意客户端占位 ${maliciousCount} 个，最大攻击命中客户端 ${attackedCount} 个，最大裁剪客户端 ${clippedCount} 个，隐私观测命中 ${privacyRounds} 轮。最终 Recall@20=${recall20?.toFixed(3) ?? '--'}，NDCG@20=${ndcg20?.toFixed(3) ?? '--'}。`;
};

const buildApiConfigFromSummary = (summary: ApiSummaryShape): TrainConfig => {
  const rounds = getSummaryRounds(summary);
  const mode = mapExperimentMode(summary.experiment_mode);
  const attackType = mapAttackType(summary.active_attacks);
  const defenseType = mapDefenseType(summary.active_defenses);

  return {
    ...defaultTrainConfig,
    dataset: summary.dataset || defaultTrainConfig.dataset,
    model: (summary.model || defaultTrainConfig.model).toLowerCase(),
    mode,
    attackEnabled: attackType !== 'none',
    attackType,
    defenseEnabled: defenseType !== 'none',
    defenseType,
    clientCount: getParticipantCount(rounds.map((round) => round.num_participants)),
    clientSamplingRate: 1,
    totalRounds: rounds.length || defaultTrainConfig.totalRounds,
    poisoningRatio: summary.malicious_client_summary?.ratio ?? defaultTrainConfig.poisoningRatio,
  };
};

const buildApiConfigFromResult = (result: ApiResultShape): TrainConfig => {
  const rounds = getResultRounds(result);
  const mode = mapExperimentMode(result.experiment_mode);
  const attackType = mapAttackType(result.active_attacks);
  const defenseType = mapDefenseType(result.active_defenses);

  return {
    ...defaultTrainConfig,
    dataset: result.dataset || defaultTrainConfig.dataset,
    model: (result.model || defaultTrainConfig.model).toLowerCase(),
    mode,
    attackEnabled: attackType !== 'none',
    attackType,
    defenseEnabled: defenseType !== 'none',
    defenseType,
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
  const recall20 = summary.final_eval?.recall20 ?? undefined;
  const ndcg20 = summary.final_eval?.ndcg20 ?? undefined;

  return {
    id: `api::${summary.experiment_key}`,
    taskId: `api::${summary.experiment_key}`,
    name: `实验 #${summary.experiment_id || summary.file_name}`,
    createdAt: parseExperimentTimestamp(summary.experiment_id),
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
      ndcg10: ndcg20,
      ndcg20,
      loss: summary.final_eval?.loss ?? lastRound?.avg_train_loss ?? undefined,
    },
    status: 'completed',
    config,
    configSummary: buildConfigSummary(config),
    summary: buildSummaryText(summary),
    previewBars: buildSummaryPreviewBars(summary),
    detailLevel,
  };
};

const mapApiResultToHistoryRecord = (result: ApiResultShape): HistoryRecord => {
  const config = buildApiConfigFromResult(result);
  const rounds = getResultRounds(result);
  const lastRound = rounds[rounds.length - 1];
  const recall20 = result.final_eval?.recall20 ?? undefined;
  const ndcg20 = result.final_eval?.ndcg20 ?? undefined;

  return {
    id: `api::${result.experiment_key}`,
    taskId: `api::${result.experiment_key}`,
    name: `实验 #${result.experiment_id || result.file_name}`,
    createdAt: parseExperimentTimestamp(result.experiment_id),
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
      ndcg10: ndcg20,
      ndcg20,
      loss: result.final_eval?.loss ?? lastRound?.avg_train_loss ?? undefined,
    },
    status: 'completed',
    config,
    configSummary: buildConfigSummary(config),
    summary: buildResultText(result),
    previewBars: buildResultPreviewBars(result),
    detailLevel: 'result',
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
  } catch {
    return simulateRequest(() => {
      const records = mockStore.getHistoryRecords();
      return {
        records,
        total: records.length,
      };
    });
  }
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

    return record;
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

    return record;
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
