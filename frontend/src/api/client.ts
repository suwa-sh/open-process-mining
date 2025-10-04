import axios from 'axios';
import { Analysis, AnalysisResult, AnalyzeRequest, AnalyzeResponse, PreviewResponse, LeadTimeStats } from '../types';

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
