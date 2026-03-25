import type {ChartPoint, StatusBadgeType} from './common';
import type {TrainConfigSummary} from './train';

export type TaskLifecycleStatus = 'idle' | 'queued' | 'running' | 'completed' | 'stopped' | 'failed';

export type TaskStage =
  | 'preparing'
  | 'synchronizing'
  | 'training'
  | 'aggregating'
  | 'evaluating'
  | 'completed'
  | 'stopped'
  | 'failed';

export type TaskLogLevel = 'info' | 'success' | 'warning' | 'error';

export interface TaskLogItem {
  id: string;
  timestamp: string;
  level: TaskLogLevel;
  message: string;
  source?: string;
}

export interface TaskOverviewItem {
  label: string;
  value: string;
  mono?: boolean;
  tone?: StatusBadgeType;
}

export interface TaskMetricBar {
  label: string;
  displayValue: string;
  value: number;
  percent: number;
  tone: StatusBadgeType;
}

export interface TaskChartMetric {
  name: string;
  value: number;
}

export interface TaskProgress {
  taskId: string;
  status: TaskLifecycleStatus;
  currentRound: number;
  totalRounds: number;
  elapsedTime: string;
  currentStage: TaskStage;
  currentGroupIndex: number | null;
  totalGroups: number | null;
  currentGroupName: string | null;
  progressPercent: number;
  logs: TaskLogItem[];
}

export interface TaskStatusResponse extends TaskProgress {
  statusLabel: string;
  statusMessage: string;
  overviewItems: TaskOverviewItem[];
  metricBars: TaskMetricBar[];
  lossCurve: ChartPoint[];
  metricChart: TaskChartMetric[];
  configSummary: TrainConfigSummary;
}

export interface StopTaskResponse {
  success: boolean;
  taskId: string;
  status: TaskLifecycleStatus;
  message: string;
}
