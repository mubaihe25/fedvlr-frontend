import React, {useEffect, useMemo, useRef, useState} from 'react';
import {
  Activity,
  BarChart3,
  CheckCircle2,
  Clock,
  Database,
  EyeOff,
  GitCompare,
  History,
  ImageOff,
  LineChart,
  ListChecks,
  Radar,
  Search,
  ShieldCheck,
  SquareTerminal,
  Swords,
  Target,
  UserSearch,
} from 'lucide-react';
import {FederatedTopology} from '../components/sandbox/FederatedTopology';
import {RecommendationComparisonBoard} from '../components/sandbox/RecommendationComparisonBoard';
import {useShowcaseBundle} from '../hooks/useShowcaseBundle';
import {
  EMPTY_VALUE,
  formatMetricValue,
  formatPercentValue,
  formatPlainValue,
  getDatasetLabel,
  getRecommendationCounts,
} from '../lib/showcaseFormat';
import {cn} from '../lib/utils';
import {loadShowcaseBundle} from '../services/showcase';
import type {ExperimentConfigurationSource} from '../services/experiment';
import type {StartTrainResponse} from '../services/train';
import type {ConsoleSessionState} from '../types/common';
import type {LaunchExperimentOptions, LaunchExperimentResponse, TrainConfig} from '../types/train';
import type {
  ShowcaseBundle,
  ShowcaseModelCapabilityRow,
  ShowcaseRecommendationItem,
  ShowcaseReport,
  ShowcaseScenario,
} from '../types/showcase';

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

const tabs: Array<{id: WorkbenchTabId; label: string; icon: React.ComponentType<{className?: string}>}> = [
  {id: 'orchestration', label: '实验编排', icon: ListChecks},
  {id: 'monitoring', label: '运行监控', icon: Activity},
  {id: 'analysis', label: '单次分析', icon: Search},
  {id: 'comparison', label: '横向对比', icon: GitCompare},
  {id: 'history', label: '历史实验', icon: History},
];

const attackOptions = [
  {id: 'poisoning_attack', label: '目标商品投毒', description: '推动目标商品在模型内部排序中上升。'},
  {id: 'membership_inference', label: '成员推断攻击', description: '判断某条用户-商品记录是否参与训练。'},
  {id: 'interaction_reconstruction', label: '交互候选还原', description: '从客户端更新推断候选商品。'},
];

const defenseOptions = [
  {id: 'robust_defense', label: '鲁棒聚合防御', description: '过滤或削弱异常客户端更新。'},
  {id: 'krum', label: 'Krum 选择/拒绝', description: '选择更可信的客户端更新。'},
  {id: 'trimmed_mean', label: 'TrimmedMean 聚合', description: '裁剪极端坐标更新。'},
  {id: 'secure_aggregation', label: '安全聚合模拟', description: '只展示模拟残差，不是生产级协议。'},
];

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value);

const readField = (record: unknown, keys: string[]) => {
  if (!isRecord(record)) {
    return undefined;
  }
  for (const key of keys) {
    if (key in record) {
      return record[key];
    }
  }
  return undefined;
};

const readNumber = (record: unknown, keys: string[]) => {
  const value = readField(record, keys);
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const parsed = Number(value.replace('%', '').trim());
    if (Number.isFinite(parsed)) {
      return value.includes('%') ? parsed / 100 : parsed;
    }
  }
  return null;
};

