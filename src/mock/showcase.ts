export type ModalityKey = 'image' | 'text' | 'collaborative_id';
export type ServerViewId = 'G1' | 'G2' | 'G3' | 'G4';
export type RecommendationStatus = 'stable' | 'shifted' | 'injected' | 'recovered' | 'suppressed';

export interface ShowcaseDatasetProfile {
  name: string;
  source: string;
  users: string;
  items: string;
  interactions: string;
  sparsity: string;
  modalities: ModalityKey[];
  note: string;
}

export interface ShowcaseItem {
  id: string;
  title: string;
  type: 'short_video' | 'product' | 'content';
  text: string;
  tags: string[];
  thumbnailGradient: string;
  modalityStatus: Record<ModalityKey, boolean>;
}

export interface ShowcaseEmbeddingPreview {
  modality: ModalityKey;
  label: string;
  description: string;
  vector: number[];
}

export interface ShowcaseServerView {
  id: ServerViewId;
  name: string;
  description: string;
  modalityWeights: Record<ModalityKey, number>;
  sampleSimilarItems: string[];
}

export interface ShowcaseRecommendation {
  title: string;
  score: number;
  reason: string;
  mainModality: string;
}

export interface ShowcaseClientCase {
  clientId: string;
  profileHint: string;
  localHistory: string[];
  routerWeights: Record<ServerViewId, number>;
  recommendationList: ShowcaseRecommendation[];
}

export interface ShowcaseFederatedBoundary {
  localKept: string[];
  uploaded: string[];
  serverAggregates: string[];
}

export interface AttackDefenseMetrics {
  recall50: number;
  ndcg50: number;
}

export interface AttackDefenseImpact {
  recallDrop: number;
  ndcgDrop: number;
}

export interface AttackDefenseRecommendation {
  rank: number;
  itemTitle: string;
  score: number;
  reason: string;
  mainModality: string;
  status: RecommendationStatus;
  rankChange?: string;
}

export interface RecommendationComparison {
  baselineRecommendations: AttackDefenseRecommendation[];
  attackedRecommendations: AttackDefenseRecommendation[];
  defendedRecommendations: AttackDefenseRecommendation[];
}

export interface DefenseTrace {
  totalClients: number;
  maliciousClients: number;
  clippedClients: number;
  filteredClients: number;
  trimmedUpdates: number;
  aggregationRule: string;
  notes: string[];
}

export interface AttackDefenseCase {
  caseId: string;
  title: string;
  clientId: string;
  dataset: string;
  attackType: string;
  defenseType: string;
  maliciousRatio: number;
  baselineMetrics: AttackDefenseMetrics;
  attackMetrics: AttackDefenseMetrics;
  defenseMetrics: AttackDefenseMetrics;
  attackImpact: AttackDefenseImpact;
  recoveryRate: number;
  recommendationComparison: RecommendationComparison;
  defenseTrace: DefenseTrace;
  note: string;
}

export interface DeliverySummary {
  systemSummary: string;
  modelSummary: string;
  dataSummary: string;
  securitySummary: string;
  metricsSummary: string;
  limitations: string[];
  nextSteps: string[];
}

export const showcaseSampleNotice =
  '当前为展示样本结构，后续可替换为 FedVLR 导出的真实 artifacts 或更完整多模态数据集。';

export const datasetProfile: ShowcaseDatasetProfile = {
  name: 'KU / Showcase',
  source: 'NineRec-style short-video multimodal recommendation sample',
  users: '12.8K showcase users',
  items: '46.2K multimodal items',
  interactions: '318K sampled interactions',
  sparsity: '99.94%',
  modalities: ['image', 'text', 'collaborative_id'],
  note: '当前为展示样本结构，后续可替换为包含原始图片、文本和视频封面的更完整数据集。',
};

