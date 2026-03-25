import type {ExperimentResult} from '../types/result';
import type {TrainConfig} from '../types/train';
import {buildTrainConfigSummary, defaultTrainConfig, formatAttackLabel, formatDefenseLabel} from './configuration';

const createResultConfigSummary = (config: TrainConfig) => ({
  ...buildTrainConfigSummary(config),
  dataset: config.dataset,
  model: config.model,
  clientCount: config.clientCount,
  clientSamplingRate: config.clientSamplingRate,
  totalRounds: config.totalRounds,
  learningRate: config.learningRate,
  localEpochs: config.advanced.localEpochs,
});

export const createExperimentResult = (
  taskId: string,
  config: TrainConfig = defaultTrainConfig,
  source: ExperimentResult['source'] = 'current-task',
  overrides: Partial<ExperimentResult> = {},
): ExperimentResult => {
  const configSummary = createResultConfigSummary(config);

  return {
    taskId,
    source,
    timestamp: overrides.timestamp ?? '2026-03-25 15:45',
    dataset: config.dataset,
    model: config.model,
    mode: config.mode,
    attackType: config.attackType,
    defenseType: config.defenseType,
    metrics: {
      recall10: 0.942,
      recall20: 0.936,
      recall50: 0.928,
      ndcg10: 0.885,
      ndcg20: 0.872,
      ndcg50: 0.861,
      accuracy: 0.9423,
      loss: 0.12,
      defenseScore: 94.2,
      convergenceRound: 82,
      ...overrides.metrics,
    },
    metricCards:
      overrides.metricCards ??
      [
        {label: 'Recall@10', value: '0.942', change: '+2.4%', tone: 'primary'},
        {label: 'NDCG@10', value: '0.885', change: '+1.8%', tone: 'secondary'},
        {label: '训练总时长', value: '2h 44m', change: '-12m', tone: 'neutral'},
        {label: '收敛轮次', value: '82', change: '稳定', tone: 'tertiary'},
      ],
    curves:
      overrides.curves ??
      {
        loss: {
          key: 'loss',
          label: 'Loss',
          color: '#81ecff',
          points: [
            {epoch: 0, value: 0.92},
            {epoch: 20, value: 0.61},
            {epoch: 40, value: 0.38},
            {epoch: 60, value: 0.24},
            {epoch: 80, value: 0.16},
            {epoch: 100, value: 0.12},
          ],
        },
        utility: [
          {
            key: 'defense',
            label: '防御方案',
            color: '#81ecff',
            points: [
              {epoch: 0, value: 0.12},
              {epoch: 20, value: 0.42},
              {epoch: 40, value: 0.65},
              {epoch: 60, value: 0.81},
              {epoch: 80, value: 0.92},
              {epoch: 100, value: 0.94},
            ],
          },
          {
            key: 'baseline',
            label: '基线方案',
            color: '#a5acb4',
            points: [
              {epoch: 0, value: 0.1},
              {epoch: 20, value: 0.35},
              {epoch: 40, value: 0.58},
              {epoch: 60, value: 0.72},
              {epoch: 80, value: 0.85},
              {epoch: 100, value: 0.91},
            ],
          },
        ],
      },
    configSummary,
    summaryText:
      overrides.summaryText ??
      {
        headline: '本次实验验证了防御模块在非 IID 数据场景下的有效性。',
        conclusion: `在 ${formatAttackLabel(config.attackType, config.attackEnabled)} 场景中，${formatDefenseLabel(config.defenseType, config.defenseEnabled)} 将 Recall@10 提升至 0.942。`,
        securityAssessment: '系统通过异常检测与鲁棒聚合有效抑制恶意更新，攻击影响被控制在较低范围内。',
        recommendation: '建议下一阶段追加差分隐私强度测试，进一步平衡精度与隐私保护收益。',
      },
    defenseEfficiencyScore: overrides.defenseEfficiencyScore ?? 94.2,
    defenseEfficiencyLabel: overrides.defenseEfficiencyLabel ?? '卓越',
    referenceComparison:
      overrides.referenceComparison ??
      {
        title: '参考实验对比',
        description: '相较历史基线实验，当前实验在 Recall@10 上提升约 8.4%，同时保持较低 loss。',
      },
  };
};

const historyFallbackConfig: TrainConfig = {
  ...defaultTrainConfig,
  model: 'fedavg-resnet',
  mode: 'defense',
  attackType: 'label-flipping',
  defenseType: 'trimmed-mean',
};

export const mockAnalysisData = {
  currentResult: createExperimentResult('task-completed-demo', defaultTrainConfig, 'current-task'),
  historyFallback: createExperimentResult('history-exp-defense', historyFallbackConfig, 'history', {
    timestamp: '2026-03-24 21:18',
    summaryText: {
      headline: '当前任务尚未产出可视化结果，已回退到最近一次完成的历史实验。',
      conclusion: '历史实验显示防御组相比攻击组在 NDCG@10 上有明显恢复。',
      securityAssessment: 'Trimmed Mean 在 20% 投毒比例下仍保持稳定聚合结果。',
      recommendation: '可继续运行当前任务，或在历史页选择已完成实验查看详情。',
    },
  }),
  emptyResult: null as ExperimentResult | null,
  emptyState: {
    title: '暂无可分析的实验结果',
    description: '请先启动训练任务，或从历史实验中选择一条已完成记录查看分析。',
  },
};
