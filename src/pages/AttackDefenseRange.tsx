import React, {useEffect, useRef, useState} from 'react';
import {AlertTriangle, ShieldCheck, Swords} from 'lucide-react';
import {AuditSparklines} from '../components/sandbox/AuditSparklines';
import {FederatedTopology} from '../components/sandbox/FederatedTopology';
import {RecommendationComparisonBoard} from '../components/sandbox/RecommendationComparisonBoard';
import {SandboxControls} from '../components/sandbox/SandboxControls';
import {TargetRankStage} from '../components/sandbox/TargetRankStage';
import {ModelCapabilityMatrix} from '../components/showcase/ModelCapabilityMatrix';
import {useShowcaseBundle} from '../hooks/useShowcaseBundle';
import {getBoundaryItems} from '../lib/showcaseFormat';

export const AttackDefenseRange: React.FC = () => {
  const {bundle, isLoading, setSelectedScenarioId} = useShowcaseBundle();
  const [defenseActive, setDefenseActive] = useState(true);
  const autoSelectedRef = useRef(false);
  const {report, selectedScenario} = bundle;
  const boundaryItems = getBoundaryItems(report, selectedScenario);

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

  return (
    <div className="space-y-6 pb-10">
      <section className="rounded-[28px] border border-slate-700/50 bg-slate-900/40 p-5 backdrop-blur-md">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-rose-300/30 bg-rose-300/10 px-3 py-1 text-xs font-bold text-rose-100">
              <Swords className="h-3.5 w-3.5" />
              数字化联邦推荐攻防沙盘
            </div>
            <h1 className="text-3xl font-bold text-white md:text-5xl">攻防沙盘演练中心</h1>
            <p className="mt-3 max-w-4xl text-sm leading-7 text-slate-300">
              API 优先读取 showcase artifacts，展示客户端投毒流、隐私风险、鲁棒防御、target rank 推进、实时指标曲线和三列推荐商品对照。
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs font-bold">
            <span className="rounded-full border border-cyan-300/30 bg-cyan-300/10 px-3 py-1 text-cyan-100">
              {bundle.dataSource === 'api' ? 'API artifact' : bundle.dataSource === 'mixed' ? 'API + fallback' : 'Mock fallback'}
            </span>
            <span className="rounded-full border border-amber-300/30 bg-amber-300/10 px-3 py-1 text-amber-100">
              target_hit_rate=0 不写成攻击成功
            </span>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-[320px_minmax(0,1fr)_320px]">
        <SandboxControls
          bundle={bundle}
          isLoading={isLoading}
          onScenarioChange={setSelectedScenarioId}
          defenseActive={defenseActive}
          onDefenseActiveChange={setDefenseActive}
        />

        <div className="space-y-5">
          <FederatedTopology mode="exercise" defenseActive={defenseActive} className="min-h-[560px]" />
          <TargetRankStage report={report} />
        </div>

        <AuditSparklines report={report} />
      </section>

      <RecommendationComparisonBoard comparison={report.recommendationComparison} />

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(360px,0.9fr)]">
        <ModelCapabilityMatrix matrix={report.modelCapabilityMatrix} />
        <div className="rounded-[24px] border border-slate-700/50 bg-slate-900/40 p-5 backdrop-blur-md">
          <div className="mb-4 flex items-center gap-3">
            <ShieldCheck className="h-5 w-5 text-emerald-200" />
            <h3 className="text-xl font-bold text-white">边界审计</h3>
          </div>
          <div className="space-y-3">
            {boundaryItems.slice(0, 8).map((item) => (
              <div key={item} className="flex items-start gap-3 rounded-2xl border border-slate-700/50 bg-slate-950/45 px-4 py-3 text-sm leading-6 text-slate-300">
                <AlertTriangle className="mt-1 h-4 w-4 shrink-0 text-amber-200" />
                <p>{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};
