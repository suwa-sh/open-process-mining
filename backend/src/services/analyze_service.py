"""
Service layer for process mining analysis execution.

This module provides functions to execute process mining analysis
with various filtering options and save results to the database.
"""

from typing import Optional, Dict, Any
import uuid
from datetime import datetime
import pandas as pd
import numpy as np
from sqlalchemy.orm import Session
from sqlalchemy import text

from src.db.connection import engine
from src.models.event_log import EventLog
from src.models.analysis_result import AnalysisResultORM
from src.analysis.dfg_discovery import discover_dfg
from src.analysis.performance_metrics import (
    calculate_performance_metrics,
    convert_dfg_to_react_flow,
)


def load_event_log_from_db(
    process_type: str,
    filter_mode: str = "all",
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
) -> list[EventLog]:
    """
    Load event log from fct_event_log table with date filtering.

    Args:
        process_type: Process type to filter
        filter_mode: "case_start" | "case_end" | "all"
        date_from: Start date (ISO8601 format)
        date_to: End date (ISO8601 format)

    Returns:
        List of EventLog objects
    """

    if filter_mode == "all" or (date_from is None and date_to is None):
        # すべての期間
        query = text(
            """
            SELECT case_id, activity, timestamp, resource
            FROM public.fct_event_log
            WHERE process_type = :process_type
            ORDER BY case_id, timestamp
        """
        )
        params = {"process_type": process_type}

    elif filter_mode == "case_start":
        # ケース開始日フィルタ（推奨）
        query = text(
            """
            WITH case_start_dates AS (
              SELECT
                case_id,
                MIN(timestamp) as start_date
              FROM public.fct_event_log
              WHERE process_type = :process_type
              GROUP BY case_id
            )
            SELECT e.case_id, e.activity, e.timestamp, e.resource
            FROM public.fct_event_log e
            JOIN case_start_dates c ON e.case_id = c.case_id
            WHERE e.process_type = :process_type
              AND c.start_date BETWEEN :date_from AND :date_to
            ORDER BY e.case_id, e.timestamp
        """
        )
        params = {
            "process_type": process_type,
            "date_from": date_from,
            "date_to": date_to,
        }

    elif filter_mode == "case_end":
        # ケース完了日フィルタ
        query = text(
            """
            WITH case_end_dates AS (
              SELECT
                case_id,
                MAX(timestamp) as end_date
              FROM public.fct_event_log
              WHERE process_type = :process_type
              GROUP BY case_id
            )
            SELECT e.case_id, e.activity, e.timestamp, e.resource
            FROM public.fct_event_log e
            JOIN case_end_dates c ON e.case_id = c.case_id
            WHERE e.process_type = :process_type
              AND c.end_date BETWEEN :date_from AND :date_to
            ORDER BY e.case_id, e.timestamp
        """
        )
        params = {
            "process_type": process_type,
            "date_from": date_from,
            "date_to": date_to,
        }
    else:
        raise ValueError(f"Invalid filter_mode: {filter_mode}")

    df = pd.read_sql(query, engine, params=params)

    event_log = []
    for _, row in df.iterrows():
        event_log.append(
            EventLog(
                case_id=row["case_id"],
                activity=row["activity"],
                timestamp=row["timestamp"],
                resource=row["resource"],
            )
        )

    return event_log


