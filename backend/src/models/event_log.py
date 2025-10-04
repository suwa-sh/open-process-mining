from datetime import datetime
from pydantic import BaseModel


class EventLog(BaseModel):
    """Event log entry for process mining"""
    case_id: str
    activity: str
    timestamp: datetime
    resource: str

    class Config:
        from_attributes = True
