# サンプルデータ

プロジェクトには 2024 年 1 年分の 8 種類のビジネスプロセスデータが含まれています。

## ペルソナ対応表

各プロセスタイプと想定ユーザー（ペルソナ）の対応関係：

| プロセスタイプ               | 想定ペルソナ         | 利用部門       | 主な関心事                                     |
| ---------------------------- | -------------------- | -------------- | ---------------------------------------------- |
| order-to-cash                | 営業 / 経理          | 営業部、経理部 | 受注から入金までのリードタイム短縮、売掛金管理 |
| billing                      | 経理 / 財務          | 経理部、財務部 | 請求処理の正確性、サイクルタイムの短縮         |
| invoice-approval             | 経理 / 購買          | 経理部、購買部 | 支払承認プロセスの効率化、コンプライアンス     |
| employee-onboarding          | 人事 / 採用担当      | 人事部         | 採用プロセスの効率化、候補者体験の向上         |
| itsm                         | IT サポート          | 情報システム部 | インシデント解決時間の短縮、SLA 遵守           |
| system-development           | 開発者 / DevOps      | 開発部、IT 部  | 開発リードタイムの短縮、品質向上               |
| gitlab-devops                | 開発者 / DevOps      | 開発部、IT 部  | GitLab Issue → MR → Pipeline の効率化          |
| hybrid-devops                | 開発者 / DevOps      | 開発部、IT 部  | Jira Issue → GitLab MR → Jenkins Build の効率化 |

**利用シーン例:**

- **営業 / 経理**: order-to-cash プロセスで、受注から入金までのボトルネックを特定し、キャッシュフロー改善
- **経理 / 財務**: billing / invoice-approval プロセスで、承認遅延の原因を特定し、自動化を推進
- **人事**: employee-onboarding プロセスで、採用フローの各ステップでの離脱率を分析し、改善施策を実施
- **IT サポート**: itsm プロセスで、インシデント種別ごとの解決時間を可視化、優先度付けを最適化
- **開発者 / DevOps**: gitlab-devops / hybrid-devops プロセスで、コードレビューやビルドのボトルネックを発見し、CI/CD パイプラインを改善

## データ

[dbt/seeds/raw_*.csv](./dbt/seeds/)

## 生成スクリプト

