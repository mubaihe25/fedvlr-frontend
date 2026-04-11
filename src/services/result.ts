import {mockAnalysisData} from '../mock/analysis';
import {apiGet} from './api';
import {simulateRequest} from './mockAdapter';
import {mockStore} from './mockStore';
import type {
  ComparisonResult,
  ExperimentResult,
  ShowcaseComparisonItem,
  ShowcaseComparisonResponse,
} from '../types/result';

export const getResult = async (taskId: string): Promise<ExperimentResult | null> => {
  return simulateRequest(() => {
    if (!taskId) {
      return null;
    }

    return mockStore.getResult(taskId);
  });
};

export const getComparisonResult = async (taskIds?: string[]): Promise<ComparisonResult> => {
  if (taskIds && taskIds.length >= 2) {
    return simulateRequest(() => ({
      ...mockStore.buildComparisonFromTaskIds(taskIds),
      dataSource: 'history',
      dataSourceLabel: '历史实验组合',
    }));
  }

  try {
    const response = await apiGet<ShowcaseComparisonResponse>('/showcase/comparison');
    if (!response.items?.length) {
      throw new Error('Showcase comparison response is empty.');
    }

    return mapShowcaseComparison(response);
  } catch (error) {
    const fallback = await simulateRequest(() => mockStore.getDefaultComparison());
    return {
      ...fallback,
      dataSource: 'mock',
      dataSourceLabel: 'Mock 兜底数据',
      fallbackReason: error instanceof Error ? error.message : 'ShowcaseV1 对比数据加载失败。',
    };
  }
};

const scenarioOrder = ['baseline', 'attack_only_sign_flip', 'attack_and_defense_clip'];

const scenarioMeta: Record<
  string,
  {
    name: string;
    status: string;
    accent: ComparisonResult['groups'][number]['accent'];
    attackLabel: string;
    defenseLabel: string;
    stageStatus: string;
  }
> = {
  baseline: {
    name: '正常基线',
    status: 'Baseline',
    accent: 'neutral',
    attackLabel: '未启用',
    defenseLabel: '未启用',
    stageStatus: '正常基线',
  },
  attack_only_sign_flip: {
    name: '攻击组',
    status: 'Attacked',
    accent: 'danger',
    attackLabel: 'SignFlipAttack',
    defenseLabel: '未启用',
    stageStatus: '符号翻转攻击',
  },
  attack_and_defense_clip: {
    name: '攻防对照组',
    status: 'Clipped',
    accent: 'tertiary',
    attackLabel: 'ClientUpdateScaleAttack',
    defenseLabel: 'NormClipDefense',
    stageStatus: '范数裁剪防御',
  },
};

const orderedShowcaseItems = (items: ShowcaseComparisonItem[]) =>
  [...items].sort((left, right) => {
    const leftIndex = scenarioOrder.indexOf(left.scenario);
    const rightIndex = scenarioOrder.indexOf(right.scenario);
    return (leftIndex === -1 ? 99 : leftIndex) - (rightIndex === -1 ? 99 : rightIndex);
  });

const asMetric = (value?: number | null) => (typeof value === 'number' && Number.isFinite(value) ? value : 0);

const listLabel = (values?: string[]) => (values?.length ? values.join(', ') : '未启用');

const getScenarioMeta = (item: ShowcaseComparisonItem, index: number) =>
  scenarioMeta[item.scenario] ?? {
    name: item.scenario || `实验 ${index + 1}`,
    status: item.experiment_mode ?? 'Compared',
    accent: index === 0 ? 'neutral' : index === 1 ? 'danger' : 'tertiary',
    attackLabel: listLabel(item.active_attacks),
    defenseLabel: listLabel(item.active_defenses),
    stageStatus: item.experiment_mode ?? '已加载',
  };

const mapShowcaseComparison = (response: ShowcaseComparisonResponse): ComparisonResult => {
  const items = orderedShowcaseItems(response.items).slice(0, 3);
  const groups = items.map((item, index) => {
    const meta = getScenarioMeta(item, index);
    const recall20 = asMetric(item.recall20);
    const ndcg20 = asMetric(item.ndcg20);
    const loss = asMetric(item.loss);

    return {
      id: item.scenario || `showcase-${index + 1}`,
      taskId: item.scenario || `showcase-${index + 1}`,
      name: meta.name,
      status: meta.status,
      accent: meta.accent,
      attackLabel: listLabel(item.active_attacks) || meta.attackLabel,
      defenseLabel: listLabel(item.active_defenses) || meta.defenseLabel,
      metrics: {
        recall10: recall20,
        recall20,
        recall50: recall20,
        ndcg10: ndcg20,
        ndcg20,
        ndcg50: ndcg20,
        loss,
      },
    };
  });

  const findItem = (scenario: string) => items.find((item) => item.scenario === scenario);
  const baseline = findItem('baseline');
  const attack = findItem('attack_only_sign_flip');
  const defense = findItem('attack_and_defense_clip');

  return {
    groups,
    summary:
      'ShowcaseV1 展示版对比已接入真实 API 数据，覆盖正常基线、攻击退化与攻防约束三组正式实验。',
    findings: items.map((item, index) => {
      const meta = getScenarioMeta(item, index);
      return item.display_note ?? `${meta.name}：Recall@20 ${(asMetric(item.recall20) * 100).toFixed(2)}%，NDCG@20 ${(asMetric(item.ndcg20) * 100).toFixed(2)}%。`;
    }),
    metricComparison: groups.map((group) => ({
      name: group.name,
      recall: group.metrics.recall20,
      ndcg: group.metrics.ndcg20,
      loss: group.metrics.loss ?? 0,
    })),
    configDiff: [
      {
        label: '实验场景',
        baseline: baseline?.scenario ?? '-',
        attack: attack?.scenario ?? '-',
        defense: defense?.scenario ?? '-',
      },
      {
        label: '攻击模块',
        baseline: listLabel(baseline?.active_attacks),
        attack: listLabel(attack?.active_attacks),
        defense: listLabel(defense?.active_attacks),
      },
      {
        label: '防御模块',
        baseline: listLabel(baseline?.active_defenses),
        attack: listLabel(attack?.active_defenses),
        defense: listLabel(defense?.active_defenses),
      },
      {
        label: '恶意客户端',
        baseline: `${baseline?.malicious_client_count ?? 0}`,
        attack: `${attack?.malicious_client_count ?? 0}`,
        defense: `${defense?.malicious_client_count ?? 0}`,
      },
      {
        label: '被攻击 / 被裁剪',
        baseline: `${baseline?.attacked_client_count ?? 0} / ${baseline?.clipped_client_count ?? 0}`,
        attack: `${attack?.attacked_client_count ?? 0} / ${attack?.clipped_client_count ?? 0}`,
        defense: `${defense?.attacked_client_count ?? 0} / ${defense?.clipped_client_count ?? 0}`,
      },
    ],
    stages: items.map((item, index) => {
      const meta = getScenarioMeta(item, index);
      return {
        stage: `${index + 1}. ${meta.name}`,
        status: meta.stageStatus,
        tone: meta.accent,
      };
    }),
    dataSource: 'api',
    dataSourceLabel: 'ShowcaseV1 真实 API 数据',
    updatedAt: response.updated_at ?? undefined,
  };
};

export const getHistoryFallbackResult = async (): Promise<ExperimentResult> => {
  return simulateRequest(() => mockAnalysisData.historyFallback);
};
