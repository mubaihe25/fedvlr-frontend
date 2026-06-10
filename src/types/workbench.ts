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

export interface WorkbenchExecutionModeOption {
  id: 'existing_artifact' | 'real_smoke' | 'probe_smoke' | string;
  label: string;
  description?: string;
  source?: string;
}

export interface WorkbenchParameterDescriptor {
  type: string;
  label: string;
  min?: number;
  max?: number;
  step?: number;
  default?: number | string | boolean | Array<string | number>;
  unit?: string;
  options?: Array<string | number>;
  depends_on?: string[];
  visible_when?: Record<string, unknown>;
  disabled_when?: Record<string, unknown>;
  help_text?: string;
}

export interface WorkbenchExecutionCapability {
  status?: string;
  allowed_execution_modes?: string[];
  message?: string;
}

export interface WorkbenchTargetItemOption {
  item_id: string;
  raw_item_id?: string | null;
  raw_title?: string | null;
  title: string;
  short_title?: string;
  display_name_zh?: string | null;
  short_name_zh?: string | null;
  category?: string | null;
  category_zh?: string | null;
  image_url?: string | null;
  thumbnail_url?: string | null;
  is_target_sidecar?: boolean;
}

export interface WorkbenchOptionsResponse {
  source?: string;
  schema_version?: string;
  directions: WorkbenchDirectionOption[];
  execution_modes?: WorkbenchExecutionModeOption[];
  datasets: WorkbenchDatasetOption[];
  models: WorkbenchModelOption[];
  adapter_required_models?: WorkbenchModelOption[];
  aggregation_visibility_modes?: Array<Record<string, unknown>>;
  robust_aggregators: string[];
  direction_parameters?: Record<string, string[]>;
  defense_parameters?: Record<string, string[]>;
  compatibility_matrix?: Record<string, string[]>;
  model_dataset_execution?: Record<string, Record<string, WorkbenchExecutionCapability>>;
  parameter_descriptors?: Record<string, WorkbenchParameterDescriptor>;
  bounds?: Record<string, number | number[] | string>;
  defaults?: Record<string, number | boolean | string>;
  target_items: WorkbenchTargetItemOption[];
  notes?: string[];
}

export interface WorkbenchPayload {
  direction: string;
  execution_mode: 'existing_artifact' | 'real_smoke' | 'probe_smoke';
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
  seed?: number;
  top_k?: number;
  aggregation_mode: 'plain_updates' | 'secure_aggregation';
  robust_aggregators: string[];
  dp_noise_enabled: boolean;
  dp_noise_std: number;
  noise_multiplier?: number;
  max_grad_norm?: number;
  target_delta?: number;
  dp_seed?: number;
  batch_size?: number;
  base_attack?: string;
  anomaly_client_ratio?: number;
  perturbation_type?: string;
  perturbation_strength?: number;
  gradient_clip_norm?: number;
  trim_ratio?: number;
  trim_min_keep?: number;
  krum_f?: number;
  multi_krum_enabled?: boolean;
  median_clip_norm?: number;
  coordinate_median?: boolean;
  outlier_strategy?: string;
  distance_metric?: string;
  bulyan_f?: number;
  bulyan_selection_ratio?: number;
  target_item_id?: string;
  target_item_title?: string;
  attack_strength?: string;
  injection_ratio?: number;
  max_injections_per_client?: number;
  target_loss_weight?: number;
  target_rank_selector?: string;
  preserve_topk?: boolean;
  candidate_k?: number;
  candidate_pool_size?: number;
  risk_modality?: string;
  update_input_source?: string;
  similarity_method?: string;
  show_candidate_images?: boolean;
  hit_k?: number;
  client_count?: number;
  mia_evidence_source?: string;
  mia_model?: string;
  label_source?: string;
  threshold_strategy?: string;
  membership_sample_count?: number;
  member_nonmember_ratio?: number;
  export_pair_scores?: boolean;
  export_reconstruction?: boolean;
  save_topk: boolean;
  export_artifact: boolean;
}

export interface WorkbenchValidationResponse {
  source?: string;
  valid: boolean;
  status: string;
  warnings: string[];
  errors: string[];
  field_errors?: Record<string, string[]>;
  normalized_config?: Record<string, unknown>;
  expected_outputs?: string[];
  disabled_reason?: string;
  error_message?: string;
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
  dataset?: string | null;
  model?: string | null;
  execution_mode?: string | null;
  requested_execution_mode?: string | null;
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

export interface WorkbenchJobListItem {
  job_id: string;
  direction?: string | null;
  dataset?: string | null;
  model?: string | null;
  execution_mode?: string | null;
  requested_execution_mode?: string | null;
  source?: string | null;
  status?: string | null;
  created_at?: string | null;
  started_at?: string | null;
  finished_at?: string | null;
  key_metrics?: Record<string, unknown>;
  result_dir?: string | null;
  artifact_dir?: string | null;
}

export interface WorkbenchJobListResponse {
  items: WorkbenchJobListItem[];
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}
