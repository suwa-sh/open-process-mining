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
- PostgreSQLをデータストアとして使用
- 主要テーブル: `fct_event_log` (case_id, activity, timestamp, resource)

### 2. バックエンド (Python)
**分析スクリプト (`run_analysis.py`)**:
- イベントログからDFG (Directly-Follows Graph)を生成
- パフォーマンス指標を計算（頻度、平均待機時間）
- 結果をReact Flow互換のJSON形式で`analysis_results`テーブルに保存

**APIサーバー (`main.py` - FastAPI)**:
- `GET /analyses`: 分析結果の一覧を提供
- `GET /analyses/{analysis_id}`: 特定の分析結果のJSONデータを提供
- `GET /compare`: 2つの分析結果の差分を計算

### 3. フロントエンド (React + TypeScript)
- **フレームワーク**: React with TypeScript
- **グラフ可視化**: `@xyflow/react` (React Flow)
- **自動レイアウト**: `elkjs`
- **状態管理**: `zustand`
- **主要機能**:
  - インタラクティブなプロセスマップ表示
  - カスタムノード (`ActionNode.js`) でアクティビティを表示
  - パスフィルタリング（頻度閾値による動的フィルタ）
  - メトリクス切替（頻度 vs. 待機時間）
  - プロセス比較画面（改善前後の効果測定）

## 開発ワークフロー

### データエンジニア/アナリスト向け

```bash
# 1. Rawデータをロード
dbt seed

# 2. イベントログテーブルを生成
dbt run

# 3. 分析を実行し、結果をDBに保存
python run_analysis.py
```

### バックエンド開発者向け

```bash
# APIサーバーを起動
uvicorn main:app --reload
```

### フロントエンド開発者向け

```bash
# 開発サーバーを起動 (package.jsonが作成された後)
npm run dev
# または
yarn dev
```

## データモデル

### Event Log Schema (`public_marts.fct_event_log`)
**重要**: dbtは`public_marts`スキーマにテーブルを作成します。クエリ時は必ずスキーマを指定してください。

| 列名 | データ型 | 説明 |
|------|---------|------|
| case_id | varchar | ケースID (例: order_id) |
| activity | varchar | アクティビティ名 (例: status) |
| timestamp | timestamp | イベント発生日時 |
| resource | varchar | 担当リソース (例: user_name) |

### Analysis Result Schema (`analysis_results`)
| 列名 | データ型 | 説明 |
|------|---------|------|
| analysis_id | varchar | 分析結果の一意なID |
| analysis_name | varchar | 分析名 |
| created_at | timestamp | 作成日時 |
| result_data | JSONB | React Flow互換のJSONデータ |

### result_data JSON構造
```json
{
  "nodes": [
    {
      "id": "Activity A",
      "type": "actionNode",
      "data": {
        "label": "Activity A",
        "frequency": 150
      }
    }
  ],
  "edges": [
    {
      "id": "edge-1",
      "source": "Activity A",
      "target": "Activity B",
      "data": {
        "frequency": 120,
        "avg_waiting_time_hours": 2.5
      }
    }
  ]
}
```

## 技術スタック

### 必須技術
- **データ加工**: dbt Core
- **データベース**: PostgreSQL
- **バックエンド**: Python 3.9+, FastAPI, Pandas, SQLAlchemy
- **フロントエンド**: React (TypeScript), React Flow, Elk.js, Zustand
- **ライセンス**: MIT or Apache 2.0（すべての依存ライブラリも許容ライセンス）

### パフォーマンス要件
- フロントエンドは1000ノード/エッジ程度のグラフで60FPS維持
- `React.memo`によるカスタムノードの最適化
- レイアウト計算完了まで`opacity: 0`で初期描画のちらつきを防止

## 実装時の重要な設計パターン

### フロントエンド
- **useLayoutフック**: `elkjs`との連携による自動レイアウト計算
- **動的エッジラベル**: `displayMetric`状態に応じて頻度/待機時間を切替
- **パスフィルタリング**: `pathThreshold`に基づき`edges`に`isHidden`プロパティを追加

### バックエンド
- DFG発見: ケースIDごとにアクティビティペア(source, target)を抽出し頻度を集計
- パフォーマンス計算: 各遷移間の平均待機時間を算出（timestamp差分）

## 実装されたコマンド

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

# サンプルデータのロード (46レコード)
dbt seed

# イベントログテーブルの生成 (public_marts.fct_event_log)
dbt run

# データテストの実行
dbt test
```

### 分析の実行

```bash
# バックエンドコンテナ内で実行
# 重要: PYTHONPATH環境変数を設定してモジュールパスを解決
PYTHONPATH=/app python /app/src/analysis/run_analysis.py --name "Initial Analysis"
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
```

### Web UIアクセス

```bash
# フロントエンド: http://localhost:5173
# バックエンドAPI: http://localhost:8000
# PostgreSQL: localhost:5432
```

## トラブルシューティング

### Docker Compose コマンドエラー
- Docker Compose V2を使用: `docker compose` (ハイフン無し)
- V1形式の`docker-compose`は非推奨

### ModuleNotFoundError (run_analysis.py)
- `PYTHONPATH=/app`を設定してから実行
- 例: `PYTHONPATH=/app python /app/src/analysis/run_analysis.py --name "test"`

### テーブルが見つからないエラー (fct_event_log)
- dbtは`public_marts`スキーマにテーブルを作成
- クエリは`public_marts.fct_event_log`を指定
- スキーマ確認: `docker compose exec postgres psql -U process_mining -d process_mining -c "\dn"`

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
- Viteサーバーが起動しているか確認 (ログに "Local: http://localhost:5173/" が表示)
- ブラウザのコンソールでエラーを確認

## プロジェクトファイル構成

詳細は[tmp/PRD.md](tmp/PRD.md)、[tmp/仕様.md](tmp/仕様.md)、[tmp/plan.md](tmp/plan.md)を参照してください。
