# system-development 実装ガイド

## 概要

このドキュメントは、system-developmentプロセスマイニング機能の実装ガイドです。
Phase 1-2で設計・基盤を構築しましたが、Phase 3以降の実装は段階的に行います。

## 実装済みコンポーネント

### Phase 1: 設計・仕様策定 ✅

- `config/metrics_dictionary.yaml`: メトリック定義
- `docs/case_id_rules.md`: case_idルール
- `docs/schema_design.md`: スキーマ設計
- `config/process_definition.yaml`: プロセス定義

### Phase 2: Bronze層基盤構築（dlt） ✅

- `backend/Dockerfile`: dlt[postgres]追加
- `backend/.dlt/config.toml`: dlt設定
- `backend/.dlt/secrets.toml.example`: 認証情報テンプレート
- `.gitignore`: dlt関連ファイル除外
- `.env.example`: dlt環境変数
- `backend/src/elt/sources/github_source.py`: GitHubコネクター

## 未実装コンポーネント（今後の実装）

### Phase 3: dbt変換レイヤー拡張

#### 3.1 Bronze層sources定義

`dbt/models/bronze/_bronze__sources.yml`:

```yaml
version: 2

sources:
  - name: bronze_raw
    schema: bronze_raw
    description: "Bronze層（dltで抽出した生データ）"
    tables:
      - name: github_issues
        description: "GitHub Issues"
        loaded_at_field: loaded_at
        freshness:
          warn_after: { count: 24, period: hour }
        columns:
          - name: id
            description: "Issue ID"
            tests:
              - not_null
              - unique
          - name: number
            description: "Issue番号"
          - name: created_at
            description: "作成日時"
          - name: closed_at
            description: "完了日時"

      - name: github_pull_requests
        description: "GitHub Pull Requests"
        loaded_at_field: loaded_at
        freshness:
          warn_after: { count: 24, period: hour }

      - name: github_actions_runs
        description: "GitHub Actions実行履歴"
        loaded_at_field: loaded_at
        freshness:
          warn_after: { count: 24, period: hour }
```

#### 3.2 ステージングモデル

**`dbt/models/staging/github/stg_github_issues.sql`**:

```sql
{{
  config(
    materialized='view'
  )
}}

WITH source AS (
    SELECT * FROM {{ source('bronze_raw', 'github_issues') }}
),

events AS (
    -- Issue Created event
    SELECT
        '{{ var("github_owner") }}' || '/' || '{{ var("github_repo") }}' || '#' || number AS case_id,
        'Issue Created' AS activity,
        created_at::timestamptz AT TIME ZONE 'UTC' AS timestamp,
        'github_issue' AS source_system,
        jsonb_build_object(
            'issue_id', id,
            'title', title,
            'labels', labels::jsonb
        ) AS attributes_json
    FROM source

    UNION ALL

    -- Issue Closed event
    SELECT
        '{{ var("github_owner") }}' || '/' || '{{ var("github_repo") }}' || '#' || number AS case_id,
        'Issue Closed' AS activity,
        closed_at::timestamptz AT TIME ZONE 'UTC' AS timestamp,
        'github_issue' AS source_system,
        jsonb_build_object('issue_id', id) AS attributes_json
    FROM source
    WHERE state = 'closed' AND closed_at IS NOT NULL
)

SELECT * FROM events
```

**`dbt/models/staging/github/stg_github_pull_requests.sql`**:

```sql
{{
  config(
    materialized='view'
  )
}}

WITH source AS (
    SELECT * FROM {{ source('bronze_raw', 'github_pull_requests') }}
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
            '{{ var("github_owner") }}' || '/' || '{{ var("github_repo") }}' || '#' ||
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
```

**`dbt/models/staging/github/stg_github_actions.sql`**:

```sql
{{
  config(
    materialized='view'
  )
}}

WITH source AS (
    SELECT * FROM {{ source('bronze_raw', 'github_actions_runs') }}
),

case_extraction AS (
    SELECT
        *,
        COALESCE(
            -- ブランチ名からJiraキー抽出
            substring(head_branch FROM '([A-Z][A-Z0-9]+-\d+)'),
            -- GitHub Issue番号
            '{{ var("github_owner") }}' || '/' || '{{ var("github_repo") }}' || '#' ||
                substring(head_branch FROM '#(\d+)')
        ) AS case_id
    FROM source
),

events AS (
    -- Build Started event
    SELECT
        case_id,
        'Build Started' AS activity,
        created_at::timestamptz AT TIME ZONE 'UTC' AS timestamp,
        'github_ci' AS source_system,
        jsonb_build_object(
            'run_id', id,
            'workflow_name', name
        ) AS attributes_json
    FROM case_extraction
    WHERE case_id IS NOT NULL

    UNION ALL

    -- Build Completed event (success only)
    SELECT
        case_id,
        'Build Completed' AS activity,
        updated_at::timestamptz AT TIME ZONE 'UTC' AS timestamp,
        'github_ci' AS source_system,
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

    -- Deployed Production event (deploy workflow)
    SELECT
        case_id,
        'Deployed Production' AS activity,
        updated_at::timestamptz AT TIME ZONE 'UTC' AS timestamp,
        'github_ci' AS source_system,
        jsonb_build_object(
            'run_id', id,
            'workflow_name', name
        ) AS attributes_json
    FROM case_extraction
    WHERE case_id IS NOT NULL
      AND status = 'completed'
      AND conclusion = 'success'
      AND (name ILIKE '%deploy%' OR name ILIKE '%production%')
)

SELECT * FROM events
```

