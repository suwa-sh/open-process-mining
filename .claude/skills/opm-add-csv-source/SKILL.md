---
name: opm-add-csv-source
description: "open-process-miningに新しいプロセスタイプをCSV手動投入で追加します。CSVデータとdbt stagingモデルを生成し、stg_all_eventsに統合します。「新しいプロセスを追加」「CSVデータソースを追加」「プロセスタイプを追加」「イベントログを投入」「dbt seedデータを作成」「CSVからプロセスマイニング」などのキーワードで発動します。"
argument-hint: "プロセス名、データの説明、または元データのファイルパス"
---

# CSV手動投入による新規データソース追加

自組織のイベントログCSVデータからdbt stagingモデルを生成し、open-process-miningに新しいプロセスタイプを追加します。

## 共有リソース

- パターン集: `../opm-core/references/data-pipeline-patterns.md`

## 出力先

- CSV: `dbt/seeds/raw_{process}_{year}.csv`
- staging SQL: `dbt/models/staging/stg_{process}_{year}.sql`
- 組織マスター（必要時）: `dbt/seeds/master_employees.csv`, `dbt/seeds/master_departments.csv`

## ワークフロー

### Step 1: 入力情報の収集

ユーザーに以下を確認する:

1. **プロセス名**: kebab-case（例: `order-to-cash`, `ticket-management`）
2. **データソース**: どのシステムからデータを取得するか
3. **元データ**: CSVファイルパス、またはデータの構造説明
4. **組織分析の要否**: 社員マスターが必要か

### Step 2: 元データの解析

元データが提供された場合:
1. CSVファイルを読み込み、カラム構成を確認
2. ケースID、アクティビティ、タイムスタンプ、担当者に該当するカラムを特定
3. カラムマッピングをユーザーに提示して確認

元データがない場合:
1. ユーザーの説明からプロセスフローを整理
2. アクティビティ一覧を提案
3. サンプルCSVデータを生成

### Step 3: CSVファイルの生成

`../opm-core/references/data-pipeline-patterns.md` の「パターン1」を参照し、以下を生成:

1. `dbt/seeds/raw_{process}_{year}.csv` - イベントログデータ
2. 組織分析が必要な場合:
   - `dbt/seeds/master_employees.csv` への追記（既存ファイルがあれば追記）
   - `dbt/seeds/master_departments.csv` への追記

### Step 4: dbt staging モデルの生成

`../opm-core/references/data-pipeline-patterns.md` の「パターン1」の staging SQL テンプレートに従い:

1. `dbt/models/staging/stg_{process}_{year}.sql` を生成
2. `dbt/models/staging/stg_all_events.sql` に UNION ALL を追加

### Step 5: 検証

以下のコマンドで動作確認を案内:

```bash
# dbt seed でCSV投入
docker compose -f compose.dev.yml run --rm dbt bash -c "cd /app/dbt && dbt seed"

# dbt run で変換実行
docker compose -f compose.dev.yml run --rm dbt bash -c "cd /app/dbt && dbt run"

# dbt test でデータ品質チェック
docker compose -f compose.dev.yml run --rm dbt bash -c "cd /app/dbt && dbt test"

# データ件数の確認
docker compose -f compose.dev.yml exec postgres psql -U process_mining -d process_mining_db \
  -c "SELECT process_type, COUNT(*) FROM fct_event_log GROUP BY process_type;"
```

### Step 6: 結果の提示

生成したファイル一覧と、Web UIでの分析作成手順を案内:

1. ブラウザで http://localhost:5173 を開く
2. 「新規作成」ボタンをクリック
3. プロセスタイプから追加したプロセスを選択
4. 分析名を入力して「作成」

## 注意事項

- process_type はデータドリブン。コード変更なしで自動認識される
- タイムスタンプは `YYYY-MM-DD HH:MM:SS` 形式推奨
- CSVはUTF-8エンコーディングで保存すること
- 最低30ケース以上のデータを推奨
