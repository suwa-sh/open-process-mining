{{
  config(
    materialized='view'
  )
}}

-- GitLab Issuesから標準イベントログ形式に変換（gitlab-devopsプロセス）
-- Issue Created と Issue Closed イベントを生成

WITH source AS (
    SELECT * FROM {{ source('bronze_raw', 'bronze_gitlab_issues') }}
),

user_mapping AS (
    SELECT * FROM public.master_user_mapping
    WHERE source_system = 'gitlab'
),

source_with_employee AS (
    SELECT
        s.*,
        COALESCE(um.employee_id, 'SYSTEM') AS author_employee_id
    FROM source s
    LEFT JOIN user_mapping um ON um.user_identifier = s.author
),

events AS (
    -- Issue Created event
    SELECT
        'gitlab-devops' AS process_type,
        'gitlab-issue-' || iid AS case_id,
        'Issue Created' AS activity,
        created_at::timestamptz AT TIME ZONE 'UTC' AS timestamp,
        'gitlab_issue' AS source_system,
        author_employee_id AS employee_id,
        jsonb_build_object(
            'issue_id', id,
            'issue_iid', iid,
            'title', title,
            'labels', labels::jsonb,
            'author', author
        ) AS attributes_json
    FROM source_with_employee

    UNION ALL

    -- Issue Closed event
    SELECT
        'gitlab-devops' AS process_type,
        'gitlab-issue-' || iid AS case_id,
        'Issue Closed' AS activity,
        closed_at::timestamptz AT TIME ZONE 'UTC' AS timestamp,
        'gitlab_issue' AS source_system,
        author_employee_id AS employee_id,
        jsonb_build_object('issue_id', id, 'issue_iid', iid) AS attributes_json
    FROM source_with_employee
    WHERE state = 'closed' AND closed_at IS NOT NULL
)

SELECT * FROM events
