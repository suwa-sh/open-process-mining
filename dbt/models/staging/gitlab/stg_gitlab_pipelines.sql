{{
  config(
    materialized='view'
  )
}}

-- GitLab CI Pipelinesから標準イベントログ形式に変換（gitlab-devopsプロセス）
-- Build Started と Build Completed イベントを生成

WITH source AS (
    SELECT * FROM {{ source('bronze_raw', 'bronze_gitlab_pipelines') }}
),

user_mapping AS (
    SELECT * FROM public.master_user_mapping
    WHERE source_system = 'gitlab'
),

-- Extract GitLab issue IID from branch name (e.g., feature/gl-123)
case_extraction AS (
    SELECT
        s.*,
        substring(s.ref FROM 'feature/gl-(\d+)') AS gitlab_issue_iid,
        -- Map user to employee_id
        COALESCE(um.employee_id, 'SYSTEM') AS user_employee_id
    FROM source s
    LEFT JOIN user_mapping um ON um.user_identifier = s.user
),

events AS (
    -- Build Started event
    SELECT
        'gitlab-devops' AS process_type,
        'gitlab-issue-' || gitlab_issue_iid AS case_id,
        'Build Started' AS activity,
        started_at::timestamptz AT TIME ZONE 'UTC' AS timestamp,
        'gitlab_ci' AS source_system,
        user_employee_id AS employee_id,
        jsonb_build_object(
            'pipeline_id', id,
            'ref', ref,
            'status', status,
            'user', user
        ) AS attributes_json
    FROM case_extraction
    WHERE gitlab_issue_iid IS NOT NULL

    UNION ALL

    -- Build Completed event (成功したビルドのみ)
    SELECT
        'gitlab-devops' AS process_type,
        'gitlab-issue-' || gitlab_issue_iid AS case_id,
        'Build Completed' AS activity,
        finished_at::timestamptz AT TIME ZONE 'UTC' AS timestamp,
        'gitlab_ci' AS source_system,
        user_employee_id AS employee_id,
        jsonb_build_object(
            'pipeline_id', id,
            'status', status,
            'duration', duration
        ) AS attributes_json
    FROM case_extraction
    WHERE gitlab_issue_iid IS NOT NULL AND finished_at IS NOT NULL AND status = 'success'

    UNION ALL

    -- Build Failed event (失敗したビルド)
    SELECT
        'gitlab-devops' AS process_type,
        'gitlab-issue-' || gitlab_issue_iid AS case_id,
        'Build Failed' AS activity,
        finished_at::timestamptz AT TIME ZONE 'UTC' AS timestamp,
        'gitlab_ci' AS source_system,
        user_employee_id AS employee_id,
        jsonb_build_object(
            'pipeline_id', id,
            'status', status,
            'duration', duration
        ) AS attributes_json
    FROM case_extraction
    WHERE gitlab_issue_iid IS NOT NULL AND finished_at IS NOT NULL AND status = 'failed'
)

SELECT * FROM events
