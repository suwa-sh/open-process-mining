{{
  config(
    materialized='view'
  )
}}

-- Jenkins Buildsから標準イベントログ形式に変換（hybrid-devopsプロセス）
-- Build Started と Build Completed イベントを生成

WITH source AS (
    SELECT * FROM {{ source('bronze_raw', 'bronze_jenkins_builds') }}
),

user_mapping AS (
    SELECT * FROM public.master_user_mapping
    WHERE source_system = 'jenkins'
),

-- Extract Jira key from commit messages
case_extraction AS (
    SELECT
        s.*,
        -- Extract first Jira key from commit messages JSON array
        substring(
            s.commit_messages FROM 'PROJ-(\d+)'
        ) AS jira_issue_number,
        to_timestamp(s.timestamp / 1000.0) AS started_at,
        to_timestamp((s.timestamp + s.duration) / 1000.0) AS finished_at,
        -- Map user to employee_id
        COALESCE(um.employee_id, 'SYSTEM') AS user_employee_id
    FROM source s
    LEFT JOIN user_mapping um ON um.user_identifier = s.user
),

events AS (
    -- Build Started event
    SELECT
        'hybrid-devops' AS process_type,
        'PROJ-' || jira_issue_number AS case_id,
        'Build Started' AS activity,
        started_at AT TIME ZONE 'UTC' AS timestamp,
        'jenkins_build' AS source_system,
        user_employee_id AS employee_id,
        jsonb_build_object(
            'build_id', id,
            'job_name', job_name,
            'build_number', build_number,
            'user', user
        ) AS attributes_json
    FROM case_extraction
    WHERE jira_issue_number IS NOT NULL

    UNION ALL

    -- Build Completed event
    SELECT
        'hybrid-devops' AS process_type,
        'PROJ-' || jira_issue_number AS case_id,
        CASE
            WHEN result = 'SUCCESS' THEN 'Build Completed'
            ELSE 'Build Failed'
        END AS activity,
        finished_at AT TIME ZONE 'UTC' AS timestamp,
        'jenkins_build' AS source_system,
        user_employee_id AS employee_id,
        jsonb_build_object(
            'build_id', id,
            'result', result,
            'duration_ms', duration
        ) AS attributes_json
    FROM case_extraction
    WHERE jira_issue_number IS NOT NULL
)

SELECT * FROM events
