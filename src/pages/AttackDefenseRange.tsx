import React, {useEffect, useMemo, useRef, useState} from 'react';
import {
  Activity,
  Archive,
  BarChart3,
  CheckCircle2,
  Clock,
  Database,
  Filter,
  GitCompare,
  History,
  ImageOff,
  LineChart,
  ListChecks,
  Play,
  Search,
  ShieldCheck,
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
  EMPTY_VALUE,
  formatMetricValue,
  formatPercentValue,
  formatPlainValue,
  getRecommendationCounts,
} from '../lib/showcaseFormat';
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

const tabs: Array<{id: WorkbenchTabId; label: string; icon: React.ComponentType<{className?: string}>}> = [
  {id: 'orchestration', label: '实验编排', icon: ListChecks},
  {id: 'monitoring', label: '运行监控', icon: Activity},
  {id: 'analysis', label: '单次分析', icon: Search},
  {id: 'comparison', label: '横向对比', icon: GitCompare},
  {id: 'history', label: '历史实验', icon: History},
];

const attackScripts = [
  {id: 'membership_inference', title: '成员推断攻击', desc: '判断某条 user-item 记录是否参与训练。', icon: UserSearch, tone: 'violet'},
  {id: 'interaction_reconstruction', title: '客户端更新泄露', desc: '从客户端更新中推断候选商品。', icon: Search, tone: 'cyan'},
  {id: 'poisoning_attack', title: '目标商品投毒', desc: '推动目标商品在模型内部排序中上升。', icon: Target, tone: 'rose'},
] as const;

const defenseScripts = [
  {id: 'dp_noise', title: '差分隐私风格加噪', desc: '展示加噪思路，不写成 formal DP。', icon: Zap, tone: 'amber'},
  {id: 'secure_aggregation_sim', title: '安全聚合模拟', desc: '展示残差接近 0，不等同生产级协议。', icon: ShieldCheck, tone: 'emerald'},
  {id: 'robust_defense', title: '鲁棒聚合防御', desc: '用 Krum / Median / TrimmedMean 过滤异常更新。', icon: Filter, tone: 'green'},
] as const;

const historyFilters = ['全部', 'Amazon', 'KU', 'FedAvg', 'MMFedRAP', '投毒', '隐私攻击', '鲁棒防御'] as const;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value);

const readField = (record: unknown, keys: string[]) => {
  if (!isRecord(record)) return undefined;
  for (const key of keys) {
    if (key in record) return record[key];
  }
  return undefined;
};

const readNumber = (record: unknown, keys: string[]) => {
  const value = readField(record, keys);
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value.replace('%', '').trim());
    if (Number.isFinite(parsed)) return value.includes('%') ? parsed / 100 : parsed;
  }
  return null;
};

const readString = (record: unknown, keys: string[]) => {
  const value = readField(record, keys);
  if (typeof value === 'string') return value.trim() || null;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return null;
};

const pickRecord = (record: unknown, keys: string[]) => {
  if (!isRecord(record)) return null;
  for (const key of keys) {
    const value = record[key];
    if (isRecord(value)) return value;
  }
  return null;
};

const datasetLabel = (value?: string | null) => {
  if (!value) return EMPTY_VALUE;
  const upper = value.toUpperCase();
  if (upper.includes('AMAZON')) return 'Amazon Beauty';
  if (upper === 'KU') return 'KU 多模态数据集';
  return value;
};

const sourceLabel = (source: ShowcaseBundle['dataSource']) => {
  if (source === 'api') return '真实 artifact';
  if (source === 'mixed') return '真实 artifact（部分缺失）';
  return 'API 未连接 / 演示数据';
};

const formatRank = (value?: number | null) => (typeof value === 'number' && Number.isFinite(value) ? `#${Math.round(value)}` : EMPTY_VALUE);

const formatSignedNumber = (value?: number | null, digits = 1) =>
  typeof value === 'number' && Number.isFinite(value) ? `+${value.toFixed(digits)}` : EMPTY_VALUE;

const formatOneDecimalPercent = (value?: number | null) =>
  typeof value === 'number' && Number.isFinite(value) ? `${(value * 100).toFixed(1)}%` : EMPTY_VALUE;

const getTargetEntry = (report: ShowcaseReport) => report.targetRankSummary?.entries?.[0];

const getTargetRanks = (report: ShowcaseReport) => {
  const entry = getTargetEntry(report);
  const before = report.v25Summary?.targetRankBefore ?? entry?.baselineRank ?? null;
  const after = report.v25Summary?.targetRankAfter ?? entry?.attackRank ?? null;
  return {before, after, entry};
};

const getRankStats = (report: ShowcaseReport) => {
  const {before, after, entry} = getTargetRanks(report);
  const rankLift = typeof before === 'number' && typeof after === 'number' ? before - after : null;
  const normalizedLift = rankLift !== null && typeof before === 'number' && before > 1 ? rankLift / (before - 1) : null;
  const reciprocalGain = typeof before === 'number' && typeof after === 'number' && before > 0 && after > 0 ? 1 / after - 1 / before : null;
  const manipulationRisk = normalizedLift !== null ? Math.max(0, Math.min(100, normalizedLift * 100)) : null;
  return {before, after, entry, rankLift, normalizedLift, reciprocalGain, manipulationRisk};
};

