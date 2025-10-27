{{
  config(
    materialized='view'
  )
}}

-- Jira Issuesから標準イベントログ形式に変換（hybrid-devopsプロセス）
-- Issue Created + Status Transitions (unnest) イベントを生成

WITH
constants AS (
    SELECT
        'hybrid-devops' AS process_type,
        'jira_issue' AS source_system
),

source AS (
    SELECT * FROM {{ source('bronze_raw', 'bronze_jira_issues') }}
),

-- Issue Created event
issue_created AS (
    SELECT
        c.process_type,
        s.key AS case_id,
        'Issue Created' AS activity,
        s.created::timestamptz AT TIME ZONE 'UTC' AS timestamp,
        c.source_system,
        jsonb_build_object(
            'issue_id', s.id,
            'issue_key', s.key,
            'summary', s.summary,
            'issue_type', s.issue_type,
            'priority', s.priority,
            'reporter', s.reporter
        ) AS attributes_json
    FROM source s
    CROSS JOIN constants c
),

-- Status Transition events (unnest JSON array)
status_transitions AS (
    SELECT
        c.process_type,
        s.key AS case_id,
        transition ->> 'to' AS activity,
        (transition ->> 'created')::timestamptz AT TIME ZONE 'UTC' AS timestamp,
        c.source_system,
        jsonb_build_object(
            'issue_id', s.id,
            'issue_key', s.key,
            'from_status', transition ->> 'from',
            'to_status', transition ->> 'to',
            'author', transition ->> 'author'
        ) AS attributes_json
    FROM source s
    CROSS JOIN constants c,
    LATERAL jsonb_array_elements(s.status_transitions::jsonb) AS transition
)

SELECT * FROM issue_created
UNION ALL
SELECT * FROM status_transitions
