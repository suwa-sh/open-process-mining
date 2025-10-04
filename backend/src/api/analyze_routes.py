"""
API routes for on-demand process mining analysis.

This module provides endpoints for executing analysis with
various filtering options and previewing analysis scope.
"""

from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field

from src.db.connection import get_db
from src.services.analyze_service import execute_analysis, get_preview, calculate_lead_time_statistics


router = APIRouter()


class AnalyzeRequest(BaseModel):
    """Request model for creating new analysis."""
    analysis_name: str = Field(..., min_length=1, max_length=255, description="Name of the analysis")
    process_type: str = Field(..., description="Process type to analyze")
    filter_mode: str = Field(default="all", pattern="^(case_start|case_end|all)$", description="Filtering mode")
    date_from: Optional[str] = Field(None, description="Start date in ISO8601 format")
    date_to: Optional[str] = Field(None, description="End date in ISO8601 format")


@router.post("/analyze")
def create_analysis(
    request: AnalyzeRequest,
    db: Session = Depends(get_db)
):
    """
    Execute new analysis and save to database.

    Args:
        request: Analysis request parameters
        db: Database session

    Returns:
        Analysis result metadata including analysis_id

    Raises:
        HTTPException 400: Validation error or no events found
        HTTPException 500: Internal server error during analysis
    """
    try:
        result = execute_analysis(
            db=db,
            analysis_name=request.analysis_name,
            process_type=request.process_type,
            filter_mode=request.filter_mode,
            date_from=request.date_from,
            date_to=request.date_to
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"分析処理エラー: {str(e)}")


@router.get("/preview")
def preview_analysis(
    process_type: str,
    filter_mode: str = "all",
    date_from: Optional[str] = None,
    date_to: Optional[str] = None
):
    """
    Preview analysis scope before execution.

    Args:
        process_type: Process type to preview
        filter_mode: Filtering mode (case_start, case_end, or all)
        date_from: Start date in ISO8601 format (optional)
        date_to: End date in ISO8601 format (optional)

    Returns:
        Preview information including event count, case count, and date range

    Raises:
        HTTPException 400: Invalid filter_mode
        HTTPException 500: Internal server error during preview
    """
    try:
        result = get_preview(
            process_type=process_type,
            filter_mode=filter_mode,
            date_from=date_from,
            date_to=date_to
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"プレビュー取得エラー: {str(e)}")


@router.get("/lead-time-stats")
def get_lead_time_statistics(
    process_type: str,
    filter_mode: str = "all",
    date_from: Optional[str] = None,
    date_to: Optional[str] = None
):
    """
    Calculate lead time statistics for cases.

    Args:
        process_type: Process type to analyze
        filter_mode: Filtering mode (case_start, case_end, or all)
        date_from: Start date in ISO8601 format (optional)
        date_to: End date in ISO8601 format (optional)

    Returns:
        Lead time statistics including case count, min, max, and median

    Raises:
        HTTPException 400: Invalid parameters
        HTTPException 500: Internal server error
    """
    try:
        result = calculate_lead_time_statistics(
            process_type=process_type,
            filter_mode=filter_mode,
            date_from=date_from,
            date_to=date_to
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"リードタイム統計計算エラー: {str(e)}")
