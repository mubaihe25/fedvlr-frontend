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
  EXPERIMENT_PLAYS,
  ExperimentPlay,
  ExperimentPlayId,
  ROBUST_AGGREGATORS,
  SECURITY_AUDITS,
  SECURITY_DEFENSES,
  getSecurityModule,
  securityToneClass,
} from '../lib/securityTaxonomy';
import {EMPTY_VALUE, formatMetricValue, formatPercentValue, formatPlainValue, getRecommendationCounts} from '../lib/showcaseFormat';
import {cn} from '../lib/utils';
import {loadShowcaseBundle} from '../services/showcase';
import type {ExperimentConfigurationSource} from '../services/experiment';
import type {StartTrainResponse} from '../services/train';
import type {ConsoleSessionState} from '../types/common';
import type {DefenseType, LaunchExperimentOptions, LaunchExperimentResponse, TrainConfig} from '../types/train';
import type {ShowcaseBundle, ShowcaseRecommendationItem, ShowcaseReport, ShowcaseScenario} from '../types/showcase';

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
const formatCellValue = (value?: string | number | null) => {
  if (value === null || value === undefined || value === EMPTY_VALUE || value === '') {
    return '未导出';
  }
  return String(value);
};

const playDefaults: Record<
  ExperimentPlayId,
  {
    dataset: string;
    model: string;
    attackLabel: string;
    defenseLabel: string;
    targetLabel: string;
    maliciousRatio: number;
    aggregationMode: AggregationMode;
    robustAlgorithm: string;
    dpLayer: boolean;
    observations: string[];
    scenarioKeywords: string[];
    analysisOrder: Array<'target' | 'recommendation' | 'membership' | 'leakage' | 'defense'>;
  }
