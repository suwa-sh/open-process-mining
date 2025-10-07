# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed

- データベーステーブル名を変更: `analysis_results` → `process_analysis_results`（他の分析テーブルとの命名規則統一のため）

## [1.0.0] - 2025-10-05

### Added

#### プロセス分析 (Process Analysis)

- DFGベースのプロセスマイニング分析機能
- React Flowによるインタラクティブなプロセスマップ可視化
- ELK.jsによる自動レイアウト計算
- パスフィルタリング機能（頻度閾値による動的フィルタ）
- メトリクス切り替え（頻度 vs. 待機時間）
- ハッピーパス強調表示（頻度80%以上: 青い太線）
- 問題パス警告表示（待機時間70%以上: 赤線）
- プロセス比較機能（改善前後の効果測定）
- 日付範囲フィルタリング（ケース開始日/完了日による絞り込み）

#### 組織分析 (Organization Analysis)

- ハンドオーバーネットワーク分析
  - 社員別・部署別の集計レベル切り替え
  - ハンドオーバー間の平均待機時間計算
  - 頻度と待機時間のメトリクス切り替え
- 作業負荷分析
  - アクティビティ数とケース数の集計
  - 作業が集中している担当者の特定
- パフォーマンス分析
  - 平均処理時間・中央値・合計時間の分析
  - ボトルネックになっている担当者の特定
- 組織分析結果の保存とリロード機能
- 日付範囲フィルタリング（ケース開始日/完了日による絞り込み）

#### 成果分析 (Outcome Analysis)

- パス別成果分析
  - 各パスの平均値・中央値・合計値の表示
  - 成果の高いパスの自動検出（平均値の75%以上を強調表示）
  - プロセスマップ上での成果メトリック表示
- セグメント比較分析
  - 上位25% vs 下位25%の成果比較
  - カスタム閾値による柔軟なセグメント分割
  - 統計サマリー（平均値、中央値、最小値、最大値、合計値）
  - パス構造の違いの可視化
- 日付範囲フィルタリング（ケース開始日/完了日による絞り込み）

#### データ基盤

- dbt Coreによる再現可能なデータパイプライン
- PostgreSQLによるデータストレージ
- サンプルデータ提供
  - 受注から配送プロセス（10件の注文、46イベント）
  - 従業員採用プロセス（5件の応募、27イベント）
  - 成果データ（売上、利益率、数量、採用コスト、採用期間、候補者スコア）
- 組織マスターデータ（社員・部署）

#### API

- FastAPIによるREST API実装
- プロセス分析API（一覧取得、詳細取得、比較）
- 組織分析API（保存型・リアルタイム型）
- 成果分析API（メトリック一覧、分析実行、結果取得）
- ヘルスチェックエンドポイント

#### インフラ

- Docker Composeによるコンテナ化
- PostgreSQL、バックエンド、フロントエンドのヘルスチェック機能
- データベースインデックス最適化（JSONB GINインデックス、複合インデックス）
- 自動データベース初期化（init.sql）

#### UI/UX

- 3つの分析機能間での一貫したユーザー体験
- 統一されたモーダルサイズ（xl）
- 統一された日付フィルターUI（ラジオボタン形式）
- 統一されたゼロ件表示パターン
- 相互ナビゲーションボタン（プロセス分析 ⇔ 組織分析 ⇔ 成果分析）
- 動的データソース（フィルターオプションをDBから取得）

#### ドキュメント

- README.md（プロジェクト概要、クイックスタート）
- USAGE.md（自組織でのプロセスマイニング実施ガイド）
- CLAUDE.md（開発ガイド、UI/UX統一の設計原則）
- データベース接続ガイド
- APIエンドポイント一覧

### Technical Details

#### Backend

- Python 3.11
- FastAPI
- SQLAlchemy
- Pandas
- NetworkX
- pytest

#### Frontend

- React 18
- TypeScript
- Vite
- Chakra UI
- React Flow (@xyflow/react)
- ELK.js (elkjs)
- Zustand

#### Infrastructure

- Docker & Docker Compose
- PostgreSQL 15
- dbt Core 1.7.3

### Database Schema

- `fct_event_log`: プロセスイベントログ（組織情報含む）
- `fct_case_outcomes`: ケース別成果データ
- `process_analysis_results`: プロセス分析結果
- `organization_analysis_results`: 組織分析結果
- `outcome_analysis_results`: 成果分析結果
- `master_employees`: 社員マスター
- `master_departments`: 部署マスター

[1.0.0]: https://github.com/suwa-sh/open-process-mining/releases/tag/v1.0.0