export const sampleItems: ShowcaseItem[] = [
  {
    id: 'KU-1042',
    title: '城市夜跑装备短片',
    type: 'short_video',
    text: '展示夜间跑步装备、反光背心与智能手表的轻量短视频。',
    tags: ['running', 'city', 'wearable'],
    thumbnailGradient: 'from-primary/35 via-secondary/20 to-surface-container-high',
    modalityStatus: {image: true, text: true, collaborative_id: true},
  },
  {
    id: 'KU-1187',
    title: '极简桌面收纳指南',
    type: 'content',
    text: '围绕桌面改造、收纳盒和低饱和色搭配的内容推荐样本。',
    tags: ['workspace', 'storage', 'minimal'],
    thumbnailGradient: 'from-tertiary/30 via-primary/15 to-surface-container-high',
    modalityStatus: {image: true, text: true, collaborative_id: true},
  },
  {
    id: 'KU-2031',
    title: '复古相机开箱',
    type: 'product',
    text: '包含相机外观、镜头细节与复古拍摄风格描述的商品样本。',
    tags: ['camera', 'retro', 'review'],
    thumbnailGradient: 'from-secondary/30 via-error/15 to-surface-container-high',
    modalityStatus: {image: true, text: true, collaborative_id: true},
  },
];

export const modalityEmbeddings: ShowcaseEmbeddingPreview[] = [
  {
    modality: 'image',
    label: '图像 embedding',
    description: '由封面/图片视觉特征压缩后的展示向量预览。',
    vector: [0.12, 0.42, -0.18, 0.36, 0.28, -0.09, 0.57, 0.21],
  },
  {
    modality: 'text',
    label: '文本 embedding',
    description: '由标题、描述和标签语义编码后的展示向量预览。',
    vector: [0.31, -0.16, 0.48, 0.22, -0.11, 0.39, 0.27, 0.08],
  },
  {
    modality: 'collaborative_id',
    label: '协同 ID embedding',
    description: '由用户-物品交互 ID 关系学习得到的展示向量预览。',
    vector: [-0.22, 0.18, 0.33, -0.07, 0.46, 0.24, -0.13, 0.41],
  },
];

export const serverViews: ShowcaseServerView[] = [
  {
    id: 'G1',
    name: '偏视觉信号解释视图',
    description: '展示解释视图，权重更偏向图像/封面信号，用于捕捉视觉风格相近的候选物品。',
    modalityWeights: {image: 0.58, text: 0.22, collaborative_id: 0.2},
    sampleSimilarItems: ['夜跑鞋测评', '反光运动夹克', '城市运动 vlog'],
  },
  {
    id: 'G2',
    name: '偏文本语义解释视图',
    description: '展示解释视图，权重更偏向标题、描述和标签语义，用于捕捉主题接近的候选物品。',
    modalityWeights: {image: 0.2, text: 0.57, collaborative_id: 0.23},
    sampleSimilarItems: ['桌面改造教程', '收纳工具合集', '效率生活指南'],
  },
  {
    id: 'G3',
    name: '偏协同关系解释视图',
    description: '展示解释视图，权重更偏向交互关系和 ID 表征，用于捕捉共现与相似用户偏好。',
    modalityWeights: {image: 0.18, text: 0.2, collaborative_id: 0.62},
    sampleSimilarItems: ['相机背带推荐', '镜头清洁套装', '胶片模拟教程'],
  },
  {
    id: 'G4',
    name: '综合融合解释视图',
    description: '展示解释视图，平衡三类模态信号，作为服务端下发给客户端 router 的综合候选视图。',
    modalityWeights: {image: 0.34, text: 0.33, collaborative_id: 0.33},
    sampleSimilarItems: ['轻量运动装备', '居家收纳好物', '复古影像内容'],
  },
];

