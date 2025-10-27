-- System Development staging model
-- Aggregates GitHub-based events from multiple staging sources
-- Combines Issues, Pull Requests, and GitHub Actions into unified event log

WITH github_all_events AS (
    SELECT
        'system-development' AS process_type,
        case_id,
        activity,
        timestamp,
        'SYSTEM' AS resource  -- GitHub data doesn't include employee mapping, use system as placeholder
    FROM {{ ref('stg_github_issues') }}

    UNION ALL

    SELECT
        'system-development' AS process_type,
        case_id,
        activity,
        timestamp,
        'SYSTEM' AS resource
    FROM {{ ref('stg_github_pull_requests') }}

    UNION ALL

    SELECT
        'system-development' AS process_type,
        case_id,
        activity,
        timestamp,
        'SYSTEM' AS resource
    FROM {{ ref('stg_github_actions') }}
)

SELECT * FROM github_all_events
WHERE case_id IS NOT NULL
    AND activity IS NOT NULL
    AND timestamp IS NOT NULL
