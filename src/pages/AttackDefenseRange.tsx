import React, {useEffect, useMemo, useRef, useState} from 'react';
import {
  Activity,
  Archive,
  BarChart3,
  CheckCircle2,
  ChevronRight,
  Database,
  Eye,
  Filter,
  GitCompare,
  History,
  ImageOff,
  Layers3,
  LineChart,
  ListChecks,
  LockKeyhole,
  Play,
  Search,
  ShieldAlert,
  ShieldCheck,
  ShieldOff,
  SlidersHorizontal,
  SquareTerminal,
  Swords,
  Target,
  UserSearch,
  Zap,
} from 'lucide-react';
import {FederatedTopology} from '../components/sandbox/FederatedTopology';
import {RecommendationComparisonBoard} from '../components/sandbox/RecommendationComparisonBoard';
import {useShowcaseBundle} from '../hooks/useShowcaseBundle';
import {
  datasetLabel,
  getFinalExposureText,
  getPlayEvidenceState,
  getPrivacyMetrics,
  getPublicImage,
  getScenarioTitle,
  getTargetProduct,
  getTargetRanks,
  inferAttackType,
  inferDefenseType,
  inferEvidenceLabels,
  inferScenarioUsage,
  normalizeShowcaseDataset,
  scenarioText,
} from '../lib/scenarioNarratives';
import type {WorkbenchTargetContext} from '../lib/scenarioNarratives';
import {
  AGGREGATION_VISIBILITY_MODES,
  ExperimentPlayId,
  ROBUST_AGGREGATORS,
  SECURITY_AUDITS,
  SECURITY_DEFENSES,
  getSecurityModule,
  securityToneClass,
} from '../lib/securityTaxonomy';
import {EXPERIMENT_PLAYBOOKS, getExperimentPlaybook} from '../lib/experimentPlaybooks';
import type {ExperimentPlaybook, PlaybookRouteTone} from '../lib/experimentPlaybooks';
import {EMPTY_VALUE, formatMetricValue, formatPercentValue, formatPercentRank, formatPlainValue, formatRankGain, formatSignedRankGain, getRecommendationCounts, toChineseLabel} from '../lib/showcaseFormat';
import {cn} from '../lib/utils';
import {loadShowcaseBundle} from '../services/showcase';
import {createWorkbenchJob, fetchWorkbenchJob, fetchWorkbenchJobs, fetchWorkbenchLogs, fetchWorkbenchOptions, fetchWorkbenchResult, validateWorkbenchConfig} from '../services/workbench';
import type {ExperimentConfigurationSource} from '../services/experiment';
import type {StartTrainResponse} from '../services/train';
import type {ConsoleSessionState} from '../types/common';
import type {DefenseType, LaunchExperimentOptions, LaunchExperimentResponse, TrainConfig} from '../types/train';
import type {ShowcaseBundle, ShowcaseModelCapabilityMatrix, ShowcaseModelSmokeEvidence, ShowcaseRecommendationComparison, ShowcaseRecommendationItem} from '../types/showcase';
import type {WorkbenchJobListItem, WorkbenchJobListResponse, WorkbenchJobStatusResponse, WorkbenchLogsResponse, WorkbenchOptionsResponse, WorkbenchParameterDescriptor, WorkbenchPayload, WorkbenchResultResponse, WorkbenchValidationResponse} from '../types/workbench';

export type WorkbenchTabId = 'orchestration' | 'monitoring' | 'analysis' | 'comparison' | 'history';

interface AttackDefenseRangeProps {
  initialTab?: WorkbenchTabId;
  session: ConsoleSessionState;
  onDraftConfigChange: (config: TrainConfig) => void;
  onStartTrain: (
    config: TrainConfig,
    options?: LaunchExperimentOptions,
    source?: ExperimentConfigurationSource,
  ) => Promise<StartTrainResponse>;
  onLaunchStatusChange: (status: LaunchExperimentResponse) => void;
  onOpenAnalysis: (taskId: string | null) => void;
  onAddComparisonSelection: (taskId: string) => void;
  onOpenComparison: () => void;
  onReuseConfig: (config: TrainConfig, taskId: string | null) => void;
}

type AggregationMode = keyof typeof AGGREGATION_VISIBILITY_MODES;
type ComparisonMode = 'none' | 'attack' | 'defense' | 'privacy' | 'capability';
type ParamPanelId = 'basic' | 'advanced';
type AttackStrength = 'weak' | 'medium' | 'strong';
type EvidenceSource = 'rank' | 'unmasked rank' | 'checkpoint score' | 'auto';
type CandidateLimit = 'Top10' | 'Top20' | 'Top50';
type RiskModality = 'item embedding' | 'image' | 'text';
type UpdateInputSource = 'client_update' | 'participant_params' | 'item_embedding';
type SimilarityMethod = 'cosine' | 'dot' | 'l2';
type MiaModel = 'threshold' | 'logistic_probe' | 'rank_proxy';
type PerturbationType = 'sign_flip' | 'gaussian' | 'random_noise';
type BaseAttack = 'none' | 'malicious_update';
type ActionState = 'idle' | 'validating' | 'starting';

const WORKBENCH_TERMINAL_STATUSES = new Set(['completed', 'partial', 'failed']);
const ROBUST_AGGREGATOR_LABELS: Record<string, string> = {
  Krum: 'Krum 异常更新筛选',
  Median: '坐标中位数聚合',
  TrimmedMean: '截尾均值聚合',
  Bulyan: 'Bulyan 组合鲁棒聚合',
};
const PERTURBATION_LABELS: Record<PerturbationType, string> = {
  sign_flip: '更新符号翻转',
  gaussian: '高斯噪声注入',
  random_noise: '随机噪声更新',
};
const BASE_ATTACK_LABELS: Record<BaseAttack, string> = {
  none: '无攻击',
  malicious_update: '恶意模型更新',
};
const DISTANCE_METRIC_LABELS: Record<string, string> = {
  cosine: '余弦距离',
  l2: 'L2 欧氏距离',
};
const UPDATE_INPUT_SOURCE_LABELS: Record<UpdateInputSource, string> = {
  client_update: '客户端模型更新',
  participant_params: '参与客户端参数',
  item_embedding: '商品嵌入向量',
};
const RISK_MODALITY_LABELS: Record<RiskModality, string> = {
  'item embedding': '商品嵌入',
  image: '图像特征',
  text: '文本特征',
};
const SIMILARITY_METHOD_LABELS: Record<SimilarityMethod, string> = {
  cosine: '余弦相似度',
  dot: '点积相似度',
  l2: 'L2 欧氏距离',
};
const CANDIDATE_LIMIT_LABELS: Record<CandidateLimit, string> = {
  Top10: '前10项',
  Top20: '前20项',
  Top50: '前50项',
};
const ATTACK_STRENGTH_LABELS: Record<AttackStrength, string> = {
  weak: '弱',
  medium: '中',
  strong: '强',
};
const PARAMETER_LABEL_FALLBACKS: Record<string, string> = {
  epochs: '训练轮数',
  local_epochs: '本地轮数',
  batch_size: '批大小',
  seed: '随机种子',
  client_sampling_ratio: '客户端采样比例',
  learning_rate: '学习率',
  weight_decay: '权重衰减',
  gradient_clip: '梯度裁剪上限',
  malicious_client_ratio: '恶意客户端比例',
  target_item: '目标商品',
  injection_ratio: '注入比例',
  max_injections_per_client: '每客户端注入上限',
  target_loss_weight: '目标损失权重',
  target_rank_selector: '目标排名统计口径',
  save_topk: '导出 Top50 推荐列表',
  attack_strength: '攻击强度',
  krum_f: 'Krum 容错恶意客户端数',
  multi_krum_enabled: '多候选 Krum',
  distance_metric: '距离度量',
  gradient_clip_norm: '防御预处理裁剪上限',
  outlier_strategy: '异常值策略',
  trim_ratio: '截尾比例',
  trim_min_keep: '最少保留客户端数',
  bulyan_f: 'Bulyan 容错恶意客户端数',
  bulyan_selection_ratio: '候选选择比例',
  robust_aggregators: '鲁棒算法',
  dp_noise_enabled: '差分隐私风格加噪',
  noise_multiplier: '噪声乘数',
  max_grad_norm: '扰动前梯度裁剪上限',
  target_delta: '目标 δ（仅记录）',
  dp_seed: '扰动随机种子',
  export_artifact: '导出审计结果',
};
const robustAggregatorLabel = (value: string) => ROBUST_AGGREGATOR_LABELS[value] ?? value;
const WORKBENCH_STATUS_LABELS: Record<string, string> = {
  queued: '排队中',
  preparing_config: '准备配置',
  running: '运行中',
  exporting_artifacts: '导出证据',
  completed: '已完成',
  failed: '失败',
  partial: '部分完成',
  invalid: '配置未通过',
};

const workbenchStatusLabel = (value?: string | null) => WORKBENCH_STATUS_LABELS[value ?? ''] ?? '读取中';
const shortWorkbenchJobId = (value?: string | null) => (value ? value.replace(/^workbench_/, '').slice(-8) : EMPTY_VALUE);
const WORKBENCH_STAGE_LABELS: Record<string, string> = {
  queued: '排队',
  prepare: '准备配置',
  preparing_config: '准备配置',
  baseline_training: '基线训练',
  baseline_train: '基线训练',
  baseline_evaluate: '基线验证与 Top50',
  attack_training: '攻击训练',
  attack_train: '攻击训练',
  attack_evaluate: '攻击验证与 Top50',
  aggregate: '服务端聚合',
  security_audit: '安全审计',
  privacy_audit: '成员推断审计',
  leakage_audit: '更新泄露审计',
  defense_training: '防御训练',
  evaluation: '方向评估',
  export: '结果导出',
  running: '训练执行',
  exporting_artifacts: '结果导出',
  launcher_failed: '训练启动器',
  runner_failed: '任务运行器',
  completed: '完成',
  failed: '失败',
};
const workbenchStageLabel = (value?: string | null) => (
  value ? WORKBENCH_STAGE_LABELS[value] ?? toChineseLabel(value) : EMPTY_VALUE
);
type WorkbenchFailureInfo = Pick<
  WorkbenchJobStatusResponse,
  'error_summary' | 'error_detail' | 'error_message' | 'failure_stage' | 'return_code'
  | 'actual_tensor_shapes' | 'model_expected_shapes'
>;
const formatShapeEvidence = (value: WorkbenchFailureInfo['actual_tensor_shapes']) => {
  if (value == null) return EMPTY_VALUE;
  return typeof value === 'string' ? value : JSON.stringify(value);
};
const workbenchFailureSummary = (job?: WorkbenchFailureInfo | null) => (
  job?.error_summary
  ?? (job?.return_code != null ? `训练子进程异常退出（return code ${job.return_code}）` : null)
  ?? job?.error_message
  ?? '后端未返回错误摘要。'
);
const workbenchFailureDetail = (job?: WorkbenchFailureInfo | null) => (
  job?.error_detail ?? job?.error_message ?? workbenchFailureSummary(job)
);
const workbenchSourceLabel = (value?: string | null) => {
  if (value === 'full_train') return '真实全量训练';
  if (value === 'existing_artifact' || value === 'real_smoke' || value === 'probe_smoke') return '历史任务';
  return value ? toChineseLabel(value) : EMPTY_VALUE;
};
const workbenchMetricLabel = (value: string) => {
  const labels: Record<string, string> = {
    execution_mode: '执行模式',
    requested_execution_mode: '请求执行模式',
    baseline_unmasked_rank: '原始未屏蔽排序',
    attack_unmasked_rank: '攻击后未屏蔽排序',
    target_rank_before: '基线目标排名',
    target_rank_after: '攻击后目标排名',
    rank_gain: '排名提升',
    normalized_rank_gain: '归一化提升',
    reciprocal_rank_gain: '倒数排名增益',
    attack_topk_hit: '最终 TopK 命中',
    masked_top50_hit: '最终 Top50 曝光',
    recall_at_50: 'Recall@50',
    ndcg_at_50: 'NDCG@50',
    direction: '实验方向',
    model: '模型',
    dataset: '数据集',
    source: '结果来源',
    active_attacks: '攻击模块',
    active_defenses: '防御模块',
    loss: 'Loss',
    epochs: '训练轮数',
    local_epochs: '本地轮数',
    client_sampling_ratio: '客户端采样比例',
  };
  return labels[value] ?? toChineseLabel(value);
};
const workbenchMetricValue = (key: string, value: string | number | boolean | null) => {
  if (typeof value === 'boolean') return value ? '是' : '否';
  if (value === null) return EMPTY_VALUE;
  if (key === 'source') return workbenchSourceLabel(String(value));
  if (key === 'direction') {
    const labels: Record<string, string> = {
      recommendation_manipulation: '推荐操纵',
      membership_inference: '成员推断',
      update_leakage: '更新泄露',
      aggregation_defense: '聚合防御',
    };
    return labels[String(value)] ?? toChineseLabel(String(value));
  }
  if (key === 'client_sampling_ratio' && typeof value === 'number') return formatRatio(value);
  return formatPlainValue(value);
};
const WORKBENCH_DIRECTION_LABELS: Record<string, string> = {
  recommendation_manipulation: '推荐操纵',
  membership_inference: '成员推断',
  update_leakage: '更新泄露',
  aggregation_defense: '聚合防御',
};
type WorkbenchDirectionId = keyof typeof WORKBENCH_DIRECTION_LABELS;
const isWorkbenchDirection = (value: unknown): value is WorkbenchDirectionId =>
  typeof value === 'string' && Object.prototype.hasOwnProperty.call(WORKBENCH_DIRECTION_LABELS, value);
const workbenchDirectionLabel = (value?: string | null) => (value ? WORKBENCH_DIRECTION_LABELS[value] ?? toChineseLabel(value) : EMPTY_VALUE);
const workbenchDirectionFromFilter = (value: string) =>
  Object.entries(WORKBENCH_DIRECTION_LABELS).find(([, label]) => label === value)?.[0] ?? '';

// 选择最近可分析历史 job：按 started_at 降序（不是 job_id 字符串），
// 只接受 status in {completed, partial} 且有 started_at/created_at 的项。
const ANALYZABLE_JOB_STATUSES = new Set(['completed', 'partial']);
const pickMostRecentAnalyzableJob = (items: WorkbenchJobListItem[]): WorkbenchJobListItem | null => {
  const candidates = items.filter((item) => item.status && ANALYZABLE_JOB_STATUSES.has(item.status));
  if (!candidates.length) return null;
  const sorted = [...candidates].sort((a, b) => {
    const aTime = new Date(a.started_at ?? a.created_at ?? 0).getTime();
    const bTime = new Date(b.started_at ?? b.created_at ?? 0).getTime();
    return bTime - aTime;
  });
  return sorted[0] ?? null;
};
const padDatePart = (value: number) => String(value).padStart(2, '0');
const formatDateTimeToSeconds = (value?: Date | string | null) => {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return typeof value === 'string' ? value : null;
  return `${date.getFullYear()}-${padDatePart(date.getMonth() + 1)}-${padDatePart(date.getDate())} ${padDatePart(date.getHours())}:${padDatePart(date.getMinutes())}:${padDatePart(date.getSeconds())}`;
};
const toLocalIsoDateTime = (date: Date) => {
  const offsetMinutes = -date.getTimezoneOffset();
  const offsetSign = offsetMinutes >= 0 ? '+' : '-';
  const absoluteOffset = Math.abs(offsetMinutes);
  const offset = `${offsetSign}${padDatePart(Math.floor(absoluteOffset / 60))}:${padDatePart(absoluteOffset % 60)}`;
  return `${date.getFullYear()}-${padDatePart(date.getMonth() + 1)}-${padDatePart(date.getDate())}T${padDatePart(date.getHours())}:${padDatePart(date.getMinutes())}:${padDatePart(date.getSeconds())}${offset}`;
};

const tabs: Array<{id: WorkbenchTabId; label: string; icon: React.ComponentType<{className?: string}>}> = [
  {id: 'orchestration', label: '实验编排', icon: ListChecks},
  {id: 'monitoring', label: '运行监控', icon: Activity},
  {id: 'analysis', label: '单次分析', icon: Search},
  {id: 'comparison', label: '横向对比', icon: GitCompare},
  {id: 'history', label: '历史实验', icon: History},
];


const comparisonModes: Array<{id: ComparisonMode; title: string; description: string}> = [
  {id: 'attack', title: '攻击效果对比', description: '比较排序操纵、Top50 命中和隐私攻击信号。'},
  {id: 'defense', title: '防御效果对比', description: '比较鲁棒聚合、安全聚合模拟和恢复指标。'},
  {id: 'privacy', title: '隐私风险对比', description: '聚焦成员推断和客户端更新泄露。'},
  {id: 'capability', title: '模型/数据集能力对比', description: '说明每条实验线适合展示什么、不适合泛化什么。'},
];

const formatRank = (value?: number | null) => (typeof value === 'number' && Number.isFinite(value) ? `#${Math.round(value)}` : EMPTY_VALUE);
const formatSigned = (value?: number | null, digits = 0) => (typeof value === 'number' && Number.isFinite(value) ? `+${value.toFixed(digits)}` : EMPTY_VALUE);
const formatRatio = (value?: number | null) => (typeof value === 'number' && Number.isFinite(value) ? `${(value * 100).toFixed(1)}%` : EMPTY_VALUE);
const formatSmallNumber = (value?: number | null) => (typeof value === 'number' && Number.isFinite(value) ? value.toFixed(4) : EMPTY_VALUE);
const formatDurationSeconds = (value?: number | null) => {
  if (typeof value !== 'number' || !Number.isFinite(value)) return EMPTY_VALUE;
  const total = Math.max(0, Math.round(value));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  return hours ? `${hours}时 ${minutes}分 ${seconds}秒` : minutes ? `${minutes}分 ${seconds}秒` : `${seconds}秒`;
};
const formatExportedValue = (value?: number | string | null) => (value === null || value === undefined || value === '' || value === EMPTY_VALUE ? '未导出' : String(value));
const formatCellValue = (value?: string | number | null) => {
  if (value === null || value === undefined || value === EMPTY_VALUE || value === '') {
    return '未导出';
  }
  return String(value);
};

const curveSourceLabel = (value?: string | null) => {
  if (value === 'real_points') return '数据记录点';
  if (value === 'summary_curve') return '摘要曲线';
  return value ? toChineseLabel(value) : '摘要曲线';
};

const defenseStatusLabel = (value?: string | null) => {
  if (value === 'configured_only') return '已配置 / 未形成完整 benchmark';
  return value ? toChineseLabel(value) : EMPTY_VALUE;
};

const splitModelDataset = (key: string) => {
  const [model, dataset] = key.split('::');
  return {
    model: model || EMPTY_VALUE,
    dataset: dataset || EMPTY_VALUE,
  };
};

