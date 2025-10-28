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

user_mapping AS (
    SELECT * FROM public.master_user_mapping
    WHERE source_system = 'github'
),

case_extraction AS (
    SELECT
        s.*,
        COALESCE(
            -- 優先順位1: ブランチ名からJiraキー抽出
            substring(s.head_ref FROM '([A-Z][A-Z0-9]+-\d+)'),
            -- 優先順位2: タイトルからJiraキー抽出
            substring(s.title FROM '([A-Z][A-Z0-9]+-\d+)'),
            -- 優先順位3: GitHub Issue番号
            '{{ var("github_owner", "suwa-sh") }}' || '/' || '{{ var("github_repo", "open-process-mining") }}' || '#'
                || substring(s.title FROM '#(\d+)')
        ) AS case_id,
        -- Map creator to employee_id
        COALESCE(um.employee_id, 'SYSTEM') AS creator_employee_id
    FROM source s
    LEFT JOIN user_mapping um ON um.user_identifier = s.creator
),

events AS (
    -- PR Opened event
    SELECT
        case_id,
        'PR Opened' AS activity,
        created_at::timestamptz AT TIME ZONE 'UTC' AS timestamp,
        'github_repo' AS source_system,
        creator_employee_id AS employee_id,
        jsonb_build_object(
            'pr_id', id,
            'pr_number', number,
            'title', title,
            'creator', creator
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
        creator_employee_id AS employee_id,
        jsonb_build_object(
            'pr_id', id,
            'pr_number', number
        ) AS attributes_json
    FROM case_extraction
    WHERE case_id IS NOT NULL AND merged_at IS NOT NULL
)

SELECT * FROM events
