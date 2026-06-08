export type ShowcaseDataSource = 'api' | 'mock' | 'mixed';

export type ShowcaseJsonRecord = Record<string, unknown>;

export interface ShowcaseScenario {
  id: string;
  scenarioId: string;
  name: string;
  displayName?: string | null;
  dataset?: string | null;
  model?: string | null;
  tags?: string[];
  warnings?: string[];
  dataSource: Extract<ShowcaseDataSource, 'api' | 'mock'>;
  isDisplayReady?: boolean | null;
  hasRecommendations?: boolean | null;
  hasPrivacy?: boolean | null;
  hasMetrics?: boolean | null;
  hasImages?: boolean | null;
  hasV3?: boolean | null;
  availablePanels?: string[];
  supportedDirections?: string[];
  hasRuntime?: boolean | null;
  hasCurves?: boolean | null;
  hasTargetManipulation?: boolean | null;
  hasMembership?: boolean | null;
  hasUpdateLeakage?: boolean | null;
  hasAggregationDefense?: boolean | null;
  hasPrivacyDefense?: boolean | null;
  hasModelSupport?: boolean | null;
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
  thumbnailUrl?: string | null;
  localImageUrl?: string | null;
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
  totalCounts?: Record<string, number>;
  hasMore?: Record<string, boolean>;
  limit?: number | null;
  warnings?: string[];
  unavailable?: boolean | null;
  raw?: ShowcaseJsonRecord;
}

