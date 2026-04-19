import {mockConfigurationData} from '../mock/configuration';
import {getModuleLabel, isPrivacyProbeModule, isRobustDefenseModule} from '../lib/experimentLabels';
import type {SelectOption} from '../types/common';
import type {
  CapabilitiesResponse,
  CapabilityCombination,
  CapabilityMatrixData,
  CapabilityModule,
  ExperimentConfigSchemaResponse,
  LaunchExperimentOptions,
  LaunchExperimentResponse,
  TrainConfig,
  UnifiedExperimentConfig,
  UnifiedExperimentScenario,
} from '../types/train';
import {apiGet, apiPost} from './api';

export interface ExperimentConfigurationSource {
  dataSource: 'api' | 'mock';
  dataSourceLabel: string;
  fallbackReason?: string;
  datasetOptions: SelectOption[];
  modelOptions: SelectOption[];
  attackOptions: SelectOption[];
  poisoningAttackOptions: SelectOption[];
  privacyProbeOptions: SelectOption[];
  defenseOptions: SelectOption[];
  privacyMetricOptions: SelectOption[];
  requiredFields: string[];
  schemaVersion?: string;
  maxEnabledAttacks: number;
  maxEnabledPoisoningAttacks: number;
  maxEnabledPrivacyProbes: number;
  maxEnabledDefenses: number;
  maxEnabledPrivacyMetrics: number;
  executionOrder: string;
  capabilities?: CapabilityMatrixData;
  schema?: ExperimentConfigSchemaResponse['data'];
}

export const modeToScenario = (mode: TrainConfig['mode']): UnifiedExperimentScenario => {
  switch (mode) {
    case 'attack':
      return 'attack_only';
    case 'defense':
      return 'defense_only';
    case 'comparison':
      return 'attack_and_defense';
    case 'baseline':
    default:
      return 'baseline';
  }
};

const compact = (values?: string[]) =>
  Array.from(new Set((values ?? []).filter(Boolean).filter((value) => value !== 'none')));

export const UNIFIED_POISONING_ATTACK = 'poisoning_attack';
const legacyPoisoningAttacks = new Set(['client_update_scale', 'sign_flip', 'model_replacement', 'poisoning', 'nondirected_poisoning']);
export const UNIFIED_ROBUST_DEFENSE = 'robust_defense';
const legacyRobustDefenses = new Set(['norm_clip', 'update_filter', 'trimmed_mean', 'robust', 'robust_aggregation_defense']);

const normalizeAttackSelection = (values?: string[]) => {
  const attacks = compact(values);
  const hasPoisoning = attacks.some((attack) => attack === UNIFIED_POISONING_ATTACK || legacyPoisoningAttacks.has(attack));
  const nonPoisoning = attacks.filter((attack) => attack !== UNIFIED_POISONING_ATTACK && !legacyPoisoningAttacks.has(attack));
  return hasPoisoning ? [UNIFIED_POISONING_ATTACK, ...nonPoisoning] : nonPoisoning;
};

export const getSelectedAttacks = (config: TrainConfig) =>
  normalizeAttackSelection(config.enabledAttacks ?? (config.attackEnabled ? [config.attackType] : []));

export const getSelectedDefenses = (config: TrainConfig) =>
  normalizeDefenseSelection(config.enabledDefenses ?? (config.defenseEnabled ? [config.defenseType] : []));

const normalizeDefenseSelection = (values?: string[]) => {
  const defenses = compact(values);
  const hasRobustDefense = defenses.some((defense) => defense === UNIFIED_ROBUST_DEFENSE || legacyRobustDefenses.has(defense));
  const nonRobust = defenses.filter((defense) => defense !== UNIFIED_ROBUST_DEFENSE && !legacyRobustDefenses.has(defense));
  return hasRobustDefense ? [UNIFIED_ROBUST_DEFENSE, ...nonRobust] : nonRobust;
};

export const getSelectedPrivacyMetrics = (config: TrainConfig) => compact(config.enabledPrivacyMetrics);

