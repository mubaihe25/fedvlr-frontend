export type ShowcaseDataSource = 'api' | 'mock' | 'mixed';

export type ShowcaseJsonRecord = Record<string, unknown>;

export interface ShowcaseScenario {
  id: string;
  scenarioId: string;
  name: string;
  dataset?: string | null;
  model?: string | null;
  tags?: string[];
  warnings?: string[];
  dataSource: Extract<ShowcaseDataSource, 'api' | 'mock'>;
  unavailable?: boolean | null;
  notAvailable?: boolean | null;
  smoke?: boolean | null;
  proxy?: boolean | null;
  demo?: boolean | null;
  demoOnly?: boolean | null;
  raw?: ShowcaseJsonRecord;
}

export interface ShowcaseDatasetProfile {
  dataset?: string | null;
  name?: string | null;
  source?: string | null;
  users?: string | number | null;
  items?: string | number | null;
  interactions?: string | number | null;
  train?: string | number | null;
  valid?: string | number | null;
  test?: string | number | null;
  sparsity?: string | number | null;
  modalities?: string[];
  textFeatureMethod?: string | null;
  imageFeatureMethod?: string | null;
  note?: string | null;
  warnings?: string[];
  raw?: ShowcaseJsonRecord;
}

export interface ShowcaseMetricSet {
  recall50?: number | null;
  ndcg50?: number | null;
  [key: string]: unknown;
}

export interface ShowcaseMetricsSummary {
  baseline?: ShowcaseMetricSet | null;
  attack?: ShowcaseMetricSet | null;
  defense?: ShowcaseMetricSet | null;
  recallDrop?: number | null;
  ndcgDrop?: number | null;
  recoveryRate?: number | null;
  targetHitRate?: number | null;
  warnings?: string[];
  unavailable?: boolean | null;
  raw?: ShowcaseJsonRecord;
}

export interface ShowcaseRecommendationItem {
  rank?: number | null;
  itemId?: string | number | null;
  title?: string | null;
  category?: string | null;
  imageUrl?: string | null;
  score?: number | null;
  reason?: string | null;
  mainModality?: string | null;
  status?: string | null;
  rankChange?: string | number | null;
  raw?: ShowcaseJsonRecord;
}

export interface ShowcaseRecommendationComparison {
  baseline: ShowcaseRecommendationItem[];
  attack: ShowcaseRecommendationItem[];
  defense: ShowcaseRecommendationItem[];
  warnings?: string[];
  unavailable?: boolean | null;
  raw?: ShowcaseJsonRecord;
}

export interface ShowcaseTargetRankEntry {
  itemId?: string | number | null;
  title?: string | null;
  baselineRank?: number | null;
  attackRank?: number | null;
  defenseRank?: number | null;
  rankGain?: number | null;
  scoreGain?: number | null;
  targetHitRate?: number | null;
  inTop50?: boolean | null;
  raw?: ShowcaseJsonRecord;
}

export interface ShowcaseTargetRankSummary {
  entries: ShowcaseTargetRankEntry[];
  targetHitRate?: number | null;
  note?: string | null;
  warnings?: string[];
  unavailable?: boolean | null;
  raw?: ShowcaseJsonRecord;
}

export interface ShowcaseDefenseTrace {
  totalClients?: number | null;
  maliciousClients?: number | null;
  clippedClients?: number | null;
  filteredClients?: number | null;
  trimmedUpdates?: number | null;
  aggregationRule?: string | null;
  notes?: string[];
  krumSelected?: Array<string | number>;
  krumRejected?: Array<string | number>;
  trimmedMean?: unknown;
  median?: unknown;
  dpNoise?: unknown;
  secureAggSim?: unknown;
  unavailable?: boolean | null;
  warnings?: string[];
  raw?: ShowcaseJsonRecord;
}

export interface ShowcaseReport {
  scenarioId: string;
  title?: string | null;
  dataset?: string | null;
  model?: string | null;
  datasetProfile?: ShowcaseDatasetProfile | null;
  metricsSummary?: ShowcaseMetricsSummary | null;
  attackDefenseSummary?: unknown;
  privacyRiskSummary?: unknown;
  recommendationComparison?: ShowcaseRecommendationComparison | null;
  targetRankSummary?: ShowcaseTargetRankSummary | null;
  defenseTrace?: ShowcaseDefenseTrace | null;
  security?: unknown;
  privacy?: unknown;
  delivery?: unknown;
  warnings?: string[];
  boundaries?: string[];
  unavailable?: boolean | null;
  notAvailable?: boolean | null;
  smoke?: boolean | null;
  proxy?: boolean | null;
  demo?: boolean | null;
  demoOnly?: boolean | null;
  raw?: ShowcaseJsonRecord;
}

export interface ShowcaseFetchResult<T> {
  source: Extract<ShowcaseDataSource, 'api' | 'mock'>;
  data: T;
  error?: string;
}

export interface ShowcaseBundle {
  scenarios: ShowcaseScenario[];
  selectedScenario: ShowcaseScenario;
  report: ShowcaseReport;
  dataSource: ShowcaseDataSource;
  scenarioSource: Extract<ShowcaseDataSource, 'api' | 'mock'>;
  fallbackReason?: string;
  fetchedAt: string;
}
