---
name: opm-setup
description: "open-process-miningの環境セットアップ、データリセット、トラブルシューティングをガイドします。「OPMをセットアップ」「環境構築」「データベースをリセット」「コンテナが起動しない」「dbtエラー」「フロントエンドが表示されない」「open-process-miningの初期設定」「OPMのトラブルシューティング」などのキーワードで発動します。"
---

# open-process-mining 環境セットアップ・トラブルシューティング

open-process-miningの環境構築、データリセット、問題解決をガイドします。

## 共有リソース

- パターン集: `../opm-core/references/data-pipeline-patterns.md`

## ワークフロー

ユーザーの状況に応じて、以下のいずれかのフローを案内する。

---

### フロー A: 初回セットアップ

#### Step 1: 前提条件の確認

- Docker / Docker Compose V2 がインストール済みか
- `docker compose version` で確認

#### Step 2: リポジトリの準備

```bash
git clone https://github.com/suwa-sh/open-process-mining.git
cd open-process-mining
cp .env.example .env
```

#### Step 3: 環境を選択して起動

**開発者環境**（ホットリロード、ボリュームマウント）:
```bash
docker compose -f compose.dev.yml up -d
```

**利用者環境**（安定版イメージ、read-only マウント）:
```bash
docker compose up -d
```

#### Step 4: サンプルデータの投入

```bash
# サンプルデータ生成（開発者環境のみ）
python scripts/generate_sample_data.py

# dbt でデータ投入（開発者環境）
docker compose -f compose.dev.yml run --rm dbt bash -c "cd /app/dbt && dbt deps && dbt seed && dbt run"

# dbt でデータ投入（利用者環境）
docker compose run --rm dbt bash -c "cd /app/dbt && dbt deps && dbt seed && dbt run"
```

#### Step 5: 動作確認

1. ブラウザで http://localhost:5173 を開く
2. 「新規作成」→ プロセスタイプを選択 → 「作成」
3. プロセスマップが表示されることを確認

---

### フロー B: データベースの完全リセット

データを初期状態に戻したい場合:

```bash
# 開発者環境
docker compose -f compose.dev.yml down -v
docker compose -f compose.dev.yml up -d
# node_modules が削除されるため再インストール
docker compose -f compose.dev.yml exec frontend npm install
# サンプルデータを再投入
python scripts/generate_sample_data.py
docker compose -f compose.dev.yml run --rm dbt bash -c "cd /app/dbt && dbt deps && dbt seed && dbt run"

# 利用者環境
docker compose down -v
docker compose up -d
docker compose run --rm dbt bash -c "cd /app/dbt && dbt deps && dbt seed && dbt run"
```

**注意**: `-v` フラグで PostgreSQL の全データ（Named Volume）が削除される。

---

### フロー C: トラブルシューティング

ユーザーの問題に応じて診断・解決を案内する。

#### コンテナが起動しない

```bash
docker compose -f compose.dev.yml ps       # 状態確認
docker compose -f compose.dev.yml logs      # ログ確認
docker compose -f compose.dev.yml logs postgres  # DB ログ
```

#### dbt エラー

```bash
# 接続確認
docker compose -f compose.dev.yml run --rm dbt bash -c "cd /app/dbt && dbt debug"
# パッケージインストール
docker compose -f compose.dev.yml run --rm dbt bash -c "cd /app/dbt && dbt deps"
# テスト実行（データ品質）
docker compose -f compose.dev.yml run --rm dbt bash -c "cd /app/dbt && dbt test --store-failures"
```

#### フロントエンドが表示されない

```bash
docker compose -f compose.dev.yml logs frontend  # Vite ログ確認
docker compose -f compose.dev.yml restart frontend  # 再起動
```

#### バックエンド API エラー

```bash
docker compose -f compose.dev.yml logs backend
# ヘルスチェック
docker compose -f compose.dev.yml exec -T backend python -c \
  "import requests; print(requests.get('http://localhost:8000/health').json())"
```

#### テーブルが見つからない

dbt は `public` スキーマにテーブルを作成する。
```bash
# スキーマ確認
docker compose -f compose.dev.yml exec postgres psql -U process_mining -d process_mining_db -c "\dn"
# テーブル一覧
docker compose -f compose.dev.yml exec postgres psql -U process_mining -d process_mining_db -c "\dt public.*"
```

#### Docker Compose コマンドエラー

- V2 を使用: `docker compose`（ハイフンなし）
- V1 形式の `docker-compose` は非推奨

---

### フロー D: バージョンアップデート

```bash
# 最新イメージの取得
docker compose --profile dbt --profile dlt pull

# コンテナの再起動
docker compose up -d

# dbt の再実行（スキーマ変更がある場合）
docker compose run --rm dbt bash -c "cd /app/dbt && dbt deps && dbt run"
```

## 主要なアクセス先

| サービス | URL |
| --- | --- |
| フロントエンド | http://localhost:5173 |
| バックエンド API | http://localhost:8000 |
| Swagger UI | http://localhost:8000/docs |
| PostgreSQL | localhost:5432 |

## 注意事項

- `.env` ファイルでDB接続情報を設定（デフォルトはサンプル値）
- 本番環境では必ず `.env` のパスワードを変更すること
- PostgreSQL データは Named Volume `postgres-data` に永続化される
