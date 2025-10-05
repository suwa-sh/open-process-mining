-- ITSM (IT Service Management) staging model
-- Transforms source system incident data to standard event log format

SELECT
    'itsm' as process_type,
    incident_id as case_id,
    status as activity,
    reported_at::timestamp as timestamp,
    assigned_to as resource
FROM {{ ref('raw_itsm_2024') }}
WHERE incident_id IS NOT NULL
    AND status IS NOT NULL
    AND reported_at IS NOT NULL
