-- System Development staging model
-- Transforms software development phase tracking data to standard event log format

SELECT
    'system-development' as process_type,
    project_id as case_id,
    phase as activity,
    phase_changed_at::timestamp as timestamp,
    developer_id as resource
FROM {{ ref('raw_system_development_2024') }}
WHERE project_id IS NOT NULL
    AND phase IS NOT NULL
    AND phase_changed_at IS NOT NULL