const mapOptimizerToLearner = (optimizer: TrainConfig['advanced']['optimizer'] | undefined) => {
  if (optimizer === 'sgd') {
    return 'sgd';
  }

  return 'adam';
};

const mapModuleToOption = (module: CapabilityModule): SelectOption => {
  const display = getModuleLabel(module.name);
  return {
    value: module.name,
    label: display.title,
    description: module.notes ?? display.description,
  };
};

const fallbackModuleOption = (name: string): SelectOption => {
  const display = getModuleLabel(name);
  return {
    value: name,
    label: display.title,
    description: display.description,
  };
};

const createFallbackPoisoningModule = (): CapabilityModule => ({
  name: UNIFIED_POISONING_ATTACK,
  type: 'active_attack',
  family: 'poisoning',
  category: 'poisoning',
  strategy: 'unified_nondirected_poisoning',
  display_category: '投毒攻击',
  mutates_participant_params: true,
  is_read_only: false,
  config_schema: {
    poisoning_mix_rule: 'string',
    poisoning_scale_ratio: 'float',
    poisoning_sign_flip_ratio: 'float',
    poisoning_model_replacement_ratio: 'float',
    poisoning_attack_scale: 'float',
    poisoning_sign_flip_scale: 'float',
    poisoning_replacement_scale: 'float',
    poisoning_replacement_rule: 'string',
  },
  default_values: {
    poisoning_mix_rule: 'round_robin',
    poisoning_scale_ratio: 0.34,
    poisoning_sign_flip_ratio: 0.33,
    poisoning_model_replacement_ratio: 0.33,
    poisoning_attack_scale: 2.0,
    poisoning_sign_flip_scale: 1.0,
    poisoning_replacement_scale: 5.0,
    poisoning_replacement_rule: 'aligned_mean',
  },
  notes: '统一的非定向投毒入口，内部组合更新缩放、符号翻转和模型替换三种子策略。',
});

const normalizePoisoningModule = (module?: CapabilityModule): CapabilityModule => {
  const fallback = createFallbackPoisoningModule();
  return {
    ...fallback,
    ...(module ?? {}),
    name: UNIFIED_POISONING_ATTACK,
    config_schema: fallback.config_schema,
    default_values: {
      ...fallback.default_values,
      ...(module?.default_values ?? {}),
      poisoning_scale_ratio: Number(module?.default_values?.poisoning_scale_ratio ?? fallback.default_values?.poisoning_scale_ratio),
      poisoning_sign_flip_ratio: Number(module?.default_values?.poisoning_sign_flip_ratio ?? fallback.default_values?.poisoning_sign_flip_ratio),
      poisoning_model_replacement_ratio: Number(
        module?.default_values?.poisoning_model_replacement_ratio ?? fallback.default_values?.poisoning_model_replacement_ratio,
      ),
    },
  };
};

const getUnifiedPoisoningModule = (attacks: CapabilityModule[] = []) => {
  const directModule = attacks.find((module) => module.name === UNIFIED_POISONING_ATTACK || module.aliases?.includes(UNIFIED_POISONING_ATTACK));
  return normalizePoisoningModule(directModule);
};

const createFallbackRobustDefenseModule = (): CapabilityModule => ({
  name: UNIFIED_ROBUST_DEFENSE,
  aliases: ['robust', 'robust_aggregation_defense'],
  type: 'unified_robust_defense',
  family: 'robust_defense',
  category: 'robust_defense',
  strategy: 'unified_robust_defense',
  display_category: '鲁棒防御',
  is_read_only: false,
  mutates_participant_params: true,
  config_schema: {
    robust_defense_mode: 'string',
    robust_clip_norm: 'float',
    robust_filter_rule: 'string',
    robust_filter_std_factor: 'float',
    robust_max_filtered_ratio: 'float',
    robust_trim_ratio: 'float',
    robust_min_clients_for_trim: 'integer',
    robust_trim_rule: 'string',
  },
  default_values: {
    robust_defense_mode: 'trimmed_mean',
    robust_clip_norm: 30.0,
    robust_filter_rule: 'update_norm > mean + filter_std_factor * std',
    robust_filter_std_factor: 2.0,
    robust_max_filtered_ratio: 0.3,
    robust_trim_ratio: 0.2,
    robust_min_clients_for_trim: 5,
    robust_trim_rule: 'coordinate_trimmed_mean',
  },
  notes: '统一的鲁棒防御入口，内部支持裁剪型、过滤型和鲁棒聚合型模式。',
});

