from pydantic import BaseModel
from typing import Optional


class DecisionRecord(BaseModel):
    contract_id: str
    decision: str
    reasoning: Optional[str] = None
    profit: Optional[float] = None
    risk: Optional[str] = None