#### 3.3 統合イベントログモデル

`dbt/models/marts/fct_event_log.sql`を拡張：

```sql
-- 既存のCTEの後に追加

    UNION ALL

    -- system-development (GitHub based)
    SELECT
        'system-development' AS process_type,
        case_id,
        activity,
        timestamp,
        source_system,
        attributes_json,
        NULL AS resource,
        NULL AS employee_id,
        NULL AS employee_name,
        NULL AS role,
        NULL AS department_id,
        NULL AS department_name,
        NULL AS department_type,
        NULL AS parent_department_id
    FROM {{ ref('stg_github_issues') }}

    UNION ALL

    SELECT
        'system-development' AS process_type,
        case_id,
        activity,
        timestamp,
        source_system,
        attributes_json,
        NULL AS resource,
        NULL AS employee_id,
        NULL AS employee_name,
        NULL AS role,
        NULL AS department_id,
        NULL AS department_name,
        NULL AS department_type,
        NULL AS parent_department_id
    FROM {{ ref('stg_github_pull_requests') }}

    UNION ALL

    SELECT
        'system-development' AS process_type,
        case_id,
        activity,
        timestamp,
        source_system,
        attributes_json,
        NULL AS resource,
        NULL AS employee_id,
        NULL AS employee_name,
        NULL AS role,
        NULL AS department_id,
        NULL AS department_name,
        NULL AS department_type,
        NULL AS parent_department_id
    FROM {{ ref('stg_github_actions') }}
```

#### 3.4 成果データモデル

`dbt/models/marts/fct_case_outcomes.sql`を拡張：

```sql
-- 既存のUNION ALLの後に追加

UNION ALL

-- system-development metrics
WITH system_dev_events AS (
    SELECT
        case_id,
        activity,
        timestamp
    FROM {{ ref('fct_event_log') }}
    WHERE process_type = 'system-development'
),

case_timeline AS (
    SELECT
        case_id,
        MIN(CASE WHEN activity IN ('Issue Created', 'Work Started', 'First Commit')
            THEN timestamp END) AS start_ts,
        MIN(CASE WHEN activity = 'Work Started' THEN timestamp END) AS work_started_ts,
        MIN(CASE WHEN activity = 'PR Opened' THEN timestamp END) AS pr_opened_ts,
        MAX(CASE WHEN activity = 'Code Merged' THEN timestamp END) AS code_merged_ts,
        MAX(CASE WHEN activity IN ('Issue Closed', 'Deployed Production', 'Code Merged')
            THEN timestamp END) AS end_ts
    FROM system_dev_events
    GROUP BY case_id
)

SELECT
    'system-development' AS process_type,
    case_id,
    'lead_time_days' AS metric_name,
    EXTRACT(EPOCH FROM (end_ts - start_ts)) / 86400 AS metric_value,
    'days' AS metric_unit
FROM case_timeline
WHERE start_ts IS NOT NULL AND end_ts IS NOT NULL

UNION ALL

SELECT
    'system-development' AS process_type,
    case_id,
    'cycle_time_days' AS metric_name,
    EXTRACT(EPOCH FROM (code_merged_ts - work_started_ts)) / 86400 AS metric_value,
    'days' AS metric_unit
FROM case_timeline
WHERE work_started_ts IS NOT NULL AND code_merged_ts IS NOT NULL

UNION ALL

SELECT
    'system-development' AS process_type,
    case_id,
    'code_review_time_hours' AS metric_name,
    EXTRACT(EPOCH FROM (code_merged_ts - pr_opened_ts)) / 3600 AS metric_value,
    'hours' AS metric_unit
FROM case_timeline
WHERE pr_opened_ts IS NOT NULL AND code_merged_ts IS NOT NULL
```

### Phase 4: 設定管理・運用設計

#### dbtマクロ

**`dbt/macros/extract_case_id.sql`**:

