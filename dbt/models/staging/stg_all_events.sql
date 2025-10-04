-- Union all process event sources into a standardized format
SELECT
    process_type,
    order_id as case_id,
    status as activity,
    event_time::timestamp as timestamp,
    employee_id as resource
FROM {{ ref('raw_order_events') }}

UNION ALL

SELECT
    process_type,
    employee_id as case_id,
    status as activity,
    event_time::timestamp as timestamp,
    assigned_to as resource
FROM {{ ref('raw_employee_onboarding') }}
