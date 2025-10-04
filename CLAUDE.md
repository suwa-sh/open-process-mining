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

成果分析API (`/outcome`):

- `GET /outcome/metrics`: 利用可能なメトリック一覧を取得
- `GET /outcome/analyses`: 成果分析結果の一覧を取得
- `GET /outcome/analyses/{analysis_id}`: 特定の成果分析結果を取得
- `POST /outcome/analyze`: 成果分析を実行し、結果をDBに保存

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

成果分析:

- `OutcomeAnalysisList.tsx`: 成果分析結果一覧画面
- `OutcomeAnalysisDetail.tsx`: 成果分析詳細画面
- `CreateOutcomeAnalysisModal.tsx`: 新規成果分析作成モーダル
- `OutcomeProcessMap.tsx`: 成果分析用プロセスマップ（メトリック表示）

**主要機能**:

- インタラクティブなプロセスマップ表示
- パスフィルタリング（頻度閾値による動的フィルタ）
- メトリクス切替（頻度 vs. 待機時間）
- ハッピーパス強調（頻度80%以上: 青い太線）
- 問題パス警告（待機時間70%以上: 赤線）
- プロセス比較画面（改善前後の効果測定）
- 組織分析（ハンドオーバー、作業負荷、パフォーマンス）
- 社員別・部署別の集計レベル切り替え
- 成果分析（パス別成果、セグメント比較）
- 成果メトリック表示（平均値、中央値、合計値）
- 高成果パスの自動検出

## データモデル

### Event Log Schema (`public.fct_event_log`)

**重要**: dbtは`public`スキーマにテーブルを作成します。

| 列名                 | データ型  | 説明                                                      |
| -------------------- | --------- | --------------------------------------------------------- |
| process_type         | varchar   | プロセスタイプ（例: order-delivery, employee-onboarding） |
| case_id              | varchar   | ケースID（例: order_id）                                  |
| activity             | varchar   | アクティビティ名（例: 受注登録、入金確認）                |
| timestamp            | timestamp | イベント発生日時                                          |
| resource             | varchar   | リソース（employee_idのエイリアス）                       |
| employee_id          | varchar   | 社員ID（例: EMP-001）                                     |
| employee_name        | varchar   | 社員名（例: Tanaka）                                      |
| role                 | varchar   | 役割（例: Sales）                                         |
| department_id        | varchar   | 部署ID（例: DEPT-HR）                                     |
| department_name      | varchar   | 部署名（例: 人事部）                                      |
| department_type      | varchar   | 部署タイプ（例: 管理部門）                                |
| parent_department_id | varchar   | 親部署ID                                                  |

### Analysis Result Schema (`public.analysis_results`)

| 列名          | データ型  | 説明                       |
| ------------- | --------- | -------------------------- |
| analysis_id   | uuid      | 分析結果の一意なID         |
| analysis_name | varchar   | 分析名（日本語対応）       |
| process_type  | varchar   | プロセスタイプ             |
| created_at    | timestamp | 作成日時                   |
| result_data   | JSONB     | React Flow互換のJSONデータ |

### Organization Analysis Result Schema (`public.organization_analysis_results`)

| 列名              | データ型  | 説明                               |
| ----------------- | --------- | ---------------------------------- |
| analysis_id       | uuid      | 組織分析結果の一意なID             |
| analysis_name     | varchar   | 分析名                             |
| process_type      | varchar   | プロセスタイプ（分析後は変更不可） |
| aggregation_level | varchar   | 集計レベル（employee/department）  |
| filter_mode       | varchar   | フィルターモード（all/completed）  |
| date_from         | timestamp | 開始日（オプション）               |
| date_to           | timestamp | 終了日（オプション）               |
| handover_data     | JSONB     | ハンドオーバー分析結果             |
| workload_data     | JSONB     | 作業負荷分析結果                   |
| performance_data  | JSONB     | パフォーマンス分析結果             |
| created_at        | timestamp | 作成日時                           |

### Case Outcomes Schema (`public.fct_case_outcomes`)

