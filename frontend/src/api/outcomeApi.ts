/**
 * Outcome analysis API client
 */

import axios from 'axios';
import type {
  MetricInfo,
  OutcomeAnalysisSummary,
  OutcomeAnalysisDetail,
  CreateOutcomeAnalysisParams,
} from '../types/outcome';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

/**
 * プロセスタイプ一覧を取得
 */
export const fetchProcessTypes = async (): Promise<string[]> => {
  const response = await axios.get<string[]>(`${API_BASE_URL}/process-types`);
  return response.data;
};

/**
 * 利用可能なメトリック一覧を取得
 */
export const fetchAvailableMetrics = async (processType: string): Promise<MetricInfo[]> => {
  const response = await axios.get<MetricInfo[]>(`${API_BASE_URL}/outcome/metrics`, {
    params: { process_type: processType },
  });
  return response.data;
};

/**
 * 成果分析結果の一覧を取得
 */
export const fetchOutcomeAnalyses = async (
  processType?: string,
  metricName?: string
): Promise<OutcomeAnalysisSummary[]> => {
  const response = await axios.get<OutcomeAnalysisSummary[]>(`${API_BASE_URL}/outcome/analyses`, {
    params: {
      process_type: processType,
      metric_name: metricName,
    },
  });
  return response.data;
};

/**
 * 特定の成果分析結果を取得
 */
export const fetchOutcomeAnalysisById = async (
  analysisId: string
): Promise<OutcomeAnalysisDetail> => {
  const response = await axios.get<OutcomeAnalysisDetail>(
    `${API_BASE_URL}/outcome/analyses/${analysisId}`
  );
  return response.data;
};

/**
 * 成果分析を作成
 */
export const createOutcomeAnalysis = async (
  params: CreateOutcomeAnalysisParams
): Promise<{ analysis_id: string }> => {
  const response = await axios.post<{ analysis_id: string }>(
    `${API_BASE_URL}/outcome/analyze`,
    params
  );
  return response.data;
};
