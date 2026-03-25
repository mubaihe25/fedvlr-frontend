import type {SelectOption} from '../types/common';
import type {
  AttackType,
  DefenseType,
  ExperimentMode,
  TrainAdvancedConfig,
  TrainConfig,
  TrainConfigSummary,
} from '../types/train';

export const datasetOptions: SelectOption[] = [
  {value: 'cifar10-federated', label: 'CIFAR-10 联邦数据集'},
  {value: 'mnist-federated', label: 'MNIST 联邦数据集'},
  {value: 'movielens-1m', label: 'MovieLens-1M 推荐数据集'},
  {value: 'yelp-reviews', label: 'Yelp Reviews 评论数据集'},
];

export const modelOptions: SelectOption[] = [
  {value: 'fedavg-resnet', label: 'FedAvg / ResNet-50'},
  {value: 'fedprox-resnet', label: 'FedProx / ResNet-50'},
  {value: 'scaffold-bert', label: 'SCAFFOLD / FL-BERT'},
  {value: 'mmfedrap', label: 'MMFedRAP'},
];

export const modeOptions: SelectOption<ExperimentMode>[] = [
  {value: 'baseline', label: '基线实验'},
  {value: 'attack', label: '攻击实验'},
  {value: 'defense', label: '防御实验'},
  {value: 'comparison', label: '攻防对比实验'},
];

export const attackOptions: SelectOption<AttackType>[] = [
  {value: 'none', label: '不启用攻击'},
  {value: 'label-flipping', label: '标签翻转'},
  {value: 'backdoor', label: '后门注入'},
  {value: 'gradient-noise', label: '梯度噪声'},
  {value: 'sybil', label: 'Sybil 多身份攻击'},
];

export const defenseOptions: SelectOption<DefenseType>[] = [
  {value: 'none', label: '不启用防御'},
  {value: 'anomaly-detection', label: '异常检测'},
  {value: 'trimmed-mean', label: 'Trimmed Mean 鲁棒聚合'},
  {value: 'krum', label: 'Krum 鲁棒聚合'},
  {value: 'secure-aggregation', label: '安全聚合'},
  {value: 'differential-privacy', label: '差分隐私'},
  {value: 'cyber-shield', label: 'Cyber-Shield 防御'},
];

export const defaultAdvancedConfig: TrainAdvancedConfig = {
  batchSize: 128,
  optimizer: 'adamw',
  weightDecay: 0.01,
  localEpochs: 5,
  gradientClip: 1.0,
  differentialPrivacyEpsilon: 2.5,
  secureAggregation: true,
  notes: '默认采用非 IID 数据分布与三组对比实验设定。',
};

export const defaultTrainConfig: TrainConfig = {
  dataset: 'movielens-1m',
  model: 'mmfedrap',
  mode: 'comparison',
  attackEnabled: true,
  attackType: 'label-flipping',
  defenseEnabled: true,
  defenseType: 'cyber-shield',
  learningRate: 0.0015,
  totalRounds: 120,
  clientCount: 100,
  clientSamplingRate: 0.25,
  poisoningRatio: 0.2,
  advanced: defaultAdvancedConfig,
};

export const formatDatasetLabel = (dataset: string) =>
  datasetOptions.find((option) => option.value === dataset)?.label ?? dataset;

export const formatModelLabel = (model: string) =>
  modelOptions.find((option) => option.value === model)?.label ?? model;

export const formatModeLabel = (mode: ExperimentMode) =>
  modeOptions.find((option) => option.value === mode)?.label ?? mode;

export const formatAttackLabel = (attackType: AttackType, attackEnabled = true) => {
  if (!attackEnabled || attackType === 'none') {
    return '未启用攻击';
  }

  return attackOptions.find((option) => option.value === attackType)?.label ?? attackType;
};

export const formatDefenseLabel = (defenseType: DefenseType, defenseEnabled = true) => {
  if (!defenseEnabled || defenseType === 'none') {
    return '未启用防御';
  }

  return defenseOptions.find((option) => option.value === defenseType)?.label ?? defenseType;
};

export const buildTrainConfigSummary = (config: TrainConfig): TrainConfigSummary => {
  const samplingClients = Math.max(1, Math.round(config.clientCount * config.clientSamplingRate));
  const privacyLevel =
    config.defenseType === 'differential-privacy' || config.advanced.differentialPrivacyEpsilon
      ? '较强'
      : config.defenseEnabled
        ? '中等'
        : '基础';

  return {
    datasetLabel: formatDatasetLabel(config.dataset),
    modelLabel: formatModelLabel(config.model),
    modeLabel: formatModeLabel(config.mode),
    attackLabel: formatAttackLabel(config.attackType, config.attackEnabled),
    defenseLabel: formatDefenseLabel(config.defenseType, config.defenseEnabled),
    estimatedDuration: `约 ${Math.max(1, Math.round(config.totalRounds * 1.35))} 分钟`,
    resourceEstimate: `${(6 + samplingClients * 0.08).toFixed(1)} GB GPU`,
    privacyLevel,
    topologyPreview: `${config.clientCount} 个客户端 / 每轮采样 ${samplingClients} 个`,
  };
};

export const mockConfigurationData = {
  datasetOptions,
  modelOptions,
  modeOptions,
  attackOptions,
  defenseOptions,
  defaultConfig: defaultTrainConfig,
  defaultAdvancedConfig,
  buildSummary: buildTrainConfigSummary,
};
