from datetime import datetime
from typing import Dict, Any
from uuid import UUID
from pydantic import BaseModel
from sqlalchemy import Column, String, DateTime, JSON
from sqlalchemy.dialects.postgresql import UUID as PGUUID
import uuid

from src.db.connection import Base


class AnalysisResultORM(Base):
    """SQLAlchemy ORM model for analysis_results table"""

    __tablename__ = "analysis_results"

    analysis_id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    analysis_name = Column(String(255), nullable=False)
    process_type = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    result_data = Column(JSON, nullable=False)


class AnalysisResultCreate(BaseModel):
    """Pydantic model for creating analysis result"""

    analysis_name: str
    result_data: Dict[str, Any]


class AnalysisResultResponse(BaseModel):
    """Pydantic model for analysis result response"""

    analysis_id: UUID
    analysis_name: str
    process_type: str | None
    created_at: datetime
    result_data: Dict[str, Any]

    class Config:
        from_attributes = True


class AnalysisListItem(BaseModel):
    """Pydantic model for analysis list item"""

    analysis_id: UUID
    analysis_name: str
    process_type: str | None
    created_at: datetime

    class Config:
        from_attributes = True
