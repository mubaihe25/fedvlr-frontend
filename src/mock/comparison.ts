import type {ComparisonResult} from '../types/result';

export const mockComparisonData = {
  emptyState: {
    title: '暂无可对比的实验组合',
    description: '请先从历史实验中添加至少一条记录，或直接查看默认攻防对比样例。',
  },
  defaultComparison: {
    groups: [
      {
        id: 'baseline-group',
        taskId: 'baseline-task',
        name: '基线组',
        status: 'Optimal',
        accent: 'neutral',
        attackLabel: '未启用攻击',
        defenseLabel: '未启用防御',
        metrics: {
          recall10: 0.921,
          recall20: 0.904,
          recall50: 0.888,
          ndcg10: 0.851,
          ndcg20: 0.836,
          ndcg50: 0.824,
          loss: 0.12,
        },
      },
      {
        id: 'attack-group',
        taskId: 'attack-task',
        name: '攻击组',
        status: 'Degraded',
        accent: 'danger',
        attackLabel: '标签翻转（20%）',
        defenseLabel: '未启用防御',
        metrics: {
          recall10: 0.654,
          recall20: 0.618,
          recall50: 0.582,
          ndcg10: 0.521,
          ndcg20: 0.507,
          ndcg50: 0.488,
          loss: 0.45,
        },
      },
      {
        id: 'defense-group',
        taskId: 'defense-task',
        name: '防御组',
        status: 'Restored',
        accent: 'tertiary',
        attackLabel: '标签翻转（20%）',
        defenseLabel: 'Cyber-Shield',
        metrics: {
          recall10: 0.942,
          recall20: 0.926,
          recall50: 0.914,
          ndcg10: 0.885,
          ndcg20: 0.872,
          ndcg50: 0.861,
          loss: 0.14,
        },
      },
    ],
    summary: '防御组已基本恢复到基线性能水平，并显著优于受攻击模型。',
    findings: [
      '攻击组在 Recall@10 与 NDCG@10 上均出现明显下降。',
      '防御组在保持较低 loss 的同时，恢复了主要推荐指标。',
      '对比结果适合作为比赛展示中的攻防恢复示例。',
    ],
    metricComparison: [
      {name: 'Baseline', recall: 0.921, ndcg: 0.851, loss: 0.12},
      {name: 'Attack', recall: 0.654, ndcg: 0.521, loss: 0.45},
      {name: 'Defense', recall: 0.942, ndcg: 0.885, loss: 0.14},
    ],
    configDiff: [
      {label: '算法模型', baseline: 'FedAvg', attack: 'FedAvg', defense: 'FedAvg'},
      {label: '攻击策略', baseline: '无', attack: '标签翻转（20%）', defense: '标签翻转（20%）'},
      {label: '防御机制', baseline: '无', attack: '无', defense: 'Cyber-Shield v2'},
      {label: '隐私强度', baseline: '∞', attack: '∞', defense: '2.5'},
    ],
    stages: [
      {stage: '阶段 1：初始收敛', status: 'Stable', tone: 'tertiary'},
      {stage: '阶段 2：攻击注入', status: 'Detected', tone: 'danger'},
      {stage: '阶段 3：防御激活', status: 'Active', tone: 'primary'},
      {stage: '阶段 4：恢复稳定', status: 'Reached', tone: 'tertiary'},
    ],
  } satisfies ComparisonResult,
};
