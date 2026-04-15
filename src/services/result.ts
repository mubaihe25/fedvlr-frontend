import {mockAnalysisData} from '../mock/analysis';
import {buildTrainConfigSummary, defaultTrainConfig} from '../mock/configuration';
import {formatAttackSemanticGroups, formatModuleChain, getModuleLabel, getScenarioLabel} from '../lib/experimentLabels';
import type {AttackTaxonomyMap} from '../lib/experimentLabels';
import {apiGet} from './api';
import {simulateRequest} from './mockAdapter';
import {mockStore} from './mockStore';
import type {
  ExperimentResultDetail,
  ExperimentResultResponse,
  ExperimentResultRoundMetric,
  ExperimentRoundSummary,
  ExperimentSummaryDetail,
  ExperimentSummaryListItem,
  ExperimentSummaryListResponse,
  ExperimentSummaryResponse,
} from '../types/history';
import type {
  AnalysisResultRequest,
  AnalysisResultResponse,
  ComparisonResult,
  CurveSeries,
  ExperimentResult,
  ShowcaseComparisonItem,
  ShowcaseComparisonResponse,
} from '../types/result';
import type {AttackType, DefenseType, ExperimentMode, LaunchExperimentRecord, TrainConfig} from '../types/train';

export const getResult = async (taskId: string): Promise<ExperimentResult | null> => {
  return simulateRequest(() => {
    if (!taskId) {
      return null;
    }

    return mockStore.getResult(taskId);
  });
};

const extractExperimentKeyFromTaskId = (taskId?: string | null) =>
  taskId?.startsWith('api::') ? taskId.slice(5) : null;

const normalizePathToken = (value?: string | null) => value?.replace(/\\/g, '/').split('/').filter(Boolean).pop() ?? '';

const isValidationLaunch = (record: LaunchExperimentRecord) =>
  Boolean(
    record.options.validateOnly ||
      record.options.dryRun ||
      record.response.launch_mode === 'validate_only' ||
      record.response.launch_mode === 'dry_run',
  );

const listLabel = (values?: string[]) => (values?.length ? values.map((value) => getModuleLabel(value).title).join('、') : '未启用');

const mapExperimentMode = (experimentMode?: string | null): ExperimentMode => {
  switch (experimentMode) {
    case 'attack_only':
      return 'attack';
    case 'defense_only':
      return 'defense';
    case 'attack_and_defense':
      return 'comparison';
    case 'baseline':
    case 'privacy_observation':
    default:
      return 'baseline';
  }
};

const mapAttackType = (activeAttacks?: string[]): AttackType => {
  const attackName = activeAttacks?.[0];
  if (!attackName) {
    return 'none';
  }

  if (
    attackName === 'client_update_scale' ||
    attackName === 'sign_flip' ||
    attackName === 'model_replacement' ||
    attackName === 'client_preference_leakage_probe'
  ) {
    return attackName;
  }

  return 'gradient-noise';
};

const mapDefenseType = (activeDefenses?: string[]): DefenseType => {
  const defenseName = activeDefenses?.[0];
  if (!defenseName) {
    return 'none';
  }

  if (defenseName === 'norm_clip' || defenseName === 'update_filter' || defenseName === 'trimmed_mean' || defenseName === 'client_update_anomaly') {
    return defenseName;
  }

  return 'anomaly-detection';
};

const asNumber = (value: unknown, fallback = 0) =>
  typeof value === 'number' && Number.isFinite(value) ? value : fallback;

const formatMetric = (value: number | undefined, digits = 3) =>
  typeof value === 'number' && Number.isFinite(value) ? value.toFixed(digits) : '暂无';

const getMaxNestedMetricCount = (
  rounds: ExperimentResultRoundMetric[],
  bucket: 'attack_metrics' | 'defense_metrics',
  fields: string[],
) =>
  rounds.reduce((maxValue, round) => {
    const metrics = round.extra?.[bucket];
    if (!metrics) {
      return maxValue;
    }

    const roundMax = Object.values(metrics).reduce((valueMax, value) => {
      const record = value as Record<string, unknown>;
      const candidate = fields.reduce((fieldMax, field) => Math.max(fieldMax, Number(record[field] ?? 0)), 0);
      return Number.isFinite(candidate) ? Math.max(valueMax, candidate) : valueMax;
    }, 0);

    return Math.max(maxValue, roundMax);
  }, 0);

