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

### ステップ1: 環境構築（5分）

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

### ステップ2: サンプルデータで動作確認（10分）

```bash
# サンプルデータを生成（6プロセス、620ケース、3,907イベント）
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

### ステップ3: Web UIで確認（2分）

ブラウザで <http://localhost:5173> を開く

**初期状態**: 分析結果が0件表示される

### ステップ4: 分析を実行（3分）

Web UI上で「新規作成」ボタンから分析を作成：

**1. プロセス分析**:

- プロセスタイプ: `order-delivery`（受注配送）
- 分析名: 「受注配送プロセス_2024」
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

### カスタマイズポイント1: イベントログデータの準備（最重要）

**場所**: `dbt/seeds/raw_<your_process>_2024.csv`

**必須カラム**:

```csv
case_id,activity,timestamp,employee_id
ORD-001,受注登録,2024-01-15 09:00:00,EMP-001
ORD-001,入金確認,2024-01-15 14:30:00,EMP-002
ORD-001,出荷完了,2024-01-16 10:15:00,EMP-003
```

**カスタマイズ方法**:

1. 自社システムからエクスポート（例: 販売管理システム、CRM、ERP）
2. 上記フォーマットに変換
3. `dbt/seeds/`に配置

**データ抽出例（受注プロセス）**:

- **ケースID**: 注文番号（ORDER_ID）
- **アクティビティ**: ステータス変更（ORDER_STATUS）
- **タイムスタンプ**: ステータス更新日時（UPDATED_AT）
- **担当者**: 担当者ID（EMPLOYEE_ID）

### カスタマイズポイント2: dbt stagingモデルの作成

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

### カスタマイズポイント3: 組織マスターデータ（組織分析を使う場合）

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

### カスタマイズポイント4: 成果データ（成果分析を使う場合）

**場所**: `dbt/seeds/outcome_<your_process>.csv`

**フォーマット**:

```csv
process_type,case_id,metric_name,metric_value,metric_unit
order-delivery,ORD-001,revenue,150000,JPY
order-delivery,ORD-001,profit_margin,25.5,percent
order-delivery,ORD-002,revenue,280000,JPY
```

**カスタマイズ方法**:

1. 成果指標を決定（売上、利益率、満足度など）
2. ケースIDと紐付け
3. `dbt/models/marts/fct_case_outcomes.sql`に追加

### カスタマイズポイント5: プロセスタイプの追加

**場所**: `backend/src/config.py`（存在しない場合は新規作成不要、データで自動認識）

**現在サポート済み**:

- `order-delivery`: 受注配送
- `employee-onboarding`: 入社手続
- `itsm`: ITサポート
- `billing`: 請求
- `invoice-approval`: 請求書承認
- `system-development`: システム開発

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
recruitment,APPLICANT-001,time_to_hire_days,20,days
recruitment,APPLICANT-001,satisfaction_score,4.5,score
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
A: 現在はバッチ処理のみ。日次でdbt runを実行し、Web UIから新規分析を作成してください。

**Q6: データベースをリセットしたい場合は？**

```bash
# コンテナとボリュームを完全削除
docker compose down -v

# コンテナを再起動（DBが初期化される）
docker compose up -d

# サンプルデータを再生成
python scripts/generate_sample_data.py

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
docker compose exec postgres psql -U process_mining -d process_mining_db -c "SELECT COUNT(*) FROM analysis_results;"
```

問題が解決しない場合は、[GitHub Issues](https://github.com/suwa-sh/open-process-mining/issues)で報告してください。
