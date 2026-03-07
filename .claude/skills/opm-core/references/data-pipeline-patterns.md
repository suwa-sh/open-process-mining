# OPM データパイプライン パターン集

## プロジェクト構造

```
open-process-mining/
├── dbt/
│   ├── seeds/                    # CSV データ（dbt seed で投入）
│   │   ├── raw_*.csv             # イベントログ生データ
│   │   ├── outcome_*.csv         # 成果データ
│   │   ├── master_employees.csv  # 社員マスター
│   │   ├── master_departments.csv # 部署マスター
│   │   └── master_user_mapping.csv # 外部システムユーザーマッピング
│   └── models/
│       ├── staging/              # ソース別の変換モデル
│       │   ├── stg_all_events.sql # 全ステージングの UNION ALL
│       │   ├── stg_*.sql         # CSV ソース用 staging
│       │   └── {system}/         # dlt ソース用 staging（サブディレクトリ）
│       └── marts/
│           ├── fct_event_log.sql     # イベントログマート
│           └── fct_case_outcomes.sql # 成果データマート
├── dlt/
│   ├── sources/                  # dlt データソース定義
│   ├── pipelines/                # dlt パイプライン実行スクリプト
│   └── .dlt/
│       ├── config.toml           # ソース設定
│       └── secrets.toml          # 認証情報（gitignore 対象）
└── scripts/
    └── generate_sample_data.py   # サンプルデータ生成スクリプト
```

---

## パターン1: CSV 手動投入用 staging モデル

### CSV フォーマット（`dbt/seeds/raw_{process}_{year}.csv`）

```csv
case_id,activity,timestamp,employee_id
ORD-001,受注登録,2024-01-15 09:00:00,EMP-001
ORD-001,入金確認,2024-01-15 14:30:00,EMP-002
```

最低限必須: `case_id`, `activity`, `timestamp`
組織分析を使う場合: `employee_id` も必須

### staging SQL（`dbt/models/staging/stg_{process}_{year}.sql`）

```sql
-- {Process Name} staging model
-- Transforms {source} data to standard event log format

SELECT
    '{process-type}' as process_type,
    {case_id_column} as case_id,
    {activity_column} as activity,
    {timestamp_column}::timestamp as timestamp,
    {employee_id_column} as resource
FROM {{ ref('raw_{process}_{year}') }}
WHERE {case_id_column} IS NOT NULL
    AND {activity_column} IS NOT NULL
    AND {timestamp_column} IS NOT NULL
```

**重要**: `resource` カラムには `employee_id` を入れる（組織分析で使用）。

### stg_all_events.sql への追加

```sql
UNION ALL

SELECT
    process_type,
    case_id,
    activity,
    timestamp,
    resource
FROM {{ ref('stg_{process}_{year}') }}
```

---

## パターン2: dlt 外部システム連携用 staging モデル

### dlt ソース（`dlt/sources/{system}_source.py`）

```python
"""Your System data source for dlt."""
import dlt
from typing import Any, Iterator, Optional
import requests


@dlt.resource(write_disposition="append", primary_key="id")
def {system}_records(
    api_url: str = dlt.config.value,
    api_key: str = dlt.secrets.value,
    since: Optional[str] = None,
) -> Iterator[dict[str, Any]]:
    """Extract records from {system} API."""
    headers = {"Authorization": f"Bearer {api_key}"}
    params = {"per_page": 100}
    if since:
        params["since"] = since

    page = 1
    while True:
        params["page"] = page
        response = requests.get(
            f"{api_url}/api/records",
            headers=headers,
            params=params,
            timeout=30,
        )
        response.raise_for_status()

        records = response.json()
        if not records:
            break

        for record in records:
            yield {
                "id": record["id"],
                "case_id": record["order_id"],
                "status": record["status"],
                "created_at": record["created_at"],
                "updated_at": record.get("updated_at"),
                "user_id": record["user_id"],  # 組織分析用
            }

        if "next" not in response.links:
            break
        page += 1


@dlt.source
def {system}_source(
    since: Optional[str] = None,
) -> list:
    """Combine all {system} resources."""
    return [
        {system}_records(since=since),
    ]
```

### dlt パイプライン（`dlt/pipelines/{system}_pipeline.py`）

```python
"""Your System pipeline."""
import dlt
from sources.{system}_source import {system}_source

if __name__ == "__main__":
    pipeline = dlt.pipeline(
        pipeline_name="{system}_pipeline",
        destination="postgres",
        dataset_name="bronze_raw",
    )

    load_info = pipeline.run({system}_source())
    print(f"Loaded {len(load_info.loads_ids)} packages")
```

### dlt 設定（`dlt/.dlt/config.toml`）

```toml
[sources.{system}_source]
api_url = "https://api.yoursystem.com"
```

### dlt シークレット（`dlt/.dlt/secrets.toml`）

```toml
[sources.{system}_source]
api_key = "your_api_key_here"

[destination.postgres.credentials]
database = "process_mining_db"
username = "process_mining"
password = "your_password"
host = "postgres"
port = 5432
```

**設定キーの命名規則**: ソースファイル名（`{system}_source.py`）→ 設定セクション（`[sources.{system}_source]`）

### dbt staging SQL（`dbt/models/staging/{system}/stg_{system}_{entity}.sql`）

