import {defaultTrainConfig, buildTrainConfigSummary} from '../mock/configuration';
import {simulateRequest} from './mockAdapter';
import {mockStore} from './mockStore';
import {apiGet} from './api';
import type {
  ExperimentSummaryListItem,
  ExperimentSummaryListResponse,
  HistoryListResponse,
  HistoryRecord,
  ReuseHistoryResponse,
} from '../types/history';
import type {AttackType, DefenseType, ExperimentMode, TrainConfig} from '../types/train';

const apiHistoryCache = new Map<string, HistoryRecord>();

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

const buildPreviewBars = (summary: ExperimentSummaryListItem) => {
  const roundSummaries = (summary as {round_summaries?: Array<{test_score?: number | null; valid_score?: number | null}>})
    .round_summaries;

  if (Array.isArray(roundSummaries) && roundSummaries.length) {
    return roundSummaries.slice(0, 8).map((round) => {
      const value = round.test_score ?? round.valid_score ?? 0;
      return Math.max(12, Math.min(100, Math.round(value * 100)));
    });
  }

  const fallbackScore = summary.final_eval?.recall20 ?? summary.final_eval?.ndcg20 ?? 0.1;
  const base = Math.max(12, Math.min(100, Math.round(fallbackScore * 100)));
  return [Math.max(12, base - 18), Math.max(16, base - 10), Math.max(20, base - 4), base];
};

const buildApiHistoryConfig = (summary: ExperimentSummaryListItem): TrainConfig => {
  const mode = mapExperimentMode(summary.experiment_mode);
  const attackType = mapAttackType(summary.active_attacks);
  const defenseType = mapDefenseType(summary.active_defenses);
  const participantCount = Math.max(
    1,
    Number(
      (
        summary as {
          round_summaries?: Array<{num_participants?: number | null}>;
        }
      ).round_summaries?.[0]?.num_participants ?? defaultTrainConfig.clientCount,
    ),
  );

  return {
    ...defaultTrainConfig,
    dataset: summary.dataset || defaultTrainConfig.dataset,
    model: (summary.model || defaultTrainConfig.model).toLowerCase(),
    mode,
    attackEnabled: attackType !== 'none',
    attackType,
    defenseEnabled: defenseType !== 'none',
    defenseType,
    clientCount: participantCount,
    clientSamplingRate: 1,
    totalRounds:
      (
        summary as {
          round_summaries?: unknown[];
        }
      ).round_summaries?.length || defaultTrainConfig.totalRounds,
    poisoningRatio: Number(summary.final_eval?.loss ? 0.2 : defaultTrainConfig.poisoningRatio),
  };
};

const mapApiSummaryToHistoryRecord = (summary: ExperimentSummaryListItem): HistoryRecord => {
  const config = buildApiHistoryConfig(summary);
  const attackType = config.attackType;
  const defenseType = config.defenseType;
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
    attackType,
    defenseType,
    keyParams: {
      learningRate: config.learningRate,
      clientSamplingRate: config.clientSamplingRate,
      localEpochs: config.advanced.localEpochs,
      totalRounds: config.totalRounds,
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
      loss: summary.final_eval?.loss ?? undefined,
    },
    status: 'completed',
    config,
    configSummary: {
      ...buildTrainConfigSummary(config),
      dataset: config.dataset,
      model: config.model,
      clientCount: config.clientCount,
      clientSamplingRate: config.clientSamplingRate,
      totalRounds: config.totalRounds,
      learningRate: config.learningRate,
      localEpochs: config.advanced.localEpochs,
    },
    summary: `实验场景：${summary.experiment_mode || 'baseline'}；攻击模块 ${summary.active_attacks?.length || 0} 个，防御模块 ${summary.active_defenses?.length || 0} 个。`,
    previewBars: buildPreviewBars(summary),
  };
};

const loadHistoryFromApi = async (): Promise<HistoryListResponse> => {
  const response = await apiGet<ExperimentSummaryListResponse>('/experiments/summaries');
  const records = response.items.map(mapApiSummaryToHistoryRecord);

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

export const deleteHistory = async (id: string): Promise<{success: boolean; id: string}> => {
  return simulateRequest(() => {
    apiHistoryCache.delete(id);
    mockStore.deleteHistoryRecord(id);
    return {success: true, id};
  });
};

export const reuseHistoryConfig = async (id: string): Promise<ReuseHistoryResponse> => {
  return simulateRequest(() => {
    const apiRecord = apiHistoryCache.get(id);
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
