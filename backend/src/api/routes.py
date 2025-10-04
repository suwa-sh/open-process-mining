from typing import List, Dict, Any, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from src.db.connection import get_db
from src.models.analysis_result import (
    AnalysisResultORM,
    AnalysisListItem,
)

router = APIRouter(
    tags=["プロセス分析"],
    responses={404: {"description": "Not found"}},
)


@router.get("/analyses", response_model=List[AnalysisListItem])
def get_analyses(
    process_type: Optional[str] = Query(None, description="Filter by process type"),
    db: Session = Depends(get_db),
):
    """Get list of all analyses, optionally filtered by process type."""
    query = db.query(AnalysisResultORM)

    if process_type:
        query = query.filter(AnalysisResultORM.process_type == process_type)

    analyses = query.order_by(AnalysisResultORM.created_at.desc()).all()
    return analyses


@router.get("/process-types", response_model=List[str])
def get_process_types(db: Session = Depends(get_db)):
    """Get list of available process types from event log."""
    from sqlalchemy import text

    # fct_event_logから取得（実データに基づく）
    query = text(
        """
        SELECT DISTINCT process_type
        FROM public.fct_event_log
        WHERE process_type IS NOT NULL
        ORDER BY process_type
    """
    )
    result = db.execute(query).fetchall()
    return [r[0] for r in result]


@router.get("/analyses/{analysis_id}", response_model=Dict[str, Any])
def get_analysis_by_id(analysis_id: UUID, db: Session = Depends(get_db)):
    """Get specific analysis result by ID."""
    analysis = (
        db.query(AnalysisResultORM)
        .filter(AnalysisResultORM.analysis_id == analysis_id)
        .first()
    )

    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")

    return analysis.result_data


@router.get("/compare", response_model=Dict[str, Any])
def compare_analyses(before: UUID, after: UUID, db: Session = Depends(get_db)):
    """
    Compare two analyses and return differences.

    Args:
        before: Analysis ID for "before" state
        after: Analysis ID for "after" state
    """
    # Get both analyses
    before_analysis = (
        db.query(AnalysisResultORM)
        .filter(AnalysisResultORM.analysis_id == before)
        .first()
    )
    after_analysis = (
        db.query(AnalysisResultORM)
        .filter(AnalysisResultORM.analysis_id == after)
        .first()
    )

    if not before_analysis:
        raise HTTPException(
            status_code=404, detail=f"Before analysis {before} not found"
        )
    if not after_analysis:
        raise HTTPException(status_code=404, detail=f"After analysis {after} not found")

    before_data = before_analysis.result_data
    after_data = after_analysis.result_data

    # Calculate differences
    comparison_result = calculate_comparison(before_data, after_data)

    return comparison_result


def calculate_comparison(before: Dict, after: Dict) -> Dict:
    """Calculate comparison between two analysis results."""
    before_nodes = {node["id"]: node for node in before.get("nodes", [])}
    after_nodes = {node["id"]: node for node in after.get("nodes", [])}

    before_edges = {
        (edge["source"], edge["target"]): edge for edge in before.get("edges", [])
    }
    after_edges = {
        (edge["source"], edge["target"]): edge for edge in after.get("edges", [])
    }

    # Compare nodes
    comparison_nodes = []

    # Added nodes (only in after)
    for node_id, node in after_nodes.items():
        if node_id not in before_nodes:
            comparison_nodes.append({**node, "diff_status": "added"})

    # Removed nodes (only in before)
    for node_id, node in before_nodes.items():
        if node_id not in after_nodes:
            comparison_nodes.append({**node, "diff_status": "removed"})

    # Unchanged or modified nodes
    for node_id in set(before_nodes.keys()) & set(after_nodes.keys()):
        before_node = before_nodes[node_id]
        after_node = after_nodes[node_id]

        before_freq = before_node.get("data", {}).get("frequency", 0)
        after_freq = after_node.get("data", {}).get("frequency", 0)

        if before_freq != 0:
            change_rate = ((after_freq - before_freq) / before_freq) * 100
        else:
            change_rate = 0 if after_freq == 0 else 100

        # Determine status
        if abs(change_rate) < 5:  # Less than 5% change
            status = "unchanged"
        elif change_rate > 0:
            status = "improved"
        else:
            status = "degraded"

        comparison_nodes.append(
            {
                **after_node,
                "diff_status": status,
                "frequency_change_rate": round(change_rate, 2),
            }
        )

    # Compare edges
    comparison_edges = []
    edge_counter = 0

    # Added edges
    for edge_key, edge in after_edges.items():
        if edge_key not in before_edges:
            edge_counter += 1
            comparison_edges.append(
                {
                    "id": f"edge-{edge_counter}",
                    "source": edge["source"],
                    "target": edge["target"],
                    "data": edge.get("data", {}),
                    "diff_status": "added",
                }
            )

    # Removed edges
    for edge_key, edge in before_edges.items():
        if edge_key not in after_edges:
            edge_counter += 1
            comparison_edges.append(
                {
                    "id": f"edge-{edge_counter}",
                    "source": edge["source"],
                    "target": edge["target"],
                    "data": edge.get("data", {}),
                    "diff_status": "removed",
                }
            )

    # Unchanged or modified edges
    for edge_key in set(before_edges.keys()) & set(after_edges.keys()):
        before_edge = before_edges[edge_key]
        after_edge = after_edges[edge_key]

        before_freq = before_edge.get("data", {}).get("frequency", 0)
        after_freq = after_edge.get("data", {}).get("frequency", 0)

        if before_freq != 0:
            change_rate = ((after_freq - before_freq) / before_freq) * 100
        else:
            change_rate = 0 if after_freq == 0 else 100

        # Determine status
        if abs(change_rate) < 5:
            status = "unchanged"
        elif change_rate > 0:
            status = "improved"
        else:
            status = "degraded"

        edge_counter += 1
        comparison_edges.append(
            {
                "id": f"edge-{edge_counter}",
                "source": after_edge["source"],
                "target": after_edge["target"],
                "data": after_edge.get("data", {}),
                "diff_status": status,
                "frequency_change_rate": round(change_rate, 2),
            }
        )

    return {"nodes": comparison_nodes, "edges": comparison_edges}