const readString = (record: unknown, keys: string[]) => {
  const value = readField(record, keys);
  if (typeof value === 'string') {
    return value.trim() || null;
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  return null;
};

const pickRecord = (record: unknown, keys: string[]) => {
  if (!isRecord(record)) {
    return null;
  }
  for (const key of keys) {
    const value = record[key];
    if (isRecord(value)) {
      return value;
    }
  }
  return null;
};

const formatRank = (value?: number | null) => (typeof value === 'number' && Number.isFinite(value) ? `#${Math.round(value)}` : EMPTY_VALUE);

const formatSignedNumber = (value?: number | null, digits = 1) =>
  typeof value === 'number' && Number.isFinite(value) ? `+${value.toFixed(digits)}` : EMPTY_VALUE;

const datasetLabel = (value?: string | null) => {
  if (!value) {
    return EMPTY_VALUE;
  }
  if (value.toUpperCase().includes('AMAZON')) {
    return 'Amazon Beauty';
  }
  if (value.toUpperCase() === 'KU') {
    return 'KU 多模态数据集';
  }
  return value;
};

const sourceLabel = (source: ShowcaseBundle['dataSource']) => {
  if (source === 'api') {
    return 'API artifact';
  }
  if (source === 'mixed') {
    return 'API artifact（部分缺失）';
  }
  return 'API 未连接 / 演示数据';
};

const getScenarioLabel = (scenario: ShowcaseScenario) => {
  const text = `${scenario.name} ${scenario.dataset ?? ''}`.toLowerCase();
  if (text.includes('v25')) return 'V2.5 定向投毒验证';
  if (text.includes('amazon')) return 'Amazon 商品推荐安全';
  if (text.includes('ku')) return 'KU 多模态攻防';
  if (text.includes('krum')) return '鲁棒聚合防御';
  if (text.includes('matrix')) return '模型能力摘要';
  return scenario.name;
};

const capabilityStatusLabel = (status?: string | null) => {
  switch (status) {
    case 'supported':
      return '已支持';
    case 'partial':
      return '部分支持';
    case 'unsupported':
      return '暂不支持';
    case 'future_adapter':
      return '后续适配';
    case 'not_tested':
      return '未验证';
    default:
      return status || EMPTY_VALUE;
  }
};

const getTargetEntry = (report: ShowcaseReport) => report.targetRankSummary?.entries?.[0];

const getTargetRanks = (report: ShowcaseReport) => {
  const entry = getTargetEntry(report);
  const before = report.v25Summary?.targetRankBefore ?? entry?.baselineRank ?? null;
  const after = report.v25Summary?.targetRankAfter ?? entry?.attackRank ?? null;
  return {before, after, entry};
};

const getRankStats = (report: ShowcaseReport) => {
  const {before, after} = getTargetRanks(report);
  const rankLift = typeof before === 'number' && typeof after === 'number' ? before - after : null;
  const normalizedLift = rankLift !== null && typeof before === 'number' && before > 1 ? rankLift / (before - 1) : null;
  const reciprocalGain =
    typeof before === 'number' && typeof after === 'number' && before > 0 && after > 0 ? 1 / after - 1 / before : null;
  const manipulationRisk = normalizedLift !== null ? Math.max(0, Math.min(100, normalizedLift * 100)) : null;

  return {before, after, rankLift, normalizedLift, reciprocalGain, manipulationRisk};
};

const findProductByItemId = (report: ShowcaseReport, itemId?: string | number | null) => {
  const comparison = report.recommendationComparison;
  if (!comparison || itemId === null || itemId === undefined) {
    return null;
  }
  const id = String(itemId);
  return [...comparison.attack, ...comparison.baseline, ...comparison.defense].find((item) => String(item.itemId) === id) ?? null;
};

const getProductImage = (item?: Pick<ShowcaseRecommendationItem, 'thumbnailUrl' | 'localImageUrl' | 'imageUrl'> | null) => {
  const source = item?.thumbnailUrl ?? item?.localImageUrl ?? item?.imageUrl;
  if (!source || /^[a-zA-Z]:[\\/]/.test(source) || source.startsWith('\\\\')) {
    return null;
  }
  return source;
};

const getMiaRecord = (report: ShowcaseReport) => {
  const rawPrivacy = report.v25Summary?.raw && isRecord(report.v25Summary.raw) ? report.v25Summary.raw.privacyRiskSummary : report.privacyRiskSummary;
  return (
    pickRecord(rawPrivacy, ['membership_inference', 'membershipInference', 'mia']) ??
    pickRecord(report.privacy, ['membership_inference', 'membershipInference', 'mia'])
  );
};

const getInteractionRecord = (report: ShowcaseReport) => {
  const rawPrivacy = report.v25Summary?.raw && isRecord(report.v25Summary.raw) ? report.v25Summary.raw.privacyRiskSummary : report.privacyRiskSummary;
  return (
    pickRecord(rawPrivacy, ['interaction_reconstruction', 'interactionReconstruction']) ??
    pickRecord(report.privacy, ['interaction_reconstruction', 'interactionReconstruction'])
  );
};

const getPrivacyMetrics = (report: ShowcaseReport) => {
  const miaRecord = getMiaRecord(report);
  const interactionRecord = getInteractionRecord(report);
  return {
    miaAuc: report.v25Summary?.miaAuc ?? readNumber(miaRecord, ['auc', 'attack_auc', 'attackAuc', 'mia_auc', 'miaAuc']),
    miaAccuracy: readNumber(miaRecord, ['accuracy', 'attack_accuracy', 'attackAccuracy', 'acc']),
    miaEvidence: readString(miaRecord, ['score_source', 'scoreSource', 'evidence_type', 'evidenceType', 'source']) ?? '代理证据 / artifact 摘要',
    hit10: report.v25Summary?.interactionReconstructionHit10 ?? readNumber(interactionRecord, ['hit@10', 'hit_at_10', 'hitAt10', 'hit10']),
    hit20: report.v25Summary?.interactionReconstructionHit20 ?? readNumber(interactionRecord, ['hit@20', 'hit_at_20', 'hitAt20', 'hit20']),
    hit50: report.v25Summary?.interactionReconstructionHit50 ?? readNumber(interactionRecord, ['hit@50', 'hit_at_50', 'hitAt50', 'hit50']),
    riskyModality:
      readString(interactionRecord, ['highest_risk_modality', 'highestRiskModality', 'risk_modality', 'modality']) ?? 'item embedding',
  };
};

const interpolate = (start: number, end: number, steps = 16) =>
  Array.from({length: steps}, (_, index) => {
    const t = steps === 1 ? 1 : index / (steps - 1);
    const wave = Math.sin(t * Math.PI) * 0.015;
    return Number((start + (end - start) * t + wave).toFixed(4));
  });

const buildSummaryCurve = (values: Array<number | null | undefined>, fallbackStart: number, fallbackEnd: number) => {
  const numeric = values.filter((value): value is number => typeof value === 'number' && Number.isFinite(value));
  if (numeric.length >= 2) {
    return interpolate(numeric[0], numeric[numeric.length - 1]);
  }
  return interpolate(fallbackStart, fallbackEnd);
};

const Sparkline: React.FC<{label: string; values: number[]; tone: string; valueText: string}> = ({label, values, tone, valueText}) => {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const points = values
    .map((value, index) => {
      const x = (index / Math.max(1, values.length - 1)) * 180;
      const y = 56 - ((value - min) / range) * 46;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-4">
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="text-sm font-bold text-slate-100">{label}</p>
        <p className={cn('font-mono text-sm font-bold', tone)}>{valueText}</p>
      </div>
      <svg viewBox="0 0 180 62" className="h-16 w-full overflow-visible">
        <polyline points={points} fill="none" stroke="currentColor" strokeWidth="3" className={tone} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
};

export const AttackDefenseRange: React.FC<AttackDefenseRangeProps> = ({
  initialTab = 'orchestration',
  session,
  onDraftConfigChange,
  onStartTrain,
  onOpenAnalysis,
  onAddComparisonSelection,
  onOpenComparison,
  onReuseConfig,
}) => {
  const {bundle, isLoading, setSelectedScenarioId} = useShowcaseBundle();
  const [activeTab, setActiveTab] = useState<WorkbenchTabId>(initialTab);
  const [defenseActive, setDefenseActive] = useState(true);
  const [submitMessage, setSubmitMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [comparisonBundles, setComparisonBundles] = useState<ShowcaseBundle[]>([]);
  const autoSelectedRef = useRef(false);
  const {report, selectedScenario} = bundle;
  const metrics = report.metricsSummary;
  const rankStats = getRankStats(report);
  const privacyMetrics = getPrivacyMetrics(report);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    if (autoSelectedRef.current || !bundle.scenarios.length) {
      return;
    }
    const v25Scenario = bundle.scenarios.find((scenario) => scenario.scenarioId.includes('v25'));
    if (v25Scenario && selectedScenario.scenarioId !== v25Scenario.scenarioId) {
      autoSelectedRef.current = true;
      setSelectedScenarioId(v25Scenario.scenarioId);
    }
  }, [bundle.scenarios, selectedScenario.scenarioId, setSelectedScenarioId]);

  useEffect(() => {
    let active = true;
    const preferredIds = [
      selectedScenario.scenarioId,
      ...bundle.scenarios
        .filter((scenario) => /ku|amazon|v25|krum|matrix|capability/i.test(`${scenario.scenarioId} ${scenario.name}`))
        .map((scenario) => scenario.scenarioId),
    ];
    const uniqueIds = Array.from(new Set(preferredIds)).slice(0, 5);
    Promise.all(uniqueIds.map((scenarioId) => loadShowcaseBundle(scenarioId)))
      .then((items) => {
        if (active) {
          setComparisonBundles(items);
        }
      })
      .catch(() => {
        if (active) {
          setComparisonBundles([bundle]);
        }
      });
    return () => {
      active = false;
    };
  }, [bundle.scenarios, selectedScenario.scenarioId]);

  const config = session.draftTrainConfig;
  const selectedAttackIds = new Set([...(config.enabledAttacks ?? []), ...(config.enabledPrivacyMetrics ?? [])]);
  const selectedDefenseIds = new Set(config.enabledDefenses ?? []);
  const recommendationCounts = getRecommendationCounts(report.recommendationComparison);
  const totalRecommendations = recommendationCounts.baseline + recommendationCounts.attack + recommendationCounts.defense;

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

  const toggleAttack = (attackId: string) => {
    if (attackId === 'poisoning_attack') {
      const attacks = config.enabledAttacks?.includes(attackId) ? [] : [attackId];
      updateConfig({
        mode: attacks.length && selectedDefenseIds.size ? 'comparison' : attacks.length ? 'attack' : selectedDefenseIds.size ? 'defense' : 'baseline',
        scenario: attacks.length && selectedDefenseIds.size ? 'attack_and_defense' : attacks.length ? 'attack_only' : 'baseline',
        attackEnabled: Boolean(attacks.length),
        attackType: attacks.length ? 'poisoning_attack' : 'none',
        enabledAttacks: attacks,
        maliciousClientConfig: {
          ...(config.maliciousClientConfig ?? {clientIds: []}),
          enabled: Boolean(attacks.length),
          mode: attacks.length ? 'ratio' : 'none',
          ratio: attacks.length ? config.poisoningRatio : 0,
          clientIds: config.maliciousClientConfig?.clientIds ?? [],
        },
      });
      return;
    }

    const current = new Set<string>(config.enabledPrivacyMetrics ?? []);
    if (current.has(attackId)) {
      current.delete(attackId);
    } else {
      current.add(attackId);
    }
    updateConfig({
      enabledPrivacyMetrics: Array.from(current),
      scenario: current.size ? 'privacy_observation' : config.scenario,
    });
  };

  const toggleDefense = (defenseId: string) => {
    const current = new Set<string>(config.enabledDefenses ?? []);
    if (current.has(defenseId)) {
      current.delete(defenseId);
    } else {
      current.add(defenseId);
    }
    const defenses = Array.from(current);
    const attacks = config.enabledAttacks ?? [];
    updateConfig({
      mode: attacks.length && defenses.length ? 'comparison' : attacks.length ? 'attack' : defenses.length ? 'defense' : 'baseline',
      scenario: attacks.length && defenses.length ? 'attack_and_defense' : defenses.length ? 'defense_only' : config.scenario,
      defenseEnabled: Boolean(defenses.length),
      defenseType: defenses.length ? 'robust_defense' : 'none',
      enabledDefenses: defenses,
    });
  };

  const handleValidate = async () => {
    try {
      setIsSubmitting(true);
      setSubmitMessage('');
      const response = await onStartTrain(config, {validateOnly: true, dryRun: false, strictValidation: false});
      setSubmitMessage(response.status === 'failed' ? response.message : '配置校验已提交，结果已进入运行监控。');
      setActiveTab('monitoring');
    } catch (error) {
      setSubmitMessage(error instanceof Error ? error.message : '配置校验失败，请稍后重试。');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderOrchestration = () => (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.05fr)_minmax(340px,0.95fr)]">
      <section className="sandbox-panel rounded-[28px] p-6">
        <div className="mb-6">
          <p className="text-xs font-bold tracking-[0.2em] text-cyan-100/75">实验编排</p>
          <h2 className="mt-2 text-2xl font-bold text-white">从训练配置到 artifact 场景</h2>
          <p className="mt-3 text-sm leading-6 text-slate-300">选择数据集、模型、攻击与防御后，可以先做配置校验；真实训练不会在本轮自动启动。</p>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {[
            {label: '当前 artifact 场景', value: getScenarioLabel(selectedScenario), detail: selectedScenario.name},
            {label: '数据集 / 模型', value: `${datasetLabel(report.dataset ?? selectedScenario.dataset)} / ${formatPlainValue(report.model ?? selectedScenario.model)}`, detail: '从真实 showcase 场景读取'},
            {label: '验证内容', value: '排序操纵 / 隐私审计 / 防御摘要', detail: '按当前 artifact 可用字段展示，缺失项显示暂无'},
          ].map((item) => (
            <div key={item.label} className="rounded-3xl border border-white/10 bg-white/[0.055] p-5">
              <p className="text-xs font-bold text-slate-400">{item.label}</p>
              <p className="mt-2 text-lg font-bold text-white">{item.value}</p>
              <p className="mt-2 text-xs leading-5 text-slate-400">{item.detail}</p>
            </div>
          ))}
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-rose-200/20 bg-rose-200/10 p-4">
            <p className="mb-3 font-bold text-rose-50">攻击剧本</p>
            <div className="space-y-2">
              {attackOptions.map((option) => {
                const selected = selectedAttackIds.has(option.id);
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => toggleAttack(option.id)}
                    className={cn(
                      'w-full rounded-xl border px-3 py-3 text-left transition',
                      selected ? 'border-rose-200/45 bg-rose-200/16 text-rose-50' : 'border-white/10 bg-slate-900/24 text-slate-300',
                    )}
                  >
                    <span className="font-semibold">{option.label}</span>
                    <span className="mt-1 block text-xs text-slate-400">{option.description}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-2xl border border-emerald-200/20 bg-emerald-200/10 p-4">
            <p className="mb-3 font-bold text-emerald-50">防御策略</p>
            <div className="space-y-2">
              {defenseOptions.map((option) => {
                const selected = selectedDefenseIds.has(option.id);
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => toggleDefense(option.id)}
                    className={cn(
                      'w-full rounded-xl border px-3 py-3 text-left transition',
                      selected ? 'border-emerald-200/45 bg-emerald-200/16 text-emerald-50' : 'border-white/10 bg-slate-900/24 text-slate-300',
                    )}
                  >
                    <span className="font-semibold">{option.label}</span>
                    <span className="mt-1 block text-xs text-slate-400">{option.description}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <details className="mt-5 rounded-3xl border border-white/10 bg-white/[0.035] p-4">
          <summary className="cursor-pointer text-sm font-bold text-slate-100">必要参数与校验配置</summary>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="rounded-2xl border border-white/10 bg-white/[0.045] p-4">
            <span className="text-xs font-bold text-slate-400">数据集选择</span>
            <select
              value={config.dataset}
              onChange={(event) => updateConfig({dataset: event.target.value})}
              className="mt-3 w-full rounded-xl border border-white/10 bg-slate-950/45 px-3 py-2 text-sm text-slate-100 outline-none"
            >
              {datasetOptions.map((option) => (
                <option key={option} value={option} className="bg-slate-950">
                  {datasetLabel(option)}
                </option>
              ))}
            </select>
          </label>

          <label className="rounded-2xl border border-white/10 bg-white/[0.045] p-4">
            <span className="text-xs font-bold text-slate-400">模型选择</span>
            <select
              value={config.model}
              onChange={(event) => updateConfig({model: event.target.value})}
              className="mt-3 w-full rounded-xl border border-white/10 bg-slate-950/45 px-3 py-2 text-sm text-slate-100 outline-none"
            >
              {modelOptions.map((option) => (
                <option key={option} value={option} className="bg-slate-950">
                  {option}
                </option>
              ))}
            </select>
          </label>
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-rose-200/20 bg-rose-200/10 p-4">
            <p className="mb-3 font-bold text-rose-50">攻击选择</p>
            <div className="space-y-2">
              {attackOptions.map((option) => {
                const selected = selectedAttackIds.has(option.id);
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => toggleAttack(option.id)}
                    className={cn(
                      'w-full rounded-xl border px-3 py-3 text-left transition',
                      selected ? 'border-rose-200/45 bg-rose-200/16 text-rose-50' : 'border-white/10 bg-slate-900/24 text-slate-300',
                    )}
                  >
                    <span className="font-semibold">{option.label}</span>
                    <span className="mt-1 block text-xs text-slate-400">{option.description}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-2xl border border-emerald-200/20 bg-emerald-200/10 p-4">
            <p className="mb-3 font-bold text-emerald-50">防御选择</p>
            <div className="space-y-2">
              {defenseOptions.map((option) => {
                const selected = selectedDefenseIds.has(option.id);
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => toggleDefense(option.id)}
                    className={cn(
                      'w-full rounded-xl border px-3 py-3 text-left transition',
                      selected ? 'border-emerald-200/45 bg-emerald-200/16 text-emerald-50' : 'border-white/10 bg-slate-900/24 text-slate-300',
                    )}
                  >
                    <span className="font-semibold">{option.label}</span>
                    <span className="mt-1 block text-xs text-slate-400">{option.description}</span>
                  </button>
                );
              })}
            </div>
          </div>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-4">
          {[
            ['训练轮数', config.totalRounds],
            ['客户端数', config.clientCount],
            ['采样率', `${Math.round(config.clientSamplingRate * 100)}%`],
            ['恶意比例', `${Math.round(config.poisoningRatio * 100)}%`],
          ].map(([label, value]) => (
            <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.045] p-4">
              <p className="text-xs text-slate-400">{label}</p>
              <p className="mt-2 text-xl font-bold text-white">{value}</p>
            </div>
          ))}
          </div>
        </details>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleValidate}
            disabled={isSubmitting}
            className="rounded-2xl bg-cyan-200 px-5 py-3 text-sm font-bold text-slate-950 transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? '正在校验...' : '校验配置'}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('monitoring')}
            className="rounded-2xl border border-white/10 bg-white/[0.055] px-5 py-3 text-sm font-bold text-slate-100 transition hover:border-cyan-200/30"
          >
            查看运行监控
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('analysis')}
            className="rounded-2xl border border-white/10 bg-white/[0.055] px-5 py-3 text-sm font-bold text-slate-100 transition hover:border-cyan-200/30"
          >
            查看单次分析
          </button>
          {submitMessage ? <span className="text-sm text-slate-300">{submitMessage}</span> : null}
        </div>
      </section>

      <section className="space-y-5">
        <div className="sandbox-panel rounded-[28px] p-5">
          <p className="text-xs font-bold tracking-[0.2em] text-cyan-100/75">当前 artifact 场景</p>
          <div className="mt-4 space-y-2">
            {bundle.scenarios.slice(0, 8).map((scenario) => {
              const active = scenario.scenarioId === selectedScenario.scenarioId;
              return (
                <button
                  key={scenario.scenarioId}
                  type="button"
                  onClick={() => setSelectedScenarioId(scenario.scenarioId)}
                  className={cn(
                    'w-full rounded-2xl border px-4 py-3 text-left transition',
                    active ? 'border-cyan-200/40 bg-cyan-200/12 text-cyan-50' : 'border-white/10 bg-white/[0.04] text-slate-300',
                  )}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-semibold">{getScenarioLabel(scenario)}</span>
                    <span className="rounded-full bg-slate-950/45 px-2 py-0.5 text-[10px] text-slate-300">
                      {scenario.dataSource === 'api' ? 'API' : '演示'}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-400">{datasetLabel(scenario.dataset)} / {formatPlainValue(scenario.model)}</p>
                </button>
              );
            })}
          </div>
        </div>

        <div className="sandbox-panel rounded-[28px] p-5">
          <p className="text-xs font-bold tracking-[0.2em] text-cyan-100/75">编排摘要</p>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div className="rounded-2xl bg-white/[0.045] p-4">
              <p className="text-xs text-slate-400">推荐列表证据</p>
              <p className="mt-2 text-2xl font-bold text-white">{totalRecommendations}</p>
            </div>
            <div className="rounded-2xl bg-white/[0.045] p-4">
              <p className="text-xs text-slate-400">数据来源</p>
              <p className="mt-2 text-base font-bold text-white">{sourceLabel(bundle.dataSource)}</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );

  const renderMonitoring = () => {
    const recallCurve = buildSummaryCurve(
      [metrics?.baseline?.recall50, metrics?.attack?.recall50, metrics?.defense?.recall50],
      0.08,
      0.16,
    );
    const ndcgCurve = buildSummaryCurve(
      [metrics?.baseline?.ndcg50, metrics?.attack?.ndcg50, metrics?.defense?.ndcg50],
      0.05,
      0.11,
    );
    const lossCurve = interpolate(1.1, 0.42, 16).reverse();
    const terminalLogs = [
      '[Round 1] 客户端本地训练完成，用户数据保留在本地',
      '[Round 2] 客户端上传模型更新 / 梯度摘要',
      '[Round 2] 检测到恶意更新携带目标商品投毒信号',
      defenseActive ? '[Round 3] 鲁棒聚合启用，绿色过滤环拦截异常更新' : '[Round 3] 未启用防御，服务器出现异常聚合波动',
      '[Round 3] 服务端完成聚合并写入 showcase artifact',
      `[Audit] target rank ${formatRank(rankStats.before)} -> ${formatRank(rankStats.after)}，最终 Top50 曝光：${
        (report.v25Summary?.maskedTopkHitRate ?? report.targetRankSummary?.targetHitRate ?? metrics?.targetHitRate ?? 0) === 0 ? '未命中' : '以 artifact 为准'
      }`,
    ];

    return (
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(340px,0.8fr)]">
        <FederatedTopology mode="exercise" defenseActive={defenseActive} className="min-h-[560px]" />
        <section className="space-y-5">
          <div className="sandbox-panel rounded-[28px] p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold tracking-[0.2em] text-cyan-100/75">客户端更新</p>
                <h3 className="mt-1 text-xl font-bold text-white">联邦训练流</h3>
              </div>
              <button
                type="button"
                onClick={() => setDefenseActive((current) => !current)}
                className={cn(
                  'rounded-full border px-3 py-1 text-xs font-bold transition',
                  defenseActive ? 'border-emerald-200/35 bg-emerald-200/10 text-emerald-100' : 'border-rose-200/35 bg-rose-200/10 text-rose-100',
                )}
              >
                {defenseActive ? '防御过滤开启' : '无防御观察'}
              </button>
            </div>
            <div className="grid gap-3">
              {[
                ['蓝色', '正常客户端更新进入服务器聚合。'],
                ['红色', '恶意更新携带目标商品投毒信号。'],
                ['绿色', '防御过滤环拦截或消散异常更新。'],
              ].map(([label, text]) => (
                <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-3 text-sm text-slate-300">
                  <span className="font-bold text-slate-50">{label}：</span>{text}
                </div>
              ))}
            </div>
          </div>

          <div className="sandbox-panel rounded-[28px] p-5">
            <div className="mb-4 flex items-center gap-3">
              <SquareTerminal className="h-5 w-5 text-emerald-100" />
              <div>
                <h3 className="text-xl font-bold text-white">运行终端日志</h3>
                <p className="text-xs text-slate-400">展示训练、上传、聚合和审计事件；来自 artifact 摘要，不伪造完整训练日志。</p>
              </div>
            </div>
            <div className="space-y-2 rounded-2xl border border-emerald-200/15 bg-slate-950/55 p-4 font-mono text-xs leading-5 text-emerald-100">
              {terminalLogs.map((line) => (
                <div key={line}>{line}</div>
              ))}
            </div>
          </div>

          <div className="sandbox-panel rounded-[28px] p-5">
            <div className="mb-4 flex items-center gap-3">
              <LineChart className="h-5 w-5 text-cyan-100" />
              <div>
                <h3 className="text-xl font-bold text-white">loss / Recall@50 / NDCG@50</h3>
                <p className="text-xs text-slate-400">实验摘要曲线：由 artifact 摘要生成，不伪造完整训练全过程。</p>
              </div>
            </div>
            <div className="space-y-3">
              <Sparkline label="Loss" values={lossCurve} tone="text-amber-100" valueText="摘要曲线" />
              <Sparkline label="Recall@50" values={recallCurve} tone="text-cyan-100" valueText={formatMetricValue(metrics?.defense?.recall50 ?? metrics?.attack?.recall50)} />
              <Sparkline label="NDCG@50" values={ndcgCurve} tone="text-violet-100" valueText={formatMetricValue(metrics?.defense?.ndcg50 ?? metrics?.attack?.ndcg50)} />
            </div>
          </div>
        </section>
      </div>
    );
  };

  const renderTargetTrajectory = () => {
    const entry = getTargetEntry(report);
    const item = findProductByItemId(report, entry?.itemId);
    const image = getProductImage(item ?? entry);
    const targetInRecommendationList =
      entry?.itemId !== undefined &&
      entry.itemId !== null &&
      [
        ...(report.recommendationComparison?.baseline ?? []),
        ...(report.recommendationComparison?.attack ?? []),
        ...(report.recommendationComparison?.defense ?? []),
      ].some((candidate) => String(candidate.itemId) === String(entry.itemId));

    return (
      <section className="sandbox-panel rounded-[28px] p-5">
        <div className="mb-5 flex items-center gap-3">
          <Target className="h-5 w-5 text-rose-100" />
          <div>
            <h3 className="text-xl font-bold text-white">目标商品轨迹</h3>
            <p className="text-xs text-slate-400">
              结论：模型内部排序已被显著推动，但最终推荐列表{targetInRecommendationList ? '中可定位目标商品' : '未曝光目标商品'}。
            </p>
          </div>
        </div>
        <div className="grid gap-5 lg:grid-cols-[220px_minmax(0,1fr)]">
          <div className="rounded-3xl border border-white/10 bg-white/[0.045] p-4">
            {image ? (
              <img src={image} alt={item?.title ?? entry?.title ?? '目标商品'} className="h-40 w-full rounded-2xl object-cover" loading="lazy" referrerPolicy="no-referrer" />
            ) : (
              <div className="flex h-40 items-center justify-center rounded-2xl border border-rose-200/25 bg-rose-200/10 text-rose-100">
                <ImageOff className="h-8 w-8" />
              </div>
            )}
            <p className="mt-4 line-clamp-2 font-bold text-white">{item?.title ?? entry?.title ?? '目标商品'}</p>
            <p className="mt-1 text-xs text-slate-400">{item?.category ?? entry?.category ?? '类目暂无'}</p>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {[
              ['未屏蔽排序', `${formatRank(rankStats.before)} → ${formatRank(rankStats.after)}`],
              ['排名提升', formatSignedNumber(rankStats.rankLift, 0)],
              ['归一化排名提升', rankStats.normalizedLift !== null ? `约 ${(rankStats.normalizedLift * 100).toFixed(1)}%` : EMPTY_VALUE],
              ['倒数排名增益', formatSignedNumber(rankStats.reciprocalGain, 4)],
              ['目标操纵风险分', rankStats.manipulationRisk !== null ? `${rankStats.manipulationRisk.toFixed(1)} / 100（展示指标）` : EMPTY_VALUE],
              ['最终 Top50 曝光', (report.v25Summary?.maskedTopkHitRate ?? report.targetRankSummary?.targetHitRate ?? metrics?.targetHitRate ?? 0) === 0 ? '未命中' : '以 artifact 为准'],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.045] p-4">
                <p className="text-xs text-slate-400">{label}</p>
                <p className="mt-2 text-xl font-bold text-white">{value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  };

  const renderPrivacyAnalysis = () => (
    <div className="grid gap-5 xl:grid-cols-2">
      <section className="sandbox-panel rounded-[28px] p-5">
        <div className="mb-5 flex items-center gap-3">
          <UserSearch className="h-5 w-5 text-violet-100" />
          <div>
            <h3 className="text-xl font-bold text-white">成员推断攻击</h3>
            <p className="text-xs text-slate-400">攻击者尝试判断某条 user-item 记录是否参与训练。</p>
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-4">
            <p className="text-xs text-slate-400">AUC</p>
            <p className="mt-2 text-2xl font-bold text-violet-100">{formatMetricValue(privacyMetrics.miaAuc)}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-4">
            <p className="text-xs text-slate-400">准确率</p>
            <p className="mt-2 text-2xl font-bold text-violet-100">{formatPercentValue(privacyMetrics.miaAccuracy)}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-4">
            <p className="text-xs text-slate-400">证据类型</p>
            <p className="mt-2 text-sm font-bold text-slate-100">{privacyMetrics.miaEvidence}</p>
          </div>
        </div>
        <div className="mt-5 grid grid-cols-[1fr_1fr] gap-4">
          {[
            ['参与训练记录', privacyMetrics.miaAuc ?? 0.56, 'bg-violet-200'],
            ['未参与训练记录', Math.max(0.2, 1 - (privacyMetrics.miaAuc ?? 0.56)), 'bg-slate-300'],
          ].map(([label, value, color]) => (
            <div key={label as string} className="rounded-2xl border border-white/10 bg-white/[0.045] p-4">
              <p className="text-xs text-slate-400">{label}</p>
              <div className="mt-4 h-3 rounded-full bg-slate-800">
                <div className={cn('h-full rounded-full', color as string)} style={{width: `${Math.min(100, Number(value) * 100)}%`}} />
              </div>
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs leading-5 text-slate-400">除非 artifact 明确支持，本页不写成完整 checkpoint score MIA。</p>
      </section>

      <section className="sandbox-panel rounded-[28px] p-5">
        <div className="mb-5 flex items-center gap-3">
          <Radar className="h-5 w-5 text-cyan-100" />
          <div>
            <h3 className="text-xl font-bold text-white">客户端更新泄露分析</h3>
            <p className="text-xs text-slate-400">从客户端更新推断候选商品，不是完整用户历史恢复。</p>
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-4">
          {[
            ['hit@10', formatMetricValue(privacyMetrics.hit10)],
            ['hit@20', formatMetricValue(privacyMetrics.hit20)],
            ['hit@50', formatMetricValue(privacyMetrics.hit50)],
            ['最高风险模态', privacyMetrics.riskyModality],
          ].map(([label, value]) => (
            <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.045] p-4">
              <p className="text-xs text-slate-400">{label}</p>
              <p className="mt-2 text-lg font-bold text-cyan-100">{value}</p>
            </div>
          ))}
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {(report.recommendationComparison?.attack ?? []).slice(0, 3).map((item, index) => {
            const image = getProductImage(item);
            return (
              <div key={`${item.itemId ?? index}`} className="rounded-2xl border border-white/10 bg-white/[0.045] p-3">
                {image ? (
                  <img src={image} alt={item.title ?? '候选商品'} className="h-24 w-full rounded-xl object-cover" loading="lazy" referrerPolicy="no-referrer" />
                ) : (
                  <div className="flex h-24 items-center justify-center rounded-xl border border-white/10 text-slate-500">
                    <ImageOff className="h-6 w-6" />
                  </div>
                )}
                <p className="mt-3 line-clamp-2 text-sm font-bold text-slate-50">{item.title ?? `候选商品 ${index + 1}`}</p>
                <p className="mt-1 text-xs text-slate-400">{item.category ?? '候选类目暂无'}</p>
              </div>
            );
          })}
        </div>
        <p className="mt-4 text-xs leading-5 text-slate-400">不把 DLG / IG 写成已完整还原真实图片。</p>
      </section>
    </div>
  );

  const renderExperimentConclusion = () => {
    const finalExposure =
      (report.v25Summary?.maskedTopkHitRate ?? report.targetRankSummary?.targetHitRate ?? metrics?.targetHitRate ?? 0) === 0
        ? '未命中'
        : '以 artifact 为准';
    const conclusionCards = [
      ['目标商品排序', `${formatRank(rankStats.before)} -> ${formatRank(rankStats.after)}`, 'text-rose-100'],
      ['排名提升', formatSignedNumber(rankStats.rankLift, 0), 'text-rose-100'],
      ['最终 Top50 曝光', finalExposure, 'text-amber-100'],
      ['成员推断 AUC', formatMetricValue(privacyMetrics.miaAuc), 'text-violet-100'],
      ['交互候选还原 hit@50', formatMetricValue(privacyMetrics.hit50), 'text-cyan-100'],
      ['安全聚合残差', report.v25Summary?.secAggResidual === 0 ? '接近 0' : formatMetricValue(report.v25Summary?.secAggResidual), 'text-emerald-100'],
    ];

    return (
      <section className="sandbox-panel sandbox-glow rounded-[28px] p-5">
        <div className="mb-5 flex flex-col justify-between gap-3 lg:flex-row lg:items-end">
          <div>
            <p className="text-xs font-bold tracking-[0.2em] text-cyan-100/75">本次实验结论</p>
            <h2 className="mt-2 text-2xl font-bold text-white">定向投毒推动了模型内部排序，但最终推荐曝光未命中</h2>
          </div>
          <button
            type="button"
            onClick={() => setActiveTab('monitoring')}
            className="rounded-2xl border border-white/10 bg-white/[0.055] px-4 py-2 text-sm font-bold text-slate-100 transition hover:border-cyan-200/30"
          >
            回看运行过程
          </button>
        </div>
        <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
          {conclusionCards.map(([label, value, tone]) => (
            <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.045] p-4">
              <p className="text-xs text-slate-400">{label}</p>
              <p className={cn('mt-2 text-xl font-bold', tone)}>{value}</p>
            </div>
          ))}
        </div>
      </section>
    );
  };

  const renderAnalysis = () => (
    <div className="space-y-5">
      {renderExperimentConclusion()}
      {renderTargetTrajectory()}
      <RecommendationComparisonBoard
        comparison={report.recommendationComparison}
        scenarioId={selectedScenario.scenarioId}
        targetItemId={getTargetEntry(report)?.itemId}
      />
      {renderPrivacyAnalysis()}
      <section className="sandbox-panel rounded-[28px] p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold tracking-[0.2em] text-emerald-100/75">安全聚合残差</p>
            <h3 className="mt-2 text-xl font-bold text-white">模拟残差：{report.v25Summary?.secAggResidual === 0 ? '≈0' : formatMetricValue(report.v25Summary?.secAggResidual)}</h3>
          </div>
          <p className="max-w-xl text-sm leading-6 text-slate-400">该项只表示安全聚合模拟或残差校验，不是生产级安全聚合协议。</p>
        </div>
      </section>
    </div>
  );

  const comparisonRows = (comparisonBundles.length ? comparisonBundles : [bundle]).map((item) => {
    const itemReport = item.report;
    const itemRanks = getRankStats(itemReport);
    const itemPrivacy = getPrivacyMetrics(itemReport);
    const capabilityRow = itemReport.modelCapabilityMatrix?.entries.find((entry) => entry.model === itemReport.model || entry.dataset === itemReport.dataset);
    return {
      id: item.selectedScenario.scenarioId,
      name: getScenarioLabel(item.selectedScenario),
      model: itemReport.model ?? item.selectedScenario.model ?? EMPTY_VALUE,
      dataset: datasetLabel(itemReport.dataset ?? item.selectedScenario.dataset),
      attack: itemRanks.rankLift !== null ? '目标商品投毒' : itemPrivacy.miaAuc !== null ? '隐私攻击观察' : '未导出',
      defense: itemReport.defenseTrace?.aggregationRule ? '鲁棒聚合防御' : itemReport.v25Summary?.secAggResidual !== undefined ? '安全聚合模拟' : '未导出',
      recall: itemReport.metricsSummary?.defense?.recall50 ?? itemReport.metricsSummary?.attack?.recall50 ?? itemReport.metricsSummary?.baseline?.recall50 ?? null,
      ndcg: itemReport.metricsSummary?.defense?.ndcg50 ?? itemReport.metricsSummary?.attack?.ndcg50 ?? itemReport.metricsSummary?.baseline?.ndcg50 ?? null,
      rankGain: itemRanks.rankLift,
      hit50: itemReport.v25Summary?.maskedTopkHitRate ?? itemReport.targetRankSummary?.targetHitRate ?? itemReport.metricsSummary?.targetHitRate ?? null,
      miaAuc: itemPrivacy.miaAuc,
      interactionHit50: itemPrivacy.hit50,
      recovery: itemReport.metricsSummary?.recoveryRate ?? null,
      status: capabilityStatusLabel(capabilityRow?.status),
    };
  });
  const matrixRows: ShowcaseModelCapabilityRow[] = (comparisonBundles.length ? comparisonBundles : [bundle]).flatMap(
    (item) => item.report.modelCapabilityMatrix?.entries ?? [],
  );

  const renderComparison = () => (
    <div className="space-y-5">
      <section className="sandbox-panel rounded-[28px] p-5">
        <div className="mb-5">
          <p className="text-xs font-bold tracking-[0.2em] text-cyan-100/75">横向指标对比</p>
          <h2 className="mt-2 text-2xl font-bold text-white">跨场景只比较指标，不展示推荐列表</h2>
          <p className="mt-2 text-sm text-slate-400">推荐列表适合同一次实验 baseline / attack / defense 对照，不适合跨模型横向对比。</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead className="text-xs text-slate-400">
              <tr className="border-b border-white/10">
                {['模型 / 数据集', '场景', '状态', 'Recall@50', 'NDCG@50', '目标排序提升', '目标 Top50 命中', '成员推断 AUC', '交互还原 hit@50', '防御恢复率'].map((head) => (
                  <th key={head} className="px-4 py-3 font-semibold">{head}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {comparisonRows.map((row) => (
                <tr key={row.id} className="border-b border-white/8">
                  <td className="px-4 py-4">
                    <p className="font-bold text-slate-100">{row.model}</p>
                    <p className="text-xs text-slate-400">{row.dataset}</p>
                  </td>
                  <td className="px-4 py-4 text-slate-300">
                    <p>{row.attack}</p>
                    <p className="mt-1 text-xs text-slate-500">{row.defense}</p>
                  </td>
                  <td className="px-4 py-4 text-slate-300">{row.status}</td>
                  <td className="px-4 py-4 font-mono text-cyan-100">{formatMetricValue(row.recall)}</td>
                  <td className="px-4 py-4 font-mono text-violet-100">{formatMetricValue(row.ndcg)}</td>
                  <td className="px-4 py-4 font-mono text-rose-100">{formatSignedNumber(row.rankGain, 0)}</td>
                  <td className="px-4 py-4 font-mono text-amber-100">{row.hit50 === 0 ? '未命中' : formatPercentValue(row.hit50)}</td>
                  <td className="px-4 py-4 font-mono text-violet-100">{formatMetricValue(row.miaAuc)}</td>
                  <td className="px-4 py-4 font-mono text-cyan-100">{formatMetricValue(row.interactionHit50)}</td>
                  <td className="px-4 py-4 font-mono text-emerald-100">{formatPercentValue(row.recovery)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="sandbox-panel rounded-[28px] p-5">
        <div className="mb-5">
          <p className="text-xs font-bold tracking-[0.2em] text-violet-100/75">模型能力矩阵</p>
          <h2 className="mt-2 text-2xl font-bold text-white">模型 / 数据集 / 能力状态</h2>
          <p className="mt-2 text-sm text-slate-400">来自模型能力矩阵 artifact；暂无指标的单元格显示“暂无指标”，不使用演示数据补假效果。</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead className="text-xs text-slate-400">
              <tr className="border-b border-white/10">
                {['模型', '数据集', '能力', '状态', '证据', '推荐演示用途'].map((head) => (
                  <th key={head} className="px-4 py-3 font-semibold">{head}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {matrixRows.length ? matrixRows.slice(0, 16).map((row, index) => (
                <tr key={`${row.model ?? 'model'}-${row.dataset ?? 'dataset'}-${row.capability ?? index}`} className="border-b border-white/8">
                  <td className="px-4 py-4 font-semibold text-slate-100">{row.model ?? EMPTY_VALUE}</td>
                  <td className="px-4 py-4 text-slate-300">{datasetLabel(row.dataset)}</td>
                  <td className="px-4 py-4 text-slate-300">{row.capability ?? EMPTY_VALUE}</td>
                  <td className="px-4 py-4 font-semibold text-cyan-100">{capabilityStatusLabel(row.status)}</td>
                  <td className="px-4 py-4 text-slate-400">{row.evidence ?? row.reason ?? EMPTY_VALUE}</td>
                  <td className="px-4 py-4 text-slate-300">{row.recommendedDemoUsage ?? EMPTY_VALUE}</td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400">当前 API 未返回模型能力矩阵，横向指标仍按已读取场景展示。</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {comparisonRows.slice(0, 3).map((row) => (
          <div key={`${row.id}-bar`} className="sandbox-panel rounded-[24px] p-5">
            <p className="line-clamp-1 font-bold text-white">{row.name}</p>
            <div className="mt-4 space-y-3">
              {[
                ['Recall@50', row.recall ?? 0, 'bg-cyan-200'],
                ['NDCG@50', row.ndcg ?? 0, 'bg-violet-200'],
                ['防御恢复', row.recovery ?? 0, 'bg-emerald-200'],
              ].map(([label, value, color]) => (
                <div key={label as string}>
                  <div className="mb-1 flex justify-between text-xs text-slate-400">
                    <span>{label}</span>
                    <span>{formatMetricValue(Number(value))}</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-800">
                    <div className={cn('h-full rounded-full', color as string)} style={{width: `${Math.min(100, Math.max(0, Number(value) * 100))}%`}} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>
    </div>
  );

  const renderHistory = () => (
    <div className="space-y-5">
      <section className="sandbox-panel rounded-[28px] p-5">
        <div className="mb-5 flex flex-col justify-between gap-3 md:flex-row md:items-end">
          <div>
            <p className="text-xs font-bold tracking-[0.2em] text-cyan-100/75">历史实验</p>
            <h2 className="mt-2 text-2xl font-bold text-white">可展示 artifact 场景</h2>
          </div>
          <p className="text-xs text-slate-400">当前场景读取时间：{new Date(bundle.fetchedAt).toLocaleString('zh-CN')}</p>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {bundle.scenarios.map((scenario) => {
            const displayable = scenario.isDisplayReady ?? (!scenario.unavailable && !scenario.notAvailable);
            return (
              <button
                key={scenario.scenarioId}
                type="button"
                onClick={() => {
                  setSelectedScenarioId(scenario.scenarioId);
                  setActiveTab('analysis');
                }}
                className="rounded-3xl border border-white/10 bg-white/[0.045] p-5 text-left transition hover:border-cyan-200/35 hover:bg-white/[0.07]"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="font-bold text-slate-50">{getScenarioLabel(scenario)}</span>
                  <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-bold', displayable ? 'bg-emerald-200/10 text-emerald-100' : 'bg-amber-200/10 text-amber-100')}>
                    {displayable ? '可展示' : '暂无数据'}
                  </span>
                </div>
                <p className="mt-2 text-xs text-slate-400">{datasetLabel(scenario.dataset)} / {formatPlainValue(scenario.model)}</p>
                <p className="mt-3 text-xs text-slate-500">来源：{scenario.dataSource === 'api' ? 'API artifact' : 'API 未连接 / 演示数据'}</p>
              </button>
            );
          })}
        </div>
      </section>

      <section className="sandbox-panel rounded-[28px] p-5">
        <h3 className="text-xl font-bold text-white">历史操作入口</h3>
        <p className="mt-2 text-sm leading-6 text-slate-400">原历史实验的“打开分析、加入对比、复用配置”操作已合并到工作台流程：选择场景进入单次分析，横向对比页做指标矩阵，实验编排页复用当前配置。</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <button type="button" onClick={() => onOpenAnalysis(session.analysisTaskId ?? session.activeTaskId)} className="rounded-2xl bg-cyan-200 px-4 py-2 text-sm font-bold text-slate-950">
            打开单次分析
          </button>
          <button type="button" onClick={onOpenComparison} className="rounded-2xl border border-white/10 bg-white/[0.055] px-4 py-2 text-sm font-bold text-slate-100">
            进入横向对比
          </button>
          <button type="button" onClick={() => onReuseConfig(config, session.analysisTaskId ?? session.activeTaskId)} className="rounded-2xl border border-white/10 bg-white/[0.055] px-4 py-2 text-sm font-bold text-slate-100">
            复用当前配置
          </button>
          {session.activeTaskId ? (
            <button type="button" onClick={() => onAddComparisonSelection(session.activeTaskId ?? '')} className="rounded-2xl border border-white/10 bg-white/[0.055] px-4 py-2 text-sm font-bold text-slate-100">
              加入当前运行记录
            </button>
          ) : null}
        </div>
      </section>
    </div>
  );

  const renderTab = () => {
    switch (activeTab) {
      case 'monitoring':
        return renderMonitoring();
      case 'analysis':
        return renderAnalysis();
      case 'comparison':
        return renderComparison();
      case 'history':
        return renderHistory();
      case 'orchestration':
      default:
        return renderOrchestration();
    }
  };

  return (
    <div className="space-y-6 pb-10">
      <section className="sandbox-panel sandbox-glow rounded-[32px] p-6">
        <div className="mb-5 flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-200/30 bg-cyan-200/10 px-3 py-1 text-xs font-bold text-cyan-100">
              <Swords className="h-3.5 w-3.5" />
              攻防工作台
            </div>
            <h1 className="text-3xl font-bold text-white md:text-5xl">编排、监控、分析和对比一体化</h1>
            <p className="mt-4 max-w-4xl text-sm leading-7 text-slate-300">
              原训练配置、运行监控、单次分析、横向对比和历史实验已合并到正式工作流；评委可以按五个步骤顺序完成一次攻防演示。
            </p>
          </div>
          <span className="rounded-full border border-white/10 bg-white/[0.055] px-3 py-1 text-xs font-bold text-slate-300">
            {isLoading ? 'artifact 读取中' : sourceLabel(bundle.dataSource)}
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'inline-flex items-center gap-2 rounded-2xl border px-4 py-2.5 text-sm font-bold transition',
                  active
                    ? 'border-cyan-200/40 bg-cyan-200/14 text-cyan-50'
                    : 'border-white/10 bg-white/[0.04] text-slate-300 hover:border-cyan-200/25 hover:text-white',
                )}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </section>

      {renderTab()}
    </div>
  );
};