def execute_analysis(
    db: Session,
    analysis_name: str,
    process_type: str,
    filter_mode: str = "all",
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Execute process mining analysis and save to database.

    Args:
        db: Database session
        analysis_name: Name of the analysis
        process_type: Process type
        filter_mode: "case_start" | "case_end" | "all"
        date_from: Start date (ISO8601 format)
        date_to: End date (ISO8601 format)

    Returns:
        Dictionary with analysis result metadata

    Raises:
        ValueError: If no events found for the specified criteria
    """

    # 1. Load event log from database
    event_log = load_event_log_from_db(process_type, filter_mode, date_from, date_to)

    if not event_log:
        raise ValueError("指定された期間にイベントが見つかりません")

    # 2. Discover DFG
    dfg = discover_dfg(event_log)

    # 3. Calculate performance metrics
    dfg_with_metrics = calculate_performance_metrics(event_log, dfg)

    # 4. Convert to React Flow format
    result_json = convert_dfg_to_react_flow(dfg_with_metrics)

    # 5. Calculate lead time statistics
    lead_time_stats = calculate_lead_time_statistics(
        process_type, filter_mode, date_from, date_to
    )

    # Add lead time stats to result_json
    result_json["lead_time_stats"] = lead_time_stats

    # 6. Save to database
    analysis_id = uuid.uuid4()
    analysis_result = AnalysisResultORM(
        analysis_id=analysis_id,
        analysis_name=analysis_name,
        process_type=process_type,
        created_at=datetime.utcnow(),
        result_data=result_json,
    )
    db.add(analysis_result)
    db.commit()

    # 7. Calculate case count
    case_count = len(set(event.case_id for event in event_log))

    return {
        "analysis_id": str(analysis_id),
        "analysis_name": analysis_name,
        "process_type": process_type,
        "created_at": analysis_result.created_at.isoformat(),
        "event_count": len(event_log),
        "case_count": case_count,
        "node_count": len(result_json["nodes"]),
        "edge_count": len(result_json["edges"]),
        "cached": False,
        "filter_applied": {
            "mode": filter_mode,
            "date_from": date_from,
            "date_to": date_to,
        },
    }


def get_preview(
    process_type: str,
    filter_mode: str = "all",
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Get preview of analysis scope.

    Args:
        process_type: Process type
        filter_mode: "case_start" | "case_end" | "all"
        date_from: Start date (ISO8601 format)
        date_to: End date (ISO8601 format)

    Returns:
        Dictionary with preview information
    """

    if filter_mode == "all" or (date_from is None and date_to is None):
        query = text(
            """
            SELECT
                COUNT(*) as event_count,
                COUNT(DISTINCT case_id) as case_count,
                MIN(timestamp) as min_date,
                MAX(timestamp) as max_date
            FROM public.fct_event_log
            WHERE process_type = :process_type
        """
        )
        params = {"process_type": process_type}

    elif filter_mode == "case_start":
        query = text(
            """
            WITH case_start_dates AS (
              SELECT
                case_id,
                MIN(timestamp) as start_date
              FROM public.fct_event_log
              WHERE process_type = :process_type
              GROUP BY case_id
            ),
            filtered_cases AS (
              SELECT case_id
              FROM case_start_dates
              WHERE start_date BETWEEN :date_from AND :date_to
            )
            SELECT
                COUNT(*) as event_count,
                COUNT(DISTINCT e.case_id) as case_count,
                MIN(e.timestamp) as min_date,
                MAX(e.timestamp) as max_date
            FROM public.fct_event_log e
            JOIN filtered_cases c ON e.case_id = c.case_id
            WHERE e.process_type = :process_type
        """
        )
        params = {
            "process_type": process_type,
            "date_from": date_from,
            "date_to": date_to,
        }

    elif filter_mode == "case_end":
        query = text(
            """
            WITH case_end_dates AS (
              SELECT
                case_id,
                MAX(timestamp) as end_date
              FROM public.fct_event_log
              WHERE process_type = :process_type
              GROUP BY case_id
            ),
            filtered_cases AS (
              SELECT case_id
              FROM case_end_dates
              WHERE end_date BETWEEN :date_from AND :date_to
            )
            SELECT
                COUNT(*) as event_count,
                COUNT(DISTINCT e.case_id) as case_count,
                MIN(e.timestamp) as min_date,
                MAX(e.timestamp) as max_date
            FROM public.fct_event_log e
            JOIN filtered_cases c ON e.case_id = c.case_id
            WHERE e.process_type = :process_type
        """
        )
        params = {
            "process_type": process_type,
            "date_from": date_from,
            "date_to": date_to,
        }
    else:
        raise ValueError(f"Invalid filter_mode: {filter_mode}")

    df = pd.read_sql(query, engine, params=params)
    result = df.iloc[0]

    return {
        "event_count": int(result["event_count"]),
        "case_count": int(result["case_count"]),
        "date_range": {
            "min": (
                result["min_date"].isoformat() if pd.notna(result["min_date"]) else None
            ),
            "max": (
                result["max_date"].isoformat() if pd.notna(result["max_date"]) else None
            ),
        },
        "filter_applied": {
            "mode": filter_mode,
            "date_from": date_from,
            "date_to": date_to,
        },
    }


def calculate_lead_time_statistics(
    process_type: str,
    filter_mode: str = "all",
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Calculate case lead time statistics (time from case start to case end).

    Args:
        process_type: Process type to analyze
        filter_mode: "case_start" | "case_end" | "all"
        date_from: Start date (ISO8601 format)
        date_to: End date (ISO8601 format)

    Returns:
        Dictionary with lead time statistics:
        {
            "case_count": int,
            "lead_time_hours": {
                "min": float,
                "max": float,
                "median": float
            }
        }
    """

    # Load event log
    event_log = load_event_log_from_db(process_type, filter_mode, date_from, date_to)

    if not event_log:
        return {
            "case_count": 0,
            "lead_time_hours": {"min": None, "max": None, "median": None},
        }

    # Convert to DataFrame
    df = pd.DataFrame(
        [{"case_id": e.case_id, "timestamp": e.timestamp} for e in event_log]
    )

    # Calculate lead time for each case
    case_lead_times = df.groupby("case_id")["timestamp"].agg(["min", "max"])
    case_lead_times["lead_time"] = (
        case_lead_times["max"] - case_lead_times["min"]
    ).dt.total_seconds() / 3600

    # Calculate statistics
    lead_times = case_lead_times["lead_time"].values

    # Also calculate happy path statistics
    happy_path_stats = _calculate_happy_path_lead_time(event_log)

    return {
        "case_count": len(case_lead_times),
        "lead_time_hours": {
            "min": float(np.min(lead_times)),
            "max": float(np.max(lead_times)),
            "median": float(np.median(lead_times)),
        },
        "happy_path": happy_path_stats,
    }


def _calculate_happy_path_lead_time(event_log: list[EventLog]) -> Dict[str, Any]:
    """
    Calculate lead time statistics for cases following the happy path.

    Happy path is defined as the most frequent complete path from start to end.

    Args:
        event_log: List of event log entries

    Returns:
        Dictionary with happy path lead time statistics
    """
    if not event_log:
        return {
            "case_count": 0,
            "lead_time_hours": {"min": None, "max": None, "median": None},
            "path": [],
        }

    # Convert to DataFrame
    df = pd.DataFrame(
        [
            {"case_id": e.case_id, "activity": e.activity, "timestamp": e.timestamp}
            for e in event_log
        ]
    )

    # Sort by case and timestamp
    df = df.sort_values(["case_id", "timestamp"])

    # Create path for each case (sequence of activities)
    case_paths = (
        df.groupby("case_id")["activity"]
        .apply(lambda x: tuple(x.tolist()))
        .reset_index()
    )
    case_paths.columns = ["case_id", "path"]

    # Find the most frequent path (happy path)
    path_counts = case_paths["path"].value_counts()

    if len(path_counts) == 0:
        return {
            "case_count": 0,
            "lead_time_hours": {"min": None, "max": None, "median": None},
            "path": [],
        }

    happy_path = path_counts.index[0]

    # Get cases that follow the happy path
    happy_path_cases = case_paths[case_paths["path"] == happy_path]["case_id"].tolist()

    if not happy_path_cases:
        return {
            "case_count": 0,
            "lead_time_hours": {"min": None, "max": None, "median": None},
            "path": list(happy_path),
        }

    # Calculate lead time for happy path cases
    happy_df = df[df["case_id"].isin(happy_path_cases)]
    case_lead_times = happy_df.groupby("case_id")["timestamp"].agg(["min", "max"])
    case_lead_times["lead_time"] = (
        case_lead_times["max"] - case_lead_times["min"]
    ).dt.total_seconds() / 3600

    lead_times = case_lead_times["lead_time"].values

    return {
        "case_count": len(happy_path_cases),
        "lead_time_hours": {
            "min": float(np.min(lead_times)),
            "max": float(np.max(lead_times)),
            "median": float(np.median(lead_times)),
        },
        "path": list(happy_path),
    }
