-- 全プロセスタイプの成果データを統合
{{ config(materialized='table') }}

SELECT
    process_type,
    case_id,
    metric_name,
    metric_value::numeric,
    metric_unit
FROM {{ ref('outcome_order_delivery_2024') }}

UNION ALL

SELECT
    process_type,
    case_id,
    metric_name,
    metric_value::numeric,
    metric_unit
FROM {{ ref('outcome_employee_onboarding_2024') }}

UNION ALL

SELECT
    process_type,
    case_id,
    metric_name,
    metric_value::numeric,
    metric_unit
FROM {{ ref('outcome_itsm_2024') }}

UNION ALL

SELECT
    process_type,
    case_id,
    metric_name,
    metric_value::numeric,
    metric_unit
FROM {{ ref('outcome_billing_2024') }}

UNION ALL

SELECT
    process_type,
    case_id,
    metric_name,
    metric_value::numeric,
    metric_unit
FROM {{ ref('outcome_invoice_approval_2024') }}

UNION ALL

SELECT
    process_type,
    case_id,
    metric_name,
    metric_value::numeric,
    metric_unit
FROM {{ ref('outcome_system_development_2024') }}
