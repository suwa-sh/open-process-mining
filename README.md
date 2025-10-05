# open-process-mining

オープンソースのプロセスマイニングプラットフォーム - データ準備から分析、可視化までの一貫したワークフローを提供

> 💡 **自組織でプロセスマイニングを始めたい方へ**: [利用ガイド (USAGE.md)](USAGE.md) で、データ準備から分析実施までの詳細な手順を説明しています。

## 概要

**open-process-mining** は、データエンジニアとプロセスアナリストの関心事を分離し、それぞれに最適化されたツールを提供するプロセスマイニングプラットフォームです。

### 主な特徴

- **データ加工**: dbt Coreによる再現可能なデータパイプライン
- **分析エンジン**: DFG (Directly-Follows Graph) ベースのプロセス発見
- **インタラクティブな可視化**: React FlowとChakra UIによるリッチなWeb UI
  - ドラッグ&ドロップでノードを自由に配置
  - 頻度の高いパスは太い青線で表示（ハッピーパス）
  - 処理時間が長いパスは赤線で警告表示
  - パスフィルター機能で重要なフローに集中
  - メトリクス切り替え時もレイアウトを維持
- **日本語対応**: プロセス名、分析名の完全日本語化
- **MIT License**: 商用利用も含めた自由な利用が可能

## アーキテクチャ

```
┌─────────────────┐
│  Data Engineer  │──┐
└─────────────────┘  │
                     ├──> dbt (Data Transformation)
┌─────────────────┐  │         ↓
│ Process Analyst │──┘    PostgreSQL
└─────────────────┘         ↓
                       Backend (FastAPI)
                         ↓
                    Frontend (React)
```

### 技術スタック

- **データ加工**: dbt Core, PostgreSQL
- **バックエンド**: Python 3.9+, FastAPI, Pandas, NetworkX
- **フロントエンド**: React, TypeScript, Vite, Chakra UI, React Flow
- **インフラ**: Docker Compose

## クイックスタート

### 前提条件

- Docker & Docker Compose
- Git

### セットアップ

1. **リポジトリのクローン**

```bash
git clone https://github.com/suwa-sh/open-process-mining.git
cd open-process-mining
```

2. **環境変数の設定**

```bash
cp .env.example .env
# 必要に応じて .env を編集
```

3. **コンテナの起動**

```bash
docker compose up -d
```

4. **dbtでデータ準備**

```bash
# バックエンドコンテナに入る
docker compose exec backend bash

# dbtディレクトリに移動
cd /app/dbt

# dbt依存関係のインストール
dbt deps

# サンプルデータをロード（2024年1年分、620ケース、3,907イベント）
dbt seed

# イベントログテーブルを生成
dbt run

# データテストを実行
dbt test
```

5. **Web UIにアクセス**

ブラウザで <http://localhost:5173> を開く

### 主要な画面

- **プロセス分析一覧** (`/`): 作成したプロセス分析の一覧を表示
- **プロセスマップ** (`/process/{id}`): DFGベースのプロセスフロー可視化
- **組織分析一覧** (`/organization`): 組織分析結果の一覧を表示
- **組織分析詳細** (`/organization/{id}`): ハンドオーバー・作業負荷・パフォーマンス分析
- **成果分析一覧** (`/outcome`): 成果分析結果の一覧を表示
- **成果分析詳細** (`/outcome/{id}`): パス別成果分析・セグメント比較

## スクリーンショット

### プロセスマップ表示

![プロセスマップ](docs/images/process-map.png)

- 日本語のプロセス名で表示
- 青い太線がハッピーパス（受注登録→入金確認→出荷完了→配送完了）
- 赤い線が問題のあるパス（配送失敗→再配送手配）

## 主要機能

### プロセスマップの可視化

- **ノードのドラッグ&ドロップ**: ノードを自由に配置して見やすいレイアウトを作成
- **パスの強調表示**:
  - 🔵 **青色の太い線**: 頻度が高いハッピーパス（最大頻度の80%以上）
  - 🔴 **赤色の線**: 処理時間が長い問題のあるパス（最大待機時間の70%以上）
- **パスフィルター**: スライダーで低頻度のパスを非表示にして重要なフローに集中
- **メトリクス切り替え**: 頻度と平均待機時間を切り替えて分析
- **レイアウト保持**: メトリクス切り替え時もドラッグした配置を維持
- **複数プロセス対応**: 異なるビジネスプロセスを同一システムで管理・分析

### 組織分析（ハンドオーバー・作業負荷・パフォーマンス）

