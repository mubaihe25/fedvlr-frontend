import React, {useEffect, useState} from 'react';
import {Activity, BarChart3, Clock, FileText, Grid2X2, ShieldCheck, Swords} from 'lucide-react';
import {ModelCapabilityMatrix} from '../components/showcase/ModelCapabilityMatrix';
import {ScenarioMetricCard} from '../components/showcase/ScenarioMetricCard';
import {V25ArtifactSummary} from '../components/showcase/V25ArtifactSummary';
import {useShowcaseBundle} from '../hooks/useShowcaseBundle';
import {formatMetricValue, formatPlainValue} from '../lib/showcaseFormat';
import {cn} from '../lib/utils';
import {loadShowcaseBundle} from '../services/showcase';
import type {ConsoleSessionState} from '../types/common';
import type {ShowcaseReport} from '../types/showcase';
import type {TrainConfig} from '../types/train';
import {Analysis} from './console/Analysis';
import {Comparison} from './console/Comparison';
import {History} from './console/History';

export type ExperimentResultsView = 'analysis' | 'history' | 'comparison';

interface ExperimentResultsProps {
  initialView: ExperimentResultsView;
  session: ConsoleSessionState;
  onOpenAnalysis: (taskId: string | null) => void;
  onAddComparisonSelection: (taskId: string) => void;
  onOpenComparison: () => void;
  onReuseConfig: (config: TrainConfig, taskId: string | null) => void;
}

const tabs: Array<{id: ExperimentResultsView; label: string; description: string; icon: React.ComponentType<{className?: string}>}> = [
  {id: 'analysis', label: '单次分析', description: '复用开发者控制台的单次结果分析。', icon: FileText},
  {id: 'history', label: '历史实验', description: '查看历史实验、CSV 和配置复用。', icon: Clock},
  {id: 'comparison', label: '横向对比', description: '多实验指标对照。', icon: BarChart3},
];

