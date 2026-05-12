import React, {useEffect, useState} from 'react';
import {BarChart3, Clock, FileText} from 'lucide-react';
import {cn} from '../lib/utils';
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
