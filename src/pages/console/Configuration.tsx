import React, {useEffect, useMemo, useState} from 'react';
import {ChevronDown, Cpu, Info, Settings, ShieldAlert} from 'lucide-react';
import {mockConfigurationData} from '../../mock/configuration';
import type {AsyncState} from '../../types/common';
import type {CapabilityModule, LaunchExperimentOptions, TrainConfig} from '../../types/train';
import {
  buildAttackTaxonomyMap,
  formatModuleChain,
  getFamilyLabel,
  getModuleLabel,
  getParameterLabel,
  getParameterValueLabel,
  getScenarioLabel,
  getStatusLabel,
  hasParameterValueLabel,
  splitAttackModules,
} from '../../lib/experimentLabels';
import {cn} from '../../lib/utils';
import type {StartTrainResponse} from '../../services/train';
import {
  createFallbackExperimentConfigurationSource,
  findValidatedCombination,
  getExperimentConfigurationSource,
  getSelectedAttacks,
  getSelectedDefenses,
  getSelectedPrivacyMetrics,
  modeToScenario,
  UNIFIED_POISONING_ATTACK,
  UNIFIED_ROBUST_DEFENSE,
  type ExperimentConfigurationSource,
} from '../../services/experiment';

interface ConfigurationProps {
  draftConfig: TrainConfig;
  onDraftConfigChange: (config: TrainConfig) => void;
  onStartTrain: (
    config: TrainConfig,
    options?: LaunchExperimentOptions,
    source?: ExperimentConfigurationSource,
  ) => Promise<StartTrainResponse>;
}

const TOTAL_ROUNDS_MIN = 1;
const TOTAL_ROUNDS_MAX = 120;

const optimizerOptions: Array<{value: TrainConfig['advanced']['optimizer']; label: string; backendValue: 'adam' | 'sgd'}> = [
  {value: 'adam', label: 'Adam', backendValue: 'adam'},
  {value: 'adamw', label: 'AdamW', backendValue: 'adam'},
  {value: 'sgd', label: 'SGD', backendValue: 'sgd'},
];

const clampNumber = (value: number, min: number, max: number) => {
  if (!Number.isFinite(value)) {
    return min;
  }
  return Math.min(max, Math.max(min, value));
};

const sanitizeConfig = (config: TrainConfig): TrainConfig => {
  const next = structuredClone(config);
  next.totalRounds = clampNumber(Math.round(Number(next.totalRounds)), TOTAL_ROUNDS_MIN, TOTAL_ROUNDS_MAX);
  next.advanced = {
    ...next.advanced,
    useGpu: next.advanced.useGpu ?? true,
  };
  return next;
};

const cloneConfig = (config: TrainConfig) => sanitizeConfig(config);

type ModuleParamField = 'attackParams' | 'defenseParams' | 'privacyParams';

const moduleParamInputType = (schemaType: string | undefined, defaultValue: unknown) => {
  const normalizedType = schemaType?.toLowerCase() ?? '';
  if (normalizedType.includes('bool') || typeof defaultValue === 'boolean') {
    return 'boolean';
  }
  if (
    normalizedType.includes('float') ||
    normalizedType.includes('number') ||
    normalizedType.includes('integer') ||
    typeof defaultValue === 'number'
  ) {
    return 'number';
  }
  return 'string';
};

const parameterValueOptions: Record<string, string[]> = {
  robust_defense_mode: [
    'clip',
    'filter',
    'trimmed_mean',
    'clip_then_trimmed_mean',
    'filter_then_trimmed_mean',
    'clip_then_filter_then_trimmed_mean',
  ],
  robust_filter_rule: ['update_norm > mean + filter_std_factor * std'],
  robust_trim_rule: ['coordinate_trimmed_mean'],
};

const deriveModeFromModules = (attacks: string[], defenses: string[]): TrainConfig['mode'] => {
  if (attacks.length && defenses.length) {
    return 'comparison';
  }

  if (attacks.length) {
    return 'attack';
  }

  if (defenses.length) {
    return 'defense';
  }

  return 'baseline';
};

const deriveScenarioFromGroups = (
  poisoningAttacks: string[],
  privacyProbes: string[],
  defenses: string[],
): TrainConfig['scenario'] => {
  if (poisoningAttacks.length && defenses.length) {
    return 'attack_and_defense';
  }
  if (poisoningAttacks.length) {
    return 'attack_only';
  }
  if (defenses.length) {
    return 'defense_only';
  }
  if (privacyProbes.length) {
    return 'privacy_observation';
  }
  return 'baseline';
};

const createResetConfig = (): TrainConfig => ({
  ...cloneConfig(mockConfigurationData.defaultConfig),
  mode: 'baseline',
  attackEnabled: false,
  attackType: 'none',
  enabledAttacks: [],
  defenseEnabled: false,
  defenseType: 'none',
  enabledDefenses: [],
  enabledPrivacyMetrics: [],
  maliciousClientConfig: {
    enabled: false,
    mode: 'none',
    ratio: 0,
    clientIds: [],
  },
});