export const ExperimentResults: React.FC<ExperimentResultsProps> = ({
  initialView,
  session,
  onOpenAnalysis,
  onAddComparisonSelection,
  onOpenComparison,
  onReuseConfig,
}) => {
  const [activeView, setActiveView] = useState<ExperimentResultsView>(initialView);
  const {bundle} = useShowcaseBundle();
  const [v25Report, setV25Report] = useState<ShowcaseReport | null>(null);
  const [matrixReport, setMatrixReport] = useState<ShowcaseReport | null>(null);
  const report = bundle.report;
  const v25 = v25Report?.v25Summary ?? report.v25Summary;
  const matrix = matrixReport?.modelCapabilityMatrix ?? report.modelCapabilityMatrix;

  useEffect(() => {
    setActiveView(initialView);
  }, [initialView]);

  useEffect(() => {
    let active = true;
    Promise.all([
      loadShowcaseBundle('amazon_beauty_poc_v25_backend_smoke'),
      loadShowcaseBundle('model_security_capability_matrix'),
    ])
      .then(([v25Bundle, matrixBundle]) => {
        if (!active) return;
        setV25Report(v25Bundle.report);
        setMatrixReport(matrixBundle.report);
      })
      .catch(() => {
        if (!active) return;
        setV25Report(null);
        setMatrixReport(null);
      });

    return () => {
      active = false;
    };
  }, []);

  const handleOpenComparison = () => {
    setActiveView('comparison');
    onOpenComparison();
  };

  const renderActiveView = () => {
    switch (activeView) {
      case 'history':
        return (
          <History
            comparisonSelectionIds={session.comparisonSelectionIds}
            onOpenAnalysis={onOpenAnalysis}
            onAddComparisonSelection={onAddComparisonSelection}
            onOpenComparison={handleOpenComparison}
            onReuseConfig={onReuseConfig}
          />
        );
      case 'comparison':
        return <Comparison comparisonSelectionIds={session.comparisonSelectionIds} />;
      case 'analysis':
      default:
        return (
          <Analysis
            taskId={session.analysisTaskId ?? session.activeTaskId}
            lastLaunchRecord={session.lastLaunchRecord}
            experimentContext={session.currentExperimentContext}
          />
        );
    }
  };

  return (
    <div className="space-y-6 pb-10">
      <section className="rounded-[28px] border border-slate-700/50 bg-slate-900/40 p-6 backdrop-blur-md">
        <div className="mb-6 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-300/30 bg-cyan-300/10 px-3 py-1 text-xs font-bold text-cyan-100">
              <Activity className="h-3.5 w-3.5" />
              真实 artifact 摘要
            </div>
            <h1 className="text-3xl font-bold text-white md:text-5xl">实验结果总览</h1>
            <p className="mt-3 max-w-4xl text-sm leading-7 text-slate-300">
              汇总 KU 主攻防结果、Amazon target rank、隐私风险、SecAgg demo、Opacus 边界和模型能力矩阵。下方仍保留 Analysis / History / Comparison 开发者视图。
            </p>
          </div>
          <span className="rounded-full border border-slate-700/60 bg-slate-950/50 px-3 py-1 text-xs font-bold text-slate-300">
            {bundle.dataSource === 'api' ? 'API artifact' : bundle.dataSource === 'mixed' ? 'API + fallback' : 'Mock fallback'}
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-6">
          <ScenarioMetricCard label="KU 主攻防" value={formatMetricValue(report.metricsSummary?.baseline?.recall50)} description="MMFedRAP + KU 是多模态展示主模型。" tone="primary" />
          <ScenarioMetricCard
            label="Amazon 排序推进"
            value={v25?.targetRankBefore && v25.targetRankAfter ? `${v25.targetRankBefore} -> ${v25.targetRankAfter}` : '170 -> 3'}
            description="FedAvg + Amazon 单场景观测，不能泛化到所有模型。"
            tone="error"
          />
          <ScenarioMetricCard
            label="交互候选还原"
            value={[
              formatMetricValue(v25?.interactionReconstructionHit10),
              formatMetricValue(v25?.interactionReconstructionHit20),
              formatMetricValue(v25?.interactionReconstructionHit50),
            ].join(' / ')}
            description="hit@10 / hit@20 / hit@50；缺失按暂无显示。"
            tone="secondary"
          />
          <ScenarioMetricCard label="MIA AUC" value={formatMetricValue(v25?.miaAuc)} description="成员推断攻击代理指标。" tone="secondary" />
          <ScenarioMetricCard label="SecAgg residual" value={formatMetricValue(v25?.secAggResidual)} description="安全聚合 demo，不是生产级协议。" tone="tertiary" />
          <ScenarioMetricCard label="Opacus" value={formatPlainValue(v25?.opacusStatus)} description="formal DP 属后续工作，不写成已实现。" tone="neutral" />
        </div>
      </section>

      <section className="rounded-[28px] border border-slate-700/50 bg-slate-900/40 p-5 backdrop-blur-md">
        <div className="mb-4 flex items-center gap-3">
          <Grid2X2 className="h-5 w-5 text-cyan-200" />
          <h2 className="text-xl font-bold text-white">模型能力矩阵说明</h2>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          {[
            ['已支持', 'validated / displayable with evidence'],
            ['部分支持', '可展示但需要边界说明'],
            ['暂不支持', '当前组合无完整证据'],
            ['后续适配', '需要模型或导出适配器'],
          ].map(([label, text]) => (
            <div key={label} className="rounded-2xl border border-slate-700/50 bg-slate-950/45 p-4">
              <p className="font-bold text-slate-50">{label}</p>
              <p className="mt-2 text-xs leading-5 text-slate-400">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <ModelCapabilityMatrix matrix={matrix} />
      <V25ArtifactSummary summary={v25} />

      <section className="rounded-[24px] border border-slate-700/50 bg-slate-900/40 p-5 backdrop-blur-md">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {tabs.map((tab) => {
            const isActive = activeView === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveView(tab.id)}
                className={cn(
                  'flex items-start gap-3 rounded-2xl border px-4 py-4 text-left transition-all',
                  isActive
                    ? 'border-cyan-300/40 bg-cyan-300/10 text-cyan-100'
                    : 'border-slate-700/50 bg-slate-950/45 text-slate-300 hover:border-cyan-300/30',
                )}
              >
                <tab.icon className="mt-0.5 h-5 w-5 shrink-0" />
                <span>
                  <span className="block text-sm font-bold">{tab.label}</span>
                  <span className="mt-1 block text-xs text-slate-400">{tab.description}</span>
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {renderActiveView()}
    </div>
  );
};
