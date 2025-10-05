-- Invoice Approval staging model
-- Transforms invoice approval workflow data to standard event log format

SELECT
    'invoice-approval' as process_type,
    invoice_id as case_id,
    approval_status as activity,
    status_time::timestamp as timestamp,
    processor_id as resource
FROM {{ ref('raw_invoice_approval_2024') }}
WHERE invoice_id IS NOT NULL
    AND approval_status IS NOT NULL
    AND status_time IS NOT NULL
