import React, {useEffect, useRef, useState} from 'react';
import {AlertTriangle, BarChart3, EyeOff, ShieldCheck, Swords, Target} from 'lucide-react';
import {FederatedTopology} from '../components/sandbox/FederatedTopology';
import {RecommendationComparisonBoard} from '../components/sandbox/RecommendationComparisonBoard';
import {SandboxControls} from '../components/sandbox/SandboxControls';
import {TargetRankStage} from '../components/sandbox/TargetRankStage';
import {useShowcaseBundle} from '../hooks/useShowcaseBundle';
import {EMPTY_VALUE, formatMetricValue, getBoundaryItems} from '../lib/showcaseFormat';

export const AttackDefenseRange: React.FC = () => {
  const {bundle, isLoading, setSelectedScenarioId} = useShowcaseBundle();
  const [defenseActive, setDefenseActive] = useState(true);
  const autoSelectedRef = useRef(false);
  const {report, selectedScenario} = bundle;
  const boundaryItems = getBoundaryItems(report, selectedScenario);
  const v25 = report.v25Summary;
  const targetEntry = report.targetRankSummary?.entries[0];
  const targetRankBefore = v25?.targetRankBefore ?? targetEntry?.baselineRank ?? 170;
  const targetRankAfter = v25?.targetRankAfter ?? targetEntry?.attackRank ?? 3;
  const maskedTopkHit = v25?.maskedTopkHitRate ?? report.targetRankSummary?.targetHitRate ?? report.metricsSummary?.targetHitRate ?? 0;

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

  const keyConclusions = [
    {label: '目标排序', value: `${targetRankBefore} -> ${targetRankAfter}`, tone: 'text-rose-100', icon: Target},
    {label: '最终推荐曝光', value: maskedTopkHit === 0 ? '未命中' : '以 artifact 为准', tone: 'text-amber-100', icon: EyeOff},
    {label: '交互还原 hit@50', value: formatMetricValue(v25?.interactionReconstructionHit50), tone: 'text-cyan-100', icon: BarChart3},
    {label: '成员推断 AUC', value: formatMetricValue(v25?.miaAuc), tone: 'text-violet-100', icon: BarChart3},
    {label: '安全聚合残差', value: v25?.secAggResidual === 0 ? '≈0' : formatMetricValue(v25?.secAggResidual), tone: 'text-emerald-100', icon: ShieldCheck},
  ];

  return (
    <div className="space-y-6 pb-10">
      <section className="sandbox-panel sandbox-glow rounded-[32px] p-6">
        <div className="mb-5 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-rose-200/30 bg-rose-200/10 px-3 py-1 text-xs font-bold text-rose-100">
              <Swords className="h-3.5 w-3.5" />
              攻防实验
            </div>
            <h1 className="text-3xl font-bold text-white md:text-5xl">三步观察一次安全推荐攻防</h1>
            <p className="mt-4 max-w-4xl text-sm leading-7 text-slate-300">
              先选择实验剧本，再观察联邦拓扑中的正常更新、恶意投毒和防御过滤，最后查看目标排序、最终曝光和推荐列表变化。
            </p>
          </div>
          <span className="rounded-full border border-white/10 bg-white/[0.055] px-3 py-1 text-xs font-bold text-slate-300">
            {bundle.dataSource === 'api' ? 'API artifact' : bundle.dataSource === 'mixed' ? 'API + fallback' : 'mock fallback'}
          </span>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          {['选择实验剧本', '观察攻防过程', '查看推荐与指标变化'].map((step, index) => (
            <div key={step} className="rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-3">
              <p className="text-xs font-bold text-cyan-100">0{index + 1}</p>
              <p className="mt-1 font-semibold text-slate-50">{step}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-[300px_minmax(0,1fr)_300px]">
        <SandboxControls
          bundle={bundle}
          isLoading={isLoading}
          onScenarioChange={setSelectedScenarioId}
          defenseActive={defenseActive}
          onDefenseActiveChange={setDefenseActive}
        />

        <div className="space-y-5">
          <FederatedTopology mode="exercise" defenseActive={defenseActive} className="min-h-[520px]" />
          <TargetRankStage report={report} />
        </div>

        <aside className="sandbox-panel rounded-[24px] p-5">
          <div className="mb-5">
            <p className="text-xs font-bold tracking-[0.2em] text-cyan-100/75">关键结论</p>
            <h3 className="mt-2 text-xl font-bold text-white">只看最重要的五项</h3>
          </div>
          <div className="space-y-3">
            {keyConclusions.map((item) => (
              <div key={item.label} className="rounded-2xl border border-white/10 bg-white/[0.052] p-4">
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <item.icon className={`h-4 w-4 ${item.tone}`} />
                  {item.label}
                </div>
                <p className={`mt-2 text-2xl font-bold ${item.tone}`}>{item.value || EMPTY_VALUE}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-2xl border border-amber-200/25 bg-amber-200/10 p-4 text-sm leading-6 text-amber-50">
            target_hit_rate=0 或 masked Top50 hit 为 0 时，结论写“最终曝光未命中”，不写成攻击成功。
          </div>
        </aside>
      </section>

      <RecommendationComparisonBoard comparison={report.recommendationComparison} />

      <section className="sandbox-panel rounded-[28px] p-5">
        <div className="mb-4 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-100" />
          <h3 className="text-xl font-bold text-white">实验边界</h3>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {boundaryItems.slice(0, 6).map((item) => (
            <div key={item} className="rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-3 text-sm leading-6 text-slate-300">
              {item}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
