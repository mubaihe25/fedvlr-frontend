import type {AggregationVisibilityMode, ExperimentPlayId, SecurityModuleId} from './securityTaxonomy';

export type PlaybookRouteTone = 'data' | 'train' | 'attack' | 'aggregation' | 'defense' | 'audit' | 'evidence' | 'privacy';

export interface PlaybookParam {
  label: string;
  value: string;
  note?: string;
}

export interface PlaybookRouteNode {
  stage: string;
  title: string;
  description: string;
  tone: PlaybookRouteTone;
}

export interface ExperimentPlaybook {
  id: ExperimentPlayId;
  title: string;
  purpose: string;
  dataset: string;
  model: string;
  attackType: string;
  defenseType: string;
  optionalDefenseText: string;
  auditMetrics: string[];
  evidence: string[];
  params: PlaybookParam[];
  routeNodes: PlaybookRouteNode[];
  recommendedScenarioId: string;
  scenarioKeywords: string[];
  nextStep: string;
  evidenceState: string;
  attackModules: SecurityModuleId[];
  defenseModules: SecurityModuleId[];
  auditModules: SecurityModuleId[];
  targetLabel: string;
  maliciousRatio: number;
  aggregationMode: AggregationVisibilityMode;
  robustAlgorithm: string;
  dpLayer: boolean;
  analysisOrder: Array<'target' | 'recommendation' | 'membership' | 'leakage' | 'defense'>;
}

