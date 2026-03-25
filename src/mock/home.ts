import type {CardItem, ChartPoint} from '../types/common';

export interface HomeHeroData {
  badge: string;
  title: string;
  subtitle: string;
  primaryAction: string;
  secondaryAction: string;
  backgroundImage: string;
}

export interface HomeFlowNode {
  title: string;
  subtitle: string;
}

export interface HomeHighlight {
  title: string;
  description: string;
  tone: 'primary' | 'error' | 'tertiary';
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
    badge: '下一代联邦推荐安全实验平台',
    title: '联邦智能守护：多模态推荐安全实验平台',
    subtitle:
      '面向对抗性攻防的去中心化学习范式，支持联邦训练、攻击模拟、防御评估与对比分析的一体化展示。',
    primaryAction: '启动训练控制台',
    secondaryAction: '查看技术架构',
    backgroundImage:
      'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2000&auto=format&fit=crop',
  } satisfies HomeHeroData,
  flow: {
    clients: [
      {title: '联邦客户端 A', subtitle: '本地训练与梯度上传'},
      {title: '联邦客户端 B', subtitle: '异构数据与个性化更新'},
      {title: '联邦客户端 N', subtitle: '跨机构安全协同'},
    ] satisfies HomeFlowNode[],
    aggregator: {title: '聚合服务器', subtitle: '全局模型参数聚合'},
    attack: {title: '红军攻击模拟', subtitle: '标签翻转 / 模型投毒 / 后门注入'},
    defense: {title: '绿军防御加固', subtitle: '异常检测 / 安全聚合 / 差分隐私'},
    output: {
      title: '实时评估输出',
      scoreLabel: '效能评分',
      scoreValue: '98.4%',
      latencyLabel: '防御延迟',
      latencyValue: '12ms',
    },
  },
  highlights: [
    {
      title: '联邦学习框架',
      description:
        '支持 FedAvg、FedProx、MMFedRAP 等多种训练范式，便于复现实验并叠加安全增强模块。',
      tone: 'primary',
    },
    {
      title: '攻击模拟',
      description:
        '支持标签翻转、后门注入、梯度噪声和 Sybil 等典型攻击场景，方便比赛展示攻防过程。',
      tone: 'error',
    },
    {
      title: '防御评估',
      description:
        '从鲁棒性、精度、效率和隐私预算多维度分析防御收益，服务后续真实后端接入。',
      tone: 'tertiary',
    },
  ] satisfies HomeHighlight[],
  snapshotMetrics: [
    {key: 'recall20', title: 'Recall @ 20', value: '0.2481', trend: '+12.4% vs Baseline', tone: 'tertiary'},
    {key: 'ndcg20', title: 'NDCG @ 20', value: '0.1856', trend: '+8.7% vs Baseline', tone: 'tertiary'},
  ] satisfies HomeSnapshotMetric[],
  snapshotChart: [
    {label: 'Baseline', value: 70},
    {label: 'Attack', value: 35},
    {label: 'Defense', value: 65},
  ] satisfies ChartPoint[],
  capabilities: [
    {label: '实验模式', value: '基线 / 攻击 / 防御 / 对比'},
    {label: '支持数据', value: '视觉 / 推荐 / 文本'},
    {label: '安全模块', value: '攻击模拟 / 鲁棒聚合 / 安全聚合 / DP'},
  ] satisfies HomeCapability[],
};
