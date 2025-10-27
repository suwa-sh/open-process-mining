# 利用ガイド - 自組織でのプロセスマイニング実施方法

> 📘 このドキュメントは**自組織でプロセスマイニングを実施したい方**向けです
> 💡 開発者向けの情報（技術スタック、API、テスト）は [README.md](README.md) と [CLAUDE.md](CLAUDE.md) を参照

このドキュメントでは、open-process-miningを使って自組織のプロセスデータを分析する手順を説明します。

## 目次

1. [ゼロから分析結果を確認するまでの手順](#ゼロから分析結果を確認するまでの手順)
2. [自組織データに合わせたカスタマイズポイント](#自組織データに合わせたカスタマイズポイント)
3. [実際の導入例](#実際の導入例)
4. [よくある質問](#よくある質問)

## 🚀 ゼロから分析結果を確認するまでの手順

### ステップ1: 環境構築

```bash
# リポジトリをクローン
git clone https://github.com/suwa-sh/open-process-mining.git
cd open-process-mining

# 環境変数を設定
cp .env.example .env

# Dockerコンテナを起動
docker compose up -d

# 全サービスが起動するまで待機（30秒程度）
docker compose ps
```

### ステップ2: サンプルデータで動作確認

```bash
# サンプルデータを生成（8プロセス、約700ケース、4,400イベント + 1,350件の成果データ）
python scripts/generate_sample_data.py

# バックエンドコンテナに入る
docker compose exec backend bash

# dbtでデータ投入
cd /app/dbt
dbt deps
dbt seed
dbt run
dbt test

exit
```

### ステップ3: Web UIで確認

ブラウザで <http://localhost:5173> を開く

**初期状態**: 分析結果が0件表示される

### ステップ4: 分析を実行

Web UI上で「新規作成」ボタンから分析を作成：

**1. プロセス分析**:

- プロセスタイプ: `order-to-cash`（受注から入金）
- 分析名: 「受注から入金プロセス\_2024」
- 「作成」ボタンをクリック
- → プロセスマップが表示される

**2. 組織分析**:

- 組織分析タブに移動
- 「新規作成」ボタン
- プロセスタイプ: `employee-onboarding`（入社手続）
- 集計レベル: 「社員別」
- → ハンドオーバー図、作業負荷、パフォーマンスチャートが表示される

**3. 成果分析**:

- 成果分析タブに移動
- 「新規作成」ボタン
- プロセスタイプ: `billing`（請求）
- メトリック: `amount`（請求金額）
- 分析タイプ: 「パス別成果」
- → 高収益パスが青線で強調表示される

---

## 🔧 自組織データに合わせたカスタマイズポイント

### データ投入の2つのパターン

自組織のデータ規模と運用形態に応じて、以下のいずれかを選択してください。

| パターン              | 用途               | データ量        | 更新頻度 | 技術レベル |
| --------------------- | ------------------ | --------------- | -------- | ---------- |
| **パターン1（簡易）** | PoC、初回検証      | ~1,000ケース    | 手動更新 | 初級       |
| **パターン2（本格）** | 継続運用、定期分析 | 1,000ケース以上 | 自動更新 | 中級       |

---

## パターン1: CSV手動投入（簡易・PoC向け）

### ステップ1: イベントログデータの準備

**場所**: `dbt/seeds/raw_<your_process>_2024.csv`

**必須カラム**:

```csv
case_id,activity,timestamp,employee_id
ORD-001,受注登録,2024-01-15 09:00:00,EMP-001
ORD-001,入金確認,2024-01-15 14:30:00,EMP-002
ORD-001,出荷完了,2024-01-16 10:15:00,EMP-003
```

**データ準備方法**:

1. 自社システムからエクスポート（例: 販売管理システム、CRM、ERP）
2. 上記フォーマットに変換（Excel、Python、SQLなど）
3. `dbt/seeds/`に配置
4. `dbt seed`で投入

**データ抽出例（受注プロセス）**:

- **ケースID**: 注文番号（ORDER_ID）
- **アクティビティ**: ステータス変更（ORDER_STATUS）
- **タイムスタンプ**: ステータス更新日時（UPDATED_AT）
- **担当者**: 担当者ID（EMPLOYEE_ID）

### ステップ2: dbt stagingモデルの作成

**場所**: `dbt/models/staging/stg_<your_process>_2024.sql`

**作成例**（営業プロセスの場合）:

```sql
-- 営業プロセスのステージングモデル
SELECT
    'sales-process' as process_type,
    opportunity_id as case_id,
    stage_name as activity,
    stage_changed_at::timestamp as timestamp,
    owner_id as resource
FROM {{ ref('raw_sales_2024') }}
WHERE opportunity_id IS NOT NULL
    AND stage_name IS NOT NULL
    AND stage_changed_at IS NOT NULL
```

**カスタマイズ方法**:

1. `stg_order_delivery_2024.sql`をコピー
2. process_type、カラム名を変更
3. `stg_all_events.sql`に UNION ALL で追加

### ステップ3: 組織マスターデータ（組織分析を使う場合）

**場所**:

- `dbt/seeds/master_employees.csv`
- `dbt/seeds/master_departments.csv`

**master_employees.csv**:

```csv
employee_id,employee_name,role,department_id
EMP-001,田中太郎,営業,DEPT-SALES
EMP-002,佐藤花子,経理,DEPT-ACCOUNTING
```

**カスタマイズ方法**:

1. 人事システムからエクスポート
2. 上記フォーマットに変換
3. `dbt/seeds/`に配置
4. `dbt seed`で投入

### ステップ4: 成果データ（成果分析を使う場合）

**場所**: `dbt/seeds/outcome_<your_process>.csv`

**フォーマット**:

```csv
process_type,case_id,metric_name,metric_value,metric_unit
order-to-cash,ORD-001,revenue,150000,JPY
order-to-cash,ORD-001,profit_margin,0.255,percent
order-to-cash,ORD-002,revenue,280000,JPY
```

**カスタマイズ方法**:

1. 成果指標を決定（売上、利益率、満足度など）
2. ケースIDと紐付け
3. `dbt/models/marts/fct_case_outcomes.sql`に追加

---

## パターン2: dlt自動投入（本格運用向け）

### 概要

dlt（data load tool）を使用して、外部APIやデータベースから自動的にデータを抽出します。

**メリット**:

- 定期実行による自動データ更新
- 大量データの効率的な処理
- 増分ロード（差分更新）対応
- エラーリトライ機能

**前提条件**:

- Pythonの基本知識
- REST API または データベース接続の経験

### ステップ1: dltソースの作成

**場所**: `dlt/sources/your_system_source.py`

**サンプル（REST API）**:

```python
"""Your System data source for dlt."""
import dlt
from typing import Iterator, Any
import requests

@dlt.resource(write_disposition="append", primary_key="id")
def your_system_records(
    api_url: str,
    api_key: str = dlt.secrets.value,
) -> Iterator[dict[str, Any]]:
    """Extract records from your system API."""
    headers = {"Authorization": f"Bearer {api_key}"}
    response = requests.get(f"{api_url}/api/records", headers=headers)
    response.raise_for_status()

    for record in response.json():
        yield {
            "id": record["id"],
            "case_id": record["order_id"],
            "status": record["status"],
            "updated_at": record["updated_at"],
            "user_id": record["user_id"],
        }
```

**参考**: `dlt/sources/github_source.py` にGitHub API連携の実装例があります。

### ステップ2: dltパイプラインの作成

**場所**: `dlt/pipelines/your_system_pipeline.py`

```python
"""Your System pipeline."""
import dlt
from sources.your_system_source import your_system_records

if __name__ == "__main__":
    pipeline = dlt.pipeline(
        pipeline_name="your_system_pipeline",
        destination="postgres",
        dataset_name="bronze_raw",
    )

    load_info = pipeline.run(
        your_system_records(
            api_url=dlt.config["sources.your_system.api_url"]
        )
    )

    print(f"Loaded {len(load_info.loads_ids)} packages")
```

### ステップ3: dlt設定ファイルの編集

**dlt/.dlt/config.toml**:

```toml
[sources.your_system]
api_url = "https://api.yoursystem.com"
```

**dlt/.dlt/secrets.toml**:

```toml
[sources.your_system]
api_key = "your_api_key_here"

[destination.postgres.credentials]
database = "process_mining_db"
username = "process_mining"
password = "your_password"
host = "postgres"
port = 5432
```

### ステップ4: dbtステージングモデルの作成

**場所**: `dbt/models/staging/your_system/stg_your_system.sql`

```sql
{{
  config(
    materialized='view'
  )
}}

-- Bronze層（dltで投入）からステージングへ変換
SELECT
    'your-process' AS process_type,
    case_id,
    status AS activity,
    updated_at::timestamptz AS timestamp,
    'your_system' AS source_system,
    jsonb_build_object('record_id', id) AS attributes_json
FROM {{ source('bronze_raw', 'your_system_records') }}
WHERE case_id IS NOT NULL
```

**Bronze層sources定義**: `dbt/models/bronze/_bronze__sources.yml`にテーブル定義を追加

### ステップ5: パイプラインの実行

**手動実行**:

```bash
# dltコンテナでパイプライン実行
docker compose run --rm --profile dlt dlt python pipelines/your_system_pipeline.py

# dbtでステージング→マート変換
docker compose exec backend bash -c "cd /app/dbt && dbt run"
```

**定期実行（cron）**:

```bash
# crontabに追加（毎日午前2時）
0 2 * * * cd /path/to/open-process-mining && docker compose run --rm --profile dlt dlt python pipelines/your_system_pipeline.py && docker compose exec backend bash -c "cd /app/dbt && dbt run"
```

詳細は [dlt/README.md](dlt/README.md) を参照してください。

---

### プロセスタイプの追加

**場所**: 設定ファイルは不要（データドリブン）

**現在サポート済み**:

- `order-to-cash`: 受注から入金
- `billing`: 請求
- `invoice-approval`: 請求書承認
- `employee-onboarding`: 入社手続
- `itsm`: ITサポート
- `system-development`: システム開発
- `gitlab-devops`: GitLab開発プロセス
- `hybrid-devops`: Jira + GitLab + Jenkins開発プロセス

**新規追加方法**:
プロセスタイプは**データドリブン**なので、`fct_event_log`に新しい`process_type`を投入すれば自動的に認識されます。コード変更は不要です。

---

## 📊 実際の導入例

### 例1: 社内の問い合わせ管理プロセス

**データソース**: Redmine/JIRAチケット履歴

**準備するデータ**:

```csv
case_id,activity,timestamp,employee_id
TICKET-001,新規登録,2024-01-10 09:00:00,EMP-SUPPORT-01
TICKET-001,担当者割当,2024-01-10 09:15:00,EMP-MANAGER-01
TICKET-001,調査開始,2024-01-10 10:00:00,EMP-SUPPORT-01
TICKET-001,解決,2024-01-11 15:30:00,EMP-SUPPORT-01
TICKET-001,クローズ,2024-01-12 09:00:00,EMP-SUPPORT-01
```

**分析観点**:

- **プロセス分析**: どのルートが多いか（新規→解決 vs 新規→エスカレーション→解決）
- **組織分析**: どの担当者に作業が集中しているか
- **成果分析**: 解決時間が短いパスはどれか

### 例2: 採用プロセス

**データソース**: ATS（採用管理システム）

**準備するデータ**:

```csv
case_id,activity,timestamp,employee_id
APPLICANT-001,応募受付,2024-01-05 10:00:00,EMP-HR-01
APPLICANT-001,書類選考,2024-01-08 14:00:00,EMP-HR-02
APPLICANT-001,一次面接,2024-01-15 15:00:00,EMP-MANAGER-01
APPLICANT-001,最終面接,2024-01-22 16:00:00,EMP-CEO-01
APPLICANT-001,内定通知,2024-01-25 10:00:00,EMP-HR-01
```

**成果データ**:

```csv
process_type,case_id,metric_name,metric_value,metric_unit
employee-onboarding,APPLICANT-001,recruitment_cost,500000,JPY
employee-onboarding,APPLICANT-001,recruitment_days,20,days
employee-onboarding,APPLICANT-001,candidate_score,85.5,score
```

**分析観点**:

- **プロセス分析**: 不合格通知がどこで発生しているか
- **組織分析**: 面接官の作業負荷
- **成果分析**: 採用リードタイムが短いパスはどれか

---

## ⚡ よくある質問

**Q1: データ量の目安は？**
A: 最低30ケース以上推奨。1000ケース以上あれば統計的に有意な分析が可能。

**Q2: タイムスタンプが秒単位でない場合は？**
A: 日次データでもOK。`2024-01-15`のようにタイムスタンプを記録すれば動作します。

**Q3: 複数システムのデータを統合したい場合は？**
A: 各システムごとに`raw_<system>_2024.csv`を作成し、stagingモデルで統合します。

**Q4: アクティビティ名は日本語でもいい？**
A: はい、完全対応しています。「受注登録」「入金確認」など日本語推奨です。

**Q5: リアルタイム分析は可能？**
A: 5分単位などのマイクロバッチでdbt runを実行し、分析したいタイミングでWeb UIから新規分析を作成してください。

**Q6: データベースをリセットしたい場合は？**

```bash
# コンテナとボリュームを完全削除
docker compose down -v

# コンテナを再起動（DBが初期化される）
docker compose up -d

# dbtでデータ投入
docker compose exec backend bash -c "cd /app/dbt && dbt seed && dbt run"
```

**Q7: 本番環境へのデプロイ方法は？**
A: 詳細は[README.md](README.md)の「デプロイ手順」セクションを参照してください。GitHub Container Registry (GHCR) のビルド済みイメージを使用することを推奨します。

**Q8: セキュリティ設定は？**
A: `.env`ファイルでデータベースパスワードを変更してください。本番環境では必ず強力なパスワードを設定し、外部からのアクセスを制限してください。

---

## 📚 関連ドキュメント

- **[README.md](README.md)**: プロジェクト概要とクイックスタート
- **[CLAUDE.md](CLAUDE.md)**: 開発者向けガイド（dbt、API、テスト実行方法）

## 🆘 トラブルシューティング

### コンテナが起動しない

```bash
# ログを確認
docker compose logs

# 特定のサービスのログを確認
docker compose logs backend
docker compose logs postgres
```

### dbt seedでエラーが発生する

```bash
# CSVファイルのフォーマットを確認
# - UTF-8エンコーディングか
# - カラム名が正しいか
# - 必須カラムが全て存在するか

# dbt接続確認
docker compose exec backend bash -c "cd /app/dbt && dbt debug"
```

### Web UIに分析結果が表示されない

```bash
# バックエンドAPIが正常に動作しているか確認
curl http://localhost:8000/health

# データベースにイベントログが存在するか確認
docker compose exec postgres psql -U process_mining -d process_mining_db -c "SELECT COUNT(*) FROM fct_event_log;"

# 分析結果が存在するか確認
docker compose exec postgres psql -U process_mining -d process_mining_db -c "SELECT COUNT(*) FROM process_analysis_results;"
```

問題が解決しない場合は、[GitHub Issues](https://github.com/suwa-sh/open-process-mining/issues)で報告してください。
