"""
Organization Analysis API Routes

Endpoints for handover, workload, and performance analysis.
"""

from fastapi import APIRouter, Query, HTTPException
from typing import Optional, List
from pydantic import BaseModel
from src.services.organization_service import (
    analyze_handover,
    analyze_workload,
    analyze_performance,
    create_organization_analysis,
    get_organization_analyses,
    get_organization_analysis_by_id
)

router = APIRouter(
    prefix="/organization",
    tags=["組織分析"],
    responses={404: {"description": "Not found"}},
)


class CreateOrganizationAnalysisRequest(BaseModel):
    analysis_name: str
    process_type: str
    aggregation_level: str = "employee"
    filter_mode: str = "all"
    date_from: Optional[str] = None
    date_to: Optional[str] = None


@router.post("/analyze")
def create_analysis(request: CreateOrganizationAnalysisRequest):
    """
    Create a new organization analysis and save results to database.

    Returns the analysis ID and summary information.
    """
    try:
        result = create_organization_analysis(
            analysis_name=request.analysis_name,
            process_type=request.process_type,
            aggregation_level=request.aggregation_level,
            filter_mode=request.filter_mode,
            date_from=request.date_from,
            date_to=request.date_to
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/analyses")
def list_analyses(process_type: Optional[str] = None):
    """
    Get list of organization analysis results.

    Optionally filter by process_type.
    """
    try:
        return get_organization_analyses(process_type)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/analyses/{analysis_id}")
def get_analysis(analysis_id: str):
    """
    Get a specific organization analysis result by ID.

    Returns handover, workload, and performance data.
    """
    try:
        result = get_organization_analysis_by_id(analysis_id)
        if not result:
            raise HTTPException(status_code=404, detail="Analysis not found")
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/handover")
def get_handover_analysis(
    process_type: str = Query(..., description="Process type to analyze"),
    aggregation_level: str = Query("employee", description="Aggregation level: employee or department"),
    filter_mode: str = Query("all", description="Filter mode: all or completed"),
    date_from: Optional[str] = Query(None, description="Start date filter (ISO format)"),
    date_to: Optional[str] = Query(None, description="End date filter (ISO format)")
):
    """
    Get handover analysis (social network of who works with whom).

    Returns nodes (people/departments) and edges (handovers with counts).
    """
    return analyze_handover(
        process_type=process_type,
        aggregation_level=aggregation_level,
        filter_mode=filter_mode,
        date_from=date_from,
        date_to=date_to
    )


@router.get("/workload")
def get_workload_analysis(
    process_type: str = Query(..., description="Process type to analyze"),
    aggregation_level: str = Query("employee", description="Aggregation level: employee or department"),
    filter_mode: str = Query("all", description="Filter mode: all or completed"),
    date_from: Optional[str] = Query(None, description="Start date filter (ISO format)"),
    date_to: Optional[str] = Query(None, description="End date filter (ISO format)")
):
    """
    Get workload analysis (who has the most work).

    Returns activity and case counts per person/department.
    """
    return analyze_workload(
        process_type=process_type,
        aggregation_level=aggregation_level,
        filter_mode=filter_mode,
        date_from=date_from,
        date_to=date_to
    )


@router.get("/performance")
def get_performance_analysis(
    process_type: str = Query(..., description="Process type to analyze"),
    aggregation_level: str = Query("employee", description="Aggregation level: employee or department"),
    filter_mode: str = Query("all", description="Filter mode: all or completed"),
    date_from: Optional[str] = Query(None, description="Start date filter (ISO format)"),
    date_to: Optional[str] = Query(None, description="End date filter (ISO format)")
):
    """
    Get performance analysis (who takes the longest time).

    Returns average and median duration per person/department.
    """
    return analyze_performance(
        process_type=process_type,
        aggregation_level=aggregation_level,
        filter_mode=filter_mode,
        date_from=date_from,
        date_to=date_to
    )
