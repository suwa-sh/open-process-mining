/**
 * Outcome analysis types
 */

export interface MetricInfo {
  metric_name: string;
  metric_unit: string;
  sample_count: number;
}

export interface OutcomeAnalysisSummary {
  analysis_id: string;
  analysis_name: string;
  process_type: string;
  metric_name: string;
  analysis_type: string;
  created_at: string;
}

export interface OutcomeStats {
  avg: number;
  median: number;
  total: number;
  min: number;
  max: number;
  count: number;
}

export interface OutcomeEdgeData {
  frequency: number;
  avg_waiting_time_hours: number;
  outcome_stats?: {
    [metricName: string]: OutcomeStats;
  };
}

export interface OutcomeAnalysisDetail {
  analysis_id: string;
  analysis_name: string;
  process_type: string;
  metric_name: string;
  analysis_type: string;
  filter_config?: Record<string, any>;
  result_data: {
    nodes: any[];
    edges: any[];
    summary: {
      total_cases: number;
      metrics: string[];
      overall_stats: OutcomeStats;
      top_paths: Array<{
        source: string;
        target: string;
        avg_outcome: number;
      }>;
    };
  };
  created_at: string;
}

export interface CreateOutcomeAnalysisParams {
  analysis_name: string;
  process_type: string;
  metric_name: string;
  analysis_type?: string;
  filter_config?: Record<string, any>;
  date_from?: string;
  date_to?: string;
}
