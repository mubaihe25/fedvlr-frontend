import type {CardItem, ChartPoint} from '../types/common';

export interface HomeHeroData {
  badge: string;
  title: string;
  subtitle: string;
  primaryAction: string;
  secondaryAction: string;
  backgroundImage: string;
}

export interface HomePipelineInput {
  title: string;
  subtitle: string;
  tone: 'primary' | 'secondary' | 'tertiary';
}

export interface HomePipelineView {
  title: string;
  subtitle: string;
  tone: 'primary' | 'secondary' | 'tertiary' | 'success';
}

export interface HomePipelineClient {
  title: string;
  subtitle: string;
  emphasis: string;
  focus: 'visual' | 'text' | 'collab';
}

export interface HomePipelineData {
  title: string;
  subtitle: string;
  inputs: HomePipelineInput[];
  core: {
    title: string;
    subtitle: string;
  };
  views: HomePipelineView[];
  clients: HomePipelineClient[];
  security: {
    title: string;
    subtitle: string;
    items: string[];
  };
  aggregator: {
    title: string;
    subtitle: string;
  };
  output: {
    title: string;
    subtitle: string;
    experimentModes: string[];
    metricLabels: string[];
  };
}

export interface HomeMechanismCard {
  title: string;
  description: string;
  tone: 'primary' | 'secondary' | 'tertiary' | 'error';
}

export interface HomeFusionPersona {
  title: string;
  description: string;
  tone: 'primary' | 'secondary' | 'tertiary' | 'success';
}

export interface HomeSnapshotMetric extends CardItem {
  key: string;
}

export interface HomeCapability {
  label: string;
  value: string;
}

export const mockHomeData = {
  hero: {
    badge: '联邦训练与攻防评估',
    title: '联邦智能守护：多模态推荐安全实验平台',
    subtitle:
      '面向联邦推荐场景的实验展示与控制平台，支持联邦训练、攻击模拟、防御评估与结果对比分析。',
    primaryAction: '启动训练控制台',
    secondaryAction: '查看系统架构',
    backgroundImage:
      'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2000&auto=format&fit=crop',
  } satisfies HomeHeroData,
  pipeline: {
    title: '核心技术链路演示',
    subtitle: '从多模态表征到安全联邦聚合的动态实验链路',
    inputs: [
      {title: '图像', subtitle: '视觉内容输入', tone: 'primary'},
      {title: '文本', subtitle: '语义描述输入', tone: 'secondary'},
      {title: '协同 ID', subtitle: '交互协同信号', tone: 'tertiary'},
    ],
    core: {
      title: '多模态嵌入核心',
      subtitle: '共享多模态表示',
    },
    views: [
      {title: '视觉增强视图', subtitle: '突出视觉信息', tone: 'primary'},
      {title: '文本增强视图', subtitle: '突出语义信息', tone: 'secondary'},
      {title: '协同融合视图', subtitle: '突出交互关系', tone: 'tertiary'},
      {title: '综合预融合视图', subtitle: '统一全局表示', tone: 'success'},
    ],
    clients: [
      {title: '客户端 A', subtitle: '视觉偏好更强', emphasis: '视觉权重更高', focus: 'visual'},
      {title: '客户端 B', subtitle: '文本依赖更高', emphasis: '文本视图优先', focus: 'text'},
      {title: '客户端 C', subtitle: '协同信号更敏感', emphasis: '协同权重更强', focus: 'collab'},
    ],
    security: {
      title: '安全增强层',
      subtitle: '异常更新削弱、过滤与观测',
      items: ['投毒攻击', '鲁棒防御', '风险观测'],
    },
    aggregator: {
      title: '联邦聚合中心',
      subtitle: '鲁棒聚合与全局同步',
    },
    output: {
      title: '实验输出与对比分析',
      subtitle: '统一输出关键场景结果摘要',
      experimentModes: ['基线', '投毒', '攻防对比'],
      metricLabels: ['Recall@50', 'NDCG@50'],
    },
  } satisfies HomePipelineData,
  mechanisms: [
    {
      title: '多模态信息嵌入',
      description:
        '统一利用图像特征、文本语义与协同 ID 信号，构建面向推荐任务的多模态表示基础。',
      tone: 'primary',
    },
    {
      title: '服务端多视图融合',
      description:
        '在服务端生成多种预融合视图，承担高开销的全局表征构建任务，提升多模态信息利用效率。',
      tone: 'secondary',
    },
    {
      title: '客户端个性化路由',
      description:
        '客户端结合本地交互历史，自适应调整不同融合视图的权重，形成用户特定偏好表示。',
      tone: 'tertiary',
    },
    {
      title: '安全增强实验链路',
      description:
        '在联邦更新链路中接入投毒攻击、鲁棒防御与风险观测机制，构建可配置、可对比、可追踪的攻防实验闭环。',
      tone: 'error',
    },
  ] satisfies HomeMechanismCard[],
  fusionRationale: {
    title: '为什么需要双层融合机制？',
    description:
      '不同用户在推荐决策中，对视觉内容、文本语义和协同信号的依赖程度并不相同。统一的固定融合方式难以适应联邦场景下的偏好异质性，因此平台采用“服务端多视图生成 + 客户端本地个性化细化”的双层机制，以实现更细粒度的多模态偏好建模。',
    personas: [
      {title: '用户 A', description: '视觉偏好更强', tone: 'primary'},
      {title: '用户 B', description: '文本依赖更高', tone: 'secondary'},
      {title: '用户 C', description: '协同信号更敏感', tone: 'tertiary'},
      {title: '输出', description: '个性化融合表示', tone: 'success'},
    ] satisfies HomeFusionPersona[],
  },
  snapshotMetrics: [
    {key: 'recall50', title: 'Recall@50', value: '0.2481', trend: '基线场景下的代表性结果', tone: 'tertiary'},
    {key: 'ndcg50', title: 'NDCG@50', value: '0.1856', trend: '排序质量的代表性结果', tone: 'tertiary'},
  ] satisfies HomeSnapshotMetric[],
  snapshotChart: [
    {label: '基线', value: 72},
    {label: '投毒', value: 38},
    {label: '攻防对比', value: 64},
  ] satisfies ChartPoint[],
  capabilities: [
    {label: '实验模式', value: '基线 / 攻击 / 攻防对比'},
    {label: '多模态信号', value: '图像 / 文本 / 协同 ID'},
    {label: '安全能力', value: '投毒攻击 / 鲁棒防御 / 风险观测'},
  ] satisfies HomeCapability[],
};
