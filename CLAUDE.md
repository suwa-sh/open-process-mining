# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要

**open-process-mining** は、データ準備から分析、可視化までの一貫したプロセスマイニングワークフローを提供するOSSプラットフォームです。データエンジニアとプロセスアナリストの関心事を分離し、それぞれに最適化されたツールを提供します。

### ターゲットユーザー

1. **データエンジニア/アナリスト (CLI User)**: `dbt`とPythonスクリプトで再現可能なデータパイプラインと分析を構築
2. **プロセスアナリスト/業務改善担当者 (Web UI User)**: 事前に準備されたデータをブラウザ上でインタラクティブに探索

## アーキテクチャ

プロジェクトは3層のアーキテクチャで構成されます：

### 1. データ加工レイヤー (dbt Core)
- Rawデータをイベントログ形式に変換
- PostgreSQLをデータストアとして使用（`public`スキーマ）
- 主要テーブル: `fct_event_log` (case_id, activity, timestamp, resource, employee_id, employee_name, role, department_id, department_name)
- 組織情報を含むマスターデータ: `master_employees`, `master_departments`

### 2. バックエンド (Python)

**分析スクリプト (`run_analysis.py`)**:
- イベントログからDFG (Directly-Follows Graph)を生成
- パフォーマンス指標を計算（頻度、平均待機時間）
- 結果をReact Flow互換のJSON形式で`analysis_results`テーブルに保存

**APIサーバー (`main.py` - FastAPI)**:

プロセス分析API:
- `GET /analyses`: 分析結果の一覧を提供（`?process_type=xxx`でフィルタ可能）
- `GET /analyses/{analysis_id}`: 特定の分析結果のJSONデータを提供
- `GET /compare`: 2つの分析結果の差分を計算

組織分析API (`/organization`):
- `POST /organization/analyze`: 組織分析を実行し、結果をDBに保存
- `GET /organization/analyses`: 組織分析結果の一覧を取得
- `GET /organization/analyses/{analysis_id}`: 特定の組織分析結果を取得
- `GET /organization/handover`: ハンドオーバー分析（リアルタイム）
- `GET /organization/workload`: 作業負荷分析（リアルタイム）
- `GET /organization/performance`: パフォーマンス分析（リアルタイム）

### 3. フロントエンド (React + TypeScript)

**技術スタック**:
- **フレームワーク**: React with TypeScript
- **グラフ可視化**: `@xyflow/react` (React Flow)
- **自動レイアウト**: `elkjs`
- **状態管理**: `zustand`
- **UIライブラリ**: Chakra UI

**主要コンポーネント**:

プロセスマイニング:
- `ProcessMap.tsx`: DFGプロセスフロー可視化（メインビュー）
- `ActionNode.tsx`: カスタムノードコンポーネント（アクティビティ表示）
- `AnalysisList.tsx`: 分析結果一覧画面
- `CreateAnalysisModal.tsx`: 新規分析作成モーダル

組織分析:
- `OrganizationAnalysisList.tsx`: 組織分析結果一覧画面
- `OrganizationAnalysisDetail.tsx`: 組織分析詳細画面（保存済み分析の表示）
- `CreateOrganizationAnalysisModal.tsx`: 新規組織分析作成モーダル
- `HandoverNetwork.tsx`: ハンドオーバーネットワーク図（社員/部署間の連携可視化）
- `WorkloadChart.tsx`: 作業負荷チャート
- `PerformanceChart.tsx`: パフォーマンスチャート
- `OrganizationNode.tsx`: 組織分析用カスタムノード

**主要機能**:
- インタラクティブなプロセスマップ表示
- パスフィルタリング（頻度閾値による動的フィルタ）
- メトリクス切替（頻度 vs. 待機時間）
- ハッピーパス強調（頻度80%以上: 青い太線）
- 問題パス警告（待機時間70%以上: 赤線）
- プロセス比較画面（改善前後の効果測定）
- 組織分析（ハンドオーバー、作業負荷、パフォーマンス）
- 社員別・部署別の集計レベル切り替え

## データモデル

### Event Log Schema (`public.fct_event_log`)
**重要**: dbtは`public`スキーマにテーブルを作成します。

| 列名 | データ型 | 説明 |
|------|---------|------|
| process_type | varchar | プロセスタイプ（例: order-delivery, employee-onboarding） |
| case_id | varchar | ケースID（例: order_id） |
| activity | varchar | アクティビティ名（例: 受注登録、入金確認） |
| timestamp | timestamp | イベント発生日時 |
| resource | varchar | リソース（employee_idのエイリアス） |
| employee_id | varchar | 社員ID（例: EMP-001） |
| employee_name | varchar | 社員名（例: Tanaka） |
| role | varchar | 役割（例: Sales） |
| department_id | varchar | 部署ID（例: DEPT-HR） |
| department_name | varchar | 部署名（例: 人事部） |
| department_type | varchar | 部署タイプ（例: 管理部門） |
| parent_department_id | varchar | 親部署ID |

