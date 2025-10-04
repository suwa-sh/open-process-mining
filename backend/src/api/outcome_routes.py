"""Outcome analysis API routes"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from src.db.connection import get_db
from src.models.outcome import (
    MetricInfo,
    OutcomeAnalysisSummary,
    OutcomeAnalysisDetail,
    CreateAnalysisParams,
)
from src.services import outcome_service

router = APIRouter(
    prefix="/outcome",
    tags=["成果分析"],
    responses={404: {"description": "Not found"}},
)


@router.get("/metrics", response_model=List[MetricInfo])
def get_available_metrics(process_type: str, db: Session = Depends(get_db)):
    """指定プロセスタイプで利用可能なメトリック一覧を取得"""
    try:
        return outcome_service.get_available_metrics(db, process_type)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/analyses", response_model=List[OutcomeAnalysisSummary])
def get_outcome_analyses(
    process_type: Optional[str] = None,
    metric_name: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """成果分析結果の一覧を取得"""
    try:
        return outcome_service.get_outcome_analyses(db, process_type, metric_name)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/analyses/{analysis_id}", response_model=OutcomeAnalysisDetail)
def get_outcome_analysis_by_id(analysis_id: str, db: Session = Depends(get_db)):
    """特定の成果分析結果を取得"""
    try:
        result = outcome_service.get_outcome_analysis_by_id(db, analysis_id)
        if not result:
            raise HTTPException(status_code=404, detail="Analysis not found")
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/analyze")
def create_outcome_analysis(
    params: CreateAnalysisParams, db: Session = Depends(get_db)
):
    """成果分析を作成"""
    try:
        analysis_id = outcome_service.create_outcome_analysis(db, params)
        return {"analysis_id": analysis_id}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
