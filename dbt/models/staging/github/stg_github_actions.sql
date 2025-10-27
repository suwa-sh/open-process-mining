{{
  config(
    materialized='view'
  )
}}

-- GitHub Actions実行履歴から標準イベントログ形式に変換
-- Build Started, Build Completed, Deployed Production イベントを生成
-- case_idはブランチ名からJiraキーまたはGitHub Issue番号を抽出

WITH source AS (
    SELECT * FROM {{ source('bronze_raw', 'bronze_github_actions') }}
),

case_extraction AS (
    SELECT
        *,
        COALESCE(
            -- 優先順位1: ブランチ名からJiraキー抽出
            substring(head_branch FROM '([A-Z][A-Z0-9]+-\d+)'),
            -- 優先順位2: GitHub Issue番号
            '{{ var("github_owner", "suwa-sh") }}' || '/' || '{{ var("github_repo", "open-process-mining") }}' || '#'
                || substring(head_branch FROM '#(\d+)')
        ) AS case_id
    FROM source
),

events AS (
    -- Build Started event
    SELECT
        case_id,
        'Build Started' AS activity,
        created_at::timestamptz AT TIME ZONE 'UTC' AS timestamp,
        'github_actions' AS source_system,
        jsonb_build_object(
            'run_id', id,
            'workflow_name', name,
            'head_branch', head_branch
        ) AS attributes_json
    FROM case_extraction
    WHERE case_id IS NOT NULL

    UNION ALL

    -- Build Completed event (成功したビルドのみ)
    SELECT
        case_id,
        'Build Completed' AS activity,
        updated_at::timestamptz AT TIME ZONE 'UTC' AS timestamp,
        'github_actions' AS source_system,
        jsonb_build_object(
            'run_id', id,
            'workflow_name', name,
            'conclusion', conclusion
        ) AS attributes_json
    FROM case_extraction
    WHERE case_id IS NOT NULL
        AND status = 'completed'
        AND conclusion = 'success'

    UNION ALL

    -- Deployed Production event (デプロイワークフローの成功)
    SELECT
        case_id,
        'Deployed Production' AS activity,
        updated_at::timestamptz AT TIME ZONE 'UTC' AS timestamp,
        'github_actions' AS source_system,
        jsonb_build_object(
            'run_id', id,
            'workflow_name', name
        ) AS attributes_json
    FROM case_extraction
    WHERE case_id IS NOT NULL
        AND status = 'completed'
        AND conclusion = 'success'
        AND (
            LOWER(name) LIKE '%deploy%'
            OR LOWER(name) LIKE '%production%'
            OR LOWER(name) LIKE '%release%'
        )
)

SELECT * FROM events
