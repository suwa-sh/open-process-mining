# 利用ガイド - 自組織でのプロセスマイニング実施方法

このドキュメントでは、open-process-miningを使って自組織のプロセスデータを分析する手順を説明します。

## 目次

1. [前提知識](#前提知識)
2. [環境構築とデプロイメント](#環境構築とデプロイメント)
3. [データ準備の全体フロー](#データ準備の全体フロー)
4. [ステップ1: イベントログデータの準備](#ステップ1-イベントログデータの準備)
5. [ステップ2: 組織マスターデータの準備](#ステップ2-組織マスターデータの準備)
6. [ステップ3: 成果データの準備（オプション）](#ステップ3-成果データの準備オプション)
7. [ステップ4: dbtでのデータ投入](#ステップ4-dbtでのデータ投入)
8. [ステップ5: Web UIでの分析実施](#ステップ5-web-uiでの分析実施)
9. [バックアップとリストア](#バックアップとリストア)
10. [トラブルシューティング](#トラブルシューティング)

## 前提知識

### プロセスマイニングとは

プロセスマイニングは、業務システムのログデータから実際のプロセスフローを可視化・分析する手法です。以下の3つの分析が可能です：

- **プロセス分析**: 業務の流れ（受注→入金→出荷など）を可視化
- **組織分析**: 担当者・部署間の連携や作業負荷を分析
- **成果分析**: プロセスパスと成果（売上、利益率など）の関係を分析

### 必要なデータ

プロセスマイニングには最低限、以下の情報が必要です：

| 項目 | 説明 | 例 |
|------|------|-----|
| **ケースID** | 一連のプロセスを識別するID | 注文番号、応募者ID |
| **アクティビティ** | 実施された作業の名称 | 受注登録、入金確認 |
| **タイムスタンプ** | イベント発生日時 | 2025-10-01 09:02:00 |
| **リソース（担当者）** | 作業を実施した人・システム | EMP-001, SYSTEM |

## 環境構築とデプロイメント

### 前提条件

- Docker 20.10以上
- Docker Compose V2
- 最低4GB以上のメモリ
- 最低10GB以上のディスク空き容量

### デプロイ手順

#### 方法1: GitHub Container Registry (GHCR) のイメージを使用（推奨）

本番環境では、ビルド済みのDockerイメージを使用することを推奨します。

**1. 環境変数の設定**

```bash
# リポジトリをクローン（設定ファイルのみ取得）
git clone https://github.com/suwa-sh/open-process-mining.git
cd open-process-mining

# 環境変数ファイルを作成
cp .env.example .env
# .envを編集して本番環境用のパスワード等を設定
```

**2. 本番用Docker Composeで起動**

```bash
# GHCRのイメージを使用
docker compose -f docker-compose.prod.yml up -d

# ヘルスチェック確認
docker compose -f docker-compose.prod.yml ps
```

**3. データベース初期化（初回のみ）**

```bash
# バックエンドコンテナに入る
docker compose -f docker-compose.prod.yml exec backend bash

# dbt設定
cd /app/dbt
dbt deps
dbt seed  # サンプルデータ（オプション）
dbt run

exit
```

**メリット**:
- ビルド時間不要（イメージはビルド済み）
- マルチアーキテクチャ対応（amd64/arm64）
- 最新の安定版を自動取得

#### 方法2: ソースからビルド（開発環境向け）

**1. リポジトリのクローン**

```bash
git clone https://github.com/suwa-sh/open-process-mining.git
cd open-process-mining
```

#### 2. 環境変数の設定

`.env.example` をコピーして `.env` ファイルを作成し、必要に応じて編集します。

```bash
cp .env.example .env
```

**環境変数一覧**:

| 変数名 | デフォルト値 | 説明 | 必須 |
|-------|------------|------|-----|
| `POSTGRES_USER` | `process_mining` | PostgreSQLのユーザー名 | ✅ |
| `POSTGRES_PASSWORD` | `secure_password` | PostgreSQLのパスワード（**本番環境では必ず変更**） | ✅ |
| `POSTGRES_DB` | `process_mining_db` | データベース名 | ✅ |
| `POSTGRES_PORT` | `5432` | PostgreSQLのポート | ✅ |
| `API_HOST` | `0.0.0.0` | バックエンドAPIのホスト | ✅ |
| `API_PORT` | `8000` | バックエンドAPIのポート | ✅ |
| `VITE_API_BASE_URL` | `http://localhost:8000` | フロントエンドからのAPI接続URL | ✅ |

**本番環境での設定例**:

```env
# 本番環境では強力なパスワードを設定
POSTGRES_PASSWORD=your_strong_password_here

# 本番環境のAPI URL（例: https://api.example.com）
VITE_API_BASE_URL=https://your-api-domain.com
```

#### 3. コンテナの起動

```bash
# コンテナをビルドして起動
docker compose up -d

# ログを確認（全サービス）
docker compose logs -f

# 特定のサービスのログを確認
docker compose logs backend -f
```

#### 4. ヘルスチェック確認

```bash
# コンテナの状態とヘルスチェックを確認
docker compose ps

# 全サービスが (healthy) と表示されることを確認
# NAME                      STATUS
# process-mining-backend    Up (healthy)
# process-mining-db         Up (healthy)
# process-mining-frontend   Up (healthy)
```

#### 5. 初回セットアップ

```bash
# バックエンドコンテナに入る
docker compose exec backend bash

# dbtディレクトリに移動
cd /app/dbt

# dbt依存関係のインストール
dbt deps

# サンプルデータのロード（オプション）
dbt seed

# イベントログテーブルの生成
dbt run

# データテストの実行
dbt test

# コンテナから退出
exit
```

#### 6. アクセス確認

- **フロントエンド**: http://localhost:5173
- **バックエンドAPI**: http://localhost:8000
- **APIドキュメント**: http://localhost:8000/docs

### 本番環境へのデプロイ

#### セキュリティ設定

1. **CORSの設定**: `backend/src/main.py` の `allow_origins` を本番ドメインに限定

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://your-frontend-domain.com"],  # 本番ドメインを指定
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

2. **PostgreSQLのポート**: 外部からのアクセスを制限する場合、`docker-compose.yml` のポート設定を削除

```yaml
# 開発環境
ports:
  - "5432:5432"  # ホストマシンからアクセス可能

# 本番環境（推奨）
# ports設定を削除またはコメントアウト
# Dockerネットワーク内でのみアクセス可能
```

3. **環境変数の管理**: `.env` ファイルを安全に管理し、Gitにコミットしない（`.gitignore` に追加済み）

#### データ永続化

PostgreSQLデータは `.data/postgres/` ディレクトリに永続化されます。

```bash
# データディレクトリの確認
ls -la .data/postgres/

# バックアップ前にコンテナを停止（推奨）
docker compose stop postgres
```

### アップデート手順

```bash
# 最新のコードを取得
git pull origin main

# コンテナを再ビルドして起動
docker compose up -d --build

# ヘルスチェック確認
docker compose ps
```

## データ準備の全体フロー

```
┌─────────────────────┐
│ ソースシステム       │  例: 基幹システム、CRM、SFA
│ (DB, ログ, CSV)     │
└──────────┬──────────┘
           │
           │ 1. データ抽出・整形
           ↓
┌─────────────────────┐
│ CSVファイル準備      │  dbt/seeds/ に配置
│ - イベントログ       │  - raw_*.csv
│ - 組織マスター       │  - master_*.csv
│ - 成果データ         │  - outcome_*.csv
└──────────┬──────────┘
           │
           │ 2. dbt seed & run
           ↓
┌─────────────────────┐
│ PostgreSQL DB       │  自動的にテーブル作成
│ - fct_event_log     │
│ - master_employees  │
│ - fct_case_outcomes │
└──────────┬──────────┘
           │
           │ 3. Web UIで分析実施
           ↓
┌─────────────────────┐
│ 分析結果の保存       │
│ - プロセスマップ     │
│ - 組織分析          │
│ - 成果分析          │
└─────────────────────┘
```

## ステップ1: イベントログデータの準備

### 1.1 データ形式

イベントログは、以下の5つのカラムを含むCSVファイルとして準備してください。

**ファイル名**: `dbt/seeds/raw_<プロセス名>.csv`
**例**: `dbt/seeds/raw_order_events.csv`

**必須カラム**:

| カラム名 | データ型 | 必須 | 説明 | 例 |
|---------|---------|------|------|-----|
| `process_type` | 文字列 | ✅ | プロセスを識別する一意な名前 | `order-delivery`, `employee-onboarding` |
| `case_id` | 文字列 | ✅ | ケースを識別するID | `PO-001`, `CAND-001` |
| `status` | 文字列 | ✅ | アクティビティ名（業務ステップ） | `受注登録`, `入金確認` |
| `event_time` | タイムスタンプ | ✅ | イベント発生日時 | `2025-10-01 09:02:00` |
| `employee_id` | 文字列 | ✅ | 担当者ID（組織分析で使用） | `EMP-001`, `SYSTEM` |

### 1.2 サンプルデータ

```csv
process_type,case_id,status,event_time,employee_id
order-delivery,PO-001,受注登録,2025-10-01 09:02:00,EMP-001
order-delivery,PO-001,入金確認,2025-10-01 09:05:00,SYSTEM
order-delivery,PO-001,出荷完了,2025-10-02 14:30:00,EMP-004
order-delivery,PO-001,配送完了,2025-10-04 11:00:00,EMP-005
order-delivery,PO-002,受注登録,2025-10-01 10:15:00,EMP-002
order-delivery,PO-002,入金エラー,2025-10-01 10:20:00,SYSTEM
order-delivery,PO-002,入金確認,2025-10-01 14:30:00,EMP-001
```

### 1.3 データ抽出のヒント

#### SQLデータベースから抽出する場合

```sql
-- 基本的なイベントログ抽出クエリの例
SELECT
  'your-process-type' as process_type,
  order_id as case_id,
  status_name as status,
  updated_at as event_time,
  updated_by as employee_id
FROM order_status_history
WHERE updated_at >= '2025-01-01'
ORDER BY order_id, updated_at;
```

#### データ抽出時の注意点

1. **タイムスタンプの形式**: `YYYY-MM-DD HH:MM:SS` 形式で出力
2. **文字エンコーディング**: UTF-8で保存
3. **カンマ・改行を含むデータ**: ダブルクォートで囲む
4. **NULL値の扱い**: 空文字または適切なデフォルト値に置き換え

## ステップ2: 組織マスターデータの準備

組織分析を実施する場合、社員と部署のマスターデータが必要です。

### 2.1 社員マスター

**ファイル名**: `dbt/seeds/master_employees.csv`

**必須カラム**:

| カラム名 | データ型 | 必須 | 説明 | 例 |
|---------|---------|------|------|-----|
| `employee_id` | 文字列 | ✅ | 社員ID（イベントログと一致） | `EMP-001` |
| `employee_name` | 文字列 | ✅ | 社員名 | `Alice` |
| `department_id` | 文字列 | ✅ | 部署ID | `DEPT-SALES` |
| `role` | 文字列 | ✅ | 役割・職種 | `営業担当` |
| `hire_date` | 日付 | ❌ | 入社日（オプション） | `2020-04-01` |

**サンプル**:

```csv
employee_id,employee_name,department_id,role,hire_date
EMP-001,Alice,DEPT-SALES,営業担当,2020-04-01
EMP-002,Bob,DEPT-SALES,営業担当,2021-06-15
EMP-003,Carol,DEPT-SALES,営業リーダー,2019-01-10
SYSTEM,システム自動処理,DEPT-IT,システム,
```

### 2.2 部署マスター

**ファイル名**: `dbt/seeds/master_departments.csv`

**必須カラム**:

| カラム名 | データ型 | 必須 | 説明 | 例 |
|---------|---------|------|------|-----|
| `department_id` | 文字列 | ✅ | 部署ID | `DEPT-SALES` |
| `department_name` | 文字列 | ✅ | 部署名 | `営業部` |
| `department_type` | 文字列 | ❌ | 部署タイプ（オプション） | `販売部門` |
| `parent_department_id` | 文字列 | ❌ | 親部署ID（オプション） | `DEPT-SALES-HQ` |

**サンプル**:

```csv
department_id,department_name,department_type,parent_department_id
DEPT-SALES,営業部,販売部門,
DEPT-WAREHOUSE,倉庫,業務部門,
DEPT-DELIVERY,配送部,業務部門,
DEPT-IT,情報システム部,管理部門,
```

## ステップ3: 成果データの準備（オプション）

成果分析を実施する場合、ケース別の成果指標データが必要です。

### 3.1 データ形式

**ファイル名**: `dbt/seeds/outcome_<プロセス名>.csv`
**例**: `dbt/seeds/outcome_order_delivery.csv`

**必須カラム**:

| カラム名 | データ型 | 必須 | 説明 | 例 |
|---------|---------|------|------|-----|
| `process_type` | 文字列 | ✅ | プロセスタイプ（イベントログと一致） | `order-delivery` |
| `case_id` | 文字列 | ✅ | ケースID（イベントログと一致） | `PO-001` |
| `metric_name` | 文字列 | ✅ | メトリック名 | `revenue`, `profit_margin` |
| `metric_value` | 数値 | ✅ | メトリック値 | `1200000`, `0.25` |
| `metric_unit` | 文字列 | ✅ | 単位 | `JPY`, `percent`, `count` |

### 3.2 サンプルデータ

```csv
process_type,case_id,metric_name,metric_value,metric_unit
order-delivery,PO-001,revenue,1200000,JPY
order-delivery,PO-001,profit_margin,0.25,percent
order-delivery,PO-001,quantity,50,count
order-delivery,PO-002,revenue,850000,JPY
order-delivery,PO-002,profit_margin,0.18,percent
order-delivery,PO-002,quantity,30,count
```

### 3.3 よく使われるメトリック例

| 業種・プロセス | メトリック名 | 単位 | 説明 |
|--------------|-------------|------|------|
| 受注プロセス | `revenue` | JPY | 売上金額 |
| 受注プロセス | `profit_margin` | percent | 利益率 |
| 受注プロセス | `customer_satisfaction` | score | 顧客満足度 |
| 採用プロセス | `candidate_score` | score | 候補者評価スコア |
| 採用プロセス | `time_to_hire` | days | 採用期間（日数） |
| サポートプロセス | `resolution_time` | hours | 解決時間 |
| サポートプロセス | `customer_rating` | score | 顧客評価 |

## ステップ4: dbtでのデータ投入

### 4.1 CSVファイルの配置

準備したCSVファイルを `dbt/seeds/` ディレクトリに配置します。

```bash
dbt/seeds/
├── raw_order_events.csv           # あなたのイベントログ
├── master_employees.csv           # 社員マスター
├── master_departments.csv         # 部署マスター
└── outcome_order_delivery.csv     # 成果データ（オプション）
```

### 4.2 dbt設定の確認

`dbt/dbt_project.yml` を確認し、新しいseedファイルが認識されているか確認します。

```yaml
seeds:
  open_process_mining:
    +schema: public
```

### 4.3 データ投入コマンド

```bash
# バックエンドコンテナに入る
docker compose exec backend bash

# dbtディレクトリに移動
cd /app/dbt

# seedデータをロード
dbt seed

# イベントログテーブルを生成
dbt run

# データの整合性を確認
dbt test
```

### 4.4 データ確認

PostgreSQLに接続してデータが正しく投入されたか確認します。

```bash
# PostgreSQLに接続
docker compose exec postgres psql -U process_mining -d process_mining_db

# イベントログを確認
SELECT process_type, COUNT(*) as event_count
FROM public.fct_event_log
GROUP BY process_type;

# 終了
\q
```

## ステップ5: Web UIでの分析実施

### 5.1 Web UIへのアクセス

ブラウザで http://localhost:5173 を開きます。

### 5.2 プロセス分析の作成

1. トップ画面の「新規分析を作成」ボタンをクリック
2. 以下の項目を入力：
   - **分析名**: わかりやすい名前（例: `受注プロセス_2025年10月`）
   - **プロセスタイプ**: 準備したプロセスを選択
   - **分析対象期間の基準**: 必要に応じて期間を絞り込み
3. 「プレビュー」で対象データを確認
4. 「分析を実行」をクリック

### 5.3 組織分析の作成

1. 画面上部の「🏢 組織分析」ボタンをクリック
2. 「新規組織分析を作成」をクリック
3. 以下の項目を入力：
   - **分析名**: わかりやすい名前
   - **プロセスタイプ**: 分析対象のプロセスを選択
   - **分析対象期間の基準**: 必要に応じて期間を絞り込み
4. 「分析を実行」をクリック
5. 分析詳細画面で、社員別・部署別の集計レベルを切り替え可能

### 5.4 成果分析の作成

1. 画面上部の「📊 成果分析」ボタンをクリック
2. 「新規分析を作成」をクリック
3. 以下の項目を入力：
   - **分析名**: わかりやすい名前
   - **プロセスタイプ**: 分析対象のプロセスを選択
   - **メトリック**: 分析したい成果指標を選択
   - **分析タイプ**: パス別成果分析 or セグメント比較
   - **分析対象期間**: 必要に応じて期間を絞り込み
4. 「作成」をクリック

## バックアップとリストア

### データベースのバックアップ

#### 方法1: pg_dump を使用（推奨）

```bash
# PostgreSQLコンテナ内でバックアップを作成
docker compose exec postgres pg_dump -U process_mining process_mining_db > backup_$(date +%Y%m%d_%H%M%S).sql

# 圧縮してバックアップ
docker compose exec postgres pg_dump -U process_mining process_mining_db | gzip > backup_$(date +%Y%m%d_%H%M%S).sql.gz
```

#### 方法2: データディレクトリのコピー

```bash
# コンテナを停止
docker compose stop postgres

# データディレクトリをコピー
cp -r .data/postgres .data/postgres_backup_$(date +%Y%m%d)

# コンテナを再起動
docker compose start postgres
```

### データベースのリストア

#### 方法1: SQL ファイルからリストア

```bash
# バックアップファイルをコンテナにコピー
docker cp backup_20251005.sql process-mining-db:/tmp/

# コンテナ内でリストア
docker compose exec postgres psql -U process_mining -d process_mining_db -f /tmp/backup_20251005.sql

# 圧縮ファイルからリストア
gunzip -c backup_20251005.sql.gz | docker compose exec -T postgres psql -U process_mining -d process_mining_db
```

#### 方法2: データディレクトリからリストア

```bash
# コンテナを停止
docker compose stop postgres

# 現在のデータを削除
rm -rf .data/postgres/*

# バックアップからリストア
cp -r .data/postgres_backup_20251005/* .data/postgres/

# コンテナを再起動
docker compose start postgres
```

### 自動バックアップの設定

#### cronによる定期バックアップ（Linux/Mac）

```bash
# crontabを編集
crontab -e

# 毎日深夜2時にバックアップを実行（例）
0 2 * * * cd /path/to/open-process-mining && docker compose exec -T postgres pg_dump -U process_mining process_mining_db | gzip > /backups/process_mining_$(date +\%Y\%m\%d).sql.gz
```

### バックアップのベストプラクティス

1. **定期的なバックアップ**: 最低でも週1回、本番環境では日次バックアップを推奨
2. **バックアップの検証**: 定期的にリストアテストを実施
3. **世代管理**: 最低3世代のバックアップを保持
4. **オフサイトバックアップ**: クラウドストレージ等への保存を推奨
5. **バックアップ前の確認**: データの整合性を確認

## トラブルシューティング

### Q1: イベントログが表示されない

**原因と対処法**:
- `dbt run` を実行したか確認
- `public.fct_event_log` テーブルにデータが存在するか確認
  ```sql
  SELECT COUNT(*) FROM public.fct_event_log;
  ```
- `process_type` の値が正しいか確認

### Q2: 組織分析でエラーが出る

**原因と対処法**:
- `master_employees.csv` と `master_departments.csv` が配置されているか確認
- イベントログの `employee_id` が社員マスターに存在するか確認
  ```sql
  SELECT DISTINCT e.employee_id
  FROM public.fct_event_log e
  LEFT JOIN public.master_employees m ON e.employee_id = m.employee_id
  WHERE m.employee_id IS NULL;
  ```

### Q3: 成果分析でメトリックが表示されない

**原因と対処法**:
- `outcome_*.csv` ファイルが配置され、`dbt seed` が実行されているか確認
- `public.fct_case_outcomes` テーブルにデータが存在するか確認
  ```sql
  SELECT process_type, metric_name, COUNT(*) as count
  FROM public.fct_case_outcomes
  GROUP BY process_type, metric_name;
  ```

### Q4: 日本語が文字化けする

**原因と対処法**:
- CSVファイルの文字エンコーディングがUTF-8であることを確認
- Excelで保存した場合、UTF-8 BOM付きになっている可能性があるため、テキストエディタで確認

### Q5: タイムスタンプの形式エラー

**原因と対処法**:
- `event_time` カラムが `YYYY-MM-DD HH:MM:SS` 形式であることを確認
- 時刻部分が欠けている場合は `00:00:00` を補完

## 次のステップ

データ投入と分析作成が完了したら、以下の高度な機能も試してみてください：

1. **パスフィルタリング**: 低頻度のパスを非表示にして重要なフローに集中
2. **メトリクス切り替え**: 頻度と待機時間を切り替えてボトルネックを発見
3. **比較分析**: 改善前後のプロセスを比較して効果を測定
4. **セグメント比較**: 高成果パスと低成果パスの構造的な違いを分析

詳細な機能説明は [README.md](README.md) を参照してください。