- **🔄 ハンドオーバー分析**: 誰と誰が連携して作業しているかを可視化
  - 社員別・部署別の集計レベルを選択可能
  - ハンドオーバー間の平均待機時間を計算
  - 頻度と待機時間のメトリクス切り替え
  - パスフィルターで重要な連携に集中
- **📊 作業負荷分析**: 誰の作業量が多いかを可視化
  - アクティビティ数とケース数の集計
  - 作業が集中している担当者を特定
- **⏱️ パフォーマンス分析**: 誰の処理時間が長いかを可視化
  - 平均処理時間・中央値・合計時間を分析
  - ボトルネックになっている担当者を特定

### 成果分析（パス別成果・セグメント比較）

- **📈 パス別成果分析**: プロセスパスごとの成果指標を可視化
  - 各パスの平均値・中央値・合計値を表示
  - 成果の高いパスを自動検出（平均値の75%以上を強調表示）
  - プロセスマップ上で成果メトリックを確認
- **🔍 セグメント比較**: 高成果パスと低成果パスを比較
  - 上位25% vs 下位25%の成果比較
  - カスタム閾値による柔軟なセグメント分割
  - 統計サマリー（平均値、中央値、最小値、最大値、合計値）
  - パス構造の違いを可視化

### サンプルデータ

プロジェクトには2024年1年分の6種類のビジネスプロセスデータが含まれています（合計620ケース、3,907イベント）。

#### 1. ITSM（IT Service Management）- 150件のインシデント

**典型的なフロー:**
- **インシデント報告** → サポート割当 → 初期調査 → 解決策適用 → 検証 → **クローズ**（ハッピーパス）
- 初期調査 → **エスカレーション** → 解決策適用（複雑なケース）
- 検証 → **再オープン** → 解決策適用 → 検証 → クローズ（問題再発）

**成果指標:**
- `resolution_time_hours`: 解決時間（時間）
- `priority_weight`: 優先度ウェイト

#### 2. Billing（請求）- 180件の請求書

**典型的なフロー:**
- **請求書作成** → 承認申請 → 承認完了 → 送付 → **入金確認**（ハッピーパス）
- 承認申請 → **差戻** → 修正 → 再申請 → 承認完了（承認プロセス）

**成果指標:**
- `cycle_time_days`: サイクルタイム（日）
- `amount`: 請求金額（JPY）

#### 3. Employee Onboarding（入社手続）- 60件の応募者

**典型的なフロー:**
- **応募受付** → 書類選考 → 一次面接 → 最終面接 → 内定通知 → 入社手続 → **オリエンテーション**（ハッピーパス）
- 書類選考 → **不合格通知**（50%）
- 一次面接 → **不合格通知**（30%）
- 最終面接 → **不合格通知**（20%）

**成果指標:**
- `time_to_hire_days`: 採用リードタイム（日）
- `satisfaction_score`: 満足度スコア（1-5）

#### 4. Invoice Approval（請求書承認）- 200件の請求書

**典型的なフロー:**
- **請求書受領** → 検証割当 → 検証完了 → 承認 → 支払予定登録 → **支払実行**（ハッピーパス）
- 検証割当 → **エラー検出** → ベンダー問合せ → 修正受領 → 検証完了（エラー処理）

**成果指標:**
- `processing_days`: 処理日数（日）
- `amount`: 金額（JPY）

#### 5. System Development（システム開発）- 30件のプロジェクト

**典型的なフロー:**
- **要件定義** → 設計 → 設計承認 → 実装 → コードレビュー承認 → テスト → **デプロイ**（ハッピーパス）
- 設計 → **設計レビュー指摘** → 設計修正 → 設計承認（レビューフィードバック）
- コードレビュー承認 → **バグ発見** → バグ修正 → 再テスト → デプロイ（品質改善）

**成果指標:**
- `lead_time_days`: リードタイム（日）
- `story_points`: ストーリーポイント
- `defect_count`: 欠陥数

#### 6. Order Delivery（受注配送）- 10件の注文（従来データ）

**典型的なフロー:**
- **受注登録** → 入金確認 → 出荷完了 → **配送完了**（ハッピーパス）
- 入金エラー → 入金確認（リトライ）
- 出荷完了 → **配送失敗** → 再配送手配 → 配送完了（問題パス）

**成果指標:**
- `revenue`: 売上（JPY）
- `profit_margin`: 利益率（%）
- `quantity`: 数量

### サンプルデータ生成

新しいサンプルデータを生成する場合:

```bash
# データ生成スクリプトを実行
python generate_sample_data.py

# 生成されたデータをロード
docker compose exec backend bash
cd /app/dbt
dbt seed
dbt run
```

## 開発ワークフロー

### データエンジニア向け