const getMaxRoundField = (rounds: ExperimentRoundSummary[], field: keyof ExperimentRoundSummary) =>
  rounds.reduce((maxValue, round) => Math.max(maxValue, Number(round[field] ?? 0)), 0);

const countPrivacyObservationRounds = (rounds: ExperimentResultRoundMetric[]) =>
  rounds.filter((round) => {
    const outputs = round.extra?.privacy_metric_outputs;
    return outputs && Object.keys(outputs).length > 0;
  }).length;

const buildCurve = (
  key: string,
  label: string,
  color: string,
  rounds: Array<{round_id?: number | null; avg_train_loss?: number | null; valid_score?: number | null; test_score?: number | null}>,
  field: 'avg_train_loss' | 'valid_score' | 'test_score',
): CurveSeries | null => {
  const points = rounds
    .filter((round) => typeof round[field] === 'number')
    .map((round, index) => ({
      epoch: Number(round.round_id ?? index + 1),
      value: Number(round[field] ?? 0),
    }));

  if (!points.length) {
    return null;
  }

  return {key, label, color, points};
};

const buildConfigSummary = (
  model: string,
  dataset: string,
  experimentMode: string | null | undefined,
  activeAttacks: string[],
  activeDefenses: string[],
  activePrivacyMetrics: string[],
  totalRounds: number,
  attackTaxonomy?: AttackTaxonomyMap,
) => {
  const mode = mapExperimentMode(experimentMode);
  const config: TrainConfig = {
    ...defaultTrainConfig,
    model,
    dataset,
    mode,
    attackEnabled: activeAttacks.length > 0,
    attackType: mapAttackType(activeAttacks),
    defenseEnabled: activeDefenses.length > 0,
    defenseType: mapDefenseType(activeDefenses),
    totalRounds: totalRounds || defaultTrainConfig.totalRounds,
  };

  const attackGroups = formatAttackSemanticGroups(activeAttacks, attackTaxonomy);

  return {
    ...buildTrainConfigSummary(config),
    datasetLabel: dataset,
    modelLabel: model,
    modeLabel: getScenarioLabel(experimentMode ?? mode).title,
    attackLabel: attackGroups.poisoningLabel,
    poisoningAttackLabel: attackGroups.poisoningLabel,
    privacyProbeLabel: attackGroups.privacyProbeLabel,
    defenseLabel: listLabel(activeDefenses),
    privacyLevel: listLabel(activePrivacyMetrics),
    observationLabel: listLabel(activePrivacyMetrics),
    estimatedDuration: '后端未返回',
    resourceEstimate: '后端未返回',
    topologyPreview: '后端结果文件记录',
    dataset,
    model,
    clientCount: defaultTrainConfig.clientCount,
    clientSamplingRate: defaultTrainConfig.clientSamplingRate,
    totalRounds: totalRounds || defaultTrainConfig.totalRounds,
    learningRate: defaultTrainConfig.learningRate,
    localEpochs: defaultTrainConfig.advanced.localEpochs,
  };
};

