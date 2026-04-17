import {mockAnalysisData} from '../mock/analysis';
import {buildTrainConfigSummary, defaultTrainConfig} from '../mock/configuration';
import {formatAttackSemanticGroups, formatDefenseSemanticGroups, formatModuleChain, getModuleLabel, getScenarioLabel} from '../lib/experimentLabels';
import type {AttackTaxonomyMap} from '../lib/experimentLabels';
import {apiGet} from './api';
import {getHistoryResultPreview, getHistorySummaryPreview} from './history';
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
import type {HistoryRecord} from '../types/history';
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

const getExperimentKeyFromResultPath = (resultPath?: string | null) => {
  if (!resultPath) {
    return null;
  }

  const normalized = resultPath.replace(/\\/g, '/');
  const marker = 'outputs/results/';
  const relativePath = normalized.includes(marker)
    ? normalized.slice(normalized.indexOf(marker) + marker.length)
    : normalized;
  const relativeBase = relativePath.replace(/\.experiment_result\.json$/, '').replace(/\.experiment_summary\.json$/, '');

  return relativeBase && relativeBase !== relativePath ? relativeBase.split('/').filter(Boolean).join('__') : null;
};

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
    attackName === 'poisoning_attack' ||
    attackName === 'poisoning' ||
    attackName === 'nondirected_poisoning' ||
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

  if (
    defenseName === 'robust_defense' ||
    defenseName === 'robust' ||
    defenseName === 'robust_aggregation_defense' ||
    defenseName === 'norm_clip' ||
    defenseName === 'update_filter' ||
    defenseName === 'trimmed_mean' ||
    defenseName === 'client_update_anomaly' ||
    defenseName === 'client_update_anomaly_detector'
  ) {
    return defenseName;
  }

  return 'anomaly-detection';
};

const asNumber = (value: unknown, fallback = 0) =>
  typeof value === 'number' && Number.isFinite(value) ? value : fallback;

const asOptionalNumber = (value: unknown) =>
  typeof value === 'number' && Number.isFinite(value) ? value : undefined;

const readMetricValue = (source: unknown, ...keys: string[]) => {
  if (!source || typeof source !== 'object') {
    return undefined;
  }

  const record = source as Record<string, unknown>;
  for (const key of keys) {
    const value = asOptionalNumber(record[key]);
    if (value !== undefined) {
      return value;
    }
  }

  return undefined;
};

const readEvalMetric = (
  finalEval: unknown,
  metadata: Record<string, unknown> | undefined,
  metric: 'recall' | 'ndcg',
  cutoff: 20 | 50,
) => {
  const compactKey = `${metric}${cutoff}`;
  const atKey = `${metric}@${cutoff}`;
  const directValue =
    readMetricValue(finalEval, compactKey, atKey) ??
    readMetricValue((finalEval as {extra?: unknown} | undefined)?.extra, compactKey, atKey);

  if (directValue !== undefined) {
    return directValue;
  }

  if (cutoff === 50) {
    return (
      readMetricValue(metadata?.best_test_result, compactKey, atKey) ??
      readMetricValue(metadata?.best_valid_result, compactKey, atKey)
    );
  }

  return undefined;
};

const formatMetric = (value: number | undefined, digits = 3) =>
  typeof value === 'number' && Number.isFinite(value) ? value.toFixed(digits) : '暂无';

const getNestedMetricCandidate = (value: unknown, fields: string[]): number => {
  if (!value || typeof value !== 'object') {
    return 0;
  }

  const record = value as Record<string, unknown>;
  const directMax = fields.reduce((fieldMax, field) => Math.max(fieldMax, Number(record[field] ?? 0)), 0);
  const childMax = Object.values(record).reduce<number>(
    (maxValue, child) => Math.max(maxValue, getNestedMetricCandidate(child, fields)),
    0,
  );
  const candidate = Math.max(directMax, childMax);
  return Number.isFinite(candidate) ? candidate : 0;
};

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

    const roundMax = Object.values(metrics).reduce(
      (valueMax, value) => Math.max(valueMax, getNestedMetricCandidate(value, fields)),
      0,
    );

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

const formatBackendMetricName = (key: string) => {
  const [metricName, cutoff] = key.split('@');
  const normalizedName = metricName.toUpperCase();
  return cutoff ? `${normalizedName}@${cutoff}` : normalizedName;
};