const normalizeRobustDefenseModule = (module?: CapabilityModule): CapabilityModule => {
  const fallback = createFallbackRobustDefenseModule();
  return {
    ...fallback,
    ...(module ?? {}),
    name: UNIFIED_ROBUST_DEFENSE,
    aliases: Array.from(new Set([...(fallback.aliases ?? []), ...(module?.aliases ?? [])])),
    config_schema: {
      ...fallback.config_schema,
      ...(module?.config_schema ?? {}),
    },
    default_values: {
      ...fallback.default_values,
      ...(module?.default_values ?? {}),
    },
  };
};

const getUnifiedRobustDefenseModule = (defenses: CapabilityModule[] = []) => {
  const directModule = defenses.find(
    (module) => module.name === UNIFIED_ROBUST_DEFENSE || module.aliases?.includes(UNIFIED_ROBUST_DEFENSE),
  );
  return normalizeRobustDefenseModule(directModule);
};

const mapCapabilitiesToSource = (
  capabilitiesResponse: CapabilitiesResponse,
  schemaResponse: ExperimentConfigSchemaResponse,
): ExperimentConfigurationSource => {
  const capabilities = capabilitiesResponse.data;
  const schema = schemaResponse.data;
  const poisoningAttack = getUnifiedPoisoningModule(capabilities.attacks);
  const robustDefense = getUnifiedRobustDefenseModule(capabilities.defenses);
  const normalizedCapabilities: CapabilityMatrixData = {
    ...capabilities,
    attacks: [
      poisoningAttack,
      ...capabilities.attacks.filter(
        (module) => module.name !== UNIFIED_POISONING_ATTACK && !legacyPoisoningAttacks.has(module.name),
      ),
    ],
    defenses: [
      robustDefense,
      ...capabilities.defenses.filter(
        (module) =>
          module.name !== UNIFIED_ROBUST_DEFENSE &&
          !legacyRobustDefenses.has(module.name) &&
          !isRobustDefenseModule(module.name, module),
      ),
    ],
  };
  const privacyProbes = normalizedCapabilities.attacks.filter((module) => isPrivacyProbeModule(module.name, module));
  const supportedDatasets = Array.from(
    new Set(
      normalizedCapabilities.models.flatMap((model) =>
        model.supported_datasets?.length ? model.supported_datasets : [model.recommended_dataset],
      ),
    ),
  ).filter(Boolean);
  const policy = schema.multi_module_policy;

  return {
    dataSource: 'api',
    dataSourceLabel: '真实能力矩阵',
    datasetOptions: supportedDatasets.map((dataset) => ({value: dataset, label: dataset})),
    modelOptions: normalizedCapabilities.models.map((model) => ({
      value: model.name,
      label: model.name,
      description: `${model.family} / ${model.compatibility_status ?? 'unknown'}${model.notes ? `，${model.notes}` : ''}`,
      disabled: model.compatibility_status === 'blocked',
    })),
    attackOptions: [poisoningAttack].map(mapModuleToOption),
    poisoningAttackOptions: [poisoningAttack].map(mapModuleToOption),
    privacyProbeOptions: privacyProbes.map(mapModuleToOption),
    defenseOptions: [robustDefense].map(mapModuleToOption),
    privacyMetricOptions: normalizedCapabilities.privacy_metrics.map(mapModuleToOption),
    requiredFields: schemaResponse.required_fields,
    schemaVersion: schema.version,
    maxEnabledAttacks: policy?.max_enabled_attacks ?? normalizedCapabilities.max_enabled_attacks ?? 2,
    maxEnabledPoisoningAttacks: 1,
    maxEnabledPrivacyProbes: 1,
    maxEnabledDefenses: 1,
    maxEnabledPrivacyMetrics: policy?.max_enabled_privacy_metrics ?? normalizedCapabilities.max_enabled_privacy_metrics ?? 3,
    executionOrder: policy?.execution_order ?? normalizedCapabilities.execution_order?.join(' -> ') ?? 'enabled_attacks -> enabled_defenses -> enabled_privacy_metrics',
    capabilities: normalizedCapabilities,
    schema,
  };
};