const buildRealResult = (
  base: {
    experimentKey: string;
    experimentId?: string | null;
    fileName?: string;
    model?: string | null;
    dataset?: string | null;
    experimentMode?: string | null;
    scenarioTags?: string[];
    activeAttacks?: string[];
    attackTaxonomy?: AttackTaxonomyMap;
    activeDefenses?: string[];
    activePrivacyMetrics?: string[];
    finalEval?: ExperimentSummaryDetail['final_eval'];
    maliciousClientSummary?: ExperimentSummaryDetail['malicious_client_summary'];
    roundSummaries?: ExperimentRoundSummary[];
    roundMetrics?: ExperimentResultRoundMetric[];
    source: ExperimentResult['source'];
    dataSourceLabel: string;
  },
): ExperimentResult => {
  const model = base.model ?? defaultTrainConfig.model;
  const dataset = base.dataset ?? defaultTrainConfig.dataset;
  const activeAttacks = base.activeAttacks ?? [];
  const activeDefenses = base.activeDefenses ?? [];
  const activePrivacyMetrics = base.activePrivacyMetrics ?? [];
  const experimentMode = base.experimentMode ?? 'baseline';
  const roundSummaries = base.roundSummaries ?? [];
  const roundMetrics = base.roundMetrics ?? [];
  const totalRounds = roundMetrics.length || roundSummaries.length || defaultTrainConfig.totalRounds;
  const recall20 = asNumber(base.finalEval?.recall20);
  const ndcg20 = asNumber(base.finalEval?.ndcg20);
  const loss = asNumber(base.finalEval?.loss);
  const maliciousCount =
    asNumber(base.maliciousClientSummary?.unique_malicious_client_count) ||
    Math.max(getMaxRoundField(roundSummaries, 'malicious_client_count'), ...roundMetrics.map((round) => asNumber(round.malicious_client_count)));
  const attackedCount =
    getMaxRoundField(roundSummaries, 'attacked_client_count') ||
    getMaxNestedMetricCount(roundMetrics, 'attack_metrics', ['attacked_client_count']);
  const clippedCount =
    getMaxRoundField(roundSummaries, 'clipped_client_count') ||
    getMaxNestedMetricCount(roundMetrics, 'defense_metrics', ['clipped_client_count']);
  const filteredCount = getMaxNestedMetricCount(roundMetrics, 'defense_metrics', ['filtered_client_count']);
  const trimmedCount = getMaxNestedMetricCount(roundMetrics, 'defense_metrics', ['effective_trim_count']);
  const privacyRounds = countPrivacyObservationRounds(roundMetrics);
  const allRounds = roundMetrics.length
    ? roundMetrics
    : roundSummaries.map((round) => ({
        round_id: round.round_id,
        avg_train_loss: round.avg_train_loss,
        valid_score: round.valid_score,
        test_score: round.test_score,
      }));
  const lossCurve = buildCurve('loss', '训练 Loss', '#81ecff', allRounds, 'avg_train_loss');
  const validCurve = buildCurve('valid_score', '验证指标', '#afffd1', allRounds, 'valid_score');
  const testCurve = buildCurve('test_score', '测试指标', '#ffb86b', allRounds, 'test_score');
  const attackGroups = formatAttackSemanticGroups(activeAttacks, base.attackTaxonomy);
  const configSummary = buildConfigSummary(
    model,
    dataset,
    experimentMode,
    activeAttacks,
    activeDefenses,
    activePrivacyMetrics,
    totalRounds,
    base.attackTaxonomy,
  );
  const scenarioLabel = getScenarioLabel(experimentMode).title;
  const defenseObservation = filteredCount
    ? `最大过滤客户端数 ${filteredCount}`
    : clippedCount
      ? `最大裁剪客户端数 ${clippedCount}`
      : trimmedCount
        ? `截尾均值处理计数 ${trimmedCount}`
        : activeDefenses.length
          ? '防御模块已启用，当前摘要未返回处理计数'
          : '未启用防御模块';

  return {
    experimentId: base.experimentId,
    taskId: `api::${base.experimentKey}`,
    source: base.source,
    dataSource: 'api',
    dataSourceLabel: base.dataSourceLabel,
    timestamp: base.experimentId ?? base.fileName ?? '真实结果文件',
    dataset,
    model,
    mode: mapExperimentMode(experimentMode),
    experimentMode,
    scenarioTags: base.scenarioTags ?? [],
    activeAttacks,
    activeDefenses,
    activePrivacyMetrics,
    maliciousClientSummary: base.maliciousClientSummary,
    attackType: mapAttackType(activeAttacks),
    defenseType: mapDefenseType(activeDefenses),
    metrics: {
      recall10: recall20,
      recall20,
      recall50: recall20,
      ndcg10: ndcg20,
      ndcg20,
      ndcg50: ndcg20,
      loss,
    },
    metricCards: [
      {label: 'Recall@20', value: formatMetric(recall20), change: '最终评估', tone: 'primary'},
      {label: 'NDCG@20', value: formatMetric(ndcg20), change: '最终评估', tone: 'tertiary'},
      {label: 'Loss', value: formatMetric(loss), change: '最终评估', tone: 'neutral'},
      {
        label: activeAttacks.length ? '最大攻击命中' : '恶意客户端数',
        value: String(activeAttacks.length ? attackedCount : maliciousCount),
        change: activeAttacks.length ? '真实记录' : '占位统计',
        tone: activeAttacks.length ? 'danger' : 'warning',
      },
      {
        label: filteredCount ? '最大过滤数' : clippedCount ? '最大裁剪数' : trimmedCount ? '截尾处理数' : '隐私观测轮数',
        value: String(filteredCount || clippedCount || trimmedCount || privacyRounds),
        change: activeDefenses.length || activePrivacyMetrics.length ? '真实记录' : '未启用',
        tone: activeDefenses.length ? 'success' : 'info',
      },
    ],
    curves: {
      loss: lossCurve ?? {key: 'loss', label: '训练 Loss', color: '#81ecff', points: []},
      utility: [lossCurve, validCurve, testCurve].filter((series): series is CurveSeries => Boolean(series)),
    },
    configSummary,
    summaryText: {
      headline: '基于当前实验结果自动生成。',
      conclusion: `当前实验为${scenarioLabel}，模型 ${model}，数据集 ${dataset}。最终 Recall@20=${formatMetric(recall20)}，NDCG@20=${formatMetric(ndcg20)}，Loss=${formatMetric(loss)}。`,
      securityAssessment: `投毒攻击：${attackGroups.poisoningLabel}；隐私泄露观测：${attackGroups.privacyProbeLabel}；防御链：${formatModuleChain(activeDefenses)}；观测模块：${formatModuleChain(activePrivacyMetrics)}。恶意客户端统计 ${maliciousCount}，最大攻击命中 ${attackedCount}。`,
      recommendation: `${defenseObservation}。以上结论仅基于当前 summary/result 中可验证字段生成，未补造额外评分。`,
    },
    defenseEfficiencyScore: 0,
    defenseEfficiencyLabel: '真实结果未提供综合评分',
    securityObservations: [
      {label: '恶意客户端数', value: String(maliciousCount), change: '最大/唯一统计', tone: 'warning'},
      {label: '最大攻击命中', value: String(attackedCount), change: 'attack_metrics', tone: 'danger'},
      {label: '最大裁剪数', value: String(clippedCount), change: 'defense_metrics', tone: 'success'},
      {label: '最大过滤数', value: String(filteredCount), change: 'defense_metrics', tone: 'success'},
      {label: '隐私观测轮数', value: String(privacyRounds), change: 'privacy outputs', tone: 'info'},
    ],
    analysisNotes: [
      `场景标签：${base.scenarioTags?.length ? base.scenarioTags.join(' / ') : '未提供'}`,
      `记录轮数：${totalRounds}`,
      defenseObservation,
    ],
  };
};