> = {
  target_poisoning_play: {
    dataset: 'AMAZON_BEAUTY_POC',
    model: 'FedAvg',
    attackLabel: '目标商品投毒',
    defenseLabel: '暂无防御 / 可选鲁棒聚合',
    targetLabel: 'Empty Amber Glass Spray Bottles',
    maliciousRatio: 0.2,
    aggregationMode: 'plain_updates',
    robustAlgorithm: 'none',
    dpLayer: false,
    observations: ['目标排序', 'Top50 曝光', '三列推荐', 'MIA', '交互还原'],
    scenarioKeywords: ['amazon_beauty_poc_v25_backend_smoke', 'v25', 'target', 'rank'],
    analysisOrder: ['target', 'recommendation', 'membership', 'leakage', 'defense'],
  },
  membership_privacy_play: {
    dataset: 'AMAZON_BEAUTY_POC',
    model: 'FedAvg',
    attackLabel: '成员推断攻击',
    defenseLabel: '可选更新扰动 / 安全聚合模拟',
    targetLabel: '匿名 user-item 记录',
    maliciousRatio: 0,
    aggregationMode: 'plain_updates',
    robustAlgorithm: 'none',
    dpLayer: false,
    observations: ['AUC', '准确率', '证据类型', '训练记录 vs 非训练记录'],
    scenarioKeywords: ['membership', 'mia', 'privacy', 'v25'],
    analysisOrder: ['membership', 'leakage', 'target', 'defense', 'recommendation'],
  },
  update_leakage_play: {
    dataset: 'AMAZON_BEAUTY_POC',
    model: 'FedAvg',
    attackLabel: '客户端更新泄露',
    defenseLabel: '可选安全聚合模拟 / 更新扰动',
    targetLabel: '候选交互集合',
    maliciousRatio: 0,
    aggregationMode: 'secure_aggregation',
    robustAlgorithm: 'none',
    dpLayer: false,
    observations: ['hit@10', 'hit@20', 'hit@50', '最高风险模态：item embedding'],
    scenarioKeywords: ['interaction', 'reconstruction', 'privacy', 'v25'],
    analysisOrder: ['leakage', 'membership', 'target', 'defense', 'recommendation'],
  },
  robust_defense_play: {
    dataset: 'KU',
    model: 'MMFedRAP',
    attackLabel: '异常客户端更新',
    defenseLabel: 'Krum / Median / TrimmedMean / Bulyan',
    targetLabel: '异常更新集合',
    maliciousRatio: 0.2,
    aggregationMode: 'plain_updates',
    robustAlgorithm: 'Krum',
    dpLayer: false,
    observations: ['防御恢复率', '异常更新过滤', 'Recall@50', 'NDCG@50'],
    scenarioKeywords: ['krum', 'robust', 'security_matrix', 'ku'],
    analysisOrder: ['defense', 'recommendation', 'target', 'membership', 'leakage'],
  },
};

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
  onStartTrain,
  onLaunchStatusChange,
}) => {
  const {bundle, isLoading, setSelectedScenarioId} = useShowcaseBundle();
  const [activeTab, setActiveTab] = useState<WorkbenchTabId>(initialTab);
  const [selectedPlayId, setSelectedPlayId] = useState<ExperimentPlayId>('target_poisoning_play');
  const [expertOpen, setExpertOpen] = useState(true);
  const [aggregationMode, setAggregationMode] = useState<AggregationMode>('plain_updates');
  const [robustAlgorithm, setRobustAlgorithm] = useState('Krum');
  const [dpLayerEnabled, setDpLayerEnabled] = useState(false);
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
  const selectedPlay = EXPERIMENT_PLAYS.find((play) => play.id === selectedPlayId) ?? EXPERIMENT_PLAYS[0];
  const selectedPlayDefaults = playDefaults[selectedPlay.id];
  const rankStats = getTargetRanks(report);
  const privacyMetrics = getPrivacyMetrics(report);
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
    setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    if (autoSelectedRef.current || !bundle.scenarios.length) return;
    const preferred = bundle.scenarios.find((scenario) => scenario.scenarioId.includes('amazon_beauty_poc_v25_backend_smoke')) ??
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

  const updateConfig = (patch: Partial<TrainConfig>) => {
    onDraftConfigChange({...config, ...patch});
  };

  const findScenarioForPlay = (playId: ExperimentPlayId) => {
    const defaults = playDefaults[playId];
    return bundle.scenarios.find((scenario) => {
      const text = scenarioText(scenario);
      return defaults.scenarioKeywords.some((keyword) => text.includes(keyword.toLowerCase()));
    });
  };

  const applyPlayToConfig = (play: ExperimentPlay) => {
    setSelectedPlayId(play.id);
    const defaults = playDefaults[play.id];
    const matchedScenario = findScenarioForPlay(play.id);
    if (matchedScenario && matchedScenario.scenarioId !== selectedScenario.scenarioId) {
      setSelectedScenarioId(matchedScenario.scenarioId);
      setSwitchMessage(`已切换到 ${getScenarioTitle(matchedScenario)} 场景`);
    }
    setAggregationMode(defaults.aggregationMode);
    setRobustAlgorithm(defaults.robustAlgorithm);
    setDpLayerEnabled(defaults.dpLayer);
    const attacks = play.attackModules.includes('target_poisoning') ? ['poisoning_attack'] : [];
    const privacyMetricsList = play.attackModules
      .filter((id) => id === 'membership_inference' || id === 'interaction_reconstruction')
      .map((id) => id);
    const enabledDefenses = [
      ...(defaults.dpLayer ? ['dp_noise'] : []),
      ...(defaults.aggregationMode === 'secure_aggregation' ? ['secure_aggregation_sim'] : []),
      ...(defaults.robustAlgorithm !== 'none' ? ['robust_aggregation'] : []),
    ];
    updateConfig({
      dataset: matchedScenario?.dataset ?? defaults.dataset,
      model: matchedScenario?.model ?? defaults.model,
      attackEnabled: attacks.length > 0,
      attackType: attacks.length > 0 ? 'poisoning_attack' : 'none',
      enabledAttacks: attacks,
      enabledPrivacyMetrics: privacyMetricsList,
      defenseEnabled: enabledDefenses.length > 0,
      defenseType:
        defaults.aggregationMode === 'secure_aggregation'
          ? 'secure-aggregation'
          : defaults.robustAlgorithm !== 'none'
            ? getDefenseTypeFromRobust(defaults.robustAlgorithm)
            : defaults.dpLayer
              ? 'differential-privacy'
              : 'none',
      enabledDefenses,
      poisoningRatio: defaults.maliciousRatio,
      maliciousClientConfig: {
        ...(config.maliciousClientConfig ?? {enabled: false, mode: 'ratio' as const, ratio: 0, clientIds: []}),
        enabled: defaults.maliciousRatio > 0,
        mode: 'ratio',
        ratio: defaults.maliciousRatio,
      },
      advanced: {...config.advanced, secureAggregation: defaults.aggregationMode === 'secure_aggregation'},
      attackParams: {
        ...(config.attackParams ?? {}),
        poisoning_attack: {
          ...((config.attackParams?.poisoning_attack as Record<string, unknown> | undefined) ?? {}),
          target_item_title: targetProduct?.title ?? defaults.targetLabel,
          target_item_id: targetProduct?.itemId ?? undefined,
          strength: defaults.maliciousRatio,
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
    try {
      setIsSubmitting(true);
      setSubmitMessage('');
      const response = await onStartTrain(config, {validateOnly: true, dryRun: false, strictValidation: false});
      if (response.launchResult) onLaunchStatusChange(response.launchResult);
      setSubmitMessage(response.status === 'failed' ? response.message : '配置校验已完成，可切换到运行监控查看实验摘要。');
      setActiveTab('monitoring');
    } catch (error) {
      setSubmitMessage(error instanceof Error ? error.message : '配置校验失败，请稍后重试。');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartExperiment = () => {
    setSubmitMessage('当前版本读取已完成结果进行演示；开始实验按钮后续连接训练任务调度。');
    setActiveTab('monitoring');
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

  const renderPlayCard = (play: ExperimentPlay) => {
    const selected = selectedPlayId === play.id;
    const hasEvidence = getPlayEvidenceState(play.id, bundle.scenarios);
    return (
      <button
        key={play.id}
        type="button"
        onClick={() => applyPlayToConfig(play)}
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
            {renderModulePills(play.optionalDefenses)}
          </div>
          <div>
            <p className="mb-2 text-xs font-bold text-slate-500">观测指标</p>
            {renderModulePills(play.auditModules)}
          </div>
        </div>
        <div className="mt-4 grid gap-3 text-xs text-slate-400 sm:grid-cols-2">
          <span>推荐数据集：<b className="text-slate-200">{play.recommendedDataset}</b></span>
          <span>推荐模型：<b className="text-slate-200">{play.recommendedModel}</b></span>
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

        <section className="grid gap-4 xl:grid-cols-2">{EXPERIMENT_PLAYS.map(renderPlayCard)}</section>

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
                  {renderExpertControl('目标商品', <div className="rounded-xl bg-slate-950/50 px-3 py-2 text-sm text-slate-200">{targetProduct?.title ?? targetProduct?.itemId ?? selectedPlayDefaults.targetLabel}</div>)}
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
              onClick={handleStartExperiment}
              className="inline-flex items-center gap-2 rounded-2xl border border-emerald-200/35 bg-emerald-300/12 px-4 py-2 text-sm font-bold text-emerald-50 hover:bg-emerald-300/18"
            >
              <Play className="h-4 w-4" />
              开始实验
            </button>
            {submitMessage ? <span className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-slate-300">{submitMessage}</span> : null}
          </div>
        </section>
      </div>
    );
  };

  const renderMonitoring = () => {
    const metrics = report.metricsSummary;
    const recallValues = buildSummaryCurve([metrics?.baseline?.recall50, metrics?.attack?.recall50, metrics?.defense?.recall50], 0.31, 0.35);
    const ndcgValues = buildSummaryCurve([metrics?.baseline?.ndcg50, metrics?.attack?.ndcg50, metrics?.defense?.ndcg50], 0.18, 0.2);
    const lossValues = interpolate(0.72, 0.31);
    const riskValues = buildSummaryCurve([0.18, rankStats.normalizedLift, privacyMetrics.miaAuc], 0.15, 0.56);
    const recoveryValues = buildSummaryCurve([0.22, metrics?.recoveryRate], 0.2, 0.72);
    const maliciousRatio = config.poisoningRatio || config.maliciousClientConfig?.ratio || 0;
    const roundNow = Math.max(1, Math.round((config.totalRounds || 10) * 0.7));
    const topologyDefenseActive = selectedPlay.id === 'robust_defense_play' ? true : selectedPlay.id === 'target_poisoning_play' ? false : defenseActive;
    const logLinesByPlay: Record<ExperimentPlayId, string[]> = {
      target_poisoning_play: [
        '[Round 1] 客户端完成本地训练',
        `[Round ${Math.max(2, Math.round(roundNow / 2))}] 检测到红色恶意更新流`,
        `[Attack] 目标商品正反馈注入已进入排序审计`,
        `[Audit] 目标商品排序 ${rankStats.before ?? 170} -> ${rankStats.after ?? 3}`,
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
    const logLines = logLinesByPlay[selectedPlay.id];
    const monitoringFocusByPlay: Record<ExperimentPlayId, Array<{label: string; value: string; tone?: string}>> = {
      target_poisoning_play: [
        {label: '目标排序', value: `${rankStats.before ?? 170} -> ${rankStats.after ?? 3}`, tone: 'text-rose-100'},
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
                {label: '当前轮次', value: `${roundNow} / ${config.totalRounds || 10}`},
                {label: '客户端数', value: `${config.clientCount || report.defenseTrace?.totalClients || 8}`},
                {label: '恶意客户端比例', value: formatRatio(maliciousRatio)},
                {label: '当前防御策略', value: defenseActive ? inferDefenseType(selectedScenario, report) : '无防御观察'},
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
              <p className="mt-3 text-[11px] text-slate-500">日志用于串联已完成结果摘要，不伪造完整训练全过程。</p>
            </div>
          </div>
        </section>

        <section className="sandbox-panel rounded-[28px] p-5">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-bold tracking-[0.2em] text-cyan-100/75">实验摘要曲线</p>
              <h3 className="mt-1 text-xl font-bold text-white">Loss / Recall@50 / NDCG@50 / 风险 / 恢复</h3>
            </div>
            <span className="rounded-full border border-cyan-200/25 bg-cyan-300/10 px-3 py-1 text-xs font-bold text-cyan-100">实验摘要曲线</span>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <Sparkline label="Loss" values={lossValues} tone="text-slate-200" valueText={lossValues.at(-1)?.toFixed(3) ?? EMPTY_VALUE} />
            <Sparkline label="Recall@50" values={recallValues} tone="text-cyan-100" valueText={formatMetricValue(metrics?.defense?.recall50 ?? metrics?.baseline?.recall50)} />
            <Sparkline label="NDCG@50" values={ndcgValues} tone="text-violet-100" valueText={formatMetricValue(metrics?.defense?.ndcg50 ?? metrics?.baseline?.ndcg50)} />
            <Sparkline label="攻击风险" values={riskValues} tone="text-rose-100" valueText={formatRatio(rankStats.normalizedLift ?? privacyMetrics.miaAuc)} />
            <Sparkline label="防御恢复" values={recoveryValues} tone="text-emerald-100" valueText={formatPercentValue(metrics?.recoveryRate)} />
          </div>
        </section>
      </div>
    );
  };

  const renderAnalysis = () => {
    const targetTitle = targetProduct?.title ?? selectedPlayDefaults.targetLabel;
    const candidateItems = [
      ...(report.recommendationComparison?.attack ?? []),
      ...(report.recommendationComparison?.baseline ?? []),
      ...(report.recommendationComparison?.defense ?? []),
    ].slice(0, 6);
    const analysisHeadlineByPlay: Record<ExperimentPlayId, string> = {
      target_poisoning_play: `目标商品在未屏蔽排序中从第 ${rankStats.before ?? 170} 位提升到第 ${rankStats.after ?? 3} 位，但最终 Top50 推荐列表未曝光。`,
      membership_privacy_play: `成员推断审计显示 AUC 为 ${formatMetricValue(privacyMetrics.miaAuc)}，攻击者尝试判断匿名 user-item 记录是否参与训练。`,
      update_leakage_play: `客户端更新泄露审计显示 hit@50 为 ${formatMetricValue(privacyMetrics.hit50)}，这是候选交互还原，不是完整用户历史恢复。`,
      robust_defense_play: `鲁棒聚合防御重点观察 Recall@50 / NDCG@50 恢复和异常更新过滤，当前恢复率为 ${formatPercentValue(report.metricsSummary?.recoveryRate)}。`,
    };
    const analysisFocusCards: Record<ExperimentPlayId, Array<{label: string; value: string; note?: string; tone?: string}>> = {
      target_poisoning_play: [
        {label: '目标排序', value: `${rankStats.before ?? 170} -> ${rankStats.after ?? 3}`, tone: 'text-rose-100'},
        {label: '排名提升', value: formatSigned(rankStats.rankLift, 0), tone: 'text-rose-100'},
        {label: '最终 Top50 曝光', value: getFinalExposureText(report), tone: 'text-emerald-100'},
        {label: '目标操纵风险分', value: rankStats.manipulationRisk !== null ? `${rankStats.manipulationRisk.toFixed(1)}` : EMPTY_VALUE, note: '展示指标，不作为标准学术指标。', tone: 'text-rose-100'},
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
                    {rankStats.before ?? 170}
                  </span>
                  <ChevronRight className="h-6 w-6 text-rose-100" />
                  <span className="rounded-2xl border border-rose-200/35 bg-rose-300/12 px-4 py-2 font-mono text-2xl font-black text-rose-100">
                    {rankStats.after ?? 3}
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
              <MetricTile label="原始未屏蔽排序" value={formatRank(rankStats.before)} />
              <MetricTile label="攻击后未屏蔽排序" value={formatRank(rankStats.after)} tone="text-rose-100" />
              <MetricTile label="归一化提升" value={formatRatio(rankStats.normalizedLift)} tone="text-rose-100" />
              <MetricTile label="倒数排名增益" value={formatSmallNumber(rankStats.reciprocalGain)} tone="text-amber-100" />
              <MetricTile label="目标操纵风险分" value={rankStats.manipulationRisk !== null ? `${rankStats.manipulationRisk.toFixed(1)}` : EMPTY_VALUE} note="展示指标，不作为标准学术指标。" tone="text-rose-100" />
              <MetricTile label="最终 Top50 曝光" value={getFinalExposureText(report)} tone="text-emerald-100" />
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
            <MetricTile label="过滤客户端" value={formatPlainValue(report.defenseTrace?.filteredClients ?? report.defenseTrace?.clippedClients)} />
            <MetricTile label="安全聚合残差" value={formatSmallNumber(report.v25Summary?.secAggResidual)} tone="text-emerald-100" />
            <MetricTile label="恢复率" value={formatPercentValue(report.metricsSummary?.recoveryRate)} tone="text-emerald-100" />
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
      return {
        id: itemScenario.scenarioId,
        scenario: getScenarioTitle(itemScenario, itemReport),
        model: itemReport.model ?? itemScenario.model ?? EMPTY_VALUE,
        dataset: datasetLabel(itemReport.dataset ?? itemScenario.dataset),
        attack: inferAttackType(itemScenario, itemReport),
        defense: inferDefenseType(itemScenario, itemReport),
        rankGain: itemRanks.rankLift,
        top50: getFinalExposureText(itemReport),
        recall: itemReport.metricsSummary?.defense?.recall50 ?? itemReport.metricsSummary?.baseline?.recall50 ?? null,
        ndcg: itemReport.metricsSummary?.defense?.ndcg50 ?? itemReport.metricsSummary?.baseline?.ndcg50 ?? null,
        miaAuc: itemPrivacy.miaAuc,
        hit10: itemPrivacy.hit10,
        hit20: itemPrivacy.hit20,
        hit50: itemPrivacy.hit50,
        evidence: itemPrivacy.miaEvidence,
        modality: itemPrivacy.riskyModality,
        recovery: itemReport.metricsSummary?.recoveryRate ?? null,
        residual: itemReport.v25Summary?.secAggResidual ?? null,
        usage: inferScenarioUsage(itemScenario, itemReport),
        evidenceLabels: inferEvidenceLabels(itemScenario, itemReport).join(' / '),
      };
    });
  }, [bundle, comparisonBundles]);

  const renderComparison = () => {
    const columnsByMode: Record<ComparisonMode, Array<{key: string; label: string; render: (row: (typeof comparisonRows)[number]) => string}>> = {
      attack: [
        {key: 'scenario', label: '场景', render: (row) => row.scenario},
        {key: 'attack', label: '攻击类型', render: (row) => row.attack},
        {key: 'rankGain', label: '目标排序提升', render: (row) => formatCellValue(formatSigned(row.rankGain, 0))},
        {key: 'top50', label: 'Top50 命中', render: (row) => formatCellValue(row.top50)},
        {key: 'change', label: '推荐列表变化率', render: (row) => formatCellValue(formatRatio(row.rankGain !== null && row.rankGain !== undefined ? Math.min(1, Math.max(0, row.rankGain / 169)) : null))},
        {key: 'miaAuc', label: 'MIA AUC', render: (row) => formatCellValue(formatMetricValue(row.miaAuc))},
        {key: 'hit50', label: '交互还原 hit@50', render: (row) => formatCellValue(formatMetricValue(row.hit50))},
      ],
      defense: [
        {key: 'scenario', label: '场景', render: (row) => row.scenario},
        {key: 'defense', label: '防御类型', render: (row) => row.defense},
        {key: 'recall', label: 'Recall@50', render: (row) => formatCellValue(formatMetricValue(row.recall))},
        {key: 'ndcg', label: 'NDCG@50', render: (row) => formatCellValue(formatMetricValue(row.ndcg))},
        {key: 'recovery', label: '防御恢复率', render: (row) => formatCellValue(formatPercentValue(row.recovery))},
        {key: 'filtered', label: '异常更新过滤', render: (row) => (row.defense.includes('鲁棒') ? '已展示' : EMPTY_VALUE)},
        {key: 'residual', label: '安全聚合残差', render: (row) => formatCellValue(formatSmallNumber(row.residual))},
      ],
      privacy: [
        {key: 'scenario', label: '场景', render: (row) => row.scenario},
        {key: 'miaAuc', label: 'MIA AUC', render: (row) => formatCellValue(formatMetricValue(row.miaAuc))},
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
        {key: 'evidence', label: '已有证据', render: (row) => row.evidenceLabels},
        {key: 'good', label: '适合展示的能力', render: (row) => (row.scenario.includes('KU') ? '多模态主展示' : row.scenario.includes('V2.5') ? '攻防强验证' : row.usage)},
        {key: 'limit', label: '不适合泛化的点', render: (row) => (row.scenario.includes('V2.5') ? '170 -> 3 不代表所有模型' : '按场景证据解释')},
      ],
    };

    const columns = columnsByMode[comparisonMode];
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
                {label: 'MIA AUC', value: row.miaAuc ?? 0, text: formatMetricValue(row.miaAuc), tone: 'bg-violet-300'},
                {label: '防御恢复率', value: row.recovery ?? 0, text: formatPercentValue(row.recovery), tone: 'bg-emerald-300'},
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
      if (archiveFilter === '隐私攻击') return /privacy|mia|membership|interaction|reconstruction/.test(text);
      if (archiveFilter === '鲁棒防御') return /krum|robust|median|trimmed/.test(text);
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
                {evidenceLabels.map((label) => (
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
    if (activeTab === 'orchestration') return renderOrchestration();
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
            {title: '防御', icon: ShieldCheck, value: selectedPlay.optionalDefenses.map((id) => getSecurityModule(id)?.shortTitle).filter(Boolean).join(' / ')},
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
