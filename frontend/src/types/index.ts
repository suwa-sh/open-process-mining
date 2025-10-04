export interface Analysis {
  analysis_id: string;
  analysis_name: string;
  process_type: string | null;
  created_at: string;
}

export interface NodeData {
  label: string;
  frequency: number;
}

export interface Node {
  id: string;
  type: string;
  data: NodeData;
  position?: { x: number; y: number };
}

export interface EdgeData {
  frequency: number;
  avg_waiting_time_hours: number;
}

export interface Edge {
  id: string;
  source: string;
  target: string;
  data: EdgeData;
  label?: string;
  hidden?: boolean;
}

export interface AnalysisResult {
  nodes: Node[];
  edges: Edge[];
  lead_time_stats?: LeadTimeStats;
}

export type DisplayMetric = "frequency" | "performance";

export type FilterMode = "all" | "case_start" | "case_end";

export interface AnalyzeRequest {
  analysis_name: string;
  process_type: string;
  filter_mode: FilterMode;
  date_from?: string;
  date_to?: string;
}

export interface AnalyzeResponse {
  analysis_id: string;
  analysis_name: string;
  process_type: string;
  created_at: string;
  event_count: number;
  case_count: number;
  node_count: number;
  edge_count: number;
  cached: boolean;
  filter_applied: {
    mode: FilterMode;
    date_from?: string;
    date_to?: string;
  };
}

export interface PreviewResponse {
  event_count: number;
  case_count: number;
  date_range: {
    min: string | null;
    max: string | null;
  };
  filter_applied: {
    mode: FilterMode;
    date_from?: string;
    date_to?: string;
  };
}

export interface LeadTimeStats {
  case_count: number;
  lead_time_hours: {
    min: number | null;
    max: number | null;
    median: number | null;
  };
  happy_path?: {
    case_count: number;
    lead_time_hours: {
      min: number | null;
      max: number | null;
      median: number | null;
    };
    path: string[];
  };
}

// Organization Analysis Types

export type AggregationLevel = "employee" | "department";

export interface HandoverNode {
  id: string;
  label: string;
  activity_count: number;
}

export interface HandoverEdge {
  source: string;
  target: string;
  handover_count: number;
  avg_waiting_time_hours?: number;
}

export interface HandoverAnalysis {
  nodes: HandoverNode[];
  edges: HandoverEdge[];
  aggregation_level: AggregationLevel;
}

export interface WorkloadItem {
  resource_id: string;
  resource_name: string;
  activity_count: number;
  case_count: number;
}

export interface WorkloadAnalysis {
  workload: WorkloadItem[];
  aggregation_level: AggregationLevel;
}

export interface PerformanceItem {
  resource_id: string;
  resource_name: string;
  avg_duration_hours: number;
  median_duration_hours: number;
  total_duration_hours: number;
  activity_count: number;
}

export interface PerformanceAnalysis {
  performance: PerformanceItem[];
  aggregation_level: AggregationLevel;
}

export interface OrganizationAnalysisListItem {
  analysis_id: string;
  analysis_name: string;
  process_type: string;
  aggregation_level: AggregationLevel;
  created_at: string;
}

export interface OrganizationAnalysisDetail {
  analysis_id: string;
  analysis_name: string;
  process_type: string;
  aggregation_level: AggregationLevel;
  filter_mode: FilterMode;
  date_from: string | null;
  date_to: string | null;
  created_at: string;
  handover_data: HandoverAnalysis;
  workload_data: WorkloadAnalysis;
  performance_data: PerformanceAnalysis;
}