export interface ShowcaseTargetRankEntry {
  itemId?: string | number | null;
  title?: string | null;
  category?: string | null;
  thumbnailUrl?: string | null;
  localImageUrl?: string | null;
  imageUrl?: string | null;
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

export interface ShowcaseModelCapabilityRow {
  model?: string | null;
  dataset?: string | null;
  capability?: string | null;
  status?: 'supported' | 'partial' | 'unsupported' | 'future_adapter' | 'not_tested' | string | null;
  evidence?: string | null;
  reason?: string | null;
  recommendedDemoUsage?: string | null;
  raw?: ShowcaseJsonRecord;
}

export interface ShowcaseModelSmokeEvidence {
  key: string;
  model?: string | null;
  dataset?: string | null;
  canonicalModel?: string | null;
  status?: string | null;
  verificationLevel?: string | null;
  smokeStatus?: string | null;
  topkExportVerified?: boolean | null;
  metricsExportVerified?: boolean | null;
  securityArtifactReady?: boolean | null;
  reason?: string | null;
  failureReason?: string | null;
  smokeResultDir?: string | null;
  raw?: ShowcaseJsonRecord;
}

export interface ShowcaseModelCapabilityMatrix {
  entries: ShowcaseModelCapabilityRow[];
  supportedDemos: ShowcaseModelCapabilityRow[];
  unsupportedReasons: ShowcaseModelCapabilityRow[];
  statusCounts?: Record<string, number>;
  recommendedFrontendLabels?: Record<string, unknown>;
  smokeVerifiedModels?: string[];
  partialSmokeVerifiedModels?: string[];
  validateOnlyModels?: string[];
  adapterRequiredModels?: string[];
  failedSmokeModels?: string[];
  modelSmokeEvidence?: Record<string, ShowcaseModelSmokeEvidence>;
  recommendedShowcaseModels?: ShowcaseJsonRecord;
  warnings?: string[];
  raw?: ShowcaseJsonRecord;
}

export interface ShowcaseV25Summary {
  targetRankBefore?: number | null;
  targetRankAfter?: number | null;
  rankMove?: number | null;
  scoreGain?: number | null;
  maskedTopkHitRate?: number | null;
  interactionReconstructionHit10?: number | null;
  interactionReconstructionHit20?: number | null;
  interactionReconstructionHit50?: number | null;
  interactionReconstructionStatus?: string | null;
  miaAuc?: number | null;
  secAggResidual?: number | null;
  opacusStatus?: string | null;
  opacusBoundary?: string | null;
  warnings?: string[];
  raw?: ShowcaseJsonRecord;
}

export type ShowcaseV3PanelName =
  | 'profile'
  | 'runtime'
  | 'curves'
  | 'target-manipulation'
  | 'membership'
  | 'update-leakage'
  | 'aggregation-defense'
  | 'privacy-defense'
  | 'model-support'
  | 'frontend-summary';

export interface ShowcaseV3RuntimeEvent {
  round?: string | number | null;
  step?: string | number | null;
  time?: string | null;
  type?: string | null;
  message: string;
  raw?: ShowcaseJsonRecord;
}

export interface ShowcaseV3RuntimePanel {
  events: ShowcaseV3RuntimeEvent[];
  currentRound?: number | null;
  totalRounds?: number | null;
  clientCount?: number | null;
  maliciousClientRatio?: number | null;
  defenseStrategy?: string | null;
  status?: string | null;
  raw?: ShowcaseJsonRecord;
}

export interface ShowcaseV3CurvesPanel {
  curveSource?: 'summary_curve' | 'real_points' | string | null;
  loss?: number[];
  recallAt50?: number[];
  ndcgAt50?: number[];
  attackRisk?: number[];
  defenseRecovery?: number[];
  raw?: ShowcaseJsonRecord;
}

export interface ShowcaseV3TargetManipulationPanel {
  targetItem?: ShowcaseRecommendationItem | null;
  baselineUnmaskedRank?: number | null;
  attackUnmaskedRank?: number | null;
  rankGain?: number | null;
  normalizedRankGain?: number | null;
  reciprocalRankGain?: number | null;
  attackTopkHit?: boolean | null;
  targetManipulationIndex?: number | null;
  recommendationJaccard?: number | null;
  changedUserCount?: number | null;
  changedItemCount?: number | null;
  raw?: ShowcaseJsonRecord;
}

export interface ShowcaseV3MembershipPanel {
  auc?: number | null;
  accuracy?: number | null;
  precision?: number | null;
  recall?: number | null;
  f1?: number | null;
  scoreGap?: number | null;
  memberCount?: number | null;
  nonMemberCount?: number | null;
  evidenceType?: string | null;
  anonymizedExamples?: unknown[];
  raw?: ShowcaseJsonRecord;
}

export interface ShowcaseV3UpdateLeakagePanel {
  hit10?: number | null;
  hit20?: number | null;
  hit50?: number | null;
  highestRiskModality?: string | null;
  candidateItems?: ShowcaseRecommendationItem[];
  modalityRiskBreakdown?: ShowcaseJsonRecord | null;
  updateNormSummary?: ShowcaseJsonRecord | null;
  raw?: ShowcaseJsonRecord;
}

export interface ShowcaseV3AggregationDefensePanel {
  defenseAlgorithm?: string | null;
  aggregationVisibility?: string | null;
  selectedClients?: Array<string | number>;
  rejectedClients?: Array<string | number>;
  outlierScoreSummary?: ShowcaseJsonRecord | null;
  recallBefore?: number | null;
  recallAfter?: number | null;
  ndcgBefore?: number | null;
  ndcgAfter?: number | null;
  recoveryRate?: number | null;
  status?: string | null;
  raw?: ShowcaseJsonRecord;
}

export interface ShowcaseV3PrivacyDefensePanel {
  formalDpAvailable?: boolean | null;
  dpNoise?: unknown;
  secureAggregation?: unknown;
  status?: string | null;
  raw?: ShowcaseJsonRecord;
}

export interface ShowcaseV3Report {
  scenarioId?: string | null;
  profile?: ShowcaseDatasetProfile | null;
  runtime?: ShowcaseV3RuntimePanel | null;
  curves?: ShowcaseV3CurvesPanel | null;
  targetManipulation?: ShowcaseV3TargetManipulationPanel | null;
  membership?: ShowcaseV3MembershipPanel | null;
  updateLeakage?: ShowcaseV3UpdateLeakagePanel | null;
  aggregationDefense?: ShowcaseV3AggregationDefensePanel | null;
  privacyDefense?: ShowcaseV3PrivacyDefensePanel | null;
  modelSupport?: ShowcaseModelCapabilityMatrix | null;
  frontendSummary?: ShowcaseJsonRecord | null;
  availablePanels?: string[];
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
  modelCapabilityMatrix?: ShowcaseModelCapabilityMatrix | null;
  v25Summary?: ShowcaseV25Summary | null;
  v3?: ShowcaseV3Report | null;
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
