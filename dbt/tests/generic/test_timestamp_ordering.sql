{% test timestamp_ordering(model, column_name, partition_by) %}
-- Test that timestamps are in ascending order within each partition (case_id)
-- This test ensures that events within a case are chronologically ordered

WITH ordered_events AS (
    SELECT
        {{ partition_by }},
        {{ column_name }},
        LAG({{ column_name }}) OVER (PARTITION BY {{ partition_by }} ORDER BY {{ column_name }}) AS prev_timestamp
    FROM {{ model }}
),

violations AS (
    SELECT
        {{ partition_by }},
        {{ column_name }},
        prev_timestamp
    FROM ordered_events
    WHERE prev_timestamp IS NOT NULL
      AND {{ column_name }} < prev_timestamp
)

SELECT *
FROM violations

{% endtest %}