export const EXPERIMENT_PLAYBOOKS: ExperimentPlaybook[] = [
  {
    id: 'target_poisoning_play',
    title: '目标商品投毒',
    purpose: '恶意客户端注入目标商品正反馈，观察目标商品排序是否被推高。',
    dataset: 'AMAZON_BEAUTY_POC',
    model: 'FedAvg',
    attackType: '目标交互注入',
    defenseType: '无防御 / 可选鲁棒聚合',
    optionalDefenseText: '可选 Krum 异常更新筛选、坐标中位数聚合、截尾均值聚合或 Bulyan 组合鲁棒聚合；单次实验最多选择一个。',
    auditMetrics: ['目标排序', 'Top50 曝光', '推荐列表变化', 'MIA', '交互还原'],
    evidence: ['V2.5 结果', '170 -> 3', 'Top50 未命中', '三列推荐对比'],
    params: [
      {label: '数据集', value: 'Amazon Beauty'},
      {label: '模型', value: 'FedAvg'},
      {label: '目标商品', value: 'Empty Amber Glass Spray Bottles'},
      {label: '训练轮数', value: '10'},
      {label: '本地轮数', value: '5'},
      {label: '客户端采样比例', value: '0.25'},
      {label: '恶意客户端比例', value: '20%'},
      {label: '攻击强度', value: '强'},
      {label: '导出 Top50 推荐列表', value: '开启'},
      {label: '导出审计结果', value: '开启'},
    ],
    routeNodes: [
      {stage: '数据集', title: 'Amazon Beauty', description: '商品推荐数据与本地缓存图片', tone: 'data'},
      {stage: '客户端训练', title: 'FedAvg 客户端', description: '用户交互留在本地训练', tone: 'train'},
      {stage: '攻击注入', title: '目标交互注入', description: '恶意客户端注入目标商品正反馈', tone: 'attack'},
      {stage: '聚合方式', title: 'FedAvg 聚合', description: '服务端聚合客户端更新', tone: 'aggregation'},
      {stage: '防御处理', title: '无防御 / 可选鲁棒聚合', description: '用于观察投毒前后差异', tone: 'defense'},
      {stage: '观测指标', title: '排序审计', description: '未屏蔽排序与最终曝光同时检查', tone: 'audit'},
      {stage: '输出证据', title: '170 -> 3', description: '内部排序推进，但 Top50 未命中', tone: 'evidence'},
    ],
    recommendedScenarioId: 'amazon_beauty_poc_v25_backend_smoke',
    scenarioKeywords: ['amazon_beauty_poc_v25_backend_smoke', 'v25', 'target', 'rank', 'amazon'],
    nextStep: '建议进入单次分析查看 170 -> 3 和 Top50 未命中。',
    evidenceState: '已有 V2.5 结果',
    attackModules: ['target_poisoning'],
    defenseModules: ['robust_aggregation', 'dp_noise'],
    auditModules: ['recommendation_audit', 'privacy_audit'],
    targetLabel: 'Empty Amber Glass Spray Bottles',
    maliciousRatio: 0.2,
    aggregationMode: 'plain_updates',
    robustAlgorithm: 'none',
    dpLayer: false,
    analysisOrder: ['target', 'recommendation', 'membership', 'leakage', 'defense'],
  },
  {
    id: 'membership_privacy_play',
    title: '成员推断攻击',
    purpose: '判断某条用户-商品记录是否参与训练，观察隐私审计风险。',
    dataset: 'AMAZON_BEAUTY_POC',
    model: 'FedAvg',
    attackType: '成员推断攻击',
    defenseType: '更新扰动 / 安全聚合模拟',
    optionalDefenseText: '可叠加差分隐私风格加噪；安全聚合模拟只隐藏单客户端更新。',
    auditMetrics: ['AUC', 'Accuracy', 'score gap', '证据类型'],
    evidence: ['成员推断结果', '训练/非训练记录区分', '匿名 user-item 样例'],
    params: [
      {label: '证据来源', value: 'rank / unmasked rank / checkpoint score'},
      {label: '标签来源', value: 'membership labels'},
      {label: '观测指标', value: 'AUC、Accuracy、score gap'},
      {label: '当前口径', value: '排名证据 / 混合证据'},
      {label: '样例展示', value: '匿名 user-item 记录'},
      {label: '输出证据', value: '成员推断摘要'},
    ],
    routeNodes: [
      {stage: '数据集', title: '推荐列表 / rank 证据', description: '读取排序与成员标签证据', tone: 'data'},
      {stage: '客户端训练', title: 'membership labels', description: '标注记录是否参与训练', tone: 'train'},
      {stage: '隐私审计', title: 'MIA probe', description: '判断记录成员身份', tone: 'privacy'},
      {stage: '聚合方式', title: '结果读取', description: '读取已导出的隐私审计结果', tone: 'aggregation'},
      {stage: '防御处理', title: '可选扰动层', description: '加噪只能按当前口径展示', tone: 'defense'},
      {stage: '观测指标', title: 'AUC / Accuracy', description: '观察区分能力与证据类型', tone: 'audit'},
      {stage: '输出证据', title: '隐私风险证据', description: '不展示完整用户历史', tone: 'evidence'},
    ],
    recommendedScenarioId: 'amazon_beauty_poc_v25_backend_smoke',
    scenarioKeywords: ['membership', 'mia', 'privacy', 'v25', 'amazon'],
    nextStep: '建议查看 MIA AUC 和训练/非训练记录区分。',
    evidenceState: '已有隐私审计摘要',
    attackModules: ['membership_inference'],
    defenseModules: ['dp_noise', 'secure_aggregation_sim'],
    auditModules: ['privacy_audit'],
    targetLabel: '匿名 user-item 记录',
    maliciousRatio: 0,
    aggregationMode: 'plain_updates',
    robustAlgorithm: 'none',
    dpLayer: false,
    analysisOrder: ['membership', 'leakage', 'target', 'defense', 'recommendation'],
  },
  {
    id: 'update_leakage_play',
    title: '客户端更新泄露',
    purpose: '从客户端上传更新中推断候选交互，观察 item embedding 风险。',
    dataset: 'AMAZON_BEAUTY_POC',
    model: 'FedAvg',
    attackType: '客户端更新泄露',
    defenseType: '安全聚合模拟 / 更新扰动',
    optionalDefenseText: '安全聚合模拟适合展示只暴露聚合结果；加噪只作为更新扰动层。',
    auditMetrics: ['hit@10', 'hit@20', 'hit@50', '最高风险模态'],
    evidence: ['候选商品还原', 'hit@10/20/50', 'item embedding 风险'],
    params: [
      {label: '输入', value: '客户端上传更新'},
      {label: '候选数量', value: 'Top50'},
      {label: '风险模态', value: 'item embedding'},
      {label: '观测指标', value: 'hit@10 / hit@20 / hit@50'},
      {label: '输出证据', value: '候选交互还原摘要'},
      {label: '口径边界', value: '不是完整用户历史恢复'},
    ],
    routeNodes: [
      {stage: '数据集', title: '客户端上传更新', description: '读取更新侧隐私证据', tone: 'data'},
      {stage: '客户端训练', title: '本地交互信号', description: '更新中可能携带偏好痕迹', tone: 'train'},
      {stage: '隐私审计', title: 'item embedding 风险', description: '分析高风险模态', tone: 'privacy'},
      {stage: '聚合方式', title: '候选商品还原', description: '从更新推断候选商品', tone: 'aggregation'},
      {stage: '防御处理', title: '安全聚合模拟 / 扰动', description: '降低单客户端可见性', tone: 'defense'},
      {stage: '观测指标', title: 'hit@10/20/50', description: '衡量候选命中情况', tone: 'audit'},
      {stage: '输出证据', title: '交互候选证据', description: '候选还原，不是完整历史恢复', tone: 'evidence'},
    ],
    recommendedScenarioId: 'amazon_beauty_poc_v25_backend_smoke',
    scenarioKeywords: ['interaction', 'reconstruction', 'privacy', 'v25', 'amazon'],
    nextStep: '建议查看候选商品还原 hit@10/20/50。',
    evidenceState: '已有更新泄露摘要',
    attackModules: ['interaction_reconstruction'],
    defenseModules: ['secure_aggregation_sim', 'dp_noise'],
    auditModules: ['privacy_audit'],
    targetLabel: '候选交互集合',
    maliciousRatio: 0,
    aggregationMode: 'secure_aggregation',
    robustAlgorithm: 'none',
    dpLayer: false,
    analysisOrder: ['leakage', 'membership', 'target', 'defense', 'recommendation'],
  },
  {
    id: 'robust_defense_play',
    title: '鲁棒聚合防御',
    purpose: '在明文更新可见条件下，选择无攻击或恶意模型更新，观察一种鲁棒聚合算法的处理效果。',
    dataset: 'KU',
    model: 'MMFedRAP',
    attackType: '无攻击 / 恶意模型更新',
    defenseType: '单选鲁棒聚合算法',
    optionalDefenseText: '单次实验最多选择一种鲁棒聚合算法；空选表示普通 FedAvg 聚合，不与安全聚合模拟同时启用。',
    auditMetrics: ['Recall@50', 'NDCG@50', '防御恢复率', '异常更新过滤'],
    evidence: ['security matrix', 'Krum 链路', '防御恢复摘要'],
    params: [
      {label: '聚合方式', value: '明文更新聚合'},
      {label: '防御算法', value: 'Krum / Median / TrimmedMean / Bulyan 四选一'},
      {label: '观测指标', value: 'Recall@50、NDCG@50'},
      {label: '恢复指标', value: '防御恢复率'},
      {label: '过滤摘要', value: '异常更新过滤'},
      {label: '输出证据', value: '鲁棒防御摘要'},
    ],
    routeNodes: [
      {stage: '数据集', title: 'KU / Amazon Beauty', description: '读取鲁棒防御场景', tone: 'data'},
      {stage: '客户端训练', title: '基础攻击可选', description: '无攻击或恶意模型更新', tone: 'attack'},
      {stage: '攻击注入', title: '明文更新聚合', description: '服务端能观察单客户端更新', tone: 'aggregation'},
      {stage: '聚合方式', title: '鲁棒聚合', description: '四种算法单选执行', tone: 'defense'},
      {stage: '防御处理', title: '过滤异常更新', description: '削弱异常客户端影响', tone: 'defense'},
      {stage: '观测指标', title: 'Recall / NDCG / 恢复率', description: '观察性能恢复与过滤效果', tone: 'audit'},
      {stage: '输出证据', title: '防御摘要', description: '展示鲁棒防御链路边界', tone: 'evidence'},
    ],
    recommendedScenarioId: 'security_matrix_krum_demo',
    scenarioKeywords: ['security_matrix_krum_demo', 'krum', 'robust', 'security_matrix', 'ku'],
    nextStep: '建议查看防御恢复率和异常更新过滤。',
    evidenceState: '已有鲁棒防御证据',
    attackModules: ['target_poisoning'],
    defenseModules: ['robust_aggregation'],
    auditModules: ['recommendation_audit', 'defense_audit'],
    targetLabel: '异常更新集合',
    maliciousRatio: 0.2,
    aggregationMode: 'plain_updates',
    robustAlgorithm: 'none',
    dpLayer: false,
    analysisOrder: ['defense', 'recommendation', 'target', 'membership', 'leakage'],
  },
];

export const getExperimentPlaybook = (id: ExperimentPlayId) =>
  EXPERIMENT_PLAYBOOKS.find((playbook) => playbook.id === id) ?? EXPERIMENT_PLAYBOOKS[0];