### Analysis Result Schema (`public.analysis_results`)
| 列名 | データ型 | 説明 |
|------|---------|------|
| analysis_id | uuid | 分析結果の一意なID |
| analysis_name | varchar | 分析名（日本語対応） |
| process_type | varchar | プロセスタイプ |
| created_at | timestamp | 作成日時 |
| result_data | JSONB | React Flow互換のJSONデータ |

### Organization Analysis Result Schema (`public.organization_analysis_results`)
| 列名 | データ型 | 説明 |
|------|---------|------|
| analysis_id | uuid | 組織分析結果の一意なID |
| analysis_name | varchar | 分析名 |
| process_type | varchar | プロセスタイプ（分析後は変更不可） |
| aggregation_level | varchar | 集計レベル（employee/department） |
| filter_mode | varchar | フィルターモード（all/completed） |
| date_from | timestamp | 開始日（オプション） |
| date_to | timestamp | 終了日（オプション） |
| handover_data | JSONB | ハンドオーバー分析結果 |
| workload_data | JSONB | 作業負荷分析結果 |
| performance_data | JSONB | パフォーマンス分析結果 |
| created_at | timestamp | 作成日時 |

### result_data JSON構造（プロセス分析）
```json
{
  "nodes": [
    {
      "id": "受注登録",
      "type": "actionNode",
      "data": {
        "label": "受注登録",
        "frequency": 150
      }
    }
  ],
  "edges": [
    {
      "id": "edge-1",
      "source": "受注登録",
      "target": "入金確認",
      "data": {
        "frequency": 120,
        "avg_waiting_time_hours": 2.5
      }
    }
  ]
}
```

## 開発ワークフロー

### 開発環境のセットアップ

```bash
# 環境変数設定
cp .env.example .env

# コンテナ起動 (Docker Compose V2)
docker compose up -d

# ログ確認
docker compose logs -f

# 特定のサービスログ確認
docker compose logs backend -f
docker compose logs frontend -f
```

### データ準備 (dbt)

```bash
# バックエンドコンテナに入る
docker compose exec backend bash

# dbtディレクトリに移動
cd /app/dbt

# 依存パッケージのインストール
dbt deps

# サンプルデータのロード
# - order-delivery: 10件の注文、46イベント
# - employee-onboarding: 5件の応募、27イベント
dbt seed

# イベントログテーブルの生成 (public.fct_event_log)
dbt run

# データテストの実行
dbt test
```

### 分析の実行

```bash
# バックエンドコンテナ内で実行
# 重要: PYTHONPATH環境変数を設定してモジュールパスを解決

# 受注から配送プロセスの分析
PYTHONPATH=/app python /app/src/analysis/run_analysis.py --name "受注から配送_2025-10" --process-type "order-delivery"

# 従業員採用プロセスの分析
PYTHONPATH=/app python /app/src/analysis/run_analysis.py --name "従業員採用_2025-10" --process-type "employee-onboarding"
```

### テストの実行

```bash
# バックエンドテスト (バックエンドコンテナ内)
cd /app
pytest tests/

# フロントエンドテスト (フロントエンドコンテナ内)
docker compose exec frontend npm run test
```

### APIの動作確認

```bash
# コンテナ内からのAPI確認 (curlが無いためPythonを使用)
docker compose exec -T backend python -c "import requests; print(requests.get('http://localhost:8000/health').json())"

docker compose exec -T backend python -c "import requests; print(requests.get('http://localhost:8000/analyses').json())"

# ホストマシンからのAPI確認 (curlが使える場合)
curl http://localhost:8000/health
curl http://localhost:8000/analyses
curl http://localhost:8000/analyses/{analysis_id}
curl "http://localhost:8000/compare?before={id1}&after={id2}"

# 組織分析API
curl "http://localhost:8000/organization/handover?process_type=order-delivery&aggregation_level=employee"
curl "http://localhost:8000/organization/workload?process_type=order-delivery&aggregation_level=department"
curl http://localhost:8000/organization/analyses
```

### Web UIアクセス

```bash
# フロントエンド: http://localhost:5173
# バックエンドAPI: http://localhost:8000
# PostgreSQL: localhost:5432
```

**主要画面**:
- `/`: プロセス分析一覧
- `/analysis/{id}`: プロセスマップ詳細
- `/organization`: 組織分析一覧
- `/organization/{id}`: 組織分析詳細

## 実装時の重要な設計パターン

### フロントエンド

