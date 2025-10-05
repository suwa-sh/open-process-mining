-- Employee Onboarding staging model
-- Transforms recruitment process data to standard event log format

SELECT
    'employee-onboarding' as process_type,
    candidate_id as case_id,
    recruitment_status as activity,
    status_changed_at::timestamp as timestamp,
    responsible_person as resource
FROM {{ ref('raw_employee_onboarding_2024') }}
WHERE candidate_id IS NOT NULL
    AND recruitment_status IS NOT NULL
    AND status_changed_at IS NOT NULL