[scripts/generate_sample_data.py](./scripts/README.md#generate_sample_datapy)

## 説明

### Order to Cash（受注から入金）- 50件の注文

**典型的なフロー:**

- **見積作成** → 受注登録 → 与信審査完了 → 出荷指示 → ピッキング → 梱包 → 出荷完了 → 請求書発行 → 入金確認 → **売掛金消込**（ハッピーパス）
- 与信審査 → **与信NG** → 前払い要請 → 前払い確認（与信問題パス）
- 出荷指示 → **在庫不足** → 入荷待ち → ピッキング（在庫問題パス）
- 請求書発行 → **入金遅延** → 督促 → 入金確認（入金遅延パス）

**成果指標:**

- `revenue`: 売上（JPY）
- `profit_margin`: 利益率（percent）
- `quantity`: 数量（count）

### Billing（請求）- 180件の請求書

**典型的なフロー:**

- **請求書作成** → 承認申請 → 承認完了 → 送付 → **入金確認**（ハッピーパス）
- 承認申請 → **差戻** → 修正 → 再申請 → 承認完了（承認プロセス）

**成果指標:**

- `cycle_time_days`: サイクルタイム（日）
- `amount`: 請求金額（JPY）

### Invoice Approval（請求書承認）- 200件の請求書

**典型的なフロー:**

- **請求書受領** → 検証割当 → 検証完了 → 承認 → 支払予定登録 → **支払実行**（ハッピーパス）
- 検証割当 → **エラー検出** → ベンダー問合せ → 修正受領 → 検証完了（エラー処理）

**成果指標:**

- `processing_days`: 処理日数（日）
- `amount`: 金額（JPY）

### Employee Onboarding（入社手続）- 60件の応募者

**典型的なフロー:**

- **応募受付** → 書類選考 → 一次面接 → 最終面接 → 内定通知 → 入社手続 → **オリエンテーション**（ハッピーパス）
- 書類選考 → **不合格通知**（50%）
- 一次面接 → **不合格通知**（30%）
- 最終面接 → **不合格通知**（20%）

**成果指標:**

- `recruitment_cost`: 採用コスト（JPY）
- `recruitment_days`: 採用日数（日）
- `candidate_score`: 候補者スコア（1-100）

### ITSM（IT Service Management）- 150件のインシデント

**典型的なフロー:**

- **インシデント報告** → サポート割当 → 初期調査 → 解決策適用 → 検証 → **クローズ**（ハッピーパス）
- 初期調査 → **エスカレーション** → 解決策適用（複雑なケース）
- 検証 → **再オープン** → 解決策適用 → 検証 → クローズ（問題再発）

**成果指標:**

- `resolution_time_hours`: 解決時間（時間）
- `priority_weight`: 優先度ウェイト

### System Development（システム開発）- 30件のプロジェクト

**典型的なフロー:**

- **要件定義** → 設計 → 設計承認 → 実装 → コードレビュー承認 → テスト → **デプロイ**（ハッピーパス）
- 設計 → **設計レビュー指摘** → 設計修正 → 設計承認（レビューフィードバック）
- コードレビュー承認 → **バグ発見** → バグ修正 → 再テスト → デプロイ（品質改善）

**成果指標:**

- `lead_time_days`: リードタイム（日）
- `story_points`: ストーリーポイント
- `defect_count`: 欠陥数

### GitLab DevOps（GitLab開発プロセス）- 30件のIssue

**典型的なフロー:**

- **Issue Created** → PR Opened → Code Merged → Build Started → Build Completed → **Issue Closed**（ハッピーパス）
- Issue Created → **Issue Closed**（直接クローズ、30%）
- Build Started → **Deployed Production** → Build Completed（本番デプロイ）
- Build Completed → Code Merged（ビルド失敗後の修正、バックエッジ）

**成果指標:**

- `lead_time_days`: リードタイム（日）
- `code_review_time_hours`: コードレビュー時間（時間）
- `build_time_minutes`: ビルド時間（分）

### Hybrid DevOps（Jira + GitLab + Jenkins）- 30件のIssue

**典型的なフロー:**

- **Issue Created** → PR Opened → Code Merged → Build Started → Build Completed → **Issue Closed**（ハッピーパス）
- Issue Created → **Issue Closed**（直接クローズ）
- Build Started → **Deployed Production** → Build Completed（本番デプロイ）
- Build Completed → Build Started（ビルド失敗後の再実行、バックエッジ）

**成果指標:**

- `lead_time_days`: リードタイム（日）
- `code_review_time_hours`: コードレビュー時間（時間）
- `build_time_minutes`: ビルド時間（分）

## 成果メトリックのデータ仕様

成果メトリックは `fct_case_outcomes` テーブルに格納され、各メトリックには以下の属性があります：

- **metric_name**: メトリック名（例: revenue, profit_margin, cycle_time_days）
- **metric_value**: メトリック値（数値）
- **metric_unit**: 単位（JPY, percent, count, days, hours, minutes, points, score, weight）

### サポートされている単位と表示フォーマット

| metric_unit | 説明           | 入力値例   | 表示例   | 備考                        |
| ----------- | -------------- | ---------- | -------- | --------------------------- |
| JPY         | 日本円         | 123456.789 | ¥123,457 | 整数に丸めてカンマ区切り    |
| percent     | パーセンテージ | 0.27       | 27.0%    | 0.27 = 27%（100倍して表示） |
| count       | カウント       | 15.789     | 15.8     | 小数点1桁                   |
| days        | 日数           | 7.345      | 7.3      | 小数点1桁                   |
| hours       | 時間           | 12.567     | 12.6     | 小数点1桁                   |
| minutes     | 分             | 45.678     | 45.7     | 小数点1桁                   |
| points      | ポイント       | 13.456     | 13.5     | 小数点1桁                   |
| score       | スコア         | 85.67      | 85.7     | 小数点1桁                   |
| weight      | 重み           | 2.789      | 2.8      | 小数点1桁                   |

**重要な注意事項:**

- **percent単位**: データベースには小数値で格納（0.27 = 27%）、UI表示時に100倍して%記号を付与
- **JPY単位**: 四捨五入して整数で表示（小数点以下は表示しない）
- その他の単位: 小数点1桁または2桁で表示

### 利用可能なメトリック一覧

| metric_name            | metric_unit | プロセス                                     | 説明                   |
| ---------------------- | ----------- | -------------------------------------------- | ---------------------- |
| revenue                | JPY         | order-to-cash                                | 売上                   |
| profit_margin          | percent     | order-to-cash                                | 利益率                 |
| quantity               | count       | order-to-cash                                | 数量                   |
| recruitment_cost       | JPY         | employee-onboarding                          | 採用コスト             |
| recruitment_days       | days        | employee-onboarding                          | 採用日数               |
| candidate_score        | score       | employee-onboarding                          | 候補者スコア           |
| resolution_time_hours  | hours       | itsm                                         | 解決時間               |
| priority_weight        | weight      | itsm                                         | 優先度ウェイト         |
| cycle_time_days        | days        | billing                                      | サイクルタイム         |
| amount                 | JPY         | billing, invoice-approval                    | 金額                   |
| processing_days        | days        | invoice-approval                             | 処理日数               |
| lead_time_days         | days        | system-development, gitlab-devops, hybrid-devops | リードタイム           |
| story_points           | points      | system-development                           | ストーリーポイント     |
| defect_count           | count       | system-development                           | 欠陥数                 |
| code_review_time_hours | hours       | gitlab-devops, hybrid-devops                 | コードレビュー時間     |
| build_time_minutes     | minutes     | gitlab-devops, hybrid-devops                 | ビルド時間             |

### 新しいメトリックの追加方法

1. **データ準備**: CSV形式で `process_type,case_id,metric_name,metric_value,metric_unit` を定義
2. **単位選択**: 上記のサポート単位から選択（新しい単位も追加可能）
3. **データ投入**: `dbt/seeds/outcome_*.csv` にデータを配置し、`dbt seed` で投入
4. **UI表示**: `formatMetricValue()` 関数が自動的に適切なフォーマットを適用
