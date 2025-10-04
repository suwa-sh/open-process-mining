"""
Organization Analysis Service

Provides handover, workload, and performance analysis by person and department.
"""

from typing import Dict, Any, Optional, List
from collections import defaultdict
import pandas as pd
from sqlalchemy import text
from src.db.connection import engine
import json


def load_event_log_with_organization(
    process_type: str,
    filter_mode: str = "all",
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
) -> pd.DataFrame:
    """
    Load event log with organizational information from database.

    Args:
        process_type: Process type to filter
        filter_mode: "case_start" | "case_end" | "all"
        date_from: Start date (ISO8601 format)
        date_to: End date (ISO8601 format)

    Returns:
        DataFrame with event log and organizational data
    """

    if filter_mode == "all" or (date_from is None and date_to is None):
        query = text(
            """
            SELECT
                case_id,
                activity,
                timestamp,
                resource,
                employee_id,
                employee_name,
                role,
                department_id,
                department_name,
                department_type
            FROM public.fct_event_log
            WHERE process_type = :process_type
            ORDER BY case_id, timestamp
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
            )
            SELECT
                e.case_id,
                e.activity,
                e.timestamp,
                e.resource,
                e.employee_id,
                e.employee_name,
                e.role,
                e.department_id,
                e.department_name,
                e.department_type
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
            SELECT
                e.case_id,
                e.activity,
                e.timestamp,
                e.resource,
                e.employee_id,
                e.employee_name,
                e.role,
                e.department_id,
                e.department_name,
                e.department_type
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
    return df


def analyze_handover(
    process_type: str,
    aggregation_level: str = "employee",  # "employee" or "department"
    filter_mode: str = "all",
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Analyze who works with whom (handover/social network analysis).

    Returns a network graph structure showing handovers between people/departments.
    """
    df = load_event_log_with_organization(process_type, filter_mode, date_from, date_to)

    if df.empty:
        return {"nodes": [], "edges": [], "aggregation_level": aggregation_level}

    # Determine the resource level
    if aggregation_level == "employee":
        resource_id_col = "employee_id"
        resource_name_col = "employee_name"
    else:  # department
        resource_id_col = "department_id"
        resource_name_col = "department_name"

    # Calculate handovers (transitions between different resources) with waiting time
    handovers = defaultdict(lambda: {"count": 0, "total_waiting_time": 0.0})

    for case_id in df["case_id"].unique():
        case_df = df[df["case_id"] == case_id].sort_values("timestamp")

        for i in range(len(case_df) - 1):
            current_row = case_df.iloc[i]
            next_row = case_df.iloc[i + 1]
            current_resource = current_row[resource_id_col]
            next_resource = next_row[resource_id_col]

            # Only count handovers between different resources
            if (
                current_resource != next_resource
                and pd.notna(current_resource)
                and pd.notna(next_resource)
            ):
                waiting_time_hours = (
                    next_row["timestamp"] - current_row["timestamp"]
                ).total_seconds() / 3600
                handovers[(current_resource, next_resource)]["count"] += 1
                handovers[(current_resource, next_resource)][
                    "total_waiting_time"
                ] += waiting_time_hours

    # Build nodes (unique resources)
    resource_activity_count = df.groupby(resource_id_col).size().to_dict()
    unique_resources = df[[resource_id_col, resource_name_col]].drop_duplicates()

    nodes = []
    for _, row in unique_resources.iterrows():
        resource_id = row[resource_id_col]
        if pd.notna(resource_id):
            nodes.append(
                {
                    "id": resource_id,
                    "label": (
                        row[resource_name_col]
                        if pd.notna(row[resource_name_col])
                        else resource_id
                    ),
                    "activity_count": resource_activity_count.get(resource_id, 0),
                }
            )

    # Build edges (handovers)
    edges = []
    for (source, target), data in handovers.items():
        avg_waiting_time = (
            data["total_waiting_time"] / data["count"] if data["count"] > 0 else 0.0
        )
        edges.append(
            {
                "source": source,
                "target": target,
                "handover_count": data["count"],
                "avg_waiting_time_hours": avg_waiting_time,
            }
        )

    return {"nodes": nodes, "edges": edges, "aggregation_level": aggregation_level}


def analyze_workload(
    process_type: str,
    aggregation_level: str = "employee",
    filter_mode: str = "all",
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Analyze workload distribution (who has the most work).

    Returns statistics on activity counts per person/department.
    """
    df = load_event_log_with_organization(process_type, filter_mode, date_from, date_to)

    if df.empty:
        return {"workload": [], "aggregation_level": aggregation_level}

    # Determine the resource level
    if aggregation_level == "employee":
        resource_id_col = "employee_id"
        resource_name_col = "employee_name"
    else:
        resource_id_col = "department_id"
        resource_name_col = "department_name"

    # Count activities and cases per resource
    workload_stats = (
        df.groupby([resource_id_col, resource_name_col])
        .agg(activity_count=("activity", "count"), case_count=("case_id", "nunique"))
        .reset_index()
    )

    # Convert to list of dicts
    workload = []
    for _, row in workload_stats.iterrows():
        if pd.notna(row[resource_id_col]):
            workload.append(
                {
                    "resource_id": row[resource_id_col],
                    "resource_name": (
                        row[resource_name_col]
                        if pd.notna(row[resource_name_col])
                        else row[resource_id_col]
                    ),
                    "activity_count": int(row["activity_count"]),
                    "case_count": int(row["case_count"]),
                }
            )

    # Sort by activity count descending
    workload.sort(key=lambda x: x["activity_count"], reverse=True)

    return {"workload": workload, "aggregation_level": aggregation_level}


def analyze_performance(
    process_type: str,
    aggregation_level: str = "employee",
    filter_mode: str = "all",
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Analyze performance (who takes the longest time).

    Returns statistics on average activity duration per person/department.
    """
    df = load_event_log_with_organization(process_type, filter_mode, date_from, date_to)

    if df.empty:
        return {"performance": [], "aggregation_level": aggregation_level}

    # Determine the resource level
    if aggregation_level == "employee":
        resource_id_col = "employee_id"
        resource_name_col = "employee_name"
    else:
        resource_id_col = "department_id"
        resource_name_col = "department_name"

    # Calculate time between activities (duration)
    durations = []

    for case_id in df["case_id"].unique():
        case_df = df[df["case_id"] == case_id].sort_values("timestamp")

        for i in range(len(case_df) - 1):
            current_row = case_df.iloc[i]
            next_row = case_df.iloc[i + 1]

            duration_hours = (
                next_row["timestamp"] - current_row["timestamp"]
            ).total_seconds() / 3600

            # Attribute duration to the resource who performed the current activity
            if pd.notna(current_row[resource_id_col]):
                durations.append(
                    {
                        "resource_id": current_row[resource_id_col],
                        "resource_name": current_row[resource_name_col],
                        "duration_hours": duration_hours,
                        "activity": current_row["activity"],
                    }
                )

    if not durations:
        return {"performance": [], "aggregation_level": aggregation_level}

    # Convert to DataFrame and calculate statistics
    duration_df = pd.DataFrame(durations)

    performance_stats = (
        duration_df.groupby(["resource_id", "resource_name"])
        .agg(
            avg_duration_hours=("duration_hours", "mean"),
            median_duration_hours=("duration_hours", "median"),
            total_duration_hours=("duration_hours", "sum"),
            activity_count=("activity", "count"),
        )
        .reset_index()
    )

    # Convert to list of dicts
    performance = []
    for _, row in performance_stats.iterrows():
        performance.append(
            {
                "resource_id": row["resource_id"],
                "resource_name": (
                    row["resource_name"]
                    if pd.notna(row["resource_name"])
                    else row["resource_id"]
                ),
                "avg_duration_hours": float(row["avg_duration_hours"]),
                "median_duration_hours": float(row["median_duration_hours"]),
                "total_duration_hours": float(row["total_duration_hours"]),
                "activity_count": int(row["activity_count"]),
            }
        )

    # Sort by average duration descending
    performance.sort(key=lambda x: x["avg_duration_hours"], reverse=True)

    return {"performance": performance, "aggregation_level": aggregation_level}


def create_organization_analysis(
    analysis_name: str,
    process_type: str,
    aggregation_level: str = "employee",
    filter_mode: str = "all",
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Create and save organization analysis results.

    Returns analysis metadata and summary.
    """
    # Run all three analyses
    handover_data = analyze_handover(
        process_type, aggregation_level, filter_mode, date_from, date_to
    )
    workload_data = analyze_workload(
        process_type, aggregation_level, filter_mode, date_from, date_to
    )
    performance_data = analyze_performance(
        process_type, aggregation_level, filter_mode, date_from, date_to
    )

    # Save to database
    query = text(
        """
        INSERT INTO organization_analysis_results (
            analysis_name, process_type, aggregation_level, filter_mode,
            date_from, date_to, handover_data, workload_data, performance_data
        )
        VALUES (
            :analysis_name, :process_type, :aggregation_level, :filter_mode,
            :date_from, :date_to, :handover_data, :workload_data, :performance_data
        )
        RETURNING analysis_id, created_at
    """
    )

    params = {
        "analysis_name": analysis_name,
        "process_type": process_type,
        "aggregation_level": aggregation_level,
        "filter_mode": filter_mode,
        "date_from": date_from,
        "date_to": date_to,
        "handover_data": json.dumps(handover_data),
        "workload_data": json.dumps(workload_data),
        "performance_data": json.dumps(performance_data),
    }

    with engine.connect() as conn:
        result = conn.execute(query, params)
        conn.commit()
        row = result.fetchone()

    return {
        "analysis_id": str(row[0]),
        "analysis_name": analysis_name,
        "process_type": process_type,
        "aggregation_level": aggregation_level,
        "created_at": row[1].isoformat(),
        "node_count": len(handover_data["nodes"]),
        "resource_count": len(workload_data["workload"]),
    }


def get_organization_analyses(
    process_type: Optional[str] = None,
) -> List[Dict[str, Any]]:
    """
    Get list of organization analysis results.

    Optionally filter by process_type.
    """
    if process_type:
        query = text(
            """
            SELECT analysis_id, analysis_name, process_type, aggregation_level, created_at
            FROM organization_analysis_results
            WHERE process_type = :process_type
            ORDER BY created_at DESC
        """
        )
        params = {"process_type": process_type}
    else:
        query = text(
            """
            SELECT analysis_id, analysis_name, process_type, aggregation_level, created_at
            FROM organization_analysis_results
            ORDER BY created_at DESC
        """
        )
        params = {}

    with engine.connect() as conn:
        result = conn.execute(query, params)
        analyses = []
        for row in result:
            analyses.append(
                {
                    "analysis_id": str(row[0]),
                    "analysis_name": row[1],
                    "process_type": row[2],
                    "aggregation_level": row[3],
                    "created_at": row[4].isoformat(),
                }
            )

    return analyses


def get_organization_analysis_by_id(analysis_id: str) -> Optional[Dict[str, Any]]:
    """
    Get organization analysis result by ID.

    Returns complete analysis data including handover, workload, and performance.
    """
    query = text(
        """
        SELECT
            analysis_id, analysis_name, process_type, aggregation_level,
            filter_mode, date_from, date_to, created_at,
            handover_data, workload_data, performance_data
        FROM organization_analysis_results
        WHERE analysis_id = :analysis_id
    """
    )

    with engine.connect() as conn:
        result = conn.execute(query, {"analysis_id": analysis_id})
        row = result.fetchone()

        if not row:
            return None

        return {
            "analysis_id": str(row[0]),
            "analysis_name": row[1],
            "process_type": row[2],
            "aggregation_level": row[3],
            "filter_mode": row[4],
            "date_from": row[5].isoformat() if row[5] else None,
            "date_to": row[6].isoformat() if row[6] else None,
            "created_at": row[7].isoformat(),
            "handover_data": row[8],
            "workload_data": row[9],
            "performance_data": row[10],
        }
