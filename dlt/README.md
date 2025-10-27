# dlt - Data Load Tool

このディレクトリには、外部システムからデータを抽出してPostgreSQLのBronze層に投入するdlt（data load tool）パイプラインが含まれています。

## 概要

dltは[dlthub.com](https://dlthub.com/)が提供するPythonベースのETLライブラリです。
このプロジェクトでは、各種外部システムのAPIからデータを抽出し、`bronze_raw`スキーマに保存します。

### サポートしているデータソース

| カテゴリ  | システム       | ソースファイル            | 抽出データ             | 主な用途                         |
| --------- | -------------- | ------------------------- | ---------------------- | -------------------------------- |
| **ITS**   | GitHub         | `github_source.py`        | Issues                 | 課題管理プロセス                 |
| **ITS**   | GitLab         | `gitlab_issues_source.py` | Issues                 | 課題管理プロセス                 |
| **ITS**   | Jira           | `jira_source.py`          | Issues + Changelog     | 課題管理プロセス（状態遷移付き） |
| **VCS**   | GitHub         | `github_source.py`        | PRs, Commits, Releases | コードレビュー、リリースプロセス |
| **VCS**   | GitLab         | `gitlab_mr_source.py`     | Merge Requests         | コードレビュープロセス           |
| **CI/CD** | GitHub Actions | `github_source.py`        | Workflow Runs          | ビルド・デプロイプロセス         |
| **CI/CD** | GitLab CI      | `gitlab_ci_source.py`     | Pipelines, Deployments | ビルド・デプロイプロセス         |
| **CI/CD** | Jenkins        | `jenkins_source.py`       | Build Jobs             | ビルド・デプロイプロセス         |

## ディレクトリ構成

```
dlt/
├── .dlt/
│   ├── config.toml          # dlt設定
│   └── secrets.toml.example # 認証情報テンプレート
├── sources/                  # データソース定義
│   ├── __init__.py
│   ├── github_source.py      # GitHub (Issues, PRs, Actions, Commits, Releases)
│   ├── gitlab_issues_source.py  # GitLab Issues
│   ├── gitlab_mr_source.py   # GitLab Merge Requests
│   ├── gitlab_ci_source.py   # GitLab CI (Pipelines, Deployments)
│   ├── jira_source.py        # Jira (Issues + Changelog)
│   └── jenkins_source.py     # Jenkins (Build Jobs)
├── pipelines/                # パイプライン実行スクリプト
│   ├── github_pipeline.py
│   ├── gitlab_pipeline.py
│   ├── jira_pipeline.py
│   └── jenkins_pipeline.py
├── Dockerfile
├── pyproject.toml
└── README.md (this file)
```

## セットアップ

### 1. 認証情報の設定

```bash
# secrets.toml.exampleをコピー
cp .dlt/secrets.toml.example .dlt/secrets.toml

# GitHub Personal Access Tokenを設定
vim .dlt/secrets.toml
```

`.dlt/secrets.toml`:

```toml
[sources.github]
access_token = "ghp_xxxxxxxxxxxxxxxxxxxx"

[destination.postgres.credentials]
database = "process_mining_db"
username = "process_mining"
password = "your_password"
host = "postgres"
port = 5432
```

### 2. ローカル実行（開発時）

```bash
# 依存関係のインストール
pip install -e .

# パイプライン実行
python pipelines/github_pipeline.py
```

### 3. Docker実行

```bash
# dltコンテナのビルド
docker compose build dlt

# パイプライン実行
docker compose run --rm dlt python pipelines/github_pipeline.py
```

## 各データソースの使用方法

### GitHub

**抽出データ**: Issues, Pull Requests, Actions Runs, Commits, Releases

**設定例** (`.dlt/config.toml`):

```toml
[sources.github]
owner = "your-organization"
repositories = ["repo1", "repo2"]
```

**実行**:

```bash
docker compose run --rm dlt python pipelines/github_pipeline.py
```

### GitLab

**抽出データ**: Issues, Merge Requests, CI Pipelines, Deployments

**設定例** (`.dlt/config.toml`):

```toml
[sources.gitlab]
project_id = "your-namespace/your-project"  # or numeric ID like "12345"
url = "https://gitlab.com"  # or your self-hosted URL
```

**認証** (`.dlt/secrets.toml`):

```toml
[sources.gitlab]
access_token = "glpat-xxxxxxxxxxxxxxxxxxxx"
```

**実行**:

```bash
docker compose run --rm dlt python pipelines/gitlab_pipeline.py
```

### Jira

**抽出データ**: Issues with Changelog (status transitions)

**設定例** (`.dlt/config.toml`):

```toml
[sources.jira]
url = "https://your-company.atlassian.net"
jql = "project = PROJ ORDER BY updated ASC"
```

**認証** (`.dlt/secrets.toml`):

```toml
[sources.jira]
# For Jira Cloud: Personal Access Token or API token
# For Jira Data Center: Personal Access Token
access_token = "your_jira_access_token"
```

**実行**:

```bash
docker compose run --rm dlt python pipelines/jira_pipeline.py
```

**注意**: Jiraのchangelog機能を活用し、ステータス遷移を含むデータを抽出します。プロセスマイニングで作業開始時刻（In Progress遷移）や完了時刻（Done遷移）を分析できます。

### Jenkins

**抽出データ**: Build jobs with results, timestamps, parameters, commit info

**設定例** (`.dlt/config.toml`):

```toml
[sources.jenkins]
url = "https://jenkins.example.com"
job_name = "backend-build"
```

**認証** (`.dlt/secrets.toml`):

```toml
[sources.jenkins]
username = "your_jenkins_username"
api_token = "your_jenkins_api_token"
```

**実行**:

```bash
docker compose run --rm dlt python pipelines/jenkins_pipeline.py
```

**注意**: Jenkinsの場合、ビルド番号でフィルタリングして増分ロードが可能です。

## カスタムソースの追加

### ステップ1: ソース定義を作成

`sources/your_system_source.py`:

```python
"""Your System data source for dlt."""
import dlt
from typing import Iterator, Any

@dlt.resource(write_disposition="append", primary_key="id")
def your_system_data(
    api_url: str,
    api_key: str = dlt.secrets.value,
) -> Iterator[dict[str, Any]]:
    """Extract data from your system."""
    import requests

    headers = {"Authorization": f"Bearer {api_key}"}
    response = requests.get(f"{api_url}/api/records", headers=headers)
    response.raise_for_status()

    for record in response.json():
        yield record
```

### ステップ2: パイプラインを作成

`pipelines/your_system_pipeline.py`:

```python
"""Your System pipeline."""
import dlt
from sources.your_system_source import your_system_data

if __name__ == "__main__":
    # dltパイプラインの作成
    pipeline = dlt.pipeline(
        pipeline_name="your_system_pipeline",
        destination="postgres",
        dataset_name="bronze_raw",
    )

    # データの抽出とロード
    load_info = pipeline.run(
        your_system_data(
            api_url=dlt.config["sources.your_system.api_url"]
        )
    )

    print(f"Loaded {load_info.pending_packages} packages")
```

### ステップ3: 設定ファイルを更新

`.dlt/config.toml`:

```toml
[sources.your_system]
api_url = "https://api.yoursystem.com"
```

`.dlt/secrets.toml`:

```toml
[sources.your_system]
api_key = "your_api_key_here"
```

### ステップ4: dbtステージングモデルを追加

`dbt/models/staging/your_system/stg_your_system.sql`:

```sql
{{
  config(
    materialized='view'
  )
}}

-- Bronze層からステージングへ変換
SELECT
    'your-process' AS process_type,
    record_id AS case_id,
    status AS activity,
    updated_at::timestamptz AS timestamp,
    'your_system' AS source_system,
    jsonb_build_object('record_id', id) AS attributes_json
FROM {{ source('bronze_raw', 'your_system_data') }}
WHERE record_id IS NOT NULL
```

## スケジュール実行

### cron (Linux/Mac)

```bash
# crontabに追加
crontab -e

# 毎日午前2時に実行
0 2 * * * cd /path/to/open-process-mining/dlt && python pipelines/github_pipeline.py >> /var/log/dlt.log 2>&1
```

### Airflow

```python
from airflow import DAG
from airflow.operators.bash import BashOperator
from datetime import datetime, timedelta

default_args = {
    'owner': 'data-team',
    'depends_on_past': False,
    'start_date': datetime(2025, 1, 1),
    'retries': 1,
    'retry_delay': timedelta(minutes=5),
}

dag = DAG(
    'github_data_extraction',
    default_args=default_args,
    schedule_interval='0 2 * * *',  # 毎日午前2時
    catchup=False,
)

extract_github_data = BashOperator(
    task_id='extract_github_data',
    bash_command='cd /app/dlt && python pipelines/github_pipeline.py',
    dag=dag,
)
```

## トラブルシューティング

### データベース接続エラー

```bash
# PostgreSQLが起動しているか確認
docker compose ps postgres

# 接続テスト
docker compose exec postgres psql -U process_mining -d process_mining_db -c "SELECT 1;"
```

### API認証エラー

```bash
# secrets.tomlの権限を確認
chmod 600 .dlt/secrets.toml

# トークンの有効性を確認（GitHub例）
curl -H "Authorization: token YOUR_TOKEN" https://api.github.com/user
```

### 増分ロードの設定

dltは自動的に状態管理を行いますが、明示的に増分ロードを設定する場合：

```python
@dlt.resource(write_disposition="append", primary_key="id")
def github_issues_incremental(
    owner: str,
    repo: str,
    updated_after=dlt.sources.incremental("updated_at"),
) -> Iterator[dict[str, Any]]:
    """Incremental load with state management."""
    # dltが自動的に前回の最終updated_atを保持
    since = updated_after.last_value or "2024-01-01T00:00:00Z"
    # ...
```

## 参考リンク

- [dlt公式ドキュメント](https://dlthub.com/docs/intro)
- [dlt GitHub](https://github.com/dlt-hub/dlt)
- [dlt Sources Gallery](https://dlthub.com/docs/dlt-ecosystem/verified-sources)
