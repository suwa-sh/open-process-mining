# Scripts

プロジェクト全体で使用するユーティリティスクリプト集。

## generate_sample_data.py

### 概要

1年分のプロセスマイニング用サンプルデータを生成するスクリプト。
ETLプロセスをシミュレートし、各ソースシステム固有のスキーマでCSVファイルを出力します。

### 特徴

- **ソースシステム別スキーマ**: 各プロセスタイプごとに異なる列名・データ構造
- **リアルなデータパターン**: 失敗ケース、待機時間、分岐フローを含む
- **再現可能性**: 固定シード値により常に同じデータを生成

### 生成されるプロセスタイプ

| プロセスタイプ      | ケース数       | イベント数（概算） | ソースシステムスキーマ                                                  |
| ------------------- | -------------- | ------------------ | ----------------------------------------------------------------------- |
| Order Delivery      | 50件           | 356イベント        | order_id, order_status, status_changed_at, employee_id                  |
| Employee Onboarding | 40人           | 165イベント        | candidate_id, recruitment_status, status_changed_at, responsible_person |
| ITSM                | 150件          | 981イベント        | incident_id, status, reported_at, assigned_to                           |
| Billing             | 180件          | 1011イベント       | bill_id, bill_status, status_changed_at, employee_id                    |
| Invoice Approval    | 200件          | 1290イベント       | invoice_id, approval_status, status_time, processor_id                  |
| System Development  | 30プロジェクト | 262イベント        | project_id, phase, phase_changed_at, developer_id                       |

**合計**: 約4,200イベント + 1,350件の成果データ

### 使用方法

```bash
# リポジトリルートから実行
python scripts/generate_sample_data.py

# または絶対パスで実行
python /path/to/open-process-mining/scripts/generate_sample_data.py
```

### 出力ファイル

生成されるCSVファイルは `dbt/seeds/` に保存されます：

**イベントデータ**:

- `raw_order_delivery_2024.csv`
- `raw_employee_onboarding_2024.csv`
- `raw_itsm_2024.csv`
- `raw_billing_2024.csv`
- `raw_invoice_approval_2024.csv`
- `raw_system_development_2024.csv`

**成果データ**:

- `outcome_order_delivery_2024.csv`
- `outcome_employee_onboarding_2024.csv`
- `outcome_itsm_2024.csv`
- `outcome_billing_2024.csv`
- `outcome_invoice_approval_2024.csv`
- `outcome_system_development_2024.csv`

### データフロー

```txt
┌─────────────────────────────────┐
│ scripts/                         │
│  generate_sample_data.py         │  ← このスクリプト
└─────────────┬───────────────────┘
              │ 生成
              ▼
┌─────────────────────────────────┐
│ dbt/seeds/                       │
│  raw_*.csv (ソース固有スキーマ)   │
│  outcome_*.csv                   │
└─────────────┬───────────────────┘
              │ dbt seed
              ▼
┌─────────────────────────────────┐
│ PostgreSQL (public schema)       │
│  raw_* テーブル                  │
└─────────────┬───────────────────┘
              │ dbt run
              ▼
┌─────────────────────────────────┐
│ dbt/models/staging/              │
│  stg_*.sql (標準化変換)          │
└─────────────┬───────────────────┘
              │
              ▼
┌─────────────────────────────────┐
│ dbt/models/marts/                │
│  fct_event_log (統合イベントログ) │
│  fct_case_outcomes (成果データ)  │
└─────────────────────────────────┘
```

### データ再生成手順

データを再生成する場合は以下の手順で実行します：

```bash
# 1. サンプルデータを生成
python scripts/generate_sample_data.py

# 2. Dockerコンテナ内でdbtを実行
docker compose exec backend bash -c "cd /app/dbt && dbt seed --full-refresh && dbt run"
```

### カスタマイズ

スクリプト内の以下のパラメータを変更することで、データ量を調整できます：

```python
# 各プロセスタイプの生成関数内
for i in range(1, 51):  # ← この数値を変更してケース数を調整
```

### 注意事項

- **固定シード値**: `random.seed(42)` により、実行するたびに同じデータが生成されます
- **日付範囲**: 2024年1月1日〜12月31日のデータを生成
- **既存ファイル上書き**: 既存のCSVファイルは警告なく上書きされます
