export type ExperimentMode = 'baseline' | 'attack' | 'defense' | 'comparison';

export type AttackType =
  | 'none'
  | 'label-flipping'
  | 'backdoor'
  | 'gradient-noise'
  | 'sybil'
  | 'client_update_scale'
  | 'client_preference_leakage_probe';

export type DefenseType =
  | 'none'
  | 'anomaly-detection'
  | 'trimmed-mean'
  | 'krum'
  | 'secure-aggregation'
  | 'differential-privacy'
  | 'cyber-shield'
  | 'norm_clip'
  | 'client_update_anomaly';

export interface TrainAdvancedConfig {
  batchSize: number;
  optimizer: 'adam' | 'adamw' | 'sgd';
  weightDecay: number;
  localEpochs: number;
  gradientClip: number;
  differentialPrivacyEpsilon?: number | null;
  secureAggregation: boolean;
  notes?: string;
}

export interface TrainConfig {
  dataset: string;
  model: string;
  mode: ExperimentMode;
  attackEnabled: boolean;
  attackType: AttackType;
  defenseEnabled: boolean;
  defenseType: DefenseType;
  learningRate: number;
  totalRounds: number;
  clientCount: number;
  clientSamplingRate: number;
  poisoningRatio: number;
  advanced: TrainAdvancedConfig;
}

export interface TrainConfigSummary {
  datasetLabel: string;
  modelLabel: string;
  modeLabel: string;
  attackLabel: string;
  defenseLabel: string;
  estimatedDuration: string;
  resourceEstimate: string;
  privacyLevel: string;
  topologyPreview: string;
}