const loadResultByExperimentKey = async (experimentKey: string, source: ExperimentResult['source']): Promise<ExperimentResult> => {
  const response = await apiGet<ExperimentResultResponse>(`/experiments/${encodeURIComponent(experimentKey)}/result`);
  const result = response.result;

  return buildRealResult({
    experimentKey: response.experiment_key,
    experimentId: result.experiment_id,
    fileName: response.file_name,
    model: result.model,
    dataset: result.dataset,
    experimentMode: result.experiment_mode,
    scenarioTags: result.scenario_tags,
    activeAttacks: result.active_attacks,
    attackTaxonomy: result.metadata?.attack_taxonomy as AttackTaxonomyMap | undefined,
    activeDefenses: result.active_defenses,
    activePrivacyMetrics: result.active_privacy_metrics,
    finalEval: result.final_eval,
    maliciousClientSummary: result.metadata?.malicious_client_summary,
    roundMetrics: result.round_metrics,
    source,
    dataSourceLabel: source === 'recent-launch' ? '最近一次真实实验结果' : '历史实验真实结果',
  });
};

const loadSummaryByExperimentKey = async (experimentKey: string, source: ExperimentResult['source']): Promise<ExperimentResult> => {
  const response = await apiGet<ExperimentSummaryResponse>(`/experiments/${encodeURIComponent(experimentKey)}/summary`);
  const summary = response.summary;

  return buildRealResult({
    experimentKey: response.experiment_key,
    experimentId: summary.experiment_id,
    fileName: response.file_name,
    model: summary.model,
    dataset: summary.dataset,
    experimentMode: summary.experiment_mode,
    scenarioTags: summary.scenario_tags,
    activeAttacks: summary.active_attacks,
    attackTaxonomy: summary.attack_taxonomy as AttackTaxonomyMap | undefined,
    activeDefenses: summary.active_defenses,
    activePrivacyMetrics: summary.active_privacy_metrics,
    finalEval: summary.final_eval,
    maliciousClientSummary: summary.malicious_client_summary,
    roundSummaries: summary.round_summaries,
    source,
    dataSourceLabel: source === 'recent-launch' ? '最近一次真实实验摘要' : '历史实验真实摘要',
  });
};