```sql
{% macro extract_case_id(source_field, source_type='github') %}
  CASE
    -- 優先順位1: Jiraキー
    WHEN {{ source_field }} ~ '([A-Z][A-Z0-9]+-\d+)' THEN
      substring({{ source_field }} FROM '([A-Z][A-Z0-9]+-\d+)')
    -- 優先順位2: GitHub/GitLab Issue番号
    {% if source_type == 'github' %}
    WHEN {{ source_field }} ~ '#(\d+)' THEN
      '{{ var("github_owner") }}/{{ var("github_repo") }}#' ||
      substring({{ source_field }} FROM '#(\d+)')
    {% elif source_type == 'gitlab' %}
    WHEN {{ source_field }} ~ '#(\d+)' THEN
      '{{ var("gitlab_namespace") }}/{{ var("gitlab_project") }}#' ||
      substring({{ source_field }} FROM '#(\d+)')
    {% endif %}
    ELSE NULL
  END
{% endmacro %}
```

**`dbt/macros/normalize_timestamp.sql`**:

```sql
{% macro normalize_timestamp(column_name) %}
  ({{ column_name }}::timestamptz AT TIME ZONE 'UTC')::timestamp
{% endmacro %}
```

**`dbt/macros/get_end_events.sql`**:

```sql
{% macro get_end_events(mode='default') %}
  {% if mode == 'production_deploy' %}
    ('Deployed Production', 'Issue Closed')
  {% elif mode == 'code_merged' %}
    ('Code Merged', 'Issue Closed')
  {% else %}
    ('Issue Closed', 'Deployed Production', 'Code Merged')
  {% endif %}
{% endmacro %}
```

### Phase 5: サンプルデータ生成

`scripts/generate_sample_data.py`に以下の関数を追加：

```python
def generate_system_development_data():
    """Generate sample data for system-development process (GitHub-like)."""
    issues = []
    prs = []
    actions = []

    for i in range(30):  # 30 issues
        issue_id = i + 1
        created = fake.date_time_between(start_date='-90d', end_date='-60d')
        closed = fake.date_time_between(start_date=created, end_date='now') if random.random() > 0.2 else None

        issues.append({
            'id': f'issue-{issue_id}',
            'number': issue_id,
            'title': f'Feature: {fake.sentence()}',
            'state': 'closed' if closed else 'open',
            'created_at': created.isoformat(),
            'closed_at': closed.isoformat() if closed else None,
            'labels': random.sample(['bug', 'feature', 'enhancement', 'documentation'], k=random.randint(1, 2)),
            'assignees': [fake.user_name()],
        })

        # PR (80% of issues have a PR)
        if random.random() > 0.2:
            pr_created = created + timedelta(days=random.randint(1, 5))
            pr_merged = pr_created + timedelta(hours=random.randint(2, 48))

            prs.append({
                'id': f'pr-{issue_id}',
                'number': issue_id + 100,
                'title': f'feat: closes #{issue_id}',
                'state': 'closed',
                'created_at': pr_created.isoformat(),
                'merged_at': pr_merged.isoformat() if random.random() > 0.1 else None,
                'head_ref': f'feature/issue-{issue_id}',
                'base_ref': 'main',
            })

            # CI/CD runs (2-3 runs per PR)
            for j in range(random.randint(2, 3)):
                run_created = pr_created + timedelta(hours=j * 2)
                run_updated = run_created + timedelta(minutes=random.randint(5, 30))

                actions.append({
                    'id': f'run-{issue_id}-{j}',
                    'name': 'CI' if j < 2 else 'Deploy to Production',
                    'status': 'completed',
                    'conclusion': 'success' if random.random() > 0.1 else 'failure',
                    'created_at': run_created.isoformat(),
                    'updated_at': run_updated.isoformat(),
                    'head_branch': f'feature/issue-{issue_id}',
                    'head_sha': fake.sha256()[:7],
                    'event': 'pull_request',
                })

    # Save to CSV
    pd.DataFrame(issues).to_csv('dbt/seeds/bronze_github_issues.csv', index=False)
    pd.DataFrame(prs).to_csv('dbt/seeds/bronze_github_pull_requests.csv', index=False)
    pd.DataFrame(actions).to_csv('dbt/seeds/bronze_github_actions.csv', index=False)

    print(f"Generated {len(issues)} GitHub issues, {len(prs)} PRs, {len(actions)} actions")
```

### Phase 6-8: テスト・リファクタリング・振り返り

これらのフェーズは、Phase 3-5の実装完了後に実施します。

## 次のステップ

1. **Bronze層データ投入**: dltまたはseedでGitHub相当データを投入
2. **ステージングモデル実装**: 上記のSQLファイルを作成
3. **dbt run**: モデルをビルド
4. **dbt test**: データ品質チェック
5. **API/フロントエンド確認**: system-developmentプロセスが表示されるか確認

## 参考リンク

- [dlt公式ドキュメント](https://dlthub.com/docs/intro)
- [dbt Coreドキュメント](https://docs.getdbt.com/docs/introduction)
- [GitHub REST API](https://docs.github.com/en/rest)