#### 新しいデータソースの追加

1. `dbt/seeds/` にCSVファイルを配置
2. `dbt/models/staging/` でデータクレンジング
3. `dbt/models/marts/fct_event_log.sql` を更新

```bash
dbt seed
dbt run
dbt test
```

#### 分析の実行

```bash
# ITSM（インシデント管理）の分析
PYTHONPATH=/app python src/analysis/run_analysis.py --name "ITSM分析_2024" --process-type "itsm"

# 請求プロセスの分析
PYTHONPATH=/app python src/analysis/run_analysis.py --name "請求プロセス_2024" --process-type "billing"

# 入社手続プロセスの分析
PYTHONPATH=/app python src/analysis/run_analysis.py --name "入社手続_2024" --process-type "employee-onboarding"

# 請求書承認プロセスの分析
PYTHONPATH=/app python src/analysis/run_analysis.py --name "請求書承認_2024" --process-type "invoice-approval"

# システム開発プロセスの分析
PYTHONPATH=/app python src/analysis/run_analysis.py --name "システム開発_2024" --process-type "system-development"

# 受注配送プロセスの分析（従来データ）
PYTHONPATH=/app python src/analysis/run_analysis.py --name "受注配送_2025-10" --process-type "order-delivery"
```

### バックエンド開発者向け

#### コード品質チェック