const findExperimentKeyForLaunch = async (record: LaunchExperimentRecord) => {
  const summaryFile = normalizePathToken(record.response.summary_path);
  const resultFile = normalizePathToken(record.response.result_path);
  const response = await apiGet<ExperimentSummaryListResponse>('/experiments/summaries');
  const match = response.items.find((item: ExperimentSummaryListItem) => {
    const itemFile = normalizePathToken(item.file_name);
    const itemRelativePath = normalizePathToken(item.relative_path);
    const summaryMatches = summaryFile && (summaryFile === itemFile || summaryFile === itemRelativePath);
    const resultMatches =
      resultFile &&
      (resultFile.replace('.experiment_result.json', '.experiment_summary.json') === itemFile ||
        resultFile.replace('.experiment_result.json', '.experiment_summary.json') === itemRelativePath);

    return (
      item.experiment_id === record.response.experiment_id ||
      summaryMatches ||
      resultMatches ||
      Boolean(record.response.experiment_id && item.file_name.includes(record.response.experiment_id))
    );
  });

  if (!match) {
    throw new Error('未能根据最近一次 launch 返回定位 experiment_key。');
  }

  return match.experiment_key;
};

const getRecentLaunchResult = async (record: LaunchExperimentRecord): Promise<AnalysisResultResponse> => {
  if (isValidationLaunch(record)) {
    return {
      status: 'validate-only',
      result: null,
      dataSourceLabel: '仅校验结果',
      fallbackReason: '当前仅完成配置校验，尚未生成实验结果。',
    };
  }

  const experimentKey = await findExperimentKeyForLaunch(record);
  try {
    return {
      status: 'success',
      result: await loadResultByExperimentKey(experimentKey, 'recent-launch'),
      dataSourceLabel: '最近一次真实实验结果',
    };
  } catch (error) {
    return {
      status: 'success',
      result: await loadSummaryByExperimentKey(experimentKey, 'recent-launch'),
      dataSourceLabel: '最近一次真实实验摘要',
      fallbackReason: error instanceof Error ? `详细 result 加载失败，已回退 summary：${error.message}` : '详细 result 加载失败，已回退 summary。',
    };
  }
};

