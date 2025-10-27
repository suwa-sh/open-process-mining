-- System Development process outcomes
-- Calculates metrics based on docs/metrics_dictionary.yaml

{{ config(materialized='table') }}

WITH event_log AS (
    SELECT
        case_id,
        activity,
        timestamp
    FROM {{ ref('fct_event_log') }}
    WHERE process_type = 'system-development'
),

-- ケースごとに主要イベントのタイムスタンプを抽出
case_events AS (
    SELECT
        case_id,
        MIN(CASE WHEN activity = 'Issue Created' THEN timestamp END) AS issue_created_ts,
        MIN(CASE WHEN activity = 'Issue Closed' THEN timestamp END) AS issue_closed_ts,
        MIN(CASE WHEN activity = 'PR Opened' THEN timestamp END) AS pr_opened_ts,
        MIN(CASE WHEN activity = 'Code Merged' THEN timestamp END) AS code_merged_ts,
        MIN(CASE WHEN activity = 'Build Started' THEN timestamp END) AS build_started_ts,
        MIN(CASE WHEN activity = 'Build Completed' THEN timestamp END) AS build_completed_ts,
        MIN(CASE WHEN activity = 'Deployed Production' THEN timestamp END) AS deployed_ts,
        COUNT(CASE WHEN activity = 'Deployed Production' THEN 1 END) AS deployment_count
    FROM event_log
    GROUP BY case_id
),

-- メトリック計算
metrics AS (
    SELECT
        case_id,
        -- リードタイム: Issue Created → Issue Closed
        deployment_count AS deployment_frequency,

        -- サイクルタイム: PR Opened → Code Merged
        CASE
            WHEN issue_created_ts IS NOT NULL AND issue_closed_ts IS NOT NULL
            THEN EXTRACT(EPOCH FROM (issue_closed_ts - issue_created_ts)) / 86400
        END AS lead_time_days,

        -- コードレビュー時間: PR Opened → Code Merged
        CASE
            WHEN pr_opened_ts IS NOT NULL AND code_merged_ts IS NOT NULL
            THEN EXTRACT(EPOCH FROM (code_merged_ts - pr_opened_ts)) / 86400
        END AS cycle_time_days,

        -- ビルド時間: Build Started → Build Completed
        CASE
            WHEN pr_opened_ts IS NOT NULL AND code_merged_ts IS NOT NULL
            THEN EXTRACT(EPOCH FROM (code_merged_ts - pr_opened_ts)) / 3600
        END AS code_review_time_hours,

        -- デプロイ頻度
        CASE
            WHEN build_started_ts IS NOT NULL AND build_completed_ts IS NOT NULL
            THEN EXTRACT(EPOCH FROM (build_completed_ts - build_started_ts)) / 60
        END AS build_time_minutes
    FROM case_events
),

-- メトリックをUNPIVOT（行形式に変換）
unpivoted AS (
    SELECT
        'system-development' AS process_type,
        case_id,
        'lead_time_days' AS metric_name,
        lead_time_days AS metric_value,
        'days' AS metric_unit
    FROM metrics
    WHERE lead_time_days IS NOT NULL

    UNION ALL

    SELECT
        'system-development' AS process_type,
        case_id,
        'cycle_time_days' AS metric_name,
        cycle_time_days AS metric_value,
        'days' AS metric_unit
    FROM metrics
    WHERE cycle_time_days IS NOT NULL

    UNION ALL

    SELECT
        'system-development' AS process_type,
        case_id,
        'code_review_time_hours' AS metric_name,
        code_review_time_hours AS metric_value,
        'hours' AS metric_unit
    FROM metrics
    WHERE code_review_time_hours IS NOT NULL

    UNION ALL

    SELECT
        'system-development' AS process_type,
        case_id,
        'build_time_minutes' AS metric_name,
        build_time_minutes AS metric_value,
        'minutes' AS metric_unit
    FROM metrics
    WHERE build_time_minutes IS NOT NULL

    UNION ALL

    SELECT
        'system-development' AS process_type,
        case_id,
        'deployment_frequency' AS metric_name,
        deployment_frequency AS metric_value,
        'count' AS metric_unit
    FROM metrics
    WHERE deployment_frequency > 0
)

SELECT * FROM unpivoted
