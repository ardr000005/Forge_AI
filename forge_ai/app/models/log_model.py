from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class LogEntry(BaseModel):
    contract_id: str
    agent: str
    message: str
    timestamp: datetime = datetime.utcnow()
    level: Optional[str] = "INFO"
