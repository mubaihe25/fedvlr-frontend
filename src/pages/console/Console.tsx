import React from 'react';
import type {StartTrainResponse} from '../../services/train';
import type {ConsoleSessionState, PageType} from '../../types/common';
import type {TrainConfig} from '../../types/train';
import {Analysis} from './Analysis';
import {Comparison} from './Comparison';
import {Configuration} from './Configuration';
import {History} from './History';
import {Monitoring} from './Monitoring';

interface ConsoleProps {
  currentPage: PageType;
  onPageChange: (page: PageType) => void;
  session: ConsoleSessionState;
  onDraftConfigChange: (config: TrainConfig) => void;
  onStartTrain: (config: TrainConfig) => Promise<StartTrainResponse>;
  onOpenAnalysis: (taskId: string | null) => void;
  onAddComparisonSelection: (taskId: string) => void;
  onReuseConfig: (config: TrainConfig, taskId: string | null) => void;
}

export const Console: React.FC<ConsoleProps> = ({
  currentPage,
  session,
  onDraftConfigChange,
  onStartTrain,
  onOpenAnalysis,
  onAddComparisonSelection,
  onReuseConfig,
}) => {
  switch (currentPage) {
    case 'console':
      return (
        <Configuration
          draftConfig={session.draftTrainConfig}
          onDraftConfigChange={onDraftConfigChange}
          onStartTrain={onStartTrain}
        />
      );
    case 'monitoring':
      return <Monitoring activeTaskId={session.activeTaskId} onOpenAnalysis={onOpenAnalysis} />;
    case 'analysis':
      return <Analysis taskId={session.analysisTaskId ?? session.activeTaskId} />;
    case 'comparison':
      return <Comparison comparisonSelectionIds={session.comparisonSelectionIds} />;
    case 'history':
      return (
        <History
          comparisonSelectionIds={session.comparisonSelectionIds}
          onOpenAnalysis={onOpenAnalysis}
          onAddComparisonSelection={onAddComparisonSelection}
          onReuseConfig={onReuseConfig}
        />
      );
    default:
      return (
        <Configuration
          draftConfig={session.draftTrainConfig}
          onDraftConfigChange={onDraftConfigChange}
          onStartTrain={onStartTrain}
        />
      );
  }
};
