export type ExperimentMode = 'baseline' | 'attack' | 'defense' | 'comparison';

export type AttackType =
  | 'none'
  | 'label-flipping'
  | 'backdoor'
  | 'gradient-noise'
  | 'sybil'
  | 'client_update_scale'
  | 'sign_flip'
  | 'model_replacement'
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
  | 'update_filter'
  | 'trimmed_mean'
  | 'client_update_anomaly';

export type UnifiedExperimentScenario =
  | 'baseline'
  | 'attack_only'
  | 'defense_only'
  | 'attack_and_defense'
  | 'privacy_observation'
  | 'custom';

export interface MaliciousClientConfig {
  enabled: boolean;
  mode: 'none' | 'ratio' | 'fixed';
  ratio: number;
  clientIds: Array<string | number>;
}

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
  scenario?: UnifiedExperimentScenario;
  attackEnabled: boolean;
  attackType: AttackType;
  enabledAttacks?: string[];
  defenseEnabled: boolean;
  defenseType: DefenseType;
  enabledDefenses?: string[];
  enabledPrivacyMetrics?: string[];
  maliciousClientConfig?: MaliciousClientConfig;
  learningRate: number;
  totalRounds: number;
  clientCount: number;
  clientSamplingRate: number;
  poisoningRatio: number;
  advanced: TrainAdvancedConfig;
  attackParams?: Record<string, Record<string, unknown>>;
  defenseParams?: Record<string, Record<string, unknown>>;
  privacyParams?: Record<string, Record<string, unknown>>;
  type?: string;
  comment?: string;
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

export interface CapabilityModel {
  name: string;
  family: string;
  recommended_dataset: string;
  supported_datasets?: string[];
  supports_multi_attack?: boolean;
  supports_multi_defense?: boolean;
  validated_attacks?: string[];
  validated_defenses?: string[];
  validated_privacy_metrics?: string[];
  compatibility_status?: string;
  recommended_training_overrides?: Record<string, number | string | boolean>;
  notes?: string;
}

export interface CapabilityModule {
  name: string;
  type: string;
  config_schema?: Record<string, string>;
  default_values?: Record<string, unknown>;
  recommended_models?: string[];
  validated_models?: string[];
  notes?: string;
}

export interface CapabilityCombination {
  name: string;
  scenario: UnifiedExperimentScenario;
  attacks: string[];
  defenses: string[];
  privacy_metrics: string[];
  validated_models: string[];
  status: string;
}

export interface CapabilityMatrixData {
  version?: string;
  updated_at?: string;
  max_enabled_attacks?: number;
  max_enabled_defenses?: number;
  max_enabled_privacy_metrics?: number;
  execution_order?: string[];
  models: CapabilityModel[];
  attacks: CapabilityModule[];
  defenses: CapabilityModule[];
  privacy_metrics: CapabilityModule[];
  validated_combinations: CapabilityCombination[];
}

export interface CapabilitiesResponse {
  source: string;
  updated_at?: string | null;
  model_count: number;
  attack_count: number;
  defense_count: number;
  privacy_metric_count: number;
  validated_combination_count: number;
  data: CapabilityMatrixData;
}

export interface ExperimentConfigSchemaResponse {
  source: string;
  updated_at?: string | null;
  required_fields: string[];
  data: {
    title?: string;
    version?: string;
    required?: string[];
    properties?: Record<
      string,
      {
        type?: string | string[];
        default?: unknown;
        maxItems?: number;
        enum?: string[];
        description?: string;
        properties?: Record<string, unknown>;
      }
    >;
    multi_module_policy?: {
      execution_order?: string;
      max_enabled_attacks?: number;
      max_enabled_defenses?: number;
      max_enabled_privacy_metrics?: number;
      recommended_open_combinations?: Array<Record<string, unknown>>;
      unverified_examples?: Array<Record<string, unknown>>;
    };
  };
}

export interface UnifiedExperimentConfig {
  model: string;
  dataset: string;
  scenario: UnifiedExperimentScenario;
  type: string;
  comment: string;
  enabled_attacks: string[];
  enabled_defenses: string[];
  enabled_privacy_metrics: string[];
  malicious_client_config: {
    enabled: boolean;
    mode: 'none' | 'ratio' | 'fixed';
    ratio: number;
    client_ids: Array<string | number>;
  };
  training_params: Record<string, unknown>;
  attack_params: Record<string, Record<string, unknown>>;
  defense_params: Record<string, Record<string, unknown>>;
  privacy_params: Record<string, Record<string, unknown>>;
}

export interface LaunchExperimentOptions {
  validateOnly?: boolean;
  dryRun?: boolean;
  strictValidation?: boolean;
}

export interface LaunchExperimentResponse {
  accepted: boolean;
  success: boolean;
  launch_mode: string;
  command: string[];
  return_code?: number | null;
  experiment_id?: string | null;
  result_dir?: string | null;
  summary_path?: string | null;
  result_path?: string | null;
  csv_path?: string | null;
  validation_warnings: string[];
  errors: string[];
  stdout_tail?: string | null;
  stderr_tail?: string | null;
  launcher_payload?: Record<string, unknown>;
}