**ProcessMap.tsx（プロセスマップ）**:
- `useLayout`フック: `elkjs`との連携による自動レイアウト計算
- 動的エッジラベル: `displayMetric`状態に応じて頻度/待機時間を切替
- パスフィルタリング: `pathThreshold`に基づき`edges`に`hidden`プロパティを追加
- ハッピーパス強調: 頻度80%以上のエッジを青い太線で表示（`strokeColor: '#3182ce'`, `strokeWidth: normalizedFreq * 8`）
- 問題パス警告: 待機時間70%以上のエッジを赤線で表示（`strokeColor: '#e53e3e'`）

**OrganizationAnalysisDetail.tsx（組織分析詳細）**:
- 保存済み分析の表示と集計レベル切り替え機能
- `isInitialLoad`フラグで初回読み込みと集計レベル変更を区別
- useEffect内に直接非同期関数を定義（useCallbackは使用しない）
- 依存配列: `[aggregationLevel, isInitialLoad, analysis, toast]`
- プロセスタイプは固定（分析作成時に決定）、集計レベルのみ変更可能

**HandoverNetwork.tsx（ハンドオーバーネットワーク）**:
- ELK.jsレイアウト方向: `DOWN`（縦方向配置）
- ProcessMapと同様のエッジスタイリング（頻度ベースの太さ、色分け）
- 左右2ペイン構成（左: コントロール、右: ネットワーク図）

### バックエンド

**DFG発見（`src/analysis/run_analysis.py`）**:
- ケースIDごとにアクティビティペア(source, target)を抽出し頻度を集計
- パフォーマンス計算: 各遷移間の平均待機時間を算出（timestamp差分）

**組織分析（`src/services/organization_service.py`）**:
- `create_organization_analysis`: 3つの分析（handover, workload, performance）を実行し、結果をJSONBとしてDBに保存
- `get_organization_analysis_by_id`: 保存済み分析をIDで取得
- `analyze_handover`: ハンドオーバーネットワーク分析（employee/department単位）
- `analyze_workload`: 作業負荷分析（アクティビティ数・ケース数）
- `analyze_performance`: パフォーマンス分析（平均処理時間・中央値・合計時間）

## トラブルシューティング

### Docker Compose コマンドエラー
- Docker Compose V2を使用: `docker compose` (ハイフン無し)
- V1形式の`docker-compose`は非推奨

### ModuleNotFoundError (run_analysis.py)
- `PYTHONPATH=/app`を設定してから実行
- 例: `PYTHONPATH=/app python /app/src/analysis/run_analysis.py --name "test" --process-type "order-delivery"`

### テーブルが見つからないエラー (fct_event_log)
- dbtは`public`スキーマにテーブルを作成
- クエリは`public.fct_event_log`または`fct_event_log`を指定
- スキーマ確認: `docker compose exec postgres psql -U process_mining -d process_mining_db -c "\dn"`

### データベース接続エラー
- PostgreSQLコンテナが起動しているか確認: `docker compose ps`
- 環境変数が正しく設定されているか確認: `.env`ファイル
- ヘルスチェック確認: `docker compose ps postgres`

### dbtエラー
- `dbt deps`を実行してパッケージをインストール
- `dbt debug`でデータベース接続を確認
- profiles.yml: `/root/.dbt/profiles.yml`にマウント済み

### フロントエンドが表示されない
- バックエンドAPIが起動しているか確認: `docker compose ps backend`
- フロントエンドログ確認: `docker compose logs frontend`
- Viteサーバーが起動しているか確認（ログに "Local: http://localhost:5173/" が表示）
- ブラウザのコンソールでエラーを確認

### フロントエンドのホットリロードが効かない
- フロントエンドコンテナを再起動: `docker compose restart frontend`
- ログでViteが正常に起動しているか確認: `docker compose logs frontend`

### 組織分析の集計レベル切り替えが動作しない
- `OrganizationAnalysisDetail.tsx`のuseEffect依存配列を確認
- `isInitialLoad`フラグが正しく設定されているか確認
- useCallbackを使用せず、useEffect内で直接非同期関数を定義

## プロジェクトファイル構成

詳細は以下を参照:
- [README.md](README.md): プロジェクト概要とクイックスタート
- [tmp/PRD.md](tmp/PRD.md): プロジェクトキャンバス
- [tmp/仕様.md](tmp/仕様.md): 詳細実装仕様
- [tmp/plan.md](tmp/plan.md): 実装計画書

## 技術スタック

### 必須技術
- **データ加工**: dbt Core
- **データベース**: PostgreSQL
- **バックエンド**: Python 3.9+, FastAPI, Pandas, SQLAlchemy, NetworkX
- **フロントエンド**: React (TypeScript), React Flow, Elk.js, Zustand, Chakra UI
- **インフラ**: Docker Compose
- **ライセンス**: MIT（すべての依存ライブラリも許容ライセンス）

### パフォーマンス要件
- フロントエンドは1000ノード/エッジ程度のグラフで60FPS維持
- `React.memo`によるカスタムノードの最適化
- レイアウト計算完了まで`opacity: 0`で初期描画のちらつきを防止
