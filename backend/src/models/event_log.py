from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class EventLog(BaseModel):
    """Event log entry for process mining with organizational information"""
    case_id: str
    activity: str
    timestamp: datetime
    resource: str
    employee_id: Optional[str] = None
    employee_name: Optional[str] = None
    role: Optional[str] = None
    department_id: Optional[str] = None
    department_name: Optional[str] = None
    department_type: Optional[str] = None
    parent_department_id: Optional[str] = None

    class Config:
        from_attributes = True