const inferBackendScoreMetricLabel = (
  metadata: Record<string, unknown> | undefined,
  rounds: Array<{valid_score?: number | null; test_score?: number | null}>,
) => {
  const explicitMetric = metadata?.valid_metric ?? metadata?.validMetric;
  if (typeof explicitMetric === 'string' && explicitMetric.trim()) {
    return formatBackendMetricName(explicitMetric.trim());
  }

  const bestValidResult = metadata?.best_valid_result;
  if (!bestValidResult || typeof bestValidResult !== 'object') {
    return null;
  }

  const scoreValues = rounds
    .flatMap((round) => [round.valid_score, round.test_score])
    .filter((value): value is number => typeof value === 'number' && Number.isFinite(value));
  const metricEntries = Object.entries(bestValidResult as Record<string, unknown>)
    .map(([key, value]) => [key, Number(value)] as const)
    .filter(([, value]) => Number.isFinite(value));

  const matchedMetric = metricEntries.find(([, metricValue]) =>
    scoreValues.some((scoreValue) => Math.abs(scoreValue - metricValue) < 1e-9),
  );

  return matchedMetric ? formatBackendMetricName(matchedMetric[0]) : null;
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
  const defenseGroups = formatDefenseSemanticGroups(activeDefenses);

  return {
    ...buildTrainConfigSummary(config),
    datasetLabel: dataset,
    modelLabel: model,
    modeLabel: getScenarioLabel(experimentMode ?? mode).title,
    attackLabel: attackGroups.poisoningLabel,
    poisoningAttackLabel: attackGroups.poisoningLabel,
    privacyProbeLabel: attackGroups.privacyProbeLabel,
    defenseLabel: defenseGroups.robustLabel,
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
    metadata?: Record<string, unknown>;
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
  const recall20 = readEvalMetric(base.finalEval, base.metadata, 'recall', 20);
  const ndcg20 = readEvalMetric(base.finalEval, base.metadata, 'ndcg', 20);
  const recall50 = readEvalMetric(base.finalEval, base.metadata, 'recall', 50);
  const ndcg50 = readEvalMetric(base.finalEval, base.metadata, 'ndcg', 50);
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
  const lossCurve = buildCurve('loss', '训练损失', '#81ecff', allRounds, 'avg_train_loss');
  const backendScoreMetricLabel = inferBackendScoreMetricLabel(base.metadata, allRounds);
  const validCurve = buildCurve(
    'valid_score',
    backendScoreMetricLabel ? `验证 ${backendScoreMetricLabel}` : '验证主指标',
    '#afffd1',
    allRounds,
    'valid_score',
  );
  const testCurve = buildCurve(
    'test_score',
    backendScoreMetricLabel ? `测试 ${backendScoreMetricLabel}` : '测试主指标',
    '#ffb86b',
    allRounds,
    'test_score',
  );
  const attackGroups = formatAttackSemanticGroups(activeAttacks, base.attackTaxonomy);
  const defenseGroups = formatDefenseSemanticGroups(activeDefenses);
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
          ? '鲁棒防御已启用，当前摘要未返回处理计数'
          : '未启用鲁棒防御';

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
      recall50,
      ndcg10: ndcg20,
      ndcg20,
      ndcg50,
      loss,
    },
    metricCards: [
      {label: 'Recall@50', value: formatMetric(recall50), change: '最终评估', tone: 'primary'},
      {label: 'NDCG@50', value: formatMetric(ndcg50), change: '最终评估', tone: 'tertiary'},
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
      loss: lossCurve ?? {key: 'loss', label: '训练损失', color: '#81ecff', points: []},
      utility: [validCurve, testCurve].filter((series): series is CurveSeries => Boolean(series)),
    },
    utilityMetricTitle: backendScoreMetricLabel
      ? `验证/测试 ${backendScoreMetricLabel} 曲线`
      : '验证/测试主指标曲线',
    utilityMetricDescription: backendScoreMetricLabel
      ? `使用真实 valid_score / test_score 字段，已根据结果元数据推断为后端主评估指标 ${backendScoreMetricLabel}。`
      : '使用真实 valid_score / test_score 字段；当前结果没有逐轮 Recall@50 / NDCG@50 字段，因此这里明确展示为后端当前主评估指标。',
    configSummary,
    summaryText: {
      headline: '基于当前实验结果自动生成。',
      conclusion: `当前实验为${scenarioLabel}，模型 ${model}，数据集 ${dataset}。最终 Recall@50=${formatMetric(recall50)}，NDCG@50=${formatMetric(ndcg50)}，Loss=${formatMetric(loss)}。`,
      securityAssessment: `投毒攻击：${attackGroups.poisoningLabel}；隐私泄露观测：${attackGroups.privacyProbeLabel}；鲁棒防御：${defenseGroups.robustLabel}；观测模块：${formatModuleChain(activePrivacyMetrics)}。恶意客户端统计 ${maliciousCount}，最大攻击命中 ${attackedCount}。`,
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
    metadata: result.metadata,
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
    const records = await loadHistoryRecordsForComparison(taskIds);
    return mapHistoryRecordsToComparison(records);
  }

  try {
    const response = await apiGet<ShowcaseComparisonResponse>('/showcase/comparison');
    if (!response.items?.length) {
      throw new Error('Showcase comparison response is empty.');
    }

    return mapShowcaseComparison({
      ...response,
      items: await enrichShowcaseItemsWithResultMetrics(response.items),
    });
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

const scenarioOrder = [
  'baseline',
  'attack_only_poisoning',
  'attack_only_sign_flip',
  'attack_and_robust_defense',
  'attack_and_robust_defense_trimmed_mean',
  'attack_and_robust_defense_clip_then_trimmed_mean',
  'attack_and_defense_poisoning_trimmed_mean',
  'attack_and_defense_poisoning_norm_clip',
  'attack_and_defense_clip',
];

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
  attack_only_poisoning: {
    name: '投毒攻击组',
    status: 'Attacked',
    accent: 'danger',
    attackLabel: '投毒攻击',
    defenseLabel: '未启用',
    stageStatus: '投毒攻击',
  },
  attack_and_defense_clip: {
    name: '攻防对照组',
    status: 'Clipped',
    accent: 'tertiary',
    attackLabel: '更新缩放投毒',
    defenseLabel: '范数裁剪防御',
    stageStatus: '范数裁剪防御',
  },
  attack_and_robust_defense: {
    name: '攻防对照组',
    status: 'Defended',
    accent: 'tertiary',
    attackLabel: '投毒攻击',
    defenseLabel: '鲁棒防御',
    stageStatus: '鲁棒防御',
  },
  attack_and_robust_defense_trimmed_mean: {
    name: '攻防对照组',
    status: 'Defended',
    accent: 'tertiary',
    attackLabel: '投毒攻击',
    defenseLabel: '鲁棒防御',
    stageStatus: '鲁棒聚合型防御',
  },
  attack_and_robust_defense_clip_then_trimmed_mean: {
    name: '攻防对照组',
    status: 'Defended',
    accent: 'tertiary',
    attackLabel: '投毒攻击',
    defenseLabel: '鲁棒防御',
    stageStatus: '裁剪 + 鲁棒聚合',
  },
  attack_and_defense_poisoning_trimmed_mean: {
    name: '攻防对照组',
    status: 'Defended',
    accent: 'tertiary',
    attackLabel: '投毒攻击',
    defenseLabel: '截尾均值防御',
    stageStatus: '截尾均值防御',
  },
  attack_and_defense_poisoning_norm_clip: {
    name: '攻防对照组',
    status: 'Clipped',
    accent: 'tertiary',
    attackLabel: '投毒攻击',
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

const enrichShowcaseItemsWithResultMetrics = async (items: ShowcaseComparisonItem[]) => {
  return Promise.all(
    items.map(async (item) => {
      if (item.recall50 !== undefined && item.ndcg50 !== undefined) {
        return item;
      }

      const experimentKey = getExperimentKeyFromResultPath(item.result_path);
      if (!experimentKey) {
        return item;
      }

      try {
        const response = await apiGet<ExperimentResultResponse>(`/experiments/${encodeURIComponent(experimentKey)}/result`);
        const result = response.result;
        const recall50 = readEvalMetric(result.final_eval, result.metadata, 'recall', 50);
        const ndcg50 = readEvalMetric(result.final_eval, result.metadata, 'ndcg', 50);
        return {
          ...item,
          recall50: item.recall50 ?? recall50 ?? null,
          ndcg50: item.ndcg50 ?? ndcg50 ?? null,
        };
      } catch {
        return item;
      }
    }),
  );
};

const asMetric = (value?: number | null) => (typeof value === 'number' && Number.isFinite(value) ? value : undefined);
const asMetricOrZero = (value?: number | null) => (typeof value === 'number' && Number.isFinite(value) ? value : 0);

const formatPercentMetric = (value?: number) =>
  typeof value === 'number' && Number.isFinite(value) ? `${(value * 100).toFixed(2)}%` : '暂无';

const getScenarioMeta = (item: ShowcaseComparisonItem, index: number) =>
  scenarioMeta[item.scenario] ?? {
    name: item.scenario || `实验 ${index + 1}`,
    status: item.experiment_mode ?? 'Compared',
    accent: index === 0 ? 'neutral' : index === 1 ? 'danger' : 'tertiary',
    attackLabel: listLabel(item.active_attacks),
    defenseLabel: formatDefenseSemanticGroups(item.active_defenses).robustLabel,
    stageStatus: item.experiment_mode ?? '已加载',
  };

const getHistoryGroupAccent = (record: HistoryRecord, index: number): ComparisonResult['groups'][number]['accent'] => {
  if (record.mode === 'baseline') {
    return 'neutral';
  }
  if (record.mode === 'attack') {
    return 'danger';
  }
  if (record.mode === 'comparison' || record.mode === 'defense') {
    return 'tertiary';
  }
  return index === 0 ? 'neutral' : index === 1 ? 'danger' : 'primary';
};

const mapHistoryRecordToComparisonGroup = (record: HistoryRecord, index: number): ComparisonResult['groups'][number] => {
  const configSummary = record.configSummary;
  const recall20 = asMetric(record.metrics.recall20);
  const recall50 = asMetric(record.metrics.recall50);
  const ndcg20 = asMetric(record.metrics.ndcg20);
  const ndcg50 = asMetric(record.metrics.ndcg50);
  const loss = asMetricOrZero(record.metrics.loss);

  return {
    id: record.id,
    taskId: record.taskId,
    name: record.name,
    status: record.status === 'completed' ? (record.mode === 'baseline' ? 'Baseline' : 'Compared') : record.status,
    accent: getHistoryGroupAccent(record, index),
    attackLabel: configSummary.poisoningAttackLabel ?? configSummary.attackLabel,
    defenseLabel: configSummary.defenseLabel,
    model: record.model,
    dataset: record.dataset,
    scenarioLabel: configSummary.modeLabel,
    privacyProbeLabel: configSummary.privacyProbeLabel ?? '未启用',
    observationLabel: configSummary.observationLabel ?? configSummary.privacyLevel,
    learningRate: record.keyParams.learningRate,
    totalRounds: record.keyParams.totalRounds,
    localEpochs: record.keyParams.localEpochs,
    clientSamplingRate: record.keyParams.clientSamplingRate,
    metrics: {
      recall10: recall20,
      recall20,
      recall50,
      ndcg10: ndcg20,
      ndcg20,
      ndcg50,
      loss,
    },
  };
};

const mapHistoryRecordsToComparison = (records: HistoryRecord[]): ComparisonResult => {
  const groups = records.slice(0, 3).map(mapHistoryRecordToComparisonGroup);

  return {
    groups,
    summary: `当前对比来自历史实验页手动选择的 ${groups.length} 条实验记录，优先使用真实 summary/result 字段生成。`,
    findings: groups.map(
      (group) =>
        `${group.name}：Recall@50 ${formatPercentMetric(group.metrics.recall50)}，NDCG@50 ${formatPercentMetric(group.metrics.ndcg50)}，Loss ${(group.metrics.loss ?? 0).toFixed(4)}。`,
    ),
    metricComparison: groups.map((group) => ({
      name: group.name,
      recall: group.metrics.recall50,
      ndcg: group.metrics.ndcg50,
      loss: group.metrics.loss ?? 0,
    })),
    configDiff: [
      {
        label: '模型',
        baseline: groups[0]?.model ?? '-',
        attack: groups[1]?.model ?? '-',
        defense: groups[2]?.model ?? '-',
      },
      {
        label: '数据集',
        baseline: groups[0]?.dataset ?? '-',
        attack: groups[1]?.dataset ?? '-',
        defense: groups[2]?.dataset ?? '-',
      },
      {
        label: '投毒攻击',
        baseline: groups[0]?.attackLabel ?? '-',
        attack: groups[1]?.attackLabel ?? '-',
        defense: groups[2]?.attackLabel ?? '-',
      },
      {
        label: '鲁棒防御',
        baseline: groups[0]?.defenseLabel ?? '-',
        attack: groups[1]?.defenseLabel ?? '-',
        defense: groups[2]?.defenseLabel ?? '-',
      },
      {
        label: '学习率 / 总轮数',
        baseline: `${groups[0]?.learningRate ?? '-'} / ${groups[0]?.totalRounds ?? '-'}`,
        attack: `${groups[1]?.learningRate ?? '-'} / ${groups[1]?.totalRounds ?? '-'}`,
        defense: `${groups[2]?.learningRate ?? '-'} / ${groups[2]?.totalRounds ?? '-'}`,
      },
    ],
    stages: groups.map((group, index) => ({
      stage: `${index + 1}. ${group.name}`,
      status: group.scenarioLabel ?? group.status,
      tone: group.accent,
    })),
    dataSource: 'history',
    dataSourceLabel: '历史实验手动选择',
  };
};

const loadHistoryRecordsForComparison = async (taskIds: string[]) => {
  return Promise.all(
    taskIds.slice(0, 3).map(async (taskId) => {
      try {
        return await getHistoryResultPreview(taskId);
      } catch {
        return getHistorySummaryPreview(taskId);
      }
    }),
  );
};

const mapShowcaseComparison = (response: ShowcaseComparisonResponse): ComparisonResult => {
  const items = orderedShowcaseItems(response.items).slice(0, 3);
  const groups = items.map((item, index) => {
    const meta = getScenarioMeta(item, index);
    const recall20 = asMetric(item.recall20);
    const recall50 = asMetric(item.recall50);
    const ndcg20 = asMetric(item.ndcg20);
    const ndcg50 = asMetric(item.ndcg50);
    const loss = asMetricOrZero(item.loss);
    const attackGroups = formatAttackSemanticGroups(item.active_attacks, item.attack_taxonomy as AttackTaxonomyMap | undefined);
    const defenseGroups = formatDefenseSemanticGroups(item.active_defenses);

    return {
      id: item.scenario || `showcase-${index + 1}`,
      taskId: item.scenario || `showcase-${index + 1}`,
      name: meta.name,
      status: meta.status,
      accent: meta.accent,
      attackLabel: attackGroups.poisoning.length ? attackGroups.poisoningLabel : meta.attackLabel,
      defenseLabel: defenseGroups.robust.length ? defenseGroups.robustLabel : meta.defenseLabel,
      metrics: {
        recall10: recall20,
        recall20,
        recall50,
        ndcg10: ndcg20,
        ndcg20,
        ndcg50,
        loss,
      },
    };
  });

  const findItem = (scenario: string) => items.find((item) => item.scenario === scenario);
  const baseline = findItem('baseline');
  const attack = findItem('attack_only_poisoning') ?? findItem('attack_only_sign_flip');
  const defense =
    findItem('attack_and_robust_defense') ??
    findItem('attack_and_robust_defense_trimmed_mean') ??
    findItem('attack_and_robust_defense_clip_then_trimmed_mean') ??
    findItem('attack_and_defense_poisoning_trimmed_mean') ??
    findItem('attack_and_defense_poisoning_norm_clip') ??
    findItem('attack_and_defense_clip');

  return {
    groups,
    summary:
      'ShowcaseV1 展示版对比已接入真实 API 数据，覆盖正常基线、攻击退化与攻防约束三组正式实验。',
    findings: items.map((item, index) => {
      const meta = getScenarioMeta(item, index);
      return item.display_note ?? `${meta.name}：Recall@50 ${formatPercentMetric(item.recall50 ?? undefined)}，NDCG@50 ${formatPercentMetric(item.ndcg50 ?? undefined)}。`;
    }),
    metricComparison: groups.map((group) => ({
      name: group.name,
      recall: group.metrics.recall50,
      ndcg: group.metrics.ndcg50,
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
        label: '鲁棒防御',
        baseline: formatDefenseSemanticGroups(baseline?.active_defenses).robustLabel,
        attack: formatDefenseSemanticGroups(attack?.active_defenses).robustLabel,
        defense: formatDefenseSemanticGroups(defense?.active_defenses).robustLabel,
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
