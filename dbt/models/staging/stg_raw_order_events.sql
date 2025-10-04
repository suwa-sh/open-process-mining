-- Staging model for raw order events
-- Performs basic data cleansing and standardization

SELECT
    order_id,
    status,
    event_time::timestamp AS event_time,
    user_name
FROM
    {{ ref('raw_order_events') }}
WHERE
    order_id IS NOT NULL
    AND status IS NOT NULL
    AND event_time IS NOT NULL
ORDER BY
    order_id,
    event_time
