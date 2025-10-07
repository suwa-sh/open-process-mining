# サンプルデータ

プロジェクトには 2024 年 1 年分の 6 種類のビジネスプロセスデータが含まれています。

## ペルソナ対応表

各プロセスタイプと想定ユーザー（ペルソナ）の対応関係：

| プロセスタイプ               | 想定ペルソナ         | 利用部門       | 主な関心事                                     |
| ---------------------------- | -------------------- | -------------- | ---------------------------------------------- |
| Order to Cash                | 営業 / 経理          | 営業部、経理部 | 受注から入金までのリードタイム短縮、売掛金管理 |
| Billing                      | 経理 / 財務          | 経理部、財務部 | 請求処理の正確性、サイクルタイムの短縮         |
| Invoice Approval             | 経理 / 購買          | 経理部、購買部 | 支払承認プロセスの効率化、コンプライアンス     |
| Employee Onboarding          | 人事 / 採用担当      | 人事部         | 採用プロセスの効率化、候補者体験の向上         |
| ITSM (IT Service Management) | IT サポート / DevOps | 情報システム部 | インシデント解決時間の短縮、SLA 遵守           |
| System Development           | 開発者 / DevOps      | 開発部、IT 部  | 開発リードタイムの短縮、品質向上               |

**利用シーン例:**

- **営業 / 経理**: Order to Cash プロセスで、受注から入金までのボトルネックを特定し、キャッシュフロー改善
- **経理 / 財務**: Billing / Invoice Approval プロセスで、承認遅延の原因を特定し、自動化を推進
- **人事**: Employee Onboarding プロセスで、採用フローの各ステップでの離脱率を分析し、改善施策を実施
- **IT サポート**: ITSM プロセスで、インシデント種別ごとの解決時間を可視化し、優先度付けを最適化
- **開発者 / DevOps**: System Development プロセスで、コードレビューやテストのボトルネックを発見し、CI/CD パイプラインを改善

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

- `time_to_hire_days`: 採用リードタイム（日）
- `satisfaction_score`: 満足度スコア（1-5）

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

## 成果メトリックのデータ仕様

成果メトリックは `fct_case_outcomes` テーブルに格納され、各メトリックには以下の属性があります：

- **metric_name**: メトリック名（例: revenue, profit_margin, cycle_time_days）
- **metric_value**: メトリック値（数値）
- **metric_unit**: 単位（JPY, percent, count, days, hours, points, score, weight）

### サポートされている単位と表示フォーマット

| metric_unit | 説明           | 入力値例   | 表示例   | 備考                        |
| ----------- | -------------- | ---------- | -------- | --------------------------- |
| JPY         | 日本円         | 123456.789 | ¥123,457 | 整数に丸めてカンマ区切り    |
| percent     | パーセンテージ | 0.27       | 27.0%    | 0.27 = 27%（100倍して表示） |
| count       | カウント       | 15.789     | 15.8     | 小数点1桁                   |
| days        | 日数           | 7.345      | 7.3      | 小数点1桁                   |
| hours       | 時間           | 12.567     | 12.6     | 小数点1桁                   |
| points      | ポイント       | 13.456     | 13.5     | 小数点1桁                   |
| score       | スコア         | 85.67      | 85.7     | 小数点1桁                   |
| weight      | 重み           | 2.789      | 2.8      | 小数点1桁                   |

**重要な注意事項:**

- **percent単位**: データベースには小数値で格納（0.27 = 27%）、UI表示時に100倍して%記号を付与
- **JPY単位**: 四捨五入して整数で表示（小数点以下は表示しない）
- その他の単位: 小数点1桁または2桁で表示

### 利用可能なメトリック一覧

| metric_name           | metric_unit | プロセス                  | 説明               |
| --------------------- | ----------- | ------------------------- | ------------------ |
| revenue               | JPY         | Order to Cash             | 売上               |
| profit_margin         | percent     | Order to Cash             | 利益率             |
| quantity              | count       | Order to Cash             | 数量               |
| recruitment_cost      | JPY         | Employee Onboarding       | 採用コスト         |
| candidate_score       | score       | Employee Onboarding       | 候補者スコア       |
| resolution_time_hours | hours       | ITSM                      | 解決時間           |
| priority_weight       | weight      | ITSM                      | 優先度ウェイト     |
| cycle_time_days       | days        | Billing                   | サイクルタイム     |
| amount                | JPY         | Billing, Invoice Approval | 金額               |
| processing_days       | days        | Invoice Approval          | 処理日数           |
| lead_time_days        | days        | System Development        | リードタイム       |
| story_points          | points      | System Development        | ストーリーポイント |
| defect_count          | count       | System Development        | 欠陥数             |

### 新しいメトリックの追加方法

1. **データ準備**: CSV形式で `process_type,case_id,metric_name,metric_value,metric_unit` を定義
2. **単位選択**: 上記のサポート単位から選択（新しい単位も追加可能）
3. **データ投入**: `dbt/seeds/outcome_*.csv` にデータを配置し、`dbt seed` で投入
4. **UI表示**: `formatMetricValue()` 関数が自動的に適切なフォーマットを適用
