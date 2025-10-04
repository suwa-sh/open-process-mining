"""Outcome analysis service"""
import uuid
from typing import List, Dict, Any, Optional
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import func, distinct, text
import pandas as pd
import numpy as np

from src.models.outcome import (
    OutcomeAnalysisResult,
    MetricInfo,
    OutcomeAnalysisSummary,
    OutcomeAnalysisDetail,
    CreateAnalysisParams,
    OutcomeStats
)


def get_available_metrics(db: Session, process_type: str) -> List[MetricInfo]:
    """指定プロセスタイプで利用可能なメトリック一覧を取得"""
    query = text("""
    SELECT
        metric_name,
        metric_unit,
        COUNT(*) as sample_count
    FROM fct_case_outcomes
    WHERE process_type = :process_type
    GROUP BY metric_name, metric_unit
    ORDER BY metric_name
    """)

    result = db.execute(query, {"process_type": process_type})
    rows = result.fetchall()

    return [
        MetricInfo(
            metric_name=row[0],
            metric_unit=row[1],
            sample_count=row[2]
        )
        for row in rows
    ]


def get_outcome_analyses(
    db: Session,
    process_type: Optional[str] = None,
    metric_name: Optional[str] = None
) -> List[OutcomeAnalysisSummary]:
    """成果分析結果の一覧を取得"""
    query = db.query(OutcomeAnalysisResult)

    if process_type:
        query = query.filter(OutcomeAnalysisResult.process_type == process_type)
    if metric_name:
        query = query.filter(OutcomeAnalysisResult.metric_name == metric_name)

    results = query.order_by(OutcomeAnalysisResult.created_at.desc()).all()

    return [
        OutcomeAnalysisSummary(
            analysis_id=str(r.analysis_id),
            analysis_name=r.analysis_name,
            process_type=r.process_type,
            metric_name=r.metric_name,
            analysis_type=r.analysis_type,
            created_at=r.created_at
        )
        for r in results
    ]


def get_outcome_analysis_by_id(db: Session, analysis_id: str) -> Optional[OutcomeAnalysisDetail]:
    """特定の成果分析結果を取得"""
    result = db.query(OutcomeAnalysisResult).filter(
        OutcomeAnalysisResult.analysis_id == analysis_id
    ).first()

    if not result:
        return None

    return OutcomeAnalysisDetail(
        analysis_id=str(result.analysis_id),
        analysis_name=result.analysis_name,
        process_type=result.process_type,
        metric_name=result.metric_name,
        analysis_type=result.analysis_type,
        filter_config=result.filter_config,
        result_data=result.result_data,
        created_at=result.created_at
    )


def _calculate_outcome_stats(values: List[float]) -> OutcomeStats:
    """成果統計を計算"""
    if not values:
        return OutcomeStats(avg=0, median=0, total=0, min=0, max=0, count=0)

    return OutcomeStats(
        avg=float(np.mean(values)),
        median=float(np.median(values)),
        total=float(np.sum(values)),
        min=float(np.min(values)),
        max=float(np.max(values)),
        count=len(values)
    )


