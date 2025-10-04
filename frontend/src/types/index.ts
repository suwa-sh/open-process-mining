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

export type DisplayMetric = 'frequency' | 'performance';

export type FilterMode = 'all' | 'case_start' | 'case_end';

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
