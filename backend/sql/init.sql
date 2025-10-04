-- Initialize database schema

-- Create analysis_results table
CREATE TABLE IF NOT EXISTS analysis_results (
    analysis_id UUID PRIMARY KEY,
    analysis_name VARCHAR(255) NOT NULL,
    process_type VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    result_data JSONB NOT NULL
);

-- Create index on created_at for sorting
CREATE INDEX IF NOT EXISTS idx_analysis_results_created_at ON analysis_results(created_at DESC);

-- Create index on process_type for filtering
CREATE INDEX IF NOT EXISTS idx_analysis_results_process_type ON analysis_results(process_type);

-- Create organization_analysis_results table
CREATE TABLE IF NOT EXISTS organization_analysis_results (
    analysis_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    analysis_name VARCHAR(255) NOT NULL,
    process_type VARCHAR(100) NOT NULL,
    aggregation_level VARCHAR(50) NOT NULL,
    filter_mode VARCHAR(50) NOT NULL,
    date_from TIMESTAMP,
    date_to TIMESTAMP,
    handover_data JSONB NOT NULL,
    workload_data JSONB NOT NULL,
    performance_data JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for organization_analysis_results
CREATE INDEX IF NOT EXISTS idx_org_analysis_created_at ON organization_analysis_results(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_org_analysis_process_type ON organization_analysis_results(process_type);

-- Create outcome_analysis_results table
CREATE TABLE IF NOT EXISTS outcome_analysis_results (
    analysis_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    analysis_name VARCHAR(255) NOT NULL,
    process_type VARCHAR(100) NOT NULL,
    metric_name VARCHAR(100) NOT NULL,
    analysis_type VARCHAR(50) NOT NULL,
    filter_config JSONB,
    result_data JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for outcome_analysis_results
CREATE INDEX IF NOT EXISTS idx_outcome_analysis_created_at ON outcome_analysis_results(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_outcome_analysis_process_type ON outcome_analysis_results(process_type);
CREATE INDEX IF NOT EXISTS idx_outcome_analysis_metric_name ON outcome_analysis_results(metric_name);
CREATE INDEX IF NOT EXISTS idx_outcome_result_data ON outcome_analysis_results USING GIN (result_data);

-- Create JSONB indexes for performance
CREATE INDEX IF NOT EXISTS idx_analysis_result_data ON analysis_results USING GIN (result_data);
CREATE INDEX IF NOT EXISTS idx_org_handover_data ON organization_analysis_results USING GIN (handover_data);
CREATE INDEX IF NOT EXISTS idx_org_workload_data ON organization_analysis_results USING GIN (workload_data);
CREATE INDEX IF NOT EXISTS idx_org_performance_data ON organization_analysis_results USING GIN (performance_data);

-- Create composite indexes for fct_event_log (assuming this table exists from dbt)
CREATE INDEX IF NOT EXISTS idx_event_log_process_case ON fct_event_log(process_type, case_id);
CREATE INDEX IF NOT EXISTS idx_event_log_process_timestamp ON fct_event_log(process_type, timestamp);

-- Create composite index for fct_case_outcomes (assuming this table exists from dbt)
CREATE INDEX IF NOT EXISTS idx_case_outcomes_process_metric ON fct_case_outcomes(process_type, metric_name);
