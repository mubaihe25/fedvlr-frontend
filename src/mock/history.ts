import type {HistoryFilterOptions, HistoryRecord} from '../types/history';
import type {TrainConfig} from '../types/train';
import {buildTrainConfigSummary, defaultTrainConfig} from './configuration';

type TrainConfigOverrides = Omit<Partial<TrainConfig>, 'advanced'> & {
  advanced?: Partial<TrainConfig['advanced']>;
};

const createHistoryConfig = (overrides: TrainConfigOverrides): TrainConfig => {
  const {advanced, ...restOverrides} = overrides;

  return {
    ...defaultTrainConfig,
    ...restOverrides,
    advanced: {
      ...defaultTrainConfig.advanced,
      ...advanced,
    },
  };
};

const baselineConfig = createHistoryConfig({
  model: 'fedavg-resnet',
  mode: 'baseline',
  attackEnabled: false,
  attackType: 'none',
  defenseEnabled: false,
  defenseType: 'none',
});

const failedAttackConfig = createHistoryConfig({
  dataset: 'cifar10-federated',
  model: 'fedprox-resnet',
  mode: 'attack',
  attackEnabled: true,
  attackType: 'backdoor',
  defenseEnabled: false,
  defenseType: 'none',
});

const defenseConfig = createHistoryConfig({
  dataset: 'yelp-reviews',
  model: 'scaffold-bert',
  mode: 'defense',
  attackEnabled: true,
  attackType: 'label-flipping',
  defenseEnabled: true,
  defenseType: 'differential-privacy',
  advanced: {
    differentialPrivacyEpsilon: 1.2,
  },
});

const comparisonConfig = createHistoryConfig({
  dataset: 'movielens-1m',
  model: 'mmfedrap',
  mode: 'comparison',
  attackEnabled: true,
  attackType: 'label-flipping',
  defenseEnabled: true,
  defenseType: 'cyber-shield',
});

