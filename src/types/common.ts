import type {LaunchExperimentRecord, TrainConfig} from './train';

export type PageType =
  | 'home'
  | 'systemMechanism'
  | 'architecture'
  | 'dataFusion'
  | 'clientPersonalization'
  | 'attackDefenseRange'
  | 'resultsEvidence'
  | 'experimentResults'
  | 'deliveryReport'
  | 'console'
  | 'monitoring'
  | 'analysis'
  | 'comparison'
  | 'history';

export type Nullable<T> = T | null;

export type AsyncState = 'idle' | 'loading' | 'success' | 'empty' | 'error';

export type StatusBadgeType =
  | 'neutral'
  | 'info'
  | 'success'
  | 'warning'
  | 'danger'
  | 'primary'
  | 'secondary'
  | 'tertiary';

export interface SelectOption<T extends string = string> {
  value: T;
  label: string;
  description?: string;
  disabled?: boolean;
}

export interface ChartPoint {
  label?: string;
  value?: number;
  epoch?: number;
  round?: number;
  [key: string]: string | number | undefined;
}

export interface CardItem {
  title: string;
  value: string;
  description?: string;
  trend?: string;
  tone?: StatusBadgeType;
}

export type ConsoleExperimentContextSource = 'recent_launch' | 'history_record' | 'validate_only' | 'mock';

export interface ConsoleExperimentContext {
  source: ConsoleExperimentContextSource;
  taskId: Nullable<string>;
  experimentKey: Nullable<string>;
  launchId: Nullable<string>;
  dataSourceLabel: string;
  analysisLockedToHistory: boolean;
  monitoringLockedToRecentLaunch: boolean;
  updatedAt: string;
}

export interface ConsoleSessionState {
  activeTaskId: Nullable<string>;
  draftTrainConfig: TrainConfig;
  comparisonSelectionIds: string[];
  analysisTaskId: Nullable<string>;
  lastLaunchRecord: Nullable<LaunchExperimentRecord>;
  currentExperimentContext: ConsoleExperimentContext;
}
