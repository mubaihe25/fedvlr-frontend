export interface ExperimentDisplayLabel {
  title: string;
  code: string;
  description?: string;
}

const humanizeCode = (value: string) =>
  value
    .split(/[_-]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

const createFallbackLabel = (code: string): ExperimentDisplayLabel => ({
  title: humanizeCode(code) ? '未命名项' : '未知项',
  code,
});

const moduleLabels: Record<string, ExperimentDisplayLabel> = {
  client_update_scale: {
    title: '更新缩放攻击',
    code: 'client_update_scale',
    description: '按比例放大恶意客户端上传更新。',
  },
  sign_flip: {
    title: '符号翻转攻击',
    code: 'sign_flip',
    description: '对恶意客户端更新执行符号翻转。',
  },
  model_replacement: {
    title: '模型替换攻击',
    code: 'model_replacement',
    description: '以更强缩放方式模拟 replacement-like 恶意更新。',
  },
  client_preference_leakage_probe: {
    title: '偏好泄露探针',
    code: 'client_preference_leakage_probe',
    description: '只读分析客户端更新中的潜在偏好泄露风险。',
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
  replacement_scale: {title: '替换缩放系数', code: 'replacement_scale'},
  replacement_rule: {title: '模型替换规则', code: 'replacement_rule'},
  attack_scale: {title: '攻击缩放系数', code: 'attack_scale'},
  sign_flip_scale: {title: '符号翻转缩放系数', code: 'sign_flip_scale'},
  defense_clip_norm: {title: '防御裁剪阈值', code: 'defense_clip_norm'},
  filter_rule: {title: '过滤规则', code: 'filter_rule'},
  filter_std_factor: {title: '过滤标准差系数', code: 'filter_std_factor'},
  max_filtered_ratio: {title: '最大过滤比例', code: 'max_filtered_ratio'},
  trim_ratio: {title: '截尾比例', code: 'trim_ratio'},
  min_clients_for_trim: {title: '最小截尾客户端数', code: 'min_clients_for_trim'},
  trim_rule: {title: '截尾规则', code: 'trim_rule'},
  attack_probe_topk_ratio: {title: 'Top-K 强更新比例', code: 'attack_probe_topk_ratio'},
  attack_probe_std_factor: {title: '攻击探针标准差系数', code: 'attack_probe_std_factor'},
  defense_anomaly_std_factor: {title: '异常检测标准差系数', code: 'defense_anomaly_std_factor'},
  std_factor: {title: '标准差系数', code: 'std_factor'},
  epochs: {title: '总训练轮数', code: 'epochs'},
  local_epochs: {title: '本地训练轮数', code: 'local_epochs'},
  clients_sample_ratio: {title: '客户端采样率', code: 'clients_sample_ratio'},
  lr: {title: '学习率', code: 'lr'},
  l2_reg: {title: 'L2 正则', code: 'l2_reg'},
};

const parameterValueLabels: Record<string, string> = {
  aligned_mean: '对齐均值',
  coordinate_trimmed_mean: '逐坐标截尾均值',
  'update_norm > mean + filter_std_factor * std': '更新范数高于均值阈值',
};

const scenarioLabels: Record<string, ExperimentDisplayLabel> = {
  baseline: {title: '基线实验', code: 'baseline'},
  attack_only: {title: '攻击实验', code: 'attack_only'},
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
  validate_only: {title: '只校验', code: 'validate_only'},
  launch_train: {title: '启动训练', code: 'launch_train'},
};

export const getModuleLabel = (code: string) => moduleLabels[code] ?? createFallbackLabel(code);

export const getParameterLabel = (code: string) => parameterLabels[code] ?? createFallbackLabel(code);

export const getParameterValueLabel = (value: string) => parameterValueLabels[value] ?? value;

export const hasParameterValueLabel = (value: string) => value in parameterValueLabels;

export const getScenarioLabel = (code: string) => scenarioLabels[code] ?? createFallbackLabel(code);

export const getFamilyLabel = (code: string) => familyLabels[code] ?? createFallbackLabel(code);

export const getStatusLabel = (code: string) => statusLabels[code] ?? createFallbackLabel(code);

export const formatModuleChain = (values: string[]) =>
  values.length ? values.map((value) => getModuleLabel(value).title).join(' → ') : '未启用';
