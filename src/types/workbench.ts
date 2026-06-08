export interface WorkbenchDirectionOption {
  id: string;
  label: string;
  default_dataset?: string;
  default_model?: string;
  default_scenario_id?: string;
}

export interface WorkbenchDatasetOption {
  id: string;
  label: string;
  short_label?: string;
  modalities?: string[];
}

export interface WorkbenchModelOption {
  id: string;
  label: string;
  status?: 'smoke_supported' | 'partial' | 'validate_only' | 'adapter_required' | string;
  datasets?: string[];
}

export interface WorkbenchTargetItemOption {
  item_id: string;
  raw_item_id?: string | null;
  title: string;
  short_title?: string;
  category?: string | null;
  image_url?: string | null;
  is_target_sidecar?: boolean;
}

export interface WorkbenchOptionsResponse {
  source?: string;
  schema_version?: string;
  directions: WorkbenchDirectionOption[];
  datasets: WorkbenchDatasetOption[];
  models: WorkbenchModelOption[];
  adapter_required_models?: WorkbenchModelOption[];
  aggregation_visibility_modes?: Array<Record<string, unknown>>;
  robust_aggregators: string[];
  bounds?: Record<string, number | number[] | string>;
  defaults?: Record<string, number | boolean | string>;
  target_items: WorkbenchTargetItemOption[];
  notes?: string[];
}

export interface WorkbenchPayload {
  direction: string;
  scenario_id?: string;
  dataset: string;
  model: string;
  total_rounds: number;
  local_epochs: number;
  client_sampling_ratio: number;
  malicious_client_ratio: number;
  learning_rate: number;
  weight_decay: number;
  gradient_clip: number;
  aggregation_mode: 'plain_updates' | 'secure_aggregation';
  robust_aggregators: string[];
  dp_noise_enabled: boolean;
  dp_noise_std: number;
  trim_ratio?: number;
  krum_f?: number;
  bulyan_f?: number;
  target_item_id?: string;
  target_item_title?: string;
  attack_strength?: string;
  injection_ratio?: number;
  max_injections_per_client?: number;
  candidate_k?: number;
  risk_modality?: string;
  mia_evidence_source?: string;
  membership_sample_count?: number;
  save_topk: boolean;
  export_artifact: boolean;
}

export interface WorkbenchValidationResponse {
  source?: string;
  valid: boolean;
  status: string;
  warnings: string[];
  errors: string[];
  normalized_config?: Record<string, unknown>;
  expected_outputs?: string[];
  disabled_reason?: string;
}

export interface WorkbenchJobResponse extends WorkbenchValidationResponse {
  job_id?: string;
  job_status?: string;
  stage?: string;
  progress?: number;
  job_dir?: string;
  files?: Record<string, string>;
  pid?: number;
  launch_enabled?: boolean;
  message?: string;
}

export interface WorkbenchJobStatusResponse {
  job_id: string;
  status?: string | null;
  stage?: string | null;
  progress?: number | null;
  valid?: boolean;
  created_at?: string | null;
  updated_at?: string | null;
  started_at?: string | null;
  finished_at?: string | null;
  direction?: string | null;
  scenario_id?: string | null;
  message?: string | null;
  disabled_reason?: string | null;
  error_message?: string | null;
  result_dir?: string | null;
  artifact_dir?: string | null;
  source?: string | null;
  warnings: string[];
  errors: string[];
  config_summary?: Record<string, unknown>;
}

export interface WorkbenchLogsResponse {
  job_id: string;
  tail: number;
  lines: string[];
  has_more: boolean;
}

export interface WorkbenchResultResponse {
  job_id: string;
  status?: string | null;
  stage?: string | null;
  source?: string | null;
  result_pointer?: Record<string, unknown>;
  metrics_summary?: Record<string, unknown>;
  message?: string | null;
}