def analyze_path_outcome(
    db: Session,
    process_type: str,
    metric_name: str,
    filter_config: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """パス別成果分析を実行"""

    # イベントログを取得
    event_query = """
    SELECT
        case_id,
        activity,
        timestamp
    FROM fct_event_log
    WHERE process_type = %(process_type)s
    """

    if filter_config and filter_config.get('date_from'):
        event_query += " AND timestamp >= %(date_from)s"
    if filter_config and filter_config.get('date_to'):
        event_query += " AND timestamp <= %(date_to)s"

    event_query += " ORDER BY case_id, timestamp"

    params = {"process_type": process_type}
    if filter_config:
        if filter_config.get('date_from'):
            params['date_from'] = filter_config['date_from']
        if filter_config.get('date_to'):
            params['date_to'] = filter_config['date_to']

    events_df = pd.read_sql(event_query, db.bind, params=params)

    # 成果データを取得
    outcome_query = """
    SELECT
        case_id,
        metric_value
    FROM fct_case_outcomes
    WHERE process_type = %(process_type)s
    AND metric_name = %(metric_name)s
    """

    outcomes_df = pd.read_sql(
        outcome_query,
        db.bind,
        params={"process_type": process_type, "metric_name": metric_name}
    )

    # DFGを構築
    edges_map = {}  # (source, target) -> list of case_ids
    activity_counts = {}

    for case_id, group in events_df.groupby('case_id'):
        activities = group.sort_values('timestamp')['activity'].tolist()

        for activity in activities:
            activity_counts[activity] = activity_counts.get(activity, 0) + 1

        for i in range(len(activities) - 1):
            source = activities[i]
            target = activities[i + 1]
            edge_key = (source, target)

            if edge_key not in edges_map:
                edges_map[edge_key] = []
            edges_map[edge_key].append(case_id)

    # 待機時間を計算
    waiting_times = {}
    for case_id, group in events_df.groupby('case_id'):
        sorted_events = group.sort_values('timestamp')
        for i in range(len(sorted_events) - 1):
            source = sorted_events.iloc[i]['activity']
            target = sorted_events.iloc[i + 1]['activity']
            time_diff = (sorted_events.iloc[i + 1]['timestamp'] - sorted_events.iloc[i]['timestamp']).total_seconds() / 3600

            edge_key = (source, target)
            if edge_key not in waiting_times:
                waiting_times[edge_key] = []
            waiting_times[edge_key].append(time_diff)

    # React Flow互換のノードとエッジを生成
    nodes = []
    for activity, count in activity_counts.items():
        nodes.append({
            "id": activity,
            "type": "actionNode",
            "data": {
                "label": activity,
                "frequency": count
            }
        })

    edges = []
    edge_id = 0
    for (source, target), case_ids in edges_map.items():
        edge_id += 1

        # このパスを通過したケースの成果を集計
        outcome_values = []
        for case_id in case_ids:
            outcome_row = outcomes_df[outcomes_df['case_id'] == case_id]
            if not outcome_row.empty:
                outcome_values.append(float(outcome_row.iloc[0]['metric_value']))

        outcome_stats = _calculate_outcome_stats(outcome_values)

        avg_waiting_time = np.mean(waiting_times.get((source, target), [0]))

        edges.append({
            "id": f"edge-{edge_id}",
            "source": source,
            "target": target,
            "data": {
                "frequency": len(case_ids),
                "avg_waiting_time_hours": float(avg_waiting_time),
                "outcome_stats": {
                    metric_name: outcome_stats.dict()
                }
            }
        })

    # サマリー情報を生成
    all_outcome_values = outcomes_df['metric_value'].tolist()
    overall_stats = _calculate_outcome_stats(all_outcome_values)

    # 高成果パスを特定（平均値が全体平均の1.2倍以上）
    top_paths = []
    for edge in edges:
        edge_avg = edge['data']['outcome_stats'][metric_name]['avg']
        if edge_avg >= overall_stats.avg * 1.2:
            top_paths.append({
                "source": edge['source'],
                "target": edge['target'],
                "avg_outcome": edge_avg
            })

    top_paths.sort(key=lambda x: x['avg_outcome'], reverse=True)

    return {
        "nodes": nodes,
        "edges": edges,
        "summary": {
            "total_cases": len(events_df['case_id'].unique()),
            "metrics": [metric_name],
            "overall_stats": overall_stats.dict(),
            "top_paths": top_paths[:5]  # 上位5件
        }
    }


def analyze_segment_comparison(
    db: Session,
    process_type: str,
    metric_name: str,
    segment_mode: str,  # "top25", "bottom25", "threshold"
    threshold: Optional[float] = None,
    filter_config: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """セグメント比較分析を実行"""

    # 成果データを取得
    outcome_query = """
    SELECT
        case_id,
        metric_value
    FROM fct_case_outcomes
    WHERE process_type = %(process_type)s
    AND metric_name = %(metric_name)s
    ORDER BY metric_value
    """

    outcomes_df = pd.read_sql(
        outcome_query,
        db.bind,
        params={"process_type": process_type, "metric_name": metric_name}
    )

    # セグメントに分割
    if segment_mode == "top25":
        # 上位25%
        threshold_value = outcomes_df['metric_value'].quantile(0.75)
        high_segment_cases = outcomes_df[outcomes_df['metric_value'] >= threshold_value]['case_id'].tolist()
        low_segment_cases = outcomes_df[outcomes_df['metric_value'] < threshold_value]['case_id'].tolist()
        segment_label = "上位25%"
    elif segment_mode == "bottom25":
        # 下位25%
        threshold_value = outcomes_df['metric_value'].quantile(0.25)
        high_segment_cases = outcomes_df[outcomes_df['metric_value'] >= threshold_value]['case_id'].tolist()
        low_segment_cases = outcomes_df[outcomes_df['metric_value'] < threshold_value]['case_id'].tolist()
        segment_label = "下位25%"
    elif segment_mode == "threshold" and threshold is not None:
        # 閾値ベース
        threshold_value = threshold
        high_segment_cases = outcomes_df[outcomes_df['metric_value'] >= threshold_value]['case_id'].tolist()
        low_segment_cases = outcomes_df[outcomes_df['metric_value'] < threshold_value]['case_id'].tolist()
        segment_label = f"閾値 {threshold}"
    else:
        raise ValueError(f"Invalid segment_mode: {segment_mode}")

    # イベントログを取得
    event_query = """
    SELECT
        case_id,
        activity,
        timestamp
    FROM fct_event_log
    WHERE process_type = %(process_type)s
    """

    if filter_config and filter_config.get('date_from'):
        event_query += " AND timestamp >= %(date_from)s"
    if filter_config and filter_config.get('date_to'):
        event_query += " AND timestamp <= %(date_to)s"

    event_query += " ORDER BY case_id, timestamp"

    params = {"process_type": process_type}
    if filter_config:
        if filter_config.get('date_from'):
            params['date_from'] = filter_config['date_from']
        if filter_config.get('date_to'):
            params['date_to'] = filter_config['date_to']

    events_df = pd.read_sql(event_query, db.bind, params=params)

    # 各セグメントのDFGを生成
    def _build_dfg(case_ids):
        segment_events = events_df[events_df['case_id'].isin(case_ids)]

        edges_map = {}
        activity_counts = {}
        waiting_times = {}

        for case_id, group in segment_events.groupby('case_id'):
            activities = group.sort_values('timestamp')['activity'].tolist()

            for activity in activities:
                activity_counts[activity] = activity_counts.get(activity, 0) + 1

            for i in range(len(activities) - 1):
                source = activities[i]
                target = activities[i + 1]
                edge_key = (source, target)

                if edge_key not in edges_map:
                    edges_map[edge_key] = []
                edges_map[edge_key].append(case_id)

        # 待機時間を計算
        for case_id, group in segment_events.groupby('case_id'):
            sorted_events = group.sort_values('timestamp')
            for i in range(len(sorted_events) - 1):
                source = sorted_events.iloc[i]['activity']
                target = sorted_events.iloc[i + 1]['activity']
                time_diff = (sorted_events.iloc[i + 1]['timestamp'] - sorted_events.iloc[i]['timestamp']).total_seconds() / 3600

                edge_key = (source, target)
                if edge_key not in waiting_times:
                    waiting_times[edge_key] = []
                waiting_times[edge_key].append(time_diff)

        # ノード生成
        nodes = []
        for activity, count in activity_counts.items():
            nodes.append({
                "id": activity,
                "type": "actionNode",
                "data": {
                    "label": activity,
                    "frequency": count
                }
            })

        # エッジ生成
        edges = []
        edge_id = 0
        for (source, target), case_ids_list in edges_map.items():
            edge_id += 1
            avg_waiting_time = np.mean(waiting_times.get((source, target), [0]))

            edges.append({
                "id": f"edge-{edge_id}",
                "source": source,
                "target": target,
                "data": {
                    "frequency": len(case_ids_list),
                    "avg_waiting_time_hours": float(avg_waiting_time)
                }
            })

        return nodes, edges, edges_map

    high_nodes, high_edges, high_edges_map = _build_dfg(high_segment_cases)
    low_nodes, low_edges, low_edges_map = _build_dfg(low_segment_cases)

    # 差分を計算（パス出現率の差）
    total_high = len(high_segment_cases)
    total_low = len(low_segment_cases)

    differences = []
    all_edge_keys = set(high_edges_map.keys()) | set(low_edges_map.keys())

    for edge_key in all_edge_keys:
        high_freq = len(high_edges_map.get(edge_key, []))
        low_freq = len(low_edges_map.get(edge_key, []))

        high_rate = high_freq / total_high if total_high > 0 else 0
        low_rate = low_freq / total_low if total_low > 0 else 0

        diff_rate = high_rate - low_rate

        if abs(diff_rate) > 0.1:  # 10%以上の差分のみ
            differences.append({
                "source": edge_key[0],
                "target": edge_key[1],
                "high_rate": round(high_rate * 100, 1),
                "low_rate": round(low_rate * 100, 1),
                "diff_rate": round(diff_rate * 100, 1)
            })

    differences.sort(key=lambda x: abs(x['diff_rate']), reverse=True)

    # 成果統計
    high_outcomes = outcomes_df[outcomes_df['case_id'].isin(high_segment_cases)]['metric_value'].tolist()
    low_outcomes = outcomes_df[outcomes_df['case_id'].isin(low_segment_cases)]['metric_value'].tolist()

    high_stats = _calculate_outcome_stats(high_outcomes)
    low_stats = _calculate_outcome_stats(low_outcomes)

    return {
        "high_segment": {
            "label": f"高成果群（{segment_label}）",
            "nodes": high_nodes,
            "edges": high_edges,
            "case_count": total_high,
            "outcome_stats": high_stats.dict()
        },
        "low_segment": {
            "label": f"低成果群（{segment_label}以外）",
            "nodes": low_nodes,
            "edges": low_edges,
            "case_count": total_low,
            "outcome_stats": low_stats.dict()
        },
        "differences": differences[:10],  # 上位10件
        "summary": {
            "metric_name": metric_name,
            "segment_mode": segment_mode,
            "threshold_value": threshold_value,
            "total_cases": len(outcomes_df)
        }
    }


def create_outcome_analysis(
    db: Session,
    params: CreateAnalysisParams
) -> str:
    """成果分析を作成"""

    # filter_configを準備（date_from/date_toを統合）
    filter_config = params.filter_config or {}
    if params.date_from:
        filter_config['date_from'] = params.date_from
    if params.date_to:
        filter_config['date_to'] = params.date_to

    # 分析を実行
    if params.analysis_type == "path-outcome":
        result_data = analyze_path_outcome(
            db,
            params.process_type,
            params.metric_name,
            filter_config if filter_config else None
        )
    elif params.analysis_type == "segment-comparison":
        # filter_configからセグメント設定を取得
        segment_mode = filter_config.get('segment_mode', 'top25')
        threshold = filter_config.get('threshold')

        result_data = analyze_segment_comparison(
            db,
            params.process_type,
            params.metric_name,
            segment_mode,
            threshold,
            filter_config if filter_config else None
        )
    else:
        raise ValueError(f"Unsupported analysis type: {params.analysis_type}")

    # DBに保存
    analysis = OutcomeAnalysisResult(
        analysis_name=params.analysis_name,
        process_type=params.process_type,
        metric_name=params.metric_name,
        analysis_type=params.analysis_type,
        filter_config=filter_config if filter_config else None,
        result_data=result_data
    )

    db.add(analysis)
    db.commit()
    db.refresh(analysis)

    return str(analysis.analysis_id)
