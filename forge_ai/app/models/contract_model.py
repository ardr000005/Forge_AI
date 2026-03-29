from pydantic import BaseModel, Field
from typing import Optional


class ContractInput(BaseModel):
    title: str
    description: str
    workers_required: int
    deadline_days: int
    budget: float

    model_config = {"json_schema_extra": {
        "example": {
            "title": "Website Redesign",
            "description": "Redesign company website with new branding",
            "workers_required": 8,
            "deadline_days": 30,
            "budget": 50000.0
        }
    }}


class ContractResponse(BaseModel):
    contract_id: str
    message: str


class PipelineResponse(BaseModel):
    contract_id: str
    decision: Optional[str] = None
    profit: Optional[float] = None
    risk: Optional[str] = None
    extra_workers: Optional[int] = None
    status: str