```sql
{{
  config(
    materialized='view'
  )
}}

WITH source AS (
    SELECT * FROM {{ source('bronze_raw', 'bronze_{system}_{entity}') }}
),

user_mapping AS (
    SELECT * FROM public.master_user_mapping
    WHERE source_system = '{system}'
),

case_extraction AS (
    SELECT
        s.*,
        COALESCE(um.employee_id, 'SYSTEM') AS user_employee_id
    FROM source s
    LEFT JOIN user_mapping um ON um.user_identifier = s.user_id
),

events AS (
    -- Record Created event
    SELECT
        case_id,
        'Record Created' AS activity,
        created_at::timestamptz AT TIME ZONE 'UTC' AS timestamp,
        '{system}' AS source_system,
        user_employee_id AS employee_id,
        jsonb_build_object('record_id', id) AS attributes_json
    FROM case_extraction

    UNION ALL

    -- Record Completed event
    SELECT
        case_id,
        'Record Completed' AS activity,
        updated_at::timestamptz AT TIME ZONE 'UTC' AS timestamp,
        '{system}' AS source_system,
        user_employee_id AS employee_id,
        jsonb_build_object('record_id', id) AS attributes_json
    FROM case_extraction
    WHERE status = 'completed' AND updated_at IS NOT NULL
)

SELECT * FROM events
```

### Bronze sources 定義（`dbt/models/bronze/_bronze__sources.yml`）

```yaml
sources:
  - name: bronze_raw
    schema: bronze_raw
    tables:
      - name: bronze_{system}_{entity}
```

### stg_all_events.sql への追加（dlt ソースの場合）

```sql
UNION ALL

SELECT
    process_type,
    case_id,
    activity,
    timestamp,
    employee_id AS resource
FROM {{ ref('stg_{system}_{entity}') }}
```

---

## パターン3: 成果データ

### 成果 CSV（`dbt/seeds/outcome_{process}_{year}.csv`）

```csv
process_type,case_id,metric_name,metric_value,metric_unit
order-to-cash,ORD-001,revenue,150000,JPY
order-to-cash,ORD-001,profit_margin,0.255,percent
```

### 成果マートモデル（dlt ソース用: `dbt/models/marts/outcome_{system}_{process}.sql`）

```sql
{{ config(materialized='table') }}

WITH case_timeline AS (
    SELECT
        process_type,
        case_id,
        MIN(timestamp) AS start_ts,
        MAX(timestamp) AS end_ts
    FROM {{ ref('stg_{system}_{entity}') }}
    GROUP BY process_type, case_id
)

SELECT
    process_type,
    case_id,
    'lead_time_days' AS metric_name,
    EXTRACT(EPOCH FROM (end_ts - start_ts)) / 86400.0 AS metric_value,
    'days' AS metric_unit
FROM case_timeline
WHERE end_ts IS NOT NULL AND start_ts IS NOT NULL
```

### fct_case_outcomes.sql への追加

```sql
UNION ALL

SELECT
    process_type,
    case_id,
    metric_name,
    metric_value::numeric,
    metric_unit
FROM {{ ref('outcome_{source}') }}
```

---

## 組織マスターデータ

### master_employees.csv

```csv
employee_id,employee_name,role,department_id
EMP-001,田中太郎,営業,DEPT-SALES
EMP-002,佐藤花子,経理,DEPT-ACCOUNTING
```

### master_departments.csv

```csv
department_id,department_name,department_type,parent_department_id
DEPT-SALES,営業部,営業部門,
DEPT-ACCOUNTING,経理部,管理部門,
```

### master_user_mapping.csv

```csv
source_system,user_identifier,employee_id,notes
github,tanaka-dev,EMP-001,GitHub developer account
gitlab,tanaka.dev,EMP-001,GitLab developer account
jira,tanaka@example.com,EMP-001,Jira developer account
```

---

## fct_event_log スキーマ

| カラム | データ型 | 説明 |
| --- | --- | --- |
| process_type | varchar | プロセスタイプ（例: order-to-cash） |
| case_id | varchar | ケースID |
| activity | varchar | アクティビティ名 |
| timestamp | timestamp | イベント発生日時 |
| resource | varchar | employee_id のエイリアス |
| employee_id | varchar | 社員ID |
| employee_name | varchar | 社員名 |
| role | varchar | 役割 |
| department_id | varchar | 部署ID |
| department_name | varchar | 部署名 |
| department_type | varchar | 部署タイプ |
| parent_department_id | varchar | 親部署ID |

## fct_case_outcomes スキーマ

| カラム | データ型 | 説明 |
| --- | --- | --- |
| process_type | varchar | プロセスタイプ |
| case_id | varchar | ケースID（fct_event_log と対応） |
| metric_name | varchar | メトリック名（例: revenue, lead_time_days） |
| metric_value | numeric | メトリック値 |
| metric_unit | varchar | 単位（例: JPY, percent, days, count） |

---

## 実行コマンド

### CSV 投入 + dbt 実行

```bash
docker compose -f compose.dev.yml run --rm dbt bash -c "cd /app/dbt && dbt seed && dbt run"
# テスト
docker compose -f compose.dev.yml run --rm dbt bash -c "cd /app/dbt && dbt test"
```

### dlt パイプライン実行

```bash
docker compose -f compose.dev.yml --profile dlt run --rm dlt python pipelines/{system}_pipeline.py
# その後 dbt で変換
docker compose -f compose.dev.yml run --rm dbt bash -c "cd /app/dbt && dbt run"
```

### 利用者環境（compose.yml）

```bash
docker compose run --rm dbt bash -c "cd /app/dbt && dbt seed && dbt run"
docker compose --profile dlt run --rm dlt python pipelines/{system}_pipeline.py
```