export const clientCases: ShowcaseClientCase[] = [
  {
    clientId: 'Client-A',
    profileHint: '近期偏好运动装备和城市户外短视频，对视觉风格反应更强。',
    localHistory: ['城市夜跑装备短片', '轻量跑鞋测评', '运动手表快速上手', '夜间骑行反光外套'],
    routerWeights: {G1: 0.46, G2: 0.17, G3: 0.21, G4: 0.16},
    recommendationList: [
      {title: '雨夜跑步鞋实测', score: 0.91, reason: '视觉风格与近期夜跑内容接近', mainModality: '图像'},
      {title: '城市跑步路线 vlog', score: 0.87, reason: '与本地运动历史共现度高', mainModality: '协同 ID'},
      {title: '反光运动背心清单', score: 0.84, reason: '标签与装备兴趣一致', mainModality: '文本'},
    ],
  },
  {
    clientId: 'Client-B',
    profileHint: '关注桌面整理、效率工具和极简审美，文本语义与标签匹配更重要。',
    localHistory: ['极简桌面收纳指南', '机械键盘清洁教程', '一平米办公角改造', '低饱和收纳盒推荐'],
    routerWeights: {G1: 0.18, G2: 0.43, G3: 0.16, G4: 0.23},
    recommendationList: [
      {title: '桌面线缆隐藏方案', score: 0.93, reason: '文本主题与收纳历史高度匹配', mainModality: '文本'},
      {title: '极简办公灯开箱', score: 0.86, reason: '标签覆盖 workspace / minimal', mainModality: '文本'},
      {title: '白色桌搭灵感合集', score: 0.82, reason: '视觉风格与历史封面接近', mainModality: '图像'},
    ],
  },
  {
    clientId: 'Client-C',
    profileHint: '连续浏览影像设备、开箱和复古相机内容，协同关系带来的相似用户信号更强。',
    localHistory: ['复古相机开箱', '入门镜头推荐', '胶片滤镜参数', '相机包通勤测评'],
    routerWeights: {G1: 0.22, G2: 0.2, G3: 0.42, G4: 0.16},
    recommendationList: [
      {title: '旁轴相机街拍样片', score: 0.9, reason: '相似用户频繁共同浏览', mainModality: '协同 ID'},
      {title: '复古相机背带合集', score: 0.85, reason: '与相机开箱历史共现度高', mainModality: '协同 ID'},
      {title: '低光拍摄参数讲解', score: 0.8, reason: '文本语义关联影像学习主题', mainModality: '文本'},
    ],
  },
];

export const federatedBoundary: ShowcaseFederatedBoundary = {
  localKept: ['原始交互历史', '本地偏好分布', 'router 个性化参数', '未脱敏的用户侧行为序列'],
  uploaded: ['共享参数更新', '梯度摘要', '风险观测指标', '必要的训练统计摘要'],
  serverAggregates: ['客户端更新', '鲁棒防御处理结果', '全局参数更新', '下一轮下发的服务端多视图表示'],
};