export const createFallbackExperimentConfigurationSource = (fallbackReason?: string): ExperimentConfigurationSource => ({
  dataSource: 'mock',
  dataSourceLabel: 'Mock 兜底配置',
  fallbackReason,
  datasetOptions: mockConfigurationData.datasetOptions,
  modelOptions: mockConfigurationData.modelOptions,
  attackOptions: [UNIFIED_POISONING_ATTACK].map(fallbackModuleOption),
  poisoningAttackOptions: [UNIFIED_POISONING_ATTACK].map(fallbackModuleOption),
  privacyProbeOptions: ['client_preference_leakage_probe'].map(fallbackModuleOption),
  defenseOptions: [UNIFIED_ROBUST_DEFENSE].map(fallbackModuleOption),
  privacyMetricOptions: ['client_update_norm'].map(fallbackModuleOption),
  requiredFields: ['model', 'dataset', 'scenario'],
  maxEnabledAttacks: 2,
  maxEnabledPoisoningAttacks: 1,
  maxEnabledPrivacyProbes: 1,
  maxEnabledDefenses: 1,
  maxEnabledPrivacyMetrics: 3,
  executionOrder: 'enabled_attacks -> enabled_defenses -> enabled_privacy_metrics',
});

export const getExperimentConfigurationSource = async (): Promise<ExperimentConfigurationSource> => {
  try {
    const [capabilities, schema] = await Promise.all([
      apiGet<CapabilitiesResponse>('/capabilities'),
      apiGet<ExperimentConfigSchemaResponse>('/experiment-schema'),
    ]);
    return mapCapabilitiesToSource(capabilities, schema);
  } catch (error) {
    return createFallbackExperimentConfigurationSource(
      error instanceof Error ? error.message : '能力矩阵或实验 schema 加载失败。',
    );
  }
};

const sameList = (left: string[], right: string[]) =>
  left.length === right.length && left.every((value, index) => value === right[index]);

export const findValidatedCombination = (
  source: ExperimentConfigurationSource,
  config: TrainConfig,
): CapabilityCombination | null => {
  const combinations = source.capabilities?.validated_combinations ?? [];
  const scenario = config.scenario ?? modeToScenario(config.mode);
  const attacks = getSelectedAttacks(config);
  const defenses = getSelectedDefenses(config);
  const privacyMetrics = getSelectedPrivacyMetrics(config);

  return (
    combinations.find(
      (combination) =>
        combination.scenario === scenario &&
        combination.validated_models.includes(config.model) &&
        sameList(normalizeAttackSelection(combination.attacks), attacks) &&
        sameList(normalizeDefenseSelection(combination.defenses), defenses) &&
        sameList(combination.privacy_metrics, privacyMetrics),
    ) ?? null
  );
};

const mergeModuleParams = (modules: string[], registry: CapabilityModule[] | undefined, overrides?: Record<string, Record<string, unknown>>) =>
  modules.reduce<Record<string, Record<string, unknown>>>((params, moduleName) => {
    const defaults = registry?.find((module) => module.name === moduleName)?.default_values ?? {};
    params[moduleName] = {
      ...defaults,
      ...(overrides?.[moduleName] ?? {}),
    };
    return params;
  }, {});

