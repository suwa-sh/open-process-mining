import axios from 'axios';
import {
  Analysis,
  AnalysisResult,
  AnalyzeRequest,
  AnalyzeResponse,
  PreviewResponse,
  LeadTimeStats,
  HandoverAnalysis,
  WorkloadAnalysis,
  PerformanceAnalysis,
  AggregationLevel,
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getAnalyses = async (processType?: string): Promise<Analysis[]> => {
  const params = processType ? { process_type: processType } : {};
  const response = await apiClient.get('/analyses', { params });
  return response.data;
};

export const getProcessTypes = async (): Promise<string[]> => {
  const response = await apiClient.get('/process-types');
  return response.data;
};

export const getAnalysisById = async (id: string): Promise<AnalysisResult> => {
  const response = await apiClient.get(`/analyses/${id}`);
  return response.data;
};

export const compareAnalyses = async (beforeId: string, afterId: string): Promise<AnalysisResult> => {
  const response = await apiClient.get(`/compare?before=${beforeId}&after=${afterId}`);
  return response.data;
};

export const createAnalysis = async (request: AnalyzeRequest): Promise<AnalyzeResponse> => {
  const response = await apiClient.post('/analyze', request);
  return response.data;
};

export const getAnalysisPreview = async (
  processType: string,
  filterMode: string = 'all',
  dateFrom?: string,
  dateTo?: string
): Promise<PreviewResponse> => {
  const params: any = { process_type: processType, filter_mode: filterMode };
  if (dateFrom) params.date_from = dateFrom;
  if (dateTo) params.date_to = dateTo;

  const response = await apiClient.get('/preview', { params });
  return response.data;
};

export const getLeadTimeStats = async (
  processType: string,
  filterMode: string = 'all',
  dateFrom?: string,
  dateTo?: string
): Promise<LeadTimeStats> => {
  const params: any = { process_type: processType, filter_mode: filterMode };
  if (dateFrom) params.date_from = dateFrom;
  if (dateTo) params.date_to = dateTo;

  const response = await apiClient.get('/lead-time-stats', { params });
  return response.data;
};

// Organization Analysis APIs

export const getHandoverAnalysis = async (
  processType: string,
  aggregationLevel: AggregationLevel = 'employee',
  filterMode: string = 'all',
  dateFrom?: string,
  dateTo?: string
): Promise<HandoverAnalysis> => {
  const params: any = {
    process_type: processType,
    aggregation_level: aggregationLevel,
    filter_mode: filterMode,
  };
  if (dateFrom) params.date_from = dateFrom;
  if (dateTo) params.date_to = dateTo;

  const response = await apiClient.get('/organization/handover', { params });
  return response.data;
};

export const getWorkloadAnalysis = async (
  processType: string,
  aggregationLevel: AggregationLevel = 'employee',
  filterMode: string = 'all',
  dateFrom?: string,
  dateTo?: string
): Promise<WorkloadAnalysis> => {
  const params: any = {
    process_type: processType,
    aggregation_level: aggregationLevel,
    filter_mode: filterMode,
  };
  if (dateFrom) params.date_from = dateFrom;
  if (dateTo) params.date_to = dateTo;

  const response = await apiClient.get('/organization/workload', { params });
  return response.data;
};

export const getPerformanceAnalysis = async (
  processType: string,
  aggregationLevel: AggregationLevel = 'employee',
  filterMode: string = 'all',
  dateFrom?: string,
  dateTo?: string
): Promise<PerformanceAnalysis> => {
  const params: any = {
    process_type: processType,
    aggregation_level: aggregationLevel,
    filter_mode: filterMode,
  };
  if (dateFrom) params.date_from = dateFrom;
  if (dateTo) params.date_to = dateTo;

  const response = await apiClient.get('/organization/performance', { params });
  return response.data;
};

// Organization Analysis (Saved Results)
export const createOrganizationAnalysis = async (data: {
  analysis_name: string;
  process_type: string;
  aggregation_level: string;
  filter_mode: string;
  date_from?: string;
  date_to?: string;
}) => {
  const response = await apiClient.post('/organization/analyze', data);
  return response.data;
};

export const getOrganizationAnalyses = async (processType?: string) => {
  const params = processType ? { process_type: processType } : {};
  const response = await apiClient.get('/organization/analyses', { params });
  return response.data;
};

export const getOrganizationAnalysisById = async (analysisId: string) => {
  const response = await apiClient.get(`/organization/analyses/${analysisId}`);
  return response.data;
};
