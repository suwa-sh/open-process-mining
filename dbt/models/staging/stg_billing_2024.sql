-- Billing system staging model
-- Transforms billing status change data to standard event log format

SELECT
    'billing' as process_type,
    bill_id as case_id,
    bill_status as activity,
    status_changed_at::timestamp as timestamp,
    employee_id as resource
FROM {{ ref('raw_billing_2024') }}
WHERE bill_id IS NOT NULL
    AND bill_status IS NOT NULL
    AND status_changed_at IS NOT NULL
