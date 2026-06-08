import {apiGet, apiPost} from './api';
import type {
  WorkbenchJobResponse,
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
