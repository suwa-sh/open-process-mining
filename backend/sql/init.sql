-- Initialize database schema

-- Create process_analysis_results table
CREATE TABLE IF NOT EXISTS process_analysis_results (
    analysis_id UUID PRIMARY KEY,
    analysis_name VARCHAR(255) NOT NULL,
    process_type VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    result_data JSONB NOT NULL
);

-- Create index on created_at for sorting
CREATE INDEX IF NOT EXISTS idx_process_analysis_results_created_at ON process_analysis_results (created_at DESC);

-- Create index on process_type for filtering
CREATE INDEX IF NOT EXISTS idx_process_analysis_results_process_type ON process_analysis_results (process_type);

-- Create organization_analysis_results table
CREATE TABLE IF NOT EXISTS organization_analysis_results (
    analysis_id UUID PRIMARY KEY DEFAULT GEN_RANDOM_UUID(),
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
CREATE INDEX IF NOT EXISTS idx_org_analysis_created_at ON organization_analysis_results (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_org_analysis_process_type ON organization_analysis_results (process_type);

-- Create outcome_analysis_results table
CREATE TABLE IF NOT EXISTS outcome_analysis_results (
    analysis_id UUID PRIMARY KEY DEFAULT GEN_RANDOM_UUID(),
    analysis_name VARCHAR(255) NOT NULL,
    process_type VARCHAR(100) NOT NULL,
    metric_name VARCHAR(100) NOT NULL,
    analysis_type VARCHAR(50) NOT NULL,
    filter_config JSONB,
    result_data JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for outcome_analysis_results
CREATE INDEX IF NOT EXISTS idx_outcome_analysis_created_at ON outcome_analysis_results (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_outcome_analysis_process_type ON outcome_analysis_results (process_type);
CREATE INDEX IF NOT EXISTS idx_outcome_analysis_metric_name ON outcome_analysis_results (metric_name);
CREATE INDEX IF NOT EXISTS idx_outcome_result_data ON outcome_analysis_results USING gin (result_data);

-- Create JSONB indexes for performance
CREATE INDEX IF NOT EXISTS idx_process_analysis_result_data ON process_analysis_results USING gin (result_data);
CREATE INDEX IF NOT EXISTS idx_org_handover_data ON organization_analysis_results USING gin (handover_data);
CREATE INDEX IF NOT EXISTS idx_org_workload_data ON organization_analysis_results USING gin (workload_data);
CREATE INDEX IF NOT EXISTS idx_org_performance_data ON organization_analysis_results USING gin (performance_data);

-- Note: Indexes for dbt-managed tables (fct_event_log, fct_case_outcomes) should be created
-- in dbt models or in a post-hook, not in init.sql, as these tables don't exist at init time.
