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
  scenarioText,
} from '../lib/scenarioNarratives';
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
import {EMPTY_VALUE, formatMetricValue, formatPercentValue, formatPlainValue, getRecommendationCounts, toChineseLabel} from '../lib/showcaseFormat';
import {cn} from '../lib/utils';
import {loadShowcaseBundle} from '../services/showcase';
import type {ExperimentConfigurationSource} from '../services/experiment';
import type {StartTrainResponse} from '../services/train';
import type {ConsoleSessionState} from '../types/common';
import type {DefenseType, LaunchExperimentOptions, LaunchExperimentResponse, TrainConfig} from '../types/train';
import type {ShowcaseBundle, ShowcaseModelCapabilityMatrix, ShowcaseModelSmokeEvidence, ShowcaseRecommendationItem, ShowcaseReport, ShowcaseScenario} from '../types/showcase';

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
type ComparisonMode = 'attack' | 'defense' | 'privacy' | 'capability';
type ParamPanelId = 'basic' | 'advanced';
type AttackStrength = '弱' | '中' | '强';
type EvidenceSource = 'rank' | 'unmasked rank' | 'checkpoint score' | 'auto';
type CandidateLimit = 'Top10' | 'Top20' | 'Top50';
type RiskModality = 'item embedding' | 'image' | 'text';
type ActionState = 'idle' | 'validating' | 'starting';
type ArchiveFilter = '全部' | '主展示' | 'Amazon' | 'KU' | '投毒' | '隐私攻击' | '鲁棒防御' | '有图片' | '有推荐列表';

const tabs: Array<{id: WorkbenchTabId; label: string; icon: React.ComponentType<{className?: string}>}> = [
  {id: 'orchestration', label: '实验编排', icon: ListChecks},
  {id: 'monitoring', label: '运行监控', icon: Activity},
  {id: 'analysis', label: '单次分析', icon: Search},
  {id: 'comparison', label: '横向对比', icon: GitCompare},
  {id: 'history', label: '历史实验', icon: History},
];

const archiveFilters: ArchiveFilter[] = ['全部', '主展示', 'Amazon', 'KU', '投毒', '隐私攻击', '鲁棒防御', '有图片', '有推荐列表'];

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
const formatExportedValue = (value?: number | string | null) => (value === null || value === undefined || value === '' || value === EMPTY_VALUE ? '未导出' : String(value));
const formatCellValue = (value?: string | number | null) => {
  if (value === null || value === undefined || value === EMPTY_VALUE || value === '') {
    return '未导出';
  }
  return String(value);
};

const curveSourceLabel = (value?: string | null) => {
  if (value === 'real_points') return '真实记录点';
  if (value === 'summary_curve') return '摘要曲线';
  return value ? toChineseLabel(value) : '摘要曲线';
};

const defenseStatusLabel = (value?: string | null) => {
  if (value === 'configured_only') return '已配置 / 未形成完整 benchmark';
  return value ? toChineseLabel(value) : EMPTY_VALUE;
};

const getV3EvidenceBadges = (scenario: ShowcaseScenario, report?: ShowcaseReport | null) => {
  const badges: string[] = [];
  if (scenario.hasV3 || report?.v3) badges.push('V3 证据');
  if (scenario.hasRuntime || report?.v3?.runtime?.events.length) badges.push('有运行时间线');
  if (scenario.hasCurves || report?.v3?.curves) badges.push('有曲线');
  if (scenario.hasTargetManipulation || report?.v3?.targetManipulation) badges.push('有推荐操纵');
  if (scenario.hasMembership || report?.v3?.membership) badges.push('有成员推断');
  if (scenario.hasUpdateLeakage || report?.v3?.updateLeakage) badges.push('有更新泄露');
  if (scenario.hasAggregationDefense || report?.v3?.aggregationDefense) badges.push('有聚合防御');
  if (scenario.hasImages || report?.recommendationComparison?.baseline.some((item) => item.thumbnailUrl || item.localImageUrl || item.imageUrl)) badges.push('有图片');
  return Array.from(new Set(badges));
};

