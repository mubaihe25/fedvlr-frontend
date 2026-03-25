import type {ChartPoint, StatusBadgeType} from './common';
import type {AttackType, DefenseType, ExperimentMode, TrainConfigSummary} from './train';

export type ResultSource = 'current-task' | 'history' | 'example';

export interface ExperimentMetrics {
  recall10: number;
  recall20: number;
  recall50: number;
  ndcg10: number;
  ndcg20: number;
  ndcg50: number;
  accuracy?: number;
  loss?: number;
  defenseScore?: number;
  convergenceRound?: number;
}

export type MetricKey = keyof ExperimentMetrics;

export interface CurveSeries {
  key: string;
  label: string;
  color: string;
  points: ChartPoint[];
}

export interface ResultConfigSummary extends TrainConfigSummary {
  dataset: string;
  model: string;
  clientCount: number;
  clientSamplingRate: number;
  totalRounds: number;
  learningRate: number;
  localEpochs: number;
}

export interface ResultMetricCard {
  label: string;
  value: string;
  change: string;
  tone: StatusBadgeType;
}

export interface ResultSummaryText {
  headline: string;
  conclusion: string;
  securityAssessment: string;
  recommendation: string;
}

export interface ResultReferenceComparison {
  title: string;
  description: string;
}

export interface ExperimentResult {
  taskId: string;
  source: ResultSource;
  timestamp: string;
  dataset: string;
  model: string;
  mode: ExperimentMode;
  attackType: AttackType;
  defenseType: DefenseType;
  metrics: ExperimentMetrics;
  metricCards: ResultMetricCard[];
  curves: {
    loss: CurveSeries;
    utility: CurveSeries[];
  };
  configSummary: ResultConfigSummary;
  summaryText: ResultSummaryText;
  defenseEfficiencyScore: number;
  defenseEfficiencyLabel: string;
  referenceComparison?: ResultReferenceComparison;
}

export interface ComparisonGroup {
  id: string;
  taskId: string;
  name: string;
  status: string;
  accent: StatusBadgeType;
  attackLabel: string;
  defenseLabel: string;
  metrics: ExperimentMetrics;
}

export interface ComparisonMetricDatum {
  name: string;
  recall: number;
  ndcg: number;
  loss: number;
}

export interface ComparisonStage {
  stage: string;
  status: string;
  tone: StatusBadgeType;
}

export interface ConfigDiffItem {
  label: string;
  baseline: string;
  attack: string;
  defense: string;
}

export interface ComparisonResult {
  groups: ComparisonGroup[];
  summary: string;
  findings: string[];
  metricComparison: ComparisonMetricDatum[];
  configDiff: ConfigDiffItem[];
  stages: ComparisonStage[];
}
