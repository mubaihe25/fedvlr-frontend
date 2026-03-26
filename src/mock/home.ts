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
    badge: '联邦训练与攻防评估',
    title: '联邦智能守护：多模态推荐安全实验平台',
    subtitle:
      '面向联邦推荐场景的实验展示与控制平台，支持联邦训练、攻击模拟、防御评估与结果对比分析。',
    primaryAction: '启动训练控制台',
    secondaryAction: '查看系统架构',
    backgroundImage:
      'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2000&auto=format&fit=crop',
  } satisfies HomeHeroData,
  flow: {
    clients: [
      {title: '联邦客户端 A', subtitle: '本地训练与更新上传'},
      {title: '联邦客户端 B', subtitle: '多模态特征建模与本地更新'},
      {title: '联邦客户端 N', subtitle: '多客户端协同参与训练'},
    ] satisfies HomeFlowNode[],
    aggregator: {title: '聚合服务器', subtitle: '全局更新聚合与模型同步'},
    attack: {title: '攻击模拟模块', subtitle: '标签翻转 / 模型投毒 / 后门注入'},
    defense: {title: '防御评估模块', subtitle: '异常检测 / 安全聚合 / 差分隐私'},
    output: {
      title: '结果评估输出',
      scoreLabel: 'Recall@20',
      scoreValue: '98.4%',
      latencyLabel: '防御延迟',
      latencyValue: '12ms',
    },
  },
  highlights: [
    {
      title: '联邦学习框架',
      description:
        '支持 FedAvg、FedProx、MMFedRAP 等训练范式，便于复现实验流程并接入安全增强模块。',
      tone: 'primary',
    },
    {
      title: '攻击模拟',
      description:
        '支持标签翻转、后门注入、模型投毒与 Sybil 等典型攻击场景，便于构建可对比的攻防实验链路。',
      tone: 'error',
    },
    {
      title: '防御评估',
      description:
        '从鲁棒性、推荐性能、效率与隐私预算等维度评估防御效果，支持多场景实验分析。',
      tone: 'tertiary',
    },
  ] satisfies HomeHighlight[],
  snapshotMetrics: [
    {key: 'recall20', title: 'Recall@20', value: '0.2481', trend: '基线场景下的代表性结果', tone: 'tertiary'},
    {key: 'ndcg20', title: 'NDCG@20', value: '0.1856', trend: '排序质量的代表性结果', tone: 'tertiary'},
  ] satisfies HomeSnapshotMetric[],
  snapshotChart: [
    {label: '基线', value: 70},
    {label: '攻击', value: 35},
    {label: '防御', value: 65},
  ] satisfies ChartPoint[],
  capabilities: [
    {label: '实验模式', value: '基线 / 攻击 / 攻防对比'},
    {label: '支持数据', value: '视觉 / 文本 / 交互'},
    {label: '安全模块', value: '攻击模拟 / 鲁棒聚合 / 安全聚合 / 差分隐私'},
  ] satisfies HomeCapability[],
};
