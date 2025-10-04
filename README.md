# open-process-mining

オープンソースのプロセスマイニングプラットフォーム - データ準備から分析、可視化までの一貫したワークフローを提供

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

# サンプルデータをロード (46レコード、日本語プロセス名)
dbt seed

# イベントログテーブルを生成
dbt run

# データテストを実行
dbt test
```

5. **分析の実行**

```bash
# バックエンドコンテナ内で実行（日本語の分析名を指定）
PYTHONPATH=/app python /app/src/analysis/run_analysis.py --name "受注から配送_2025-10"
```

6. **Web UIにアクセス**

ブラウザで http://localhost:5173 を開く

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

### サンプルデータ

#### 受注から配送プロセス（10件の注文、46イベント）

- **受注登録** → 入金確認 → 出荷完了 → **配送完了**（ハッピーパス）
- 入金エラー → 入金確認（リトライ）
- 入金確認 → 品質検査 → 出荷完了
- 出荷完了 → **配送失敗** → **再配送手配** → 配送完了（問題パス）
- 入金エラー → 受注キャンセル

#### 従業員採用プロセス（5件の応募、27イベント）

- **応募受付** → 書類審査 → 一次面接 → 二次面接 → 内定通知 → 入社手続き → **オンボーディング完了**（ハッピーパス）
- 書類審査 → **書類不合格**
- 一次面接 → **一次面接不合格**
- 内定通知 → **内定辞退**

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
# 受注から配送プロセスの分析
PYTHONPATH=/app python src/analysis/run_analysis.py --name "受注から配送_2025-10" --process-type "order-delivery"

# 従業員採用プロセスの分析
PYTHONPATH=/app python src/analysis/run_analysis.py --name "従業員採用_2025-10" --process-type "employee-onboarding"
```

### バックエンド開発者向け

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

# 分析結果一覧を取得
curl http://localhost:8000/analyses

# 特定の分析結果を取得
curl http://localhost:8000/analyses/{analysis_id}

# 2つの分析を比較
curl "http://localhost:8000/compare?before={id1}&after={id2}"
```

#### APIエンドポイント

| エンドポイント | メソッド | 説明 |
|--------------|---------|------|
| `/health` | GET | ヘルスチェック |
| `/process-types` | GET | 利用可能なプロセスタイプ一覧 |
| `/analyses` | GET | 分析結果の一覧取得 (`?process_type=xxx`でフィルタ可能) |
| `/analyses/{analysis_id}` | GET | 特定の分析結果を取得 |
| `/compare` | GET | 2つの分析結果を比較 |

### フロントエンド開発者向け

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

## データベース接続

### PostgreSQLデータの保存場所

- **Dockerボリューム**: `postgres_data`（永続化）
- **データベース名**: `process_mining_db`
- **ポート**: `localhost:5432`
- **ユーザー名**: `process_mining`（`.env`で設定）
- **パスワード**: `secure_password`（`.env`で設定）

### テーブル構成（すべて`public`スキーマ）

| テーブル/ビュー | タイプ | 説明 |
|---------|---------|------|
| `raw_order_events` | テーブル | dbt seedの生データ |
| `stg_raw_order_events` | ビュー | dbtステージングモデル |
| `fct_event_log` | テーブル | プロセスマイニング用イベントログ |
| `analysis_results` | テーブル | 分析結果（JSON形式） |

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

-- 分析結果一覧
SELECT
  analysis_id,
  analysis_name,
  created_at,
  jsonb_array_length(result_data->'nodes') as node_count,
  jsonb_array_length(result_data->'edges') as edge_count
FROM public.analysis_results
ORDER BY created_at DESC;
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

- [CLAUDE.md](CLAUDE.md): Claude Code向けの開発ガイド
- [tmp/PRD.md](tmp/PRD.md): プロジェクトキャンバス
- [tmp/仕様.md](tmp/仕様.md): 詳細実装仕様
- [tmp/plan.md](tmp/plan.md): 実装計画書

## ライセンス

MIT License - 詳細は [LICENSE](LICENSE) を参照

## コントリビューション

Issue、Pull Requestを歓迎します。

## 参考資料

- [dbt documentation](https://docs.getdbt.com/)
- [FastAPI documentation](https://fastapi.tiangolo.com/)
- [React Flow documentation](https://reactflow.dev/)
- [Chakra UI documentation](https://chakra-ui.com/)
