import {apiGet, apiPost} from './api';
import type {
  WorkbenchJobResponse,
  WorkbenchJobListResponse,
  WorkbenchJobStatusResponse,
  WorkbenchLogsResponse,
  WorkbenchOptionsResponse,
  WorkbenchPayload,
  WorkbenchResultResponse,
  WorkbenchValidationResponse,
} from '../types/workbench';

export const fetchWorkbenchOptions = () => apiGet<WorkbenchOptionsResponse>('/workbench/options');

export const validateWorkbenchConfig = (payload: WorkbenchPayload) =>
  apiPost<WorkbenchValidationResponse>('/workbench/validate', payload);

export const createWorkbenchJob = (payload: WorkbenchPayload) =>
  apiPost<WorkbenchJobResponse>('/workbench/jobs', payload);

export const fetchWorkbenchJob = (jobId: string) => apiGet<WorkbenchJobStatusResponse>(`/workbench/jobs/${encodeURIComponent(jobId)}`);

export const fetchWorkbenchLogs = (jobId: string, tail = 200) =>
  apiGet<WorkbenchLogsResponse>(`/workbench/jobs/${encodeURIComponent(jobId)}/logs?tail=${tail}`);

export const fetchWorkbenchResult = (jobId: string) =>
  apiGet<WorkbenchResultResponse>(`/workbench/jobs/${encodeURIComponent(jobId)}/result`);

export interface WorkbenchJobListQuery {
  limit?: number;
  page?: number;
  direction?: string;
  dataset?: string;
  model?: string;
  source?: string;
  status?: string;
  date_from?: string;
  date_to?: string;
}

export const fetchWorkbenchJobs = (query: WorkbenchJobListQuery = {}) => {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).trim()) {
      params.set(key, String(value));
    }
  });
  const suffix = params.toString() ? `?${params.toString()}` : '';
  return apiGet<WorkbenchJobListResponse>(`/workbench/jobs${suffix}`);
};
