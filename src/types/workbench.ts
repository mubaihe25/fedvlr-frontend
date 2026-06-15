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
  id: 'full_train' | string;
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
  option_labels?: Record<string, string>;
  value_map?: Record<string, number>;
  dynamic_max?: string;
  max_items?: number;
  depends_on?: string[];
  visible_when?: Record<string, unknown>;
  disabled_when?: Record<string, unknown>;
  help_text?: string;
}

export interface WorkbenchExecutionCapability {
  status?: string;
  allowed_execution_modes?: string[];
  supported_directions?: string[];
  verification_status?: string;
  verified_directions?: string[];
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
  common_parameters?: string[];
  fixed_parameters?: Record<string, number | string | boolean>;
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
  execution_mode: 'full_train';
  experiment_name?: string;
  started_at?: string;
  scenario_id?: string;
  dataset: string;
  model: string;
  total_rounds: number;
  local_epochs: number;
  client_sampling_ratio: number;
  malicious_client_ratio?: number;
  learning_rate: number;
  weight_decay: number;
  gradient_clip: number;
  seed?: number;
  top_k: 50;
  total_client_count?: number;
  aggregation_mode: 'plain_updates' | 'secure_aggregation';
  robust_aggregators: string[];
  dp_noise_enabled: boolean;
  dp_noise_std: number;
  noise_multiplier?: number;
  max_grad_norm?: number;
  target_delta?: number;
  dp_seed?: number;
  batch_size?: number;
  num_workers?: number;
  pin_memory?: boolean;
  persistent_workers?: boolean;
  prefetch_factor?: number;
  amp_enabled?: boolean;
  cache_item_features_on_device?: boolean;
  non_blocking_transfer?: boolean;
  reuse_client_model_workspace?: boolean;
  base_attack?: string;
  anomaly_client_ratio?: number;
  perturbation_type?: string;
  perturbation_strength?: number;
  gradient_clip_norm?: number;
  outlier_strategy?: string;
  trim_ratio?: number;
  trim_min_keep?: number;
  krum_f?: number;
  multi_krum_enabled?: boolean;
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
  failure_stage?: string | null;
  error_summary?: string | null;
  error_detail?: string | null;
  actual_tensor_shapes?: Record<string, unknown> | string | null;
  model_expected_shapes?: Record<string, unknown> | string | null;
  return_code?: number | null;
  forward_preflight?: Record<string, unknown> | null;
}

export interface WorkbenchJobResponse extends WorkbenchValidationResponse {
  job_id?: string;
  experiment_name?: string;
  started_at?: string;
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
  experiment_name?: string | null;
  status?: string | null;
  stage?: string | null;
  progress?: number | null;
  progress_detail?: WorkbenchProgressDetail | null;
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
  error_summary?: string | null;
  error_detail?: string | null;
  failure_stage?: string | null;
  runner_pid?: number | null;
  pid?: number | null;
  return_code?: number | null;
  subprocess_command?: string | string[] | null;
  python_path?: string | null;
  cwd?: string | null;
  result_dir?: string | null;
  artifact_dir?: string | null;
  source?: string | null;
  warnings: string[];
  errors: string[];
  config_summary?: Record<string, unknown>;
  actual_tensor_shapes?: Record<string, unknown> | string | null;
  model_expected_shapes?: Record<string, unknown> | string | null;
  forward_preflight?: Record<string, unknown> | null;
  epoch_metrics?: Record<string, WorkbenchEpochMetric[]>;
  gpu_stats?: WorkbenchGpuStats;
  performance_summary?: Record<string, unknown> | null;
}

export interface WorkbenchProgressDetail {
  phase: string;
  phase_label: string;
  current_epoch: number;
  total_epochs: number;
  current_client: number;
  total_clients: number;
  completed_clients: number;
  percent: number;
  updated_at?: string | null;
  elapsed_seconds?: number | null;
  estimated_remaining_seconds?: number | null;
  failure_phase?: string | null;
}

export interface WorkbenchEpochMetric {
  epoch?: number;
  total_epochs?: number;
  loss?: number | null;
  valid?: Record<string, number> | null;
  test?: Record<string, number> | null;
  recorded_at?: number;
}

export interface WorkbenchGpuSample {
  timestamp?: string | null;
  utilization_gpu: number;
  memory_used: number;
  memory_total: number;
  power_draw: number;
  temperature: number;
}

export interface WorkbenchGpuStats {
  available: boolean;
  samples: WorkbenchGpuSample[];
  latest?: WorkbenchGpuSample | null;
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
  progress_detail?: WorkbenchProgressDetail | null;
  epoch_metrics?: Record<string, WorkbenchEpochMetric[]>;
  gpu_stats?: WorkbenchGpuStats;
  performance_summary?: Record<string, unknown> | null;
  result?: Record<string, unknown>;
  warnings?: string[];
  missing_evidence?: string[];
  failure_stage?: string | null;
  error_summary?: string | null;
  error_detail?: string | null;
  message?: string | null;
  actual_tensor_shapes?: Record<string, unknown> | string | null;
  model_expected_shapes?: Record<string, unknown> | string | null;
}

export interface WorkbenchJobListItem {
  job_id: string;
  experiment_name?: string | null;
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
  failure_stage?: string | null;
  error_summary?: string | null;
  error_detail?: string | null;
  return_code?: number | null;
  key_metrics?: Record<string, unknown>;
  result_dir?: string | null;
  artifact_dir?: string | null;
  actual_tensor_shapes?: Record<string, unknown> | string | null;
  model_expected_shapes?: Record<string, unknown> | string | null;
  forward_preflight?: Record<string, unknown> | null;
}

export interface WorkbenchJobListResponse {
  items: WorkbenchJobListItem[];
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}
