import type {TrainConfig} from './train';

export type PageType = 'home' | 'console' | 'monitoring' | 'analysis' | 'comparison' | 'history' | 'architecture';

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

export interface ConsoleSessionState {
  activeTaskId: Nullable<string>;
  draftTrainConfig: TrainConfig;
  comparisonSelectionIds: string[];
  analysisTaskId: Nullable<string>;
}
