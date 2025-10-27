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

-- Extract case_id from title
case_extraction AS (
    SELECT
        *,
        -- Extract GitLab issue IID from title (e.g., [GL-123])
        substring(title FROM '\[GL-(\d+)\]') AS gitlab_issue_iid,
        -- Extract Jira key from title (e.g., [PROJ-123])
        -- Jira keys are 3+ characters, so exclude GL (2 characters)
        substring(title FROM '\[([A-Z]{3}[A-Z0-9]+-\d+)\]') AS jira_key
    FROM source
),

-- Base events with process type and case_id determined
base_events AS (
    SELECT
        CASE
            WHEN gitlab_issue_iid IS NOT NULL THEN 'gitlab-devops'
            WHEN jira_key IS NOT NULL THEN 'hybrid-devops'
        END AS process_type,
        COALESCE(
            'gitlab-issue-' || gitlab_issue_iid,
            jira_key
        ) AS case_id,
        id,
        iid,
        title,
        source_branch,
        state,
        created_at,
        merged_at
    FROM case_extraction
    WHERE gitlab_issue_iid IS NOT NULL OR jira_key IS NOT NULL
),

events AS (
    -- MR Created events
    SELECT
        process_type,
        case_id,
        'MR Created' AS activity,
        created_at::timestamptz AT TIME ZONE 'UTC' AS timestamp,
        'gitlab_mr' AS source_system,
        jsonb_build_object(
            'mr_id', id,
            'mr_iid', iid,
            'title', title,
            'source_branch', source_branch
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
        jsonb_build_object('mr_id', id, 'mr_iid', iid) AS attributes_json
    FROM base_events
    WHERE state = 'merged' AND merged_at IS NOT NULL
)

SELECT * FROM events
