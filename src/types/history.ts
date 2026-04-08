import type {SelectOption} from './common';
import type {ExperimentMetrics, ResultConfigSummary} from './result';
import type {AttackType, DefenseType, ExperimentMode, TrainConfig} from './train';

export type HistoryStatus = 'completed' | 'failed' | 'stopped';

export interface HistoryKeyParams {
  learningRate: number;
  clientSamplingRate: number;
  localEpochs: number;
  totalRounds: number;
  clientCount: number;
  privacyBudget?: number | null;
  optimizer?: string;
  poisoningRatio?: number;
}

export interface HistoryRecord {
  id: string;
  taskId: string;
  name: string;
  createdAt: string;
  dataset: string;
  model: string;
  mode: ExperimentMode;
  attackType: AttackType;
  defenseType: DefenseType;
  keyParams: HistoryKeyParams;
  metrics: Partial<ExperimentMetrics> & {
    accuracy?: number;
    loss?: number;
    f1Score?: number;
    privacyBudget?: number;
  };
  status: HistoryStatus;
  errorMessage?: string;
  config: TrainConfig;
  configSummary: ResultConfigSummary;
  summary?: string;
  previewBars: number[];
}

export interface HistoryListResponse {
  records: HistoryRecord[];
  total: number;
}

export interface ExperimentSummaryListItem {
  experiment_key: string;
  file_name: string;
  relative_path: string;
  experiment_id?: string | null;
  model?: string | null;
  dataset?: string | null;
  experiment_mode?: string | null;
  scenario_tags?: string[];
  active_attacks?: string[];
  active_defenses?: string[];
  active_privacy_metrics?: string[];
  final_eval?: {
    recall20?: number | null;
    ndcg20?: number | null;
    loss?: number | null;
    extra?: Record<string, unknown>;
  };
}

export interface ExperimentSummaryListResponse {
  count: number;
  items: ExperimentSummaryListItem[];
}

export interface ExperimentRoundPipelineInfo {
  active_attacks?: string[];
  active_defenses?: string[];
  active_privacy_metrics?: string[];
  experiment_mode?: string | null;
  scenario_tags?: string[];
  malicious_client_count?: number | null;
}

export interface ExperimentRoundSummary {
  round_id: number;
  num_participants?: number | null;
  avg_train_loss?: number | null;
  valid_score?: number | null;
  test_score?: number | null;
  malicious_client_count?: number | null;
  attacked_client_count?: number | null;
  clipped_client_count?: number | null;
  pipeline_info?: ExperimentRoundPipelineInfo;
}

export interface ExperimentMaliciousClientSummary {
  enabled?: boolean;
  mode?: string | null;
  ratio?: number | null;
  configured_client_ids?: string[];
  unique_malicious_clients?: string[];
  unique_malicious_client_count?: number | null;
  rounds_with_malicious_clients?: number | null;
  max_round_malicious_client_count?: number | null;
}

export interface ExperimentSummaryDetail {
  experiment_id?: string | null;
  model?: string | null;
  dataset?: string | null;
  experiment_mode?: string | null;
  scenario_tags?: string[];
  active_attacks?: string[];
  active_defenses?: string[];
  active_privacy_metrics?: string[];
  malicious_client_summary?: ExperimentMaliciousClientSummary;
  final_eval?: {
    recall20?: number | null;
    ndcg20?: number | null;
    loss?: number | null;
    extra?: Record<string, unknown>;
  };
  round_summaries?: ExperimentRoundSummary[];
}

export interface ExperimentSummaryResponse {
  experiment_key: string;
  file_name: string;
  relative_path: string;
  summary: ExperimentSummaryDetail;
}

export interface HistoryFilters {
  period: string;
  model: string;
  mode: string;
  keyword: string;
}

export interface HistoryFilterOptions {
  periods: SelectOption[];
  models: SelectOption[];
  modes: SelectOption[];
}

export interface ReuseHistoryResponse {
  success: boolean;
  id: string;
  taskId: string | null;
  config: TrainConfig;
  message: string;
}
