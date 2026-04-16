export interface ExperimentDisplayLabel {
  title: string;
  code: string;
  description?: string;
}

export type AttackSemanticKind = 'poisoning' | 'privacy_probe' | 'other';
export type DefenseSemanticKind = 'robust_defense' | 'defense_observation' | 'other';

export interface ModuleTaxonomyLike {
  name?: string;
  family?: string;
  category?: string;
  strategy?: string;
  display_category?: string;
  attack_family?: string;
  attack_category?: string;
  attack_strategy?: string;
  attack_display_category?: string;
  defense_family?: string;
  defense_category?: string;
  defense_strategy?: string;
  defense_display_category?: string;
  is_read_only?: boolean;
  mutates_participant_params?: boolean;
}

export type AttackTaxonomyMap = Record<string, ModuleTaxonomyLike | undefined>;

const humanizeCode = (value: string) =>
  value
    .split(/[_-]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

const createFallbackLabel = (code: string): ExperimentDisplayLabel => ({
  title: humanizeCode(code) || '未知项',
  code,
});

const moduleLabels: Record<string, ExperimentDisplayLabel> = {
  poisoning_attack: {
    title: '投毒攻击',
    code: 'poisoning_attack',
    description: '统一的非定向投毒入口，内部组合更新缩放、符号翻转和模型替换三种子策略。',
  },
  poisoning: {
    title: '投毒攻击',
    code: 'poisoning',
    description: '统一的非定向投毒入口。',
  },
  nondirected_poisoning: {
    title: '投毒攻击',
    code: 'nondirected_poisoning',
    description: '统一的非定向投毒入口。',
  },
  client_update_scale: {
    title: '更新缩放投毒',
    code: 'client_update_scale',
    description: '主动放大恶意客户端上传更新，属于投毒攻击家族。',
  },
  sign_flip: {
    title: '符号翻转投毒',
    code: 'sign_flip',
    description: '主动翻转恶意客户端上传更新方向，属于投毒攻击家族。',
  },
  model_replacement: {
    title: '模型替换投毒',
    code: 'model_replacement',
    description: '以 replacement-like 方式强化恶意更新影响，属于投毒攻击家族。',
  },
  client_preference_leakage_probe: {
    title: '偏好泄露探针',
    code: 'client_preference_leakage_probe',
    description: '只读分析联邦更新中的潜在偏好泄露风险，不直接修改聚合输入。',
  },
  robust_defense: {
    title: '鲁棒防御',
    code: 'robust_defense',
    description: '统一的鲁棒防御入口，内部支持裁剪型、过滤型和鲁棒聚合型模式。',
  },
  robust: {
    title: '鲁棒防御',
    code: 'robust',
    description: '统一的鲁棒防御入口。',
  },
  robust_aggregation_defense: {
    title: '鲁棒防御',
    code: 'robust_aggregation_defense',
    description: '统一的鲁棒防御入口。',
  },
  norm_clip: {
    title: '范数裁剪防御',
    code: 'norm_clip',
    description: '在聚合前对客户端更新做全局范数裁剪。',
  },
  update_filter: {
    title: '更新过滤防御',
    code: 'update_filter',
    description: '基于更新范数规则过滤可疑客户端更新。',
  },
  trimmed_mean: {
    title: '截尾均值防御',
    code: 'trimmed_mean',
    description: '通过逐坐标截尾降低极端更新影响。',
  },
  client_update_anomaly: {
    title: '异常更新检测',
    code: 'client_update_anomaly',
    description: '只读检测聚合前的可疑客户端更新。',
  },
  client_update_anomaly_detector: {
    title: '异常更新检测',
    code: 'client_update_anomaly_detector',
    description: '只读检测聚合前的可疑客户端更新。',
  },
  client_update_norm: {
    title: '更新范数观测',
    code: 'client_update_norm',
    description: '记录参与客户端上传更新的范数统计。',
  },
  client_update_norm_metric: {
    title: '更新范数观测',
    code: 'client_update_norm_metric',
    description: '记录参与客户端上传更新的范数统计。',
  },
};

const parameterLabels: Record<string, ExperimentDisplayLabel> = {
  poisoning_mix_rule: {title: '投毒混合规则', code: 'poisoning_mix_rule'},
  poisoning_scale_ratio: {title: '更新缩放占比', code: 'poisoning_scale_ratio'},
  poisoning_sign_flip_ratio: {title: '符号翻转占比', code: 'poisoning_sign_flip_ratio'},
  poisoning_model_replacement_ratio: {title: '模型替换占比', code: 'poisoning_model_replacement_ratio'},
  poisoning_attack_scale: {title: '更新缩放系数', code: 'poisoning_attack_scale'},
  poisoning_sign_flip_scale: {title: '符号翻转系数', code: 'poisoning_sign_flip_scale'},
  poisoning_replacement_scale: {title: '模型替换缩放系数', code: 'poisoning_replacement_scale'},
  poisoning_replacement_rule: {title: '模型替换规则', code: 'poisoning_replacement_rule'},
  poisoning_strategy_weights: {title: '子策略分配权重', code: 'poisoning_strategy_weights'},
  robust_defense_mode: {title: '鲁棒防御模式', code: 'robust_defense_mode'},
  robust_clip_norm: {title: '裁剪阈值', code: 'robust_clip_norm'},
  robust_filter_rule: {title: '过滤规则', code: 'robust_filter_rule'},
  robust_filter_std_factor: {title: '过滤标准差系数', code: 'robust_filter_std_factor'},
  robust_max_filtered_ratio: {title: '最大过滤比例', code: 'robust_max_filtered_ratio'},
  robust_trim_ratio: {title: '截尾比例', code: 'robust_trim_ratio'},
  robust_min_clients_for_trim: {title: '最小截尾客户端数', code: 'robust_min_clients_for_trim'},
  robust_trim_rule: {title: '截尾规则', code: 'robust_trim_rule'},
  replacement_scale: {title: '替换缩放系数', code: 'replacement_scale'},
  replacement_rule: {title: '替换规则', code: 'replacement_rule'},
  attack_scale: {title: '攻击缩放系数', code: 'attack_scale'},
  sign_flip_scale: {title: '符号翻转系数', code: 'sign_flip_scale'},
  defense_clip_norm: {title: '裁剪阈值', code: 'defense_clip_norm'},
  filter_rule: {title: '过滤规则', code: 'filter_rule'},
  filter_std_factor: {title: '过滤标准差系数', code: 'filter_std_factor'},
  max_filtered_ratio: {title: '最大过滤比例', code: 'max_filtered_ratio'},
  trim_ratio: {title: '截尾比例', code: 'trim_ratio'},
  min_clients_for_trim: {title: '最小截尾客户端数', code: 'min_clients_for_trim'},
  trim_rule: {title: '截尾规则', code: 'trim_rule'},
  attack_probe_topk_ratio: {title: '探针 Top-K 比例', code: 'attack_probe_topk_ratio'},
  attack_probe_std_factor: {title: '探针标准差系数', code: 'attack_probe_std_factor'},
  defense_anomaly_std_factor: {title: '异常检测标准差系数', code: 'defense_anomaly_std_factor'},
  std_factor: {title: '标准差系数', code: 'std_factor'},
  epochs: {title: '总训练轮数', code: 'epochs'},
  local_epochs: {title: '本地训练轮数', code: 'local_epochs'},
  clients_sample_ratio: {title: '客户端采样率', code: 'clients_sample_ratio'},
  lr: {title: '学习率', code: 'lr'},
  l2_reg: {title: 'L2 正则', code: 'l2_reg'},
};

const parameterValueLabels: Record<string, string> = {
  round_robin: '轮询分流',
  by_ratio: '按比例分流',
  weighted_partition: '按权重分流',
  aligned_mean: '对齐均值',
  coordinate_trimmed_mean: '逐坐标截尾均值',
  clip: '裁剪型',
  filter: '过滤型',
  trimmed_mean: '鲁棒聚合型',
  clip_then_trimmed_mean: '裁剪 + 鲁棒聚合',
  filter_then_trimmed_mean: '过滤 + 鲁棒聚合',
  clip_then_filter_then_trimmed_mean: '裁剪 + 过滤 + 鲁棒聚合',
  'update_norm > mean + filter_std_factor * std': '更新范数高于均值阈值',
};

const scenarioLabels: Record<string, ExperimentDisplayLabel> = {
  baseline: {title: '基线实验', code: 'baseline'},
  attack_only: {title: '投毒攻击实验', code: 'attack_only'},
  defense_only: {title: '防御实验', code: 'defense_only'},
  attack_and_defense: {title: '攻防对比实验', code: 'attack_and_defense'},
  privacy_observation: {title: '隐私观测实验', code: 'privacy_observation'},
  custom: {title: '自定义组合', code: 'custom'},
};

const familyLabels: Record<string, ExperimentDisplayLabel> = {
  unknown: {title: '未知', code: 'unknown'},
  single_modal: {title: '单模态', code: 'single_modal'},
  single_modal_with_visual_features: {title: '单模态 + 视觉特征', code: 'single_modal_with_visual_features'},
  single_modal_personalized: {title: '个性化单模态', code: 'single_modal_personalized'},
  multi_modal: {title: '多模态', code: 'multi_modal'},
  multi_modal_personalized: {title: '个性化多模态', code: 'multi_modal_personalized'},
  multi_modal_graph: {title: '多模态图模型', code: 'multi_modal_graph'},
};

const statusLabels: Record<string, ExperimentDisplayLabel> = {
  unknown: {title: '未提供', code: 'unknown'},
  showcase_ready: {title: '展示就绪', code: 'showcase_ready'},
  validated: {title: '已兼容', code: 'validated'},
  blocked: {title: '受阻', code: 'blocked'},
  planned: {title: '规划中', code: 'planned'},
  verified: {title: '已验证', code: 'verified'},
  unverified: {title: '未验证', code: 'unverified'},
  validate_only: {title: '仅校验', code: 'validate_only'},
  launch_train: {title: '启动训练', code: 'launch_train'},
};

const poisoningAttackNames = new Set([
  'poisoning_attack',
  'poisoning',
  'nondirected_poisoning',
  'client_update_scale',
  'sign_flip',
  'model_replacement',
]);
const privacyProbeNames = new Set(['client_preference_leakage_probe']);
const robustDefenseNames = new Set([
  'robust_defense',
  'robust',
  'robust_aggregation_defense',
  'norm_clip',
  'update_filter',
  'trimmed_mean',
]);
const defenseObservationNames = new Set(['client_update_anomaly', 'client_update_anomaly_detector']);

const getTaxonomyValue = (taxonomy: ModuleTaxonomyLike | undefined, ...keys: Array<keyof ModuleTaxonomyLike>) => {
  for (const key of keys) {
    const value = taxonomy?.[key];
    if (typeof value === 'string' && value) {
      return value;
    }
  }

  return '';
};

export const getAttackSemanticKind = (
  moduleName: string,
  taxonomy?: ModuleTaxonomyLike | AttackTaxonomyMap,
): AttackSemanticKind => {
  const moduleTaxonomy =
    taxonomy && 'name' in taxonomy
      ? taxonomy
      : (taxonomy as AttackTaxonomyMap | undefined)?.[moduleName];
  const family = getTaxonomyValue(moduleTaxonomy, 'attack_family', 'family');
  const category = getTaxonomyValue(moduleTaxonomy, 'attack_category', 'category');
  const displayCategory = getTaxonomyValue(moduleTaxonomy, 'attack_display_category', 'display_category');
  const normalized = [family, category, displayCategory].join(' ').toLowerCase();

  if (
    family === 'privacy_probe' ||
    category === 'privacy_probe' ||
    category === 'privacy_observation' ||
    normalized.includes('privacy') ||
    privacyProbeNames.has(moduleName) ||
    (moduleTaxonomy?.is_read_only === true && !moduleTaxonomy?.mutates_participant_params)
  ) {
    return 'privacy_probe';
  }

  if (
    family === 'poisoning' ||
    category === 'poisoning' ||
    displayCategory === 'poisoning' ||
    normalized.includes('poison') ||
    poisoningAttackNames.has(moduleName) ||
    moduleTaxonomy?.mutates_participant_params === true
  ) {
    return 'poisoning';
  }

  return 'other';
};

export const isPoisoningAttackModule = (moduleName: string, taxonomy?: ModuleTaxonomyLike | AttackTaxonomyMap) =>
  getAttackSemanticKind(moduleName, taxonomy) === 'poisoning';

export const isPrivacyProbeModule = (moduleName: string, taxonomy?: ModuleTaxonomyLike | AttackTaxonomyMap) =>
  getAttackSemanticKind(moduleName, taxonomy) === 'privacy_probe';

export const getDefenseSemanticKind = (
  moduleName: string,
  taxonomy?: ModuleTaxonomyLike,
): DefenseSemanticKind => {
  const family = getTaxonomyValue(taxonomy, 'defense_family', 'family');
  const category = getTaxonomyValue(taxonomy, 'defense_category', 'category');
  const displayCategory = getTaxonomyValue(taxonomy, 'defense_display_category', 'display_category');
  const normalized = [family, category, displayCategory].join(' ').toLowerCase();

  if (
    family === 'defense_observation' ||
    category === 'anomaly_detection' ||
    normalized.includes('observation') ||
    normalized.includes('detect') ||
    defenseObservationNames.has(moduleName) ||
    (taxonomy?.is_read_only === true && !taxonomy?.mutates_participant_params)
  ) {
    return 'defense_observation';
  }

  if (
    family === 'robust_defense' ||
    category === 'robust_defense' ||
    normalized.includes('robust') ||
    robustDefenseNames.has(moduleName)
  ) {
    return 'robust_defense';
  }

  return 'other';
};

export const isRobustDefenseModule = (moduleName: string, taxonomy?: ModuleTaxonomyLike) =>
  getDefenseSemanticKind(moduleName, taxonomy) === 'robust_defense';

export const splitDefenseModules = (values: string[] = [], taxonomy?: Record<string, ModuleTaxonomyLike | undefined>) => {
  const groups = {
    robust: [] as string[],
    observation: [] as string[],
    other: [] as string[],
  };

  values.forEach((value) => {
    const kind = getDefenseSemanticKind(value, taxonomy?.[value]);
    if (kind === 'robust_defense') {
      groups.robust.push(value);
    } else if (kind === 'defense_observation') {
      groups.observation.push(value);
    } else {
      groups.other.push(value);
    }
  });

  return groups;
};

export const formatDefenseSemanticGroups = (values: string[] = [], taxonomy?: Record<string, ModuleTaxonomyLike | undefined>) => {
  const groups = splitDefenseModules(values, taxonomy);
  const robustDetail = formatModuleChain(groups.robust);
  return {
    ...groups,
    robustLabel: groups.robust.length
      ? groups.robust.some((value) => value === 'robust_defense' || value === 'robust' || value === 'robust_aggregation_defense')
        ? '鲁棒防御'
        : `鲁棒防御：${robustDetail}`
      : '未启用',
    observationLabel: formatModuleChain(groups.observation),
    otherLabel: formatModuleChain(groups.other),
  };
};

export const buildAttackTaxonomyMap = (modules?: ModuleTaxonomyLike[]): AttackTaxonomyMap =>
  (modules ?? []).reduce<AttackTaxonomyMap>((map, module) => {
    if (module.name) {
      map[module.name] = module;
    }
    return map;
  }, {});

export const splitAttackModules = (values: string[] = [], taxonomy?: AttackTaxonomyMap) => {
  const groups = {
    poisoning: [] as string[],
    privacyProbe: [] as string[],
    other: [] as string[],
  };

  values.forEach((value) => {
    const kind = getAttackSemanticKind(value, taxonomy);
    if (kind === 'poisoning') {
      groups.poisoning.push(value);
    } else if (kind === 'privacy_probe') {
      groups.privacyProbe.push(value);
    } else {
      groups.other.push(value);
    }
  });

  return groups;
};

export const formatAttackSemanticGroups = (values: string[] = [], taxonomy?: AttackTaxonomyMap) => {
  const groups = splitAttackModules(values, taxonomy);
  return {
    ...groups,
    poisoningLabel: formatModuleChain(groups.poisoning),
    privacyProbeLabel: formatModuleChain(groups.privacyProbe),
    otherLabel: formatModuleChain(groups.other),
  };
};

export const getModuleLabel = (code: string) => moduleLabels[code] ?? createFallbackLabel(code);

export const getParameterLabel = (code: string) => parameterLabels[code] ?? createFallbackLabel(code);

export const getParameterValueLabel = (value: string) => parameterValueLabels[value] ?? value;

export const hasParameterValueLabel = (value: string) => value in parameterValueLabels;

export const getScenarioLabel = (code: string) => scenarioLabels[code] ?? createFallbackLabel(code);

export const getFamilyLabel = (code: string) => familyLabels[code] ?? createFallbackLabel(code);

export const getStatusLabel = (code: string) => statusLabels[code] ?? createFallbackLabel(code);

export const formatModuleChain = (values: string[] = []) =>
  values.length ? values.map((value) => getModuleLabel(value).title).join(' → ') : '未启用';
