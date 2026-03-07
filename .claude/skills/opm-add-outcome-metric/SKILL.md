---
name: opm-add-outcome-metric
description: "open-process-miningに成果メトリックを追加します。成果データCSVまたはdbtマートモデルを生成し、fct_case_outcomesに統合して成果分析を可能にします。「成果メトリックを追加」「成果分析データを作成」「KPIを追加」「メトリックを定義」「outcomeデータを追加」「成果指標を設定」などのキーワードで発動します。"
argument-hint: "プロセスタイプ名、メトリック名、またはメトリックの説明"
---

# 成果メトリックの追加

プロセスタイプに成果メトリック（KPI）を追加し、パス別成果分析・セグメント比較を可能にします。

## 共有リソース

- パターン集: `../opm-core/references/data-pipeline-patterns.md`

## 出力先

- 成果CSV: `dbt/seeds/outcome_{process}_{year}.csv`（CSV投入の場合）
- 成果マートSQL: `dbt/models/marts/outcome_{source}.sql`（dltソースからの計算の場合）
- 統合マート: `dbt/models/marts/fct_case_outcomes.sql`（追記）

## ワークフロー

### Step 1: 入力情報の収集

ユーザーに以下を確認する:

1. **対象プロセスタイプ**: 既存の process_type（例: `order-to-cash`）
2. **メトリック定義**:
   - metric_name: snake_case（例: `revenue`, `lead_time_days`, `customer_satisfaction`）
   - metric_unit: 単位（例: `JPY`, `days`, `percent`, `count`, `score`）
   - 計算方法: 外部データ or イベントログから算出
3. **データソース**: CSV手動投入 or イベントログから計算

### Step 2: メトリックの設計

**CSV手動投入の場合**:
- ケースIDとメトリック値の対応を整理
- サンプルデータを提示して確認

**イベントログから計算の場合**:
- 計算ロジックを設計（例: リードタイム = MAX(timestamp) - MIN(timestamp)）
- SQL式を提示して確認

### Step 3: データファイルの生成

**CSV手動投入の場合**:

`../opm-core/references/data-pipeline-patterns.md` の「パターン3」を参照し:

1. `dbt/seeds/outcome_{process}_{year}.csv` を生成

```csv
process_type,case_id,metric_name,metric_value,metric_unit
{process-type},{case-id},{metric-name},{value},{unit}
```

**イベントログから計算の場合**:

1. `dbt/models/marts/outcome_{source}.sql` を生成

```sql
{{ config(materialized='table') }}

WITH case_timeline AS (
    SELECT
        process_type,
        case_id,
        MIN(timestamp) AS start_ts,
        MAX(timestamp) AS end_ts
    FROM {{ ref('stg_{source}') }}
    GROUP BY process_type, case_id
)

SELECT
    process_type,
    case_id,
    '{metric_name}' AS metric_name,
    {calculation_expression} AS metric_value,
    '{metric_unit}' AS metric_unit
FROM case_timeline
WHERE start_ts IS NOT NULL AND end_ts IS NOT NULL
```

### Step 4: fct_case_outcomes.sql への統合

`dbt/models/marts/fct_case_outcomes.sql` に UNION ALL を追加:

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

### Step 5: 検証

以下のコマンドで動作確認を案内:

```bash
# dbt seed + run
docker compose -f compose.dev.yml run --rm dbt bash -c "cd /app/dbt && dbt seed && dbt run"

# dbt test
docker compose -f compose.dev.yml run --rm dbt bash -c "cd /app/dbt && dbt test"

# 成果データの確認
docker compose -f compose.dev.yml exec postgres psql -U process_mining -d process_mining_db \
  -c "SELECT process_type, metric_name, COUNT(*), AVG(metric_value) FROM fct_case_outcomes GROUP BY process_type, metric_name;"
```

### Step 6: 結果の提示

生成したファイル一覧と、Web UIでの成果分析手順を案内:

1. ブラウザで http://localhost:5173 を開く
2. 「成果分析」タブに移動
3. 「新規作成」ボタンをクリック
4. プロセスタイプと追加したメトリックを選択
5. 分析タイプ（パス別成果 or セグメント比較）を選択
6. 「作成」をクリック

## よくあるメトリックパターン

| メトリック名 | 計算方法 | 単位 |
| --- | --- | --- |
| lead_time_days | MAX(timestamp) - MIN(timestamp) | days |
| cycle_time_days | 特定アクティビティ間の所要時間 | days |
| revenue | 外部データ（売上） | JPY |
| profit_margin | 外部データ（利益率） | percent |
| customer_satisfaction | 外部データ（顧客満足度） | score |
| resolution_time_hours | クローズまでの時間 | hours |

## 注意事項

- case_id は fct_event_log の case_id と一致させること
- 1つの case_id に複数のメトリックを紐付け可能（行を分ける）
- metric_value は numeric 型にキャスト可能な値であること
- 成果分析APIは metric_name でフィルタリングするため、命名を統一すること
