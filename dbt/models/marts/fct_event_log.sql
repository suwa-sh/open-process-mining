-- Fact table: Event Log
-- Transforms all process events into standard event log format for process mining
-- Enriched with organizational information (employee and department)

WITH event_log AS (
    SELECT
        process_type,
        case_id,
        activity,
        timestamp,
        resource AS employee_id
    FROM
        {{ ref('stg_all_events') }}
)

SELECT
    e.process_type,
    e.case_id,
    e.activity,
    e.timestamp,
    e.employee_id AS resource,
    emp.employee_id,
    emp.employee_name,
    emp.role,
    emp.department_id,
    dept.department_name,
    dept.department_type,
    dept.parent_department_id
FROM
    event_log e
    LEFT JOIN {{ ref('master_employees') }} emp ON e.employee_id = emp.employee_id
    LEFT JOIN {{ ref('master_departments') }} dept ON emp.department_id = dept.department_id
ORDER BY
    e.process_type,
    e.case_id,
    e.timestamp