export const attackDefenseCases: AttackDefenseCase[] = [
  {
    caseId: 'showcase-poisoning-robust-001',
    title: 'Client-A 投毒攻击与鲁棒防御展示案例',
    clientId: 'Client-A',
    dataset: datasetProfile.name,
    attackType: 'poisoning_attack / model_replacement showcase',
    defenseType: 'robust_defense / trimmed_mean showcase',
    maliciousRatio: 0.2,
    baselineMetrics: {recall50: 0.2481, ndcg50: 0.1856},
    attackMetrics: {recall50: 0.1624, ndcg50: 0.1192},
    defenseMetrics: {recall50: 0.2268, ndcg50: 0.1694},
    attackImpact: {recallDrop: 0.345, ndcgDrop: 0.358},
    recoveryRate: 0.751,
    recommendationComparison: {
      baselineRecommendations: [
        {
          rank: 1,
          itemTitle: '雨夜跑步鞋实测',
          score: 0.91,
          reason: '与客户端近期夜跑和装备历史稳定匹配。',
          mainModality: '图像',
          status: 'stable',
        },
        {
          rank: 2,
          itemTitle: '城市跑步路线 vlog',
          score: 0.87,
          reason: '与运动路线浏览历史和协同信号一致。',
          mainModality: '协同 ID',
          status: 'stable',
        },
        {
          rank: 3,
          itemTitle: '反光运动背心清单',
          score: 0.84,
          reason: '文本标签覆盖 running / wearable。',
          mainModality: '文本',
          status: 'stable',
        },
        {
          rank: 4,
          itemTitle: '轻量跑步腰包测评',
          score: 0.79,
          reason: '与装备类短视频主题接近。',
          mainModality: '文本',
          status: 'stable',
        },
      ],
      attackedRecommendations: [
        {
          rank: 1,
          itemTitle: '异常推广物品 X-17',
          score: 0.88,
          reason: '投毒更新抬高了与目标物品相关的异常表示。',
          mainModality: '协同 ID',
          status: 'injected',
          rankChange: 'new',
        },
        {
          rank: 2,
          itemTitle: '雨夜跑步鞋实测',
          score: 0.76,
          reason: '正常兴趣仍相关，但排名受到异常更新挤压。',
          mainModality: '图像',
          status: 'shifted',
          rankChange: '-1',
        },
        {
          rank: 3,
          itemTitle: '异常推广物品 Z-44',
          score: 0.73,
          reason: '目标物品被注入到相似用户候选集合中。',
          mainModality: '协同 ID',
          status: 'injected',
          rankChange: 'new',
        },
        {
          rank: 4,
          itemTitle: '城市跑步路线 vlog',
          score: 0.69,
          reason: '正常推荐被推低，但仍保留在 Top-K 范围。',
          mainModality: '协同 ID',
          status: 'shifted',
          rankChange: '-2',
        },
      ],
      defendedRecommendations: [
        {
          rank: 1,
          itemTitle: '雨夜跑步鞋实测',
          score: 0.86,
          reason: '鲁棒处理削弱异常更新后恢复到首位。',
          mainModality: '图像',
          status: 'recovered',
          rankChange: '+1',
        },
        {
          rank: 2,
          itemTitle: '城市跑步路线 vlog',
          score: 0.81,
          reason: '协同兴趣恢复，重新进入前二。',
          mainModality: '协同 ID',
          status: 'recovered',
          rankChange: '+2',
        },
        {
          rank: 3,
          itemTitle: '反光运动背心清单',
          score: 0.78,
          reason: '文本标签相关内容恢复到 Top-K。',
          mainModality: '文本',
          status: 'recovered',
          rankChange: 'return',
        },
        {
          rank: 4,
          itemTitle: '异常推广物品 X-17',
          score: 0.42,
          reason: '异常影响被裁剪和截尾处理压制，排名回落。',
          mainModality: '协同 ID',
          status: 'suppressed',
          rankChange: '-3',
        },
      ],
    },
    defenseTrace: {
      totalClients: 40,
      maliciousClients: 8,
      clippedClients: 6,
      filteredClients: 3,
      trimmedUpdates: 5,
      aggregationRule: 'trimmed_mean showcase aggregation',
      notes: [
        '根据更新范数和坐标分布识别异常方向。',
        '裁剪高幅度更新，降低模型替换类投毒的放大效果。',
        '截尾聚合压低异常客户端对全局表示的影响。',
      ],
    },
    note: '当前为 showcase 示例数据，用于解释投毒攻击与鲁棒防御链路；后续可替换为真实 FedVLR 导出的 artifacts。',
  },
];

export const deliverySummary: DeliverySummary = {
  systemSummary:
    'FedVLR-Frontend 当前展示首页、六层系统架构、数据与融合、客户端个性化、攻防靶场、实验结果和交付报告的选拔赛演示闭环。',
  modelSummary:
    '展示主线围绕服务端 G1-G4 多视图融合与客户端 router 个性化权重展开，强调不同客户端对多模态信号的差异化使用。',
  dataSummary:
    '展示数据采用 KU / Showcase 样本结构，包含图像、文本和协同 ID 三类模态占位，可替换为更完整的多模态数据集 artifacts。',
  securitySummary:
    '攻防展示聚焦投毒攻击、鲁棒防御和风险观测，说明异常更新如何影响推荐列表，以及鲁棒处理如何帮助恢复正常推荐。',
  metricsSummary:
    '核心展示指标为 Recall@50、NDCG@50、攻击降幅和防御恢复率，历史与对比摘要优先保持 tail mean 口径。',
  limitations: [
    '当前未正式实现差分隐私、同态加密、安全聚合。',
    '当前 showcase 页面部分为展示结构，不代表完整真实实验数据。',
    '真实训练、监控、结果读取仍以既有 API services 和后端导出文件为准。',
  ],
  nextSteps: [
    '接入真实 FedVLR 导出的 showcase artifacts。',
    '接入更完整多模态数据集，包括原始图片、文本、视频封面等。',
    '把攻防靶场与实验结果页的摘要卡绑定到真实 baseline / attack / defense 对比数据。',
  ],
};

export const showcaseData = {
  showcaseSampleNotice,
  datasetProfile,
  sampleItems,
  modalityEmbeddings,
  serverViews,
  clientCases,
  federatedBoundary,
  attackDefenseCases,
  deliverySummary,
};
