"""Outcome analysis data models"""
from datetime import datetime
from typing import Optional, Dict, Any, List
from pydantic import BaseModel
from sqlalchemy import Column, String, DateTime, Text, text
from sqlalchemy.dialects.postgresql import UUID, JSONB
from src.db.connection import Base


class OutcomeAnalysisResult(Base):
    """SQLAlchemy model for outcome_analysis_results table"""
    __tablename__ = "outcome_analysis_results"

    analysis_id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    analysis_name = Column(String(255), nullable=False)
    process_type = Column(String(100), nullable=False)
    metric_name = Column(String(100), nullable=False)
    analysis_type = Column(String(50), nullable=False)
    filter_config = Column(JSONB, nullable=True)
    result_data = Column(JSONB, nullable=False)
    created_at = Column(DateTime, server_default=text("CURRENT_TIMESTAMP"))


class MetricInfo(BaseModel):
    """メトリック情報"""
    metric_name: str
    metric_unit: str
    sample_count: int


class OutcomeAnalysisSummary(BaseModel):
    """成果分析サマリー"""
    analysis_id: str
    analysis_name: str
    process_type: str
    metric_name: str
    analysis_type: str
    created_at: datetime

    class Config:
        from_attributes = True


class OutcomeAnalysisDetail(BaseModel):
    """成果分析詳細"""
    analysis_id: str
    analysis_name: str
    process_type: str
    metric_name: str
    analysis_type: str
    filter_config: Optional[Dict[str, Any]] = None
    result_data: Dict[str, Any]
    created_at: datetime

    class Config:
        from_attributes = True


class CreateAnalysisParams(BaseModel):
    """成果分析作成パラメータ"""
    analysis_name: str
    process_type: str
    metric_name: str
    analysis_type: str = "path-outcome"
    filter_config: Optional[Dict[str, Any]] = None
    date_from: Optional[str] = None
    date_to: Optional[str] = None


class OutcomeStats(BaseModel):
    """成果統計"""
    avg: float
    median: float
    total: float
    min: float
    max: float
    count: int


class OutcomeEdgeData(BaseModel):
    """成果分析用エッジデータ"""
    frequency: int
    avg_waiting_time_hours: float
    outcome_stats: Optional[Dict[str, OutcomeStats]] = None