const normalizePoisoningParams = (attackParams: Record<string, Record<string, unknown>>) => {
  const params = attackParams[UNIFIED_POISONING_ATTACK];
  if (!params) {
    return attackParams;
  }

  const scaleRatio = Number(params.poisoning_scale_ratio ?? 0.34);
  const signFlipRatio = Number(params.poisoning_sign_flip_ratio ?? 0.33);
  const replacementRatio = Number(params.poisoning_model_replacement_ratio ?? 0.33);
  return {
    ...attackParams,
    [UNIFIED_POISONING_ATTACK]: {
      ...params,
      poisoning_strategy_weights: {
        client_update_scale: Number.isFinite(scaleRatio) ? scaleRatio : 0,
        sign_flip: Number.isFinite(signFlipRatio) ? signFlipRatio : 0,
        model_replacement: Number.isFinite(replacementRatio) ? replacementRatio : 0,
      },
      poisoning_enabled_substrategies: [
        ...(scaleRatio > 0 ? ['client_update_scale'] : []),
        ...(signFlipRatio > 0 ? ['sign_flip'] : []),
        ...(replacementRatio > 0 ? ['model_replacement'] : []),
      ],
    },
  };
};

export const buildUnifiedExperimentConfig = (
  config: TrainConfig,
  source?: ExperimentConfigurationSource,
): UnifiedExperimentConfig => {
  const scenario = config.scenario ?? modeToScenario(config.mode);
  const attacks = getSelectedAttacks(config);
  const defenses = getSelectedDefenses(config);
  const privacyMetrics = getSelectedPrivacyMetrics(config);
  const capabilities = source?.capabilities;
  const hasPoisoningAttack = attacks.includes(UNIFIED_POISONING_ATTACK);
  const learner = mapOptimizerToLearner(config.advanced.optimizer);
  const maliciousClientConfig = config.maliciousClientConfig ?? {
    enabled: hasPoisoningAttack,
    mode: hasPoisoningAttack ? 'ratio' : 'none',
    ratio: hasPoisoningAttack ? config.poisoningRatio : 0,
    clientIds: [],
  };
  const attackParams = normalizePoisoningParams(
    mergeModuleParams(attacks, capabilities?.attacks, config.attackParams),
  );

  return {
    model: config.model,
    dataset: config.dataset,
    scenario,
    type: config.type || 'FrontendLaunch',
    comment: config.comment || `frontend_${scenario}`,
    enabled_attacks: attacks,
    enabled_defenses: defenses,
    enabled_privacy_metrics: privacyMetrics,
    malicious_client_config: {
      enabled: Boolean(maliciousClientConfig.enabled && hasPoisoningAttack),
      mode: maliciousClientConfig.enabled && hasPoisoningAttack ? maliciousClientConfig.mode : 'none',
      ratio: maliciousClientConfig.enabled && hasPoisoningAttack ? maliciousClientConfig.ratio : 0,
      client_ids: maliciousClientConfig.clientIds,
    },
    training_params: {
      epochs: config.totalRounds,
      local_epochs: config.advanced.localEpochs,
      clients_sample_ratio: config.clientSamplingRate,
      eval_step: 1,
      use_gpu: config.advanced.useGpu ?? true,
      collect_round_metrics: true,
      early_stop: false,
      stopping_step: 100000,
      tol: 0.0,
      lr: config.learningRate,
      l2_reg: config.advanced.weightDecay,
      learner,
      optimizer: learner,
    },
    attack_params: attackParams,
    defense_params: mergeModuleParams(defenses, capabilities?.defenses, config.defenseParams),
    privacy_params: mergeModuleParams(privacyMetrics, capabilities?.privacy_metrics, config.privacyParams),
  };
};

export const launchExperiment = async (
  config: TrainConfig,
  source?: ExperimentConfigurationSource,
  options: LaunchExperimentOptions = {},
): Promise<LaunchExperimentResponse> => {
  const unifiedConfig = buildUnifiedExperimentConfig(config, source);

  return apiPost<LaunchExperimentResponse>('/experiments/launch', {
    config: unifiedConfig,
    validate_only: options.validateOnly ?? false,
    dry_run: options.dryRun ?? false,
    strict_validation: options.strictValidation ?? false,
  });
};

export const getLaunchStatus = async (launchId: string): Promise<LaunchExperimentResponse> => {
  return apiGet<LaunchExperimentResponse>(`/experiments/launch/${encodeURIComponent(launchId)}`);
};
