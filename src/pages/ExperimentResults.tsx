import React, {useEffect, useState} from 'react';
import {BarChart3, Clock, FileText, ShieldCheck, Swords, TrendingUp} from 'lucide-react';
import {ScenarioMetricCard} from '../components/showcase/ScenarioMetricCard';
import {ShowcasePageHeader} from '../components/showcase/ShowcasePageHeader';
import {ShowcaseScenarioSelector} from '../components/showcase/ShowcaseScenarioSelector';
import {useShowcaseBundle} from '../hooks/useShowcaseBundle';
import {cn} from '../lib/utils';
import {formatMetricValue, formatPercentValue, getRecommendationCounts, summarizeArtifactValue} from '../lib/showcaseFormat';
import type {ConsoleSessionState} from '../types/common';
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

const tabs: Array<{
  id: ExperimentResultsView;
  label: string;
  description: string;
  icon: React.ComponentType<{className?: string}>;
}> = [
  {
    id: 'analysis',
    label: '单次结果',
    description: '复用现有单次实验分析页',
    icon: FileText,
  },
  {
    id: 'history',
    label: '历史实验',
    description: '复用现有历史实验管理页',
    icon: Clock,
  },
  {
    id: 'comparison',
    label: '横向对比',
    description: '复用现有对比分析页',
    icon: BarChart3,
  },
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
  const {bundle, isLoading, setSelectedScenarioId} = useShowcaseBundle();
  const report = bundle.report;
  const metrics = report.metricsSummary;
  const recommendationCounts = getRecommendationCounts(report.recommendationComparison);

  useEffect(() => {
    setActiveView(initialView);
  }, [initialView]);

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
    <div className="space-y-8 pb-12">
      <ShowcasePageHeader
        eyebrow="选拔赛展示链路"
        title="实验结果"
        description="整合 showcase 真实 artifact 摘要、单次结果、历史实验和横向对比，量化基线、攻击和防御效果。"
        chips={['metrics_summary / attack_defense_summary', 'privacy_risk_summary', '保留 Analysis / History / Comparison 原逻辑']}
        icon={BarChart3}
      />

      <ShowcaseScenarioSelector bundle={bundle} isLoading={isLoading} onScenarioChange={setSelectedScenarioId} />

      <section className="rounded-2xl border border-outline-variant/10 bg-surface-container-low p-6">
        <div className="mb-5 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
              <TrendingUp className="h-3.5 w-3.5" />
              实验结果总览
            </div>
            <h3 className="text-2xl font-bold text-on-surface">真实 artifact 摘要</h3>
            <p className="mt-2 max-w-4xl text-sm leading-6 text-on-surface-variant">
              顶部摘要优先读取 FedVLR-API showcase report；单次结果、历史实验、横向对比仍继续复用原有真实读取逻辑。
              当前数据来源：{bundle.dataSource === 'api' ? 'API artifact' : bundle.dataSource === 'mixed' ? 'API + fallback' : 'mock fallback'}。
            </p>
          </div>
          <div className="rounded-full border border-outline-variant/10 bg-surface-container-high px-3 py-1 text-xs font-bold text-on-surface-variant">
            {bundle.selectedScenario.scenarioId}
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <ScenarioMetricCard
            label="基线效果"
            value={formatMetricValue(metrics?.baseline?.recall50)}
            description={`NDCG@50 ${formatMetricValue(metrics?.baseline?.ndcg50)}，正常推荐列表作为对照。`}
            tone="primary"
          />
          <ScenarioMetricCard
            label="投毒 / 操纵影响"
            value={formatPercentValue(metrics?.recallDrop)}
            description={`Attack Recall@50 ${formatMetricValue(metrics?.attack?.recall50)}；target_hit_rate=0 时不写成攻击成功。`}
            tone="error"
          />
          <ScenarioMetricCard
            label="防御恢复"
            value={formatPercentValue(metrics?.recoveryRate)}
            description={`Defense Recall@50 ${formatMetricValue(metrics?.defense?.recall50)}，字段缺失时显示暂无 / 不适用。`}
            tone="tertiary"
          />
          <ScenarioMetricCard
            label="推荐对比"
            value={`${recommendationCounts.baseline}/${recommendationCounts.attack}/${recommendationCounts.defense}`}
            description="baseline / attack / defense 三组推荐摘要。"
            tone="secondary"
          />
        </div>
        <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-3">
          {[
            {label: '基线', icon: BarChart3, text: '正常客户端兴趣稳定保留', tone: 'text-primary'},
            {label: '攻击', icon: Swords, text: '观察异常推荐排名变化', tone: 'text-error'},
            {label: '防御', icon: ShieldCheck, text: '异常影响被削弱，结果恢复', tone: 'text-tertiary'},
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-3 rounded-xl bg-surface-container-high px-4 py-3">
              <item.icon className={cn('h-5 w-5', item.tone)} />
              <div>
                <p className="text-sm font-bold text-on-surface">{item.label}</p>
                <p className="text-xs text-on-surface-variant">{item.text}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-5 grid grid-cols-1 gap-3 lg:grid-cols-3">
          {[
            {label: 'attack_defense_summary', value: report.attackDefenseSummary},
            {label: 'privacy_risk_summary', value: report.privacyRiskSummary},
            {label: 'recommendation_comparison', value: report.recommendationComparison?.warnings?.length ? report.recommendationComparison.warnings : recommendationCounts},
          ].map((item) => (
            <div key={item.label} className="rounded-xl border border-outline-variant/10 bg-surface-container-high p-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">{item.label}</p>
              <p className="mt-2 break-words text-xs leading-5 text-on-surface">{summarizeArtifactValue(item.value)}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-outline-variant/10 bg-surface-container-low p-6">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {tabs.map((tab) => {
            const isActive = activeView === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveView(tab.id)}
                className={cn(
                  'flex items-start gap-3 rounded-xl border px-4 py-4 text-left transition-all',
                  isActive
                    ? 'border-primary/30 bg-primary/10 text-primary'
                    : 'border-outline-variant/10 bg-surface-container-high text-on-surface hover:border-primary/20 hover:text-primary',
                )}
              >
                <tab.icon className="mt-0.5 h-5 w-5 shrink-0" />
                <span>
                  <span className="block text-sm font-bold">{tab.label}</span>
                  <span className="mt-1 block text-xs text-on-surface-variant">{tab.description}</span>
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {renderActiveView()}

      <section className="rounded-2xl border border-primary/20 bg-primary/10 p-6">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-primary">下一步</p>
            <h3 className="mt-2 text-xl font-bold text-on-surface">交付报告</h3>
            <p className="mt-2 text-sm text-on-surface-variant">
              继续查看数据、机制、攻防、指标、限制和后续计划的选拔赛总结。
            </p>
          </div>
          <TrendingUp className="h-6 w-6 text-primary" />
        </div>
      </section>
    </div>
  );
};
