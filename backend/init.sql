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