| 列名         | データ型 | 説明                                       |
| ------------ | -------- | ------------------------------------------ |
| process_type | varchar  | プロセスタイプ                             |
| case_id      | varchar  | ケースID（fct_event_logと対応）            |
| metric_name  | varchar  | メトリック名（例: revenue, profit_margin） |
| metric_value | numeric  | メトリック値                               |
| metric_unit  | varchar  | 単位（例: JPY, percent, count）            |

### Outcome Analysis Result Schema (`public.outcome_analysis_results`)

| 列名          | データ型  | 説明                                           |
| ------------- | --------- | ---------------------------------------------- |
| analysis_id   | uuid      | 成果分析結果の一意なID                         |
| analysis_name | varchar   | 分析名                                         |
| process_type  | varchar   | プロセスタイプ                                 |
| metric_name   | varchar   | メトリック名                                   |
| analysis_type | varchar   | 分析タイプ（path-outcome, segment-comparison） |
| filter_config | JSONB     | フィルター条件（オプション）                   |
| result_data   | JSONB     | 成果分析結果のJSONデータ                       |
| created_at    | timestamp | 作成日時                                       |

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

### コード品質チェック

プロジェクトでは[qlty](https://qlty.sh)を使用して、複数のlinterとformatterを統合管理しています。

```bash
# すべてのlinter/formatterを実行
qlty check

# 自動修正可能な問題を修正（フォーマット適用）
qlty fmt

# 特定のファイルのみチェック
qlty check backend/src/main.py

# 高レベルの問題のみ報告（CI/CDで使用）
qlty check --fail-level high
```

**有効化されているツール:**

- **Python**: ruff (linter), black (formatter), bandit (security scanner)
- **TypeScript/JavaScript**: prettier (formatter), radarlint (静的解析)
- **Dockerfile**: hadolint (linter), dockerfmt (formatter), checkov (security scanner)
- **YAML**: yamllint
- **Markdown**: markdownlint
- **SQL**: sqlfluff（別途実行、下記参照）

**設定ファイル:**

- [.qlty/qlty.toml](.qlty/qlty.toml): qlty設定（プラグイン有効化、除外パターン）
- [.sqlfluff](.sqlfluff): sqlfluff設定（Jinja2テンプレート、PostgreSQL dialect）
- [backend/pyproject.toml](backend/pyproject.toml): bandit設定（テストコード除外）

**SQLファイルのlint:**

sqlfluffはqltyのプラグインに問題があるため、別途実行します：

```bash
# qltyキャッシュからsqlfluffを直接実行
SQLFLUFF=~/.qlty/cache/tools/sqlfluff/3.4.0-f921ba7a9b1c/bin/sqlfluff

# backend/sql/以下のSQLファイル
$SQLFLUFF lint backend/sql/ --dialect postgres

# dbt models（Jinja2テンプレート対応）
$SQLFLUFF lint dbt/models/ --dialect postgres --config .sqlfluff

# 自動修正
$SQLFLUFF fix backend/sql/init.sql --dialect postgres
```

**注意事項:**

- テストコード (`**/tests/**`, `**/test_*.py`) はbanditの対象外に設定済み
- Dockerfileには非rootユーザーとHEALTHCHECKが設定されています（セキュリティベストプラクティス）
- 残存するradarlint警告（認知的複雑度など）はコード品質推奨であり、機能には影響しません

### テストの実行

```bash
# バックエンドテスト (バックエンドコンテナ内)
cd /app
pytest tests/

# フロントエンドテスト (フロントエンドコンテナ内)
docker compose exec frontend npm run test

# E2Eテスト（Playwright）
cd e2e
npm install  # 初回のみ
npx playwright install chromium  # 初回のみ
npm test  # ヘッドレスモード
npm run test:ui  # UIモード（対話的）
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
- `/outcome`: 成果分析一覧
- `/outcome/{id}`: 成果分析詳細（パス別成果/セグメント比較）

## UI/UX統一の設計原則

プロセス分析、組織分析、成果分析の3つの機能間で一貫したユーザー体験を提供するため、以下の原則に従ってください。

### 新規作成モーダルの統一

**モーダルサイズ**: すべて `size="xl"` を使用

```typescript
<Modal isOpen={isOpen} onClose={onClose} size="xl">
```

**分析名のデフォルト値生成**:

- 必須項目を `_` で連結
- 最後に `yyyy-mm-dd` 形式の日付を付与
- 例: `employee-onboarding_candidate_score_パス別成果_2025-10-05`

**日付フィルターUI**:

- ラジオボタン形式を使用（チェックボックスは使用しない）
- フィールドラベル: 「分析対象期間の基準」
- 選択肢:
  - "すべての期間を含める" (`value="all"`)
  - "ケース開始日で絞り込む（推奨）" (`value="start_date"`)
  - "ケース完了日で絞り込む" (`value="end_date"`)

```typescript
<FormControl>
  <FormLabel>分析対象期間の基準</FormLabel>
  <RadioGroup value={filterMode} onChange={(value) => setFilterMode(value as 'all' | 'start_date' | 'end_date')}>
    <Stack>
      <Radio value="all">すべての期間を含める</Radio>
      <Radio value="start_date">ケース開始日で絞り込む（推奨）</Radio>
      <Radio value="end_date">ケース完了日で絞り込む</Radio>
    </Stack>
  </RadioGroup>
</FormControl>
```

### 一覧画面の統一

**フィルターラベル**: すべて「フィルター:」を使用

```typescript
<FormLabel>フィルター:</FormLabel>
```

**ゼロ件表示**: エラー状態を画面全体ではなくリストエリア内に表示

```typescript
{loading ? (
  <Center py={8}>
    <VStack spacing={4}>
      <Spinner size="xl" color="blue.500" />
      <Text>データを読み込んでいます...</Text>
    </VStack>
  </Center>
) : error ? (
  <Center py={8}>
    <VStack spacing={3}>
      <Text fontSize="md" color="gray.600">
        分析が見つかりません
      </Text>
      <Text fontSize="sm" color="gray.500">
        「新規分析を作成」ボタンから最初の分析を作成してください。
      </Text>
    </VStack>
  </Center>
) : ...
```

**ナビゲーションボタン**: 各分析タイプ間を相互に移動できるボタンを配置

```typescript
<HStack>
  <Button colorScheme="blue" onClick={() => navigate('/')}>
    📈 プロセス分析
  </Button>
  <Button colorScheme="purple" onClick={() => navigate('/organization')}>
    🏢 組織分析
  </Button>
  <Button colorScheme="green" onClick={() => navigate('/outcome')}>
    📊 成果分析
  </Button>
</HStack>
```

**動的データソース**: フィルターオプションはDBから取得（ハードコーディング禁止）

```typescript
// プロセスタイプをAPIから取得
const [processTypes, setProcessTypes] = useState<string[]>([]);
useEffect(() => {
  const fetchProcessTypes = async () => {
    const types = await getProcessTypes();
    setProcessTypes(types);
  };
  fetchProcessTypes();
}, []);
```

### 詳細画面の統一

**一覧に戻るボタン**: 各分析タイプの配色で統一

- プロセス分析: `colorScheme="blue"`
- 組織分析: `colorScheme="purple"`
- 成果分析: `colorScheme="green"`
- すべて `variant="outline"` を使用
- ボタンテキスト: `← {分析タイプ}一覧に戻る`

```typescript
// プロセス分析
<Button variant="outline" colorScheme="blue" onClick={onBack}>
  ← プロセス分析一覧に戻る
</Button>

// 組織分析
<Button variant="outline" colorScheme="purple" onClick={onBack}>
  ← 組織分析一覧に戻る
</Button>

// 成果分析
<Button variant="outline" colorScheme="green" onClick={() => navigate('/outcome')}>
  ← 成果分析一覧に戻る
</Button>
```

### データベーススキーマの統一

すべての分析結果テーブルに以下のカラムを含める:

- `analysis_id` (UUID, 主キー, `DEFAULT gen_random_uuid()`)
- `analysis_name` (VARCHAR(255), NOT NULL)
- `process_type` (VARCHAR(100), NOT NULL)
- `created_at` (TIMESTAMP, `DEFAULT CURRENT_TIMESTAMP`)
- 分析固有の設定カラム
- 結果データ用のJSONBカラム

インデックス作成:

- `created_at DESC` (ソート用)
- `process_type` (フィルタリング用)

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
- Viteサーバーが起動しているか確認（ログに "Local: <http://localhost:5173/>" が表示）
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