プロジェクトでは[qlty](https://qlty.sh)を使用して、複数のlinterとformatterを統合管理しています。

```bash
# すべてのlinter/formatterを実行
qlty check

# 自動修正可能な問題を修正
qlty fmt

# 特定のファイルのみチェック
qlty check backend/src/main.py
```

**有効化されているツール:**

- **Python**: ruff (linter), black (formatter), bandit (security)
- **TypeScript/JavaScript**: prettier (formatter), radarlint (静的解析)
- **Dockerfile**: hadolint (linter), dockerfmt (formatter), checkov (security)
- **YAML**: yamllint
- **Markdown**: markdownlint
- **SQL**: sqlfluff（別途実行、詳細は下記参照）

**SQLファイルのlint:**

sqlfluffはqltyとは別に実行します：

```bash
# backend/sql/以下のSQLファイル
~/.qlty/cache/tools/sqlfluff/3.4.0-f921ba7a9b1c/bin/sqlfluff lint backend/sql/ --dialect postgres

# dbt models
~/.qlty/cache/tools/sqlfluff/3.4.0-f921ba7a9b1c/bin/sqlfluff lint dbt/models/ --dialect postgres --config .sqlfluff

# 自動修正
~/.qlty/cache/tools/sqlfluff/3.4.0-f921ba7a9b1c/bin/sqlfluff fix <file> --dialect postgres
```

#### テストの実行

```bash
# バックエンドコンテナ内
cd /app
pytest tests/
```

#### APIの動作確認

```bash
# ヘルスチェック
curl http://localhost:8000/health

# プロセス分析結果一覧を取得
curl http://localhost:8000/process/analyses

# 特定の分析結果を取得
curl http://localhost:8000/process/analyses/{analysis_id}

# 2つの分析を比較
curl "http://localhost:8000/process/compare?before={id1}&after={id2}"
```

#### APIエンドポイント

**基本API**

| エンドポイント              | メソッド | 説明                         |
| --------------------------- | -------- | ---------------------------- |
| `/health`                   | GET      | ヘルスチェック               |
| `/process/process-types`    | GET      | 利用可能なプロセスタイプ一覧 |

**プロセス分析API**

| エンドポイント                   | メソッド | 説明                                                   |
| -------------------------------- | -------- | ------------------------------------------------------ |
| `/process/analyses`              | GET      | 分析結果の一覧取得 (`?process_type=xxx`でフィルタ可能) |
| `/process/analyses/{analysis_id}`| GET      | 特定の分析結果を取得                                   |
| `/process/compare`               | GET      | 2つの分析結果を比較                                    |

**組織分析API（保存型）**

| エンドポイント                         | メソッド | 説明                                                       |
| -------------------------------------- | -------- | ---------------------------------------------------------- |
| `/organization/analyze`                | POST     | 組織分析を実行し、結果をDBに保存                           |
| `/organization/analyses`               | GET      | 組織分析結果の一覧取得 (`?process_type=xxx`でフィルタ可能) |
| `/organization/analyses/{analysis_id}` | GET      | 特定の組織分析結果を取得                                   |

**組織分析API（リアルタイム）**

| エンドポイント              | メソッド | 説明                                                                           |
| --------------------------- | -------- | ------------------------------------------------------------------------------ |
| `/organization/handover`    | GET      | ハンドオーバー分析 (`?process_type=xxx&aggregation_level=employee/department`) |
| `/organization/workload`    | GET      | 作業負荷分析 (`?process_type=xxx&aggregation_level=employee/department`)       |
| `/organization/performance` | GET      | パフォーマンス分析 (`?process_type=xxx&aggregation_level=employee/department`) |

**成果分析API**

| エンドポイント                    | メソッド | 説明                                                                       |
| --------------------------------- | -------- | -------------------------------------------------------------------------- |
| `/outcome/metrics`                | GET      | 利用可能なメトリック一覧を取得 (`?process_type=xxx`でフィルタ可能)         |
| `/outcome/analyses`               | GET      | 成果分析結果の一覧取得 (`?process_type=xxx&metric_name=xxx`でフィルタ可能) |
| `/outcome/analyses/{analysis_id}` | GET      | 特定の成果分析結果を取得                                                   |
| `/outcome/analyze`                | POST     | 成果分析を実行し、結果をDBに保存                                           |

### フロントエンド開発者向け

#### コード品質チェック

フロントエンドもqltyでlint/formatを実行できます：

```bash
# フロントエンドファイルのチェック
qlty check frontend/src/

# 自動修正
qlty fmt frontend/src/

# 特定のファイルのみ
qlty check frontend/src/App.tsx
```

**フロントエンドで有効なツール:**

- **prettier**: コードフォーマッター（TypeScript, TSX, CSS, JSON）
- **radarlint**: TypeScript静的解析（複雑度、コード品質）
- **markdownlint**: Markdownファイルの検証

**注意**: eslintはnpm経由で実行します（qltyプラグインに互換性問題があるため）：

```bash
# フロントエンドコンテナ内
npm run lint
```

#### 開発サーバー

フロントエンドは自動でホットリロードされます。

```bash
# フロントエンドコンテナ内
cd /app
npm run dev
```

#### テストの実行

```bash
npm run test
```

### E2Eテスト（Playwright）

E2Eテストは、実際のブラウザを使ってアプリケーション全体の動作を検証します。

#### 前提条件

1. Docker Composeサービスが起動していること
2. サンプルデータが投入されていること

```bash
# サービス起動
docker compose up -d

# 全サービスがhealthyになるまで待機
docker compose ps

# サンプルデータ投入
docker compose exec backend bash
cd /app/dbt
dbt deps
dbt seed
dbt run
exit
```

#### E2Eテストの実行

```bash
# E2Eディレクトリに移動
cd e2e

# 依存関係のインストール（初回のみ）
npm install

# Playwrightブラウザのインストール（初回のみ）
npx playwright install chromium

# テスト実行（ヘッドレスモード）
npm test

# UIモードで実行（対話的にテストを実行・デバッグ）
npm run test:ui

# ブラウザを表示して実行
npm run test:headed

# デバッグモード（ステップ実行）
npm run test:debug

# テストレポートを表示
npm run report
```

#### テスト内容

- **プロセス分析**: 一覧表示、新規作成、プロセスマップ表示、ナビゲーション
- **組織分析**: 一覧表示、新規作成、集計レベル切り替え、ナビゲーション
- **成果分析**: 一覧表示、パス別成果作成、セグメント比較作成、表示モード切り替え、ナビゲーション

**注意**: E2Eテストは分析処理を実際に実行するため、完了までに数分かかることがあります。タイムアウトが発生する場合は、`playwright.config.ts`の`timeout`設定を調整してください。

詳細は [e2e/README.md](e2e/README.md) を参照してください。

## データベース接続

### PostgreSQLデータの保存場所

- **Dockerボリューム**: `postgres_data`（永続化）
- **データベース名**: `process_mining_db`
- **ポート**: `localhost:5432`
- **ユーザー名**: `process_mining`（`.env`で設定）
- **パスワード**: `secure_password`（`.env`で設定）

### テーブル構成（すべて`public`スキーマ）

| テーブル/ビュー                 | タイプ   | 説明                                             |
| ------------------------------- | -------- | ------------------------------------------------ |
| `raw_order_events`              | テーブル | dbt seedの生データ                               |
| `stg_raw_order_events`          | ビュー   | dbtステージングモデル                            |
| `fct_event_log`                 | テーブル | プロセスマイニング用イベントログ（組織情報含む） |
| `fct_case_outcomes`             | テーブル | ケース別成果データ（メトリック値）               |
| `analysis_results`              | テーブル | プロセス分析結果（JSON形式）                     |
| `organization_analysis_results` | テーブル | 組織分析結果（JSON形式）                         |
| `outcome_analysis_results`      | テーブル | 成果分析結果（JSON形式）                         |
| `master_employees`              | テーブル | 社員マスター                                     |
| `master_departments`            | テーブル | 部署マスター                                     |

`fct_event_log` スキーマ:

- `case_id`: ケースID
- `activity`: アクティビティ名
- `timestamp`: イベント発生日時
- `resource`: リソース（従来の担当者）
- `employee_id`: 社員ID（組織分析用）
- `employee_name`: 社員名（組織分析用）
- `role`: 役割（組織分析用）
- `department_id`: 部署ID（組織分析用）
- `department_name`: 部署名（組織分析用）
- `department_type`: 部署タイプ（組織分析用）
- `process_type`: プロセスタイプ

### 接続方法

#### 方法1: Dockerコンテナ内でpsqlを使用（推奨）

```bash
# PostgreSQLコンテナに入る
docker compose exec postgres psql -U process_mining -d process_mining_db

# スキーマ一覧を確認
\dn

# テーブル一覧を確認
\dt public.*

# ビュー一覧を確認
\dv public.*

# イベントログを確認
SELECT * FROM public.fct_event_log LIMIT 10;

# 分析結果を確認
SELECT analysis_id, analysis_name, created_at FROM public.analysis_results;

# 終了
\q
```

#### 方法2: ホストマシンからpsqlで接続

```bash
# psqlがインストールされている場合
psql -h localhost -p 5432 -U process_mining -d process_mining_db
# パスワード: secure_password
```

#### 方法3: GUIツールで接続（TablePlus、DBeaver、pgAdminなど）

接続情報:

- **Host**: `localhost`
- **Port**: `5432`
- **Database**: `process_mining_db`
- **User**: `process_mining`
- **Password**: `secure_password`

### よく使うSQL

```sql
-- イベントログ全件取得
SELECT * FROM public.fct_event_log
ORDER BY case_id, timestamp;

-- ケース別のイベント数
SELECT case_id, COUNT(*) as event_count
FROM public.fct_event_log
GROUP BY case_id;

-- アクティビティ別の頻度
SELECT activity, COUNT(*) as frequency
FROM public.fct_event_log
GROUP BY activity
ORDER BY frequency DESC;

-- プロセス分析結果一覧
SELECT
  analysis_id,
  analysis_name,
  created_at,
  jsonb_array_length(result_data->'nodes') as node_count,
  jsonb_array_length(result_data->'edges') as edge_count
FROM public.analysis_results
ORDER BY created_at DESC;

-- 組織分析結果一覧
SELECT
  analysis_id,
  analysis_name,
  process_type,
  aggregation_level,
  created_at
FROM public.organization_analysis_results
ORDER BY created_at DESC;

-- 成果分析結果一覧
SELECT
  analysis_id,
  analysis_name,
  process_type,
  metric_name,
  analysis_type,
  created_at
FROM public.outcome_analysis_results
ORDER BY created_at DESC;

-- ケース別成果データ
SELECT
  process_type,
  case_id,
  metric_name,
  metric_value,
  metric_unit
FROM public.fct_case_outcomes
WHERE process_type = 'employee-onboarding'
ORDER BY case_id, metric_name;
```

## プロジェクト構成

```
open-process-mining/
├── dbt/                # dbtプロジェクト
│   ├── seeds/          # サンプルデータ
│   ├── models/         # データモデル
│   └── tests/          # データテスト
├── backend/            # バックエンド (Python/FastAPI)
│   ├── src/
│   │   ├── analysis/   # 分析エンジン
│   │   ├── api/        # APIエンドポイント
│   │   └── models/     # データモデル
│   └── tests/          # テスト
├── frontend/           # フロントエンド (React/TypeScript)
│   ├── src/
│   │   ├── components/ # UIコンポーネント
│   │   ├── hooks/      # カスタムフック
│   │   └── store/      # 状態管理
│   └── tests/          # テスト
└── docker-compose.yml  # Docker設定
```

## ドキュメント

### 利用者向け

- **[USAGE.md](USAGE.md)**: 自組織でプロセスマイニングを実施する方法（データ準備から分析実施まで）

### 開発者向け

- [CLAUDE.md](CLAUDE.md): Claude Code向けの開発ガイド

## ライセンス

MIT License - 詳細は [LICENSE](LICENSE) を参照

## コントリビューション

Issue、Pull Requestを歓迎します。

## 参考資料

- [dbt documentation](https://docs.getdbt.com/)
- [FastAPI documentation](https://fastapi.tiangolo.com/)
- [React Flow documentation](https://reactflow.dev/)
- [Chakra UI documentation](https://chakra-ui.com/)