export const Configuration: React.FC<ConfigurationProps> = ({
  draftConfig,
  onDraftConfigChange,
  onStartTrain,
}) => {
  const [formConfig, setFormConfig] = useState<TrainConfig>(() => cloneConfig(draftConfig));
  const [submitState, setSubmitState] = useState<AsyncState>('idle');
  const [sourceState, setSourceState] = useState<AsyncState>('loading');
  const [configurationSource, setConfigurationSource] = useState<ExperimentConfigurationSource>(() =>
    createFallbackExperimentConfigurationSource(),
  );
  const [validateOnly, setValidateOnly] = useState(true);
  const [strictValidation, setStrictValidation] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    setFormConfig(cloneConfig(draftConfig));
  }, [draftConfig]);

  useEffect(() => {
    let cancelled = false;
    const loadConfigurationSource = async () => {
      setSourceState('loading');
      const nextSource = await getExperimentConfigurationSource();
      if (cancelled) {
        return;
      }

      setConfigurationSource(nextSource);
      setSourceState(nextSource.dataSource === 'api' ? 'success' : 'error');
      setFormConfig((current) => {
        const dataset = nextSource.datasetOptions.some((option) => option.value === current.dataset)
          ? current.dataset
          : (nextSource.datasetOptions[0]?.value ?? current.dataset);
        const model = nextSource.modelOptions.some((option) => option.value === current.model)
          ? current.model
          : (nextSource.capabilities?.models.find((modelItem) => modelItem.compatibility_status === 'showcase_ready')?.name ??
            nextSource.modelOptions.find((option) => !option.disabled)?.value ??
            nextSource.modelOptions[0]?.value ??
            current.model);
        const next = sanitizeConfig({...current, dataset, model, scenario: current.scenario ?? modeToScenario(current.mode)});
        if (dataset !== current.dataset || model !== current.model || next.scenario !== current.scenario) {
          onDraftConfigChange(next);
        }
        return next;
      });
    };

    void loadConfigurationSource();

    return () => {
      cancelled = true;
    };
  }, []);

  const selectedAttacks = useMemo(() => getSelectedAttacks(formConfig), [formConfig]);
  const selectedDefenses = useMemo(() => getSelectedDefenses(formConfig), [formConfig]);
  const selectedPrivacyMetrics = useMemo(() => getSelectedPrivacyMetrics(formConfig), [formConfig]);
  const attackTaxonomy = useMemo(
    () => buildAttackTaxonomyMap(configurationSource.capabilities?.attacks),
    [configurationSource.capabilities?.attacks],
  );
  const attackSemanticGroups = useMemo(
    () => splitAttackModules(selectedAttacks, attackTaxonomy),
    [attackTaxonomy, selectedAttacks],
  );
  const selectedPoisoningAttacks = attackSemanticGroups.poisoning;
  const selectedPrivacyProbes = attackSemanticGroups.privacyProbe;
  const poisoningParams = formConfig.attackParams?.[UNIFIED_POISONING_ATTACK] ?? {};
  const poisoningScaleRatio = Number(poisoningParams.poisoning_scale_ratio ?? 0.34);
  const poisoningSignFlipRatio = Number(poisoningParams.poisoning_sign_flip_ratio ?? 0.33);
  const poisoningModelReplacementRatio = Number(poisoningParams.poisoning_model_replacement_ratio ?? 0.33);
  const poisoningStrategyRatioTotal = [poisoningScaleRatio, poisoningSignFlipRatio, poisoningModelReplacementRatio].reduce(
    (sum, value) => sum + (Number.isFinite(value) ? value : 0),
    0,
  );
  const validatedCombination = useMemo(
    () => findValidatedCombination(configurationSource, formConfig),
    [configurationSource, formConfig],
  );
  const isValidatedCombination =
    configurationSource.dataSource === 'api' && Boolean(validatedCombination);
  const scenario = formConfig.scenario ?? modeToScenario(formConfig.mode);
  const currentModel = configurationSource.capabilities?.models.find((model) => model.name === formConfig.model);
  const currentModelOverrides = currentModel?.recommended_training_overrides;
  const realTrainingParams = [
    {key: 'epochs', value: formConfig.totalRounds},
    {key: 'local_epochs', value: formConfig.advanced.localEpochs},
    {key: 'clients_sample_ratio', value: formConfig.clientSamplingRate},
    {key: 'lr', value: formConfig.learningRate},
    {key: 'l2_reg', value: formConfig.advanced.weightDecay},
    {key: 'optimizer', value: getParameterValueLabel(formConfig.advanced.optimizer)},
    {key: 'use_gpu', value: getParameterValueLabel(String(formConfig.advanced.useGpu ?? true))},
  ];

  const updateConfig = (updater: (current: TrainConfig) => TrainConfig) => {
    setFormConfig((current) => {
      const next = sanitizeConfig(updater(current));
      onDraftConfigChange(next);
      return next;
    });
  };

  const updateModuleParam = (
    field: ModuleParamField,
    moduleName: string,
    paramName: string,
    value: string | number | boolean,
  ) => {
    updateConfig((current) => ({
      ...current,
      [field]: {
        ...(current[field] ?? {}),
        [moduleName]: {
          ...(current[field]?.[moduleName] ?? {}),
          [paramName]: value,
        },
      },
    }));
  };

  const createDefaultConfigFromSource = (): TrainConfig => {
    const dataset = configurationSource.datasetOptions[0]?.value ?? mockConfigurationData.defaultConfig.dataset;
    const model =
      configurationSource.capabilities?.models.find((modelItem) => modelItem.compatibility_status === 'showcase_ready')?.name ??
      configurationSource.modelOptions.find((option) => !option.disabled)?.value ??
      configurationSource.modelOptions[0]?.value ??
      mockConfigurationData.defaultConfig.model;
    const preferredCombination =
      configurationSource.capabilities?.validated_combinations.find(
        (combination) => combination.name === 'attack_and_robust_defense' && combination.validated_models.includes(model),
      ) ?? configurationSource.capabilities?.validated_combinations.find(
        (combination) => combination.name === 'attack_and_robust_defense_trimmed_mean' && combination.validated_models.includes(model),
      ) ?? configurationSource.capabilities?.validated_combinations.find(
        (combination) => combination.name === 'attack_and_robust_defense_clip_then_trimmed_mean' && combination.validated_models.includes(model),
      ) ?? configurationSource.capabilities?.validated_combinations.find((combination) => combination.validated_models.includes(model));
    const rawEnabledAttacks = preferredCombination?.attacks ?? [UNIFIED_POISONING_ATTACK];
    const enabledAttacks = getSelectedAttacks({
      ...mockConfigurationData.defaultConfig,
      attackEnabled: Boolean(rawEnabledAttacks.length),
      attackType: (rawEnabledAttacks[0] ?? 'none') as TrainConfig['attackType'],
      enabledAttacks: rawEnabledAttacks,
    });
    const enabledDefenses = getSelectedDefenses({
      ...mockConfigurationData.defaultConfig,
      defenseEnabled: Boolean(preferredCombination?.defenses?.length),
      defenseType: ((preferredCombination?.defenses[0] ?? UNIFIED_ROBUST_DEFENSE) as TrainConfig['defenseType']),
      enabledDefenses: preferredCombination?.defenses ?? [UNIFIED_ROBUST_DEFENSE],
    });
    const enabledPrivacyMetrics = preferredCombination?.privacy_metrics ?? [];
    const mode = deriveModeFromModules(enabledAttacks, enabledDefenses);
    const attackGroups = splitAttackModules(enabledAttacks, attackTaxonomy);
    const hasPoisoningAttack = Boolean(attackGroups.poisoning.length);

    return {
      ...cloneConfig(mockConfigurationData.defaultConfig),
      dataset,
      model,
      mode,
      scenario: preferredCombination?.scenario ?? deriveScenarioFromGroups(attackGroups.poisoning, attackGroups.privacyProbe, enabledDefenses),
      attackEnabled: Boolean(enabledAttacks.length),
      attackType: (enabledAttacks[0] ?? 'none') as TrainConfig['attackType'],
      enabledAttacks,
      defenseEnabled: Boolean(enabledDefenses.length),
      defenseType: (enabledDefenses[0] ?? 'none') as TrainConfig['defenseType'],
      enabledDefenses,
      enabledPrivacyMetrics,
      maliciousClientConfig: {
        enabled: hasPoisoningAttack,
        mode: hasPoisoningAttack ? 'ratio' : 'none',
        ratio: hasPoisoningAttack ? mockConfigurationData.defaultConfig.poisoningRatio : 0,
        clientIds: [],
      },
    };
  };

  const handleModeChange = (mode: TrainConfig['mode']) => {
    updateConfig((current) => {
      if (mode === 'baseline') {
        return {
          ...current,
          mode,
          scenario: modeToScenario(mode),
          attackEnabled: false,
          attackType: 'none',
          enabledAttacks: [],
          defenseEnabled: false,
          defenseType: 'none',
          enabledDefenses: [],
          maliciousClientConfig: {
            ...(current.maliciousClientConfig ?? {clientIds: []}),
            enabled: false,
            mode: 'none',
            ratio: 0,
            clientIds: current.maliciousClientConfig?.clientIds ?? [],
          },
        };
      }

      if (mode === 'attack') {
        const nextAttack =
          getSelectedAttacks(current).find((attack) => configurationSource.poisoningAttackOptions.some((option) => option.value === attack)) ??
          configurationSource.poisoningAttackOptions[0]?.value ??
          UNIFIED_POISONING_ATTACK;
        return {
          ...current,
          mode,
          scenario: modeToScenario(mode),
          attackEnabled: true,
          attackType: nextAttack as TrainConfig['attackType'],
          enabledAttacks: [nextAttack],
          defenseEnabled: false,
          defenseType: 'none',
          enabledDefenses: [],
          maliciousClientConfig: {
            ...(current.maliciousClientConfig ?? {clientIds: []}),
            enabled: true,
            mode: 'ratio',
            ratio: current.poisoningRatio,
            clientIds: current.maliciousClientConfig?.clientIds ?? [],
          },
        };
      }

      if (mode === 'defense') {
        const nextDefense = getSelectedDefenses(current)[0] ?? configurationSource.defenseOptions[0]?.value ?? UNIFIED_ROBUST_DEFENSE;
        return {
          ...current,
          mode,
          scenario: modeToScenario(mode),
          attackEnabled: false,
          attackType: 'none',
          enabledAttacks: [],
          defenseEnabled: true,
          defenseType: nextDefense as TrainConfig['defenseType'],
          enabledDefenses: [nextDefense],
          maliciousClientConfig: {
            ...(current.maliciousClientConfig ?? {clientIds: []}),
            enabled: false,
            mode: 'none',
            ratio: 0,
            clientIds: current.maliciousClientConfig?.clientIds ?? [],
          },
        };
      }

      const nextAttack =
        getSelectedAttacks(current).find((attack) => configurationSource.poisoningAttackOptions.some((option) => option.value === attack)) ??
        configurationSource.poisoningAttackOptions[0]?.value ??
        UNIFIED_POISONING_ATTACK;
      const nextDefense = getSelectedDefenses(current)[0] ?? configurationSource.defenseOptions[0]?.value ?? UNIFIED_ROBUST_DEFENSE;
      return {
        ...current,
        mode,
        scenario: modeToScenario(mode),
        attackEnabled: true,
        attackType: nextAttack as TrainConfig['attackType'],
        enabledAttacks: [nextAttack],
        defenseEnabled: true,
        defenseType: nextDefense as TrainConfig['defenseType'],
        enabledDefenses: [nextDefense],
        maliciousClientConfig: {
          ...(current.maliciousClientConfig ?? {clientIds: []}),
          enabled: true,
          mode: 'ratio',
          ratio: current.poisoningRatio,
          clientIds: current.maliciousClientConfig?.clientIds ?? [],
        },
      };
    });
  };

  const toggleAttack = (attackName: string) => {
    updateConfig((current) => {
      const currentAttacks = getSelectedAttacks(current);
      const nextAttacks = currentAttacks.includes(attackName)
        ? currentAttacks.filter((name) => name !== attackName)
        : [...currentAttacks, attackName];
      const nextGroups = splitAttackModules(nextAttacks, attackTaxonomy);
      if (nextGroups.poisoning.length > configurationSource.maxEnabledPoisoningAttacks) {
        setMessage('当前最多启用 1 个投毒攻击入口。');
        return current;
      }
      if (nextGroups.privacyProbe.length > configurationSource.maxEnabledPrivacyProbes) {
        setMessage('当前最多额外启用 1 个隐私泄露观测。');
        return current;
      }

      const defenses = getSelectedDefenses(current);
      const mode = deriveModeFromModules(nextAttacks, defenses);
      const scenario = deriveScenarioFromGroups(nextGroups.poisoning, nextGroups.privacyProbe, defenses);
      return {
        ...current,
        mode,
        scenario,
        attackEnabled: Boolean(nextAttacks.length),
        attackType: (nextAttacks[0] ?? 'none') as TrainConfig['attackType'],
        enabledAttacks: nextAttacks,
        maliciousClientConfig: {
          ...(current.maliciousClientConfig ?? {clientIds: []}),
          enabled: Boolean(nextGroups.poisoning.length),
          mode: nextGroups.poisoning.length ? 'ratio' : 'none',
          ratio: nextGroups.poisoning.length ? current.poisoningRatio : 0,
          clientIds: current.maliciousClientConfig?.clientIds ?? [],
        },
      };
    });
  };

  const toggleDefense = (defenseName: string) => {
    updateConfig((current) => {
      const attacks = getSelectedAttacks(current);
      const currentDefenses = getSelectedDefenses(current);
      const nextDefenses = currentDefenses.includes(defenseName) ? [] : [UNIFIED_ROBUST_DEFENSE];

      const attackGroups = splitAttackModules(attacks, attackTaxonomy);
      const mode = deriveModeFromModules(attacks, nextDefenses);
      return {
        ...current,
        mode,
        scenario: deriveScenarioFromGroups(attackGroups.poisoning, attackGroups.privacyProbe, nextDefenses),
        defenseEnabled: Boolean(nextDefenses.length),
        defenseType: (nextDefenses[0] ?? 'none') as TrainConfig['defenseType'],
        enabledDefenses: nextDefenses,
      };
    });
  };

  const togglePrivacyMetric = (metricName: string) => {
    updateConfig((current) => {
      const currentMetrics = getSelectedPrivacyMetrics(current);
      const nextMetrics = currentMetrics.includes(metricName)
        ? currentMetrics.filter((name) => name !== metricName)
        : [...currentMetrics, metricName];
      if (nextMetrics.length > configurationSource.maxEnabledPrivacyMetrics) {
        setMessage(`当前最多选择 ${configurationSource.maxEnabledPrivacyMetrics} 个观测模块。`);
        return current;
      }

      return {
        ...current,
        enabledPrivacyMetrics: nextMetrics,
      };
    });
  };

  const handleDefault = () => {
    const next = createDefaultConfigFromSource();
    setFormConfig(next);
    onDraftConfigChange(next);
    setMessage(
      configurationSource.dataSource === 'api'
        ? '已加载真实能力矩阵推荐配置。'
        : '已加载 mock 推荐默认配置。',
    );
  };

  const handleReset = () => {
    const next = {
      ...createResetConfig(),
      dataset: configurationSource.datasetOptions[0]?.value ?? mockConfigurationData.defaultConfig.dataset,
      model:
        configurationSource.capabilities?.models.find((model) => model.compatibility_status === 'showcase_ready')?.name ??
        configurationSource.modelOptions.find((option) => !option.disabled)?.value ??
        configurationSource.modelOptions[0]?.value ??
        mockConfigurationData.defaultConfig.model,
    };
    setFormConfig(next);
    onDraftConfigChange(next);
    setMessage('已重置为基线实验配置。');
  };

  const handleStart = async () => {
    try {
      setSubmitState('loading');
      const response = await onStartTrain(formConfig, {validateOnly, strictValidation}, configurationSource);
      setSubmitState(response.status === 'failed' ? 'error' : 'success');
      setMessage(response.message);
    } catch (error) {
      setSubmitState('error');
      setMessage(error instanceof Error ? error.message : '训练任务创建失败。');
    }
  };

  const renderModuleParameterCard = (
    moduleName: string,
    registry: CapabilityModule[] | undefined,
    field: ModuleParamField,
    tone: 'error' | 'tertiary' | 'primary',
  ) => {
    const moduleMeta = registry?.find((module) => module.name === moduleName);
    const entries = Object.entries(moduleMeta?.config_schema ?? {});
    const moduleParams = formConfig[field]?.[moduleName] ?? {};
    const moduleLabel = getModuleLabel(moduleName);
    const toneClass =
      tone === 'error'
        ? 'border-error/20 bg-error/10 text-error'
        : tone === 'tertiary'
          ? 'border-tertiary/20 bg-tertiary/10 text-tertiary'
          : 'border-primary/20 bg-primary/10 text-primary';

    return (
      <div key={`${field}-${moduleName}`} className="rounded-xl border border-outline-variant/10 bg-surface-container-low p-4">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-bold text-on-surface">{moduleLabel.title}</p>
            {moduleLabel.description || moduleMeta?.notes ? (
              <p className="mt-2 text-xs text-on-surface-variant">{moduleLabel.description ?? moduleMeta?.notes}</p>
            ) : null}
            {moduleName === UNIFIED_POISONING_ATTACK ? (
              <p className="mt-2 text-xs text-on-surface-variant">
                恶意客户端总量由全局“恶意客户端比例”决定；这里仅配置这批恶意客户端在三种非定向投毒子策略之间的分配比例。
              </p>
            ) : null}
            {moduleName === UNIFIED_ROBUST_DEFENSE ? (
              <p className="mt-2 text-xs text-on-surface-variant">
                当前只配置统一鲁棒防御入口；具体采用裁剪、过滤、鲁棒聚合或组合模式，由下方“鲁棒防御模式”决定。
              </p>
            ) : null}
          </div>
          <span className={cn('shrink-0 rounded px-2 py-0.5 text-[10px] font-bold', toneClass)}>已选择</span>
        </div>
        {entries.length ? (
          <>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {entries.map(([paramName, schemaType]) => {
              const defaultValue = moduleMeta?.default_values?.[paramName];
              const value = moduleParams[paramName] ?? defaultValue ?? '';
              const inputType = moduleParamInputType(schemaType, defaultValue);
              const paramLabel = getParameterLabel(paramName);
              const inputTypeLabel =
                inputType === 'number' ? '数字' : inputType === 'boolean' ? '布尔' : '文本';

              if (inputType === 'boolean') {
                return (
                  <button
                    key={paramName}
                    onClick={() => updateModuleParam(field, moduleName, paramName, !Boolean(value))}
                    className="rounded-lg bg-surface-container-highest px-4 py-3 text-left text-xs font-semibold text-on-surface-variant transition hover:text-on-surface"
                  >
                    <span className="block text-on-surface">{paramLabel.title}</span>
                    <span className="mt-1 block text-[10px] text-on-surface-variant">
                      当前值：{Boolean(value) ? '开启' : '关闭'}
                    </span>
                  </button>
                );
              }

              const stringOptions = parameterValueOptions[paramName] ?? [];
              if (inputType === 'string' && (stringOptions.length || (typeof value === 'string' && hasParameterValueLabel(value)))) {
                const options = stringOptions.length ? stringOptions : [String(value)];
                return (
                  <label key={paramName} className="space-y-1">
                    <span className="block text-xs font-bold text-on-surface">{paramLabel.title}</span>
                    <select
                      value={value}
                      onChange={(event) => updateModuleParam(field, moduleName, paramName, event.target.value)}
                      className="w-full rounded-lg border-none bg-surface-container-highest px-4 py-2 text-primary focus:ring-1 focus:ring-primary"
                    >
                      {options.map((optionValue) => (
                        <option key={optionValue} value={optionValue}>
                          {getParameterValueLabel(optionValue)}
                        </option>
                      ))}
                    </select>
                    <span className="block text-[10px] text-on-surface-variant">
                      类型：{inputTypeLabel}，默认值：{getParameterValueLabel(String(defaultValue ?? '未提供'))}
                    </span>
                  </label>
                );
              }

              return (
                <label key={paramName} className="space-y-1">
                  <span className="block text-xs font-bold text-on-surface">
                    {paramLabel.title}
                  </span>
                  <input
                    type={inputType === 'number' ? 'number' : 'text'}
                    step={schemaType.toLowerCase().includes('integer') ? 1 : inputType === 'number' ? 0.01 : undefined}
                    value={String(value)}
                    onChange={(event) =>
                      updateModuleParam(
                        field,
                        moduleName,
                        paramName,
                        inputType === 'number' ? Number(event.target.value) : event.target.value,
                      )
                    }
                    className="w-full rounded-lg border-none bg-surface-container-highest px-4 py-2 font-mono text-primary focus:ring-1 focus:ring-primary"
                  />
                  <span className="block text-[10px] text-on-surface-variant">
                    类型：{inputTypeLabel}，默认值：{getParameterValueLabel(String(defaultValue ?? '未提供'))}
                  </span>
                </label>
              );
            })}
          </div>
          {moduleName === UNIFIED_POISONING_ATTACK ? (
            <div
              className={cn(
                'mt-3 rounded-lg px-3 py-2 text-xs',
                Math.abs(poisoningStrategyRatioTotal - 1) <= 0.05
                  ? 'bg-tertiary/10 text-tertiary'
                  : 'bg-error/10 text-error',
              )}
            >
              当前三种子策略占比合计 {(poisoningStrategyRatioTotal * 100).toFixed(0)}%。建议接近 100%，比例只决定恶意客户端内部分流，不改变全局恶意客户端总量。
            </div>
          ) : null}
          </>
        ) : (
          <p className="text-xs text-on-surface-variant">该模块当前无显式可配置参数，会按后端默认行为执行。</p>
        )}
      </div>
    );
  };

  const renderModuleOption = (
    option: {value: string; label: string; description?: string; disabled?: boolean},
    isActive: boolean,
    onClick: () => void,
    tone: 'error' | 'tertiary' | 'primary',
  ) => {
    const moduleLabel = getModuleLabel(option.value);
    const activeClass =
      tone === 'error'
        ? 'border border-error/20 bg-error/10 text-error'
        : tone === 'tertiary'
          ? 'border border-tertiary/20 bg-tertiary/10 text-tertiary'
          : 'border border-primary/20 bg-primary/10 text-primary';

    return (
      <button
        key={option.value}
        title={option.description}
        onClick={onClick}
        disabled={option.disabled}
        className={cn(
          'rounded-lg px-3 py-2 text-left text-[11px] font-bold transition-all disabled:cursor-not-allowed disabled:opacity-45',
          isActive
            ? activeClass
            : 'bg-surface-container-highest text-on-surface-variant hover:text-on-surface',
        )}
      >
        <span className="block">{moduleLabel.title}</span>
      </button>
    );
  };

  const renderModuleSelector = () => (
    <div className="overflow-hidden rounded-xl glass-panel">
      <div className="border-b border-error/20 bg-error/10 p-4">
        <div className="flex items-center gap-2">
          <ShieldAlert className="h-5 w-5 text-error" />
          <div>
            <h4 className="font-bold text-error">模块链选择</h4>
            <p className="mt-1 text-xs text-on-surface-variant">
              按投毒攻击、隐私泄露观测、鲁棒防御、观测模块的语义提交；当前最多启用 1 个投毒攻击，可额外启用 1 个隐私泄露观测。
            </p>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-5 p-6 xl:grid-cols-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">投毒攻击</label>
            <span className="text-[10px] text-on-surface-variant">
              {selectedPoisoningAttacks.length}/{configurationSource.maxEnabledPoisoningAttacks}
            </span>
          </div>
          <p className="text-[11px] leading-relaxed text-on-surface-variant">
            当前为统一的非定向投毒入口；后端会在恶意客户端中分流执行更新缩放、符号翻转和模型替换三种子策略。
          </p>
          <div className="flex flex-wrap gap-2">
            {configurationSource.poisoningAttackOptions.map((option) =>
              renderModuleOption(option, selectedAttacks.includes(option.value), () => toggleAttack(option.value), 'error'),
            )}
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">隐私泄露观测</label>
            <span className="text-[10px] text-on-surface-variant">
              {selectedPrivacyProbes.length}/{configurationSource.maxEnabledPrivacyProbes}
            </span>
          </div>
          <p className="text-[11px] leading-relaxed text-on-surface-variant">只读探针，用于分析联邦更新中的隐私风险，不直接改变聚合输入。</p>
          <div className="flex flex-wrap gap-2">
            {configurationSource.privacyProbeOptions.map((option) =>
              renderModuleOption(option, selectedAttacks.includes(option.value), () => toggleAttack(option.value), 'error'),
            )}
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">鲁棒防御</label>
            <span className="text-[10px] text-on-surface-variant">统一入口</span>
          </div>
          <p className="text-[11px] leading-relaxed text-on-surface-variant">
            当前推荐只启用一个“鲁棒防御”入口；内部支持裁剪型、过滤型、鲁棒聚合型以及组合模式。
          </p>
          <div className="flex flex-wrap gap-2">
            {configurationSource.defenseOptions.map((option) =>
              renderModuleOption(option, selectedDefenses.includes(option.value), () => toggleDefense(option.value), 'tertiary'),
            )}
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">观测模块</label>
            <span className="text-[10px] text-on-surface-variant">
              {selectedPrivacyMetrics.length}/{configurationSource.maxEnabledPrivacyMetrics}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {configurationSource.privacyMetricOptions.map((option) =>
              renderModuleOption(option, selectedPrivacyMetrics.includes(option.value), () => togglePrivacyMetric(option.value), 'primary'),
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderChainSummary = (values: string[]) => (
    <span className="max-w-[65%] text-right text-on-surface">
      <span className="block">{formatModuleChain(values)}</span>
    </span>
  );

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div>
          <span className="mb-2 block text-xs font-bold tracking-[0.2em] text-primary">实验环境配置</span>
          <h3 className="text-4xl font-bold tracking-tight text-on-background">训练实验配置</h3>
          <p className="mt-3 text-sm text-on-surface-variant">
            优先读取真实能力矩阵与统一配置结构，支持多攻击、多防御与观测模块组合配置。
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] font-semibold">
            <span
              className={cn(
                'rounded-full px-3 py-1',
                sourceState === 'loading'
                  ? 'bg-surface-container-high text-on-surface-variant'
                  : configurationSource.dataSource === 'api'
                    ? 'bg-tertiary/15 text-tertiary'
                    : 'bg-error/10 text-error',
              )}
            >
              {sourceState === 'loading'
                ? '正在加载能力矩阵'
                : configurationSource.dataSource === 'api'
                  ? '真实能力矩阵'
                  : 'Mock 兜底'}
            </span>
            <span className="rounded-full bg-surface-container-high px-3 py-1 text-on-surface-variant">
              配置版本：{configurationSource.schemaVersion ?? '本地'}
            </span>
            {configurationSource.fallbackReason ? (
              <span className="rounded-full bg-error/10 px-3 py-1 text-error">
                已回退：{configurationSource.fallbackReason}
              </span>
            ) : null}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleDefault}
            className="rounded-lg bg-surface-container-high px-5 py-2.5 text-sm font-semibold text-on-surface-variant transition-all hover:bg-surface-container-highest hover:text-on-surface"
          >
            加载默认
          </button>
          <button
            onClick={handleReset}
            className="rounded-lg bg-surface-container-high px-5 py-2.5 text-sm font-semibold text-on-surface-variant transition-all hover:bg-surface-container-highest hover:text-on-surface"
          >
            重置配置
          </button>
          <button
            onClick={handleStart}
            disabled={submitState === 'loading'}
            className="rounded-lg bg-gradient-to-br from-primary to-secondary px-8 py-2.5 text-sm font-bold text-surface shadow-[0_0_20px_rgba(129,236,255,0.3)] transition-all hover:shadow-[0_0_30px_rgba(129,236,255,0.5)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {submitState === 'loading' ? '正在提交...' : validateOnly ? '校验配置' : '开始训练'}
          </button>
        </div>
      </div>

      {message ? (
        <div
          className={cn(
            'rounded-xl border px-4 py-3 text-sm',
            submitState === 'error'
              ? 'border-error/30 bg-error/10 text-error'
              : 'border-primary/20 bg-primary/10 text-on-surface',
          )}
        >
          {message}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-8">
          <div className="glass-panel rounded-xl p-6 space-y-6">
            <div className="mb-4 flex items-center gap-2">
              <Settings className="h-5 w-5 text-primary" />
              <h4 className="text-lg font-bold">基础运行配置</h4>
            </div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant">数据集</label>
                <div className="relative">
                  <select
                    value={formConfig.dataset}
                    onChange={(event) => updateConfig((current) => ({...current, dataset: event.target.value}))}
                    className="w-full appearance-none rounded-lg border-none bg-surface-container-highest px-4 py-3 text-on-surface transition-all focus:ring-1 focus:ring-primary"
                  >
                    {configurationSource.datasetOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant">模型 / 算法</label>
                <div className="relative">
                  <select
                    value={formConfig.model}
                    onChange={(event) => updateConfig((current) => ({...current, model: event.target.value}))}
                    className="w-full appearance-none rounded-lg border-none bg-surface-container-highest px-4 py-3 text-on-surface transition-all focus:ring-1 focus:ring-primary"
                  >
                    {configurationSource.modelOptions.map((option) => (
                      <option key={option.value} value={option.value} disabled={option.disabled}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" />
                </div>
              </div>

              <div className="space-y-3 md:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant">实验模式</label>
                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                  {mockConfigurationData.modeOptions.map((option) => {
                    const isActive = formConfig.mode === option.value;
                    return (
                      <button
                        key={option.value}
                        onClick={() => handleModeChange(option.value)}
                        className={cn(
                          'rounded-lg border px-4 py-3 text-sm font-medium transition-all',
                          isActive
                            ? 'border-primary/40 bg-surface-container-highest text-primary shadow-[inset_0_0_10px_rgba(129,236,255,0.1)]'
                            : 'border-transparent bg-surface-container-highest text-on-surface-variant hover:border-primary/30 hover:text-on-surface',
                        )}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {renderModuleSelector()}

          <div className="glass-panel rounded-xl p-6">
            <div className="mb-6 flex items-center gap-2">
              <Cpu className="h-5 w-5 text-tertiary" />
              <div>
                <h4 className="text-lg font-bold">训练参数</h4>
                <p className="text-xs text-on-surface-variant">这些字段会作为真实训练参数随实验配置提交。</p>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              <div className="rounded-xl border border-outline-variant/10 bg-surface-container-low p-4">
                <div className="flex items-end justify-between">
                  <label className="text-xs font-bold text-on-surface-variant">
                    {getParameterLabel('epochs').title}
                  </label>
                  <span className="font-mono text-sm text-primary">{formConfig.totalRounds}</span>
                </div>
                <input
                  type="number"
                  min={TOTAL_ROUNDS_MIN}
                  max={TOTAL_ROUNDS_MAX}
                  value={formConfig.totalRounds}
                  onChange={(event) =>
                    updateConfig((current) => ({...current, totalRounds: Number(event.target.value)}))
                  }
                  className="mt-3 w-full rounded-lg border-none bg-surface-container-highest px-4 py-2 font-mono text-primary focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="rounded-xl border border-outline-variant/10 bg-surface-container-low p-4">
                <label className="text-xs font-bold text-on-surface-variant">
                  {getParameterLabel('local_epochs').title}
                </label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={formConfig.advanced.localEpochs}
                  onChange={(event) =>
                    updateConfig((current) => ({
                      ...current,
                      advanced: {...current.advanced, localEpochs: Number(event.target.value)},
                    }))
                  }
                  className="mt-3 w-full rounded-lg border-none bg-surface-container-highest px-4 py-2 font-mono text-primary focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="rounded-xl border border-outline-variant/10 bg-surface-container-low p-4">
                <div className="flex items-end justify-between">
                  <label className="text-xs font-bold text-on-surface-variant">
                    {getParameterLabel('clients_sample_ratio').title}
                  </label>
                  <span className="font-mono text-sm text-primary">{Math.round(formConfig.clientSamplingRate * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="1"
                  step="0.05"
                  value={formConfig.clientSamplingRate}
                  onChange={(event) =>
                    updateConfig((current) => ({...current, clientSamplingRate: Number(event.target.value)}))
                  }
                  className="mt-4 h-1 w-full cursor-pointer appearance-none rounded-lg bg-surface-container-highest accent-primary"
                />
              </div>

              <div className="rounded-xl border border-outline-variant/10 bg-surface-container-low p-4">
                <label className="text-xs font-bold text-on-surface-variant">
                  {getParameterLabel('lr').title}
                </label>
                <input
                  type="number"
                  min="0.0001"
                  max="0.1"
                  step="0.0001"
                  value={formConfig.learningRate}
                  onChange={(event) =>
                    updateConfig((current) => ({...current, learningRate: Number(event.target.value)}))
                  }
                  className="mt-3 w-full rounded-lg border-none bg-surface-container-highest px-4 py-2 font-mono text-primary focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="rounded-xl border border-outline-variant/10 bg-surface-container-low p-4">
                <label className="text-xs font-bold text-on-surface-variant">
                  {getParameterLabel('l2_reg').title}
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.000001"
                  value={formConfig.advanced.weightDecay}
                  onChange={(event) =>
                    updateConfig((current) => ({
                      ...current,
                      advanced: {...current.advanced, weightDecay: Number(event.target.value)},
                    }))
                  }
                  className="mt-3 w-full rounded-lg border-none bg-surface-container-highest px-4 py-2 font-mono text-primary focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="rounded-xl border border-outline-variant/10 bg-surface-container-low p-4">
                <label className="text-xs font-bold text-on-surface-variant">
                  {getParameterLabel('optimizer').title}
                </label>
                <select
                  value={formConfig.advanced.optimizer}
                  onChange={(event) =>
                    updateConfig((current) => ({
                      ...current,
                      advanced: {
                        ...current.advanced,
                        optimizer: event.target.value as TrainConfig['advanced']['optimizer'],
                      },
                    }))
                  }
                  className="mt-3 w-full rounded-lg border-none bg-surface-container-highest px-4 py-2 text-primary focus:ring-1 focus:ring-primary"
                >
                  {optimizerOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="rounded-xl border border-error/10 bg-error/5 p-4 md:col-span-2 xl:col-span-3">
                <div className="flex items-end justify-between">
                  <label className="text-xs font-bold uppercase text-on-surface-variant">恶意客户端比例</label>
                  <span className="font-mono text-sm text-error">{Math.round(formConfig.poisoningRatio * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="0.5"
                  step="0.05"
                  value={formConfig.poisoningRatio}
                  onChange={(event) =>
                    updateConfig((current) => {
                      const poisoningRatio = Number(event.target.value);
                      const attacks = getSelectedAttacks(current);
                      const groups = splitAttackModules(attacks, attackTaxonomy);
                      return {
                        ...current,
                        poisoningRatio,
                        maliciousClientConfig: {
                          ...(current.maliciousClientConfig ?? {clientIds: []}),
                          enabled: Boolean(groups.poisoning.length),
                          mode: groups.poisoning.length ? 'ratio' : 'none',
                          ratio: groups.poisoning.length ? poisoningRatio : 0,
                          clientIds: current.maliciousClientConfig?.clientIds ?? [],
                        },
                      };
                    })
                  }
                  className="mt-4 h-1 w-full cursor-pointer appearance-none rounded-lg bg-surface-container-highest accent-error"
                />
              </div>
            </div>
          </div>

          <div className="glass-panel rounded-xl p-6">
            <div className="mb-6">
              <h4 className="text-lg font-bold">模块专属参数</h4>
              <p className="mt-1 text-xs text-on-surface-variant">
                参数来自真实能力矩阵的模块定义，会随实验配置提交给后端。
              </p>
            </div>
            <div className="space-y-4">
              {selectedAttacks.map((moduleName) =>
                renderModuleParameterCard(moduleName, configurationSource.capabilities?.attacks, 'attackParams', 'error'),
              )}
              {selectedDefenses.map((moduleName) =>
                renderModuleParameterCard(moduleName, configurationSource.capabilities?.defenses, 'defenseParams', 'tertiary'),
              )}
              {selectedPrivacyMetrics.map((moduleName) =>
                renderModuleParameterCard(moduleName, configurationSource.capabilities?.privacy_metrics, 'privacyParams', 'primary'),
              )}
              {!selectedAttacks.length && !selectedDefenses.length && !selectedPrivacyMetrics.length ? (
                <div className="rounded-xl border border-outline-variant/10 bg-surface-container-low p-4 text-sm text-on-surface-variant">
                  当前未选择攻击、鲁棒防御或观测模块，无模块专属参数。
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="space-y-6 lg:col-span-4">
          <div className="glass-panel rounded-xl border-l-4 border-primary p-6">
            <h4 className="mb-4 text-xs font-bold uppercase tracking-widest text-on-surface-variant">实验概览</h4>
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-on-surface-variant">模型</span>
                <span className="font-mono text-on-surface">{formConfig.model}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-on-surface-variant">数据集</span>
                <span className="font-mono text-on-surface">{formConfig.dataset}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-on-surface-variant">场景</span>
                <span className="text-right text-on-surface">
                  {getScenarioLabel(scenario).title}
                </span>
              </div>
              <div className="flex items-start justify-between gap-4 text-sm">
                <span className="text-on-surface-variant">投毒攻击</span>
                {renderChainSummary(selectedPoisoningAttacks)}
              </div>
              <div className="flex items-start justify-between gap-4 text-sm">
                <span className="text-on-surface-variant">隐私泄露观测</span>
                {renderChainSummary(selectedPrivacyProbes)}
              </div>
              <div className="flex items-start justify-between gap-4 text-sm">
                <span className="text-on-surface-variant">鲁棒防御</span>
                {renderChainSummary(selectedDefenses)}
              </div>
              <div className="flex items-start justify-between gap-4 text-sm">
                <span className="text-on-surface-variant">观测链</span>
                {renderChainSummary(selectedPrivacyMetrics)}
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-on-surface-variant">组合状态</span>
                <span
                  className={cn(
                    'rounded px-2 py-0.5 text-[10px] font-bold',
                    isValidatedCombination
                      ? 'bg-tertiary/20 text-tertiary'
                      : configurationSource.dataSource === 'api'
                        ? 'bg-error/10 text-error'
                        : 'bg-surface-container-high text-on-surface-variant',
                  )}
                >
                  {isValidatedCombination ? '已验证' : configurationSource.dataSource === 'api' ? '未验证' : 'Mock'}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-on-surface-variant">提交模式</span>
                <span className="font-mono text-on-surface">{validateOnly ? '仅校验' : '同步启动'}</span>
              </div>
              <div className="grid grid-cols-1 gap-2">
                <button
                  onClick={() => setValidateOnly((current) => !current)}
                  className={cn(
                    'rounded-lg px-4 py-3 text-left text-xs font-semibold transition-all',
                    validateOnly ? 'bg-primary/10 text-primary' : 'bg-surface-container-highest text-on-surface-variant',
                  )}
                >
                  {validateOnly ? '仅校验配置，不启动训练' : '提交后同步调用后端启动实验'}
                </button>
                <button
                  onClick={() => setStrictValidation((current) => !current)}
                  className={cn(
                    'rounded-lg px-4 py-3 text-left text-xs font-semibold transition-all',
                    strictValidation ? 'bg-error/10 text-error' : 'bg-surface-container-highest text-on-surface-variant',
                  )}
                >
                  {strictValidation ? '严格校验：未验证组合可能被拒绝' : '宽松校验：未验证组合仅提示'}
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-2">
                {realTrainingParams.map((param) => (
                  <div key={param.key} className="rounded-lg bg-surface-container-low p-3">
                    <p className="text-[10px] font-bold text-on-surface-variant">{getParameterLabel(param.key).title}</p>
                    <p className="mt-1 font-mono text-sm text-primary">{String(param.value)}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative mt-8 overflow-hidden rounded-lg border border-primary/10 aspect-video">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(129,236,255,0.18),_transparent_45%),linear-gradient(135deg,#0c141b,#172129)]" />
              <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-surface-container to-transparent p-4">
                <p className="mb-1 text-[10px] font-bold tracking-widest text-primary">提交映射</p>
                <p className="text-xs text-on-surface/80">
                  {formConfig.model} / {formConfig.dataset} / {getScenarioLabel(scenario).title}
                </p>
                <p className="mt-1 text-xs text-on-surface/60">
                  执行顺序：投毒攻击/隐私探针 → 鲁棒防御 → 观测模块
                </p>
              </div>
            </div>
            <div className="mt-6 rounded-lg bg-surface-container-low p-4 text-xs text-on-surface-variant">
              <div className="flex items-start gap-2">
                <Info className="mt-0.5 h-4 w-4 text-primary" />
                <span>
                  {isValidatedCombination
                    ? '已匹配验证组合。'
                    : configurationSource.dataSource === 'api'
                      ? '当前组合尚未在能力矩阵中标记为已验证；后端会按投毒/隐私探针、鲁棒防御、观测顺序处理。'
                      : formConfig.advanced.notes}
                  {' '}必填字段：模型 / 数据集 / 实验场景。
                </span>
              </div>
            </div>
          </div>

        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="glass-panel rounded-xl p-6">
          <h4 className="mb-4 text-xs font-bold uppercase tracking-widest text-on-surface-variant">只读环境信息</h4>
          <div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
            <div className="rounded-lg bg-surface-container-low p-3">
              <span className="text-on-surface-variant">模型家族</span>
              <p className="mt-1 font-semibold text-on-surface">
                {getFamilyLabel(currentModel?.family ?? 'unknown').title}
              </p>
            </div>
            <div className="rounded-lg bg-surface-container-low p-3">
              <span className="text-on-surface-variant">兼容状态</span>
              <p className="mt-1 font-semibold text-on-surface">
                {getStatusLabel(currentModel?.compatibility_status ?? 'unknown').title}
              </p>
            </div>
            <div className="rounded-lg bg-surface-container-low p-3">
              <span className="text-on-surface-variant">推荐数据集</span>
              <p className="mt-1 font-mono font-semibold text-on-surface">{currentModel?.recommended_dataset ?? formConfig.dataset}</p>
            </div>
            <div className="rounded-lg bg-surface-container-low p-3">
              <span className="text-on-surface-variant">配置来源</span>
              <p className="mt-1 font-semibold text-on-surface">{configurationSource.dataSourceLabel}</p>
            </div>
            <div className="rounded-lg bg-surface-container-low p-3 md:col-span-2">
              <span className="text-on-surface-variant">推荐覆盖项</span>
              <p className="mt-1 text-xs text-on-surface">
                {currentModelOverrides ? '后端提供了推荐训练覆盖参数，将作为参考使用。' : '未提供'}
              </p>
            </div>
            <div className="rounded-lg bg-surface-container-low p-3 md:col-span-2">
              <span className="text-on-surface-variant">客户端总数</span>
              <p className="mt-1 text-xs text-on-surface-variant">当前接口未暴露，不作为可编辑参数展示。</p>
            </div>
          </div>
        </div>

        <div className="glass-panel rounded-xl p-6">
          <h4 className="mb-2 text-xs font-bold uppercase tracking-widest text-on-surface-variant">规划中功能</h4>
          <p className="mb-4 text-xs text-on-surface-variant">以下功能保留为路线提示，当前不会随实验启动提交给后端启动器。</p>
          <div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
            <div className="rounded-lg bg-surface-container-low p-3">
              <p className="font-semibold text-on-surface">差分隐私 ε</p>
              <p className="mt-1 text-xs text-on-surface-variant">当前值：{formConfig.advanced.differentialPrivacyEpsilon ?? '未设置'}，当前不生效。</p>
            </div>
            <div className="rounded-lg bg-surface-container-low p-3">
              <p className="font-semibold text-on-surface">安全聚合</p>
              <p className="mt-1 text-xs text-on-surface-variant">当前值：{formConfig.advanced.secureAggregation ? '占位开启' : '未启用'}，当前不生效。</p>
            </div>
            <div className="rounded-lg bg-surface-container-low p-3">
              <p className="font-semibold text-on-surface">批大小 / 梯度裁剪</p>
              <p className="mt-1 text-xs text-on-surface-variant">仍保留在类型中用于后续扩展，当前不作为真实可编辑参数。</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
