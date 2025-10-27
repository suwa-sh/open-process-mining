# case_id ルール定義

## 概要

system-developmentプロセスにおけるcase_id（ケースID）の定義ルールと抽出方法を規定する。

## case_id形式

### Jiraチケット

**形式**: `PROJECT-123`

- プロジェクトキー（大文字英数字）+ ハイフン + チケット番号
- 例: `PROJ-101`, `DEVOPS-42`, `BUG-999`

### GitHub Issues

**形式**: `owner/repo#123`

- リポジトリオーナー + スラッシュ + リポジトリ名 + `#` + Issue番号
- 例: `facebook/react#12345`, `microsoft/vscode#98765`

### GitLab Issues

**形式**: `namespace/project#123`

- 名前空間（グループ名） + スラッシュ + プロジェクト名 + `#` + Issue IID
- 例: `gitlab-org/gitlab#54321`, `my-company/backend#123`

## 抽出優先順位

複数のソースシステムから同一案件を参照する場合、以下の優先順位でcase_idを決定する：

1. **Jiraキー** (最優先)
2. **GitHub Issue番号** (Jiraが無い場合)
3. **GitLab Issue番号** (GitHub Issueが無い場合)

理由: Jiraは多くの組織で案件管理の中心となるため、Jiraキーを正規のcase_idとする。

## 正規表現パターン

### Jiraキー抽出

```regex
(?P<jira>[A-Z][A-Z0-9]+-\d+)
```

- 先頭大文字英字 + 0文字以上の大文字英数字 + ハイフン + 数字

**マッチ例**:

- `PROJ-123`
- `DEVOPS-42`
- `A1B2-999`

### GitHub/GitLab Issue番号抽出

```regex
(?:close[sd]?|fix(?:e[sd])?|resolve[sd]?)\s+#(?P<num>\d+)
```

- コミットメッセージやPR説明文から`closes #123`、`fixes #456`、`resolves #789`形式を抽出

**マッチ例**:

- `closes #123`
- `fix #456`
- `resolved #789`

### ブランチ名からのキー抽出

```regex
^(feature|bugfix|hotfix)/(?P<jira>[A-Z][A-Z0-9]+-\d+)
```

- ブランチ規約に従ったJiraキーの抽出

**マッチ例**:

- `feature/PROJ-123`
- `bugfix/BUG-456`
- `hotfix/CRITICAL-789`

## 抽出フロー

### Pull Request / Merge Requestの場合

1. ブランチ名からJiraキーを抽出 (`^(feature|bugfix|hotfix)/(?P<jira>[A-Z][A-Z0-9]+-\d+)`)
2. 1が失敗した場合、PRタイトルからJiraキーを抽出
3. 2が失敗した場合、PR本文から`closes #123`形式でIssue番号を抽出
4. 3が成功した場合、`{owner}/{repo}#{num}` または `{namespace}/{project}#{num}` を生成

### CI/CDビルドの場合

1. ブランチ名からJiraキーを抽出
2. 1が失敗した場合、コミットメッセージからJiraキーを抽出
3. 2が失敗した場合、関連するPR/MRのcase_idを参照

### Jira Issueの場合

- `key`フィールドをそのまま使用（例: `PROJ-123`）

## 実装例（SQL）

```sql
-- GitHub Pull Requestsからcase_id抽出
SELECT
    id,
    number,
    COALESCE(
        -- 優先順位1: ブランチ名からJiraキー
        substring(head_ref FROM '([A-Z][A-Z0-9]+-\d+)'),
        -- 優先順位2: タイトルからJiraキー
        substring(title FROM '([A-Z][A-Z0-9]+-\d+)'),
        -- 優先順位3: GitHub Issue番号
        'owner/repo#' || substring(title FROM '#(\d+)')
    ) AS case_id
FROM bronze_raw.github_pull_requests
WHERE case_id IS NOT NULL;
```

## 紐づけ漏れ対策

### ブランチ命名規約の徹底

- **推奨**: `feature/PROJ-123-add-login-form`
- **非推奨**: `feature/add-login-form` (case_id抽出不可)

### PRテンプレートの活用

GitHub/GitLabのPRテンプレートに以下を含める：

```markdown
## 関連Issue

- closes #123
- fixes PROJ-456
```

### dbt testによる監視

紐づけ漏れ（case_id = NULL）のPR/MRを検出するdbt testを実装：

```sql
-- dbt/tests/generic/case_id_extraction_coverage.sql
SELECT
    COUNT(*) AS unlinked_prs
FROM {{ ref('stg_github_pull_requests') }}
WHERE case_id IS NULL
HAVING COUNT(*) > {{ var('max_unlinked_prs', 5) }}
```

## 注意事項

### 再オープンされたIssueの扱い

- case_idは変更しない（初回作成時のIDを維持）
- 再オープン回数は別途メトリックとして集計

### マルチリポジトリ環境

- GitHub/GitLabのcase_idには必ずリポジトリ名を含める
- 例: `org/repo-a#123` と `org/repo-b#123` は別案件

### Jiraプロジェクトキーの変更

- プロジェクトキーが変更された場合、履歴データのcase_idは更新しない
- 新規データのみ新キーを使用
