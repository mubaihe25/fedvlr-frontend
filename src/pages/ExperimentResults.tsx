import React, {useEffect, useState} from 'react';
import {BarChart3, Clock, FileText, ShieldCheck, Swords, TrendingUp} from 'lucide-react';
import {ScenarioMetricCard} from '../components/showcase/ScenarioMetricCard';
import {cn} from '../lib/utils';
import {attackDefenseCases} from '../mock/showcase';
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

const formatMetric = (value: number) => value.toFixed(4);
const formatPercent = (value: number) => `${Math.round(value * 100)}%`;

export const ExperimentResults: React.FC<ExperimentResultsProps> = ({
  initialView,
  session,
  onOpenAnalysis,
  onAddComparisonSelection,
  onOpenComparison,
  onReuseConfig,
}) => {
  const [activeView, setActiveView] = useState<ExperimentResultsView>(initialView);
  const showcaseCase = attackDefenseCases[0];

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
      <section className="rounded-2xl border border-outline-variant/10 bg-surface-container-low p-8">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
          <BarChart3 className="h-3.5 w-3.5" />
          结果、历史与对比聚合
        </div>
        <h2 className="font-headline text-4xl font-bold tracking-tight text-on-surface">实验结果</h2>
        <p className="mt-4 max-w-4xl text-sm leading-7 text-on-surface-variant">
          整合现有单次结果分析、历史实验和横向对比能力。本页仅调整入口和承载结构，结果读取逻辑继续复用原有页面与 services。
        </p>
      </section>

      <section className="rounded-2xl border border-outline-variant/10 bg-surface-container-low p-6">
        <div className="mb-5 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
              <TrendingUp className="h-3.5 w-3.5" />
              实验结果总览
            </div>
            <h3 className="text-2xl font-bold text-on-surface">Showcase 攻防摘要</h3>
            <p className="mt-2 max-w-4xl text-sm leading-6 text-on-surface-variant">
              以下摘要来自 showcase 示例数据，用于串联攻防靶场与结果页。单次结果、历史实验、横向对比仍继续复用原有真实读取逻辑。
            </p>
          </div>
          <div className="rounded-full border border-outline-variant/10 bg-surface-container-high px-3 py-1 text-xs font-bold text-on-surface-variant">
            {showcaseCase.caseId}
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <ScenarioMetricCard
            label="基线效果"
            value={formatMetric(showcaseCase.baselineMetrics.recall50)}
            description={`NDCG@50 ${formatMetric(showcaseCase.baselineMetrics.ndcg50)}，正常推荐列表作为对照。`}
            tone="primary"
          />
          <ScenarioMetricCard
            label="投毒影响"
            value={formatPercent(showcaseCase.attackImpact.recallDrop)}
            description={`Attack Recall@50 ${formatMetric(showcaseCase.attackMetrics.recall50)}，异常物品进入 Top-K。`}
            tone="error"
          />
          <ScenarioMetricCard
            label="防御恢复"
            value={formatPercent(showcaseCase.recoveryRate)}
            description={`Defense Recall@50 ${formatMetric(showcaseCase.defenseMetrics.recall50)}，正常推荐部分回升。`}
            tone="tertiary"
          />
          <ScenarioMetricCard
            label="对比分析"
            value="3 组"
            description="基线、攻击、防御三组指标和推荐列表可横向解释。"
            tone="secondary"
          />
        </div>
        <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-3">
          {[
            {label: '基线', icon: BarChart3, text: '正常客户端兴趣稳定保留', tone: 'text-primary'},
            {label: '攻击', icon: Swords, text: '异常推荐被推入前列', tone: 'text-error'},
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
      </section>

      <section className="rounded-2xl border border-outline-variant/10 bg-surface-container-low p-8">
        <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-3">
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
    </div>
  );
};
