import type {CardItem, ChartPoint} from '../types/common';

export interface HomeHeroData {
  badge: string;
  title: string;
  subtitle: string;
  primaryAction: string;
  secondaryAction: string;
  backgroundImage: string;
}

export interface HomeOverviewNode {
  title: string;
  subtitle: string;
  detail: string;
  tone: 'primary' | 'secondary' | 'tertiary' | 'error' | 'success';
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
  overview: {
    title: '平台核心能力总览',
    description:
      '本平台以多模态联邦推荐为主体，在统一建模图像、文本与协同 ID 信息的基础上，引入投毒攻击、鲁棒防御与结果对比分析，形成从推荐建模到安全验证的一体化实验闭环。',
    nodes: [
      {
        title: '多模态输入',
        subtitle: '图像 / 文本 / 协同 ID',
        detail: '统一接收视觉内容、文本语义与交互协同信号，作为联邦推荐建模的多模态输入基础。',
        tone: 'primary',
      },
      {
        title: '服务端多视图融合',
        subtitle: '预融合多模态视图生成',
        detail: '服务端承担高开销的全局表征构建任务，预先生成多种可供下游路由使用的融合视图。',
        tone: 'secondary',
      },
      {
        title: '客户端个性化路由',
        subtitle: '结合本地交互历史进行细粒度加权',
        detail: '客户端利用本地交互行为自适应调整多视图权重，形成用户特定的个性化融合表示。',
        tone: 'tertiary',
      },
      {
        title: '联邦聚合与安全增强',
        subtitle: '投毒攻击 / 鲁棒防御 / 风险观测',
        detail: '在联邦更新链路中统一接入投毒攻击、鲁棒防御和风险观测模块，支撑可验证的安全实验。',
        tone: 'error',
      },
      {
        title: '实验输出与对比分析',
        subtitle: '结果分析 / 历史实验 / 对比分析',
        detail: '统一输出轮次结果、历史记录与多实验对比摘要，形成论文图示与答辩展示所需的数据闭环。',
        tone: 'success',
      },
    ] satisfies HomeOverviewNode[],
  },
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
