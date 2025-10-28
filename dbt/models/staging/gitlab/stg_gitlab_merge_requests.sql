{{
  config(
    materialized='view'
  )
}}

-- GitLab Merge Requestsから標準イベントログ形式に変換
-- gitlab-devopsとhybrid-devops両方のプロセスに対応

WITH source AS (
    SELECT * FROM {{ source('bronze_raw', 'bronze_gitlab_merge_requests') }}
),

user_mapping AS (
    SELECT * FROM public.master_user_mapping
    WHERE source_system = 'gitlab'
),

-- Extract case_id from title
case_extraction AS (
    SELECT
        s.id,
        s.iid,
        s.title,
        s.state,
        s.created_at,
        s.merged_at,
        s.source_branch,
        s.author,
        s.assignees,
        s.reviewers,
        s.jira_key,
        s.loaded_at,
        -- Extract GitLab issue IID from title (e.g., [GL-123])
        substring(s.title FROM '\[GL-(\d+)\]') AS gitlab_issue_iid,
        -- Map author to employee_id
        COALESCE(um.employee_id, 'SYSTEM') AS author_employee_id
    FROM source s
    LEFT JOIN user_mapping um ON um.user_identifier = s.author
),

-- Base events with process type and case_id determined
base_events AS (
    SELECT
        CASE
            WHEN ce.gitlab_issue_iid IS NOT NULL THEN 'gitlab-devops'
            WHEN ce.jira_key IS NOT NULL THEN 'hybrid-devops'
        END AS process_type,
        COALESCE(
            'gitlab-issue-' || ce.gitlab_issue_iid,
            ce.jira_key
        ) AS case_id,
        ce.id,
        ce.iid,
        ce.title,
        ce.source_branch,
        ce.state,
        ce.created_at,
        ce.merged_at,
        ce.author,
        ce.author_employee_id
    FROM case_extraction ce
    WHERE ce.gitlab_issue_iid IS NOT NULL OR ce.jira_key IS NOT NULL
),

events AS (
    -- MR Created events
    SELECT
        process_type,
        case_id,
        'MR Created' AS activity,
        created_at::timestamptz AT TIME ZONE 'UTC' AS timestamp,
        'gitlab_mr' AS source_system,
        author_employee_id AS employee_id,
        jsonb_build_object(
            'mr_id', id,
            'mr_iid', iid,
            'title', title,
            'source_branch', source_branch,
            'author', author
        ) AS attributes_json
    FROM base_events

    UNION ALL

    -- Code Merged events
    SELECT
        process_type,
        case_id,
        'Code Merged' AS activity,
        merged_at::timestamptz AT TIME ZONE 'UTC' AS timestamp,
        'gitlab_mr' AS source_system,
        author_employee_id AS employee_id,
        jsonb_build_object('mr_id', id, 'mr_iid', iid) AS attributes_json
    FROM base_events
    WHERE state = 'merged' AND merged_at IS NOT NULL
)

SELECT * FROM events
