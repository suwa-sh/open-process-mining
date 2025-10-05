-- 全プロセスタイプの成果データを統合
{{ config(materialized='table') }}

SELECT
    process_type,
    case_id,
    metric_name,
    metric_value,
    metric_unit
FROM {{ ref('outcome_order_delivery') }}

UNION ALL

SELECT
    process_type,
    case_id,
    metric_name,
    metric_value,
    metric_unit
FROM {{ ref('outcome_employee_onboarding') }}

UNION ALL

SELECT
    process_type,
    case_id,
    metric_name,
    metric_value::numeric,
    metric_unit
FROM {{ ref('outcome_processes_2024') }}
