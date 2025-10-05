-- Staging: 2024 Process Events
-- Standardize 2024 process event data
SELECT
    process_type,
    case_id,
    activity,
    event_time::timestamp AS timestamp,
    employee_id AS resource
FROM {{ ref('raw_process_events_2024') }}