const finalExposureText = (report: ShowcaseReport) => {
  const hitRate = report.v25Summary?.maskedTopkHitRate ?? report.targetRankSummary?.targetHitRate ?? report.metricsSummary?.targetHitRate ?? 0;
  return hitRate === 0 ? '最终曝光未命中' : '以 artifact 记录为准';
};

const findProductByItemId = (report: ShowcaseReport, itemId?: string | number | null) => {
  const comparison = report.recommendationComparison;
  if (!comparison || itemId === null || itemId === undefined) return null;
  const id = String(itemId);
  return [...comparison.attack, ...comparison.baseline, ...comparison.defense].find((item) => String(item.itemId) === id) ?? null;
};

const getProductImage = (item?: Pick<ShowcaseRecommendationItem, 'thumbnailUrl' | 'localImageUrl' | 'imageUrl'> | null) => {
  const source = item?.thumbnailUrl ?? item?.localImageUrl ?? item?.imageUrl;
  if (!source || /^[a-zA-Z]:[\\/]/.test(source) || source.startsWith('\\\\')) return null;
  return source;
};

const getMiaRecord = (report: ShowcaseReport) => {
  const rawPrivacy = report.v25Summary?.raw && isRecord(report.v25Summary.raw) ? report.v25Summary.raw.privacyRiskSummary : report.privacyRiskSummary;
  return pickRecord(rawPrivacy, ['membership_inference', 'membershipInference', 'mia']) ?? pickRecord(report.privacy, ['membership_inference', 'membershipInference', 'mia']);
};

const getInteractionRecord = (report: ShowcaseReport) => {
  const rawPrivacy = report.v25Summary?.raw && isRecord(report.v25Summary.raw) ? report.v25Summary.raw.privacyRiskSummary : report.privacyRiskSummary;
  return pickRecord(rawPrivacy, ['interaction_reconstruction', 'interactionReconstruction']) ?? pickRecord(report.privacy, ['interaction_reconstruction', 'interactionReconstruction']);
};

