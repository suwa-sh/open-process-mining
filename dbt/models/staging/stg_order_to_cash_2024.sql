-- Order to Cash staging model
-- Transforms order management system data to standard event log format

SELECT
    'order-to-cash' as process_type,
    order_id as case_id,
    order_status as activity,
    status_changed_at::timestamp as timestamp,
    employee_id as resource
FROM {{ ref('raw_order_to_cash_2024') }}
WHERE order_id IS NOT NULL
    AND order_status IS NOT NULL
    AND status_changed_at IS NOT NULL
