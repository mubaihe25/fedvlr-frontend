import {mockConfigurationData} from '../mock/configuration';
import {getModuleLabel} from '../lib/experimentLabels';
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
  defenseOptions: SelectOption[];
  privacyMetricOptions: SelectOption[];
  requiredFields: string[];
  schemaVersion?: string;
  maxEnabledAttacks: number;
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

const compact = (values?: string[]) => Array.from(new Set((values ?? []).filter(Boolean).filter((value) => value !== 'none')));

export const getSelectedAttacks = (config: TrainConfig) =>
  compact(config.enabledAttacks ?? (config.attackEnabled ? [config.attackType] : []));

export const getSelectedDefenses = (config: TrainConfig) =>
  compact(config.enabledDefenses ?? (config.defenseEnabled ? [config.defenseType] : []));

export const getSelectedPrivacyMetrics = (config: TrainConfig) => compact(config.enabledPrivacyMetrics);

const mapModuleToOption = (module: CapabilityModule): SelectOption => {
  const display = getModuleLabel(module.name);
  return {
    value: module.name,
    label: display.title,
    description: [display.code, module.notes ?? display.description].filter(Boolean).join(' · '),
  };
};

const mapCapabilitiesToSource = (
  capabilitiesResponse: CapabilitiesResponse,
  schemaResponse: ExperimentConfigSchemaResponse,
): ExperimentConfigurationSource => {
  const capabilities = capabilitiesResponse.data;
  const schema = schemaResponse.data;
  const supportedDatasets = Array.from(
    new Set(capabilities.models.flatMap((model) => model.supported_datasets?.length ? model.supported_datasets : [model.recommended_dataset])),
  ).filter(Boolean);
  const policy = schema.multi_module_policy;

  return {
    dataSource: 'api',
    dataSourceLabel: '真实能力矩阵',
    datasetOptions: supportedDatasets.map((dataset) => ({value: dataset, label: dataset})),
    modelOptions: capabilities.models.map((model) => ({
      value: model.name,
      label: model.name,
      description: `${model.family} / ${model.compatibility_status ?? 'unknown'}${model.notes ? `：${model.notes}` : ''}`,
      disabled: model.compatibility_status === 'blocked',
    })),
    attackOptions: capabilities.attacks.map(mapModuleToOption),
    defenseOptions: capabilities.defenses.map(mapModuleToOption),
    privacyMetricOptions: capabilities.privacy_metrics.map(mapModuleToOption),
    requiredFields: schemaResponse.required_fields,
    schemaVersion: schema.version,
    maxEnabledAttacks: policy?.max_enabled_attacks ?? capabilities.max_enabled_attacks ?? 2,
    maxEnabledDefenses: policy?.max_enabled_defenses ?? capabilities.max_enabled_defenses ?? 2,
    maxEnabledPrivacyMetrics: policy?.max_enabled_privacy_metrics ?? capabilities.max_enabled_privacy_metrics ?? 3,
    executionOrder: policy?.execution_order ?? capabilities.execution_order?.join(' -> ') ?? 'enabled_attacks -> enabled_defenses -> enabled_privacy_metrics',
    capabilities,
    schema,
  };
};

export const createFallbackExperimentConfigurationSource = (fallbackReason?: string): ExperimentConfigurationSource => ({
  dataSource: 'mock',
  dataSourceLabel: 'Mock 兜底配置',
  fallbackReason,
  datasetOptions: mockConfigurationData.datasetOptions,
  modelOptions: mockConfigurationData.modelOptions,
  attackOptions: mockConfigurationData.attackOptions.filter((option) => option.value !== 'none'),
  defenseOptions: mockConfigurationData.defenseOptions.filter((option) => option.value !== 'none'),
  privacyMetricOptions: [
    {
      value: 'client_update_norm',
      label: getModuleLabel('client_update_norm').title,
      description: 'client_update_norm · Mock 兜底观测模块',
    },
  ],
  requiredFields: ['model', 'dataset', 'scenario'],
  maxEnabledAttacks: 2,
  maxEnabledDefenses: 2,
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
    return createFallbackExperimentConfigurationSource(error instanceof Error ? error.message : '能力矩阵或实验 schema 加载失败。');
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
        sameList(combination.attacks, attacks) &&
        sameList(combination.defenses, defenses) &&
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

export const buildUnifiedExperimentConfig = (
  config: TrainConfig,
  source?: ExperimentConfigurationSource,
): UnifiedExperimentConfig => {
  const scenario = config.scenario ?? modeToScenario(config.mode);
  const attacks = getSelectedAttacks(config);
  const defenses = getSelectedDefenses(config);
  const privacyMetrics = getSelectedPrivacyMetrics(config);
  const capabilities = source?.capabilities;
  const maliciousClientConfig = config.maliciousClientConfig ?? {
    enabled: Boolean(attacks.length),
    mode: attacks.length ? 'ratio' : 'none',
    ratio: attacks.length ? config.poisoningRatio : 0,
    clientIds: [],
  };

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
      enabled: Boolean(maliciousClientConfig.enabled && attacks.length),
      mode: maliciousClientConfig.enabled && attacks.length ? maliciousClientConfig.mode : 'none',
      ratio: maliciousClientConfig.enabled && attacks.length ? maliciousClientConfig.ratio : 0,
      client_ids: maliciousClientConfig.clientIds,
    },
    training_params: {
      epochs: config.totalRounds,
      local_epochs: config.advanced.localEpochs,
      clients_sample_ratio: config.clientSamplingRate,
      eval_step: 1,
      use_gpu: false,
      collect_round_metrics: true,
      lr: config.learningRate,
      l2_reg: config.advanced.weightDecay,
    },
    attack_params: mergeModuleParams(attacks, capabilities?.attacks, config.attackParams),
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