const getHistoryApiResult = async (taskId: string): Promise<AnalysisResultResponse> => {
  const experimentKey = extractExperimentKeyFromTaskId(taskId);
  if (!experimentKey) {
    throw new Error('当前 taskId 不是真实历史实验记录。');
  }

  try {
    return {
      status: 'success',
      result: await loadResultByExperimentKey(experimentKey, 'history'),
      dataSourceLabel: '历史实验真实结果',
    };
  } catch (error) {
    return {
      status: 'success',
      result: await loadSummaryByExperimentKey(experimentKey, 'history'),
      dataSourceLabel: '历史实验真实摘要',
      fallbackReason: error instanceof Error ? `详细 result 加载失败，已回退 summary：${error.message}` : '详细 result 加载失败，已回退 summary。',
    };
  }
};

export const getAnalysisResult = async ({
  taskId,
  lastLaunchRecord,
}: AnalysisResultRequest): Promise<AnalysisResultResponse> => {
  if (taskId?.startsWith('api::')) {
    return getHistoryApiResult(taskId);
  }

  if (lastLaunchRecord) {
    try {
      return await getRecentLaunchResult(lastLaunchRecord);
    } catch (error) {
      const fallback = await getHistoryFallbackResult();
      return {
        status: 'mock',
        result: {
          ...fallback,
          dataSource: 'mock',
          dataSourceLabel: '示例报告',
          fallbackReason: error instanceof Error ? error.message : '最近一次真实结果定位失败。',
        },
        dataSourceLabel: 'Mock 示例报告',
        fallbackReason: error instanceof Error ? error.message : '最近一次真实结果定位失败。',
      };
    }
  }

  if (taskId) {
    const currentResult = await getResult(taskId);
    if (currentResult) {
      return {
        status: 'mock',
        result: {
          ...currentResult,
          dataSource: 'mock',
          dataSourceLabel: 'Mock 示例报告',
        },
        dataSourceLabel: 'Mock 示例报告',
      };
    }
  }

  const fallback = await getHistoryFallbackResult();
  return {
    status: 'mock',
    result: {
      ...fallback,
      dataSource: 'mock',
      dataSourceLabel: '示例报告',
      fallbackReason: '当前找不到真实 summary/result，已回退示例报告。',
    },
    dataSourceLabel: 'Mock 示例报告',
    fallbackReason: '当前找不到真实 summary/result，已回退示例报告。',
  };
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
    name: '投毒攻击组',
    status: 'Attacked',
    accent: 'danger',
    attackLabel: '符号翻转投毒',
    defenseLabel: '未启用',
    stageStatus: '符号翻转投毒',
  },
  attack_and_defense_clip: {
    name: '攻防对照组',
    status: 'Clipped',
    accent: 'tertiary',
    attackLabel: '更新缩放投毒',
    defenseLabel: '范数裁剪防御',
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
    const attackGroups = formatAttackSemanticGroups(item.active_attacks, item.attack_taxonomy as AttackTaxonomyMap | undefined);

    return {
      id: item.scenario || `showcase-${index + 1}`,
      taskId: item.scenario || `showcase-${index + 1}`,
      name: meta.name,
      status: meta.status,
      accent: meta.accent,
      attackLabel: attackGroups.poisoning.length ? attackGroups.poisoningLabel : meta.attackLabel,
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
        label: '投毒攻击策略',
        baseline: formatAttackSemanticGroups(baseline?.active_attacks, baseline?.attack_taxonomy as AttackTaxonomyMap | undefined).poisoningLabel,
        attack: formatAttackSemanticGroups(attack?.active_attacks, attack?.attack_taxonomy as AttackTaxonomyMap | undefined).poisoningLabel,
        defense: formatAttackSemanticGroups(defense?.active_attacks, defense?.attack_taxonomy as AttackTaxonomyMap | undefined).poisoningLabel,
      },
      {
        label: '隐私泄露观测',
        baseline: formatAttackSemanticGroups(baseline?.active_attacks, baseline?.attack_taxonomy as AttackTaxonomyMap | undefined).privacyProbeLabel,
        attack: formatAttackSemanticGroups(attack?.active_attacks, attack?.attack_taxonomy as AttackTaxonomyMap | undefined).privacyProbeLabel,
        defense: formatAttackSemanticGroups(defense?.active_attacks, defense?.attack_taxonomy as AttackTaxonomyMap | undefined).privacyProbeLabel,
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