export const initialHistoryRecords: HistoryRecord[] = [
  {
    id: 'exp-20240512-01',
    taskId: 'task-completed-demo',
    name: '任务 #EXP-20240512-01',
    createdAt: '2026-03-25 14:30',
    dataset: baselineConfig.dataset,
    model: 'ResNet-101',
    mode: baselineConfig.mode,
    attackType: baselineConfig.attackType,
    defenseType: baselineConfig.defenseType,
    keyParams: {
      learningRate: baselineConfig.learningRate,
      clientSamplingRate: baselineConfig.clientSamplingRate,
      localEpochs: baselineConfig.advanced.localEpochs,
      totalRounds: baselineConfig.totalRounds,
      clientCount: baselineConfig.clientCount,
      optimizer: baselineConfig.advanced.optimizer,
      poisoningRatio: baselineConfig.poisoningRatio,
    },
    metrics: {
      accuracy: 0.914,
      loss: 0.042,
      recall10: 0.921,
      ndcg10: 0.851,
    },
    status: 'completed',
    config: baselineConfig,
    configSummary: {
      ...buildTrainConfigSummary(baselineConfig),
      dataset: baselineConfig.dataset,
      model: baselineConfig.model,
      clientCount: baselineConfig.clientCount,
      clientSamplingRate: baselineConfig.clientSamplingRate,
      totalRounds: baselineConfig.totalRounds,
      learningRate: baselineConfig.learningRate,
      localEpochs: baselineConfig.advanced.localEpochs,
    },
    summary: '基线实验已完成，可作为默认参考实验。',
    previewBars: [20, 35, 55, 70, 85, 92, 95, 98],
  },
  {
    id: 'exp-20240512-08',
    taskId: 'task-failed-demo',
    name: '任务 #EXP-20240512-08',
    createdAt: '2026-03-25 16:15',
    dataset: failedAttackConfig.dataset,
    model: 'Vision Transformer',
    mode: failedAttackConfig.mode,
    attackType: failedAttackConfig.attackType,
    defenseType: failedAttackConfig.defenseType,
    keyParams: {
      learningRate: failedAttackConfig.learningRate,
      clientSamplingRate: failedAttackConfig.clientSamplingRate,
      localEpochs: failedAttackConfig.advanced.localEpochs,
      totalRounds: failedAttackConfig.totalRounds,
      clientCount: failedAttackConfig.clientCount,
      optimizer: failedAttackConfig.advanced.optimizer,
      poisoningRatio: failedAttackConfig.poisoningRatio,
    },
    metrics: {
      loss: 0.52,
      recall10: 0.641,
      ndcg10: 0.498,
    },
    status: 'failed',
    errorMessage: '内存溢出（OOM），实验在第 12 轮迭代中断。',
    config: failedAttackConfig,
    configSummary: {
      ...buildTrainConfigSummary(failedAttackConfig),
      dataset: failedAttackConfig.dataset,
      model: failedAttackConfig.model,
      clientCount: failedAttackConfig.clientCount,
      clientSamplingRate: failedAttackConfig.clientSamplingRate,
      totalRounds: failedAttackConfig.totalRounds,
      learningRate: failedAttackConfig.learningRate,
      localEpochs: failedAttackConfig.advanced.localEpochs,
    },
    summary: '攻击实验失败，可用于展示异常任务状态。',
    previewBars: [18, 24, 31, 35, 39, 41, 40, 38],
  },
  {
    id: 'exp-20240511-22',
    taskId: 'history-exp-defense',
    name: '任务 #EXP-20240511-22',
    createdAt: '2026-03-24 23:10',
    dataset: defenseConfig.dataset,
    model: 'FL-BERT',
    mode: defenseConfig.mode,
    attackType: defenseConfig.attackType,
    defenseType: defenseConfig.defenseType,
    keyParams: {
      learningRate: defenseConfig.learningRate,
      clientSamplingRate: defenseConfig.clientSamplingRate,
      localEpochs: defenseConfig.advanced.localEpochs,
      totalRounds: defenseConfig.totalRounds,
      clientCount: defenseConfig.clientCount,
      optimizer: defenseConfig.advanced.optimizer,
      privacyBudget: defenseConfig.advanced.differentialPrivacyEpsilon ?? null,
      poisoningRatio: defenseConfig.poisoningRatio,
    },
    metrics: {
      f1Score: 0.887,
      recall10: 0.903,
      ndcg10: 0.856,
      privacyBudget: 1.2,
    },
    status: 'completed',
    config: defenseConfig,
    configSummary: {
      ...buildTrainConfigSummary(defenseConfig),
      dataset: defenseConfig.dataset,
      model: defenseConfig.model,
      clientCount: defenseConfig.clientCount,
      clientSamplingRate: defenseConfig.clientSamplingRate,
      totalRounds: defenseConfig.totalRounds,
      learningRate: defenseConfig.learningRate,
      localEpochs: defenseConfig.advanced.localEpochs,
    },
    summary: '防御实验稳定完成，可直接复用到配置页继续调参。',
    previewBars: [22, 36, 52, 68, 82, 91, 96, 99],
  },
  {
    id: 'exp-20240510-09',
    taskId: 'comparison-task-demo',
    name: '任务 #EXP-20240510-09',
    createdAt: '2026-03-23 10:45',
    dataset: comparisonConfig.dataset,
    model: 'MMFedRAP',
    mode: comparisonConfig.mode,
    attackType: comparisonConfig.attackType,
    defenseType: comparisonConfig.defenseType,
    keyParams: {
      learningRate: comparisonConfig.learningRate,
      clientSamplingRate: comparisonConfig.clientSamplingRate,
      localEpochs: comparisonConfig.advanced.localEpochs,
      totalRounds: comparisonConfig.totalRounds,
      clientCount: comparisonConfig.clientCount,
      optimizer: comparisonConfig.advanced.optimizer,
      privacyBudget: comparisonConfig.advanced.differentialPrivacyEpsilon ?? null,
      poisoningRatio: comparisonConfig.poisoningRatio,
    },
    metrics: {
      accuracy: 0.932,
      loss: 0.14,
      recall10: 0.942,
      ndcg10: 0.885,
    },
    status: 'completed',
    config: comparisonConfig,
    configSummary: {
      ...buildTrainConfigSummary(comparisonConfig),
      dataset: comparisonConfig.dataset,
      model: comparisonConfig.model,
      clientCount: comparisonConfig.clientCount,
      clientSamplingRate: comparisonConfig.clientSamplingRate,
      totalRounds: comparisonConfig.totalRounds,
      learningRate: comparisonConfig.learningRate,
      localEpochs: comparisonConfig.advanced.localEpochs,
    },
    summary: '攻防对比实验适合作为默认对比页数据来源。',
    previewBars: [16, 29, 46, 60, 75, 88, 94, 98],
  },
];

export const historyFilterOptions: HistoryFilterOptions = {
  periods: [
    {value: '7d', label: '最近 7 天'},
    {value: '30d', label: '最近 30 天'},
    {value: 'all', label: '全部时间'},
  ],
  models: [
    {value: 'all', label: '全部模型'},
    {value: 'ResNet-101', label: 'ResNet-101'},
    {value: 'Vision Transformer', label: 'Vision Transformer'},
    {value: 'FL-BERT', label: 'FL-BERT'},
    {value: 'MMFedRAP', label: 'MMFedRAP'},
  ],
  modes: [
    {value: 'all', label: '全部模式'},
    {value: 'baseline', label: '基线实验'},
    {value: 'attack', label: '攻击实验'},
    {value: 'defense', label: '防御实验'},
    {value: 'comparison', label: '攻防对比实验'},
  ],
};

export const mockHistoryData = {
  stats: {
    total: initialHistoryRecords.length,
    successRate: `${Math.round(
      (initialHistoryRecords.filter((record) => record.status === 'completed').length / initialHistoryRecords.length) * 100,
    )}%`,
  },
  filterOptions: historyFilterOptions,
  records: initialHistoryRecords,
  defaultDetailId: initialHistoryRecords[0]?.id ?? null,
};
