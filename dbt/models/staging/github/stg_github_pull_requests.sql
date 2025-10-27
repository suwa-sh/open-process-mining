{{
  config(
    materialized='view'
  )
}}

-- GitHub Pull Requestsから標準イベントログ形式に変換
-- PR Opened と Code Merged イベントを生成
-- case_idはブランチ名/タイトルからJiraキーまたはGitHub Issue番号を抽出

WITH source AS (
    SELECT * FROM {{ source('bronze_raw', 'bronze_github_pull_requests') }}
),

case_extraction AS (
    SELECT
        *,
        COALESCE(
            -- 優先順位1: ブランチ名からJiraキー抽出
            substring(head_ref FROM '([A-Z][A-Z0-9]+-\d+)'),
            -- 優先順位2: タイトルからJiraキー抽出
            substring(title FROM '([A-Z][A-Z0-9]+-\d+)'),
            -- 優先順位3: GitHub Issue番号
            '{{ var("github_owner", "suwa-sh") }}' || '/' || '{{ var("github_repo", "open-process-mining") }}' || '#' ||
                substring(title FROM '#(\d+)')
        ) AS case_id
    FROM source
),

events AS (
    -- PR Opened event
    SELECT
        case_id,
        'PR Opened' AS activity,
        created_at::timestamptz AT TIME ZONE 'UTC' AS timestamp,
        'github_repo' AS source_system,
        jsonb_build_object(
            'pr_id', id,
            'pr_number', number,
            'title', title
        ) AS attributes_json
    FROM case_extraction
    WHERE case_id IS NOT NULL

    UNION ALL

    -- Code Merged event
    SELECT
        case_id,
        'Code Merged' AS activity,
        merged_at::timestamptz AT TIME ZONE 'UTC' AS timestamp,
        'github_repo' AS source_system,
        jsonb_build_object(
            'pr_id', id,
            'pr_number', number
        ) AS attributes_json
    FROM case_extraction
    WHERE case_id IS NOT NULL AND merged_at IS NOT NULL
)

SELECT * FROM events
