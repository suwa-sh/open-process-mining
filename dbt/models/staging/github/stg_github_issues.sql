{{
  config(
    materialized='view'
  )
}}

-- GitHub Issuesから標準イベントログ形式に変換
-- Issue Created と Issue Closed イベントを生成

WITH source AS (
    SELECT * FROM {{ source('bronze_raw', 'bronze_github_issues') }}
),

case_extraction AS (
    SELECT
        *,
        -- Extract Jira key from title if present, otherwise use GitHub issue number
        COALESCE(
            substring(title FROM '\[([A-Z][A-Z0-9]+-\d+)\]'),  -- [PROJ-123] format
            '{{ var("github_owner", "suwa-sh") }}' || '/' || '{{ var("github_repo", "open-process-mining") }}' || '#' || number
        ) AS case_id
    FROM source
),

events AS (
    -- Issue Created event
    SELECT
        case_id,
        'Issue Created' AS activity,
        created_at::timestamptz AT TIME ZONE 'UTC' AS timestamp,
        'github_issue' AS source_system,
        jsonb_build_object(
            'issue_id', id,
            'title', title,
            'labels', labels::jsonb
        ) AS attributes_json
    FROM case_extraction

    UNION ALL

    -- Issue Closed event
    SELECT
        case_id,
        'Issue Closed' AS activity,
        closed_at::timestamptz AT TIME ZONE 'UTC' AS timestamp,
        'github_issue' AS source_system,
        jsonb_build_object('issue_id', id) AS attributes_json
    FROM case_extraction
    WHERE state = 'closed' AND closed_at IS NOT NULL
)

SELECT * FROM events
