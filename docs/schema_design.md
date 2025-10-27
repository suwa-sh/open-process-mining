# スキーマ設計

## Bronze層（生データ基盤）

### 設計原則

1. **Immutability（不変性）**: Bronze層はappend-onlyで、更新・削除を行わない
2. **Raw Structure Preservation（生構造の保持）**: ソースシステムのスキーマをそのまま保持
3. **Complete Historical Archive（完全な履歴保管）**: 全履歴を保存し、パイプライン再構築を可能にする

### スキーマ名

`bronze_raw`

### テーブル命名規則

`bronze_raw.{system}_{entity}`

**例**:

- `bronze_raw.github_issues`
- `bronze_raw.github_pull_requests`
- `bronze_raw.github_actions_runs`
- `bronze_raw.gitlab_issues`
- `bronze_raw.gitlab_merge_requests`
- `bronze_raw.gitlab_pipelines`
- `bronze_raw.jira_issues`
- `bronze_raw.jenkins_builds`

### 共通カラム（dlt標準）

すべてのBronze層テーブルに以下のカラムが自動追加される：

| カラム名       | データ型  | 説明                               |
| -------------- | --------- | ---------------------------------- |
| `_dlt_load_id` | VARCHAR   | dltロードID（バッチ識別子）        |
| `_dlt_id`      | VARCHAR   | dltレコードID（一意識別子）        |
| `loaded_at`    | TIMESTAMP | データロード日時（パーティション用 |

### パーティション

`loaded_at::date`（日次パーティション）

### データ保持期間

- **推奨**: 無期限（Bronze層は履歴アーカイブ）
- **最小**: 90日（コンプライアンス要件に応じて調整）

---

## ステージング層（標準化レイヤー）

### 設計原則

- ソース固有スキーマ → 標準イベントログ形式への変換
- 最小限の変換（カラム名変更、型変換、UNION程度）

### 標準イベントログ形式

すべてのステージングモデル（`stg_*`）は以下の統一スキーマに変換する：

```sql
CREATE TABLE staging.stg_events (
    case_id VARCHAR(255) NOT NULL,
    activity VARCHAR(255) NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    source_system VARCHAR(100) NOT NULL,
    attributes_json JSONB
);
```

| カラム名          | データ型                 | 必須 | 説明                                               |
| ----------------- | ------------------------ | ---- | -------------------------------------------------- |
| `case_id`         | VARCHAR(255)             | ○    | ケースID（Jira/GitHub/GitLab形式）                 |
| `activity`        | VARCHAR(255)             | ○    | アクティビティ名（標準化済み）                     |
| `timestamp`       | TIMESTAMP WITH TIME ZONE | ○    | イベント発生日時（UTC正規化）                      |
| `source_system`   | VARCHAR(100)             | ○    | ソースシステム識別子                               |
| `attributes_json` | JSONB                    |      | ソース固有の追加属性（issue_id, pr_number, etc.）` |

### activity値の標準化

#### GitHub Issues

- `Issue Created`: Issue作成
- `Issue Closed`: Issue完了

#### GitHub Pull Requests

- `PR Opened`: プルリクエスト作成
- `Code Merged`: コードマージ

#### GitHub Actions

- `Build Started`: ビルド開始
- `Build Completed`: ビルド完了
- `Deployed Production`: 本番デプロイ

#### GitLab Issues

- `Issue Created`: Issue作成
- `Issue Closed`: Issue完了

#### GitLab Merge Requests

- `PR Opened`: マージリクエスト作成
- `Code Merged`: コードマージ

#### GitLab CI

- `Build Started`: パイプライン開始
- `Build Completed`: パイプライン完了
- `Deployed Production`: 本番デプロイ

#### Jira Issues

- `Issue Created`: Issue作成
- `Work Started`: 作業開始（ステータス遷移）
- `Issue Closed`: Issue完了

#### Jenkins Builds

- `Build Started`: ビルド開始
- `Build Completed`: ビルド完了
- `Deployed Production`: デプロイ完了（ジョブ名規約）

### source_system値

| システム             | source_system値 |
| -------------------- | --------------- |
| GitHub Issues        | `github_issue`  |
| GitHub Pull Requests | `github_repo`   |
| GitHub Actions       | `github_ci`     |
| GitLab Issues        | `gitlab_issue`  |
| GitLab Merge Reqs    | `gitlab_repo`   |
| GitLab CI            | `gitlab_ci`     |
| Jira Issues          | `jira`          |
| Jenkins Builds       | `jenkins`       |

---

## マート層（統合レイヤー）

### fct_event_log

既存の6プロセスタイプに`system-development`を追加：

```sql
CREATE TABLE public.fct_event_log (
    process_type VARCHAR(100) NOT NULL,
    case_id VARCHAR(255) NOT NULL,
    activity VARCHAR(255) NOT NULL,
    timestamp TIMESTAMP NOT NULL,
    source_system VARCHAR(100),
    attributes_json JSONB,
    resource VARCHAR(255),
    employee_id VARCHAR(50),
    employee_name VARCHAR(100),
    role VARCHAR(100),
    department_id VARCHAR(50),
    department_name VARCHAR(100),
    department_type VARCHAR(100),
    parent_department_id VARCHAR(50)
);
```

**system-developmentの場合**:

- `resource`, `employee_id`, `employee_name`, `role`, `department_*` はすべてNULL
- 組織情報が不要なため

### fct_case_outcomes

system-developmentプロセスのメトリック：

```sql
INSERT INTO public.fct_case_outcomes (
    process_type,
    case_id,
    metric_name,
    metric_value,
    metric_unit
)
SELECT
    'system-development',
    case_id,
    'lead_time_days',
    EXTRACT(EPOCH FROM (end_ts - start_ts)) / 86400,
    'days'
FROM case_timeline;
```

**メトリック一覧**:

- `lead_time_days`: リードタイム
- `cycle_time_days`: サイクルタイム
- `code_review_time_hours`: レビュー時間
- `build_time_minutes`: ビルド時間
- `deployment_frequency`: デプロイ頻度
- `change_failure_rate`: 変更失敗率

---

## タイムゾーン正規化

すべてのtimestampは**UTC**に正規化する：

```sql
timestamp AT TIME ZONE 'UTC' AS timestamp
```

ISO8601+TZ形式でのパース：

```sql
(timestamp_string::timestamptz AT TIME ZONE 'UTC')::timestamp
```

---

## インデックス設計

### fct_event_log

```sql
CREATE INDEX idx_fct_event_log_process_type ON fct_event_log(process_type);
CREATE INDEX idx_fct_event_log_case_id ON fct_event_log(case_id);
CREATE INDEX idx_fct_event_log_timestamp ON fct_event_log(timestamp DESC);
CREATE INDEX idx_fct_event_log_composite ON fct_event_log(process_type, case_id, timestamp);
```

### fct_case_outcomes

```sql
CREATE INDEX idx_fct_case_outcomes_process_type ON fct_case_outcomes(process_type);
CREATE INDEX idx_fct_case_outcomes_case_id ON fct_case_outcomes(case_id);
CREATE INDEX idx_fct_case_outcomes_metric_name ON fct_case_outcomes(metric_name);
```
