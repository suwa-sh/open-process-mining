-- Union all process event sources into a standardized format
-- All data now comes from 2024 source systems (ETL simulation)

SELECT
    process_type,
    case_id,
    activity,
    timestamp,
    resource
FROM {{ ref('stg_order_to_cash_2024') }}

UNION ALL

SELECT
    process_type,
    case_id,
    activity,
    timestamp,
    resource
FROM {{ ref('stg_employee_onboarding_2024') }}

UNION ALL

SELECT
    process_type,
    case_id,
    activity,
    timestamp,
    resource
FROM {{ ref('stg_itsm_2024') }}

UNION ALL

SELECT
    process_type,
    case_id,
    activity,
    timestamp,
    resource
FROM {{ ref('stg_billing_2024') }}

UNION ALL

SELECT
    process_type,
    case_id,
    activity,
    timestamp,
    resource
FROM {{ ref('stg_invoice_approval_2024') }}

UNION ALL

SELECT
    process_type,
    case_id,
    activity,
    timestamp,
    resource
FROM {{ ref('stg_system_development_2024') }}