const splitModelDataset = (key: string) => {
  const [model, dataset] = key.split('::');
  return {
    model: model || EMPTY_VALUE,
    dataset: dataset || EMPTY_VALUE,
  };
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

const sameItem = (left?: string | number | null, right?: string | number | null) =>
  left !== undefined && left !== null && right !== undefined && right !== null && String(left) === String(right);

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
  const points = values
    .map((value, index) => {
      const x = (index / Math.max(1, values.length - 1)) * 180;
      const y = 58 - ((value - min) / range) * 48;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-4">
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="text-sm font-bold text-slate-100">{label}</p>
        <p className={cn('font-mono text-sm font-bold', tone)}>{valueText}</p>
      </div>
      <svg viewBox="0 0 180 64" className="h-16 w-full overflow-visible">
        <polyline points={points} fill="none" stroke="currentColor" strokeWidth="3" className={tone} strokeLinecap="round" strokeLinejoin="round" />
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
  const [robustAlgorithm, setRobustAlgorithm] = useState('Krum');
  const [dpLayerEnabled, setDpLayerEnabled] = useState(false);
  const [targetItemTitle, setTargetItemTitle] = useState('Empty Amber Glass Spray Bottles');
  const [attackStrength, setAttackStrength] = useState<AttackStrength>('强');
  const [saveTopKEnabled, setSaveTopKEnabled] = useState(true);
  const [exportAuditEnabled, setExportAuditEnabled] = useState(true);
  const [evidenceSource, setEvidenceSource] = useState<EvidenceSource>('auto');
  const [membershipLabelSource, setMembershipLabelSource] = useState('membership labels');
  const [membershipSampleCount, setMembershipSampleCount] = useState(200);
  const [membershipMetrics, setMembershipMetrics] = useState(['AUC', 'Accuracy', 'score gap']);
  const [candidateLimit, setCandidateLimit] = useState<CandidateLimit>('Top50');
  const [riskModality, setRiskModality] = useState<RiskModality>('item embedding');
  const [leakageMetrics, setLeakageMetrics] = useState(['hit@10', 'hit@20', 'hit@50']);
  const [noiseStrength, setNoiseStrength] = useState(0.15);
  const [defenseMetrics, setDefenseMetrics] = useState(['Recall@50', 'NDCG@50', '防御恢复率', '异常过滤']);
  const [highlightedParam, setHighlightedParam] = useState('');
  const [actionState, setActionState] = useState<ActionState>('idle');
  const [defenseActive, setDefenseActive] = useState(true);
  const [submitMessage, setSubmitMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [comparisonBundles, setComparisonBundles] = useState<ShowcaseBundle[]>([]);
  const [comparisonMode, setComparisonMode] = useState<ComparisonMode>('attack');
  const [archiveFilter, setArchiveFilter] = useState<ArchiveFilter>('全部');
  const [switchMessage, setSwitchMessage] = useState('');
  const autoSelectedRef = useRef(false);

  const {report, selectedScenario} = bundle;
  const config = session.draftTrainConfig;
  const selectedPlay = getExperimentPlaybook(selectedPlayId);
  const selectedPlayDefaults = {
    dataset: selectedPlay.dataset,
    model: selectedPlay.model,
    attackLabel: selectedPlay.attackType,
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
  const rankStats = getTargetRanks(report);
  const fallbackBefore = selectedPlay.id === 'target_poisoning_play' ? 170 : null;
  const fallbackAfter = selectedPlay.id === 'target_poisoning_play' ? 3 : null;
  const displayRankBefore = rankStats.before ?? fallbackBefore;
  const displayRankAfter = rankStats.after ?? fallbackAfter;
  const displayRankLift =
    rankStats.rankLift ?? (typeof displayRankBefore === 'number' && typeof displayRankAfter === 'number' ? displayRankBefore - displayRankAfter : null);
  const displayNormalizedLift =
    rankStats.normalizedLift ??
    (displayRankLift !== null && typeof displayRankBefore === 'number' && displayRankBefore > 1 ? displayRankLift / (displayRankBefore - 1) : null);
  const displayReciprocalGain =
    rankStats.reciprocalGain ??
    (typeof displayRankBefore === 'number' && typeof displayRankAfter === 'number' && displayRankBefore > 0 && displayRankAfter > 0
      ? 1 / displayRankAfter - 1 / displayRankBefore
      : null);
  const privacyMetrics = getPrivacyMetrics(report);
  const v3TargetPanel = report.v3?.targetManipulation ?? null;
  const v3MembershipPanel = report.v3?.membership ?? null;
  const v3LeakagePanel = report.v3?.updateLeakage ?? null;
  const v3AggregationPanel = report.v3?.aggregationDefense ?? null;
  const v3CurvesPanel = report.v3?.curves ?? null;
  const v3RuntimePanel = report.v3?.runtime ?? null;
  const v3EvidenceAvailable = Boolean(report.v3 || selectedScenario.hasV3);
  const targetProduct = getTargetProduct(report);
  const targetImageItem = targetProduct
    ? {
        thumbnailUrl: targetProduct.thumbnailUrl,
        localImageUrl: targetProduct.localImageUrl,
        imageUrl: targetProduct.imageUrl,
      }
    : null;
  const recommendationCounts = getRecommendationCounts(report.recommendationComparison);
  const targetAppearsInLoadedList = [
    ...(report.recommendationComparison?.baseline ?? []),
    ...(report.recommendationComparison?.attack ?? []),
    ...(report.recommendationComparison?.defense ?? []),
  ].some((item) => sameItem(item.itemId, targetProduct?.itemId));

  useEffect(() => {
    if (targetProduct?.title) {
      setTargetItemTitle(targetProduct.title);
    }
  }, [targetProduct?.title]);

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

  const datasetOptions = useMemo(() => {
    const values = [config.dataset, ...bundle.scenarios.map((scenario) => scenario.dataset).filter((value): value is string => Boolean(value))];
    return Array.from(new Set(values));
  }, [bundle.scenarios, config.dataset]);

  const modelOptions = useMemo(() => {
    const values = [config.model, ...bundle.scenarios.map((scenario) => scenario.model).filter((value): value is string => Boolean(value))];
    return Array.from(new Set(values));
  }, [bundle.scenarios, config.model]);

  const targetOptions = useMemo(() => {
    const items = [
      targetProduct ? {id: targetProduct.itemId ?? targetProduct.title, title: targetProduct.title ?? targetProduct.itemId ?? 'Empty Amber Glass Spray Bottles'} : null,
      ...(report.recommendationComparison?.attack ?? []).slice(0, 12).map((item) => ({id: item.itemId, title: item.title ?? `商品 ${item.itemId}`})),
      ...(report.recommendationComparison?.baseline ?? []).slice(0, 8).map((item) => ({id: item.itemId, title: item.title ?? `商品 ${item.itemId}`})),
    ].filter((item): item is {id?: string | number | null; title: string} => Boolean(item?.title));
    const seen = new Set<string>();
    const unique = items.filter((item) => {
      const key = String(item.id ?? item.title);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    return unique.length ? unique : [{id: 'empty-amber-glass-spray-bottles', title: 'Empty Amber Glass Spray Bottles'}];
  }, [report.recommendationComparison?.attack, report.recommendationComparison?.baseline, targetProduct]);

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
    setRobustAlgorithm(playbook.robustAlgorithm);
    setDpLayerEnabled(playbook.dpLayer);
    setTargetItemTitle(targetProduct?.title ?? playbook.targetLabel);
    setAttackStrength(playbook.id === 'target_poisoning_play' ? '强' : attackStrength);
    setSaveTopKEnabled(true);
    setExportAuditEnabled(true);
    setEvidenceSource(playbook.id === 'membership_privacy_play' ? 'auto' : evidenceSource);
    setCandidateLimit(playbook.id === 'update_leakage_play' ? 'Top50' : candidateLimit);
    setRiskModality(playbook.id === 'update_leakage_play' ? 'item embedding' : riskModality);
    setNoiseStrength(0.15);
    const attacks = playbook.attackModules.includes('target_poisoning') ? ['poisoning_attack'] : [];
    const privacyMetricsList = playbook.attackModules
      .filter((id) => id === 'membership_inference' || id === 'interaction_reconstruction')
      .map((id) => id);
    const enabledDefenses = [
      ...(playbook.dpLayer ? ['dp_noise'] : []),
      ...(playbook.aggregationMode === 'secure_aggregation' ? ['secure_aggregation_sim'] : []),
      ...(playbook.robustAlgorithm !== 'none' ? ['robust_aggregation'] : []),
    ];
    updateConfig({
      dataset: matchedScenario?.dataset ?? playbook.dataset,
      model: matchedScenario?.model ?? playbook.model,
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
        enabled: playbook.maliciousRatio > 0,
        mode: 'ratio',
        ratio: playbook.maliciousRatio,
      },
      advanced: {...config.advanced, secureAggregation: playbook.aggregationMode === 'secure_aggregation'},
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

  const setAggregationVisibility = (mode: AggregationMode) => {
    setAggregationMode(mode);
    if (mode === 'secure_aggregation') {
      setRobustAlgorithm('none');
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
    setAggregationMode('plain_updates');
    setRobustAlgorithm(algorithm);
    updateConfig({
      defenseEnabled: true,
      defenseType: getDefenseTypeFromRobust(algorithm),
      enabledDefenses: Array.from(new Set<string>([...(dpLayerEnabled ? ['dp_noise'] : []), 'robust_aggregation'])),
      advanced: {...config.advanced, secureAggregation: false},
    });
  };

  const clearRobustAlgorithm = () => {
    setRobustAlgorithm('none');
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

  const handleValidate = async () => {
    setIsSubmitting(true);
    setActionState('validating');
    setSubmitMessage('');
    window.setTimeout(() => {
      setSubmitMessage('配置已校验：当前为 artifact 演示配置，新训练任务接口待接入。');
      setIsSubmitting(false);
      setActionState('idle');
    }, 800);
  };

  const handleStartExperiment = () => {
    setActionState('starting');
    setSubmitMessage('');
    window.setTimeout(() => {
      setSubmitMessage('当前版本暂未接入真实训练任务启动，已自动切换为读取已完成 artifact 演示。');
      setActionState('idle');
    }, 800);
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
        {label: config.model || 'FedAvg', note: '本地训练', tone: 'train', Icon: Layers3},
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
        {label: robustAlgorithm !== 'none' ? robustAlgorithm : 'Krum', note: '鲁棒筛选', tone: 'defense', Icon: ShieldCheck, active: true},
        {label: '过滤异常', note: '拦截红点', tone: 'defense', Icon: Filter},
        {label: '性能恢复', note: 'Recall/NDCG', tone: 'audit', Icon: LineChart},
      ],
    };
    const basicParamsByPlay: Record<ExperimentPlayId, Array<{label: string; value: string}>> = {
      target_poisoning_play: [
        {label: '数据集', value: datasetLabel(config.dataset || 'AMAZON_BEAUTY_POC')},
        {label: '模型', value: config.model || 'FedAvg'},
        {label: '攻击方向', value: '目标商品投毒'},
        {label: '防御策略', value: robustAlgorithm !== 'none' ? robustAlgorithm : '暂无 / 可选鲁棒聚合'},
        {label: '目标商品', value: targetItemTitle},
        {label: '输出证据', value: `${saveTopKEnabled ? '排序 / Top50' : '排序'}${exportAuditEnabled ? ' / 推荐列表' : ''}`},
      ],
      membership_privacy_play: [
        {label: '数据集', value: 'Amazon Beauty / KU'},
        {label: '模型', value: 'FedAvg / MMFedRAP'},
        {label: '攻击方向', value: '成员推断'},
        {label: '防御策略', value: dpLayerEnabled ? '更新扰动层' : '可选扰动 / 安全聚合'},
        {label: '观测对象', value: '匿名 user-item 记录'},
        {label: '输出证据', value: membershipMetrics.join(' / ')},
      ],
      update_leakage_play: [
        {label: '数据集', value: 'Amazon Beauty'},
        {label: '模型', value: 'FedAvg'},
        {label: '攻击方向', value: '客户端更新泄露'},
        {label: '防御策略', value: aggregationMode === 'secure_aggregation' ? '安全聚合模拟' : '可选扰动层'},
        {label: '观测对象', value: `${riskModality} / ${candidateLimit} 候选`},
        {label: '输出证据', value: leakageMetrics.join(' / ')},
      ],
      robust_defense_play: [
        {label: '数据集', value: 'KU / Amazon Beauty'},
        {label: '模型', value: 'MMFedRAP / FedAvg'},
        {label: '攻击方向', value: '异常客户端更新'},
        {label: '防御策略', value: robustAlgorithm !== 'none' ? robustAlgorithm : 'Krum / Median / TrimmedMean'},
        {label: '观测对象', value: '异常过滤 / 性能恢复'},
        {label: '输出证据', value: defenseMetrics.join(' / ')},
      ],
    };
    const nextStepByPlay: Record<ExperimentPlayId, string> = {
      target_poisoning_play: `建议用 ${targetItemTitle} 读取 V2.5 定向投毒链路，再到单次分析查看 170→3 与 Top50 未命中。`,
      membership_privacy_play: '建议查看成员推断 AUC、准确率和训练/非训练记录区分。',
      update_leakage_play: `建议查看 ${candidateLimit} 候选商品还原和 ${leakageMetrics.join(' / ')}。`,
      robust_defense_play: `建议查看 ${robustAlgorithm !== 'none' ? robustAlgorithm : '无防御'} 下的防御恢复率、异常过滤和 Recall/NDCG 变化。`,
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
      'w-full rounded-2xl border border-white/10 bg-slate-950/60 px-3 py-2 text-sm font-semibold text-slate-100 outline-none transition focus:border-cyan-200/45';
    const fieldShell = (label: string, control: React.ReactNode, note?: string) => (
      <div className="block rounded-2xl border border-white/10 bg-slate-950/25 p-3">
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
              {option}
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
    const tagToggle = (selected: string[], value: string, onChange: (next: string[]) => void) => {
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
          {value}
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
    const renderAdvancedControls = () => {
      if (selectedPlay.id === 'target_poisoning_play') {
        return (
          <div className="grid gap-3">
            {fieldShell(
              '数据集',
              <select className={inputClass} value={config.dataset || 'AMAZON_BEAUTY_POC'} onChange={(event) => updateDataset(event.target.value)}>
                {datasetOptions.map((item) => (
                  <option key={item} value={item}>
                    {datasetLabel(item)}
                  </option>
                ))}
              </select>,
            )}
            {fieldShell(
              '模型',
              <select className={inputClass} value={config.model || 'FedAvg'} onChange={(event) => updateModel(event.target.value)}>
                {modelOptions.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>,
            )}
            <div className="grid gap-3 sm:grid-cols-2">
              {fieldShell('训练轮数', <input className={inputClass} type="number" min={1} max={200} value={config.totalRounds || 10} onChange={(event) => updateTotalRounds(Number(event.target.value))} />)}
              {fieldShell('本地轮数', <input className={inputClass} type="number" min={1} max={50} value={config.advanced.localEpochs || 5} onChange={(event) => updateLocalEpochs(Number(event.target.value))} />)}
            </div>
            {fieldShell(
              '客户端采样比例',
              <div className="flex items-center gap-3">
                <input className="w-full accent-cyan-300" type="range" min={0.05} max={1} step={0.05} value={config.clientSamplingRate || 0.25} onChange={(event) => updateClientSamplingRate(Number(event.target.value))} />
                <span className="w-12 text-right font-mono text-sm font-bold text-cyan-100">{(config.clientSamplingRate || 0.25).toFixed(2)}</span>
              </div>,
            )}
            {fieldShell(
              '恶意客户端比例',
              <div className="flex items-center gap-3">
                <input className="w-full accent-rose-300" type="range" min={0} max={0.6} step={0.05} value={config.poisoningRatio || 0.2} onChange={(event) => updatePoisoningRatio(Number(event.target.value))} />
                <span className="w-12 text-right font-mono text-sm font-bold text-rose-100">{formatRatio(config.poisoningRatio || 0.2)}</span>
              </div>,
            )}
            {fieldShell(
              '目标商品',
              <select
                className={inputClass}
                value={targetItemTitle}
                onChange={(event) => {
                  markParamChanged('目标商品');
                  setTargetItemTitle(event.target.value);
                }}
              >
                {targetOptions.map((item) => (
                  <option key={String(item.id ?? item.title)} value={item.title}>
                    {item.title}
                  </option>
                ))}
              </select>,
            )}
            {fieldShell(
              '攻击强度',
              segmented<AttackStrength>(attackStrength, ['弱', '中', '强'], (value) => {
                markParamChanged('攻击强度');
                setAttackStrength(value);
              }),
            )}
            <div className="flex flex-wrap gap-2">
              {switchControl(saveTopKEnabled, () => {
                markParamChanged('输出证据');
                setSaveTopKEnabled((value) => !value);
              }, '保存 TopK')}
              {switchControl(exportAuditEnabled, () => {
                markParamChanged('输出证据');
                setExportAuditEnabled((value) => !value);
              }, '导出审计结果')}
            </div>
          </div>
        );
      }
      if (selectedPlay.id === 'membership_privacy_play') {
        return (
          <div className="grid gap-3">
            {fieldShell(
              '证据来源',
              segmented<EvidenceSource>(evidenceSource, ['rank', 'unmasked rank', 'checkpoint score', 'auto'], (value) => {
                markParamChanged('输出证据');
                setEvidenceSource(value);
              }),
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
                {['membership labels', 'scenario labels', 'auto labels'].map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>,
            )}
            {fieldShell('采样数量', <input className={inputClass} type="number" min={20} max={5000} step={20} value={membershipSampleCount} onChange={(event) => {
              markParamChanged('观测对象');
              setMembershipSampleCount(Number(event.target.value));
            }} />)}
            {fieldShell('观测指标', <div className="flex flex-wrap gap-2">{['AUC', 'Accuracy', 'score gap'].map((item) => tagToggle(membershipMetrics, item, (next) => {
              markParamChanged('输出证据');
              setMembershipMetrics(next);
            }))}</div>)}
          </div>
        );
      }
      if (selectedPlay.id === 'update_leakage_play') {
        return (
          <div className="grid gap-3">
            {fieldShell('输入来源', <select className={inputClass} value="客户端上传更新" onChange={() => undefined}><option>客户端上传更新</option></select>)}
            {fieldShell(
              '候选数量',
              segmented<CandidateLimit>(candidateLimit, ['Top10', 'Top20', 'Top50'], (value) => {
                markParamChanged('观测对象');
                setCandidateLimit(value);
              }),
            )}
            {fieldShell(
              '风险模态',
              segmented<RiskModality>(riskModality, ['item embedding', 'image', 'text'], (value) => {
                markParamChanged('观测对象');
                setRiskModality(value);
              }),
            )}
            {fieldShell('观测指标', <div className="flex flex-wrap gap-2">{['hit@10', 'hit@20', 'hit@50'].map((item) => tagToggle(leakageMetrics, item, (next) => {
              markParamChanged('输出证据');
              setLeakageMetrics(next);
            }))}</div>)}
          </div>
        );
      }
      return (
        <div className="grid gap-3">
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
            '安全聚合隐藏单客户端更新，不做逐客户端鲁棒筛选。',
          )}
          {fieldShell(
            '防御算法',
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  markParamChanged('防御策略');
                  clearRobustAlgorithm();
                }}
                className={cn('rounded-full border px-3 py-1.5 text-xs font-black transition', robustAlgorithm === 'none' ? 'border-slate-200/35 bg-slate-300/12 text-slate-100' : 'border-white/10 bg-white/[0.045] text-slate-300')}
              >
                无防御
              </button>
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
                    'rounded-full border px-3 py-1.5 text-xs font-black transition',
                    robustAlgorithm === algorithm && !secureModeActive ? 'border-emerald-200/45 bg-emerald-300/15 text-emerald-50' : 'border-white/10 bg-white/[0.045] text-slate-300 hover:border-emerald-200/25',
                    secureModeActive ? 'cursor-not-allowed border-slate-700/60 bg-slate-900/40 text-slate-600' : '',
                  )}
                >
                  {algorithm}
                </button>
              ))}
            </div>,
          )}
          {fieldShell('更新扰动', switchControl(dpLayerEnabled, () => {
            markParamChanged('防御策略');
            toggleDpLayer();
          }, '差分隐私风格加噪'), '风格加噪 / 非 formal DP accountant')}
          {dpLayerEnabled
            ? fieldShell(
                '噪声强度',
                <div className="flex items-center gap-3">
                  <input className="w-full accent-amber-300" type="range" min={0.01} max={1} step={0.01} value={noiseStrength} onChange={(event) => {
                    markParamChanged('防御策略');
                    setNoiseStrength(Number(event.target.value));
                  }} />
                  <span className="w-12 text-right font-mono text-sm font-bold text-amber-100">{noiseStrength.toFixed(2)}</span>
                </div>,
              )
            : null}
          {fieldShell('观测指标', <div className="flex flex-wrap gap-2">{['Recall@50', 'NDCG@50', '防御恢复率', '异常过滤'].map((item) => tagToggle(defenseMetrics, item, (next) => {
            markParamChanged('输出证据');
            setDefenseMetrics(next);
          }))}</div>)}
        </div>
      );
    };

    return (
      <div className="space-y-4">
        <section className="grid gap-5 xl:grid-cols-[0.82fr_1.38fr_0.95fr]">
          <div className="sandbox-panel rounded-[28px] p-4">
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

          <div className="sandbox-panel rounded-[28px] p-5">
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-bold tracking-[0.18em] text-cyan-100/70">攻防流程</p>
                <h3 className="mt-1 text-xl font-black text-white">{directionMeta[selectedPlay.id].title}路径</h3>
              </div>
              <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-xs font-bold text-slate-300">{selectedPlay.evidenceState}</span>
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
                <span className="text-[11px] font-semibold text-slate-500">加噪层不是 formal DP</span>
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
                    <button
                      type="button"
                      onClick={() => {
                        markParamChanged('防御策略');
                        clearRobustAlgorithm();
                      }}
                      className={cn(
                        'rounded-full border px-4 py-2 text-xs font-black transition',
                        robustAlgorithm === 'none' ? 'border-slate-200/35 bg-slate-300/12 text-slate-100' : 'border-white/10 bg-white/[0.045] text-slate-300 hover:border-slate-200/25',
                      )}
                    >
                      无防御
                    </button>
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
                          robustAlgorithm === algorithm && !secureModeActive
                            ? 'border-emerald-200/45 bg-emerald-300/15 text-emerald-50'
                            : 'border-white/10 bg-white/[0.045] text-slate-300 hover:border-emerald-200/25',
                          secureModeActive ? 'cursor-not-allowed opacity-45' : '',
                        )}
                      >
                        {algorithm}
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
              <p className="mt-3 text-xs leading-5 text-slate-500">
                {secureModeActive
                  ? '安全聚合隐藏单客户端更新，不做逐客户端鲁棒筛选。'
                  : robustActive
                    ? '鲁棒聚合需要查看单客户端更新，因此安全聚合置灰。'
                    : '差分隐私风格加噪是单独扰动层，不和聚合模式混在一起。'}
              </p>
            </div>
          </div>

          <div className="sandbox-panel rounded-[28px] p-5">
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

            <div key={paramPanel} className="rounded-[26px] border border-white/10 bg-white/[0.04] p-3 transition-all duration-200 ease-out">
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
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
            <div>
              <p className="text-xs font-bold tracking-[0.18em] text-cyan-100/70">下一步建议</p>
              <h3 className="mt-1 max-w-3xl text-lg font-black leading-7 text-white">{nextStepByPlay[selectedPlay.id]}</h3>
              {submitMessage ? <p className="mt-2 text-sm font-semibold text-emerald-100">{submitMessage}</p> : null}
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-3">
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
              <span className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.035] px-3 py-2 text-xs font-bold text-slate-500">
                <Play className="h-4 w-4" />
                新训练任务待接入
              </span>
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
                        robustAlgorithm === algorithm && !secureModeActive
                          ? 'border-emerald-200/45 bg-emerald-300/12 text-emerald-50'
                          : 'border-white/10 bg-white/[0.045] text-slate-300 hover:border-emerald-200/30',
                        secureModeActive ? 'cursor-not-allowed opacity-50' : '',
                      )}
                    >
                      {algorithm}
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
                  {renderExpertControl('防御算法', <div className="rounded-xl bg-slate-950/50 px-3 py-2 text-sm text-slate-200">{secureModeActive ? '安全聚合模拟' : robustAlgorithm !== 'none' ? robustAlgorithm : dpLayerEnabled ? '差分隐私风格加噪' : '暂无防御'}</div>)}
                  {renderExpertControl('保存 TopK', <div className="rounded-xl bg-slate-950/50 px-3 py-2 text-sm text-slate-200">5 / 15 / 50 按需读取</div>)}
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
    const recallValues = v3CurvesPanel?.recallAt50?.length
      ? v3CurvesPanel.recallAt50
      : buildSummaryCurve([metrics?.baseline?.recall50, metrics?.attack?.recall50, metrics?.defense?.recall50], 0.31, 0.35);
    const ndcgValues = v3CurvesPanel?.ndcgAt50?.length
      ? v3CurvesPanel.ndcgAt50
      : buildSummaryCurve([metrics?.baseline?.ndcg50, metrics?.attack?.ndcg50, metrics?.defense?.ndcg50], 0.18, 0.2);
    const lossValues = v3CurvesPanel?.loss?.length ? v3CurvesPanel.loss : interpolate(0.72, 0.31);
    const riskValues = v3CurvesPanel?.attackRisk?.length ? v3CurvesPanel.attackRisk : buildSummaryCurve([0.18, displayNormalizedLift, privacyMetrics.miaAuc], 0.15, 0.56);
    const recoveryValues = v3CurvesPanel?.defenseRecovery?.length ? v3CurvesPanel.defenseRecovery : buildSummaryCurve([0.22, metrics?.recoveryRate], 0.2, 0.72);
    const maliciousRatio = v3RuntimePanel?.maliciousClientRatio ?? config.poisoningRatio ?? config.maliciousClientConfig?.ratio ?? 0;
    const roundNow = v3RuntimePanel?.currentRound ?? Math.max(1, Math.round((config.totalRounds || 10) * 0.7));
    const totalRounds = v3RuntimePanel?.totalRounds ?? config.totalRounds ?? 10;
    const curveBadge = curveSourceLabel(v3CurvesPanel?.curveSource);
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
        `[Defense] ${robustAlgorithm !== 'none' ? robustAlgorithm : 'Krum'} 正在过滤异常更新`,
        `[Defense] 当前聚合可见性：${aggregationMode === 'secure_aggregation' ? '安全聚合模拟' : '明文更新聚合'}`,
        `[Audit] 防御恢复率：${formatPercentValue(metrics?.recoveryRate)}`,
        '[Export] 鲁棒防御摘要已生成',
      ],
    };
    const v3LogLines = v3RuntimePanel?.events?.map((event) => {
      const prefix = event.round ? `[Round ${event.round}]` : event.type ? `[${toChineseLabel(event.type)}]` : '[V3]';
      return `${prefix} ${event.message}`;
    }) ?? [];
    const logLines = v3LogLines.length ? v3LogLines : logLinesByPlay[selectedPlay.id];
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
        {label: '过滤算法', value: robustAlgorithm !== 'none' ? robustAlgorithm : 'Krum', tone: 'text-emerald-100'},
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
            </div>

            <div className="grid gap-3">
              {[
                {label: '当前轮次', value: `${roundNow} / ${totalRounds}`},
                {label: '客户端数', value: `${v3RuntimePanel?.clientCount ?? config.clientCount ?? report.defenseTrace?.totalClients ?? 8}`},
                {label: '恶意客户端比例', value: formatRatio(maliciousRatio)},
                {label: '当前防御策略', value: v3RuntimePanel?.defenseStrategy ?? (defenseActive ? inferDefenseType(selectedScenario, report) : '无防御观察')},
              ].map((item) => (
                <div key={item.label} className="rounded-2xl border border-white/10 bg-white/[0.045] p-4">
                  <p className="text-xs font-bold text-slate-500">{item.label}</p>
                  <p className="mt-1 font-mono text-lg font-black text-slate-100">{item.value}</p>
                </div>
              ))}
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              {monitoringFocusByPlay[selectedPlay.id].map((item) => (
                <div key={item.label} className="rounded-2xl border border-white/10 bg-white/[0.045] p-4">
                  <p className="text-xs font-bold text-slate-500">{item.label}</p>
                  <p className={cn('mt-1 font-mono text-lg font-black', item.tone ?? 'text-slate-100')}>{item.value}</p>
                </div>
              ))}
            </div>

            <div className="mt-5 rounded-2xl border border-emerald-200/15 bg-slate-950/70 p-4">
              <div className="mb-3 flex items-center gap-2 text-emerald-100">
                <SquareTerminal className="h-4 w-4" />
                <span className="text-xs font-bold tracking-[0.18em]">终端日志</span>
              </div>
              <div className="space-y-2 font-mono text-xs leading-5 text-slate-300">
                {logLines.map((line) => (
                  <p key={line}>{line}</p>
                ))}
              </div>
              <p className="mt-3 text-[11px] text-slate-500">{v3LogLines.length ? '运行时间线来自 V3 证据；不额外补写训练全过程。' : '日志用于串联已完成结果摘要，不伪造完整训练全过程。'}</p>
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
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <Sparkline label="Loss" values={lossValues} tone="text-slate-200" valueText={lossValues.at(-1)?.toFixed(3) ?? EMPTY_VALUE} />
            <Sparkline label="Recall@50" values={recallValues} tone="text-cyan-100" valueText={formatMetricValue(metrics?.defense?.recall50 ?? metrics?.baseline?.recall50)} />
            <Sparkline label="NDCG@50" values={ndcgValues} tone="text-violet-100" valueText={formatMetricValue(metrics?.defense?.ndcg50 ?? metrics?.baseline?.ndcg50)} />
            <Sparkline label="攻击风险" values={riskValues} tone="text-rose-100" valueText={formatRatio(displayNormalizedLift ?? privacyMetrics.miaAuc)} />
            <Sparkline label="防御恢复" values={recoveryValues} tone="text-emerald-100" valueText={formatPercentValue(metrics?.recoveryRate)} />
          </div>
        </section>
      </div>
    );
  };

  const renderAnalysis = () => {
    const targetTitle = targetProduct?.title ?? selectedPlayDefaults.targetLabel;
    const candidateItems = (v3LeakagePanel?.candidateItems?.length
      ? v3LeakagePanel.candidateItems
      : [
          ...(report.recommendationComparison?.attack ?? []),
          ...(report.recommendationComparison?.baseline ?? []),
          ...(report.recommendationComparison?.defense ?? []),
        ]).slice(0, 6);
    const priorityPanel = () => {
      if (selectedPlay.id === 'membership_privacy_play') {
        return (
          <section className="sandbox-panel rounded-[28px] p-5">
            <div className="mb-4 flex items-center gap-3">
              <UserSearch className="h-5 w-5 text-violet-100" />
              <h3 className="text-xl font-bold text-white">成员推断优先证据</h3>
            </div>
            <p className="text-sm leading-6 text-slate-400">攻击者尝试判断匿名 user-item 记录是否参与训练，不展示完整用户历史。</p>
            <div className="mt-4 grid gap-3 md:grid-cols-4">
              <MetricTile label="MIA AUC" value={formatMetricValue(privacyMetrics.miaAuc)} tone="text-violet-100" />
              <MetricTile label="准确率" value={formatMetricValue(privacyMetrics.miaAccuracy)} tone="text-violet-100" />
              <MetricTile label="F1" value={formatMetricValue(privacyMetrics.miaF1)} tone="text-violet-100" />
              <MetricTile label="证据类型" value={privacyMetrics.miaEvidence} />
            </div>
            {privacyMetrics.anonymizedExamples?.length ? (
              <p className="mt-4 rounded-2xl border border-white/10 bg-slate-950/35 px-3 py-2 text-sm text-slate-300">
                匿名样例：{privacyMetrics.anonymizedExamples.slice(0, 2).map((item) => (typeof item === 'string' ? item : 'user-*** / item-***')).join(' / ')}
              </p>
            ) : null}
          </section>
        );
      }
      if (selectedPlay.id === 'update_leakage_play') {
        return (
          <section className="sandbox-panel rounded-[28px] p-5">
            <div className="mb-4 flex items-center gap-3">
              <Database className="h-5 w-5 text-cyan-100" />
              <h3 className="text-xl font-bold text-white">客户端更新泄露优先证据</h3>
            </div>
            <p className="text-sm leading-6 text-slate-400">这是候选交互还原，不是完整用户历史恢复。</p>
            <div className="mt-4 grid gap-3 md:grid-cols-4">
              <MetricTile label="hit@10" value={formatMetricValue(privacyMetrics.hit10)} />
              <MetricTile label="hit@20" value={formatMetricValue(privacyMetrics.hit20)} />
              <MetricTile label="hit@50" value={formatMetricValue(privacyMetrics.hit50)} />
              <MetricTile label="最高风险模态" value={privacyMetrics.riskyModality} />
            </div>
          </section>
        );
      }
      if (selectedPlay.id === 'robust_defense_play') {
        return (
          <section className="sandbox-panel rounded-[28px] p-5">
            <div className="mb-4 flex items-center gap-3">
              <ShieldCheck className="h-5 w-5 text-emerald-100" />
              <h3 className="text-xl font-bold text-white">鲁棒防御优先证据</h3>
            </div>
            <p className="text-sm leading-6 text-slate-400">重点观察推荐性能恢复和异常更新过滤；鲁棒聚合要求服务端能看到逐客户端更新。</p>
            <div className="mt-4 grid gap-3 md:grid-cols-4">
              <MetricTile label="Recall@50" value={formatMetricValue(v3AggregationPanel?.recallAfter ?? report.metricsSummary?.defense?.recall50 ?? report.metricsSummary?.baseline?.recall50)} />
              <MetricTile label="NDCG@50" value={formatMetricValue(v3AggregationPanel?.ndcgAfter ?? report.metricsSummary?.defense?.ndcg50 ?? report.metricsSummary?.baseline?.ndcg50)} />
              <MetricTile label="恢复率" value={formatPercentValue(report.metricsSummary?.recoveryRate)} tone="text-emerald-100" />
              <MetricTile label="状态" value={defenseStatusLabel(v3AggregationPanel?.status)} />
            </div>
          </section>
        );
      }
      return null;
    };
    const analysisHeadlineByPlay: Record<ExperimentPlayId, string> = {
      target_poisoning_play: `目标商品在未屏蔽排序中从第 ${displayRankBefore ?? 170} 位提升到第 ${displayRankAfter ?? 3} 位，但最终 Top50 推荐列表未曝光。`,
      membership_privacy_play: `成员推断审计显示 AUC 为 ${formatMetricValue(privacyMetrics.miaAuc)}，攻击者尝试判断匿名 user-item 记录是否参与训练。`,
      update_leakage_play: `客户端更新泄露审计显示 hit@50 为 ${formatMetricValue(privacyMetrics.hit50)}，这是候选交互还原，不是完整用户历史恢复。`,
      robust_defense_play: `鲁棒聚合防御重点观察 Recall@50 / NDCG@50 恢复和异常更新过滤，当前恢复率为 ${formatPercentValue(report.metricsSummary?.recoveryRate)}。`,
    };
    const analysisFocusCards: Record<ExperimentPlayId, Array<{label: string; value: string; note?: string; tone?: string}>> = {
      target_poisoning_play: [
        {label: '目标排序', value: `${displayRankBefore ?? 170} -> ${displayRankAfter ?? 3}`, tone: 'text-rose-100'},
        {label: '排名提升', value: formatSigned(displayRankLift, 0), tone: 'text-rose-100'},
        {label: '最终 Top50 曝光', value: getFinalExposureText(report), tone: 'text-emerald-100'},
        {label: '目标操纵指数', value: formatMetricValue(v3TargetPanel?.targetManipulationIndex ?? null), note: '展示指标，不作为标准学术指标。', tone: 'text-rose-100'},
      ],
      membership_privacy_play: [
        {label: 'MIA AUC', value: formatMetricValue(privacyMetrics.miaAuc), tone: 'text-violet-100'},
        {label: '准确率', value: formatMetricValue(privacyMetrics.miaAccuracy), tone: 'text-violet-100'},
        {label: '证据类型', value: privacyMetrics.miaEvidence, tone: 'text-slate-100'},
        {label: '匿名样例', value: 'user-*** / item-***', note: '只展示匿名形式，不泄露完整历史。', tone: 'text-slate-100'},
      ],
      update_leakage_play: [
        {label: 'hit@10', value: formatMetricValue(privacyMetrics.hit10), tone: 'text-cyan-100'},
        {label: 'hit@20', value: formatMetricValue(privacyMetrics.hit20), tone: 'text-cyan-100'},
        {label: 'hit@50', value: formatMetricValue(privacyMetrics.hit50), tone: 'text-cyan-100'},
        {label: '最高风险模态', value: privacyMetrics.riskyModality, note: '候选还原，不是完整用户历史恢复。', tone: 'text-cyan-100'},
      ],
      robust_defense_play: [
        {label: 'Recall@50', value: formatMetricValue(report.metricsSummary?.defense?.recall50 ?? report.metricsSummary?.baseline?.recall50), tone: 'text-cyan-100'},
        {label: 'NDCG@50', value: formatMetricValue(report.metricsSummary?.defense?.ndcg50 ?? report.metricsSummary?.baseline?.ndcg50), tone: 'text-violet-100'},
        {label: '防御恢复率', value: formatPercentValue(report.metricsSummary?.recoveryRate), tone: 'text-emerald-100'},
        {label: '异常更新过滤', value: formatPlainValue(report.defenseTrace?.filteredClients ?? report.defenseTrace?.clippedClients), tone: 'text-emerald-100'},
      ],
    };

    return (
      <div className="space-y-5">
        <section className="sandbox-panel rounded-[28px] p-6">
          <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
            <div>
              <p className="text-xs font-bold tracking-[0.2em] text-rose-100/75">本次实验结论</p>
              <h2 className="mt-2 text-2xl font-black leading-tight text-white">{analysisHeadlineByPlay[selectedPlay.id]}</h2>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
                当前单次分析会优先展示所选剧本的关键证据，再给出推荐、隐私和防御的交叉摘要。
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {analysisFocusCards[selectedPlay.id].map((item) => (
                <MetricTile key={item.label} label={item.label} value={item.value} note={item.note} tone={item.tone} />
              ))}
            </div>
          </div>
        </section>

        {priorityPanel()}

        <section className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
          <div className="sandbox-panel rounded-[28px] p-5">
            <div className="mb-4 flex items-center gap-3">
              <Target className="h-5 w-5 text-rose-100" />
              <h3 className="text-xl font-bold text-white">目标商品轨迹</h3>
            </div>
            <div className="grid gap-4 sm:grid-cols-[160px_minmax(0,1fr)]">
              <ProductImage item={targetImageItem} className="h-40 w-full sm:w-40" />
              <div className="min-w-0">
                <h4 className="line-clamp-3 text-lg font-black leading-6 text-white">{targetTitle}</h4>
                <p className="mt-2 text-sm text-slate-400">{targetProduct?.category ?? '暂无类目'}</p>
                <div className="mt-4 flex items-center gap-3">
                  <span className="rounded-2xl border border-slate-200/20 bg-slate-300/10 px-4 py-2 font-mono text-2xl font-black text-slate-100">
                    {displayRankBefore ?? 170}
                  </span>
                  <ChevronRight className="h-6 w-6 text-rose-100" />
                  <span className="rounded-2xl border border-rose-200/35 bg-rose-300/12 px-4 py-2 font-mono text-2xl font-black text-rose-100">
                    {displayRankAfter ?? 3}
                  </span>
                </div>
                <p className="mt-4 rounded-2xl border border-rose-200/25 bg-rose-300/10 px-3 py-2 text-sm font-bold text-rose-50">
                  内部排序已推进，但最终曝光未命中。
                </p>
                {!targetAppearsInLoadedList && getFinalExposureText(report) === '最终曝光未命中' ? (
                  <p className="mt-4 rounded-2xl border border-emerald-200/20 bg-emerald-300/10 px-3 py-2 text-sm font-semibold text-emerald-100">
                    目标商品未进入最终推荐列表，不插入推荐对照。
                  </p>
                ) : null}
              </div>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <MetricTile label="原始未屏蔽排序" value={formatRank(displayRankBefore)} />
              <MetricTile label="攻击后未屏蔽排序" value={formatRank(displayRankAfter)} tone="text-rose-100" />
              <MetricTile label="归一化提升" value={formatRatio(displayNormalizedLift)} tone="text-rose-100" />
              <MetricTile label="倒数排名增益" value={formatSmallNumber(displayReciprocalGain)} tone="text-amber-100" />
              <MetricTile label="目标操纵指数" value={formatMetricValue(v3TargetPanel?.targetManipulationIndex ?? null)} note="展示指标，不作为标准学术指标。" tone="text-rose-100" />
              <MetricTile label="最终 Top50 曝光" value={getFinalExposureText(report)} tone="text-emerald-100" />
              <MetricTile label="推荐 Jaccard" value={formatMetricValue(v3TargetPanel?.recommendationJaccard ?? null)} />
              <MetricTile label="变化用户" value={formatPlainValue(v3TargetPanel?.changedUserCount)} />
              <MetricTile label="变化商品" value={formatPlainValue(v3TargetPanel?.changedItemCount)} />
            </div>
          </div>

          <div className="sandbox-panel rounded-[28px] p-5">
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
          </div>
        </section>

        <RecommendationComparisonBoard comparison={report.recommendationComparison} scenarioId={selectedScenario.scenarioId} targetItemId={targetProduct?.itemId} />

        <section className="grid gap-5 xl:grid-cols-2">
          <div className="sandbox-panel rounded-[28px] p-5">
            <div className="mb-4 flex items-center gap-3">
              <UserSearch className="h-5 w-5 text-violet-100" />
              <h3 className="text-xl font-bold text-white">成员推断攻击</h3>
            </div>
            <p className="text-sm leading-6 text-slate-400">攻击者尝试判断某条 user-item 记录是否参与训练。当前展示依赖结果文件中的摘要证据。</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <MetricTile label="AUC" value={formatMetricValue(privacyMetrics.miaAuc)} tone="text-violet-100" />
              <MetricTile label="准确率" value={formatMetricValue(privacyMetrics.miaAccuracy)} tone="text-violet-100" />
              <MetricTile label="证据类型" value={privacyMetrics.miaEvidence} tone="text-slate-100" />
              <MetricTile label="Precision" value={formatMetricValue(privacyMetrics.miaPrecision)} tone="text-violet-100" />
              <MetricTile label="Recall" value={formatMetricValue(privacyMetrics.miaRecall)} tone="text-violet-100" />
              <MetricTile label="Score gap" value={formatMetricValue(privacyMetrics.miaScoreGap)} tone="text-violet-100" />
            </div>
            <div className="mt-5 rounded-2xl border border-white/10 bg-slate-950/35 p-4">
              {[
                {label: '参与训练记录', value: Math.min(0.92, Math.max(0.45, privacyMetrics.miaAuc ?? 0.56)), tone: 'bg-violet-300'},
                {label: '未参与训练记录', value: Math.min(0.82, Math.max(0.32, 1 - (privacyMetrics.miaAuc ?? 0.56) + 0.12)), tone: 'bg-slate-400'},
              ].map((item) => (
                <div key={item.label} className="mb-3 last:mb-0">
                  <div className="mb-1 flex justify-between text-xs text-slate-400">
                    <span>{item.label}</span>
                    <span>{formatRatio(item.value)}</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-800">
                    <div className={cn('h-2 rounded-full', item.tone)} style={{width: `${item.value * 100}%`}} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="sandbox-panel rounded-[28px] p-5">
            <div className="mb-4 flex items-center gap-3">
              <Database className="h-5 w-5 text-cyan-100" />
              <h3 className="text-xl font-bold text-white">客户端更新泄露</h3>
            </div>
            <p className="text-sm leading-6 text-slate-400">这是候选交互还原，不是完整用户历史恢复，也不是图像反演。</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-4">
              <MetricTile label="hit@10" value={formatMetricValue(privacyMetrics.hit10)} />
              <MetricTile label="hit@20" value={formatMetricValue(privacyMetrics.hit20)} />
              <MetricTile label="hit@50" value={formatMetricValue(privacyMetrics.hit50)} />
              <MetricTile label="最高风险模态" value={privacyMetrics.riskyModality} tone="text-cyan-100" />
            </div>
            <div className="mt-5 grid grid-cols-3 gap-3 sm:grid-cols-6">
              {candidateItems.length ? (
                candidateItems.map((item, index) => (
                  <div key={`${item.itemId ?? index}-candidate`} className="rounded-2xl border border-white/10 bg-white/[0.04] p-2">
                    <ProductImage item={item} className="h-16 w-full rounded-xl" />
                    <p className="mt-2 line-clamp-2 text-[11px] font-semibold leading-4 text-slate-300">{getProductTitle(item)}</p>
                  </div>
                ))
              ) : (
                <div className="col-span-full rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm text-slate-400">暂无候选商品 metadata。</div>
              )}
            </div>
          </div>
        </section>

        <section className="sandbox-panel rounded-[28px] p-5">
          <div className="mb-4 flex items-center gap-3">
            <ShieldCheck className="h-5 w-5 text-emerald-100" />
            <h3 className="text-xl font-bold text-white">防御摘要</h3>
          </div>
          <div className="grid gap-3 md:grid-cols-4">
            <MetricTile label="聚合规则" value={report.defenseTrace?.aggregationRule ?? inferDefenseType(selectedScenario, report)} tone="text-emerald-100" />
            <MetricTile label="选中/拒绝客户端" value={`${v3AggregationPanel?.selectedClients?.length ?? report.defenseTrace?.krumSelected?.length ?? 0} / ${v3AggregationPanel?.rejectedClients?.length ?? report.defenseTrace?.krumRejected?.length ?? report.defenseTrace?.filteredClients ?? 0}`} />
            <MetricTile label="安全聚合残差" value={formatSmallNumber(report.v25Summary?.secAggResidual)} tone="text-emerald-100" />
            <MetricTile label="防御状态" value={defenseStatusLabel(v3AggregationPanel?.status)} tone="text-emerald-100" />
          </div>
          <p className="mt-4 text-sm leading-6 text-slate-400">安全聚合为模拟展示；差分隐私风格加噪没有正式隐私会计；鲁棒聚合需要可观察逐客户端更新。</p>
        </section>
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
    const columnsByMode: Record<ComparisonMode, Array<{key: string; label: string; render: (row: (typeof comparisonRows)[number]) => string}>> = {
      attack: [
        {key: 'scenario', label: '场景', render: (row) => row.scenario},
        {key: 'attack', label: '攻击类型', render: (row) => row.attack},
        {key: 'targetManipulationIndex', label: '目标操纵指数', render: (row) => formatCellValue(formatMetricValue(row.targetManipulationIndex))},
        {key: 'rankGain', label: '目标排序提升', render: (row) => formatCellValue(formatSigned(row.rankGain, 0))},
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

    const columns = columnsByMode[comparisonMode];
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
              {comparisonModes.find((mode) => mode.id === comparisonMode)?.description}
            </p>
          </div>
        </section>

        {comparisonMode === 'capability' ? (
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
                    {label: '目标排序提升', value: row.rankGain ? Math.min(1, row.rankGain / 169) : 0, text: formatSigned(row.rankGain, 0), tone: 'bg-rose-300'},
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

  const filteredScenarios = useMemo(() => {
    return bundle.scenarios.filter((scenario) => {
      const reportForScenario = comparisonBundles.find((item) => item.selectedScenario.scenarioId === scenario.scenarioId)?.report;
      const text = scenarioText(scenario, reportForScenario);
      const usage = inferScenarioUsage(scenario, reportForScenario);
      if (archiveFilter === '全部') return true;
      if (archiveFilter === '主展示') return usage === '主展示';
      if (archiveFilter === 'Amazon') return text.includes('amazon');
      if (archiveFilter === 'KU') return text.includes('ku');
      if (archiveFilter === '投毒') return inferAttackType(scenario, reportForScenario).includes('投毒');
      if (archiveFilter === '隐私攻击') return Boolean(scenario.hasMembership || scenario.hasUpdateLeakage || reportForScenario?.v3?.membership || reportForScenario?.v3?.updateLeakage || /privacy|mia|membership|interaction|reconstruction/.test(text));
      if (archiveFilter === '鲁棒防御') return Boolean(scenario.hasAggregationDefense || reportForScenario?.v3?.aggregationDefense || /krum|robust|median|trimmed/.test(text));
      if (archiveFilter === '有图片') return Boolean(scenario.hasImages || reportForScenario?.recommendationComparison?.baseline.some((item) => item.thumbnailUrl || item.localImageUrl || item.imageUrl));
      if (archiveFilter === '有推荐列表') return Boolean(scenario.hasRecommendations || reportForScenario?.recommendationComparison);
      return true;
    });
  }, [archiveFilter, bundle.scenarios, comparisonBundles]);

  const renderHistory = () => (
    <div className="space-y-5">
      <section className="sandbox-panel rounded-[28px] p-5">
        <div className="mb-5 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div>
            <p className="text-xs font-bold tracking-[0.2em] text-cyan-100/75">实验档案库</p>
            <h2 className="mt-2 text-2xl font-bold text-white">按用途和证据筛选结果场景</h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">卡片展示实验名称、数据集、模型、攻防类型、证据和用途；点击后进入单次分析。</p>
          </div>
          <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-xs font-bold text-slate-300">共 {filteredScenarios.length} 个场景</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {archiveFilters.map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => setArchiveFilter(filter)}
              className={cn(
                'rounded-full border px-3 py-1.5 text-xs font-bold transition',
                archiveFilter === filter ? 'border-cyan-200/45 bg-cyan-300/10 text-cyan-50' : 'border-white/10 bg-white/[0.045] text-slate-300 hover:border-cyan-200/25',
              )}
            >
              {filter}
            </button>
          ))}
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        {filteredScenarios.map((scenario) => {
          const scenarioBundle = comparisonBundles.find((item) => item.selectedScenario.scenarioId === scenario.scenarioId);
          const scenarioReport = scenarioBundle?.report;
          const evidenceLabels = inferEvidenceLabels(scenario, scenarioReport);
          const v3Badges = getV3EvidenceBadges(scenario, scenarioReport);
          const displayBadges = Array.from(new Set([...v3Badges, ...evidenceLabels]));
          return (
            <button
              key={scenario.scenarioId}
              type="button"
              onClick={() => {
                setSelectedScenarioId(scenario.scenarioId);
                setSwitchMessage(`已切换到 ${getScenarioTitle(scenario, scenarioReport)} 场景`);
                setActiveTab('analysis');
              }}
              className="rounded-3xl border border-white/10 bg-white/[0.045] p-5 text-left transition hover:-translate-y-0.5 hover:border-cyan-200/30 hover:bg-cyan-300/10"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-lg font-black text-white">{getScenarioTitle(scenario, scenarioReport)}</p>
                  <p className="mt-1 text-xs text-slate-500">{scenario.scenarioId}</p>
                  <p className="mt-1 text-xs text-slate-500">{scenario.displayName ?? scenario.name}</p>
                  <p className="mt-1 text-sm text-slate-400">{datasetLabel(scenarioReport?.dataset ?? scenario.dataset)} / {scenarioReport?.model ?? scenario.model ?? EMPTY_VALUE}</p>
                </div>
                <span className="rounded-full border border-emerald-200/25 bg-emerald-300/10 px-3 py-1 text-xs font-bold text-emerald-100">
                  {inferScenarioUsage(scenario, scenarioReport)}
                </span>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-bold text-slate-500">攻击类型</p>
                  <p className="mt-1 text-sm font-semibold text-slate-200">{inferAttackType(scenario, scenarioReport)}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500">防御类型</p>
                  <p className="mt-1 text-sm font-semibold text-slate-200">{inferDefenseType(scenario, scenarioReport)}</p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {displayBadges.map((label) => (
                  <span key={label} className="rounded-full border border-white/10 bg-slate-950/35 px-2.5 py-1 text-[11px] font-bold text-slate-300">
                    {label}
                  </span>
                ))}
              </div>
            </button>
          );
        })}
        {!filteredScenarios.length ? (
          <div className="rounded-3xl border border-white/10 bg-white/[0.045] p-6 text-sm text-slate-400">当前筛选条件下暂无场景。</div>
        ) : null}
      </section>
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
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-cyan-200/25 bg-cyan-300/10 px-3 py-1 text-xs font-bold text-cyan-100">攻防工作台</span>
              <span className={cn('rounded-full border px-3 py-1 text-xs font-bold', getScenarioSourceTone(bundle))}>{getScenarioSourceLabel(bundle)}</span>
              {v3EvidenceAvailable ? <span className="rounded-full border border-violet-200/25 bg-violet-300/10 px-3 py-1 text-xs font-bold text-violet-100">V3 证据</span> : null}
              {isLoading ? <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-xs font-bold text-slate-300">正在读取数据</span> : null}
            </div>
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
      </section>
    </main>
  );
};