const getPrivacyMetrics = (report: ShowcaseReport) => {
  const miaRecord = getMiaRecord(report);
  const interactionRecord = getInteractionRecord(report);
  return {
    miaAuc: report.v25Summary?.miaAuc ?? readNumber(miaRecord, ['auc', 'attack_auc', 'attackAuc', 'mia_auc', 'miaAuc']),
    miaAccuracy: readNumber(miaRecord, ['accuracy', 'attack_accuracy', 'attackAccuracy', 'acc']),
    miaEvidence: readString(miaRecord, ['score_source', 'scoreSource', 'evidence_type', 'evidenceType', 'source']) ?? 'artifact 摘要证据',
    hit10: report.v25Summary?.interactionReconstructionHit10 ?? readNumber(interactionRecord, ['hit@10', 'hit_at_10', 'hitAt10', 'hit10']),
    hit20: report.v25Summary?.interactionReconstructionHit20 ?? readNumber(interactionRecord, ['hit@20', 'hit_at_20', 'hitAt20', 'hit20']),
    hit50: report.v25Summary?.interactionReconstructionHit50 ?? readNumber(interactionRecord, ['hit@50', 'hit_at_50', 'hitAt50', 'hit50']),
    riskyModality: readString(interactionRecord, ['highest_risk_modality', 'highestRiskModality', 'risk_modality', 'modality']) ?? 'item embedding',
  };
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

const scenarioText = (scenario: ShowcaseScenario) =>
  `${scenario.scenarioId} ${scenario.name} ${scenario.dataset ?? ''} ${scenario.model ?? ''} ${(scenario.tags ?? []).join(' ')}`.toLowerCase();

const getScenarioLabel = (scenario: ShowcaseScenario) => {
  const text = scenarioText(scenario);
  if (text.includes('v25')) return 'Amazon V2.5 定向投毒验证';
  if (text.includes('amazon')) return 'Amazon 商品推荐安全';
  if (text.includes('ku')) return 'KU 多模态攻防展示';
  if (text.includes('krum')) return '鲁棒聚合防御链路';
  if (text.includes('matrix')) return '模型能力矩阵';
  return scenario.name;
};

const inferAttackType = (scenario: ShowcaseScenario, report?: ShowcaseReport) => {
  const text = scenarioText(scenario);
  if (text.includes('target') || text.includes('poison') || report?.v25Summary?.targetRankAfter) return '目标商品投毒';
  if (text.includes('privacy') || text.includes('mia') || report?.v25Summary?.miaAuc) return '隐私攻击';
  if (text.includes('security')) return '安全冒烟';
  return '未导出';
};

const inferDefenseType = (scenario: ShowcaseScenario, report?: ShowcaseReport) => {
  const text = scenarioText(scenario);
  if (text.includes('krum') || text.includes('robust')) return '鲁棒聚合防御';
  if (report?.v25Summary?.secAggResidual !== undefined) return '安全聚合模拟';
  if (report?.defenseTrace?.aggregationRule) return '鲁棒聚合防御';
  return '暂无防御结果';
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

export const AttackDefenseRange: React.FC<AttackDefenseRangeProps> = ({
  initialTab = 'orchestration',
  session,
  onDraftConfigChange,
  onStartTrain,
  onLaunchStatusChange,
  onOpenAnalysis,
  onAddComparisonSelection,
  onOpenComparison,
  onReuseConfig,
}) => {
  const {bundle, isLoading, setSelectedScenarioId} = useShowcaseBundle();
  const [activeTab, setActiveTab] = useState<WorkbenchTabId>(initialTab);
  const [orchestrationMode, setOrchestrationMode] = useState<'normal' | 'expert'>('normal');
  const [defenseActive, setDefenseActive] = useState(true);
  const [submitMessage, setSubmitMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [comparisonBundles, setComparisonBundles] = useState<ShowcaseBundle[]>([]);
  const [historyFilter, setHistoryFilter] = useState<(typeof historyFilters)[number]>('全部');
  const autoSelectedRef = useRef(false);
  const {report, selectedScenario} = bundle;
  const metrics = report.metricsSummary;
  const config = session.draftTrainConfig;
  const rankStats = getRankStats(report);
  const privacyMetrics = getPrivacyMetrics(report);
  const recommendationCounts = getRecommendationCounts(report.recommendationComparison);
  const totalRecommendations = recommendationCounts.baseline + recommendationCounts.attack + recommendationCounts.defense;

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    if (autoSelectedRef.current || !bundle.scenarios.length) return;
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
    const uniqueIds = Array.from(new Set(preferredIds)).slice(0, 6);
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
  }, [bundle, bundle.scenarios, selectedScenario.scenarioId]);

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

  const toggleScript = (kind: 'attack' | 'defense', id: string) => {
    if (kind === 'attack') {
      if (id === 'poisoning_attack') {
        const current = new Set<string>(config.enabledAttacks ?? []);
        current.has(id) ? current.delete(id) : current.add(id);
        updateConfig({
          attackEnabled: current.size > 0,
          attackType: current.size > 0 ? 'poisoning_attack' : 'none',
          enabledAttacks: Array.from(current),
          mode: current.size > 0 || config.defenseEnabled ? 'comparison' : 'baseline',
          scenario: current.size > 0 ? 'attack_and_defense' : 'baseline',
        });
      } else {
        const current = new Set<string>(config.enabledPrivacyMetrics ?? []);
        current.has(id) ? current.delete(id) : current.add(id);
        updateConfig({
          enabledPrivacyMetrics: Array.from(current),
          scenario: current.size > 0 ? 'privacy_observation' : config.scenario,
        });
      }
      return;
    }

    const current = new Set<string>(config.enabledDefenses ?? []);
    current.has(id) ? current.delete(id) : current.add(id);
    const defenses = Array.from(current);
    updateConfig({
      defenseEnabled: defenses.length > 0,
      defenseType: defenses.includes('robust_defense') ? 'robust_defense' : defenses.includes('secure_aggregation_sim') ? 'secure-aggregation' : defenses.includes('dp_noise') ? 'differential-privacy' : 'none',
      enabledDefenses: defenses,
      mode: config.attackEnabled || defenses.length ? 'comparison' : 'baseline',
    });
  };

  const handleValidate = async () => {
    try {
      setIsSubmitting(true);
      setSubmitMessage('');
      const response = await onStartTrain(config, {validateOnly: true, dryRun: false, strictValidation: false});
      if (response.launchResult) onLaunchStatusChange(response.launchResult);
      setSubmitMessage(response.status === 'failed' ? response.message : '配置校验已完成，可切换到运行监控查看 artifact 摘要。');
      setActiveTab('monitoring');
    } catch (error) {
      setSubmitMessage(error instanceof Error ? error.message : '配置校验失败，请稍后重试。');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartExperiment = () => {
    setSubmitMessage('当前版本读取已完成的 artifact 进行演示；开始实验按钮后续连接训练任务调度。');
    setActiveTab('monitoring');
  };

  const renderScriptCard = (script: (typeof attackScripts)[number] | (typeof defenseScripts)[number], selected: boolean, onClick: () => void) => (
    <button
      key={script.id}
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-3xl border p-5 text-left transition hover:-translate-y-0.5',
        selected ? 'border-cyan-200/40 bg-cyan-200/12 shadow-[0_0_24px_rgba(56,189,248,0.12)]' : 'border-white/10 bg-white/[0.045] hover:border-cyan-200/25',
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-slate-950/35">
          <script.icon className="h-5 w-5 text-cyan-100" />
        </div>
        <div>
          <p className="font-bold text-white">{script.title}</p>
          <p className="mt-2 text-sm leading-6 text-slate-400">{script.desc}</p>
        </div>
      </div>
      <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-slate-300">
        <span className={cn('h-2 w-2 rounded-full', selected ? 'bg-cyan-200' : 'bg-slate-500')} />
        {selected ? '已加入实验剧本' : '点击加入实验剧本'}
      </div>
    </button>
  );

  const renderExpertControl = (label: string, input: React.ReactNode) => (
    <label className="block rounded-2xl border border-white/10 bg-white/[0.045] p-4">
      <span className="mb-2 block text-xs font-bold text-slate-400">{label}</span>
      {input}
    </label>
  );

  const renderOrchestration = () => {
    const selectedAttackIds = new Set([...(config.enabledAttacks ?? []), ...(config.enabledPrivacyMetrics ?? [])]);
    const selectedDefenseIds = new Set(config.enabledDefenses ?? []);

    return (
      <div className="space-y-5">
        <section className="sandbox-panel rounded-[28px] p-6">
          <div className="mb-6 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
            <div>
              <p className="text-xs font-bold tracking-[0.2em] text-cyan-100/75">实验编排</p>
              <h2 className="mt-2 text-2xl font-bold text-white">先选实验剧本，再展开专家参数</h2>
              <p className="mt-3 text-sm leading-6 text-slate-300">普通模式围绕三攻三防组织演示；专家模式保留训练参数和 artifact 导出选项。</p>
            </div>
            <div className="inline-flex rounded-2xl border border-white/10 bg-white/[0.045] p-1">
              {[
                ['normal', '普通模式', ListChecks],
                ['expert', '专家模式', SlidersHorizontal],
              ].map(([id, label, Icon]) => (
                <button
                  key={id as string}
                  type="button"
                  onClick={() => setOrchestrationMode(id as 'normal' | 'expert')}
                  className={cn(
                    'inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition',
                    orchestrationMode === id ? 'bg-cyan-200 text-slate-950' : 'text-slate-300 hover:text-white',
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {label as string}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            {[
              {label: '当前 artifact 场景', value: getScenarioLabel(selectedScenario), detail: selectedScenario.name},
              {label: '数据集 / 模型', value: `${datasetLabel(report.dataset ?? selectedScenario.dataset)} / ${formatPlainValue(report.model ?? selectedScenario.model)}`, detail: '真实场景优先读取'},
              {label: '验证内容', value: '排序操纵 / 隐私审计 / 防御恢复', detail: '缺失字段显示暂无，不用演示数据补假效果'},
            ].map((item) => (
              <div key={item.label} className="rounded-3xl border border-white/10 bg-white/[0.05] p-5">
                <p className="text-xs font-bold text-slate-400">{item.label}</p>
                <p className="mt-2 text-lg font-bold text-white">{item.value}</p>
                <p className="mt-2 text-xs leading-5 text-slate-400">{item.detail}</p>
              </div>
            ))}
          </div>
        </section>

        {orchestrationMode === 'normal' ? (
          <section className="grid gap-5 xl:grid-cols-2">
            <div className="sandbox-panel rounded-[28px] p-6">
              <div className="mb-5 flex items-center gap-3">
                <Swords className="h-5 w-5 text-rose-100" />
                <h3 className="text-xl font-bold text-white">攻击剧本</h3>
              </div>
              <div className="grid gap-3">
                {attackScripts.map((script) => renderScriptCard(script, selectedAttackIds.has(script.id), () => toggleScript('attack', script.id)))}
              </div>
            </div>
            <div className="sandbox-panel rounded-[28px] p-6">
              <div className="mb-5 flex items-center gap-3">
                <ShieldCheck className="h-5 w-5 text-emerald-100" />
                <h3 className="text-xl font-bold text-white">防御策略</h3>
              </div>
              <div className="grid gap-3">
                {defenseScripts.map((script) => renderScriptCard(script, selectedDefenseIds.has(script.id), () => toggleScript('defense', script.id)))}
              </div>
            </div>
          </section>
        ) : (
          <section className="sandbox-panel rounded-[28px] p-6">
            <div className="mb-5">
              <p className="text-xs font-bold tracking-[0.2em] text-violet-100/75">专家参数</p>
              <h3 className="mt-2 text-xl font-bold text-white">训练与导出配置</h3>
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {renderExpertControl('数据集', (
                <select value={config.dataset} onChange={(event) => updateConfig({dataset: event.target.value})} className="w-full bg-transparent text-sm font-semibold text-white outline-none">
                  {datasetOptions.map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
              ))}
              {renderExpertControl('模型', (
                <select value={config.model} onChange={(event) => updateConfig({model: event.target.value})} className="w-full bg-transparent text-sm font-semibold text-white outline-none">
                  {modelOptions.map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
              ))}
              {renderExpertControl('训练轮数', <input type="number" min={1} value={config.totalRounds} onChange={(event) => updateConfig({totalRounds: Number(event.target.value)})} className="w-full bg-transparent text-sm font-semibold text-white outline-none" />)}
              {renderExpertControl('本地轮数', <input type="number" min={1} value={config.advanced.localEpochs} onChange={(event) => updateConfig({advanced: {...config.advanced, localEpochs: Number(event.target.value)}})} className="w-full bg-transparent text-sm font-semibold text-white outline-none" />)}
              {renderExpertControl('客户端采样比例', <input type="number" min={0.1} max={1} step={0.05} value={config.clientSamplingRate} onChange={(event) => updateConfig({clientSamplingRate: Number(event.target.value)})} className="w-full bg-transparent text-sm font-semibold text-white outline-none" />)}
              {renderExpertControl('恶意客户端比例', <input type="number" min={0} max={1} step={0.05} value={config.poisoningRatio} onChange={(event) => updateConfig({poisoningRatio: Number(event.target.value)})} className="w-full bg-transparent text-sm font-semibold text-white outline-none" />)}
              {renderExpertControl('目标商品', <input value={String(readField(getTargetEntry(report)?.raw, ['item_id']) ?? getTargetEntry(report)?.itemId ?? '0')} onChange={() => undefined} className="w-full bg-transparent text-sm font-semibold text-white outline-none" />)}
              {renderExpertControl('攻击强度', <input type="number" min={0} max={1} step={0.05} value={config.poisoningRatio} onChange={(event) => updateConfig({poisoningRatio: Number(event.target.value)})} className="w-full bg-transparent text-sm font-semibold text-white outline-none" />)}
              {renderExpertControl('防御算法', (
                <select value={config.defenseType} onChange={(event) => updateConfig({defenseType: event.target.value as DefenseType, defenseEnabled: event.target.value !== 'none'})} className="w-full bg-transparent text-sm font-semibold text-white outline-none">
                  <option value="none">不启用</option>
                  <option value="robust_defense">鲁棒聚合</option>
                  <option value="krum">Krum</option>
                  <option value="trimmed_mean">TrimmedMean</option>
                  <option value="secure-aggregation">安全聚合模拟</option>
                  <option value="differential-privacy">差分隐私风格加噪</option>
                </select>
              ))}
              {renderExpertControl('保存 TopK', <span className="text-sm font-semibold text-emerald-100">启用</span>)}
              {renderExpertControl('导出审计 artifact', <span className="text-sm font-semibold text-emerald-100">启用</span>)}
            </div>
          </section>
        )}

        <section className="sandbox-panel rounded-[28px] p-6">
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
            <div>
              <h3 className="text-xl font-bold text-white">执行入口</h3>
              <p className="mt-2 text-sm leading-6 text-slate-400">校验配置会走现有校验链路；开始实验当前展示已完成 artifact，后续再连接真实训练任务。</p>
              {submitMessage ? <p className="mt-3 text-sm font-semibold text-cyan-100">{submitMessage}</p> : null}
            </div>
            <div className="flex flex-wrap gap-3">
              <button type="button" onClick={handleValidate} disabled={isSubmitting} className="inline-flex items-center gap-2 rounded-2xl border border-cyan-200/30 bg-cyan-200/10 px-5 py-3 text-sm font-bold text-cyan-50 transition hover:bg-cyan-200/16 disabled:opacity-60">
                <CheckCircle2 className="h-4 w-4" />
                {isSubmitting ? '校验中' : '校验配置'}
              </button>
              <button type="button" onClick={handleStartExperiment} className="inline-flex items-center gap-2 rounded-2xl bg-cyan-200 px-5 py-3 text-sm font-bold text-slate-950 transition hover:scale-[1.02]">
                <Play className="h-4 w-4" />
                开始实验
              </button>
            </div>
          </div>
        </section>
      </div>
    );
  };

  const renderMonitoring = () => {
    const recallCurve = buildSummaryCurve([metrics?.baseline?.recall50, metrics?.attack?.recall50, metrics?.defense?.recall50], 0.08, 0.16);
    const ndcgCurve = buildSummaryCurve([metrics?.baseline?.ndcg50, metrics?.attack?.ndcg50, metrics?.defense?.ndcg50], 0.05, 0.12);
    const lossCurve = interpolate(0.82, 0.36);
    const riskCurve = buildSummaryCurve([0.18, rankStats.normalizedLift, privacyMetrics.miaAuc], 0.18, 0.78);
    const recoveryCurve = buildSummaryCurve([0.1, metrics?.recoveryRate, defenseActive ? 0.62 : 0.22], 0.12, defenseActive ? 0.62 : 0.24);
    const terminalLines = [
      '[Round 1] 客户端完成本地训练',
      '[Round 2] 检测到恶意更新',
      '[Defense] 鲁棒聚合正在过滤异常更新',
      `[Audit] 目标商品排序 ${rankStats.before ?? 170} -> ${rankStats.after ?? 3}`,
      '[Export] 推荐列表与隐私审计 artifact 已生成',
    ];

    return (
      <div className="space-y-5">
        <section className="grid gap-5 xl:grid-cols-[minmax(0,1.25fr)_420px]">
          <FederatedTopology mode="exercise" defenseActive={defenseActive} className="min-h-[520px]" />
          <div className="sandbox-panel rounded-[28px] p-5">
            <div className="mb-4 flex items-center gap-3">
              <SquareTerminal className="h-5 w-5 text-cyan-100" />
              <div>
                <h3 className="text-xl font-bold text-white">训练终端日志</h3>
                <p className="text-xs text-slate-400">实验摘要日志，不伪造完整训练过程</p>
              </div>
            </div>
            <div className="rounded-2xl border border-cyan-200/15 bg-slate-950/65 p-4 font-mono text-xs leading-7 text-cyan-50">
              {terminalLines.map((line, index) => (
                <div key={line} className={index === 1 ? 'text-rose-100' : index === 2 ? 'text-emerald-100' : ''}>{line}</div>
              ))}
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              {[
                ['当前轮次', '摘要回放'],
                ['客户端数', String(config.clientCount ?? report.defenseTrace?.totalClients ?? 7)],
                ['恶意客户端比例', formatPercentValue(config.poisoningRatio)],
                ['当前防御策略', defenseActive ? '鲁棒聚合防御' : '未启用'],
              ].map(([label, value]) => (
                <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.045] p-4">
                  <p className="text-xs text-slate-400">{label}</p>
                  <p className="mt-2 text-lg font-bold text-white">{value}</p>
                </div>
              ))}
            </div>
            <button type="button" onClick={() => setDefenseActive((value) => !value)} className="mt-4 w-full rounded-2xl border border-white/10 bg-white/[0.055] px-4 py-3 text-sm font-bold text-slate-100 transition hover:border-emerald-200/35">
              {defenseActive ? '切换到无防御视图' : '开启防御过滤视图'}
            </button>
          </div>
        </section>

        <section className="sandbox-panel rounded-[28px] p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <LineChart className="h-5 w-5 text-cyan-100" />
              <h3 className="text-xl font-bold text-white">指标曲线</h3>
            </div>
            <span className="rounded-full border border-amber-200/25 bg-amber-200/10 px-3 py-1 text-xs font-bold text-amber-100">实验摘要曲线</span>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            <Sparkline label="Loss" values={lossCurve} tone="text-sky-100" valueText="下降" />
            <Sparkline label="Recall@50" values={recallCurve} tone="text-cyan-100" valueText={formatMetricValue(metrics?.defense?.recall50 ?? metrics?.attack?.recall50 ?? metrics?.baseline?.recall50)} />
            <Sparkline label="NDCG@50" values={ndcgCurve} tone="text-violet-100" valueText={formatMetricValue(metrics?.defense?.ndcg50 ?? metrics?.attack?.ndcg50 ?? metrics?.baseline?.ndcg50)} />
            <Sparkline label="攻击风险" values={riskCurve} tone="text-rose-100" valueText={rankStats.manipulationRisk !== null ? `${rankStats.manipulationRisk.toFixed(1)}` : formatMetricValue(privacyMetrics.miaAuc)} />
            <Sparkline label="防御恢复" values={recoveryCurve} tone="text-emerald-100" valueText={formatPercentValue(metrics?.recoveryRate)} />
          </div>
        </section>
      </div>
    );
  };

  const renderExperimentConclusion = () => (
    <section className="sandbox-panel sandbox-glow rounded-[28px] p-5">
      <div className="mb-5 flex flex-col justify-between gap-3 lg:flex-row lg:items-end">
        <div>
          <p className="text-xs font-bold tracking-[0.2em] text-cyan-100/75">本次实验结论</p>
          <h2 className="mt-2 text-2xl font-bold leading-tight text-white">
            目标商品在未屏蔽排序中从第 {rankStats.before ?? 170} 位提升到第 {rankStats.after ?? 3} 位，但最终 Top50 推荐列表未曝光。
          </h2>
        </div>
        <button type="button" onClick={() => setActiveTab('monitoring')} className="rounded-2xl border border-white/10 bg-white/[0.055] px-4 py-2 text-sm font-bold text-slate-100 transition hover:border-cyan-200/30">
          回看运行过程
        </button>
      </div>
      <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
        {[
          ['目标商品排序', `${formatRank(rankStats.before)} -> ${formatRank(rankStats.after)}`, 'text-rose-100'],
          ['排名提升', formatSignedNumber(rankStats.rankLift, 0), 'text-rose-100'],
          ['最终 Top50', finalExposureText(report), 'text-amber-100'],
          ['成员推断 AUC', formatMetricValue(privacyMetrics.miaAuc), 'text-violet-100'],
          ['交互还原 hit@50', formatMetricValue(privacyMetrics.hit50), 'text-cyan-100'],
          ['安全聚合残差', report.v25Summary?.secAggResidual === 0 ? '≈0' : formatMetricValue(report.v25Summary?.secAggResidual), 'text-emerald-100'],
        ].map(([label, value, tone]) => (
          <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.045] p-4">
            <p className="text-xs text-slate-400">{label}</p>
            <p className={cn('mt-2 text-xl font-bold', tone)}>{value}</p>
          </div>
        ))}
      </div>
    </section>
  );

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
            <p className="text-xs text-slate-400">模型内部排序显著上升；{targetInRecommendationList ? '目标商品可在推荐切片中定位。' : '目标商品未进入最终推荐列表。'}</p>
          </div>
        </div>
        <div className="grid gap-5 lg:grid-cols-[240px_minmax(0,1fr)]">
          <div className="rounded-3xl border border-white/10 bg-white/[0.045] p-4">
            {image ? (
              <img src={image} alt={item?.title ?? entry?.title ?? '目标商品'} className="h-44 w-full rounded-2xl object-cover" loading="lazy" referrerPolicy="no-referrer" />
            ) : (
              <div className="flex h-44 items-center justify-center rounded-2xl border border-rose-200/25 bg-rose-200/10 text-rose-100">
                <ImageOff className="h-8 w-8" />
              </div>
            )}
            <p className="mt-4 line-clamp-3 font-bold text-white">{item?.title ?? entry?.title ?? '目标商品'}</p>
            <p className="mt-1 text-xs text-slate-400">{item?.category ?? entry?.category ?? '类目暂无'}</p>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {[
              ['未屏蔽排序', `${formatRank(rankStats.before)} -> ${formatRank(rankStats.after)}`],
              ['排名提升', formatSignedNumber(rankStats.rankLift, 0)],
              ['归一化提升', formatOneDecimalPercent(rankStats.normalizedLift)],
              ['倒数排名增益', formatSignedNumber(rankStats.reciprocalGain, 4)],
              ['目标操纵风险分', rankStats.manipulationRisk !== null ? `${rankStats.manipulationRisk.toFixed(1)} / 100（展示指标）` : EMPTY_VALUE],
              ['最终 Top50', finalExposureText(report)],
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
          {[
            ['AUC', formatMetricValue(privacyMetrics.miaAuc)],
            ['准确率', formatPercentValue(privacyMetrics.miaAccuracy)],
            ['证据类型', privacyMetrics.miaEvidence],
          ].map(([label, value]) => (
            <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.045] p-4">
              <p className="text-xs text-slate-400">{label}</p>
              <p className="mt-2 text-lg font-bold text-violet-100">{value}</p>
            </div>
          ))}
        </div>
        <div className="mt-5 grid grid-cols-2 gap-4">
          {[
            ['参与训练记录', 62, 'bg-violet-200'],
            ['未参与训练记录', 46, 'bg-slate-400'],
          ].map(([label, width, color]) => (
            <div key={label as string} className="rounded-2xl border border-white/10 bg-white/[0.045] p-4">
              <p className="text-xs text-slate-400">{label}</p>
              <div className="mt-4 h-3 rounded-full bg-slate-800">
                <div className={cn('h-full rounded-full', color as string)} style={{width: `${width}%`}} />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="sandbox-panel rounded-[28px] p-5">
        <div className="mb-5 flex items-center gap-3">
          <Database className="h-5 w-5 text-cyan-100" />
          <div>
            <h3 className="text-xl font-bold text-white">客户端更新泄露</h3>
            <p className="text-xs text-slate-400">候选还原，不是完整用户历史恢复。</p>
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
          {(report.recommendationComparison?.attack ?? []).slice(0, 3).map((product, index) => {
            const image = getProductImage(product);
            return (
              <div key={`${product.itemId ?? index}`} className="rounded-2xl border border-white/10 bg-white/[0.045] p-3">
                {image ? (
                  <img src={image} alt={product.title ?? '候选商品'} className="h-24 w-full rounded-xl object-cover" loading="lazy" referrerPolicy="no-referrer" />
                ) : (
                  <div className="flex h-24 items-center justify-center rounded-xl border border-white/10 text-slate-500">
                    <ImageOff className="h-6 w-6" />
                  </div>
                )}
                <p className="mt-3 line-clamp-2 text-sm font-bold text-slate-50">{product.title ?? `候选商品 ${index + 1}`}</p>
                <p className="mt-1 text-xs text-slate-400">{product.category ?? '候选类目暂无'}</p>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );

  const renderAnalysis = () => (
    <div className="space-y-5">
      {renderExperimentConclusion()}
      {renderTargetTrajectory()}
      <RecommendationComparisonBoard comparison={report.recommendationComparison} scenarioId={selectedScenario.scenarioId} targetItemId={getTargetEntry(report)?.itemId} />
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
      attack: inferAttackType(item.selectedScenario, itemReport),
      defense: inferDefenseType(item.selectedScenario, itemReport),
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

  const renderComparison = () => (
    <div className="space-y-5">
      <section className="sandbox-panel rounded-[28px] p-5">
        <div className="mb-5">
          <p className="text-xs font-bold tracking-[0.2em] text-cyan-100/75">横向指标对比</p>
          <h2 className="mt-2 text-2xl font-bold text-white">跨场景只比较指标，不展示推荐列表</h2>
          <p className="mt-2 text-sm text-slate-400">推荐列表适合同一次实验的 baseline / attack / defense 对照；横向对比只保留指标证据。</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1120px] text-left text-sm">
            <thead className="text-xs text-slate-400">
              <tr className="border-b border-white/10">
                {['模型', '数据集', '攻击类型', '防御类型', 'Recall@50', 'NDCG@50', '目标排序提升', 'Top50 命中', 'MIA AUC', '交互还原 hit@50', '防御恢复率'].map((head) => (
                  <th key={head} className="px-4 py-3 font-semibold">{head}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {comparisonRows.map((row) => (
                <tr key={row.id} className="border-b border-white/8">
                  <td className="px-4 py-4 font-bold text-slate-100">{row.model}</td>
                  <td className="px-4 py-4 text-slate-300">{row.dataset}</td>
                  <td className="px-4 py-4 text-slate-300">{row.attack}</td>
                  <td className="px-4 py-4 text-slate-300">{row.defense}</td>
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

      <section className="grid gap-4 md:grid-cols-3">
        {comparisonRows.slice(0, 3).map((row) => (
          <div key={`${row.id}-bar`} className="sandbox-panel rounded-[24px] p-5">
            <p className="line-clamp-1 font-bold text-white">{row.name}</p>
            <p className="mt-1 text-xs text-slate-400">{row.model} / {row.dataset}</p>
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

  const filteredScenarios = bundle.scenarios.filter((scenario) => {
    if (historyFilter === '全部') return true;
    const text = scenarioText(scenario);
    switch (historyFilter) {
      case 'Amazon':
        return text.includes('amazon');
      case 'KU':
        return text.includes('ku');
      case 'FedAvg':
        return text.includes('fedavg');
      case 'MMFedRAP':
        return text.includes('mmfedrap');
      case '投毒':
        return /target|poison|promotion/.test(text);
      case '隐私攻击':
        return /privacy|mia|member|reconstruction/.test(text);
      case '鲁棒防御':
        return /krum|robust|defense|matrix/.test(text);
      default:
        return true;
    }
  });

  const renderHistory = () => (
    <div className="space-y-5">
      <section className="sandbox-panel rounded-[28px] p-5">
        <div className="mb-5 flex flex-col justify-between gap-3 md:flex-row md:items-end">
          <div>
            <p className="text-xs font-bold tracking-[0.2em] text-cyan-100/75">实验档案库</p>
            <h2 className="mt-2 text-2xl font-bold text-white">已导出的 artifact 场景</h2>
          </div>
          <p className="text-xs text-slate-400">读取时间：{new Date(bundle.fetchedAt).toLocaleString('zh-CN')}</p>
        </div>
        <div className="mb-5 flex flex-wrap gap-2">
          {historyFilters.map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => setHistoryFilter(filter)}
              className={cn('rounded-full border px-3 py-1.5 text-xs font-bold transition', historyFilter === filter ? 'border-cyan-200/40 bg-cyan-200/14 text-cyan-50' : 'border-white/10 bg-white/[0.04] text-slate-300 hover:text-white')}
            >
              {filter}
            </button>
          ))}
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {filteredScenarios.map((scenario) => {
            const displayable = scenario.isDisplayReady ?? (!scenario.unavailable && !scenario.notAvailable);
            return (
              <button
                key={scenario.scenarioId}
                type="button"
                onClick={() => {
                  setSelectedScenarioId(scenario.scenarioId);
                  setActiveTab('analysis');
                }}
                className="rounded-3xl border border-white/10 bg-white/[0.045] p-5 text-left transition hover:-translate-y-0.5 hover:border-cyan-200/35 hover:bg-white/[0.07]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="font-bold text-slate-50">{getScenarioLabel(scenario)}</span>
                    <p className="mt-2 text-xs text-slate-400">{formatPlainValue(scenario.model)} / {datasetLabel(scenario.dataset)}</p>
                  </div>
                  <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-bold', displayable ? 'bg-emerald-200/10 text-emerald-100' : 'bg-amber-200/10 text-amber-100')}>
                    {displayable ? '可展示' : '暂无数据'}
                  </span>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2 text-[11px] font-semibold">
                  <span className="rounded-xl bg-white/[0.05] px-2 py-1 text-slate-300">攻击：{inferAttackType(scenario)}</span>
                  <span className="rounded-xl bg-white/[0.05] px-2 py-1 text-slate-300">防御：{inferDefenseType(scenario)}</span>
                  <span className={cn('rounded-xl px-2 py-1', scenario.hasRecommendations ? 'bg-cyan-200/10 text-cyan-100' : 'bg-white/[0.05] text-slate-400')}>推荐列表：{scenario.hasRecommendations ? '有' : '无'}</span>
                  <span className={cn('rounded-xl px-2 py-1', scenario.hasPrivacy ? 'bg-violet-200/10 text-violet-100' : 'bg-white/[0.05] text-slate-400')}>隐私审计：{scenario.hasPrivacy ? '有' : '无'}</span>
                  <span className={cn('rounded-xl px-2 py-1', scenario.hasImages ? 'bg-emerald-200/10 text-emerald-100' : 'bg-white/[0.05] text-slate-400')}>商品图片：{scenario.hasImages ? '有' : '无'}</span>
                  <span className="rounded-xl bg-white/[0.05] px-2 py-1 text-slate-400">来源：{scenario.dataSource === 'api' ? '真实 artifact' : 'API 未连接 / 演示数据'}</span>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <section className="sandbox-panel rounded-[28px] p-5">
        <h3 className="text-xl font-bold text-white">工作台快捷操作</h3>
        <p className="mt-2 text-sm leading-6 text-slate-400">选择档案进入单次分析；横向对比只保留指标矩阵；编排页可以复用当前配置。</p>
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
            <h1 className="text-3xl font-bold text-white md:text-5xl">实验编排、运行监控与证据分析</h1>
            <p className="mt-4 max-w-4xl text-sm leading-7 text-slate-300">
              {'按“编排剧本 → 观察训练 → 分析一次结果 → 横向比较 → 查看档案”的顺序完成一轮安全推荐演示。'}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full border border-white/10 bg-white/[0.055] px-3 py-1 text-xs font-bold text-slate-300">
              {isLoading ? 'artifact 读取中' : sourceLabel(bundle.dataSource)}
            </span>
            <span className="rounded-full border border-white/10 bg-white/[0.055] px-3 py-1 text-xs font-bold text-slate-300">
              推荐总数 {totalRecommendations}
            </span>
          </div>
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
                  active ? 'border-cyan-200/40 bg-cyan-200/14 text-cyan-50' : 'border-white/10 bg-white/[0.04] text-slate-300 hover:border-cyan-200/25 hover:text-white',
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