const dedupeByVisibleLabel = (values: string[], labeler: (value: string) => string = (value) => value) => {
  const seen = new Set<string>();
  return values.filter((value) => {
    const key = labeler(value).trim().toLowerCase();
    if (!value || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const isSingleWorkbenchModel = (value: string) => Boolean(value && !value.includes('/') && !value.includes(','));

const getPlayRuntimeDefaults = (playId: ExperimentPlayId) => {
  if (playId === 'target_poisoning_play') {
    return {totalRounds: 10, localEpochs: 5, clientSamplingRate: 0.25, learningRate: 0.001, weightDecay: 0, gradientClip: 5};
  }
  if (playId === 'robust_defense_play') {
    return {totalRounds: 1, localEpochs: 1, clientSamplingRate: 0.25, learningRate: 0.001, weightDecay: 0, gradientClip: 5};
  }
  return {totalRounds: 1, localEpochs: 1, clientSamplingRate: 0.25, learningRate: 0.001, weightDecay: 0, gradientClip: 5};
};

const modelSmokeStatusLabel = (status?: string | null) => {
  if (status === 'smoke_verified') return '已通过小规模链路验证';
  if (status === 'partial_smoke_verified') return '部分支持，已通过基础 smoke';
  if (status === 'validate_only') return '仅完成配置校验';
  if (status === 'adapter_required') return '需要适配器';
  if (status === 'failed_smoke') return 'smoke 未通过';
  return status ? toChineseLabel(status) : '未导出';
};

const modelSmokeToneClass = (status?: string | null) => {
  if (status === 'adapter_required' || status === 'failed_smoke') return 'border-amber-200/25 bg-amber-300/10 text-amber-100';
  if (status === 'partial_smoke_verified') return 'border-violet-200/25 bg-violet-300/10 text-violet-100';
  if (status === 'validate_only') return 'border-slate-200/20 bg-white/[0.05] text-slate-200';
  return 'border-emerald-200/25 bg-emerald-300/10 text-emerald-100';
};

const verifiedLabel = (value?: boolean | null) => {
  if (value === true) return '已验证';
  if (value === false) return '未验证';
  return '未导出';
};

const getSmokeResultLabel = (evidence?: ShowcaseModelSmokeEvidence) => {
  if (!evidence) return '未导出';
  return evidence.smokeResultDir || evidence.securityArtifactReady ? '已导出' : '未导出';
};

const getModelSmokeEvidence = (matrix: ShowcaseModelCapabilityMatrix | null | undefined, key: string) => matrix?.modelSmokeEvidence?.[key];

const buildModelSmokeCards = (matrix: ShowcaseModelCapabilityMatrix | null | undefined, keys: string[] | undefined, status: string) =>
  (keys ?? []).map((key) => {
    const fallback = splitModelDataset(key);
    const evidence = getModelSmokeEvidence(matrix, key);
    return {
      key,
      model: evidence?.model ?? fallback.model,
      dataset: evidence?.dataset ?? fallback.dataset,
      status,
      topk: verifiedLabel(evidence?.topkExportVerified),
      metrics: verifiedLabel(evidence?.metricsExportVerified),
      result: getSmokeResultLabel(evidence),
      note: evidence?.failureReason ?? evidence?.reason ?? '链路验证结果已纳入 V3 模型支持面板。',
    };
  });

const interpolate = (start: number, end: number, steps = 18) =>
  Array.from({length: steps}, (_, index) => {
    const t = steps === 1 ? 1 : index / (steps - 1);
    const wave = Math.sin(t * Math.PI) * 0.012;
    return Number((start + (end - start) * t + wave).toFixed(4));
  });

const buildSummaryCurve = (values: Array<number | null | undefined>, fallbackStart: number, fallbackEnd: number) => {
  const numeric = values.filter((value): value is number => typeof value === 'number' && Number.isFinite(value));
  if (numeric.length >= 2) return interpolate(numeric[0], numeric[numeric.length - 1]);
  return interpolate(fallbackStart, fallbackEnd);
};

const asRecord = (value: unknown): Record<string, unknown> | null => (
  value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : null
);

const workbenchDirectionResult = (summary: Record<string, unknown> | null | undefined) => asRecord(summary?.direction_result);

const workbenchFlatMetrics = (summary: Record<string, unknown> | null | undefined): Record<string, unknown> | null => {
  if (!summary) return null;
  const metrics = asRecord(summary.metrics) ?? {};
  const training = asRecord(summary.training) ?? {};
  const directionResult = workbenchDirectionResult(summary) ?? {};
  return {
    ...training,
    ...metrics,
    ...directionResult,
  };
};

const workbenchImageUrl = (value: unknown): string | undefined => {
  if (typeof value !== 'string' || !value.trim()) return undefined;
  const url = value.trim();
  return url.startsWith('/showcase/') ? `/api${url}` : url;
};

const workbenchRecommendationItems = (value: unknown): ShowcaseRecommendationItem[] => {
  if (!Array.isArray(value)) return [];
  return value.map((entry, index) => {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
      return {itemId: String(entry), rank: index + 1, title: `商品 ${String(entry)}`};
    }
    const row = entry as Record<string, unknown>;
    const itemId = row.item_id ?? row.itemId ?? row.id;
    return {
      itemId: itemId == null ? undefined : String(itemId),
      rank: typeof row.rank === 'number' ? row.rank : index + 1,
      title: typeof row.title === 'string' ? row.title : itemId == null ? '候选商品' : `商品 ${String(itemId)}`,
      category: typeof row.category === 'string' ? row.category : undefined,
      thumbnailUrl: workbenchImageUrl(row.thumbnail_url ?? row.thumbnailUrl),
      localImageUrl: workbenchImageUrl(row.local_image_url ?? row.localImageUrl),
      imageUrl: workbenchImageUrl(row.image_url ?? row.imageUrl),
    };
  });
};

interface ChartSeries {
  label: string;
  color: string;
  values: Array<number | null | undefined>;
}

const MultiSeriesChart: React.FC<{series: ChartSeries[]; height?: number}> = ({series, height = 180}) => {
  const width = 720;
  const padding = 24;
  const numericValues = series.flatMap((item) => item.values.filter((value): value is number => typeof value === 'number' && Number.isFinite(value)));
  if (!numericValues.length) return null;
  const min = Math.min(...numericValues);
  const max = Math.max(...numericValues);
  const range = max - min || 1;
  const maxLength = Math.max(...series.map((item) => item.values.length), 2);
  const chartPoints = (values: ChartSeries['values']) => values.map((value, index) => {
    if (typeof value !== 'number' || !Number.isFinite(value)) return null;
    const x = padding + index * ((width - padding * 2) / (maxLength - 1));
    const y = height - padding - ((value - min) / range) * (height - padding * 2);
    return {x, y};
  }).filter((point): point is {x: number; y: number} => point !== null);
  return (
    <div>
      <svg viewBox={`0 0 ${width} ${height}`} className="h-44 w-full rounded-2xl border border-white/10 bg-slate-950/45">
        <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="rgba(148,163,184,0.25)" />
        <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="rgba(148,163,184,0.25)" />
        {series.map((item) => {
          const coordinates = chartPoints(item.values);
          return (
            <g key={item.label}>
              <polyline points={coordinates.map(({x, y}) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ')} fill="none" stroke={item.color} strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
              {coordinates.map(({x, y}, index) => <circle key={index} cx={x} cy={y} r="4" fill={item.color} />)}
            </g>
          );
        })}
      </svg>
      <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-300">
        {series.map((item) => <span key={item.label} className="inline-flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full" style={{backgroundColor: item.color}} />{item.label}</span>)}
      </div>
    </div>
  );
};

const EmptyModuleBlock: React.FC<{message?: string}> = ({message = '本次实验未导出该项分析证据。'}) => (
  <div className="mt-2 rounded-2xl border border-dashed border-white/15 bg-slate-900/40 px-3 py-2 text-xs leading-5 text-slate-400">
    {message}
  </div>
);

const sameItem = (left?: string | number | null, right?: string | number | null) =>
  left !== undefined && left !== null && right !== undefined && right !== null && String(left) === String(right);

// 从 metrics dict 中按 key 列表依次读取第一个非空字符串值。
// 注意：metrics_summary.metrics 是无类型 Record<string, unknown>，键名形态（snake / camel）
// 取决于后端写入；同一语义字段要尝试多个变体以兼容当前和后续 Codex 注入。
const firstStringLike = (record: Record<string, unknown> | null | undefined, keys: string[]): string | null => {
  if (!record) return null;
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string' && value.trim() !== '') return value.trim();
    if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  }
  return null;
};

// 读取看起来像合法 URL 的字段；过滤空值、Windows 路径、UNC 路径。
const firstHttpUrl = (record: Record<string, unknown> | null | undefined, keys: string[]): string | null => {
  if (!record) return null;
  for (const key of keys) {
    const value = record[key];
    if (typeof value !== 'string') continue;
    const trimmed = value.trim();
    if (!trimmed) continue;
    if (/^[a-zA-Z]:[\\/]/.test(trimmed) || trimmed.startsWith('\\\\')) continue;
    return trimmed;
  }
  return null;
};

const getProductTitle = (item?: ShowcaseRecommendationItem | null) => item?.title ?? (item?.itemId ? `商品 ${item.itemId}` : '候选商品');

const getScenarioSourceLabel = (bundle: ShowcaseBundle) => {
  if (bundle.dataSource === 'api') return '真实数据';
  if (bundle.dataSource === 'mixed') return '真实数据 / 部分缺失';
  return 'API 未连接 / 演示数据';
};

const getScenarioSourceTone = (bundle: ShowcaseBundle) => {
  if (bundle.dataSource === 'api') return 'border-emerald-200/30 bg-emerald-300/10 text-emerald-100';
  if (bundle.dataSource === 'mixed') return 'border-amber-200/30 bg-amber-300/10 text-amber-100';
  return 'border-slate-200/25 bg-slate-300/10 text-slate-200';
};

const getDefenseTypeFromRobust = (algorithm: string): DefenseType => {
  switch (algorithm) {
    case 'Krum':
      return 'krum';
    case 'Median':
      return 'robust_defense';
    case 'TrimmedMean':
      return 'trimmed-mean';
    case 'Bulyan':
      return 'robust_defense';
    default:
      return 'robust_defense';
  }
};

const Sparkline: React.FC<{label: string; values: number[]; tone: string; valueText: string; note?: string}> = ({label, values, tone, valueText, note}) => {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const chartPoints = values
    .map((value, index) => {
      const x = (index / Math.max(1, values.length - 1)) * 180;
      const y = 58 - ((value - min) / range) * 48;
      return {x, y};
    });

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-4">
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="text-sm font-bold text-slate-100">{label}</p>
        <p className={cn('font-mono text-sm font-bold', tone)}>{valueText}</p>
      </div>
      <svg viewBox="0 0 180 64" className="h-16 w-full overflow-visible">
        <polyline points={chartPoints.map(({x, y}) => `${x},${y}`).join(' ')} fill="none" stroke="currentColor" strokeWidth="3" className={tone} strokeLinecap="round" strokeLinejoin="round" />
        {chartPoints.map(({x, y}, index) => <circle key={index} cx={x} cy={y} r="3" fill="currentColor" className={tone} />)}
      </svg>
      {note ? <p className="mt-2 text-[11px] text-slate-500">{note}</p> : null}
    </div>
  );
};

const MetricTile: React.FC<{label: string; value: string; note?: string; tone?: string}> = ({label, value, note, tone = 'text-cyan-100'}) => (
  <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-4">
    <p className="text-xs font-bold text-slate-400">{label}</p>
    <p className={cn('mt-2 font-mono text-2xl font-black', tone)}>{value}</p>
    {note ? <p className="mt-2 text-xs leading-5 text-slate-500">{note}</p> : null}
  </div>
);

const ProductImage: React.FC<{item?: Pick<ShowcaseRecommendationItem, 'thumbnailUrl' | 'localImageUrl' | 'imageUrl'> | null; className?: string}> = ({
  item,
  className,
}) => {
  const source = getPublicImage(item);
  if (!source) {
    return (
      <div className={cn('flex items-center justify-center rounded-3xl border border-white/10 bg-slate-900/70 text-slate-500', className)}>
        <ImageOff className="h-8 w-8" />
      </div>
    );
  }

  return <img src={source} alt="商品图片" loading="lazy" referrerPolicy="no-referrer" className={cn('rounded-3xl object-cover', className)} />;
};

export const AttackDefenseRange: React.FC<AttackDefenseRangeProps> = ({
  initialTab = 'orchestration',
  session,
  onDraftConfigChange,
}) => {
  const {bundle, isLoading, setSelectedScenarioId} = useShowcaseBundle();
  const [activeTab, setActiveTab] = useState<WorkbenchTabId>(initialTab);
  const [selectedPlayId, setSelectedPlayId] = useState<ExperimentPlayId>('target_poisoning_play');
  const [expertOpen, setExpertOpen] = useState(true);
  const [paramPanel, setParamPanel] = useState<ParamPanelId>('basic');
  const [aggregationMode, setAggregationMode] = useState<AggregationMode>('plain_updates');
  const [robustAlgorithms, setRobustAlgorithms] = useState<string[]>([]);
  const [dpLayerEnabled, setDpLayerEnabled] = useState(false);
  const [targetItemTitle, setTargetItemTitle] = useState('');
  const [targetItemId, setTargetItemId] = useState('');
  const [targetSearch, setTargetSearch] = useState('');
  const [targetComboboxOpen, setTargetComboboxOpen] = useState(false);
  const [attackStrength, setAttackStrength] = useState<AttackStrength>('strong');
  const [injectionRatio, setInjectionRatio] = useState(0.2);
  const [maxInjectionsPerClient, setMaxInjectionsPerClient] = useState(10);
  const [targetLossWeight, setTargetLossWeight] = useState(1);
  const [targetRankSelector, setTargetRankSelector] = useState('both');
  const [saveTopKEnabled, setSaveTopKEnabled] = useState(true);
  const [exportAuditEnabled, setExportAuditEnabled] = useState(true);
  const [evidenceSource, setEvidenceSource] = useState<EvidenceSource>('auto');
  const [miaModel, setMiaModel] = useState<MiaModel>('rank_proxy');
  const [membershipLabelSource, setMembershipLabelSource] = useState('membership labels');
  const [thresholdStrategy, setThresholdStrategy] = useState('auto');
  const [membershipSampleCount, setMembershipSampleCount] = useState(200);
  const [memberNonmemberRatio, setMemberNonmemberRatio] = useState(1);
  const [membershipMetrics, setMembershipMetrics] = useState(['AUC', 'Accuracy', 'score gap']);
  const [exportPairScores, setExportPairScores] = useState(true);
  const [updateInputSource, setUpdateInputSource] = useState<UpdateInputSource>('client_update');
  const [candidateLimit, setCandidateLimit] = useState<CandidateLimit>('Top50');
  const [candidatePoolSize, setCandidatePoolSize] = useState(500);
  const [clientCountForLeakage, setClientCountForLeakage] = useState(5);
  const [batchSize, setBatchSize] = useState(128);
  const [numWorkers, setNumWorkers] = useState(0);
  const [pinMemory, setPinMemory] = useState(false);
  const [persistentWorkers, setPersistentWorkers] = useState(false);
  const [prefetchFactor, setPrefetchFactor] = useState(2);
  const [ampEnabled, setAmpEnabled] = useState(false);
  const [cacheItemFeaturesOnDevice, setCacheItemFeaturesOnDevice] = useState(true);
  const [nonBlockingTransfer, setNonBlockingTransfer] = useState(true);
  const [reuseClientModelWorkspace, setReuseClientModelWorkspace] = useState(true);
  const [seed, setSeed] = useState(2026);
  const [riskModality, setRiskModality] = useState<RiskModality>('item embedding');
  const [similarityMethod, setSimilarityMethod] = useState<SimilarityMethod>('cosine');
  const [showCandidateImages, setShowCandidateImages] = useState(true);
  const [leakageMetrics, setLeakageMetrics] = useState(['hit@10', 'hit@20', 'hit@50']);
  const [exportReconstruction, setExportReconstruction] = useState(true);
  const [noiseStrength, setNoiseStrength] = useState(0.15);
  const [dpMaxGradNorm, setDpMaxGradNorm] = useState(5);
  const [dpTargetDelta, setDpTargetDelta] = useState(0.00001);
  const [dpSeed, setDpSeed] = useState(2026);
  const [anomalyClientRatio, setAnomalyClientRatio] = useState(0.2);
  const [baseAttack, setBaseAttack] = useState<BaseAttack>('none');
  const [perturbationType, setPerturbationType] = useState<PerturbationType>('sign_flip');
  const [perturbationStrength, setPerturbationStrength] = useState(1.5);
  const [trimRatio, setTrimRatio] = useState(0.2);
  const [trimMinKeep, setTrimMinKeep] = useState(2);
  const [krumF, setKrumF] = useState(1);
  const [multiKrumEnabled, setMultiKrumEnabled] = useState(false);
  const [distanceMetric, setDistanceMetric] = useState('cosine');
  const [defensePreprocessClipNorm, setDefensePreprocessClipNorm] = useState(5);
  const [outlierStrategy, setOutlierStrategy] = useState('clip');
  const [bulyanF, setBulyanF] = useState(1);
  const [bulyanSelectionRatio, setBulyanSelectionRatio] = useState(0.5);
  const [defenseMetrics, setDefenseMetrics] = useState(['Recall@50', 'NDCG@50', '防御恢复率', '异常过滤']);
  const [highlightedParam, setHighlightedParam] = useState('');
  const [actionState, setActionState] = useState<ActionState>('idle');
  const [defenseActive, setDefenseActive] = useState(true);
  const [submitMessage, setSubmitMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [comparisonBundles, setComparisonBundles] = useState<ShowcaseBundle[]>([]);
  const [comparisonMode, setComparisonMode] = useState<ComparisonMode>('none');
  const [archivePage, setArchivePage] = useState(1);
  const [switchMessage, setSwitchMessage] = useState('');
  const [workbenchOptions, setWorkbenchOptions] = useState<WorkbenchOptionsResponse | null>(null);
  const [workbenchOptionsError, setWorkbenchOptionsError] = useState('');
  const [validationResult, setValidationResult] = useState<WorkbenchValidationResponse | null>(null);
  const [workbenchJob, setWorkbenchJob] = useState<WorkbenchJobStatusResponse | null>(null);
  const [workbenchResult, setWorkbenchResult] = useState<WorkbenchResultResponse | null>(null);
  const [workbenchLogs, setWorkbenchLogs] = useState<string[]>([]);
  const [workbenchJobId, setWorkbenchJobId] = useState('');
  const [logPollingPaused, setLogPollingPaused] = useState(false);
  const [workbenchJobs, setWorkbenchJobs] = useState<WorkbenchJobListResponse | null>(null);
  const [workbenchJobsError, setWorkbenchJobsError] = useState('');
  const [jobDirectionFilter, setJobDirectionFilter] = useState('');
  const [jobDatasetFilter, setJobDatasetFilter] = useState('');
  const [jobModelFilter, setJobModelFilter] = useState('');
  const [jobSourceFilter, setJobSourceFilter] = useState('');
  const [jobStatusFilter, setJobStatusFilter] = useState('');
  const [jobDateFromFilter, setJobDateFromFilter] = useState('');
  const [jobDateToFilter, setJobDateToFilter] = useState('');
  const autoSelectedRef = useRef(false);
  const initializedPlaybookConfigRef = useRef(false);
  const workbenchPollTokenRef = useRef(0);
  const robustAlgorithm = robustAlgorithms[0] ?? 'none';

  const {report, selectedScenario} = bundle;
  const config = session.draftTrainConfig;
  const parameterDescriptors = workbenchOptions?.parameter_descriptors ?? {};
  const getParameterDescriptor = (key: string): WorkbenchParameterDescriptor => parameterDescriptors[key] ?? {type: 'number', label: PARAMETER_LABEL_FALLBACKS[key] ?? key};
  const descriptorNumber = (key: string, property: 'min' | 'max' | 'step' | 'default', fallback: number) => {
    const value = getParameterDescriptor(key)[property];
    return typeof value === 'number' ? value : fallback;
  };
  const descriptorOptions = <T extends string | number>(key: string, fallback: T[]): T[] => {
    const options = getParameterDescriptor(key).options;
    return options?.length ? options as T[] : fallback;
  };
  const clientSamplingRate = config.clientSamplingRate ?? descriptorNumber('client_sampling_ratio', 'default', 0.25);
  const sampledClientCount = Math.max(1, Math.ceil((config.clientCount || 100) * clientSamplingRate));
  const krumFMax = Math.max(0, Math.floor((sampledClientCount - 3) / 2));
  const bulyanFMax = Math.max(0, Math.floor((sampledClientCount - 3) / 4));
  const robustAlgorithmUnavailable = (algorithm: string) =>
    (algorithm === 'Krum' || algorithm === 'Bulyan') ? sampledClientCount < 3 : algorithm === 'TrimmedMean' ? sampledClientCount < 2 : false;
  const selectedPlay = getExperimentPlaybook(selectedPlayId);
  const selectedPlayDefaults = {
    dataset: selectedPlay.dataset,
    model: selectedPlay.model,
    attackLabel: selectedPlay.id === 'robust_defense_play' ? BASE_ATTACK_LABELS[baseAttack] : selectedPlay.attackType,
    defenseLabel: selectedPlay.defenseType,
    targetLabel: selectedPlay.targetLabel,
    maliciousRatio: selectedPlay.maliciousRatio,
    aggregationMode: selectedPlay.aggregationMode,
    robustAlgorithm: selectedPlay.robustAlgorithm,
    dpLayer: selectedPlay.dpLayer,
    observations: selectedPlay.auditMetrics,
    scenarioKeywords: selectedPlay.scenarioKeywords,
    analysisOrder: selectedPlay.analysisOrder,
  };
  const activeJobMetricsSummary = asRecord(workbenchResult?.metrics_summary);
  const activeJobDirectionResult = workbenchDirectionResult(activeJobMetricsSummary);
  const activeJobMetrics = workbenchFlatMetrics(activeJobMetricsSummary);
  // 当前 job 的目标商品字段优先；仅 itemId 时显示“商品 {id}”。
  const workbenchTargetInfo = useMemo<WorkbenchTargetContext | null>(() => {
    if (!activeJobMetrics) return null;
    const nested = asRecord(activeJobMetrics.target_item_info);
    const itemId = firstStringLike(activeJobMetrics, ['target_item_id', 'targetItemId'])
      ?? firstStringLike(nested, ['item_id', 'itemId']);
    if (itemId == null || itemId === '') return null;
    const title = firstStringLike(activeJobMetrics, ['target_item_title', 'targetItemTitle'])
      ?? firstStringLike(nested, ['title']);
    const category = firstStringLike(activeJobMetrics, ['target_item_category', 'targetItemCategory'])
      ?? firstStringLike(nested, ['category']);
    const thumbnailUrl = firstHttpUrl(activeJobMetrics, [
      'target_item_thumbnail_url', 'targetItemThumbnailUrl',
      'target_item_thumbnail', 'target_thumbnail_url',
    ]) ?? firstHttpUrl(nested, ['thumbnail_url', 'thumbnailUrl']);
    const localImageUrl = firstHttpUrl(activeJobMetrics, [
      'target_item_local_image_url', 'targetItemLocalImageUrl',
      'target_item_local_image', 'target_local_image_url',
    ]) ?? firstHttpUrl(nested, ['local_image_url', 'localImageUrl']);
    const imageUrl = firstHttpUrl(activeJobMetrics, [
      'target_item_image_url', 'targetItemImageUrl',
      'target_item_image', 'target_image_url',
    ]) ?? firstHttpUrl(nested, ['image_url', 'imageUrl']);
    return {
      itemId,
      title,
      category,
      thumbnailUrl: workbenchImageUrl(thumbnailUrl),
      localImageUrl: workbenchImageUrl(localImageUrl),
      imageUrl: workbenchImageUrl(imageUrl),
    };
  }, [activeJobMetrics]);
  const jobMetricNumber = (key: string) => {
    const value = activeJobMetrics?.[key];
    return typeof value === 'number' && Number.isFinite(value) ? value : null;
  };
  const jobMetricBoolean = (key: string) => {
    const value = activeJobMetrics?.[key];
    return typeof value === 'boolean' ? value : null;
  };
  const activeJobDefenses = Array.isArray(activeJobMetrics?.active_defenses)
    ? activeJobMetrics.active_defenses
    : [];
  const jobRecommendationItems = (key: 'baseline_top50' | 'attack_top50' | 'defense_top50'): ShowcaseRecommendationItem[] => {
    const directionKey = key === 'baseline_top50'
      ? 'baseline_recommendations'
      : key === 'attack_top50'
        ? 'attack_recommendations'
        : 'defense_recommendations';
    const currentItems = workbenchRecommendationItems(activeJobDirectionResult?.[directionKey]);
    if (currentItems.length) return currentItems;
    const value = activeJobMetrics?.[key];
    if (!value || typeof value !== 'object' || Array.isArray(value)) return [];
    const items = (value as Record<string, unknown>).items;
    return workbenchRecommendationItems(items);
  };
  const jobBaselineTop50 = jobRecommendationItems('baseline_top50');
  const jobAttackTop50 = jobRecommendationItems('attack_top50');
  const jobDefenseTop50 = jobRecommendationItems('defense_top50');
  const jobRecommendationComparison: ShowcaseRecommendationComparison | null = activeJobMetrics && (jobBaselineTop50.length || jobAttackTop50.length || jobDefenseTop50.length)
    ? {
        baseline: jobBaselineTop50,
        attack: jobAttackTop50,
        defense: jobDefenseTop50,
        totalCounts: {baseline: jobBaselineTop50.length, attack: jobAttackTop50.length, defense: jobDefenseTop50.length},
        limit: 50,
      }
    : null;
  const activeRecommendationComparison = workbenchResult ? jobRecommendationComparison : report.recommendationComparison;
  const rankStats = getTargetRanks(report);
  const fallbackBefore = selectedPlay.id === 'target_poisoning_play' ? 170 : null;
  const fallbackAfter = selectedPlay.id === 'target_poisoning_play' ? 3 : null;
  const displayRankBefore = activeJobMetrics ? jobMetricNumber('target_rank_before') : rankStats.before ?? fallbackBefore;
  const displayRankAfter = activeJobMetrics ? jobMetricNumber('target_rank_after') : rankStats.after ?? fallbackAfter;
  const computedRankLift = typeof displayRankBefore === 'number' && typeof displayRankAfter === 'number'
    ? displayRankBefore - displayRankAfter
    : null;
  const displayRankLift = jobMetricNumber('rank_gain')
    ?? (activeJobMetrics ? computedRankLift : rankStats.rankLift ?? computedRankLift);
  const computedNormalizedLift = displayRankLift !== null && typeof displayRankBefore === 'number' && displayRankBefore > 1
    ? displayRankLift / (displayRankBefore - 1)
    : null;
  const displayNormalizedLift = activeJobMetrics
    ? computedNormalizedLift
    : rankStats.normalizedLift ?? computedNormalizedLift;
  const computedReciprocalGain = typeof displayRankBefore === 'number' && typeof displayRankAfter === 'number' && displayRankBefore > 0 && displayRankAfter > 0
    ? 1 / displayRankAfter - 1 / displayRankBefore
    : null;
  const displayReciprocalGain = activeJobMetrics
    ? computedReciprocalGain
    : rankStats.reciprocalGain ?? computedReciprocalGain;
  const jobMaskedTop50Hit = jobMetricBoolean('masked_top50_hit');
  const displayFinalExposure = jobMaskedTop50Hit === null
    ? activeJobMetrics ? '未导出' : getFinalExposureText(report)
    : jobMaskedTop50Hit ? '最终曝光命中' : '最终曝光未命中';
  const privacyMetrics = getPrivacyMetrics(report);
  const v3TargetPanel = report.v3?.targetManipulation ?? null;
  const v3MembershipPanel = report.v3?.membership ?? null;
  const v3AggregationPanel = report.v3?.aggregationDefense ?? null;
  const v3CurvesPanel = report.v3?.curves ?? null;
  const v3RuntimePanel = report.v3?.runtime ?? null;
  const v3EvidenceAvailable = Boolean(report.v3 || selectedScenario.hasV3);
  // 数据集名（后端 ID 形态）用于图片兜底；展示名（"Amazon Beauty"/"KU 多模态数据集"）
  // 在 normalizeShowcaseDataset 里被映射回后端 ID。
  const targetBoardDataset = normalizeShowcaseDataset(
    (typeof activeJobMetrics?.dataset === 'string' ? (activeJobMetrics.dataset as string) : null)
    ?? workbenchJob?.dataset
    ?? config.dataset,
  );
  const targetProduct = getTargetProduct(report, workbenchTargetInfo);
  const targetImageItem = targetProduct
    ? (() => {
        // 三个 URL 字段全空 + itemId 与 datasetId 都存在时，兜底拼 /api/showcase/images/{datasetId}/{itemId}?size=thumb。
        // 失败时现有 ProductImage 的 onError 链会落到 <ImageOff /> 占位，不回退 V3 旧 fixture。
        const itemId = targetProduct.itemId;
        const hasUrl = Boolean(targetProduct.thumbnailUrl || targetProduct.localImageUrl || targetProduct.imageUrl);
        const fallbackUrl =
          !hasUrl
          && itemId !== undefined
          && itemId !== null
          && targetBoardDataset
            ? `/api/showcase/images/${encodeURIComponent(targetBoardDataset)}/${encodeURIComponent(String(itemId))}?size=thumb`
            : null;
        return {
          thumbnailUrl: targetProduct.thumbnailUrl ?? fallbackUrl,
          localImageUrl: targetProduct.localImageUrl,
          imageUrl: targetProduct.imageUrl,
        };
      })()
    : null;
  const recommendationCounts = getRecommendationCounts(activeRecommendationComparison);
  const targetAppearsInLoadedList = [
    ...(activeRecommendationComparison?.baseline ?? []),
    ...(activeRecommendationComparison?.attack ?? []),
    ...(activeRecommendationComparison?.defense ?? []),
  ].some((item) => sameItem(item.itemId, targetProduct?.itemId));

  useEffect(() => {
    if (targetProduct?.title) {
      setTargetItemTitle(targetProduct.title);
    }
    if (targetProduct?.itemId !== undefined && targetProduct?.itemId !== null) {
      setTargetItemId(String(targetProduct.itemId));
    }
  }, [targetProduct?.itemId, targetProduct?.title]);

  useEffect(() => {
    setKrumF((value) => Math.min(Math.max(0, value), krumFMax));
    setBulyanF((value) => Math.min(Math.max(0, value), bulyanFMax));
    setTrimMinKeep((value) => Math.min(Math.max(2, value), Math.max(2, sampledClientCount)));
    const selectedAlgorithmUnavailable =
      (robustAlgorithm === 'Krum' || robustAlgorithm === 'Bulyan') ? sampledClientCount < 3 : robustAlgorithm === 'TrimmedMean' ? sampledClientCount < 2 : false;
    if (robustAlgorithm !== 'none' && selectedAlgorithmUnavailable) {
      setRobustAlgorithms([]);
    }
  }, [bulyanFMax, krumFMax, robustAlgorithm, sampledClientCount]);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    if (!highlightedParam) return;
    const timer = window.setTimeout(() => setHighlightedParam(''), 900);
    return () => window.clearTimeout(timer);
  }, [highlightedParam]);

  useEffect(() => {
    if (autoSelectedRef.current || !bundle.scenarios.length) return;
    const preferred =
      bundle.scenarios.find((scenario) => scenario.scenarioId.includes('amazon_beauty_poc_security_v3')) ??
      bundle.scenarios.find((scenario) => scenario.hasV3) ??
      bundle.scenarios.find((scenario) => scenario.scenarioId.includes('amazon_beauty_poc_v25_backend_smoke')) ??
      bundle.scenarios.find((scenario) => scenario.scenarioId.toLowerCase().includes('v25'));
    if (preferred && selectedScenario.scenarioId !== preferred.scenarioId) {
      autoSelectedRef.current = true;
      setSelectedScenarioId(preferred.scenarioId);
    }
  }, [bundle.scenarios, selectedScenario.scenarioId, setSelectedScenarioId]);

  useEffect(() => {
    let active = true;
    const preferredIds = [
      selectedScenario.scenarioId,
      ...bundle.scenarios
        .filter((scenario) => /ku|amazon|v25|krum|matrix|capability|privacy|security/i.test(`${scenario.scenarioId} ${scenario.name}`))
        .map((scenario) => scenario.scenarioId),
    ];
    const uniqueIds = Array.from(new Set(preferredIds)).slice(0, 8);
    Promise.all(uniqueIds.map((scenarioId) => loadShowcaseBundle(scenarioId)))
      .then((items) => {
        if (active) setComparisonBundles(items);
      })
      .catch(() => {
        if (active) setComparisonBundles([bundle]);
      });
    return () => {
      active = false;
    };
  }, [bundle.scenarios, selectedScenario.scenarioId]);

  useEffect(() => {
    let active = true;
    fetchWorkbenchOptions()
      .then((options) => {
        if (!active) return;
        setWorkbenchOptions(options);
        setWorkbenchOptionsError('');
        const descriptors = options.parameter_descriptors ?? {};
        const numberDefault = (key: string, fallback: number) => typeof descriptors[key]?.default === 'number' ? descriptors[key].default as number : fallback;
        const stringDefault = <T extends string>(key: string, fallback: T) => typeof descriptors[key]?.default === 'string' ? descriptors[key].default as T : fallback;
        const booleanDefault = (key: string, fallback: boolean) => typeof descriptors[key]?.default === 'boolean' ? descriptors[key].default as boolean : fallback;
        setBatchSize(numberDefault('batch_size', 128));
        setNumWorkers(numberDefault('num_workers', 0));
        setPinMemory(booleanDefault('pin_memory', false));
        setPersistentWorkers(booleanDefault('persistent_workers', false));
        setPrefetchFactor(numberDefault('prefetch_factor', 2));
        setAmpEnabled(booleanDefault('amp_enabled', false));
        setCacheItemFeaturesOnDevice(booleanDefault('cache_item_features_on_device', true));
        setNonBlockingTransfer(booleanDefault('non_blocking_transfer', true));
        setReuseClientModelWorkspace(booleanDefault('reuse_client_model_workspace', true));
        setSeed(numberDefault('seed', 2026));
        setInjectionRatio(numberDefault('injection_ratio', 0.2));
        setMaxInjectionsPerClient(numberDefault('max_injections_per_client', 10));
        setTargetLossWeight(numberDefault('target_loss_weight', 1));
        setTargetRankSelector(stringDefault('target_rank_selector', 'both'));
        setAttackStrength(stringDefault<AttackStrength>('attack_strength', 'strong'));
        setTrimRatio(numberDefault('trim_ratio', 0.2));
        setTrimMinKeep(numberDefault('trim_min_keep', 2));
        setDistanceMetric(stringDefault('distance_metric', 'cosine'));
        setDefensePreprocessClipNorm(numberDefault('gradient_clip_norm', 5));
        setOutlierStrategy(stringDefault('outlier_strategy', 'clip'));
        setBulyanSelectionRatio(numberDefault('bulyan_selection_ratio', 0.5));
        setNoiseStrength(numberDefault('noise_multiplier', 0.15));
        setDpMaxGradNorm(numberDefault('max_grad_norm', 5));
        setDpTargetDelta(numberDefault('target_delta', 0.00001));
        setDpSeed(numberDefault('dp_seed', 2026));
        setSaveTopKEnabled(Boolean(descriptors.save_topk?.default ?? true));
        setExportAuditEnabled(Boolean(descriptors.export_artifact?.default ?? true));
        const defaultTarget = options.target_items?.[0];
        if (defaultTarget?.item_id) {
          setTargetItemId(String(defaultTarget.item_id));
          setTargetItemTitle(`${defaultTarget.short_name_zh ?? defaultTarget.display_name_zh ?? defaultTarget.short_title ?? defaultTarget.title} · ${defaultTarget.item_id}`);
        }
      })
      .catch((error) => {
        if (!active) return;
        setWorkbenchOptionsError(error instanceof Error ? error.message : String(error));
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!workbenchJobId || logPollingPaused) return;
    let active = true;
    const pollToken = workbenchPollTokenRef.current;
    const refresh = () => {
      Promise.all([fetchWorkbenchJob(workbenchJobId), fetchWorkbenchLogs(workbenchJobId, 100)])
        .then(([job, logs]: [WorkbenchJobStatusResponse, WorkbenchLogsResponse]) => {
          if (!active || pollToken !== workbenchPollTokenRef.current) return;
          setWorkbenchJob(job);
          setWorkbenchLogs(logs.lines ?? []);
          if (job.status && WORKBENCH_TERMINAL_STATUSES.has(job.status)) {
            fetchWorkbenchResult(workbenchJobId)
              .then((result) => {
                if (active && pollToken === workbenchPollTokenRef.current) {
                  setWorkbenchResult(result);
                  setLogPollingPaused(true);
                }
              })
              .catch(() => {
                if (active && pollToken === workbenchPollTokenRef.current) {
                  setWorkbenchResult((current) => current);
                  setLogPollingPaused(true);
                }
              });
          }
        })
        .catch(() => {
          if (!active || pollToken !== workbenchPollTokenRef.current) return;
          setWorkbenchLogs((lines) => (lines.length ? lines : ['[Workbench] 暂时无法读取任务日志。']));
        });
    };
    refresh();
    const timer = window.setInterval(refresh, 1500);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [logPollingPaused, workbenchJobId]);

  useEffect(() => {
    if (activeTab !== 'history') return;
    let active = true;
    fetchWorkbenchJobs({
      limit: 12,
      page: archivePage,
      direction: jobDirectionFilter,
      dataset: jobDatasetFilter,
      model: jobModelFilter,
      source: jobSourceFilter,
      status: jobStatusFilter,
      date_from: jobDateFromFilter,
      date_to: jobDateToFilter,
    })
      .then((result) => {
        if (!active) return;
        setWorkbenchJobs(result);
        setWorkbenchJobsError('');
      })
      .catch((error) => {
        if (!active) return;
        setWorkbenchJobs(null);
        setWorkbenchJobsError(error instanceof Error ? error.message : String(error));
      });
    return () => {
      active = false;
    };
  }, [activeTab, archivePage, jobDateFromFilter, jobDateToFilter, jobDatasetFilter, jobDirectionFilter, jobModelFilter, jobSourceFilter, jobStatusFilter]);

  // 单次分析对象回退：进入"单次分析" Tab 且当前没有打开的 job 时，
  // 从 /workbench/jobs 中按 started_at 降序（不是 job_id 字符串）选择一条
  // status in {completed, partial} 且有 result 的最近可分析 job 并自动打开。
  useEffect(() => {
    if (activeTab !== 'analysis') return;
    if (workbenchJobId) return;
    let active = true;
    fetchWorkbenchJobs({limit: 12, page: 1})
      .then((result) => {
        if (!active) return;
        setWorkbenchJobs(result);
        setWorkbenchJobsError('');
        const candidate = pickMostRecentAnalyzableJob(result.items);
        if (candidate && active) {
          void openWorkbenchJob(candidate);
        }
      })
      .catch((error) => {
        if (!active) return;
        setWorkbenchJobs(null);
        setWorkbenchJobsError(error instanceof Error ? error.message : String(error));
      });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, workbenchJobId]);

  const datasetOptions = useMemo(() => {
    const optionValues = workbenchOptions?.datasets?.map((item) => item.id).filter((item) => item === 'AMAZON_BEAUTY_POC' || item === 'KU') ?? [];
    const values = optionValues.length ? optionValues : ['AMAZON_BEAUTY_POC', 'KU'];
    return dedupeByVisibleLabel(values, datasetLabel);
  }, [workbenchOptions?.datasets]);

  const modelOptions = useMemo(() => {
    const optionValues = workbenchOptions?.models?.map((item) => item.id).filter(isSingleWorkbenchModel) ?? [];
    const values = optionValues.length ? optionValues : ['FedAvg', 'FedRAP', 'FedNCF', 'FCF', 'MMFedAvg', 'MMFedRAP', 'MMFedNCF', 'MMFCF'];
    return dedupeByVisibleLabel(values);
  }, [workbenchOptions?.models]);

  const getModelExecutionCapability = (model = config.model || selectedPlayDefaults.model, dataset = config.dataset || selectedPlayDefaults.dataset) =>
    workbenchOptions?.model_dataset_execution?.[dataset]?.[model] ?? null;

  const getModelDatasetHint = (model = config.model || selectedPlayDefaults.model, dataset = config.dataset || selectedPlayDefaults.dataset) => {
    const capability = getModelExecutionCapability(model, dataset);
    if (capability?.message) return capability.message;
    if (capability?.status === 'full_train') return '当前组合可启动真实全量训练。';
    if (capability?.status === 'partial') return '部分支持，真实效果不能写成完整 benchmark。';
    if (capability?.status === 'unsupported') return '当前组合不支持工作台全量训练，校验时会返回明确原因。';
    return '当前组合能否启动真实全量训练由校验接口返回。';
  };

  const targetOptions = useMemo(() => {
    if (workbenchOptions?.target_items?.length) {
      return workbenchOptions.target_items.map((item) => ({
        id: item.item_id,
        title: `${item.short_name_zh ?? item.display_name_zh ?? item.short_title ?? item.title} · ${item.item_id}`,
        rawTitle: item.raw_title ?? item.title,
        category: item.category_zh ?? item.category ?? '',
        thumbnailUrl: item.thumbnail_url ?? null,
        imageUrl: item.image_url ?? null,
      }));
    }
    const items = [
      targetProduct
        ? {
            id: targetProduct.itemId ?? targetProduct.title,
            title: targetProduct.title ?? targetProduct.itemId ?? 'Empty Amber Glass Spray Bottles',
            rawTitle: targetProduct.title ?? '',
            category: targetProduct.category ?? '',
            thumbnailUrl: targetProduct.thumbnailUrl ?? null,
            imageUrl: targetProduct.imageUrl ?? null,
          }
        : null,
      ...(report.recommendationComparison?.attack ?? []).slice(0, 12).map((item) => ({
        id: item.itemId,
        title: item.title ?? `商品 ${item.itemId}`,
        rawTitle: item.title ?? '',
        category: item.category ?? '',
        thumbnailUrl: item.thumbnailUrl ?? null,
        imageUrl: item.imageUrl ?? null,
      })),
      ...(report.recommendationComparison?.baseline ?? []).slice(0, 8).map((item) => ({
        id: item.itemId,
        title: item.title ?? `商品 ${item.itemId}`,
        rawTitle: item.title ?? '',
        category: item.category ?? '',
        thumbnailUrl: item.thumbnailUrl ?? null,
        imageUrl: item.imageUrl ?? null,
      })),
    ].filter((item): item is {id?: string | number | null; title: string; rawTitle: string; category: string; thumbnailUrl?: string | null; imageUrl?: string | null} => Boolean(item?.title));
    const seen = new Set<string>();
    const unique = items.filter((item) => {
      const key = String(item.id ?? item.title);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    return unique.length
      ? unique
      : [{id: 'empty-amber-glass-spray-bottles', title: '琥珀喷雾瓶', rawTitle: 'Empty Amber Glass Spray Bottles', category: '美妆工具', thumbnailUrl: null, imageUrl: null}];
  }, [report.recommendationComparison?.attack, report.recommendationComparison?.baseline, targetProduct, workbenchOptions?.target_items]);

  const selectedTargetOption = targetOptions.find((item) => String(item.id ?? item.title) === targetItemId) ?? targetOptions[0];
  const filteredTargetOptions = useMemo(() => {
    const query = targetSearch.trim().toLowerCase();
    if (!query) return targetOptions.slice(0, 24);
    return targetOptions
      .filter((item) => `${item.title} ${item.rawTitle} ${item.category} ${item.id ?? ''}`.toLowerCase().includes(query))
      .slice(0, 24);
  }, [targetOptions, targetSearch]);

  const updateConfig = (patch: Partial<TrainConfig>) => {
    onDraftConfigChange({...config, ...patch});
  };

  const markParamChanged = (label: string) => {
    setHighlightedParam(label);
    setSubmitMessage('');
  };

  const findScenarioForPlay = (playId: ExperimentPlayId) => {
    const playbook = getExperimentPlaybook(playId);
    return bundle.scenarios.find((scenario) => {
      const text = scenarioText(scenario);
      return scenario.scenarioId === playbook.recommendedScenarioId || playbook.scenarioKeywords.some((keyword) => text.includes(keyword.toLowerCase()));
    });
  };

  const applyPlaybookToConfig = (playbook: ExperimentPlaybook) => {
    setSelectedPlayId(playbook.id);
    setParamPanel('basic');
    setSubmitMessage('');
    const matchedScenario = findScenarioForPlay(playbook.id);
    if (matchedScenario && matchedScenario.scenarioId !== selectedScenario.scenarioId) {
      setSelectedScenarioId(matchedScenario.scenarioId);
      setSwitchMessage(`已切换到 ${getScenarioTitle(matchedScenario)} 场景`);
    }
    setAggregationMode(playbook.aggregationMode);
    setRobustAlgorithms(playbook.robustAlgorithm !== 'none' ? [playbook.robustAlgorithm] : []);
    setDpLayerEnabled(playbook.dpLayer);
    setBaseAttack('none');
    const defaultTarget = targetOptions[0];
    setTargetItemTitle(defaultTarget?.title ?? targetProduct?.title ?? playbook.targetLabel);
    setTargetItemId(String(defaultTarget?.id ?? targetProduct?.itemId ?? '0'));
    setAttackStrength(playbook.id === 'target_poisoning_play' ? String(getParameterDescriptor('attack_strength').default ?? 'strong') as AttackStrength : attackStrength);
    setSaveTopKEnabled(Boolean(getParameterDescriptor('save_topk').default ?? true));
    setExportAuditEnabled(Boolean(getParameterDescriptor('export_artifact').default ?? true));
    setEvidenceSource(playbook.id === 'membership_privacy_play' ? 'auto' : evidenceSource);
    setCandidateLimit(playbook.id === 'update_leakage_play' ? 'Top50' : candidateLimit);
    setRiskModality(playbook.id === 'update_leakage_play' ? 'item embedding' : riskModality);
    setNoiseStrength(descriptorNumber('noise_multiplier', 'default', 0.15));
    const attacks = playbook.attackModules.includes('target_poisoning') ? ['poisoning_attack'] : [];
    const privacyMetricsList = playbook.attackModules
      .filter((id) => id === 'membership_inference' || id === 'interaction_reconstruction')
      .map((id) => id);
    const enabledDefenses = [
      ...(playbook.dpLayer ? ['dp_noise'] : []),
      ...(playbook.aggregationMode === 'secure_aggregation' ? ['secure_aggregation_sim'] : []),
      ...(playbook.robustAlgorithm !== 'none' ? ['robust_aggregation'] : []),
    ];
    const runtimeDefaults = getPlayRuntimeDefaults(playbook.id);
    updateConfig({
      dataset: playbook.dataset,
      model: playbook.model,
      totalRounds: runtimeDefaults.totalRounds,
      clientSamplingRate: runtimeDefaults.clientSamplingRate,
      learningRate: runtimeDefaults.learningRate,
      attackEnabled: attacks.length > 0,
      attackType: attacks.length > 0 ? 'poisoning_attack' : 'none',
      enabledAttacks: attacks,
      enabledPrivacyMetrics: privacyMetricsList,
      defenseEnabled: enabledDefenses.length > 0,
      defenseType:
        playbook.aggregationMode === 'secure_aggregation'
          ? 'secure-aggregation'
          : playbook.robustAlgorithm !== 'none'
            ? getDefenseTypeFromRobust(playbook.robustAlgorithm)
            : playbook.dpLayer
              ? 'differential-privacy'
              : 'none',
      enabledDefenses,
      poisoningRatio: playbook.maliciousRatio,
      maliciousClientConfig: {
        ...(config.maliciousClientConfig ?? {enabled: false, mode: 'ratio' as const, ratio: 0, clientIds: []}),
        enabled: attacks.length > 0 && playbook.maliciousRatio > 0,
        mode: attacks.length > 0 ? 'ratio' : 'none',
        ratio: playbook.maliciousRatio,
      },
      advanced: {
        ...config.advanced,
        localEpochs: runtimeDefaults.localEpochs,
        weightDecay: runtimeDefaults.weightDecay,
        gradientClip: runtimeDefaults.gradientClip,
        secureAggregation: playbook.aggregationMode === 'secure_aggregation',
      },
      attackParams: {
        ...(config.attackParams ?? {}),
        poisoning_attack: {
          ...((config.attackParams?.poisoning_attack as Record<string, unknown> | undefined) ?? {}),
          target_item_title: targetProduct?.title ?? playbook.targetLabel,
          target_item_id: targetProduct?.itemId ?? undefined,
          strength: playbook.maliciousRatio,
        },
      },
      scenario: attacks.length > 0 ? 'attack_and_defense' : privacyMetricsList.length ? 'privacy_observation' : 'baseline',
      mode: attacks.length > 0 ? 'comparison' : enabledDefenses.length ? 'defense' : 'baseline',
    });
  };

  useEffect(() => {
    if (initializedPlaybookConfigRef.current || !bundle.scenarios.length) return;
    initializedPlaybookConfigRef.current = true;
    applyPlaybookToConfig(getExperimentPlaybook(selectedPlayId));
    // The initial sync should run once after scenario discovery; later direction clicks
    // call applyPlaybookToConfig directly.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bundle.scenarios.length]);

  const setAggregationVisibility = (mode: AggregationMode) => {
    setAggregationMode(mode);
    if (mode === 'secure_aggregation') {
      setRobustAlgorithms([]);
      updateConfig({
        defenseEnabled: true,
        defenseType: 'secure-aggregation',
        enabledDefenses: Array.from(new Set<string>([...(dpLayerEnabled ? ['dp_noise'] : []), 'secure_aggregation_sim'])),
        advanced: {...config.advanced, secureAggregation: true},
      });
      return;
    }

    updateConfig({
      defenseEnabled: dpLayerEnabled || robustAlgorithm !== 'none',
      defenseType: robustAlgorithm !== 'none' ? getDefenseTypeFromRobust(robustAlgorithm) : dpLayerEnabled ? 'differential-privacy' : 'none',
      enabledDefenses: Array.from(new Set<string>([...(dpLayerEnabled ? ['dp_noise'] : []), ...(robustAlgorithm !== 'none' ? ['robust_aggregation'] : [])])),
      advanced: {...config.advanced, secureAggregation: false},
    });
  };

  const selectRobustAlgorithm = (algorithm: string) => {
    if (robustAlgorithmUnavailable(algorithm)) {
      setSubmitMessage(`${robustAggregatorLabel(algorithm)} 的本轮采样客户端数不足。`);
      return;
    }
    setAggregationMode('plain_updates');
    const nextAlgorithms = robustAlgorithms.includes(algorithm) ? [] : [algorithm];
    if (nextAlgorithms.length && algorithm === 'Krum') setKrumF(Math.min(1, krumFMax));
    if (nextAlgorithms.length && algorithm === 'Bulyan') setBulyanF(Math.min(1, bulyanFMax));
    setRobustAlgorithms(nextAlgorithms);
    updateConfig({
      defenseEnabled: nextAlgorithms.length > 0 || dpLayerEnabled,
      defenseType: nextAlgorithms.length > 0 ? getDefenseTypeFromRobust(nextAlgorithms[0]) : dpLayerEnabled ? 'differential-privacy' : 'none',
      enabledDefenses: Array.from(new Set<string>([...(dpLayerEnabled ? ['dp_noise'] : []), ...(nextAlgorithms.length > 0 ? ['robust_aggregation'] : [])])),
      advanced: {...config.advanced, secureAggregation: false},
    });
  };

  const clearRobustAlgorithm = () => {
    setRobustAlgorithms([]);
    const defenses = new Set<string>(config.enabledDefenses ?? []);
    defenses.delete('robust_aggregation');
    if (aggregationMode === 'secure_aggregation') defenses.add('secure_aggregation_sim');
    if (dpLayerEnabled) defenses.add('dp_noise');
    updateConfig({
      defenseEnabled: defenses.size > 0,
      defenseType: aggregationMode === 'secure_aggregation' ? 'secure-aggregation' : dpLayerEnabled ? 'differential-privacy' : 'none',
      enabledDefenses: Array.from(defenses),
      advanced: {...config.advanced, secureAggregation: aggregationMode === 'secure_aggregation'},
    });
  };

  const toggleDpLayer = () => {
    const next = !dpLayerEnabled;
    setDpLayerEnabled(next);
    const defenses = new Set<string>(config.enabledDefenses ?? []);
    next ? defenses.add('dp_noise') : defenses.delete('dp_noise');
    updateConfig({
      defenseEnabled: defenses.size > 0 || aggregationMode === 'secure_aggregation' || robustAlgorithm !== 'none',
      defenseType: aggregationMode === 'secure_aggregation' ? 'secure-aggregation' : robustAlgorithm !== 'none' ? getDefenseTypeFromRobust(robustAlgorithm) : next ? 'differential-privacy' : 'none',
      enabledDefenses: Array.from(defenses),
    });
  };

  const buildWorkbenchPayload = (): WorkbenchPayload => {
    const directionByPlay: Record<ExperimentPlayId, WorkbenchPayload['direction']> = {
      target_poisoning_play: 'recommendation_manipulation',
      membership_privacy_play: 'membership_inference',
      update_leakage_play: 'update_leakage',
      robust_defense_play: 'aggregation_defense',
    };
    return {
      direction: directionByPlay[selectedPlay.id],
      execution_mode: 'full_train',
      scenario_id: selectedScenario.scenarioId,
      dataset: config.dataset || selectedPlayDefaults.dataset,
      model: config.model || selectedPlayDefaults.model,
      total_rounds: config.totalRounds || 10,
      local_epochs: config.advanced.localEpochs || 5,
      client_sampling_ratio: clientSamplingRate,
      learning_rate: config.learningRate || 0.001,
      weight_decay: config.advanced.weightDecay ?? 0,
      gradient_clip: config.advanced.gradientClip ?? 5,
      seed,
      top_k: 50,
      total_client_count: config.clientCount || 100,
      aggregation_mode: aggregationMode,
      robust_aggregators: aggregationMode === 'secure_aggregation' ? [] : robustAlgorithms,
      dp_noise_enabled: dpLayerEnabled,
      dp_noise_std: noiseStrength,
      noise_multiplier: noiseStrength,
      max_grad_norm: dpMaxGradNorm,
      target_delta: dpTargetDelta,
      dp_seed: dpSeed,
      batch_size: batchSize,
      num_workers: numWorkers,
      pin_memory: pinMemory,
      persistent_workers: numWorkers > 0 && persistentWorkers,
      prefetch_factor: prefetchFactor,
      amp_enabled: ampEnabled,
      cache_item_features_on_device: cacheItemFeaturesOnDevice,
      non_blocking_transfer: nonBlockingTransfer,
      reuse_client_model_workspace: reuseClientModelWorkspace,
      gradient_clip_norm: defensePreprocessClipNorm,
      outlier_strategy: outlierStrategy,
      trim_ratio: trimRatio,
      trim_min_keep: Math.min(Math.max(2, trimMinKeep), Math.max(2, sampledClientCount)),
      krum_f: Math.min(Math.max(0, krumF), krumFMax),
      multi_krum_enabled: multiKrumEnabled,
      distance_metric: distanceMetric,
      bulyan_f: Math.min(Math.max(0, bulyanF), bulyanFMax),
      bulyan_selection_ratio: bulyanSelectionRatio,
      ...(selectedPlay.id === 'target_poisoning_play' ? {
        malicious_client_ratio: config.poisoningRatio ?? config.maliciousClientConfig?.ratio ?? 0.2,
        target_item_id: targetItemId,
        target_item_title: targetItemTitle,
        attack_strength: attackStrength,
        injection_ratio: injectionRatio,
        max_injections_per_client: maxInjectionsPerClient,
        target_loss_weight: targetLossWeight,
        target_rank_selector: targetRankSelector,
      } : {}),
      ...(selectedPlay.id === 'robust_defense_play' ? {
        base_attack: baseAttack,
        anomaly_client_ratio: anomalyClientRatio,
        perturbation_type: perturbationType,
        perturbation_strength: perturbationStrength,
      } : {}),
      candidate_k: Number(candidateLimit.replace('Top', '')) || 50,
      candidate_pool_size: candidatePoolSize,
      risk_modality: riskModality,
      update_input_source: updateInputSource,
      similarity_method: similarityMethod,
      show_candidate_images: showCandidateImages,
      hit_k: Number(candidateLimit.replace('Top', '')) || 50,
      client_count: clientCountForLeakage,
      mia_evidence_source: evidenceSource,
      mia_model: miaModel,
      label_source: membershipLabelSource,
      threshold_strategy: thresholdStrategy,
      membership_sample_count: membershipSampleCount,
      member_nonmember_ratio: memberNonmemberRatio,
      export_pair_scores: exportPairScores,
      export_reconstruction: exportReconstruction,
      save_topk: saveTopKEnabled,
      export_artifact: exportAuditEnabled,
    };
  };

  const formatWorkbenchFieldErrors = (result?: Pick<WorkbenchValidationResponse, 'errors' | 'field_errors' | 'error_message'> | null) => {
    if (!result) return '';
    const fieldLabels: Record<string, string> = {
      execution_mode: '训练支持',
      dataset: '数据集',
      model: '模型',
      robust_aggregators: '鲁棒聚合',
      base_attack: '基础攻击',
      secure_aggregation_enabled: '安全聚合',
      aggregation_mode: '聚合模式',
      malicious_client_ratio: '恶意客户端比例',
      batch_size: '批大小',
      seed: '随机种子',
      gradient_clip: '梯度裁剪上限',
      injection_ratio: '注入比例',
      max_injections_per_client: '每客户端注入上限',
      attack_strength: '攻击强度',
      target_rank_selector: '目标排名统计口径',
      trim_ratio: '截尾比例',
      trim_min_keep: '最少保留客户端数',
      trimmed_mean_ratio: '截尾比例',
      krum_f: 'Krum 容错恶意客户端数',
      bulyan_f: 'Bulyan 容错恶意客户端数',
      target_item_id: '目标商品',
      client_sampling_ratio: '客户端采样比例',
      candidate_k: '候选 TopK',
      target_loss_weight: '目标损失权重',
      distance_metric: '距离度量',
      gradient_clip_norm: '防御预处理裁剪上限',
      outlier_strategy: '异常值策略',
      bulyan_selection_ratio: '候选选择比例',
      noise_multiplier: '噪声乘数',
      max_grad_norm: '扰动前梯度裁剪上限',
      target_delta: '目标 δ',
      dp_seed: '扰动随机种子',
      perturbation_type: '扰动类型',
    };
    const translateError = (message: string) => {
      if (message.startsWith('full_train_not_available')) return '当前模型 / 数据集 / 方向不支持真实全量训练，请选择支持的组合';
      if (message.startsWith('multiple_robust_aggregators_not_supported')) return '单次实验最多选择一个鲁棒聚合算法';
      if (message.startsWith('aggregation_defense_invalid_base_attack')) return '聚合防御的基础攻击只允许无攻击或恶意模型更新';
      if (message.startsWith('full_train_perturbation_not_supported')) return '当前全量训练链路只支持更新符号翻转';
      if (message.startsWith('secure_aggregation_conflicts_with_robust_aggregation')) return '安全聚合模拟与鲁棒聚合互斥';
      if (message.startsWith('adapter_required_model')) return '模型需要适配器，不能进入启动配置';
      if (message.includes('requires_at_least')) return '本轮采样客户端数不足，不满足所选鲁棒算法条件';
      if (message.includes('_out_of_range') || message.includes('_below_min') || message.includes('_above_max')) return '参数超出允许范围';
      if (message.includes('_invalid_step')) return '参数不符合规定步长';
      if (message.includes('_must_be_integer')) return '参数必须是整数';
      if (message.includes('_invalid_option')) return '参数选项无效';
      return toChineseLabel(message);
    };
    const fieldMessages = Object.entries(result.field_errors ?? {}).flatMap(([field, messages]) =>
      messages.map((message) => `${fieldLabels[field] ?? toChineseLabel(field)}：${translateError(message)}`),
    );
    const messages = [...fieldMessages, ...(result.errors ?? []).map(translateError)];
    return messages.slice(0, 3).join(' / ') || result.error_message || '';
  };

  const handleValidate = async () => {
    setActionState('validating');
    setSubmitMessage('');
    setValidationResult(null);
    try {
      await new Promise((resolve) => window.setTimeout(resolve, 800));
      const result = await validateWorkbenchConfig(buildWorkbenchPayload());
      setValidationResult(result);
      const validationErrorMessage = formatWorkbenchFieldErrors(result);
      setSubmitMessage(
        result.valid
          ? '配置已校验：当前配置可启动真实全量训练。'
          : `配置未通过校验：${validationErrorMessage || '请检查参数'}`,
      );
    } catch (error) {
      setSubmitMessage(`校验失败：${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setActionState('idle');
    }
  };

  const handleStartExperiment = async () => {
    const startedAt = new Date();
    const payload = buildWorkbenchPayload();
    const startedAtLabel = formatDateTimeToSeconds(startedAt) ?? '';
    const jobPayload: WorkbenchPayload = {
      ...payload,
      started_at: toLocalIsoDateTime(startedAt),
      experiment_name: `${workbenchDirectionLabel(payload.direction)} · ${startedAtLabel}`,
    };
    setActionState('starting');
    setSubmitMessage('');
    workbenchPollTokenRef.current += 1;
    setWorkbenchJob(null);
    setWorkbenchResult(null);
    setWorkbenchLogs([]);
    setLogPollingPaused(false);
    try {
      await new Promise((resolve) => window.setTimeout(resolve, 800));
      const result = await createWorkbenchJob(jobPayload);
      setValidationResult(result);
      if (!result.valid || !result.job_id) {
        setSubmitMessage(`启动失败：${result.error_message || result.message || formatWorkbenchFieldErrors(result) || '配置未通过校验'}`);
        return;
      }
      if (result.job_id) {
        setWorkbenchJobId(result.job_id);
        setWorkbenchJob({
          job_id: result.job_id,
          status: result.status ?? result.job_status ?? 'queued',
          stage: result.stage ?? 'queued',
          progress: result.progress ?? 0,
          valid: result.valid,
          experiment_name: result.experiment_name ?? jobPayload.experiment_name,
          started_at: result.started_at ?? jobPayload.started_at,
          direction: result.normalized_config?.direction ? String(result.normalized_config.direction) : null,
          scenario_id: result.normalized_config?.scenario_id ? String(result.normalized_config.scenario_id) : null,
          warnings: result.warnings ?? [],
          errors: result.errors ?? [],
        });
        setWorkbenchLogs([
          `[Workbench] 任务 ${result.job_id} 已进入队列。`,
          '[Train] 已请求真实全量训练；训练参数按当前表单配置提交。',
        ]);
      }
      setSubmitMessage(result.message ?? '已提交真实全量训练任务，正在进入运行监控。');
      setActiveTab('monitoring');
    } catch (error) {
      setSubmitMessage(`启动失败：${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setActionState('idle');
    }
  };

  const openWorkbenchJob = async (job: WorkbenchJobListItem) => {
    workbenchPollTokenRef.current += 1;
    setWorkbenchJobId(job.job_id);
    setWorkbenchJob(null);
    setWorkbenchResult(null);
    setWorkbenchLogs([]);
    setLogPollingPaused(false);
    setSubmitMessage(`已选择 workbench job ${shortWorkbenchJobId(job.job_id)}，单次分析将优先读取该 job result。`);
    try {
      const [statusPayload, logsPayload, resultPayload] = await Promise.all([
        fetchWorkbenchJob(job.job_id),
        fetchWorkbenchLogs(job.job_id, 100),
        fetchWorkbenchResult(job.job_id).catch(() => null),
      ]);
      setWorkbenchJob(statusPayload);
      setWorkbenchLogs(logsPayload.lines ?? []);
      if (resultPayload) setWorkbenchResult(resultPayload);
      if (statusPayload.status && WORKBENCH_TERMINAL_STATUSES.has(statusPayload.status)) {
        setLogPollingPaused(true);
      }
    } catch (error) {
      setWorkbenchJob({
        job_id: job.job_id,
        status: job.status,
        stage: job.status,
        progress: null,
        direction: job.direction,
        dataset: job.dataset,
        model: job.model,
        execution_mode: job.execution_mode,
        requested_execution_mode: job.requested_execution_mode,
        experiment_name: job.experiment_name,
        source: job.source,
        result_dir: job.result_dir,
        artifact_dir: job.artifact_dir,
        created_at: job.created_at,
        started_at: job.started_at,
        finished_at: job.finished_at,
        failure_stage: job.failure_stage,
        error_summary: job.error_summary,
        error_detail: job.error_detail,
        return_code: job.return_code,
        warnings: [],
        errors: [],
        error_message: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setActiveTab('analysis');
    }
  };

  const renderModulePills = (ids: string[]) => (
    <div className="flex flex-wrap gap-2">
      {ids.map((id) => {
        const module = getSecurityModule(id as never);
        if (!module) return null;
        return (
          <span key={id} className={cn('rounded-full border px-2.5 py-1 text-[11px] font-bold', securityToneClass(module.color))}>
            {module.title}
          </span>
        );
      })}
    </div>
  );

  const renderPlayCard = (play: ExperimentPlaybook) => {
    const selected = selectedPlayId === play.id;
    const hasEvidence = getPlayEvidenceState(play.id, bundle.scenarios);
    return (
      <button
        key={play.id}
        type="button"
        onClick={() => applyPlaybookToConfig(play)}
        className={cn(
          'rounded-3xl border p-5 text-left transition hover:-translate-y-0.5',
          selected ? 'border-cyan-200/45 bg-cyan-300/10 shadow-[0_0_24px_rgba(56,189,248,0.12)]' : 'border-white/10 bg-white/[0.045] hover:border-cyan-200/25',
        )}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-lg font-black text-white">{play.title}</p>
            <p className="mt-2 text-sm leading-6 text-slate-400">{play.purpose}</p>
          </div>
          <span
            className={cn(
              'shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-bold',
              hasEvidence ? 'border-emerald-200/30 bg-emerald-300/10 text-emerald-100' : 'border-slate-200/20 bg-slate-300/10 text-slate-300',
            )}
          >
            {hasEvidence ? '有证据' : '待接入证据'}
          </span>
        </div>
        <div className="mt-4 space-y-3">
          <div>
            <p className="mb-2 text-xs font-bold text-slate-500">攻击模块</p>
            {renderModulePills(play.attackModules)}
          </div>
          <div>
            <p className="mb-2 text-xs font-bold text-slate-500">可选防御</p>
            {renderModulePills(play.defenseModules)}
          </div>
          <div>
            <p className="mb-2 text-xs font-bold text-slate-500">观测指标</p>
            {renderModulePills(play.auditModules)}
          </div>
        </div>
        <div className="mt-4 grid gap-3 text-xs text-slate-400 sm:grid-cols-2">
          <span>推荐数据集：<b className="text-slate-200">{datasetLabel(play.dataset)}</b></span>
          <span>推荐模型：<b className="text-slate-200">{play.model}</b></span>
        </div>
      </button>
    );
  };

  const renderExpertControl = (label: string, input: React.ReactNode, note?: string) => (
    <label className="block rounded-2xl border border-white/10 bg-white/[0.045] p-4">
      <span className="mb-2 block text-xs font-bold text-slate-400">{label}</span>
      {input}
      {note ? <span className="mt-2 block text-[11px] leading-5 text-slate-500">{note}</span> : null}
    </label>
  );

  const routeToneClass = (tone: PlaybookRouteTone) => {
    const tones: Record<PlaybookRouteTone, string> = {
      data: 'border-cyan-200/25 bg-cyan-300/10 text-cyan-50 shadow-[0_0_18px_rgba(56,189,248,0.10)]',
      train: 'border-slate-200/20 bg-slate-300/10 text-slate-100',
      attack: 'border-rose-200/35 bg-rose-300/12 text-rose-50 shadow-[0_0_22px_rgba(251,113,133,0.16)]',
      aggregation: 'border-blue-200/25 bg-blue-300/10 text-blue-50',
      defense: 'border-emerald-200/35 bg-emerald-300/12 text-emerald-50 shadow-[0_0_22px_rgba(52,211,153,0.14)]',
      audit: 'border-violet-200/35 bg-violet-300/12 text-violet-50 shadow-[0_0_22px_rgba(168,85,247,0.14)]',
      evidence: 'border-teal-200/35 bg-teal-300/12 text-teal-50 shadow-[0_0_22px_rgba(45,212,191,0.14)]',
      privacy: 'border-fuchsia-200/35 bg-fuchsia-300/12 text-fuchsia-50 shadow-[0_0_22px_rgba(217,70,239,0.14)]',
    };
    return tones[tone];
  };

  const renderPlaybookOrchestration = () => {
    const secureModeActive = aggregationMode === 'secure_aggregation';
    const robustActive = robustAlgorithm !== 'none' && aggregationMode === 'plain_updates';
    const directionMeta: Record<
      ExperimentPlayId,
      {title: string; description: string; Icon: React.ComponentType<{className?: string}>; tone: string}
    > = {
      target_poisoning_play: {
        title: '推荐操纵',
        description: '目标商品投毒，观察排序是否被推高。',
        Icon: Target,
        tone: 'border-rose-200/40 bg-rose-300/12 text-rose-50 shadow-[0_0_24px_rgba(251,113,133,0.16)]',
      },
      membership_privacy_play: {
        title: '成员推断',
        description: '判断某条用户-商品记录是否参与训练。',
        Icon: UserSearch,
        tone: 'border-violet-200/40 bg-violet-300/12 text-violet-50 shadow-[0_0_24px_rgba(168,85,247,0.14)]',
      },
      update_leakage_play: {
        title: '更新泄露',
        description: '从客户端上传更新中推断候选交互。',
        Icon: Database,
        tone: 'border-cyan-200/40 bg-cyan-300/12 text-cyan-50 shadow-[0_0_24px_rgba(56,189,248,0.14)]',
      },
      robust_defense_play: {
        title: '聚合防御',
        description: '比较鲁棒聚合、安全聚合、加噪防护。',
        Icon: ShieldCheck,
        tone: 'border-emerald-200/40 bg-emerald-300/12 text-emerald-50 shadow-[0_0_24px_rgba(52,211,153,0.14)]',
      },
    };
    const aucText = formatMetricValue(privacyMetrics.miaAuc);
    const hit50Text = formatMetricValue(privacyMetrics.hit50);
    const compactFlowNodes: Record<
      ExperimentPlayId,
      Array<{label: string; note: string; tone: PlaybookRouteTone; Icon: React.ComponentType<{className?: string}>; active?: boolean}>
    > = {
      target_poisoning_play: [
        {label: 'Amazon', note: '商品数据', tone: 'data', Icon: Database},
        {label: 'FedVLR', note: '本地训练', tone: 'train', Icon: Layers3},
        {label: '目标注入', note: '红色投毒', tone: 'attack', Icon: Target},
        {label: '聚合', note: '服务端', tone: 'aggregation', Icon: GitCompare},
        {label: '排序审计', note: '未屏蔽', tone: 'audit', Icon: BarChart3},
        {label: `${displayRankBefore ?? 170}→${displayRankAfter ?? 3}`, note: '内部推进', tone: 'evidence', Icon: ChevronRight, active: true},
        {label: 'Top50未命中', note: '最终曝光', tone: 'evidence', Icon: Eye},
      ],
      membership_privacy_play: [
        {label: '推荐结果', note: '排序输出', tone: 'data', Icon: BarChart3},
        {label: '记录标签', note: '成员标注', tone: 'train', Icon: ListChecks},
        {label: '排名证据', note: 'rank 特征', tone: 'privacy', Icon: Eye},
        {label: 'MIA', note: '成员判断', tone: 'attack', Icon: UserSearch},
        {label: aucText === EMPTY_VALUE ? 'AUC' : `AUC ${aucText}`, note: '风险摘要', tone: 'evidence', Icon: Activity, active: true},
      ],
      update_leakage_play: [
        {label: '客户端更新', note: '上传向量', tone: 'data', Icon: Database},
        {label: riskModality, note: '风险模态', tone: 'privacy', Icon: Layers3},
        {label: '候选还原', note: '商品候选', tone: 'attack', Icon: Search},
        {label: candidateLimit, note: hit50Text === EMPTY_VALUE ? '命中摘要' : `hit@50 ${hit50Text}`, tone: 'audit', Icon: BarChart3, active: true},
        {label: '风险摘要', note: '非完整历史', tone: 'evidence', Icon: Archive},
      ],
      robust_defense_play: [
        {label: '客户端更新', note: '多端上传', tone: 'data', Icon: Database},
        {label: aggregationMode === 'secure_aggregation' ? '安全聚合' : '明文聚合', note: aggregationMode === 'secure_aggregation' ? '隐藏单端' : '可见更新', tone: 'aggregation', Icon: Layers3},
        {label: robustAlgorithm !== 'none' ? robustAggregatorLabel(robustAlgorithm) : '普通聚合', note: '鲁棒筛选', tone: 'defense', Icon: ShieldCheck, active: true},
        {label: '过滤异常', note: '拦截红点', tone: 'defense', Icon: Filter},
        {label: '性能恢复', note: 'Recall/NDCG', tone: 'audit', Icon: LineChart},
      ],
    };
    const basicParamsByPlay: Record<ExperimentPlayId, Array<{label: string; value: string}>> = {
      target_poisoning_play: [
        {label: '数据集', value: datasetLabel(config.dataset || 'AMAZON_BEAUTY_POC')},
        {label: '模型', value: config.model || 'FedAvg'},
        {label: '攻击方向', value: '目标商品投毒'},
        {label: '防御策略', value: robustAlgorithm !== 'none' ? robustAggregatorLabel(robustAlgorithm) : '普通聚合'},
        {label: '目标商品', value: selectedTargetOption?.title ?? targetItemTitle},
        {label: '输出证据', value: `${saveTopKEnabled ? '排序 / Top50' : '排序'}${exportAuditEnabled ? ' / 推荐列表' : ''}`},
      ],
      membership_privacy_play: [
        {label: '数据集', value: datasetLabel(config.dataset || selectedPlayDefaults.dataset)},
        {label: '模型', value: config.model || selectedPlayDefaults.model},
        {label: '攻击方向', value: '成员推断'},
        {label: '防御策略', value: dpLayerEnabled ? '更新扰动层' : '可选扰动 / 安全聚合'},
        {label: '观测对象', value: `${membershipLabelSource} / ${thresholdStrategy}`},
        {label: '输出证据', value: membershipMetrics.join(' / ')},
      ],
      update_leakage_play: [
        {label: '数据集', value: datasetLabel(config.dataset || selectedPlayDefaults.dataset)},
        {label: '模型', value: config.model || selectedPlayDefaults.model},
        {label: '攻击方向', value: '客户端更新泄露'},
        {label: '防御策略', value: aggregationMode === 'secure_aggregation' ? '安全聚合模拟' : '可选扰动层'},
        {label: '观测对象', value: `${riskModality} / ${candidateLimit} 候选`},
        {label: '输出证据', value: leakageMetrics.join(' / ')},
      ],
      robust_defense_play: [
        {label: '数据集', value: datasetLabel(config.dataset || selectedPlayDefaults.dataset)},
        {label: '模型', value: config.model || selectedPlayDefaults.model},
        {label: '攻击方向', value: '异常客户端更新'},
        {label: '防御策略', value: secureModeActive ? '安全聚合模拟' : robustAlgorithm !== 'none' ? robustAggregatorLabel(robustAlgorithm) : dpLayerEnabled ? '差分隐私风格加噪' : '普通聚合'},
        {label: '观测对象', value: '异常过滤 / 性能恢复'},
        {label: '输出证据', value: defenseMetrics.join(' / ')},
      ],
    };
    const renderDirectionVisual = (playId: ExperimentPlayId) => {
      if (playId === 'target_poisoning_play') {
        return (
          <div className="relative h-14 w-20 transition duration-300 group-hover:scale-105">
            {[0, 1, 2].map((item) => (
              <span key={item} className="absolute left-1 h-2.5 rounded-full bg-slate-500/45" style={{top: 8 + item * 14, width: 46 - item * 8}} />
            ))}
            <span className="absolute right-2 top-7 h-7 w-7 rounded-xl border border-rose-200/40 bg-rose-300/20" />
            <span className="absolute right-6 top-1 h-10 w-1 rotate-[-38deg] rounded-full bg-rose-300 shadow-[0_0_14px_rgba(251,113,133,0.55)]" />
            <span className="absolute right-4 top-0 h-3 w-3 rotate-45 border-r-2 border-t-2 border-rose-200" />
          </div>
        );
      }
      if (playId === 'membership_privacy_play') {
        return (
          <div className="relative h-14 w-20 transition duration-300 group-hover:scale-105">
            {[8, 18, 30, 42].map((top, index) => <span key={`a-${top}`} className="absolute h-2.5 w-2.5 rounded-full bg-violet-300/80" style={{top, left: 8 + index * 7}} />)}
            {[10, 22, 34, 44].map((top, index) => <span key={`b-${top}`} className="absolute h-2.5 w-2.5 rounded-full bg-cyan-300/80" style={{top, right: 8 + index * 7}} />)}
            <span className="absolute left-1/2 top-1 h-12 w-px rotate-12 bg-violet-100/60 shadow-[0_0_12px_rgba(196,181,253,0.55)]" />
          </div>
        );
      }
      if (playId === 'update_leakage_play') {
        return (
          <div className="relative h-14 w-20 transition duration-300 group-hover:scale-105">
            {[8, 22, 36].map((top) => <span key={top} className="absolute left-1 h-1 w-12 rounded-full bg-cyan-300/70 shadow-[0_0_10px_rgba(56,189,248,0.35)]" style={{top}} />)}
            <span className="absolute right-3 top-3 h-9 w-9 rounded-2xl border border-cyan-200/40 bg-cyan-300/10" />
            <span className="absolute right-7 top-6 h-3 w-3 rounded-full bg-cyan-100/80" />
          </div>
        );
      }
      return (
        <div className="relative h-14 w-20 transition duration-300 group-hover:scale-105">
          <span className="absolute left-5 top-1 h-12 w-12 rounded-full border border-emerald-200/45 bg-emerald-300/10 shadow-[0_0_18px_rgba(52,211,153,0.28)]" />
          <ShieldCheck className="absolute left-8 top-4 h-6 w-6 text-emerald-100" />
          <span className="absolute right-2 top-3 h-2.5 w-2.5 rounded-full bg-rose-300" />
          <span className="absolute right-8 top-0 h-2 w-2 rounded-full bg-rose-300/70" />
          <span className="absolute bottom-2 left-1 h-2 w-2 rounded-full bg-emerald-200" />
        </div>
      );
    };
    const inputClass =
      'w-full min-w-0 max-w-full rounded-2xl border border-white/10 bg-slate-950/60 px-3 py-2 text-sm font-semibold text-slate-100 outline-none transition focus:border-cyan-200/45';
    const numericInputClass = cn(inputClass, 'text-right font-mono tabular-nums');
    const fieldShell = (label: string, control: React.ReactNode, note?: string) => (
      <div className="block min-w-0 rounded-2xl border border-white/10 bg-slate-950/25 p-3">
        <span className="mb-2 block text-xs font-bold text-slate-500">{label}</span>
        {control}
        {note ? <span className="mt-2 block text-[11px] leading-4 text-slate-500">{note}</span> : null}
      </div>
    );
    const segmented = <T extends string,>(
      value: T,
      options: T[],
      onChange: (value: T) => void,
      disabled?: (value: T) => boolean,
      title?: (value: T) => string,
      display?: (value: T) => string,
    ) => (
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const isDisabled = disabled?.(option) ?? false;
          return (
            <button
              key={option}
              type="button"
              disabled={isDisabled}
              title={title?.(option)}
              onClick={() => onChange(option)}
              className={cn(
                'rounded-full border px-3 py-1.5 text-xs font-black transition',
                value === option ? 'border-cyan-200/45 bg-cyan-300/15 text-cyan-50' : 'border-white/10 bg-white/[0.045] text-slate-300 hover:border-cyan-200/25',
                isDisabled ? 'cursor-not-allowed border-slate-700/60 bg-slate-900/40 text-slate-600 hover:border-slate-700/60' : '',
              )}
            >
            {display?.(option) ?? option}
            </button>
          );
        })}
      </div>
    );
    const switchControl = (checked: boolean, onChange: () => void, label: string) => (
      <button
        type="button"
        onClick={onChange}
        className={cn(
          'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-black transition',
          checked ? 'border-emerald-200/40 bg-emerald-300/15 text-emerald-50' : 'border-white/10 bg-white/[0.045] text-slate-400 hover:border-emerald-200/25',
        )}
      >
        <span className={cn('relative h-4 w-8 rounded-full transition', checked ? 'bg-emerald-300/60' : 'bg-slate-700')}>
          <span className={cn('absolute top-0.5 h-3 w-3 rounded-full bg-white transition', checked ? 'left-4' : 'left-0.5')} />
        </span>
        {label}
      </button>
    );
    const tagToggle = (selected: string[], value: string, onChange: (next: string[]) => void, display?: string) => {
      const checked = selected.includes(value);
      return (
        <button
          key={value}
          type="button"
          onClick={() => {
            const next = checked ? selected.filter((item) => item !== value) : [...selected, value];
            onChange(next.length ? next : [value]);
          }}
          className={cn(
            'rounded-full border px-3 py-1.5 text-xs font-black transition',
            checked ? 'border-violet-200/40 bg-violet-300/15 text-violet-50' : 'border-white/10 bg-white/[0.045] text-slate-400 hover:border-violet-200/25',
          )}
        >
          {display ?? value}
        </button>
      );
    };
    const updateDataset = (dataset: string) => {
      markParamChanged('数据集');
      updateConfig({dataset});
    };
    const updateModel = (model: string) => {
      markParamChanged('模型');
      updateConfig({model});
    };
    const updateTotalRounds = (totalRounds: number) => {
      markParamChanged('训练轮数');
      updateConfig({totalRounds});
    };
    const updateLocalEpochs = (localEpochs: number) => {
      markParamChanged('本地轮数');
      updateConfig({advanced: {...config.advanced, localEpochs}});
    };
    const updateClientSamplingRate = (clientSamplingRate: number) => {
      markParamChanged('客户端采样比例');
      updateConfig({clientSamplingRate});
    };
    const updatePoisoningRatio = (ratio: number) => {
      markParamChanged('恶意客户端比例');
      updateConfig({
        poisoningRatio: ratio,
        maliciousClientConfig: {
          ...(config.maliciousClientConfig ?? {enabled: true, mode: 'ratio' as const, ratio: 0, clientIds: []}),
          enabled: ratio > 0,
          mode: 'ratio',
          ratio,
        },
      });
    };
    const renderDatasetControl = () =>
      fieldShell(
        '数据集',
        <select className={inputClass} value={config.dataset || selectedPlayDefaults.dataset} onChange={(event) => updateDataset(event.target.value)}>
          {datasetOptions.map((item) => (
            <option key={item} value={item}>
              {datasetLabel(item)}
            </option>
          ))}
        </select>,
      );
    const renderModelControl = () =>
      fieldShell(
        '模型',
        <select className={inputClass} value={config.model || selectedPlayDefaults.model} onChange={(event) => updateModel(event.target.value)}>
          {modelOptions.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>,
      );
    const renderCommonTrainingControls = () => (
      <>
        <div className="grid gap-3 sm:grid-cols-2">
          {renderDatasetControl()}
          {renderModelControl()}
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {fieldShell(getParameterDescriptor('epochs').label, <input className={inputClass} type="number" min={descriptorNumber('epochs', 'min', 1)} max={descriptorNumber('epochs', 'max', 100)} step={descriptorNumber('epochs', 'step', 1)} value={config.totalRounds || 1} onChange={(event) => updateTotalRounds(Number(event.target.value))} />)}
          {fieldShell(getParameterDescriptor('local_epochs').label, <input className={inputClass} type="number" min={descriptorNumber('local_epochs', 'min', 1)} max={descriptorNumber('local_epochs', 'max', 5)} step={descriptorNumber('local_epochs', 'step', 1)} value={config.advanced.localEpochs || 1} onChange={(event) => updateLocalEpochs(Number(event.target.value))} />)}
          {fieldShell(
            getParameterDescriptor('batch_size').label,
            <select className={inputClass} value={batchSize} onChange={(event) => {
              markParamChanged(getParameterDescriptor('batch_size').label);
              setBatchSize(Number(event.target.value));
            }}>
              {descriptorOptions<number>('batch_size', [32, 64, 128, 256]).map((item) => <option key={item} value={item}>{item}</option>)}
            </select>,
          )}
          {fieldShell(getParameterDescriptor('seed').label, <input className={inputClass} type="number" min={descriptorNumber('seed', 'min', 0)} max={descriptorNumber('seed', 'max', 999999)} step={descriptorNumber('seed', 'step', 1)} value={seed} onChange={(event) => {
            markParamChanged(getParameterDescriptor('seed').label);
            setSeed(Number(event.target.value));
          }} />)}
        </div>
        {fieldShell(
          getParameterDescriptor('client_sampling_ratio').label,
          <div className="flex items-center gap-3">
            <input className="w-full accent-cyan-300" type="range" min={descriptorNumber('client_sampling_ratio', 'min', 0.05)} max={descriptorNumber('client_sampling_ratio', 'max', 1)} step={descriptorNumber('client_sampling_ratio', 'step', 0.05)} value={clientSamplingRate} onChange={(event) => updateClientSamplingRate(Number(event.target.value))} />
            <span className="w-12 text-right font-mono text-sm font-bold text-cyan-100">{clientSamplingRate.toFixed(2)}</span>
          </div>,
        )}
        <div className="grid gap-3 sm:grid-cols-2">
          {fieldShell(getParameterDescriptor('learning_rate').label, <input className={numericInputClass} type="number" min={descriptorNumber('learning_rate', 'min', 0.00001)} max={descriptorNumber('learning_rate', 'max', 0.1)} step={descriptorNumber('learning_rate', 'step', 0.00001)} value={config.learningRate || 0.001} onChange={(event) => {
            markParamChanged('学习率');
            updateConfig({learningRate: Number(event.target.value)});
          }} />, getParameterDescriptor('learning_rate').help_text)}
          {fieldShell(getParameterDescriptor('weight_decay').label, <input className={numericInputClass} type="number" min={descriptorNumber('weight_decay', 'min', 0)} max={descriptorNumber('weight_decay', 'max', 0.01)} step={descriptorNumber('weight_decay', 'step', 0.000001)} value={config.advanced.weightDecay ?? 0} onChange={(event) => {
            markParamChanged('权重衰减');
            updateConfig({advanced: {...config.advanced, weightDecay: Number(event.target.value)}});
          }} />, getParameterDescriptor('weight_decay').help_text)}
        </div>
        {fieldShell(getParameterDescriptor('gradient_clip').label, <input className={numericInputClass} type="number" min={descriptorNumber('gradient_clip', 'min', 0.1)} max={descriptorNumber('gradient_clip', 'max', 20)} step={descriptorNumber('gradient_clip', 'step', 0.1)} value={config.advanced.gradientClip ?? 5} onChange={(event) => {
          markParamChanged(getParameterDescriptor('gradient_clip').label);
          updateConfig({advanced: {...config.advanced, gradientClip: Number(event.target.value)}});
        }} />)}
        <div className="grid gap-3 sm:grid-cols-2">
          {fieldShell(getParameterDescriptor('num_workers').label, <select className={inputClass} value={numWorkers} onChange={(event) => setNumWorkers(Number(event.target.value))}>
            {descriptorOptions<number>('num_workers', [0]).map((item) => <option key={item} value={item}>{item}</option>)}
          </select>, getParameterDescriptor('num_workers').help_text)}
          {fieldShell(getParameterDescriptor('prefetch_factor').label, <input className={inputClass} type="number" min={descriptorNumber('prefetch_factor', 'min', 1)} max={descriptorNumber('prefetch_factor', 'max', 8)} step={1} value={prefetchFactor} onChange={(event) => setPrefetchFactor(Number(event.target.value))} />, getParameterDescriptor('prefetch_factor').help_text)}
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {[
            {key: 'pin_memory', value: pinMemory, setValue: setPinMemory},
            {key: 'persistent_workers', value: persistentWorkers, setValue: setPersistentWorkers, disabled: numWorkers === 0},
            {key: 'amp_enabled', value: ampEnabled, setValue: setAmpEnabled},
            {key: 'cache_item_features_on_device', value: cacheItemFeaturesOnDevice, setValue: setCacheItemFeaturesOnDevice},
            {key: 'non_blocking_transfer', value: nonBlockingTransfer, setValue: setNonBlockingTransfer},
            {key: 'reuse_client_model_workspace', value: reuseClientModelWorkspace, setValue: setReuseClientModelWorkspace},
          ].map((item) => (
            <label key={item.key} className={cn('flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-slate-950/45 px-3 py-2.5 text-xs font-semibold text-slate-300', item.disabled && 'cursor-not-allowed opacity-45')}>
              <span>{getParameterDescriptor(item.key).label}</span>
              <input type="checkbox" className="accent-cyan-300" checked={item.value} disabled={item.disabled} onChange={(event) => item.setValue(event.target.checked)} />
            </label>
          ))}
        </div>
      </>
    );
    const selectTargetOption = (id: string) => {
      const selectedTarget = targetOptions.find((item) => String(item.id ?? item.title) === id);
      setTargetItemId(id);
      setTargetItemTitle(selectedTarget?.title ?? id);
      setTargetComboboxOpen(false);
      setTargetSearch('');
      markParamChanged('目标商品');
    };
    const renderTargetCombobox = () =>
      fieldShell(
        getParameterDescriptor('target_item').label,
        <div className="relative">
          <button
            type="button"
            onClick={() => setTargetComboboxOpen((value) => !value)}
            title={selectedTargetOption?.rawTitle ?? targetItemTitle}
            className="flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/70 p-2.5 text-left transition hover:border-cyan-200/30"
          >
            {selectedTargetOption?.thumbnailUrl || selectedTargetOption?.imageUrl ? (
              <img src={selectedTargetOption.thumbnailUrl ?? selectedTargetOption.imageUrl ?? ''} alt="" className="h-11 w-11 rounded-xl object-cover" loading="lazy" />
            ) : (
              <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-slate-900/80 text-slate-500">
                <ImageOff className="h-5 w-5" />
              </span>
            )}
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-black text-slate-100">{selectedTargetOption?.title ?? targetItemTitle}</span>
              <span className="block truncate text-[11px] font-semibold text-slate-500">{selectedTargetOption?.rawTitle ?? targetItemId}</span>
            </span>
            <ChevronRight className={cn('h-4 w-4 text-slate-500 transition', targetComboboxOpen ? 'rotate-90' : '')} />
          </button>
          {targetComboboxOpen ? (
            <div className="absolute z-20 mt-2 w-full rounded-3xl border border-cyan-200/20 bg-slate-950/95 p-3 shadow-2xl shadow-cyan-950/40 backdrop-blur">
              <input
                className={inputClass}
                value={targetSearch}
                onChange={(event) => setTargetSearch(event.target.value)}
                placeholder="搜索中文名 / 英文名 / item_id"
              />
              <div className="mt-2 max-h-64 space-y-1 overflow-y-auto pr-1">
                {filteredTargetOptions.map((item) => {
                  const key = String(item.id ?? item.title);
                  const active = key === targetItemId;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => selectTargetOption(key)}
                      title={item.rawTitle || key}
                      className={cn(
                        'flex w-full items-center gap-3 rounded-2xl px-2.5 py-2 text-left transition',
                        active ? 'bg-cyan-300/12 text-cyan-50' : 'text-slate-300 hover:bg-white/[0.06]',
                      )}
                    >
                      {item.thumbnailUrl || item.imageUrl ? (
                        <img src={item.thumbnailUrl ?? item.imageUrl ?? ''} alt="" className="h-9 w-9 rounded-xl object-cover" loading="lazy" />
                      ) : (
                        <span className="h-9 w-9 rounded-xl border border-white/10 bg-slate-900/70" />
                      )}
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-black">{item.title}</span>
                        <span className="block truncate text-[11px] text-slate-500">{item.rawTitle || key}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}
        </div>,
      );
    const renderSharedDefenseControls = () => (
      <div className="grid gap-3 rounded-3xl border border-emerald-200/15 bg-emerald-300/[0.04] p-3">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-black text-emerald-50">防御控制条</p>
          <span className="text-[11px] font-semibold text-slate-500">算法空选 = 无鲁棒聚合</span>
        </div>
        {fieldShell(
          '聚合模式',
          <div className="flex flex-wrap gap-2">
            {[
              {id: 'plain_updates' as AggregationMode, label: '明文更新'},
              {id: 'secure_aggregation' as AggregationMode, label: '安全聚合'},
            ].map((mode) => {
              const disabled = mode.id === 'secure_aggregation' && robustActive;
              return (
                <button
                  key={mode.id}
                  type="button"
                  disabled={disabled}
                  title={disabled ? '鲁棒聚合需要观察单客户端更新。' : ''}
                  onClick={() => {
                    markParamChanged('防御策略');
                    setAggregationVisibility(mode.id);
                  }}
                  className={cn(
                    'rounded-full border px-3 py-1.5 text-xs font-black transition',
                    aggregationMode === mode.id ? 'border-cyan-200/45 bg-cyan-300/15 text-cyan-50' : 'border-white/10 bg-white/[0.045] text-slate-300 hover:border-cyan-200/25',
                    disabled ? 'cursor-not-allowed border-slate-700/60 bg-slate-900/40 text-slate-600' : '',
                  )}
                >
                  {mode.label}
                </button>
              );
            })}
          </div>,
          secureModeActive ? '安全聚合隐藏单客户端更新，Krum / Median / TrimmedMean / Bulyan 不可执行。' : robustActive ? '已选择鲁棒聚合，因此安全聚合置灰。' : '明文更新可做逐客户端鲁棒筛选。',
        )}
        {fieldShell(
          '鲁棒算法',
          <div className="flex flex-wrap gap-2">
            {ROBUST_AGGREGATORS.map((algorithm) => (
              <button
                key={algorithm}
                type="button"
                disabled={secureModeActive || robustAlgorithmUnavailable(algorithm)}
                title={secureModeActive ? '安全聚合隐藏单客户端更新，不做逐客户端鲁棒筛选。' : robustAlgorithmUnavailable(algorithm) ? `本轮仅采样 ${sampledClientCount} 个客户端，不满足算法条件。` : ''}
                onClick={() => {
                  markParamChanged('防御策略');
                  selectRobustAlgorithm(algorithm);
                }}
                className={cn(
                  'rounded-full border px-3 py-1.5 text-xs font-black transition',
                  robustAlgorithms.includes(algorithm) && !secureModeActive ? 'border-emerald-200/45 bg-emerald-300/15 text-emerald-50' : 'border-white/10 bg-white/[0.045] text-slate-300 hover:border-emerald-200/25',
                  secureModeActive || robustAlgorithmUnavailable(algorithm) ? 'cursor-not-allowed border-slate-700/60 bg-slate-900/40 text-slate-600' : '',
                )}
              >
                {getParameterDescriptor('robust_aggregators').option_labels?.[algorithm] ?? robustAggregatorLabel(algorithm)}
              </button>
            ))}
          </div>,
        )}
        {fieldShell('更新扰动层', switchControl(dpLayerEnabled, () => {
          markParamChanged('防御策略');
          toggleDpLayer();
        }, getParameterDescriptor('dp_noise_enabled').label))}
        {robustAlgorithms.includes('Krum') && !secureModeActive ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {fieldShell(getParameterDescriptor('krum_f').label, <input className={inputClass} type="number" min={0} max={krumFMax} step={1} value={krumF} onChange={(event) => {
              markParamChanged('防御策略');
              setKrumF(Math.min(Math.max(0, Number(event.target.value)), krumFMax));
            }} />, `本轮采样 ${sampledClientCount} 个客户端，f 最大为 ${krumFMax}。`)}
            {fieldShell(getParameterDescriptor('multi_krum_enabled').label, switchControl(multiKrumEnabled, () => {
              markParamChanged('防御策略');
              setMultiKrumEnabled((value) => !value);
            }, '启用'))}
            {fieldShell(
              getParameterDescriptor('distance_metric').label,
              segmented<string>(distanceMetric, descriptorOptions<string>('distance_metric', ['cosine', 'l2']), (value) => {
                markParamChanged('防御策略');
                setDistanceMetric(value);
              }, undefined, undefined, (value) => getParameterDescriptor('distance_metric').option_labels?.[value] ?? DISTANCE_METRIC_LABELS[value] ?? value),
            )}
            {fieldShell(getParameterDescriptor('gradient_clip_norm').label, <input className={inputClass} type="number" min={descriptorNumber('gradient_clip_norm', 'min', 0.1)} max={descriptorNumber('gradient_clip_norm', 'max', 20)} step={descriptorNumber('gradient_clip_norm', 'step', 0.1)} value={defensePreprocessClipNorm} onChange={(event) => {
              markParamChanged('防御策略');
              setDefensePreprocessClipNorm(Number(event.target.value));
            }} />, '仅用于鲁棒聚合前的防御预处理，不影响更新扰动层。')}
          </div>
        ) : null}
        {robustAlgorithms.includes('Median') && !secureModeActive ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {fieldShell('坐标中位数聚合', <span className="inline-flex rounded-full border border-emerald-200/30 bg-emerald-300/10 px-3 py-1.5 text-xs font-black text-emerald-50">启用</span>)}
            {fieldShell(getParameterDescriptor('gradient_clip_norm').label, <input className={inputClass} type="number" min={descriptorNumber('gradient_clip_norm', 'min', 0.1)} max={descriptorNumber('gradient_clip_norm', 'max', 20)} step={descriptorNumber('gradient_clip_norm', 'step', 0.1)} value={defensePreprocessClipNorm} onChange={(event) => {
              markParamChanged('防御策略');
              setDefensePreprocessClipNorm(Number(event.target.value));
            }} />, '仅用于鲁棒聚合前的防御预处理，不影响更新扰动层。')}
            {fieldShell(
              getParameterDescriptor('outlier_strategy').label,
              segmented<string>(outlierStrategy, descriptorOptions<string>('outlier_strategy', ['clip', 'drop', 'winsorize']), (value) => {
                markParamChanged('防御策略');
                setOutlierStrategy(value);
              }, undefined, undefined, (value) => getParameterDescriptor('outlier_strategy').option_labels?.[value] ?? value),
            )}
          </div>
        ) : null}
        {robustAlgorithms.includes('TrimmedMean') && !secureModeActive ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {fieldShell(getParameterDescriptor('trim_ratio').label, <input className={inputClass} type="number" min={descriptorNumber('trim_ratio', 'min', 0)} max={descriptorNumber('trim_ratio', 'max', 0.45)} step={descriptorNumber('trim_ratio', 'step', 0.05)} value={trimRatio} onChange={(event) => {
              markParamChanged('防御策略');
              setTrimRatio(Number(event.target.value));
            }} />)}
            {fieldShell(getParameterDescriptor('trim_min_keep').label, <input className={inputClass} type="number" min={2} max={sampledClientCount} step={1} value={trimMinKeep} onChange={(event) => {
              markParamChanged('防御策略');
              setTrimMinKeep(Math.min(Math.max(2, Number(event.target.value)), sampledClientCount));
            }} />, `本轮最多可保留 ${sampledClientCount} 个客户端。`)}
          </div>
        ) : null}
        {robustAlgorithms.includes('Bulyan') && !secureModeActive ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {fieldShell(getParameterDescriptor('bulyan_f').label, <input className={inputClass} type="number" min={0} max={bulyanFMax} step={1} value={bulyanF} onChange={(event) => {
              markParamChanged('防御策略');
              setBulyanF(Math.min(Math.max(0, Number(event.target.value)), bulyanFMax));
            }} />, `本轮采样 ${sampledClientCount} 个客户端，f 最大为 ${bulyanFMax}。`)}
            {fieldShell(getParameterDescriptor('bulyan_selection_ratio').label, <input className={inputClass} type="number" min={descriptorNumber('bulyan_selection_ratio', 'min', 0.25)} max={descriptorNumber('bulyan_selection_ratio', 'max', 1)} step={descriptorNumber('bulyan_selection_ratio', 'step', 0.05)} value={bulyanSelectionRatio} onChange={(event) => {
              markParamChanged('防御策略');
              setBulyanSelectionRatio(Number(event.target.value));
            }} />)}
          </div>
        ) : null}
        {dpLayerEnabled ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {fieldShell(getParameterDescriptor('noise_multiplier').label, <input className={inputClass} type="number" min={descriptorNumber('noise_multiplier', 'min', 0)} max={descriptorNumber('noise_multiplier', 'max', 2)} step={descriptorNumber('noise_multiplier', 'step', 0.05)} value={noiseStrength} onChange={(event) => {
              markParamChanged('防御策略');
              setNoiseStrength(Number(event.target.value));
            }} />)}
            {fieldShell(getParameterDescriptor('max_grad_norm').label, <input className={inputClass} type="number" min={descriptorNumber('max_grad_norm', 'min', 0.1)} max={descriptorNumber('max_grad_norm', 'max', 20)} step={descriptorNumber('max_grad_norm', 'step', 0.1)} value={dpMaxGradNorm} onChange={(event) => {
              markParamChanged('防御策略');
              setDpMaxGradNorm(Number(event.target.value));
            }} />)}
            {fieldShell(
              getParameterDescriptor('target_delta').label,
              <select className={inputClass} value={dpTargetDelta} onChange={(event) => {
                markParamChanged('防御策略');
                setDpTargetDelta(Number(event.target.value));
              }}>
                {descriptorOptions<number>('target_delta', [0.001, 0.0001, 0.00001, 0.000001]).map((value) => <option key={value} value={value}>{value.toExponential(0)}</option>)}
              </select>,
            )}
            {fieldShell(getParameterDescriptor('dp_seed').label, <input className={inputClass} type="number" min={descriptorNumber('dp_seed', 'min', 0)} max={descriptorNumber('dp_seed', 'max', 999999)} step={descriptorNumber('dp_seed', 'step', 1)} value={dpSeed} onChange={(event) => {
              markParamChanged('防御策略');
              setDpSeed(Number(event.target.value));
            }} />)}
          </div>
        ) : null}
      </div>
    );
    const renderAdvancedControls = () => {
      if (selectedPlay.id === 'target_poisoning_play') {
        return (
          <div className="grid gap-3">
            {renderCommonTrainingControls()}
            {fieldShell(
              getParameterDescriptor('malicious_client_ratio').label,
              <div className="flex items-center gap-3">
                <input className="w-full accent-rose-300" type="range" min={descriptorNumber('malicious_client_ratio', 'min', 0)} max={descriptorNumber('malicious_client_ratio', 'max', 0.5)} step={descriptorNumber('malicious_client_ratio', 'step', 0.05)} value={config.poisoningRatio ?? 0.2} onChange={(event) => updatePoisoningRatio(Number(event.target.value))} />
                <span className="w-12 text-right font-mono text-sm font-bold text-rose-100">{formatRatio(config.poisoningRatio ?? 0.2)}</span>
              </div>,
            )}
            {renderTargetCombobox()}
            {fieldShell(
              '攻击强度',
              segmented<AttackStrength>(attackStrength, descriptorOptions<AttackStrength>('attack_strength', ['weak', 'medium', 'strong']), (value) => {
                markParamChanged('攻击强度');
                setAttackStrength(value);
              }, undefined, undefined, (value) => getParameterDescriptor('attack_strength').option_labels?.[value] ?? ATTACK_STRENGTH_LABELS[value]),
            )}
            <div className="grid gap-3 sm:grid-cols-2">
              {fieldShell(getParameterDescriptor('injection_ratio').label, <input className={inputClass} type="number" min={descriptorNumber('injection_ratio', 'min', 0)} max={descriptorNumber('injection_ratio', 'max', 0.5)} step={descriptorNumber('injection_ratio', 'step', 0.05)} value={injectionRatio} onChange={(event) => {
                markParamChanged('攻击强度');
                setInjectionRatio(Number(event.target.value));
              }} />)}
              {fieldShell(getParameterDescriptor('max_injections_per_client').label, <input className={inputClass} type="number" min={descriptorNumber('max_injections_per_client', 'min', 1)} max={descriptorNumber('max_injections_per_client', 'max', 50)} step={descriptorNumber('max_injections_per_client', 'step', 1)} value={maxInjectionsPerClient} onChange={(event) => {
                markParamChanged('攻击强度');
                setMaxInjectionsPerClient(Number(event.target.value));
              }} />)}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {fieldShell(getParameterDescriptor('target_loss_weight').label, <input className={inputClass} type="number" min={descriptorNumber('target_loss_weight', 'min', 0)} max={descriptorNumber('target_loss_weight', 'max', 5)} step={descriptorNumber('target_loss_weight', 'step', 0.1)} value={targetLossWeight} onChange={(event) => {
                markParamChanged('攻击强度');
                setTargetLossWeight(Number(event.target.value));
              }} />)}
              {fieldShell(
                getParameterDescriptor('target_rank_selector').label,
                segmented<string>(targetRankSelector, descriptorOptions<string>('target_rank_selector', ['unmasked_rank', 'masked_top50', 'both']), (value) => {
                  markParamChanged('输出证据');
                  setTargetRankSelector(value);
                }, undefined, undefined, (value) => getParameterDescriptor('target_rank_selector').option_labels?.[value] ?? value),
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {switchControl(saveTopKEnabled, () => {
                markParamChanged('输出证据');
                setSaveTopKEnabled((value) => !value);
              }, getParameterDescriptor('save_topk').label)}
              {switchControl(exportAuditEnabled, () => {
                markParamChanged('输出证据');
                setExportAuditEnabled((value) => !value);
              }, getParameterDescriptor('export_artifact').label)}
            </div>
            {renderSharedDefenseControls()}
          </div>
        );
      }
      if (selectedPlay.id === 'membership_privacy_play') {
        return (
          <div className="grid gap-3">
            {renderCommonTrainingControls()}
            {fieldShell(
              '证据来源',
              segmented<EvidenceSource>(evidenceSource, ['rank', 'unmasked rank', 'checkpoint score', 'auto'], (value) => {
                markParamChanged('输出证据');
                setEvidenceSource(value);
              }, undefined, undefined, (value) => ({
                'rank': '推荐排名',
                'unmasked rank': '未屏蔽内部排名',
                'checkpoint score': '模型检查点评分',
                'auto': '自动选择',
              }[value])),
            )}
            {fieldShell(
              '标签来源',
              <select
                className={inputClass}
                value={membershipLabelSource}
                onChange={(event) => {
                  markParamChanged('观测对象');
                  setMembershipLabelSource(event.target.value);
                }}
              >
                {[
                  {value: 'membership labels', label: '成员身份标签'},
                  {value: 'scenario labels', label: '场景预设标签'},
                  {value: 'auto labels', label: '自动构造标签'},
                ].map((item) => (
                  <option key={item.value} value={item.value}>{item.label}</option>
                ))}
              </select>,
            )}
            {fieldShell(
              '阈值策略',
              segmented<string>(thresholdStrategy, ['auto', 'median', 'fixed'], (value) => {
                markParamChanged('观测对象');
                setThresholdStrategy(value);
              }, undefined, undefined, (value) => ({
                'auto': '自动阈值',
                'median': '中位数阈值',
                'fixed': '固定阈值',
              }[value])),
            )}
            {fieldShell(
              'MIA 模型',
              segmented<MiaModel>(miaModel, ['threshold', 'logistic_probe', 'rank_proxy'], (value) => {
                markParamChanged('观测对象');
                setMiaModel(value);
              }, undefined, undefined, (value) => ({
                'threshold': '阈值判别',
                'logistic_probe': '逻辑回归探针',
                'rank_proxy': '排名代理攻击',
              }[value])),
            )}
            {fieldShell('审计样本总数', <input className={inputClass} type="number" min={20} max={5000} step={20} value={membershipSampleCount} onChange={(event) => {
              markParamChanged('观测对象');
              setMembershipSampleCount(Number(event.target.value));
            }} />)}
            {fieldShell('成员/非成员采样比例', <input className={inputClass} type="number" min={0.1} max={10} step={0.1} value={memberNonmemberRatio} onChange={(event) => {
              markParamChanged('观测对象');
              setMemberNonmemberRatio(Number(event.target.value));
            }} />)}
            {fieldShell('观测指标', <div className="flex flex-wrap gap-2">{['AUC', 'Accuracy', 'score gap'].map((item) => tagToggle(membershipMetrics, item, (next) => {
              markParamChanged('输出证据');
              setMembershipMetrics(next);
            }, item === 'score gap' ? '成员与非成员得分差' : item))}</div>)}
            {fieldShell('导出判别分数明细', switchControl(exportPairScores, () => {
              markParamChanged('输出证据');
              setExportPairScores((value) => !value);
            }, '导出判别分数明细'))}
            {renderSharedDefenseControls()}
          </div>
        );
      }
      if (selectedPlay.id === 'update_leakage_play') {
        const riskModalityDescriptor = getParameterDescriptor('risk_modality');
        const supportedModalities = new Set((riskModalityDescriptor.options ?? []).map((item) => String(item)));
        const modalityDisabled = (value: RiskModality) => value !== 'item embedding' && supportedModalities.size > 0 && !supportedModalities.has(value);
        const modalityDisabledTitle = (value: RiskModality) => modalityDisabled(value)
          ? '后端 options 未列出该模态；当前不可选'
          : undefined;
        const modalityDisplay = (value: RiskModality) => riskModalityDescriptor.option_labels?.[value] ?? RISK_MODALITY_LABELS[value] ?? value;
        return (
          <div className="grid gap-3">
            {renderCommonTrainingControls()}
            {fieldShell(
              '输入来源',
              segmented<UpdateInputSource>(updateInputSource, ['client_update', 'participant_params', 'item_embedding'], (value) => {
                markParamChanged('观测对象');
                setUpdateInputSource(value);
              }, undefined, undefined, (value) => UPDATE_INPUT_SOURCE_LABELS[value] ?? value),
            )}
            {fieldShell('候选商品池大小', <input className={inputClass} type="number" min={10} max={5000} step={10} value={candidatePoolSize} onChange={(event) => {
              markParamChanged('观测对象');
              setCandidatePoolSize(Number(event.target.value));
            }} />)}
            {fieldShell(
              '返回候选数量',
              segmented<CandidateLimit>(candidateLimit, ['Top10', 'Top20', 'Top50'], (value) => {
                markParamChanged('观测对象');
                setCandidateLimit(value);
              }, undefined, undefined, (value) => CANDIDATE_LIMIT_LABELS[value] ?? value),
            )}
            {fieldShell(
              '泄露目标模态',
              segmented<RiskModality>(riskModality, ['item embedding', 'image', 'text'], (value) => {
                markParamChanged('观测对象');
                setRiskModality(value);
              }, modalityDisabled, modalityDisabledTitle, modalityDisplay),
            )}
            {fieldShell(
              '相似度方法',
              segmented<SimilarityMethod>(similarityMethod, ['cosine', 'dot', 'l2'], (value) => {
                markParamChanged('观测对象');
                setSimilarityMethod(value);
              }, undefined, undefined, (value) => SIMILARITY_METHOD_LABELS[value] ?? value),
            )}
            {fieldShell('审计客户端数量', <input className={inputClass} type="number" min={1} max={50} step={1} value={clientCountForLeakage} onChange={(event) => {
              markParamChanged('观测对象');
              setClientCountForLeakage(Number(event.target.value));
            }} />)}
            {fieldShell('观测指标', <div className="flex flex-wrap gap-2">{['hit@10', 'hit@20', 'hit@50'].map((item) => tagToggle(leakageMetrics, item, (next) => {
              markParamChanged('输出证据');
              setLeakageMetrics(next);
            }))}</div>)}
            {fieldShell('导出候选还原明细', switchControl(exportReconstruction, () => {
              markParamChanged('输出证据');
              setExportReconstruction((value) => !value);
            }, '导出候选还原明细'))}
            {fieldShell('显示候选商品缩略图', switchControl(showCandidateImages, () => {
              markParamChanged('输出证据');
              setShowCandidateImages((value) => !value);
            }, '显示候选商品缩略图'))}
            {renderSharedDefenseControls()}
          </div>
        );
      }
      return (
        <div className="grid gap-3">
          {renderCommonTrainingControls()}
          {fieldShell(
            '基础攻击',
            segmented<BaseAttack>(baseAttack, ['none', 'malicious_update'], (value) => {
              markParamChanged('基础攻击');
              setBaseAttack(value);
              const enabled = value === 'malicious_update';
              updateConfig({
                attackEnabled: enabled,
                attackType: enabled ? 'poisoning_attack' : 'none',
                enabledAttacks: enabled ? ['poisoning_attack'] : [],
                maliciousClientConfig: {
                  ...(config.maliciousClientConfig ?? {enabled: false, mode: 'none' as const, ratio: anomalyClientRatio, clientIds: []}),
                  enabled,
                  mode: enabled ? 'ratio' : 'none',
                  ratio: anomalyClientRatio,
                },
              });
            }, undefined, undefined, (value) => BASE_ATTACK_LABELS[value]),
          )}
          {baseAttack === 'malicious_update' ? (
            <div className="grid gap-3 sm:grid-cols-3">
              {fieldShell('异常客户端比例', <input className={inputClass} type="number" min={0} max={0.6} step={0.01} value={anomalyClientRatio} onChange={(event) => {
                markParamChanged('防御策略');
                setAnomalyClientRatio(Number(event.target.value));
              }} />)}
              {fieldShell(
                '扰动类型',
                segmented<PerturbationType>(perturbationType, ['sign_flip', 'gaussian', 'random_noise'], (value) => {
                  markParamChanged('防御策略');
                  setPerturbationType(value);
                }, undefined, undefined, (value) => PERTURBATION_LABELS[value]),
              )}
              {fieldShell('扰动强度', <input className={inputClass} type="number" min={0} max={10} step={0.1} value={perturbationStrength} onChange={(event) => {
                markParamChanged('防御策略');
                setPerturbationStrength(Number(event.target.value));
              }} />)}
            </div>
          ) : null}
          {renderSharedDefenseControls()}
          {fieldShell('观测指标', <div className="flex flex-wrap gap-2">{['Recall@50', 'NDCG@50', '防御恢复率', '异常过滤'].map((item) => tagToggle(defenseMetrics, item, (next) => {
            markParamChanged('输出证据');
            setDefenseMetrics(next);
          }))}</div>)}
        </div>
      );
    };

    return (
      <div className="space-y-4">
        <section className="grid min-w-0 gap-5 xl:grid-cols-[minmax(260px,300px)_minmax(0,1fr)_400px]">
          <div className="sandbox-panel min-w-0 rounded-[28px] p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold tracking-[0.18em] text-cyan-100/70">实验方向</p>
                <h3 className="mt-1 text-xl font-black text-white">选择方向</h3>
              </div>
              <span className={cn('rounded-full border px-2.5 py-1 text-[11px] font-bold', getScenarioSourceTone(bundle))}>{getScenarioSourceLabel(bundle)}</span>
            </div>
            <div className="space-y-2">
              {EXPERIMENT_PLAYBOOKS.map((playbook) => {
                const selected = selectedPlay.id === playbook.id;
                const meta = directionMeta[playbook.id];
                const Icon = meta.Icon;
                return (
                  <button
                    key={playbook.id}
                    type="button"
                    onClick={() => applyPlaybookToConfig(playbook)}
                    className={cn(
                      'group w-full rounded-3xl border p-3 text-left transition hover:-translate-y-0.5',
                      selected
                        ? meta.tone
                        : 'border-white/10 bg-white/[0.035] text-slate-300 hover:border-cyan-200/25 hover:bg-cyan-300/5',
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn('flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border', selected ? 'border-white/25 bg-white/10' : 'border-white/10 bg-slate-950/35')}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-base font-black text-white">{meta.title}</p>
                        <p className="mt-1 text-xs leading-5 text-slate-400">{meta.description}</p>
                      </div>
                      {renderDirectionVisual(playbook.id)}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="sandbox-panel min-w-0 rounded-[28px] p-5">
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-bold tracking-[0.18em] text-cyan-100/70">攻防流程</p>
                <h3 className="mt-1 text-xl font-black text-white">{directionMeta[selectedPlay.id].title}路径</h3>
              </div>
            </div>
            <div className="relative overflow-hidden rounded-[30px] border border-white/10 bg-slate-950/35 px-5 py-8">
              <svg className="pointer-events-none absolute inset-x-10 top-[4.15rem] hidden h-16 lg:block" viewBox="0 0 760 64" preserveAspectRatio="none">
                <path id="orchestration-flow-line" d="M0 32 C120 4 160 60 260 32 S420 6 520 32 S650 58 760 32" fill="none" stroke="url(#flowLine)" strokeWidth="2" strokeLinecap="round" strokeDasharray="8 10">
                  <animate attributeName="stroke-dashoffset" from="0" to="-36" dur="3.6s" repeatCount="indefinite" />
                </path>
                {[0, 1, 2].map((item) => (
                  <circle key={item} r="3" fill={item === 1 ? '#fb7185' : '#67e8f9'} opacity="0.85">
                    <animateMotion dur="4.8s" begin={`${item * 0.9}s`} repeatCount="indefinite">
                      <mpath href="#orchestration-flow-line" />
                    </animateMotion>
                  </circle>
                ))}
                <defs>
                  <linearGradient id="flowLine" x1="0%" x2="100%" y1="0%" y2="0%">
                    <stop offset="0%" stopColor="rgba(56,189,248,0.2)" />
                    <stop offset="45%" stopColor="rgba(251,113,133,0.5)" />
                    <stop offset="75%" stopColor="rgba(52,211,153,0.45)" />
                    <stop offset="100%" stopColor="rgba(45,212,191,0.45)" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="relative z-10 grid gap-4 lg:grid-cols-7">
                {compactFlowNodes[selectedPlay.id].map((node, index) => {
                  const Icon = node.Icon;
                  return (
                    <div key={`${node.label}-${node.note}`} className="min-w-0 text-center">
                      <div
                        className={cn(
                          'relative mx-auto flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl border transition',
                          routeToneClass(node.tone),
                          node.active || node.tone === 'attack' || node.tone === 'defense' || node.tone === 'audit' || node.tone === 'evidence' ? 'animate-pulse scale-105' : '',
                        )}
                        style={{animationDelay: `${index * 120}ms`}}
                      >
                        {node.tone === 'audit' ? <span className="absolute inset-x-1 top-2 h-px bg-violet-100/70 shadow-[0_0_10px_rgba(196,181,253,0.7)]" /> : null}
                        {node.tone === 'defense' ? <span className="absolute inset-1 rounded-xl border border-emerald-100/30" /> : null}
                        {node.tone === 'evidence' ? <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-cyan-100 shadow-[0_0_10px_rgba(103,232,249,0.8)]" /> : null}
                        <Icon className="h-6 w-6" />
                      </div>
                      <p className="mt-3 truncate text-sm font-black text-white">{node.label}</p>
                      <p className="mt-1 text-[11px] leading-4 text-slate-400">{node.note}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-5 rounded-[26px] border border-white/10 bg-white/[0.04] p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <p className="text-sm font-black text-white">防御控制条</p>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="mb-2 text-xs font-bold text-slate-500">聚合模式</p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      {id: 'plain_updates' as AggregationMode, label: '明文更新'},
                      {id: 'secure_aggregation' as AggregationMode, label: '安全聚合'},
                    ].map((mode) => {
                      const disabled = mode.id === 'secure_aggregation' && robustActive;
                      return (
                        <button
                          key={mode.id}
                          type="button"
                          disabled={disabled}
                          title={disabled ? '鲁棒聚合需要观察单客户端更新。' : ''}
                          onClick={() => {
                            markParamChanged('防御策略');
                            setAggregationVisibility(mode.id);
                          }}
                          className={cn(
                            'rounded-full border px-4 py-2 text-xs font-black transition',
                            aggregationMode === mode.id ? 'border-cyan-200/45 bg-cyan-300/15 text-cyan-50' : 'border-white/10 bg-white/[0.045] text-slate-300 hover:border-cyan-200/25',
                            disabled ? 'cursor-not-allowed opacity-45' : '',
                          )}
                        >
                          {mode.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <p className="mb-2 text-xs font-bold text-slate-500">防御算法</p>
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full border border-slate-700/70 bg-slate-950/35 px-4 py-2 text-xs font-bold text-slate-500">
                      {robustAlgorithm !== 'none' ? `已选：${robustAggregatorLabel(robustAlgorithm)}` : '未选择：普通聚合'}
                    </span>
                    {ROBUST_AGGREGATORS.map((algorithm) => (
                      <button
                        key={algorithm}
                        type="button"
                        disabled={secureModeActive}
                        title={secureModeActive ? '安全聚合隐藏单客户端更新，不做逐客户端鲁棒筛选。' : ''}
                        onClick={() => {
                          markParamChanged('防御策略');
                          selectRobustAlgorithm(algorithm);
                        }}
                        className={cn(
                          'rounded-full border px-4 py-2 text-xs font-black transition',
                          robustAlgorithms.includes(algorithm) && !secureModeActive
                            ? 'border-emerald-200/45 bg-emerald-300/15 text-emerald-50'
                            : 'border-white/10 bg-white/[0.045] text-slate-300 hover:border-emerald-200/25',
                          secureModeActive ? 'cursor-not-allowed opacity-45' : '',
                        )}
                      >
                        {robustAggregatorLabel(algorithm)}
                      </button>
                    ))}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    markParamChanged('防御策略');
                    toggleDpLayer();
                  }}
                  className={cn(
                    'inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-black transition',
                    dpLayerEnabled ? 'border-amber-200/45 bg-amber-300/15 text-amber-50' : 'border-white/10 bg-white/[0.045] text-slate-300 hover:border-amber-200/25',
                  )}
                >
                  <Zap className="h-4 w-4" />
                  差分隐私风格加噪
                </button>
              </div>
            </div>
          </div>

          <div className="sandbox-panel min-w-0 rounded-[28px] p-5 xl:w-[400px] xl:max-w-[400px]">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold tracking-[0.18em] text-cyan-100/70">参数抽屉</p>
                <h3 className="mt-1 text-xl font-black text-white">当前方向参数</h3>
              </div>
              <div className="grid grid-cols-2 rounded-full border border-white/10 bg-slate-950/40 p-1">
                {[
                  {id: 'basic' as ParamPanelId, label: '基础参数'},
                  {id: 'advanced' as ParamPanelId, label: '高级参数'},
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setParamPanel(item.id)}
                    className={cn('rounded-full px-3 py-1.5 text-xs font-black transition', paramPanel === item.id ? 'bg-cyan-200 text-slate-950' : 'text-slate-400 hover:text-white')}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div key={paramPanel} className="max-h-[74vh] overflow-y-auto overflow-x-hidden rounded-[26px] border border-white/10 bg-white/[0.04] p-3 pr-5 transition-all duration-200 ease-out [scrollbar-gutter:stable] 2xl:max-h-[760px]">
              {paramPanel === 'basic' ? (
                <div className="grid gap-2">
                  {basicParamsByPlay[selectedPlay.id].map((param) => (
                    <div
                      key={param.label}
                      className={cn(
                        'flex items-center justify-between gap-3 rounded-2xl bg-slate-950/35 px-3 py-2 transition',
                        highlightedParam === param.label ? 'ring-1 ring-cyan-200/50 bg-cyan-300/10' : '',
                      )}
                    >
                      <p className="text-xs font-bold text-slate-500">{param.label}</p>
                      <p className="text-right text-sm font-black text-slate-100">{param.value}</p>
                    </div>
                  ))}
                </div>
              ) : (
                renderAdvancedControls()
              )}
            </div>
          </div>
        </section>

        <section className="sandbox-panel rounded-[28px] p-5">
          <div className="flex flex-col justify-end gap-3 lg:flex-row lg:items-center">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap gap-2 text-[11px] font-bold">
                {[
                  `方向：${selectedPlay.title}`,
                  `${datasetLabel(config.dataset || selectedPlayDefaults.dataset)} / ${config.model || selectedPlayDefaults.model}`,
                  aggregationMode === 'secure_aggregation' ? '安全聚合模拟' : robustAlgorithm !== 'none' ? `鲁棒：${robustAggregatorLabel(robustAlgorithm)}` : '普通聚合',
                ].map((item) => (
                  <span key={item} className="rounded-full border border-white/10 bg-white/[0.045] px-2.5 py-1 text-slate-300">
                    {item}
                  </span>
                ))}
              </div>
              {submitMessage ? <p className="truncate text-sm font-semibold text-emerald-100">{submitMessage}</p> : null}
              {workbenchOptionsError ? <p className="truncate text-sm font-semibold text-amber-100">后端服务未连接：{workbenchOptionsError}</p> : null}
              {validationResult ? (
                <div className="mt-2 flex flex-wrap gap-2 text-[11px] font-bold">
                  <span className={cn('rounded-full border px-2.5 py-1', validationResult.valid ? 'border-emerald-200/30 bg-emerald-300/10 text-emerald-100' : 'border-rose-200/30 bg-rose-300/10 text-rose-100')}>
                    {validationResult.valid ? '配置已校验' : '配置需调整'}
                  </span>
                  {workbenchJobId ? <span className="rounded-full border border-cyan-200/25 bg-cyan-300/10 px-2.5 py-1 text-cyan-100">job {shortWorkbenchJobId(workbenchJobId)} · {workbenchStatusLabel(workbenchJob?.status)}</span> : null}
                  {formatWorkbenchFieldErrors(validationResult) ? (
                    <span className="max-w-full truncate rounded-full border border-rose-200/25 bg-rose-300/10 px-2.5 py-1 text-rose-100">{formatWorkbenchFieldErrors(validationResult)}</span>
                  ) : null}
                  {validationResult.warnings?.slice(0, 1).map((warning) => (
                    <span key={warning} className="rounded-full border border-white/10 bg-white/[0.045] px-2.5 py-1 text-slate-400">{toChineseLabel(warning)}</span>
                  ))}
                </div>
              ) : null}
            </div>
            <div className="ml-auto flex shrink-0 flex-wrap items-center justify-end gap-3">
              <button
                type="button"
                disabled={actionState !== 'idle'}
                onClick={handleValidate}
                className="inline-flex items-center gap-2 rounded-2xl border border-cyan-200/35 bg-cyan-300/12 px-4 py-2 text-sm font-bold text-cyan-50 transition hover:bg-cyan-300/18 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <CheckCircle2 className={cn('h-4 w-4', actionState === 'validating' ? 'animate-pulse' : '')} />
                {actionState === 'validating' ? '校验中...' : '校验配置'}
              </button>
              <button
                type="button"
                disabled={actionState !== 'idle'}
                onClick={handleStartExperiment}
                className="inline-flex items-center gap-2 rounded-2xl border border-emerald-200/35 bg-emerald-300/12 px-4 py-2 text-sm font-bold text-emerald-50 transition hover:bg-emerald-300/18 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Play className={cn('h-4 w-4', actionState === 'starting' ? 'animate-pulse' : '')} />
                {actionState === 'starting' ? '切换中...' : '开始实验'}
              </button>
            </div>
          </div>
        </section>
      </div>
    );
  };

  const renderOrchestration = () => {
    const secureModeActive = aggregationMode === 'secure_aggregation';
    const robustActive = robustAlgorithm !== 'none' && aggregationMode === 'plain_updates';

    return (
      <div className="space-y-5">
        <section className="sandbox-panel rounded-[28px] p-6">
          <div className="mb-6 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
            <div>
              <p className="text-xs font-bold tracking-[0.2em] text-cyan-100/75">实验编排</p>
              <h2 className="mt-2 text-2xl font-bold text-white">选择剧本，再展开参数</h2>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
                工作台按“攻击、防御、观测、证据”组织，不把后端字段直接抛给展示路径。当前场景会优先读取真实数据，字段缺失时显示暂无。
              </p>
            </div>
            <div className={cn('rounded-full border px-3 py-1 text-xs font-bold', getScenarioSourceTone(bundle))}>{getScenarioSourceLabel(bundle)}</div>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            {[
              {label: '当前场景', value: getScenarioTitle(selectedScenario, report), detail: selectedScenario.name},
              {label: '数据集 / 模型', value: `${datasetLabel(report.dataset ?? selectedScenario.dataset)} / ${formatPlainValue(report.model ?? selectedScenario.model)}`, detail: '用于匹配当前演示证据'},
              {label: '证据输出', value: inferEvidenceLabels(selectedScenario, report).join(' / '), detail: '推荐、隐私、图片和指标按实际返回展示'},
            ].map((item) => (
              <div key={item.label} className="rounded-3xl border border-white/10 bg-white/[0.05] p-5">
                <p className="text-xs font-bold text-slate-400">{item.label}</p>
                <p className="mt-2 text-lg font-bold text-white">{item.value}</p>
                <p className="mt-2 text-xs leading-5 text-slate-400">{item.detail}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-4 xl:grid-cols-2">{EXPERIMENT_PLAYBOOKS.map(renderPlayCard)}</section>

        <section className="sandbox-panel rounded-[28px] p-5">
          <div className="mb-4 flex flex-col justify-between gap-3 lg:flex-row lg:items-end">
            <div>
              <p className="text-xs font-bold tracking-[0.18em] text-cyan-100/70">剧本联动预览</p>
              <h3 className="mt-1 text-xl font-bold text-white">选择剧本后，参数、监控、分析会同步切换</h3>
            </div>
            <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-xs font-bold text-slate-300">
              当前：{selectedPlay.title}
            </span>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {[
              {label: '数据集 / 模型', value: `${datasetLabel(selectedPlayDefaults.dataset)} / ${selectedPlayDefaults.model}`},
              {label: '攻击', value: selectedPlayDefaults.attackLabel},
              {label: '防御', value: selectedPlayDefaults.defenseLabel},
              {label: '观测指标', value: selectedPlayDefaults.observations.join(' / ')},
            ].map((item) => (
              <div key={item.label} className="rounded-2xl border border-white/10 bg-white/[0.045] p-4">
                <p className="text-xs font-bold text-slate-500">{item.label}</p>
                <p className="mt-2 text-sm font-bold leading-5 text-slate-100">{item.value}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="sandbox-panel rounded-[28px] p-6">
          <div className="mb-5 flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
            <div>
              <p className="text-xs font-bold tracking-[0.18em] text-cyan-100/70">当前剧本参数</p>
              <h3 className="mt-1 text-xl font-bold text-white">{selectedPlay.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-400">{selectedPlay.purpose}</p>
            </div>
            <button
              type="button"
              onClick={() => setExpertOpen((value) => !value)}
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-2 text-sm font-bold text-slate-100 hover:border-cyan-200/35 hover:bg-cyan-300/10"
            >
              <SlidersHorizontal className="h-4 w-4" />
              {expertOpen ? '收起专家参数' : '展开专家参数'}
            </button>
          </div>

          <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
              <div className="mb-4 flex items-center gap-2">
                <Layers3 className="h-5 w-5 text-emerald-100" />
                <h4 className="font-bold text-white">聚合可见性模式</h4>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {Object.entries(AGGREGATION_VISIBILITY_MODES).map(([mode, meta]) => {
                  const disabled = mode === 'secure_aggregation' && robustActive;
                  const active = aggregationMode === mode;
                  return (
                    <button
                      key={mode}
                      type="button"
                      disabled={disabled}
                      onClick={() => setAggregationVisibility(mode as AggregationMode)}
                      className={cn(
                        'rounded-2xl border p-4 text-left transition',
                        active ? 'border-cyan-200/45 bg-cyan-300/10 text-cyan-50' : 'border-white/10 bg-slate-950/25 text-slate-200 hover:border-cyan-200/25',
                        disabled ? 'cursor-not-allowed opacity-55' : '',
                      )}
                    >
                      <p className="font-bold">{meta.title}</p>
                      <p className="mt-2 text-xs leading-5 text-slate-400">{meta.description}</p>
                      {disabled ? <p className="mt-2 text-[11px] font-semibold text-amber-100">已选择逐客户端鲁棒筛选，因此安全聚合模拟不可同时开启。</p> : null}
                    </button>
                  );
                })}
              </div>

              <div className="mt-5">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <p className="text-sm font-bold text-slate-200">鲁棒聚合算法</p>
                  {secureModeActive ? <span className="text-xs font-semibold text-amber-100">安全聚合模式下置灰</span> : null}
                </div>
                <div className="grid gap-2 sm:grid-cols-4">
                  {ROBUST_AGGREGATORS.map((algorithm) => (
                    <button
                      key={algorithm}
                      type="button"
                      disabled={secureModeActive}
                      onClick={() => selectRobustAlgorithm(algorithm)}
                      className={cn(
                        'rounded-2xl border px-3 py-3 text-sm font-bold transition',
                        robustAlgorithms.includes(algorithm) && !secureModeActive
                          ? 'border-emerald-200/45 bg-emerald-300/12 text-emerald-50'
                          : 'border-white/10 bg-white/[0.045] text-slate-300 hover:border-emerald-200/30',
                        secureModeActive ? 'cursor-not-allowed opacity-50' : '',
                      )}
                    >
                      {robustAggregatorLabel(algorithm)}
                    </button>
                  ))}
                </div>
                {secureModeActive ? (
                  <p className="mt-3 text-xs leading-5 text-slate-500">服务端只看到聚合结果，无法同时做逐客户端 Krum / Median / TrimmedMean / Bulyan 筛选。</p>
                ) : null}
              </div>

              <button
                type="button"
                onClick={toggleDpLayer}
                className={cn(
                  'mt-5 flex w-full items-start gap-3 rounded-2xl border p-4 text-left transition',
                  dpLayerEnabled ? 'border-amber-200/40 bg-amber-300/10' : 'border-white/10 bg-white/[0.045] hover:border-amber-200/30',
                )}
              >
                <Zap className="mt-0.5 h-5 w-5 text-amber-100" />
                <span>
                  <span className="block font-bold text-white">更新扰动层：差分隐私风格加噪</span>
                  <span className="mt-1 block text-xs leading-5 text-slate-400">可作为展示层开关；没有正式隐私会计，不能写成 formal DP。</span>
                </span>
              </button>
            </div>

            {expertOpen ? (
              <div className="grid gap-3">
                {renderExpertControl(
                  '数据集',
                  <select className="w-full rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2 text-sm text-white" value={config.dataset} onChange={(event) => updateConfig({dataset: event.target.value})}>
                    {datasetOptions.map((item) => (
                      <option key={item} value={item}>
                        {datasetLabel(item)}
                      </option>
                    ))}
                  </select>,
                )}
                {renderExpertControl(
                  '模型',
                  <select className="w-full rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2 text-sm text-white" value={config.model} onChange={(event) => updateConfig({model: event.target.value})}>
                    {modelOptions.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>,
                )}
                <div className="grid gap-3 md:grid-cols-2">
                  {renderExpertControl(
                    '训练轮数',
                    <input className="w-full rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2 text-sm text-white" type="number" min={1} value={config.totalRounds} onChange={(event) => updateConfig({totalRounds: Number(event.target.value)})} />,
                  )}
                  {renderExpertControl(
                    '本地轮数',
                    <input
                      className="w-full rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2 text-sm text-white"
                      type="number"
                      min={1}
                      value={config.advanced.localEpochs}
                      onChange={(event) => updateConfig({advanced: {...config.advanced, localEpochs: Number(event.target.value)}})}
                    />,
                  )}
                  {renderExpertControl(
                    '客户端采样比例',
                    <input className="w-full rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2 text-sm text-white" type="number" min={0} max={1} step={0.05} value={config.clientSamplingRate} onChange={(event) => updateConfig({clientSamplingRate: Number(event.target.value)})} />,
                  )}
                  {renderExpertControl(
                    '恶意客户端比例',
                    <input className="w-full rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2 text-sm text-white" type="number" min={0} max={1} step={0.05} value={config.poisoningRatio} onChange={(event) => updateConfig({poisoningRatio: Number(event.target.value)})} />,
                  )}
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  {renderExpertControl(
                    selectedPlay.id === 'target_poisoning_play' ? '目标商品' : '观测对象',
                    <div className="rounded-xl bg-slate-950/50 px-3 py-2 text-sm text-slate-200">
                      {selectedPlay.id === 'target_poisoning_play' ? targetProduct?.title ?? targetProduct?.itemId ?? selectedPlayDefaults.targetLabel : selectedPlayDefaults.targetLabel}
                    </div>,
                  )}
                  {renderExpertControl('攻击强度', <div className="rounded-xl bg-slate-950/50 px-3 py-2 text-sm text-slate-200">{formatPercentValue(config.poisoningRatio || selectedPlayDefaults.maliciousRatio)}</div>)}
                  {renderExpertControl('防御算法', <div className="rounded-xl bg-slate-950/50 px-3 py-2 text-sm text-slate-200">{secureModeActive ? '安全聚合模拟' : robustAlgorithm !== 'none' ? robustAggregatorLabel(robustAlgorithm) : dpLayerEnabled ? '差分隐私风格加噪' : '普通聚合'}</div>)}
                  {renderExpertControl('固定 Top50', <div className="rounded-xl bg-slate-950/50 px-3 py-2 text-sm text-slate-200">推荐列表固定导出 50 条</div>)}
                </div>
                {renderExpertControl('导出审计结果', <div className="rounded-xl bg-slate-950/50 px-3 py-2 text-sm text-slate-200">推荐对照、隐私观测、防御摘要、场景档案</div>)}
              </div>
            ) : (
              <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-5 text-sm leading-6 text-slate-400">
                当前隐藏专家参数。普通模式已经选定攻击、防御、观测与证据输出，适合演示主线；展开后可以查看训练轮数、采样比例、目标商品和导出选项。
              </div>
            )}
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleValidate}
              className="inline-flex items-center gap-2 rounded-2xl border border-cyan-200/35 bg-cyan-300/12 px-4 py-2 text-sm font-bold text-cyan-50 hover:bg-cyan-300/18 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <CheckCircle2 className="h-4 w-4" />
              校验配置
            </button>
            <button
              type="button"
              disabled={actionState !== 'idle'}
              onClick={handleStartExperiment}
              className="inline-flex items-center gap-2 rounded-2xl border border-emerald-200/35 bg-emerald-300/12 px-4 py-2 text-sm font-bold text-emerald-50 hover:bg-emerald-300/18 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Play className={cn('h-4 w-4', actionState === 'starting' ? 'animate-pulse' : '')} />
              {actionState === 'starting' ? '切换中...' : '开始实验'}
            </button>
            {submitMessage ? <span className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-slate-300">{submitMessage}</span> : null}
          </div>
        </section>
      </div>
    );
  };

  const renderMonitoring = () => {
    const metrics = report.metricsSummary;
    const jobMetricsSummary = asRecord(workbenchResult?.metrics_summary);
    const jobDirectionResult = workbenchDirectionResult(jobMetricsSummary);
    const jobTraining = asRecord(jobMetricsSummary?.training);
    const jobMetrics = workbenchFlatMetrics(jobMetricsSummary);
    const trainingRounds = Array.isArray(jobTraining?.rounds)
      ? jobTraining.rounds.map(asRecord).filter((item): item is Record<string, unknown> => item !== null)
      : [];
    const aggregationRounds = Array.isArray(jobDirectionResult?.rounds)
      ? jobDirectionResult.rounds.map(asRecord).filter((item): item is Record<string, unknown> => item !== null)
      : [];
    const liveEpochMetrics = (workbenchJob?.epoch_metrics ?? {}) as Record<string, unknown>;
    const liveEpochRounds = Object.entries(liveEpochMetrics).flatMap(([phase, records]) =>
      Array.isArray(records)
        ? records.map((record) => ({...asRecord(record), phase} as Record<string, unknown>))
        : [],
    );
    const currentJobRounds = aggregationRounds.length ? aggregationRounds : trainingRounds.length ? trainingRounds : liveEpochRounds;
    const jobRoundMetric = (row: Record<string, unknown>, key: string): number | null => {
      if (aggregationRounds.length) {
        const phase = asRecord(row.defended) ?? asRecord(row.attacked) ?? asRecord(row.baseline);
        return typeof phase?.[key] === 'number' ? phase[key] as number : null;
      }
      const testMetrics = asRecord(row.test);
      if (testMetrics) {
        const liveKey = key === 'recall_at_50' ? 'recall@50' : key === 'ndcg_at_50' ? 'ndcg@50' : key;
        if (typeof testMetrics[liveKey] === 'number') return testMetrics[liveKey] as number;
      }
      return typeof row[key] === 'number' ? row[key] as number : null;
    };
    const jobMetricNumberValue = (key: string): number | null => typeof jobMetrics?.[key] === 'number' ? jobMetrics[key] as number : null;
    const hasCurrentJob = Boolean(workbenchJobId);
    const currentRecall = currentJobRounds.map((row) => jobRoundMetric(row, 'recall_at_50')).filter((value): value is number => value !== null);
    const currentNdcg = currentJobRounds.map((row) => jobRoundMetric(row, 'ndcg_at_50')).filter((value): value is number => value !== null);
    const currentLoss = currentJobRounds.map((row) => jobRoundMetric(row, 'loss')).filter((value): value is number => value !== null);
    const recallValues = hasCurrentJob
      ? currentRecall
      : v3CurvesPanel?.recallAt50?.length ? v3CurvesPanel.recallAt50 : buildSummaryCurve([metrics?.baseline?.recall50, metrics?.attack?.recall50, metrics?.defense?.recall50], 0.31, 0.35);
    const ndcgValues = hasCurrentJob
      ? currentNdcg
      : v3CurvesPanel?.ndcgAt50?.length ? v3CurvesPanel.ndcgAt50 : buildSummaryCurve([metrics?.baseline?.ndcg50, metrics?.attack?.ndcg50, metrics?.defense?.ndcg50], 0.18, 0.2);
    const lossValues = hasCurrentJob
      ? currentLoss
      : v3CurvesPanel?.loss?.length ? v3CurvesPanel.loss : interpolate(0.72, 0.31);
    const riskValues = hasCurrentJob
      ? [jobMetricNumberValue('target_manipulation_index'), jobMetricNumberValue('auc'), jobMetricNumberValue('hit_at_50')].filter((value): value is number => value !== null)
      : v3CurvesPanel?.attackRisk?.length ? v3CurvesPanel.attackRisk : buildSummaryCurve([0.18, displayNormalizedLift, privacyMetrics.miaAuc], 0.15, 0.56);
    const recoveryValues = hasCurrentJob
      ? [jobMetricNumberValue('recovery_rate_recall'), jobMetricNumberValue('recovery_rate_ndcg')].filter((value): value is number => value !== null)
      : v3CurvesPanel?.defenseRecovery?.length ? v3CurvesPanel.defenseRecovery : buildSummaryCurve([0.22, metrics?.recoveryRate], 0.2, 0.72);
    const maliciousRatio = v3RuntimePanel?.maliciousClientRatio ?? config.poisoningRatio ?? config.maliciousClientConfig?.ratio ?? 0;
    const progressDetail = workbenchJob?.progress_detail;
    const roundNow = progressDetail?.current_epoch ?? 0;
    const totalRounds = progressDetail?.total_epochs ?? (hasCurrentJob ? Number(jobTraining?.epochs ?? config.totalRounds ?? 0) : 0);
    const roundDisplay = progressDetail ? `${roundNow} / ${totalRounds}` : '正在初始化';
    const clientDisplay = progressDetail ? `${progressDetail.current_client} / ${progressDetail.total_clients}` : '正在初始化';
    const gpuLatest = workbenchJob?.gpu_stats?.latest;
    const curveBadge = hasCurrentJob ? '数据记录点' : curveSourceLabel(v3CurvesPanel?.curveSource);
    const topologyDefenseActive = selectedPlay.id === 'robust_defense_play' ? true : selectedPlay.id === 'target_poisoning_play' ? false : defenseActive;
    const logLinesByPlay: Record<ExperimentPlayId, string[]> = {
      target_poisoning_play: [
        '[Round 1] 客户端完成本地训练',
        `[Round ${Math.max(2, Math.round(roundNow / 2))}] 检测到红色恶意更新流`,
        `[Attack] 目标商品正反馈注入已进入排序审计`,
        `[Audit] 目标商品排序 ${displayRankBefore ?? 170} -> ${displayRankAfter ?? 3}`,
        `[Audit] 最终 Top50 曝光：${getFinalExposureText(report)}`,
      ],
      membership_privacy_play: [
        '[Round 1] 客户端完成本地训练',
        '[Audit] 成员推断审计开始',
        `[Audit] AUC=${formatMetricValue(privacyMetrics.miaAuc)}，accuracy=${formatMetricValue(privacyMetrics.miaAccuracy)}`,
        `[Evidence] 证据类型：${privacyMetrics.miaEvidence}`,
        '[Export] 成员推断摘要已进入单次分析',
      ],
      update_leakage_play: [
        '[Round 1] 客户端完成本地训练',
        '[Audit] 客户端更新分析开始',
        `[Audit] hit@10=${formatMetricValue(privacyMetrics.hit10)} / hit@20=${formatMetricValue(privacyMetrics.hit20)} / hit@50=${formatMetricValue(privacyMetrics.hit50)}`,
        `[Risk] 最高风险模态：${privacyMetrics.riskyModality}`,
        '[Export] 候选交互还原摘要已生成',
      ],
      robust_defense_play: [
        '[Round 1] 客户端完成本地训练',
        `[Defense] ${robustAlgorithm !== 'none' ? robustAggregatorLabel(robustAlgorithm) : '普通聚合'} 正在处理客户端更新`,
        `[Defense] 当前聚合可见性：${aggregationMode === 'secure_aggregation' ? '安全聚合模拟' : '明文更新聚合'}`,
        `[Audit] 防御恢复率：${formatPercentValue(metrics?.recoveryRate)}`,
        '[Export] 鲁棒防御摘要已生成',
      ],
    };
    const v3LogLines = v3RuntimePanel?.events?.map((event) => {
      const prefix = event.round ? `[Round ${event.round}]` : event.type ? `[${toChineseLabel(event.type)}]` : '[V3]';
      return `${prefix} ${event.message}`;
    }) ?? [];
    const logLines = workbenchJobId
      ? workbenchLogs.length ? workbenchLogs : ['[Workbench] 等待当前任务 run.log 输出。']
      : v3LogLines.length ? v3LogLines : logLinesByPlay[selectedPlay.id];
    const jobMetricsSource = typeof jobMetricsSummary?.source === 'string' ? jobMetricsSummary.source : workbenchResult?.source;
    const jobMetric = (key: string, fallback: string = EMPTY_VALUE) => {
      const value = jobMetrics?.[key];
      if (['string', 'number', 'boolean'].includes(typeof value) || value === null) {
        return workbenchMetricValue(key, value as string | number | boolean | null);
      }
      return hasCurrentJob ? EMPTY_VALUE : fallback;
    };
    const hasJobMetric = (key: string) => (jobMetrics ? Object.prototype.hasOwnProperty.call(jobMetrics, key) : false);
    const jobMetricEntries = Object.entries(jobMetrics ?? {})
      .filter(([, value]) => ['string', 'number', 'boolean'].includes(typeof value) || value === null)
      .slice(0, 6);
    const monitoringFocusByPlay: Record<ExperimentPlayId, Array<{label: string; value: string; tone?: string}>> = {
      target_poisoning_play: [
        {label: '目标排序', value: `${displayRankBefore ?? 170} -> ${displayRankAfter ?? 3}`, tone: 'text-rose-100'},
        {label: '最终曝光', value: getFinalExposureText(report), tone: 'text-emerald-100'},
      ],
      membership_privacy_play: [
        {label: 'MIA AUC', value: formatMetricValue(privacyMetrics.miaAuc), tone: 'text-violet-100'},
        {label: '准确率', value: formatMetricValue(privacyMetrics.miaAccuracy), tone: 'text-violet-100'},
      ],
      update_leakage_play: [
        {label: 'hit@10', value: formatMetricValue(privacyMetrics.hit10), tone: 'text-cyan-100'},
        {label: 'hit@50', value: formatMetricValue(privacyMetrics.hit50), tone: 'text-cyan-100'},
      ],
      robust_defense_play: [
        {label: '恢复率', value: formatPercentValue(metrics?.recoveryRate), tone: 'text-emerald-100'},
        {label: '过滤算法', value: robustAlgorithm !== 'none' ? robustAggregatorLabel(robustAlgorithm) : '普通聚合', tone: 'text-emerald-100'},
      ],
    };
    const monitoringFocusCards: Record<ExperimentPlayId, Array<{label: string; value: string; tone?: string}>> = {
      target_poisoning_play: [
        {
          label: '目标排序',
          value: hasJobMetric('baseline_unmasked_rank') || hasJobMetric('attack_unmasked_rank')
            ? `${jobMetric('baseline_unmasked_rank')} -> ${jobMetric('attack_unmasked_rank')}`
            : `${displayRankBefore ?? 170} -> ${displayRankAfter ?? 3}`,
          tone: 'text-rose-100',
        },
        {label: 'Top50 命中', value: jobMetric('attack_topk_hit', getFinalExposureText(report)), tone: 'text-emerald-100'},
        {label: '目标操纵指数', value: jobMetric('target_manipulation_index', formatMetricValue(v3TargetPanel?.targetManipulationIndex ?? null)), tone: 'text-rose-100'},
        {label: 'Jaccard', value: jobMetric('recommendation_jaccard', formatMetricValue(v3TargetPanel?.recommendationJaccard ?? null)), tone: 'text-cyan-100'},
      ],
      membership_privacy_play: [
        {label: 'AUC', value: jobMetric('auc', formatMetricValue(privacyMetrics.miaAuc)), tone: 'text-violet-100'},
        {label: 'Accuracy', value: jobMetric('accuracy', formatMetricValue(privacyMetrics.miaAccuracy)), tone: 'text-violet-100'},
        {label: '成员与非成员得分差', value: jobMetric('score_gap', formatMetricValue(v3MembershipPanel?.scoreGap ?? null)), tone: 'text-violet-100'},
        {label: '证据类型', value: jobMetric('evidence_type', privacyMetrics.miaEvidence), tone: 'text-slate-100'},
      ],
      update_leakage_play: [
        {label: 'hit@10', value: jobMetric('hit_at_10', formatMetricValue(privacyMetrics.hit10)), tone: 'text-cyan-100'},
        {label: 'hit@20', value: jobMetric('hit_at_20', formatMetricValue(privacyMetrics.hit20)), tone: 'text-cyan-100'},
        {label: 'hit@50', value: jobMetric('hit_at_50', formatMetricValue(privacyMetrics.hit50)), tone: 'text-cyan-100'},
        {label: '风险模态', value: jobMetric('highest_risk_modality', privacyMetrics.riskyModality), tone: 'text-cyan-100'},
      ],
      robust_defense_play: [
        {label: 'Recall@50', value: jobMetric('recall_at_50', formatMetricValue(v3AggregationPanel?.recallAfter ?? metrics?.defense?.recall50 ?? null)), tone: 'text-cyan-100'},
        {label: 'NDCG@50', value: jobMetric('ndcg_at_50', formatMetricValue(v3AggregationPanel?.ndcgAfter ?? metrics?.defense?.ndcg50 ?? null)), tone: 'text-violet-100'},
        {label: '防御算法', value: jobMetric('defense_algorithm', robustAlgorithm !== 'none' ? robustAggregatorLabel(robustAlgorithm) : '普通聚合'), tone: 'text-emerald-100'},
        {label: '恢复率', value: jobMetric('recovery_rate_recall', formatPercentValue(metrics?.recoveryRate)), tone: 'text-emerald-100'},
        {label: '异常过滤数量', value: jobMetric('rejected_client_count', formatPlainValue(report.defenseTrace?.filteredClients ?? null)), tone: 'text-emerald-100'},
      ],
    };
    return (
      <div className="space-y-5">
        <section className="grid gap-5 xl:grid-cols-[1.3fr_0.7fr]">
          <FederatedTopology mode="exercise" defenseActive={topologyDefenseActive} className="min-h-[520px]" />
          <div className="sandbox-panel rounded-[28px] p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold tracking-[0.2em] text-cyan-100/75">运行监控</p>
                <h3 className="mt-1 text-xl font-bold text-white">训练过程视图</h3>
              </div>
              <button
                type="button"
                onClick={() => setDefenseActive((value) => !value)}
                className="rounded-2xl border border-white/10 bg-white/[0.05] px-3 py-2 text-xs font-bold text-slate-200 hover:border-emerald-200/35"
              >
                {defenseActive ? '关闭防御视图' : '开启防御视图'}
              </button>
              {workbenchJobId ? (
                <button
                  type="button"
                  onClick={() => setLogPollingPaused((value) => !value)}
                  className="rounded-2xl border border-cyan-200/25 bg-cyan-300/10 px-3 py-2 text-xs font-bold text-cyan-100 hover:bg-cyan-300/15"
                >
                  {logPollingPaused ? '继续日志' : '暂停日志'}
                </button>
              ) : null}
            </div>

            {workbenchJobId ? (
              <div className="mb-4 grid gap-3 md:grid-cols-3 xl:grid-cols-6">
                {[
                  {label: 'Job', value: shortWorkbenchJobId(workbenchJobId)},
                  {label: '状态', value: workbenchStatusLabel(workbenchJob?.status)},
                  {label: '阶段', value: progressDetail?.phase_label ?? '正在初始化'},
                  {label: '进度', value: progressDetail ? `${Math.round(progressDetail.percent)}%` : '正在初始化'},
                  {label: 'source', value: workbenchSourceLabel(workbenchJob?.source ?? jobMetricsSource)},
                ].map((item) => (
                  <div key={item.label} className="rounded-2xl border border-cyan-200/15 bg-cyan-300/[0.06] p-3">
                    <p className="text-[11px] font-bold text-cyan-100/65">{item.label}</p>
                    <p className="mt-1 font-mono text-base font-black text-cyan-50">{item.value}</p>
                  </div>
                ))}
              </div>
            ) : null}

            {workbenchJobId ? (
              <div className="mb-4 grid gap-3 rounded-2xl border border-white/10 bg-slate-950/35 p-3 text-xs sm:grid-cols-2">
                {[
                  {label: 'job_id', value: workbenchJobId},
                  {label: 'direction', value: workbenchDirectionLabel(workbenchJob?.direction)},
                  {label: 'dataset', value: datasetLabel(String(workbenchJob?.dataset ?? workbenchJob?.config_summary?.dataset ?? config.dataset ?? selectedPlayDefaults.dataset))},
                  {label: 'model', value: String(workbenchJob?.model ?? workbenchJob?.config_summary?.model ?? config.model ?? selectedPlayDefaults.model)},
                  {label: 'source', value: workbenchSourceLabel(workbenchJob?.source ?? jobMetricsSource)},
                  {label: 'started_at', value: workbenchJob?.started_at ?? EMPTY_VALUE},
                  {label: 'finished_at', value: workbenchJob?.finished_at ?? EMPTY_VALUE},
                  {label: 'result_dir', value: workbenchJob?.result_dir ?? EMPTY_VALUE},
                  {label: 'artifact_dir', value: workbenchJob?.artifact_dir ?? EMPTY_VALUE},
                ].map((item) => (
                  <div key={item.label} className="min-w-0">
                    <p className="font-bold text-slate-500">{item.label}</p>
                    <p className="mt-1 truncate font-mono font-semibold text-slate-200" title={item.value}>{item.value}</p>
                  </div>
                ))}
              </div>
            ) : null}

            <div className="grid gap-3">
              {[
                {label: '当前轮次', value: roundDisplay},
                {label: '当前客户端', value: clientDisplay},
                {label: '已运行时间', value: progressDetail ? formatDurationSeconds(progressDetail.elapsed_seconds) : '正在初始化'},
                {label: '预计剩余时间', value: progressDetail ? formatDurationSeconds(progressDetail.estimated_remaining_seconds) : '正在初始化'},
                {label: '最后更新时间', value: progressDetail?.updated_at ?? '正在初始化'},
                {label: '本轮已完成客户端', value: progressDetail ? `${progressDetail.completed_clients}` : '正在初始化'},
              ].map((item) => (
                <div key={item.label} className="rounded-2xl border border-white/10 bg-white/[0.045] p-4">
                  <p className="text-xs font-bold text-slate-500">{item.label}</p>
                  <p className="mt-1 font-mono text-lg font-black text-slate-100">{item.value}</p>
                </div>
              ))}
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
              {[
                {label: 'GPU 利用率', value: gpuLatest ? `${gpuLatest.utilization_gpu.toFixed(0)}%` : '等待真实采样'},
                {label: '显存', value: gpuLatest ? `${gpuLatest.memory_used.toFixed(0)} / ${gpuLatest.memory_total.toFixed(0)} MiB` : '等待真实采样'},
                {label: '温度', value: gpuLatest ? `${gpuLatest.temperature.toFixed(0)}°C` : '等待真实采样'},
                {label: '功耗', value: gpuLatest ? `${gpuLatest.power_draw.toFixed(1)} W` : '等待真实采样'},
                {label: 'GPU 样本', value: workbenchJob?.gpu_stats?.available ? `${workbenchJob.gpu_stats.samples.length}` : '0'},
              ].map((item) => (
                <div key={item.label} className="rounded-2xl border border-violet-200/15 bg-violet-300/[0.055] p-3">
                  <p className="text-[11px] font-bold text-violet-100/65">{item.label}</p>
                  <p className="mt-1 font-mono text-sm font-black text-violet-50">{item.value}</p>
                </div>
              ))}
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              {monitoringFocusCards[selectedPlay.id].map((item) => (
                <div key={item.label} className="rounded-2xl border border-white/10 bg-white/[0.045] p-4">
                  <p className="text-xs font-bold text-slate-500">{item.label}</p>
                  <p className={cn('mt-1 font-mono text-lg font-black', item.tone ?? 'text-slate-100')}>{item.value}</p>
                </div>
              ))}
            </div>

            {workbenchJob?.status === 'completed' ? (
              <div className="mt-4 rounded-2xl border border-emerald-200/25 bg-emerald-300/10 p-3 text-sm font-bold text-emerald-100">
                实验完成，可进入单次分析
              </div>
            ) : null}
            <div className="mt-5 rounded-2xl border border-emerald-200/15 bg-slate-950/70 p-4">
              <div className="mb-3 flex items-center gap-2 text-emerald-100">
                <SquareTerminal className="h-4 w-4" />
                <span className="text-xs font-bold tracking-[0.18em]">终端日志</span>
              </div>
              <div className="max-h-80 space-y-2 overflow-y-auto pr-2 font-mono text-xs leading-5 text-slate-300">
                {logLines.map((line, index) => (
                  <p key={`${index}-${line}`}>{line}</p>
                ))}
              </div>
              <p className="mt-3 text-[11px] text-slate-500">
                {workbenchJobId
                  ? `日志来自 workbench job：${workbenchJob?.status ?? '读取中'}；当前不伪造真实训练进度。`
                  : v3LogLines.length
                    ? '运行时间线来自 V3 证据；不额外补写训练全过程。'
                    : '日志用于串联已完成结果摘要，不伪造完整训练全过程。'}
              </p>
              {workbenchJob?.status && ['completed', 'partial'].includes(workbenchJob.status) ? (
                <button
                  type="button"
                  onClick={() => setActiveTab('analysis')}
                  className="mt-4 inline-flex items-center gap-2 rounded-2xl border border-emerald-200/30 bg-emerald-300/10 px-3 py-2 text-xs font-bold text-emerald-50 hover:bg-emerald-300/15"
                >
                  <Search className="h-4 w-4" />
                  查看单次分析
                </button>
              ) : null}
              {workbenchJob?.status === 'failed' ? (
                <div className="mt-4 rounded-2xl border border-rose-200/25 bg-rose-300/10 p-3">
                  <p className="text-xs font-black text-rose-100">实验失败</p>
                  <p className="mt-2 text-sm leading-6 text-rose-50">{workbenchFailureSummary(workbenchJob)}</p>
                  <div className="mt-3 grid gap-2 text-xs text-rose-50/85 sm:grid-cols-2 lg:grid-cols-3">
                    <p>失败阶段：{workbenchStageLabel(workbenchJob.failure_stage ?? workbenchJob.stage)}</p>
                    <p>return code：{workbenchJob.return_code ?? EMPTY_VALUE}</p>
                    <p>实际 tensor shape：{formatShapeEvidence(workbenchJob.actual_tensor_shapes)}</p>
                    <p>模型期望 shape：{formatShapeEvidence(workbenchJob.model_expected_shapes)}</p>
                    <p>job_id：{workbenchJob.job_id}</p>
                    <p>方向：{workbenchDirectionLabel(workbenchJob.direction)}</p>
                    <p>数据集：{datasetLabel(workbenchJob.dataset ?? '')}</p>
                    <p>模型：{workbenchJob.model ?? EMPTY_VALUE}</p>
                  </div>
                  <details className="mt-3 rounded-xl bg-slate-950/60 p-3 text-xs text-slate-300">
                    <summary className="cursor-pointer font-bold text-rose-100">展开完整后端错误</summary>
                    <pre className="mt-3 max-h-64 overflow-auto whitespace-pre-wrap break-words font-mono text-[11px] leading-5">{workbenchFailureDetail(workbenchJob)}</pre>
                  </details>
                </div>
              ) : null}
            </div>
          </div>
        </section>

        <section className="sandbox-panel rounded-[28px] p-5">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-bold tracking-[0.2em] text-cyan-100/75">{curveBadge}</p>
              <h3 className="mt-1 text-xl font-bold text-white">Loss / Recall@50 / NDCG@50 / 风险 / 恢复</h3>
            </div>
            <span className="rounded-full border border-cyan-200/25 bg-cyan-300/10 px-3 py-1 text-xs font-bold text-cyan-100">{curveBadge}</span>
          </div>
          {lossValues.length || recallValues.length || ndcgValues.length || riskValues.length || recoveryValues.length ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
              {lossValues.length ? <Sparkline label="Loss" values={lossValues} tone="text-slate-200" valueText={lossValues.at(-1)?.toFixed(3) ?? EMPTY_VALUE} /> : null}
              {recallValues.length ? <Sparkline label="Recall@50" values={recallValues} tone="text-cyan-100" valueText={formatMetricValue(recallValues.at(-1))} /> : null}
              {ndcgValues.length ? <Sparkline label="NDCG@50" values={ndcgValues} tone="text-violet-100" valueText={formatMetricValue(ndcgValues.at(-1))} /> : null}
              {riskValues.length ? <Sparkline label="攻击风险" values={riskValues} tone="text-rose-100" valueText={formatMetricValue(riskValues.at(-1))} /> : null}
              {recoveryValues.length ? <Sparkline label="防御恢复" values={recoveryValues} tone="text-emerald-100" valueText={formatPercentValue(recoveryValues.at(-1) ?? null)} /> : null}
            </div>
          ) : <EmptyModuleBlock message="当前任务尚未导出逐轮曲线。" />}
        </section>
      </div>
    );
  };

  const renderAnalysis = () => {
    const targetTitle = targetProduct?.title ?? selectedPlayDefaults.targetLabel;

    // 1) 分析对象优先级：当前 workbench job.direction > workbenchResult.direction > 选中剧本默认 > 未知
    const jobDirectionRaw = workbenchJob?.direction ?? workbenchResult?.direction ?? null;
    const analysisDirection: WorkbenchDirectionId | null = isWorkbenchDirection(jobDirectionRaw)
      ? jobDirectionRaw
      : (() => {
          if (selectedPlay.id === 'target_poisoning_play') return 'recommendation_manipulation';
          if (selectedPlay.id === 'membership_privacy_play') return 'membership_inference';
          if (selectedPlay.id === 'update_leakage_play') return 'update_leakage';
          if (selectedPlay.id === 'robust_defense_play') return 'aggregation_defense';
          return null;
        })();

    // 2) 紧凑"本次实验摘要"：只展示真实存在字段
    const analysisSummaryEntries: Array<{label: string; value: string}> = [];
    const summaryDirectionLabel = analysisDirection ? workbenchDirectionLabel(analysisDirection) : EMPTY_VALUE;
    if (summaryDirectionLabel && summaryDirectionLabel !== EMPTY_VALUE) {
      analysisSummaryEntries.push({label: '实验方向', value: summaryDirectionLabel});
    }
    if (workbenchJob?.dataset) {
      analysisSummaryEntries.push({label: '数据集', value: datasetLabel(workbenchJob.dataset)});
    } else if (config.dataset) {
      analysisSummaryEntries.push({label: '数据集', value: datasetLabel(config.dataset)});
    }
    if (workbenchJob?.model) {
      analysisSummaryEntries.push({label: '模型', value: workbenchJob.model});
    } else if (config.model) {
      analysisSummaryEntries.push({label: '模型', value: config.model});
    }
    const summaryStartedAt = workbenchJob?.started_at ?? workbenchJob?.created_at;
    if (summaryStartedAt) {
      analysisSummaryEntries.push({label: '开始时间', value: formatDateTimeToSeconds(summaryStartedAt) ?? EMPTY_VALUE});
    }
    if (workbenchJob?.status) {
      analysisSummaryEntries.push({label: '完成状态', value: workbenchStatusLabel(workbenchJob.status)});
    }
    const analysisSummarySource = workbenchResult
      ? `workbench job result · ${workbenchSourceLabel(workbenchResult.source)}`
      : workbenchJob
        ? `workbench job · ${workbenchSourceLabel(workbenchJob.source)}`
        : '未选择分析对象';

    // 3) 当前 workbench job 的真实字段访问
    const jobMetricsSummary = asRecord(workbenchResult?.metrics_summary);
    const jobDirectionResult = workbenchDirectionResult(jobMetricsSummary);
    const jobMetrics = workbenchFlatMetrics(jobMetricsSummary);
    const hasJobMetric = (key: string) => jobMetrics
      ? Object.prototype.hasOwnProperty.call(jobMetrics, key) && jobMetrics[key] !== undefined && jobMetrics[key] !== null
      : false;
    const analysisJobMetricRaw = (key: string): number | null => {
      const value = jobMetrics?.[key];
      if (typeof value === 'number' && !Number.isNaN(value)) return value;
      if (typeof value === 'string' && value.trim() !== '') {
        const parsed = Number(value);
        return Number.isNaN(parsed) ? null : parsed;
      }
      return null;
    };
    const analysisJobMetricScalar = (key: string): string | number | boolean | null => {
      const value = jobMetrics?.[key];
      if (value === null || value === undefined) return null;
      if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return value;
      return null;
    };
    const analysisJobMetric = (key: string, fallback: string = EMPTY_VALUE) => {
      const value = jobMetrics?.[key];
      if (['string', 'number', 'boolean'].includes(typeof value) || value === null) {
        return workbenchMetricValue(key, value as string | number | boolean | null);
      }
      return fallback;
    };

    // 4) 防御是否在当前 job 真正启用：基于 job 自身配置/导出，不引入 V3 fallback
    const jobConfigSummary = asRecord(jobMetricsSummary?.config_summary) ?? asRecord(workbenchJob?.config_summary);
    const jobDefenseConfig = asRecord(jobConfigSummary?.defense);
    const jobRobustAggregators = Array.isArray(jobConfigSummary?.robust_aggregators)
      ? jobConfigSummary.robust_aggregators
      : [];
    const defenseActiveForJob = Boolean(
      activeJobDefenses.length ||
        jobRobustAggregators.length > 0 ||
        jobConfigSummary?.dp_noise_enabled ||
        activeJobDirectionResult?.defended,
    );
    const baseAttackForJob: string | null = (() => {
      if (jobDefenseConfig && typeof jobDefenseConfig.base_attack === 'string') return jobDefenseConfig.base_attack;
      if (hasJobMetric('base_attack')) {
        const v = analysisJobMetricScalar('base_attack');
        if (typeof v === 'string') return v;
      }
      return null;
    })();

    // 5) 训练质量指标（Loss / Recall@50 / NDCG@50 / 训练轮数）：仅当实际导出才显示
    const trainingQualityTiles: Array<{label: string; value: string; tone?: string}> = [];
    if (hasJobMetric('loss_final') || hasJobMetric('loss')) {
      trainingQualityTiles.push({label: 'Loss', value: formatMetricValue(analysisJobMetricRaw('loss_final') ?? analysisJobMetricRaw('loss'))});
    }
    if (hasJobMetric('recall_at_50')) {
      trainingQualityTiles.push({label: 'Recall@50', value: formatMetricValue(analysisJobMetricRaw('recall_at_50')), tone: 'text-cyan-100'});
    }
    if (hasJobMetric('ndcg_at_50')) {
      trainingQualityTiles.push({label: 'NDCG@50', value: formatMetricValue(analysisJobMetricRaw('ndcg_at_50')), tone: 'text-violet-100'});
    }
    if (hasJobMetric('total_rounds')) {
      trainingQualityTiles.push({label: '训练轮数', value: String(analysisJobMetricRaw('total_rounds'))});
    }

    // 6) 方向 → section 顺序映射；旧方向切换时通过 key 强制重挂以彻底卸载旧数据
    const sectionsForDirection: Record<WorkbenchDirectionId, ReadonlyArray<string>> = {
      recommendation_manipulation: [
        'header',
        'target_trajectory',
        'recommendation_size',
        'recommendation_comparison',
        'recommendation_metrics',
        'defense_summary',
      ],
      membership_inference: [
        'header',
        'mia_metrics',
        'mia_config',
        'mia_score_distribution',
      ],
      update_leakage: [
        'header',
        'leakage_metrics',
        'leakage_config',
        'leakage_candidates',
      ],
      aggregation_defense: [
        'header',
        'defense_metrics',
        'defense_config',
        'defense_filter',
      ],
    };

    // 7) 失败 job 单独分支
    if (workbenchJob && workbenchJob.status === 'failed') {
      return (
        <div className="workbench-analysis-surfaces space-y-5">
          <section className="sandbox-panel rounded-[28px] p-5">
            <p className="text-xs font-bold tracking-[0.2em] text-rose-100/75">单次分析</p>
            <h2 className="mt-2 text-2xl font-black text-white">该实验未完成，无法进入单次分析</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
              失败阶段：{workbenchStageLabel(workbenchJob.failure_stage ?? workbenchJob.stage)}
            </p>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
              实际 tensor shape：{formatShapeEvidence(workbenchJob.actual_tensor_shapes)} · 模型期望 shape：{formatShapeEvidence(workbenchJob.model_expected_shapes)}
            </p>
            <p className="mt-3 rounded-2xl border border-rose-200/25 bg-rose-300/10 px-3 py-2 text-sm font-bold text-rose-50">
              {workbenchFailureSummary(workbenchJob)}
            </p>
            {workbenchJob.error_detail ? (
              <pre className="mt-3 max-h-64 overflow-auto whitespace-pre-wrap break-words rounded-xl bg-slate-950/65 p-3 font-mono text-[11px] leading-5 text-slate-300">{workbenchJob.error_detail}</pre>
            ) : null}
          </section>
        </div>
      );
    }

    // 8) 无分析对象：简洁空状态
    if (!analysisDirection && !workbenchJobId) {
      return (
        <div className="workbench-analysis-surfaces space-y-5">
          <section className="sandbox-panel rounded-[28px] p-6">
            <p className="text-xs font-bold tracking-[0.2em] text-rose-100/75">单次分析</p>
            <h2 className="mt-2 text-2xl font-black text-white">暂无可分析实验</h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
              请先在「实验编排」开始一次训练，或在「历史实验」中选择一条已完成或部分完成的 job。系统会自动读取对应的 workbench job result，不会跨实验或跨 V3 场景拼接证据。
            </p>
          </section>
        </div>
      );
    }

    // 9) section 渲染器：每个 section 固定模块保留；空时整块显示一次统一占位，
    //    不再为每个指标分别显示"暂无 / 不适用"。
    const renderHeader = () => (
      <section className="sandbox-panel rounded-[28px] p-5">
        <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
          <div>
            <p className="text-xs font-bold tracking-[0.2em] text-rose-100/75">本次实验摘要</p>
            <h2 className="mt-2 text-2xl font-black leading-tight text-white">
              {analysisDirection ? workbenchDirectionLabel(analysisDirection) : '尚未选择分析对象'}
            </h2>
            <p className="mt-2 inline-flex rounded-full border border-cyan-200/25 bg-cyan-300/10 px-3 py-1 text-xs font-bold text-cyan-100">
              结果来源：{analysisSummarySource}
            </p>
          </div>
          {workbenchJobId ? (
            <span className="rounded-full border border-cyan-200/25 bg-cyan-300/10 px-3 py-1 text-xs font-bold text-cyan-100">
              job {shortWorkbenchJobId(workbenchJobId)}
            </span>
          ) : null}
        </div>
        {analysisSummaryEntries.length ? (
          <div className="mt-4 grid gap-3 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6">
            {analysisSummaryEntries.map((entry) => (
              <MetricTile key={entry.label} label={entry.label} value={entry.value} />
            ))}
          </div>
        ) : null}
        {trainingQualityTiles.length ? (
          <div className="mt-4 grid gap-3 sm:grid-cols-2 md:grid-cols-4">
            {trainingQualityTiles.map((tile) => (
              <MetricTile key={tile.label} label={tile.label} value={tile.value} tone={tile.tone} />
            ))}
          </div>
        ) : null}
      </section>
    );

    const renderTargetTrajectory = () => {
      const hasAnyTargetMetric =
        hasJobMetric('target_rank_before') ||
        hasJobMetric('target_rank_after') ||
        hasJobMetric('normalized_lift') ||
        hasJobMetric('normalized_rank_gain') ||
        hasJobMetric('reciprocal_rank_gain') ||
        hasJobMetric('target_manipulation_index') ||
        hasJobMetric('masked_top50_hit') ||
        hasJobMetric('attack_topk_hit') ||
        hasJobMetric('recommendation_jaccard') ||
        hasJobMetric('changed_user_count') ||
        hasJobMetric('changed_item_count') ||
        hasJobMetric('rank_gain');
      return (
        <section className="sandbox-panel rounded-[28px] p-5">
          <div className="mb-4 flex items-center gap-3">
            <Target className="h-5 w-5 text-rose-100" />
            <h3 className="text-xl font-bold text-white">目标商品轨迹</h3>
          </div>
          {hasAnyTargetMetric ? (
            <>
              <div className="grid gap-4 sm:grid-cols-[160px_minmax(0,1fr)]">
                <ProductImage item={targetImageItem} className="h-40 w-full sm:w-40" />
                <div className="min-w-0">
                  <h4 className="line-clamp-3 text-lg font-black leading-6 text-white">{targetTitle}</h4>
                  <p className="mt-2 text-sm text-slate-400">{targetProduct?.category ?? EMPTY_VALUE}</p>
                  <div className="mt-4 flex items-center gap-3">
                    <span className="rounded-2xl border border-slate-200/20 bg-slate-300/10 px-4 py-2 font-mono text-2xl font-black text-slate-100">
                      {hasJobMetric('target_rank_before') ? formatRank(displayRankBefore) : EMPTY_VALUE}
                    </span>
                    <ChevronRight className="h-6 w-6 text-rose-100" />
                    <span className="rounded-2xl border border-rose-200/35 bg-rose-300/12 px-4 py-2 font-mono text-2xl font-black text-rose-100">
                      {hasJobMetric('target_rank_after') ? formatRank(displayRankAfter) : EMPTY_VALUE}
                    </span>
                  </div>
                  <p className="mt-4 rounded-2xl border border-rose-200/25 bg-rose-300/10 px-3 py-2 text-sm font-bold text-rose-50">
                    {activeJobMetrics
                      ? (displayRankLift ?? 0) > 0
                        ? `本轮真实训练中目标排名提升 ${formatRankGain(displayRankLift)} 位，${displayFinalExposure}。`
                        : `本轮真实训练未观察到目标排名提升，${displayFinalExposure}。`
                      : '内部排序已推进，但最终曝光未命中。'}
                  </p>
                  {!targetAppearsInLoadedList && displayFinalExposure === '最终曝光未命中' ? (
                    <p className="mt-4 rounded-2xl border border-emerald-200/20 bg-emerald-300/10 px-3 py-2 text-sm font-semibold text-emerald-100">
                      目标商品未进入最终推荐列表，不插入推荐对照。
                    </p>
                  ) : null}
                </div>
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {hasJobMetric('target_rank_before') ? <MetricTile label="原始未屏蔽排序" value={formatRank(displayRankBefore)} /> : null}
                {hasJobMetric('target_rank_after') ? <MetricTile label="攻击后未屏蔽排序" value={formatRank(displayRankAfter)} tone="text-rose-100" /> : null}
                {hasJobMetric('normalized_lift') || hasJobMetric('normalized_rank_gain') ? (
                  <MetricTile label="归一化提升" value={formatPercentRank(displayNormalizedLift)} tone="text-rose-100" />
                ) : null}
                {hasJobMetric('reciprocal_rank_gain') ? (
                  <MetricTile label="倒数排名增益" value={formatRankGain(displayReciprocalGain)} tone="text-amber-100" />
                ) : null}
                {hasJobMetric('target_manipulation_index') ? (
                  <MetricTile label="目标操纵指数" value={formatMetricValue(analysisJobMetricRaw('target_manipulation_index'))} note="展示指标，不作为标准学术指标。" tone="text-rose-100" />
                ) : null}
                {hasJobMetric('masked_top50_hit') || hasJobMetric('attack_topk_hit') ? (
                  <MetricTile label="最终 Top50 曝光" value={displayFinalExposure} tone="text-emerald-100" />
                ) : null}
                {hasJobMetric('recommendation_jaccard') ? (
                  <MetricTile label="推荐 Jaccard" value={formatMetricValue(analysisJobMetricRaw('recommendation_jaccard'))} />
                ) : null}
                {hasJobMetric('changed_user_count') ? (
                  <MetricTile label="变化用户" value={formatPlainValue(analysisJobMetricRaw('changed_user_count'))} />
                ) : null}
                {hasJobMetric('changed_item_count') ? (
                  <MetricTile label="变化商品" value={formatPlainValue(analysisJobMetricRaw('changed_item_count'))} />
                ) : null}
                {hasJobMetric('rank_gain') ? (
                  <MetricTile label="排名提升" value={formatRankGain(analysisJobMetricRaw('rank_gain'))} tone="text-rose-100" />
                ) : null}
              </div>
            </>
          ) : (
            <EmptyModuleBlock />
          )}
        </section>
      );
    };

    const renderRecommendationSize = () => {
      // 只有后端 metrics 真实导出 baseline_top50 / attack_top50 时才显示规模统计（含真实 0）；
      // 没有可分析 job 时回退到 V3 showcase 报告的 recommendationComparison（按需显示）。
      // 三者都缺失时改为单条占位，不再显示"三个 0"。
      const hasJobSource = hasJobMetric('baseline_top50') || hasJobMetric('attack_top50');
      const hasV3Source = Boolean(
        report.recommendationComparison && (
          (report.recommendationComparison.baseline?.length ?? 0) > 0
          || (report.recommendationComparison.attack?.length ?? 0) > 0
          || (report.recommendationComparison.defense?.length ?? 0) > 0
        ),
      );
      if (!hasJobSource && !hasV3Source) {
        return (
          <section className="sandbox-panel rounded-[28px] p-5">
            <div className="mb-4 flex items-center gap-3">
              <BarChart3 className="h-5 w-5 text-cyan-100" />
              <h3 className="text-xl font-bold text-white">本次推荐列表规模</h3>
            </div>
            <EmptyModuleBlock />
          </section>
        );
      }
      return (
        <section className="sandbox-panel rounded-[28px] p-5">
          <div className="mb-4 flex items-center gap-3">
            <BarChart3 className="h-5 w-5 text-cyan-100" />
            <h3 className="text-xl font-bold text-white">本次推荐列表规模</h3>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <MetricTile label="正常推荐" value={`${recommendationCounts.baseline}`} />
            <MetricTile label="攻击后推荐" value={`${recommendationCounts.attack}`} tone="text-rose-100" />
            <MetricTile label="防御后推荐" value={`${recommendationCounts.defense}`} tone="text-emerald-100" />
          </div>
          <p className="mt-4 text-sm leading-6 text-slate-400">
            推荐项变化在下方逐项展示：新增、上升、下降、保持。分数为空时不显示；图片优先使用缩略图，其次本地缓存图，再其次远程图。
          </p>
        </section>
      );
    };

    const renderRecommendationComparison = () => {
      // 与 targetImageItem 共用同一个归一化后的 datasetId（后端注册过的 ID 形态）。
      const boardDataset = normalizeShowcaseDataset(
        (typeof activeJobMetrics?.dataset === 'string' ? (activeJobMetrics.dataset as string) : null)
        ?? workbenchJob?.dataset
        ?? config.dataset,
      );
      if (!activeRecommendationComparison) {
        return (
          <section className="sandbox-panel rounded-[28px] p-5">
            <div className="mb-4 flex items-center gap-3">
              <GitCompare className="h-5 w-5 text-cyan-100" />
              <h3 className="text-xl font-bold text-white">推荐列表对比</h3>
            </div>
            <EmptyModuleBlock />
          </section>
        );
      }
      return (
        <RecommendationComparisonBoard
          comparison={activeRecommendationComparison}
          scenarioId={jobRecommendationComparison ? null : selectedScenario.scenarioId}
          targetItemId={(activeJobMetrics?.target_item_id as string | number | null | undefined) ?? targetProduct?.itemId}
          dataset={boardDataset}
        />
      );
    };

    const renderRecommendationMetrics = () => {
      const tiles: Array<{label: string; value: string; tone?: string}> = [];
      if (hasJobMetric('recommendation_jaccard')) tiles.push({label: '推荐 Jaccard', value: formatMetricValue(analysisJobMetricRaw('recommendation_jaccard'))});
      if (hasJobMetric('changed_user_count')) tiles.push({label: '变化用户', value: formatPlainValue(analysisJobMetricRaw('changed_user_count'))});
      if (hasJobMetric('changed_item_count')) tiles.push({label: '变化商品', value: formatPlainValue(analysisJobMetricRaw('changed_item_count'))});
      if (hasJobMetric('target_manipulation_index')) tiles.push({label: '目标操纵指数', value: formatMetricValue(analysisJobMetricRaw('target_manipulation_index')), tone: 'text-rose-100'});
      if (hasJobMetric('normalized_lift') || hasJobMetric('normalized_rank_gain')) tiles.push({label: '归一化提升', value: formatPercentRank(displayNormalizedLift), tone: 'text-rose-100'});
      if (hasJobMetric('reciprocal_rank_gain')) tiles.push({label: '倒数排名增益', value:formatRankGain(displayReciprocalGain), tone: 'text-amber-100'});
      return (
        <section className="sandbox-panel rounded-[28px] p-5">
          <h3 className="text-xl font-bold text-white">已导出推荐指标</h3>
          {tiles.length ? (
            <div className="mt-4 grid gap-3 sm:grid-cols-2 md:grid-cols-4">
              {tiles.map((tile) => (
                <MetricTile key={tile.label} label={tile.label} value={tile.value} tone={tile.tone} />
              ))}
            </div>
          ) : (
            <EmptyModuleBlock />
          )}
        </section>
      );
    };

    const renderDefenseSummary = () => {
      if (!defenseActiveForJob) return null;
      const tiles: Array<{label: string; value: string; tone?: string}> = [];
      const algVal = analysisJobMetricScalar('defense_algorithm');
      if (typeof algVal === 'string' && algVal) tiles.push({label: '聚合算法', value: algVal, tone: 'text-emerald-100'});
      if (hasJobMetric('recall_at_50')) tiles.push({label: 'Recall@50', value: formatMetricValue(analysisJobMetricRaw('recall_at_50')), tone: 'text-cyan-100'});
      if (hasJobMetric('ndcg_at_50')) tiles.push({label: 'NDCG@50', value: formatMetricValue(analysisJobMetricRaw('ndcg_at_50')), tone: 'text-violet-100'});
      if (hasJobMetric('recovery_rate_recall')) tiles.push({label: '恢复率', value: formatPercentValue(analysisJobMetricRaw('recovery_rate_recall') as number | null), tone: 'text-emerald-100'});
      if (hasJobMetric('rejected_client_count') || hasJobMetric('filtered_client_count')) {
        tiles.push({label: '过滤结果', value: formatPlainValue(analysisJobMetricRaw('rejected_client_count') ?? analysisJobMetricRaw('filtered_client_count')), tone: 'text-emerald-100'});
      }
      return (
        <section className="sandbox-panel rounded-[28px] p-5">
          <div className="mb-4 flex items-center gap-3">
            <ShieldCheck className="h-5 w-5 text-emerald-100" />
            <h3 className="text-xl font-bold text-white">防御摘要</h3>
          </div>
          {tiles.length ? (
            <div className="grid gap-3 md:grid-cols-4">
              {tiles.map((tile) => (
                <MetricTile key={tile.label} label={tile.label} value={tile.value} tone={tile.tone} />
              ))}
            </div>
          ) : (
            <EmptyModuleBlock />
          )}
        </section>
      );
    };

    const renderMiaMetrics = () => {
      const tiles: Array<{label: string; value: string; tone?: string}> = [];
      if (hasJobMetric('auc')) tiles.push({label: 'AUC', value: formatMetricValue(analysisJobMetricRaw('auc')), tone: 'text-violet-100'});
      if (hasJobMetric('accuracy')) tiles.push({label: 'Accuracy', value: formatMetricValue(analysisJobMetricRaw('accuracy')), tone: 'text-violet-100'});
      if (hasJobMetric('precision')) tiles.push({label: 'Precision', value: formatMetricValue(analysisJobMetricRaw('precision')), tone: 'text-violet-100'});
      if (hasJobMetric('recall')) tiles.push({label: 'Recall', value: formatMetricValue(analysisJobMetricRaw('recall')), tone: 'text-violet-100'});
      if (hasJobMetric('f1')) tiles.push({label: 'F1', value: formatMetricValue(analysisJobMetricRaw('f1')), tone: 'text-violet-100'});
      if (hasJobMetric('score_gap')) tiles.push({label: '成员与非成员得分差', value: formatMetricValue(analysisJobMetricRaw('score_gap')), tone: 'text-violet-100'});
      if (hasJobMetric('evidence_type')) tiles.push({label: '证据类型', value: analysisJobMetric('evidence_type'), tone: 'text-slate-100'});
      return (
        <section className="sandbox-panel rounded-[28px] p-5">
          <div className="mb-4 flex items-center gap-3">
            <UserSearch className="h-5 w-5 text-violet-100" />
            <h3 className="text-xl font-bold text-white">成员推断指标</h3>
          </div>
          {tiles.length ? (
            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
              {tiles.map((tile) => (
                <MetricTile key={tile.label} label={tile.label} value={tile.value} tone={tile.tone} />
              ))}
            </div>
          ) : (
            <EmptyModuleBlock />
          )}
        </section>
      );
    };

    const renderMiaConfig = () => {
      const tiles: Array<{label: string; value: string}> = [];
      const evidenceSource = hasJobMetric('mia_evidence_source') ? analysisJobMetric('mia_evidence_source') : hasJobMetric('evidence_source') ? analysisJobMetric('evidence_source') : null;
      if (evidenceSource !== null) tiles.push({label: '证据来源', value: evidenceSource});
      const labelSource = hasJobMetric('label_source') ? analysisJobMetric('label_source') : hasJobMetric('membership_label_source') ? analysisJobMetric('membership_label_source') : null;
      if (labelSource !== null) tiles.push({label: '标签来源', value: labelSource});
      if (hasJobMetric('mia_model')) tiles.push({label: 'MIA 模型', value: analysisJobMetric('mia_model')});
      if (hasJobMetric('threshold_strategy')) tiles.push({label: '阈值策略', value: analysisJobMetric('threshold_strategy')});
      const sampleCount = hasJobMetric('sample_count') ? analysisJobMetricRaw('sample_count') : null;
      if (sampleCount !== null) tiles.push({label: '样本总数', value: String(sampleCount)});
      if (hasJobMetric('member_count') || hasJobMetric('non_member_count')) {
        tiles.push({label: '成员 / 非成员', value: `${analysisJobMetricRaw('member_count') ?? 0} / ${analysisJobMetricRaw('non_member_count') ?? 0}`});
      }
      if (hasJobMetric('member_nonmember_ratio')) tiles.push({label: '成员/非成员采样比例', value: String(analysisJobMetricRaw('member_nonmember_ratio'))});
      const pairScores = asRecord(jobDirectionResult?.pair_scores);
      if (pairScores) {
        tiles.push({label: '匿名判别分数', value: `${String(pairScores.returned ?? 0)} 条`});
      }
      return (
        <section className="sandbox-panel rounded-[28px] p-5">
          <h3 className="text-xl font-bold text-white">成员推断参数</h3>
          {tiles.length ? (
            <div className="mt-4 grid gap-3 sm:grid-cols-2 md:grid-cols-3">
              {tiles.map((tile) => (
                <MetricTile key={tile.label} label={tile.label} value={tile.value} />
              ))}
            </div>
          ) : (
            <EmptyModuleBlock />
          )}
        </section>
      );
    };

    const renderMiaScoreDistribution = () => {
      const rocRows = Array.isArray(jobDirectionResult?.roc_curve)
        ? jobDirectionResult.roc_curve.map(asRecord).filter((item): item is Record<string, unknown> => item !== null)
        : [];
      const scoreDistribution = asRecord(jobDirectionResult?.score_distribution);
      const memberDistribution = asRecord(scoreDistribution?.member);
      const nonMemberDistribution = asRecord(scoreDistribution?.non_member);
      const pairScores = asRecord(jobDirectionResult?.pair_scores);
      const rocValues = rocRows.map((row) => typeof row.tpr === 'number' ? row.tpr : null);
      const hasAny = rocValues.some((value) => value !== null) || Boolean(memberDistribution || nonMemberDistribution || pairScores);
      return (
        <section className="sandbox-panel rounded-[28px] p-5">
          <h3 className="text-xl font-bold text-white">判别分数分布</h3>
          {hasAny ? (
            <div className="mt-4 space-y-4">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {memberDistribution ? <MetricTile label="成员分数均值" value={formatMetricValue(memberDistribution.mean as number | null)} tone="text-violet-100" /> : null}
                {nonMemberDistribution ? <MetricTile label="非成员分数均值" value={formatMetricValue(nonMemberDistribution.mean as number | null)} tone="text-cyan-100" /> : null}
                {memberDistribution ? <MetricTile label="成员样本" value={String(memberDistribution.count ?? 0)} /> : null}
                {pairScores ? <MetricTile label="匿名明细" value={`${String(pairScores.returned ?? 0)} / ${String(pairScores.total ?? 0)}`} /> : null}
              </div>
              {rocValues.length ? (
                <div>
                  <p className="mb-2 text-xs font-bold tracking-[0.16em] text-slate-400">ROC 曲线 · 当前 job 判别分数</p>
                  <MultiSeriesChart series={[{label: 'TPR', color: '#a78bfa', values: rocValues}]} />
                </div>
              ) : null}
            </div>
          ) : (
            <EmptyModuleBlock />
          )}
        </section>
      );
    };

    const renderLeakageMetrics = () => {
      const tiles: Array<{label: string; value: string; tone?: string}> = [];
      if (hasJobMetric('hit_at_10') || hasJobMetric('hit@10')) tiles.push({label: 'hit@10', value: formatMetricValue(analysisJobMetricRaw('hit_at_10') ?? analysisJobMetricRaw('hit@10')), tone: 'text-cyan-100'});
      if (hasJobMetric('hit_at_20') || hasJobMetric('hit@20')) tiles.push({label: 'hit@20', value: formatMetricValue(analysisJobMetricRaw('hit_at_20') ?? analysisJobMetricRaw('hit@20')), tone: 'text-cyan-100'});
      if (hasJobMetric('hit_at_50') || hasJobMetric('hit@50')) tiles.push({label: 'hit@50', value: formatMetricValue(analysisJobMetricRaw('hit_at_50') ?? analysisJobMetricRaw('hit@50')), tone: 'text-cyan-100'});
      if (hasJobMetric('highest_risk_modality') || hasJobMetric('risk_modality')) {
        const v = hasJobMetric('highest_risk_modality') ? analysisJobMetric('highest_risk_modality') : analysisJobMetric('risk_modality');
        tiles.push({label: '风险模态', value: v, tone: 'text-cyan-100'});
      }
      return (
        <section className="sandbox-panel rounded-[28px] p-5">
          <div className="mb-4 flex items-center gap-3">
            <Database className="h-5 w-5 text-cyan-100" />
            <h3 className="text-xl font-bold text-white">更新泄露指标</h3>
          </div>
          {tiles.length ? (
            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
              {tiles.map((tile) => (
                <MetricTile key={tile.label} label={tile.label} value={tile.value} tone={tile.tone} />
              ))}
            </div>
          ) : (
            <EmptyModuleBlock />
          )}
        </section>
      );
    };

    const renderLeakageConfig = () => {
      const tiles: Array<{label: string; value: string}> = [];
      if (hasJobMetric('input_source')) tiles.push({label: '输入来源', value: analysisJobMetric('input_source')});
      if (hasJobMetric('target_modality')) tiles.push({label: '泄露目标模态', value: analysisJobMetric('target_modality')});
      if (hasJobMetric('similarity_method')) tiles.push({label: '相似度方法', value: analysisJobMetric('similarity_method')});
      if (hasJobMetric('audit_client_count')) tiles.push({label: '审计客户端数量', value: String(analysisJobMetricRaw('audit_client_count'))});
      if (hasJobMetric('candidate_pool_size')) tiles.push({label: '候选商品池大小', value: String(analysisJobMetricRaw('candidate_pool_size'))});
      if (hasJobMetric('returned_candidate_count')) tiles.push({label: '返回候选数量', value: String(analysisJobMetricRaw('returned_candidate_count'))});
      return (
        <section className="sandbox-panel rounded-[28px] p-5">
          <h3 className="text-xl font-bold text-white">更新泄露参数</h3>
          {tiles.length ? (
            <div className="mt-4 grid gap-3 sm:grid-cols-2 md:grid-cols-3">
              {tiles.map((tile) => (
                <MetricTile key={tile.label} label={tile.label} value={tile.value} />
              ))}
            </div>
          ) : (
            <EmptyModuleBlock />
          )}
        </section>
      );
    };

    const renderLeakageCandidates = () => {
      const candidateRows = Array.isArray(jobDirectionResult?.candidates)
        ? jobDirectionResult.candidates.map(asRecord).filter((item): item is Record<string, unknown> => item !== null)
        : [];
      const items = workbenchRecommendationItems(candidateRows).slice(0, 10);
      const perClient = asRecord(jobDirectionResult?.per_client_evidence);
      return (
        <section className="sandbox-panel rounded-[28px] p-5">
          <h3 className="text-xl font-bold text-white">候选还原商品</h3>
          {items.length ? (
            <div className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                {items.map((item, index) => {
                  const row = candidateRows[index] ?? {};
                  return (
                    <div key={`${item.itemId ?? index}-candidate`} className="rounded-2xl border border-white/10 bg-white/[0.04] p-2">
                      <ProductImage item={item} className="h-20 w-full rounded-xl" />
                      <p className="mt-2 line-clamp-2 text-[11px] font-semibold leading-4 text-slate-300">{getProductTitle(item)}</p>
                      <p className="mt-1 text-[10px] text-cyan-100">rank {String(row.rank ?? index + 1)} · score {formatMetricValue(row.score as number | null)}</p>
                    </div>
                  );
                })}
              </div>
              {perClient && Object.keys(perClient).length ? (
                <div className="overflow-x-auto rounded-2xl border border-white/10">
                  <table className="min-w-full text-left text-xs text-slate-300">
                    <thead className="bg-white/[0.05] text-slate-400"><tr><th className="px-3 py-2">匿名客户端</th><th className="px-3 py-2">真实交互</th><th className="px-3 py-2">候选数量</th><th className="px-3 py-2">Hit@50</th></tr></thead>
                    <tbody>{Object.entries(perClient).slice(0, 8).map(([clientId, value]) => {
                      const evidence = asRecord(value);
                      return <tr key={clientId} className="border-t border-white/10"><td className="px-3 py-2 font-mono">{clientId}</td><td className="px-3 py-2">{Array.isArray(evidence?.true_item_ids) ? evidence.true_item_ids.length : 0}</td><td className="px-3 py-2">{Array.isArray(evidence?.candidates) ? evidence.candidates.length : 0}</td><td className="px-3 py-2">{formatMetricValue(evidence?.hit_at_50 as number | null)}</td></tr>;
                    })}</tbody>
                  </table>
                </div>
              ) : null}
            </div>
          ) : (
            <EmptyModuleBlock />
          )}
        </section>
      );
    };

    const renderDefenseMetrics = () => {
      const baseline = asRecord(jobDirectionResult?.baseline);
      const attacked = asRecord(jobDirectionResult?.attacked);
      const defended = asRecord(jobDirectionResult?.defended);
      const rounds = Array.isArray(jobDirectionResult?.rounds)
        ? jobDirectionResult.rounds.map(asRecord).filter((item): item is Record<string, unknown> => item !== null)
        : [];
      const phases = [
        {label: '无攻击 / 无防御基线', value: baseline, tone: 'border-cyan-200/20'},
        ...(baseAttackForJob === 'malicious_update' ? [{label: '有攻击 / 无防御', value: attacked, tone: 'border-rose-200/20'}] : []),
        ...(defenseActiveForJob ? [{label: '同攻击条件 / 有防御', value: defended, tone: 'border-emerald-200/20'}] : []),
      ].filter((phase) => phase.value);
      const phaseSeries = (metric: 'loss' | 'recall_at_50' | 'ndcg_at_50'): ChartSeries[] => [
        {label: '基线', color: '#22d3ee', values: rounds.map((row) => asRecord(row.baseline)?.[metric] as number | null)},
        ...(baseAttackForJob === 'malicious_update' ? [{label: '攻击后', color: '#fb7185', values: rounds.map((row) => asRecord(row.attacked)?.[metric] as number | null)}] : []),
        ...(defenseActiveForJob ? [{label: '防御后', color: '#34d399', values: rounds.map((row) => asRecord(row.defended)?.[metric] as number | null)}] : []),
      ];
      return (
        <section className="sandbox-panel rounded-[28px] p-5">
          <div className="mb-4 flex items-center gap-3">
            <ShieldCheck className="h-5 w-5 text-emerald-100" />
            <h3 className="text-xl font-bold text-white">防御效果指标</h3>
          </div>
          {phases.length ? (
            <div className="space-y-5">
              <div className="grid gap-3 lg:grid-cols-3">
                {phases.map((phase) => (
                  <div key={phase.label} className={cn('rounded-2xl border bg-white/[0.035] p-4', phase.tone)}>
                    <p className="text-sm font-bold text-white">{phase.label}</p>
                    <div className="mt-3 grid grid-cols-3 gap-2">
                      <MetricTile label="Loss" value={formatMetricValue(phase.value?.loss as number | null)} />
                      <MetricTile label="Recall@50" value={formatMetricValue(phase.value?.recall_at_50 as number | null)} tone="text-cyan-100" />
                      <MetricTile label="NDCG@50" value={formatMetricValue(phase.value?.ndcg_at_50 as number | null)} tone="text-violet-100" />
                    </div>
                  </div>
                ))}
              </div>
              <div className="grid gap-4 xl:grid-cols-3">
                {(['loss', 'recall_at_50', 'ndcg_at_50'] as const).map((metric) => (
                  <div key={metric} className="rounded-2xl border border-white/10 bg-slate-950/35 p-3">
                    <p className="mb-2 text-xs font-bold text-slate-300">{metric === 'loss' ? 'Loss' : metric === 'recall_at_50' ? 'Recall@50' : 'NDCG@50'} 逐轮曲线</p>
                    <MultiSeriesChart series={phaseSeries(metric)} height={150} />
                  </div>
                ))}
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <MetricTile label="Recall@50 防御恢复率" value={formatPercentValue(analysisJobMetricRaw('recovery_rate_recall'))} tone="text-emerald-100" />
                <MetricTile label="NDCG@50 防御恢复率" value={formatPercentValue(analysisJobMetricRaw('recovery_rate_ndcg'))} tone="text-emerald-100" />
              </div>
            </div>
          ) : (
            <EmptyModuleBlock />
          )}
        </section>
      );
    };

    const renderDefenseConfig = () => {
      const tiles: Array<{label: string; value: string}> = [];
      const defenseParameters = asRecord(jobDirectionResult?.defense_parameters);
      const perturbationParameters = asRecord(jobDirectionResult?.update_perturbation);
      if (baseAttackForJob) tiles.push({label: '基础攻击', value: baseAttackForJob === 'none' ? '无攻击' : '恶意模型更新'});
      if (hasJobMetric('defense_algorithm')) tiles.push({label: '鲁棒聚合算法', value: analysisJobMetric('defense_algorithm')});
      if (baseAttackForJob === 'malicious_update' && hasJobMetric('malicious_client_ratio')) tiles.push({label: '恶意客户端比例', value: formatPercentValue(analysisJobMetricRaw('malicious_client_ratio'))});
      if (baseAttackForJob === 'malicious_update' && hasJobMetric('perturbation_type')) tiles.push({label: '扰动类型', value: analysisJobMetric('perturbation_type')});
      if (baseAttackForJob === 'malicious_update' && hasJobMetric('perturbation_strength')) tiles.push({label: '扰动强度', value: analysisJobMetric('perturbation_strength')});
      if (hasJobMetric('dp_noise_enabled')) tiles.push({label: '更新扰动层', value: analysisJobMetricScalar('dp_noise_enabled') ? '差分隐私风格加噪' : '未启用'});
      const parameterLabels: Record<string, string> = {
        krum_f: 'Krum 容错数',
        multi_krum_enabled: 'Multi-Krum',
        distance_metric: '距离度量',
        gradient_clip_norm: '防御预处理裁剪',
        outlier_strategy: '异常值策略',
        trim_ratio: '截尾比例',
        trim_min_keep: '最少保留客户端',
        bulyan_f: 'Bulyan 容错数',
        bulyan_selection_ratio: 'Bulyan 选择比例',
      };
      Object.entries(parameterLabels).forEach(([key, label]) => {
        const value = defenseParameters?.[key];
        if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
          tiles.push({label, value: typeof value === 'boolean' ? value ? '启用' : '关闭' : String(value)});
        }
      });
      if (analysisJobMetricScalar('dp_noise_enabled')) {
        const perturbationLabels: Record<string, string> = {
          noise_multiplier: '噪声乘数',
          max_grad_norm: '更新扰动裁剪',
          target_delta: '目标 delta',
          dp_seed: '扰动随机种子',
        };
        Object.entries(perturbationLabels).forEach(([key, label]) => {
          const value = perturbationParameters?.[key];
          if (typeof value === 'number' || typeof value === 'string') tiles.push({label, value: String(value)});
        });
      }
      return (
        <section className="sandbox-panel rounded-[28px] p-5">
          <h3 className="text-xl font-bold text-white">防御参数摘要</h3>
          {tiles.length ? (
            <div className="mt-4 grid gap-3 sm:grid-cols-2 md:grid-cols-3">
              {tiles.map((tile) => (
                <MetricTile key={tile.label} label={tile.label} value={tile.value} />
              ))}
            </div>
          ) : (
            <EmptyModuleBlock />
          )}
        </section>
      );
    };

    const renderDefenseFilter = () => {
      const rounds = Array.isArray(jobDirectionResult?.rounds)
        ? jobDirectionResult.rounds.map(asRecord).filter((item): item is Record<string, unknown> => item !== null)
        : [];
      const rejectedSeries = rounds.map((row) => typeof row.rejected_client_count === 'number' ? row.rejected_client_count : null);
      return (
        <section className="sandbox-panel rounded-[28px] p-5">
          <h3 className="text-xl font-bold text-white">客户端审计明细</h3>
          {rounds.length ? (
            <div className="mt-4 space-y-4">
              {rejectedSeries.some((value) => value !== null) ? <MultiSeriesChart series={[{label: '拒绝客户端数', color: '#34d399', values: rejectedSeries}]} height={140} /> : null}
              <div className="overflow-x-auto rounded-2xl border border-white/10">
                <table className="min-w-full text-left text-xs text-slate-300">
                  <thead className="bg-white/[0.05] text-slate-400"><tr><th className="px-3 py-2">轮次</th><th className="px-3 py-2">参与</th>{baseAttackForJob === 'malicious_update' ? <th className="px-3 py-2">恶意</th> : null}<th className="px-3 py-2">保留</th><th className="px-3 py-2">拒绝</th><th className="px-3 py-2">匿名拒绝客户端</th></tr></thead>
                  <tbody>{rounds.map((row, index) => <tr key={String(row.round ?? index)} className="border-t border-white/10"><td className="px-3 py-2">{String(row.round ?? index + 1)}</td><td className="px-3 py-2">{String(row.participant_count ?? 0)}</td>{baseAttackForJob === 'malicious_update' ? <td className="px-3 py-2 text-rose-100">{String(row.malicious_client_count ?? 0)}</td> : null}<td className="px-3 py-2 text-emerald-100">{String(row.accepted_client_count ?? 0)}</td><td className="px-3 py-2">{String(row.rejected_client_count ?? 0)}</td><td className="max-w-xs px-3 py-2 font-mono text-[10px]">{Array.isArray(row.rejected_client_ids) ? row.rejected_client_ids.join(', ') : EMPTY_VALUE}</td></tr>)}</tbody>
                </table>
              </div>
            </div>
          ) : (
            <EmptyModuleBlock />
          )}
        </section>
      );
    };

    const sectionRenderers: Record<string, () => React.ReactNode> = {
      header: renderHeader,
      target_trajectory: renderTargetTrajectory,
      recommendation_size: renderRecommendationSize,
      recommendation_comparison: renderRecommendationComparison,
      recommendation_metrics: renderRecommendationMetrics,
      defense_summary: renderDefenseSummary,
      mia_metrics: renderMiaMetrics,
      mia_config: renderMiaConfig,
      mia_score_distribution: renderMiaScoreDistribution,
      leakage_metrics: renderLeakageMetrics,
      leakage_config: renderLeakageConfig,
      leakage_candidates: renderLeakageCandidates,
      defense_metrics: renderDefenseMetrics,
      defense_config: renderDefenseConfig,
      defense_filter: renderDefenseFilter,
    };

    // 10) 任务完成但未导出任何方向证据 → 单一空状态
    const sectionList = analysisDirection ? sectionsForDirection[analysisDirection] : [];
    const hasAnyDirectionEvidence = jobDirectionResult !== null && Object.keys(jobDirectionResult).length > 0;
    if (analysisDirection && workbenchResult && !hasAnyDirectionEvidence) {
      return (
        <div className="workbench-analysis-surfaces space-y-5">
          {renderHeader()}
          <section className="sandbox-panel rounded-[28px] p-6">
            <p className="text-base font-bold text-white">该实验未导出可用于单次分析的方向证据。</p>
            <p className="mt-2 text-sm leading-6 text-slate-400">仅展示本 job 真实导出的指标；不混入 V3 artifact 或其他 job 的字段。</p>
          </section>
        </div>
      );
    }

    // 11) 正常渲染：按 direction 顺序展示 section；key 强制重挂以彻底卸载旧方向
    const sectionKey = `${analysisDirection ?? 'unknown'}-${workbenchJobId ?? 'none'}`;
    return (
      <div key={sectionKey} className="workbench-analysis-surfaces space-y-5">
        {sectionList.map((sectionId) => {
          const renderer = sectionRenderers[sectionId];
          if (!renderer) return null;
          return <React.Fragment key={sectionId}>{renderer()}</React.Fragment>;
        })}
      </div>
    );
  };

  const comparisonRows = useMemo(() => {
    const source = comparisonBundles.length ? comparisonBundles : [bundle];
    return source.map((item) => {
      const itemReport = item.report;
      const itemScenario = item.selectedScenario;
      const itemRanks = getTargetRanks(itemReport);
      const itemPrivacy = getPrivacyMetrics(itemReport);
      const itemTarget = itemReport.v3?.targetManipulation;
      const itemAggregation = itemReport.v3?.aggregationDefense;
      const supportRows = itemReport.modelCapabilityMatrix?.entries ?? [];
      const supportedCapability = supportRows.find((row) => row.model === itemReport.model || row.dataset === itemReport.dataset) ?? supportRows[0];
      return {
        id: itemScenario.scenarioId,
        scenario: getScenarioTitle(itemScenario, itemReport),
        model: itemReport.model ?? itemScenario.model ?? EMPTY_VALUE,
        dataset: datasetLabel(itemReport.dataset ?? itemScenario.dataset),
        attack: inferAttackType(itemScenario, itemReport),
        defense: inferDefenseType(itemScenario, itemReport),
        rankGain: itemRanks.rankLift,
        targetManipulationIndex: itemTarget?.targetManipulationIndex ?? null,
        recommendationJaccard: itemTarget?.recommendationJaccard ?? null,
        changedUserCount: itemTarget?.changedUserCount ?? null,
        top50: getFinalExposureText(itemReport),
        recall: itemAggregation?.recallAfter ?? itemReport.metricsSummary?.defense?.recall50 ?? itemReport.metricsSummary?.baseline?.recall50 ?? null,
        ndcg: itemAggregation?.ndcgAfter ?? itemReport.metricsSummary?.defense?.ndcg50 ?? itemReport.metricsSummary?.baseline?.ndcg50 ?? null,
        recallBefore: itemAggregation?.recallBefore ?? itemReport.metricsSummary?.baseline?.recall50 ?? null,
        ndcgBefore: itemAggregation?.ndcgBefore ?? itemReport.metricsSummary?.baseline?.ndcg50 ?? null,
        miaAuc: itemPrivacy.miaAuc,
        miaAccuracy: itemPrivacy.miaAccuracy,
        hit10: itemPrivacy.hit10,
        hit20: itemPrivacy.hit20,
        hit50: itemPrivacy.hit50,
        evidence: itemPrivacy.miaEvidence,
        modality: itemPrivacy.riskyModality,
        recovery: itemAggregation?.recoveryRate ?? itemReport.metricsSummary?.recoveryRate ?? null,
        residual: itemReport.v25Summary?.secAggResidual ?? null,
        selectedClients: itemAggregation?.selectedClients?.length ?? itemReport.defenseTrace?.krumSelected?.length ?? null,
        rejectedClients: itemAggregation?.rejectedClients?.length ?? itemReport.defenseTrace?.krumRejected?.length ?? null,
        defenseStatus: defenseStatusLabel(itemAggregation?.status),
        usage: inferScenarioUsage(itemScenario, itemReport),
        evidenceLabels: inferEvidenceLabels(itemScenario, itemReport).join(' / '),
        hasV3: Boolean(itemScenario.hasV3 || itemReport.v3),
        supportEvidence: supportedCapability?.evidence ?? supportedCapability?.recommendedDemoUsage ?? null,
        supportStatus: supportedCapability?.status ? toChineseLabel(supportedCapability.status) : null,
      };
    });
  }, [bundle, comparisonBundles]);

  const renderComparison = () => {
    const columnsByMode: Record<Exclude<ComparisonMode, 'none'>, Array<{key: string; label: string; render: (row: (typeof comparisonRows)[number]) => string}>> = {
      attack: [
        {key: 'scenario', label: '场景', render: (row) => row.scenario},
        {key: 'attack', label: '攻击类型', render: (row) => row.attack},
        {key: 'targetManipulationIndex', label: '目标操纵指数', render: (row) => formatCellValue(formatMetricValue(row.targetManipulationIndex))},
        {key: 'rankGain', label: '目标排序提升', render: (row) => formatCellValue(formatSignedRankGain(row.rankGain))},
        {key: 'top50', label: 'Top50 命中', render: (row) => formatCellValue(row.top50)},
        {key: 'change', label: '推荐 Jaccard', render: (row) => formatCellValue(formatMetricValue(row.recommendationJaccard))},
        {key: 'changedUserCount', label: '变化用户', render: (row) => formatCellValue(formatExportedValue(row.changedUserCount))},
        {key: 'miaAuc', label: 'MIA AUC', render: (row) => formatCellValue(formatMetricValue(row.miaAuc))},
        {key: 'hit50', label: '交互还原 hit@50', render: (row) => formatCellValue(formatMetricValue(row.hit50))},
      ],
      defense: [
        {key: 'scenario', label: '场景', render: (row) => row.scenario},
        {key: 'defense', label: '防御类型', render: (row) => row.defense},
        {key: 'status', label: '状态', render: (row) => formatCellValue(row.defenseStatus)},
        {key: 'recallBefore', label: 'Recall 前', render: (row) => formatCellValue(formatMetricValue(row.recallBefore))},
        {key: 'recall', label: 'Recall@50', render: (row) => formatCellValue(formatMetricValue(row.recall))},
        {key: 'ndcgBefore', label: 'NDCG 前', render: (row) => formatCellValue(formatMetricValue(row.ndcgBefore))},
        {key: 'ndcg', label: 'NDCG@50', render: (row) => formatCellValue(formatMetricValue(row.ndcg))},
        {key: 'recovery', label: '防御恢复率', render: (row) => formatCellValue(formatPercentValue(row.recovery))},
        {key: 'filtered', label: '选中/拒绝客户端', render: (row) => formatCellValue(`${formatExportedValue(row.selectedClients)} / ${formatExportedValue(row.rejectedClients)}`)},
      ],
      privacy: [
        {key: 'scenario', label: '场景', render: (row) => row.scenario},
        {key: 'miaAuc', label: 'MIA AUC', render: (row) => formatCellValue(formatMetricValue(row.miaAuc))},
        {key: 'miaAccuracy', label: 'Accuracy', render: (row) => formatCellValue(formatMetricValue(row.miaAccuracy))},
        {key: 'evidence', label: '成员推断证据类型', render: (row) => formatCellValue(row.evidence)},
        {key: 'hit10', label: 'hit@10', render: (row) => formatCellValue(formatMetricValue(row.hit10))},
        {key: 'hit20', label: 'hit@20', render: (row) => formatCellValue(formatMetricValue(row.hit20))},
        {key: 'hit50', label: 'hit@50', render: (row) => formatCellValue(formatMetricValue(row.hit50))},
        {key: 'modality', label: '最高风险模态', render: (row) => formatCellValue(row.modality)},
        {key: 'dp', label: 'DP-style noise', render: (row) => (row.defense.includes('差分') ? '使用' : '未标注')},
        {key: 'secagg', label: '安全聚合', render: (row) => (row.defense.includes('安全聚合') ? '模拟' : '未标注')},
      ],
      capability: [
        {key: 'model', label: '模型', render: (row) => row.model},
        {key: 'dataset', label: '数据集', render: (row) => row.dataset},
        {key: 'usage', label: '主用途', render: (row) => row.usage},
        {key: 'supportStatus', label: '支持状态', render: (row) => formatCellValue(row.supportStatus)},
        {key: 'evidence', label: '已有证据', render: (row) => row.evidenceLabels},
        {key: 'good', label: '适合展示的能力', render: (row) => formatCellValue(row.supportEvidence ?? (row.scenario.includes('KU') ? '多模态主展示' : row.scenario.includes('V2.5') || row.hasV3 ? '攻防强验证' : row.usage))},
        {key: 'limit', label: '不适合泛化的点', render: (row) => (row.scenario.includes('V2.5') ? '170 -> 3 不代表所有模型' : '按场景证据解释')},
      ],
    };

    const columns = comparisonMode === 'none' ? [] : columnsByMode[comparisonMode];
    const modelSupport =
      report.v3?.modelSupport ??
      report.modelCapabilityMatrix ??
      comparisonBundles.map((item) => item.report.v3?.modelSupport ?? item.report.modelCapabilityMatrix).find(Boolean) ??
      null;
    const smokeCards = buildModelSmokeCards(modelSupport, modelSupport?.smokeVerifiedModels, 'smoke_verified');
    const partialCards = buildModelSmokeCards(modelSupport, modelSupport?.partialSmokeVerifiedModels, 'partial_smoke_verified');
    const validateCards = buildModelSmokeCards(modelSupport, modelSupport?.validateOnlyModels, 'validate_only');
    const adapterCards = buildModelSmokeCards(modelSupport, modelSupport?.adapterRequiredModels, 'adapter_required');
    const failedCards = buildModelSmokeCards(modelSupport, modelSupport?.failedSmokeModels, 'failed_smoke');
    const fedAvgAmazonEvidence = getModelSmokeEvidence(modelSupport, 'FedAvg::AMAZON_BEAUTY_POC');
    const mmfedrapKuEvidence = getModelSmokeEvidence(modelSupport, 'MMFedRAP::KU');
    const renderModelSmokeGroup = (title: string, description: string, cards: ReturnType<typeof buildModelSmokeCards>, emptyText = '未导出') => (
      <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
        <div className="mb-4 flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
          <div>
            <h3 className="text-lg font-bold text-white">{title}</h3>
            <p className="mt-1 text-sm leading-6 text-slate-400">{description}</p>
          </div>
          <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs font-bold text-slate-300">{cards.length || emptyText}</span>
        </div>
        {cards.length ? (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {cards.map((card) => (
              <div key={`${title}-${card.key}`} className="rounded-2xl border border-white/10 bg-slate-950/35 p-4">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-base font-bold text-white">{card.model}</p>
                    <p className="mt-1 text-xs font-semibold text-slate-400">{card.dataset}</p>
                  </div>
                  <span className={cn('rounded-full border px-2.5 py-1 text-[11px] font-bold', modelSmokeToneClass(card.status))}>{modelSmokeStatusLabel(card.status)}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  {[
                    {label: 'TopK', value: card.topk},
                    {label: 'metrics', value: card.metrics},
                    {label: '结果', value: card.result},
                  ].map((item) => (
                    <div key={item.label} className="rounded-xl border border-white/10 bg-white/[0.04] px-2 py-2">
                      <p className="text-slate-500">{item.label}</p>
                      <p className="mt-1 font-bold text-slate-200">{item.value}</p>
                    </div>
                  ))}
                </div>
                <p className="mt-3 line-clamp-2 text-xs leading-5 text-slate-500">{card.note}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.025] p-4 text-sm text-slate-500">{emptyText}</div>
        )}
      </section>
    );
    const renderCapabilityComparison = () => (
      <div className="space-y-5">
        <section className="grid gap-3 md:grid-cols-4">
          {[
            {label: '已验证', value: smokeCards.length, status: 'smoke_verified'},
            {label: '部分支持', value: partialCards.length, status: 'partial_smoke_verified'},
            {label: '配置校验', value: validateCards.length, status: 'validate_only'},
            {label: '待适配', value: adapterCards.length, status: 'adapter_required'},
          ].map((item) => (
            <div key={item.label} className="rounded-3xl border border-white/10 bg-white/[0.045] p-5">
              <p className="text-xs font-bold text-slate-500">{item.label}</p>
              <p className="mt-2 text-3xl font-black text-white">{item.value}</p>
              <p className="mt-1 text-xs font-semibold text-slate-400">{modelSmokeStatusLabel(item.status)}</p>
            </div>
          ))}
        </section>

        <section className="grid gap-4 lg:grid-cols-[1.25fr_0.75fr]">
          <div className="space-y-4">
            {renderModelSmokeGroup(
              '攻防强验证底座',
              'Amazon 定向投毒、MIA、更新泄露和 V3 主链路集中在 FedAvg + Amazon Beauty。',
              [
                {
                  key: 'FedAvg::AMAZON_BEAUTY_POC',
                  model: fedAvgAmazonEvidence?.model ?? 'FedAvg',
                  dataset: fedAvgAmazonEvidence?.dataset ?? 'AMAZON_BEAUTY_POC',
                  status: fedAvgAmazonEvidence?.verificationLevel ?? 'validate_only',
                  topk: verifiedLabel(fedAvgAmazonEvidence?.topkExportVerified),
                  metrics: verifiedLabel(fedAvgAmazonEvidence?.metricsExportVerified),
                  result: getSmokeResultLabel(fedAvgAmazonEvidence),
                  note: '170 -> 3 只说明 FedAvg Amazon 这条链路的未屏蔽排序被推动，不代表其他模型同样成立。',
                },
              ],
            )}
            {renderModelSmokeGroup(
              '多模态主展示模型',
              'MMFedRAP + KU 是多模态 FedVLR 主展示模型，适合讲清图像、文本与协同信号融合。',
              [
                {
                  key: 'MMFedRAP::KU',
                  model: mmfedrapKuEvidence?.model ?? 'MMFedRAP',
                  dataset: mmfedrapKuEvidence?.dataset ?? 'KU',
                  status: mmfedrapKuEvidence?.verificationLevel ?? 'smoke_verified',
                  topk: verifiedLabel(mmfedrapKuEvidence?.topkExportVerified),
                  metrics: verifiedLabel(mmfedrapKuEvidence?.metricsExportVerified),
                  result: getSmokeResultLabel(mmfedrapKuEvidence),
                  note: 'KU smoke 验证说明链路可跑通；安全效果仍按具体 artifact 解释。',
                },
              ],
            )}
          </div>
          <aside className="rounded-3xl border border-cyan-200/20 bg-cyan-300/10 p-5">
            <p className="text-xs font-bold tracking-[0.18em] text-cyan-100/75">模型扩充口径</p>
            <h3 className="mt-3 text-xl font-bold text-white">目标是证明平台具备多模型接入能力，不是证明所有模型效果最好。</h3>
            <div className="mt-5 space-y-3 text-sm leading-6 text-slate-300">
              <p>{'FedAvg + Amazon 的 target rank 170 -> 3 不能泛化到其他模型。'}</p>
              <p>FCF / MMFCF 属于部分支持：基础链路已通过 smoke，但安全效果尚未形成完整验证。</p>
              <p>MGCN / MMGCN 相关模型需要适配器，不写成已支持。</p>
              <p>1 epoch smoke 只验证链路和导出，不代表最终性能。</p>
            </div>
          </aside>
        </section>

        {renderModelSmokeGroup(
          '已通过 smoke 验证',
          '这些模型完成小规模链路验证，包含 TopK 或 metrics 导出检查。',
          smokeCards,
        )}
        {renderModelSmokeGroup(
          '部分支持',
          '基础链路已通过 smoke，但安全效果尚未形成完整验证。',
          partialCards,
        )}
        {renderModelSmokeGroup(
          '仅配置校验',
          '当前只完成配置校验或可读配置检查，不能写成真实 smoke 结果。',
          validateCards,
        )}
        {renderModelSmokeGroup(
          '待适配',
          '模型、依赖或 Trainer 需要后续适配后才能进入完整安全验证链路。',
          adapterCards,
        )}
        {failedCards.length ? renderModelSmokeGroup('smoke 未通过', '这些模型已有失败记录，需要单独排查。', failedCards) : null}
      </div>
    );

    return (
      <div className="space-y-5">
        <section className="sandbox-panel rounded-[28px] p-5">
          <div className="mb-5 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
            <div>
              <p className="text-xs font-bold tracking-[0.2em] text-cyan-100/75">横向对比</p>
              <h2 className="mt-2 text-2xl font-bold text-white">先选对比问题，再看指标矩阵</h2>
              <p className="mt-2 text-sm leading-6 text-slate-400">跨场景对比只展示指标和证据，不展示推荐商品列表。</p>
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-4">
            {comparisonModes.map((mode) => (
              <button
                key={mode.id}
                type="button"
                onClick={() => setComparisonMode(mode.id)}
                className={cn(
                  'rounded-2xl border p-4 text-left transition',
                  comparisonMode === mode.id ? 'border-cyan-200/45 bg-cyan-300/10 text-cyan-50' : 'border-white/10 bg-white/[0.045] text-slate-300 hover:border-cyan-200/25',
                )}
              >
                <p className="font-bold">{mode.title}</p>
                <p className="mt-2 text-xs leading-5 text-slate-500">{mode.description}</p>
              </button>
            ))}
          </div>
          <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-3">
            <p className="text-xs font-bold text-slate-500">当前在比什么</p>
            <p className="mt-1 text-sm font-semibold text-slate-100">
              {comparisonMode === 'none' ? '先选择对比问题，再展开对应指标。' : comparisonModes.find((mode) => mode.id === comparisonMode)?.description}
            </p>
          </div>
        </section>

        {comparisonMode === 'none' ? (
          <section className="sandbox-panel rounded-[28px] p-6">
            <p className="text-lg font-bold text-white">请选择一个对比问题</p>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              工作台只在同一方向多场景、攻击方向 vs 聚合防御、或模型/数据集能力这几类问题下展开矩阵，避免把不相关场景混在一起比较。
            </p>
          </section>
        ) : comparisonMode === 'capability' ? (
          renderCapabilityComparison()
        ) : (
          <>
            <section className="sandbox-panel overflow-hidden rounded-[28px] p-0">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-white/10">
                  <thead className="bg-white/[0.045]">
                    <tr>
                      {columns.map((column) => (
                        <th key={column.key} className="px-4 py-3 text-left text-xs font-bold text-slate-400">
                          {column.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {comparisonRows.map((row) => (
                      <tr key={row.id} className="hover:bg-white/[0.035]">
                        {columns.map((column) => {
                          const rendered = column.render(row);
                          return (
                            <td key={column.key} className={cn('max-w-[280px] px-4 py-4 text-sm', rendered === '未导出' ? 'text-slate-500' : 'text-slate-200')}>
                              {rendered}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="border-t border-white/10 px-4 py-3 text-xs text-slate-500">
                缺失指标统一显示为“未导出”，表示当前结果文件没有该字段，不使用演示数据补齐。
              </div>
            </section>

            <section className="grid gap-4 md:grid-cols-3">
              {comparisonRows.slice(0, 3).map((row) => (
                <div key={`${row.id}-bar`} className="rounded-3xl border border-white/10 bg-white/[0.045] p-5">
                  <p className="text-sm font-bold text-white">{row.scenario}</p>
                  {[
                    {label: '目标排序提升', value: row.rankGain ? Math.min(1, row.rankGain / 169) : 0, text: formatSignedRankGain(row.rankGain), tone: 'bg-rose-300'},
                    {label: 'MIA AUC', value: row.miaAuc ?? 0, text: formatCellValue(formatMetricValue(row.miaAuc)), tone: 'bg-violet-300'},
                    {label: '防御恢复率', value: row.recovery ?? 0, text: formatCellValue(formatPercentValue(row.recovery)), tone: 'bg-emerald-300'},
                  ].map((item) => (
                    <div key={item.label} className="mt-4">
                      <div className="mb-1 flex justify-between text-xs text-slate-400">
                        <span>{item.label}</span>
                        <span>{item.text}</span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-800">
                        <div className={cn('h-2 rounded-full', item.tone)} style={{width: `${Math.max(0.04, Math.min(1, item.value)) * 100}%`}} />
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </section>
          </>
        )}
      </div>
    );
  };

  useEffect(() => {
    setArchivePage(1);
  }, [
    jobDateFromFilter,
    jobDateToFilter,
    jobDatasetFilter,
    jobDirectionFilter,
    jobModelFilter,
    jobSourceFilter,
    jobStatusFilter,
  ]);

  const renderHistory = () => (
    <div className="space-y-5">
      <section className="sandbox-panel rounded-[28px] p-5">
        <div className="mb-5 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div>
            <p className="text-xs font-bold tracking-[0.2em] text-cyan-100/75">WORKBENCH JOBS</p>
            <h2 className="mt-2 text-2xl font-bold text-white">真实运行实验档案</h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">来自 /workbench/jobs，一条 job 一个横向块；点击后进入单次分析并优先读取该 job result。</p>
          </div>
          <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-xs font-bold text-slate-300">
            共 {workbenchJobs?.total ?? 0} 个 job
          </span>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-7">
          <label className="space-y-1.5">
            <span className="text-[11px] font-bold text-slate-500">方向</span>
            <select value={jobDirectionFilter} onChange={(event) => setJobDirectionFilter(event.target.value)} className="w-full rounded-2xl border border-white/10 bg-slate-950/65 px-3 py-2 text-xs font-bold text-slate-100 outline-none transition focus:border-cyan-200/45">
              <option value="">全部方向</option>
              {Object.entries(WORKBENCH_DIRECTION_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
          <label className="space-y-1.5">
            <span className="text-[11px] font-bold text-slate-500">数据集</span>
            <select value={jobDatasetFilter} onChange={(event) => setJobDatasetFilter(event.target.value)} className="w-full rounded-2xl border border-white/10 bg-slate-950/65 px-3 py-2 text-xs font-bold text-slate-100 outline-none transition focus:border-cyan-200/45">
              <option value="">全部数据集</option>
              {datasetOptions.map((value) => <option key={value} value={value}>{datasetLabel(value)}</option>)}
            </select>
          </label>
          <label className="space-y-1.5">
            <span className="text-[11px] font-bold text-slate-500">模型</span>
            <select value={jobModelFilter} onChange={(event) => setJobModelFilter(event.target.value)} className="w-full rounded-2xl border border-white/10 bg-slate-950/65 px-3 py-2 text-xs font-bold text-slate-100 outline-none transition focus:border-cyan-200/45">
              <option value="">全部模型</option>
              {modelOptions.map((value) => <option key={value} value={value}>{value}</option>)}
            </select>
          </label>
          <label className="space-y-1.5">
            <span className="text-[11px] font-bold text-slate-500">source</span>
            <select value={jobSourceFilter} onChange={(event) => setJobSourceFilter(event.target.value)} className="w-full rounded-2xl border border-white/10 bg-slate-950/65 px-3 py-2 text-xs font-bold text-slate-100 outline-none transition focus:border-cyan-200/45">
              <option value="">全部 source</option>
              <option value="full_train">真实全量训练</option>
            </select>
          </label>
          <label className="space-y-1.5">
            <span className="text-[11px] font-bold text-slate-500">status</span>
            <select value={jobStatusFilter} onChange={(event) => setJobStatusFilter(event.target.value)} className="w-full rounded-2xl border border-white/10 bg-slate-950/65 px-3 py-2 text-xs font-bold text-slate-100 outline-none transition focus:border-cyan-200/45">
              <option value="">全部状态</option>
              {['queued', 'running', 'completed', 'partial', 'failed'].map((value) => <option key={value} value={value}>{workbenchStatusLabel(value)}</option>)}
            </select>
          </label>
          <label className="space-y-1.5">
            <span className="text-[11px] font-bold text-slate-500">开始日期</span>
            <input type="date" value={jobDateFromFilter} onChange={(event) => setJobDateFromFilter(event.target.value)} className="w-full rounded-2xl border border-white/10 bg-slate-950/65 px-3 py-2 text-xs font-bold text-slate-100 outline-none transition focus:border-cyan-200/45" />
          </label>
          <label className="space-y-1.5">
            <span className="text-[11px] font-bold text-slate-500">结束日期</span>
            <input type="date" value={jobDateToFilter} onChange={(event) => setJobDateToFilter(event.target.value)} className="w-full rounded-2xl border border-white/10 bg-slate-950/65 px-3 py-2 text-xs font-bold text-slate-100 outline-none transition focus:border-cyan-200/45" />
          </label>
        </div>
      </section>

      <section className="space-y-3">
        {(workbenchJobs?.items ?? []).map((job) => {
          const metricsPreview = Object.entries(job.key_metrics ?? {})
            .slice(0, 4)
            .map(([key, value]) => `${workbenchMetricLabel(key)} ${workbenchMetricValue(key, value as string | number | boolean | null)}`)
            .join(' / ');
          return (
            <article key={job.job_id} className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.045] transition hover:border-cyan-200/30">
              <button
                type="button"
                onClick={() => openWorkbenchJob(job)}
                className="grid w-full gap-3 p-4 text-left transition hover:bg-cyan-300/10 xl:grid-cols-[minmax(260px,1fr)_130px_150px_135px_130px_minmax(220px,1fr)] xl:items-center"
              >
                <div className="min-w-0">
                  <p className="truncate text-base font-black text-white">{job.experiment_name ?? shortWorkbenchJobId(job.job_id)}</p>
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-500">方向</p>
                  <p className="mt-1 text-sm font-semibold text-slate-200">{workbenchDirectionLabel(job.direction)}</p>
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-500">数据集 / 模型</p>
                  <p className="mt-1 text-sm font-semibold text-slate-200">{datasetLabel(job.dataset ?? '')}</p>
                  <p className="text-xs text-slate-500">{job.model ?? EMPTY_VALUE}</p>
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-500">任务来源</p>
                  <p className="mt-1 text-sm font-semibold text-slate-200">{workbenchSourceLabel(job.source)}</p>
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-500">状态 / 开始时间</p>
                  <p className="mt-1 text-sm font-semibold text-slate-200">{workbenchStatusLabel(job.status)}</p>
                  <p className="text-xs text-slate-500">{formatDateTimeToSeconds(job.started_at ?? job.created_at) ?? EMPTY_VALUE}</p>
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-bold text-slate-500">关键指标预览</p>
                  <p className="mt-1 truncate text-sm font-semibold text-slate-200">{metricsPreview || '暂无指标预览'}</p>
                </div>
              </button>
              {job.status === 'failed' ? (
                <details className="border-t border-rose-200/15 bg-rose-300/[0.07] px-4 py-3 text-xs text-rose-50/85">
                  <summary className="cursor-pointer font-bold text-rose-100">
                    {workbenchFailureSummary(job)}
                  </summary>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                    <p>失败阶段：{workbenchStageLabel(job.failure_stage)}</p>
                    <p>return code：{job.return_code ?? EMPTY_VALUE}</p>
                    <p>实际 tensor shape：{formatShapeEvidence(job.actual_tensor_shapes)}</p>
                    <p>模型期望 shape：{formatShapeEvidence(job.model_expected_shapes)}</p>
                    <p>job_id：{job.job_id}</p>
                    <p>{workbenchDirectionLabel(job.direction)} · {datasetLabel(job.dataset ?? '')} · {job.model ?? EMPTY_VALUE}</p>
                  </div>
                  <pre className="mt-3 max-h-64 overflow-auto whitespace-pre-wrap break-words rounded-xl bg-slate-950/65 p-3 font-mono text-[11px] leading-5 text-slate-300">{workbenchFailureDetail(job)}</pre>
                </details>
              ) : null}
            </article>
          );
        })}
        {workbenchJobsError ? (
          <div className="rounded-3xl border border-amber-200/25 bg-amber-300/10 p-4 text-sm font-semibold text-amber-100">{workbenchJobsError}</div>
        ) : null}
        {!workbenchJobsError && !(workbenchJobs?.items ?? []).length ? (
          <div className="rounded-3xl border border-white/10 bg-white/[0.045] p-6 text-sm text-slate-400">当前筛选条件下暂无 workbench job。</div>
        ) : null}
      </section>

      {workbenchJobs && workbenchJobs.total_pages > 1 ? (
        <section className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-xs font-semibold text-slate-500">
            Workbench jobs 第 {workbenchJobs.page} / {workbenchJobs.total_pages} 页，每页 12 条
          </span>
          <div className="flex gap-2">
            <button type="button" disabled={workbenchJobs.page <= 1} onClick={() => setArchivePage((page) => Math.max(1, page - 1))} className="rounded-2xl border border-white/10 bg-white/[0.045] px-3 py-2 text-xs font-bold text-slate-200 disabled:cursor-not-allowed disabled:opacity-40">
              上一页
            </button>
            <button type="button" disabled={workbenchJobs.page >= workbenchJobs.total_pages} onClick={() => setArchivePage((page) => Math.min(workbenchJobs.total_pages, page + 1))} className="rounded-2xl border border-white/10 bg-white/[0.045] px-3 py-2 text-xs font-bold text-slate-200 disabled:cursor-not-allowed disabled:opacity-40">
              下一页
            </button>
          </div>
        </section>
      ) : null}

    </div>
  );

  const renderActiveTab = () => {
    if (activeTab === 'orchestration') return renderPlaybookOrchestration();
    if (activeTab === 'monitoring') return renderMonitoring();
    if (activeTab === 'analysis') return renderAnalysis();
    if (activeTab === 'comparison') return renderComparison();
    return renderHistory();
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_20%_0%,rgba(56,189,248,0.12),transparent_32%),radial-gradient(circle_at_82%_16%,rgba(168,85,247,0.10),transparent_36%),linear-gradient(180deg,#08111f,#111827_44%,#0f172a)] px-4 py-6 text-slate-100 lg:px-8">
      <section className="mx-auto max-w-[1520px] space-y-5">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div>
            {isLoading ? (
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-xs font-bold text-slate-300">正在读取数据</span>
              </div>
            ) : null}
            <h1 className="text-3xl font-black tracking-tight text-white md:text-4xl">联邦推荐攻防工作台</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
              用中文攻防语义串联实验剧本、运行监控、单次分析、横向对比和历史档案，让真实结果按演示故事线进入页面。
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {SECURITY_AUDITS.map((audit) => (
              <span key={audit.id} className={cn('rounded-full border px-3 py-1 text-xs font-bold', securityToneClass(audit.color))}>
                {audit.shortTitle}
              </span>
            ))}
          </div>
        </div>

        <nav className="sandbox-panel flex flex-wrap gap-2 rounded-[26px] p-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-bold transition',
                  active ? 'bg-cyan-200 text-slate-950 shadow-[0_0_18px_rgba(56,189,248,0.2)]' : 'text-slate-300 hover:bg-white/[0.06] hover:text-white',
                )}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>

        {switchMessage ? (
          <div className="rounded-3xl border border-emerald-200/25 bg-emerald-300/10 px-4 py-3 text-sm font-bold text-emerald-100">
            {switchMessage}
          </div>
        ) : null}

        {renderActiveTab()}

        {activeTab === 'orchestration' ? (
          <section className="grid gap-4 md:grid-cols-4">
            {[
              {title: '攻击', icon: Swords, value: selectedPlay.attackModules.map((id) => getSecurityModule(id)?.shortTitle).filter(Boolean).join(' / ')},
              {title: '防御', icon: ShieldCheck, value: selectedPlay.defenseModules.map((id) => getSecurityModule(id)?.shortTitle).filter(Boolean).join(' / ')},
              {title: '观测', icon: Eye, value: selectedPlay.auditModules.map((id) => getSecurityModule(id)?.shortTitle).filter(Boolean).join(' / ')},
              {title: '证据', icon: Archive, value: inferEvidenceLabels(selectedScenario, report).join(' / ')},
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="rounded-3xl border border-white/10 bg-white/[0.035] p-4">
                  <div className="mb-2 flex items-center gap-2 text-slate-400">
                    <Icon className="h-4 w-4" />
                    <span className="text-xs font-bold">{item.title}</span>
                  </div>
                  <p className="text-sm font-semibold text-slate-100">{item.value || EMPTY_VALUE}</p>
                </div>
              );
            })}
          </section>
        ) : null}
      </section>
    </main>
  );
};
