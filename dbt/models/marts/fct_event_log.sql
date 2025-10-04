-- Fact table: Event Log
-- Transforms all process events into standard event log format for process mining

SELECT
    process_type,
    case_id,
    activity,
    timestamp,
    resource
FROM
    {{ ref('stg_all_events') }}
ORDER BY
    process_type,
    case_id,
    timestamp
