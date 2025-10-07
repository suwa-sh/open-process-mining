-- Migration: Rename analysis_results to process_analysis_results
-- Date: 2025-10-07
-- Purpose: Align table naming convention with other analysis tables

-- Rename table
ALTER TABLE analysis_results RENAME TO process_analysis_results;

-- Rename indexes
ALTER INDEX idx_analysis_results_created_at RENAME TO idx_process_analysis_results_created_at;
ALTER INDEX idx_analysis_results_process_type RENAME TO idx_process_analysis_results_process_type;
ALTER INDEX idx_analysis_result_data RENAME TO idx_process_analysis_result_data;
