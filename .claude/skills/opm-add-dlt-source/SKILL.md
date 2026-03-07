---
name: opm-add-dlt-source
description: "open-process-miningにdlt (data load tool) を使った外部システム連携データソースを追加します。dltソース、パイプライン、dbt stagingモデル、設定ファイルを一式生成します。「dltソースを追加」「外部APIからデータ取得」「dltパイプラインを作成」「外部システム連携」「APIからイベントログ」「dltでデータ投入」などのキーワードで発動します。"
argument-hint: "連携先システム名、API仕様、またはデータの説明"
---

# dlt外部システム連携によるデータソース追加

外部APIやデータベースからdltでデータを抽出し、dbt経由でopen-process-miningに投入するパイプラインを一式生成します。

## 共有リソース

- パターン集: `../opm-core/references/data-pipeline-patterns.md`

## 出力先

- dltソース: `dlt/sources/{system}_source.py`
- dltパイプライン: `dlt/pipelines/{system}_pipeline.py`
- dlt設定: `dlt/.dlt/config.toml`（追記）, `dlt/.dlt/secrets.toml.example`（追記）
- dbt staging: `dbt/models/staging/{system}/stg_{system}_{entity}.sql`
- Bronze sources: `dbt/models/bronze/_bronze__sources.yml`（追記）
- ユーザーマッピング: `dbt/seeds/master_user_mapping.csv`（追記）

## ワークフロー

### Step 1: 入力情報の収集

ユーザーに以下を確認する:

1. **連携先システム名**: snake_case（例: `salesforce`, `servicenow`）
2. **API仕様**: エンドポイント、認証方式、レスポンス構造
3. **プロセスタイプ名**: kebab-case（例: `crm-lead-management`）
4. **イベント定義**: どのデータがどのアクティビティに対応するか
5. **組織分析の要否**: ユーザー識別子フィールドの特定

### Step 2: dltソースの生成

`../opm-core/references/data-pipeline-patterns.md` の「パターン2」を参照し:

1. `dlt/sources/{system}_source.py` を生成
   - `@dlt.resource` デコレータで各エンティティを定義
   - ページネーション対応
   - 増分ロード対応（`since` パラメータ）
   - ユーザー識別子フィールドを必ず含める（組織分析用）
2. `@dlt.source` でリソースを束ねる

### Step 3: dltパイプラインの生成

1. `dlt/pipelines/{system}_pipeline.py` を生成
   - `dataset_name="bronze_raw"` を指定
   - エラーハンドリングを含める

### Step 4: dlt設定ファイルの更新

1. `dlt/.dlt/config.toml` にソース設定を追記
2. `dlt/.dlt/secrets.toml.example` に認証情報のテンプレートを追記

**設定キーの命名規則**: ソースファイル名 `{system}_source.py` → セクション `[sources.{system}_source]`

### Step 5: dbt staging モデルの生成

1. `dbt/models/bronze/_bronze__sources.yml` に Bronze テーブル定義を追加
2. `dbt/models/staging/{system}/stg_{system}_{entity}.sql` を生成
   - `user_mapping` CTE でユーザーマッピングを実装
   - `case_extraction` CTE で case_id を生成
   - `events` CTE でアクティビティイベントを生成
3. `dbt/models/staging/stg_all_events.sql` に UNION ALL を追加
4. `dbt/seeds/master_user_mapping.csv` にマッピングエントリを追記

### Step 6: 検証

以下のコマンドで動作確認を案内:

```bash
# dlt パイプライン実行
docker compose -f compose.dev.yml --profile dlt run --rm dlt python pipelines/{system}_pipeline.py

# dbt 変換実行
docker compose -f compose.dev.yml run --rm dbt bash -c "cd /app/dbt && dbt run"

# dbt テスト
docker compose -f compose.dev.yml run --rm dbt bash -c "cd /app/dbt && dbt test"

# Bronze層のデータ確認
docker compose -f compose.dev.yml exec postgres psql -U process_mining -d process_mining_db \
  -c "SELECT COUNT(*) FROM bronze_raw.bronze_{system}_{entity};"

# イベントログ確認
docker compose -f compose.dev.yml exec postgres psql -U process_mining -d process_mining_db \
  -c "SELECT process_type, COUNT(*) FROM fct_event_log GROUP BY process_type;"
```

### Step 7: 結果の提示

生成したファイル一覧と次のステップを案内:
- secrets.toml の認証情報設定
- パイプラインの初回実行
- Web UIでの分析作成

## 注意事項

- `dlt/.dlt/secrets.toml` は gitignore 対象。`secrets.toml.example` を参考にユーザーが作成する
- dltはDockerコンテナ内で実行される。`--profile dlt` でオプション起動
- Bronze層（`bronze_raw`スキーマ）にはdltの管理カラム（`_dlt_load_id`, `_dlt_id`）が自動追加される
- タイムスタンプはUTCに正規化すること（`::timestamptz AT TIME ZONE 'UTC'`）
- 既存のdltソース（`dlt/sources/github_source.py` 等）を参考実装として参照可能
