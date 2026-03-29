from fastapi import APIRouter, HTTPException
from app.agents.orchestrator import run_pipeline
from app.agents.logging_agent import get_logs
from app.db.mongo import contracts_collection, decisions_collection, company_collection
from app.models.contract_model import ContractInput
from bson import ObjectId
from datetime import datetime

router = APIRouter(prefix="/api", tags=["contracts"])


def serialize(doc: dict) -> dict:
    """Convert MongoDB ObjectId to string for JSON serialization."""
    if doc and "_id" in doc:
        doc["_id"] = str(doc["_id"])
    return doc


# ─── Company Setup ────────────────────────────────────────────────────────────

@router.post("/company/seed", summary="Seed company data")
def seed_company(data: dict):
    """
    Add or replace your company's capacity data.
    Call this once before running any contracts.
    Example body:
    {
      "available_workers": 15,
      "cost_per_worker": 3000,
      "max_concurrent_projects": 5,
      "active_projects": 1
    }
    """
    company_collection.delete_many({})
    company_collection.insert_one(data)
    return {"message": "Company data seeded", "data": data}


@router.get("/company", summary="Get company profile")
def get_company():
    company = company_collection.find_one({}, {"_id": 0})
    if not company:
        raise HTTPException(status_code=404, detail="No company data found. POST to /api/company/seed first.")
    return company


# ─── Contracts ────────────────────────────────────────────────────────────────

@router.post("/contract", summary="Submit a new contract")
def create_contract(contract: ContractInput):
    """
    Submit a new contract. Returns the contract_id you use to run the pipeline.
    """
    doc = contract.model_dump()
    doc["status"] = "pending"
    doc["created_at"] = datetime.utcnow()

    result = contracts_collection.insert_one(doc)
    contract_id = str(result.inserted_id)

    return {
        "contract_id": contract_id,
        "message": "Contract submitted. POST to /api/run/{contract_id} to process it."
    }


@router.get("/contract/{contract_id}", summary="Get contract details")
def get_contract(contract_id: str):
    try:
        doc = contracts_collection.find_one({"_id": ObjectId(contract_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid contract ID format")

    if not doc:
        raise HTTPException(status_code=404, detail="Contract not found")

    return serialize(doc)


@router.get("/contracts", summary="List all contracts")
def list_contracts():
    docs = contracts_collection.find({}, {"title": 1, "status": 1, "final_decision": 1, "created_at": 1})
    return [serialize(d) for d in docs]


# ─── Pipeline ─────────────────────────────────────────────────────────────────

@router.post("/run/{contract_id}", summary="Run the full agent pipeline")
def process_contract(contract_id: str):
    """
    Triggers the orchestrator which runs all 7 agents in sequence:
    Contract Understanding → Capacity → Profit → Risk → Decision → Execution
    Returns the full report + audit trail.
    """
    try:
        ObjectId(contract_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid contract ID format")

    contract = contracts_collection.find_one({"_id": ObjectId(contract_id)})
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")

    if contract.get("status") == "processed":
        raise HTTPException(status_code=409, detail="Contract already processed. GET /api/report/{contract_id} to see results.")

    try:
        report = run_pipeline(contract_id)
        return report
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))


# ─── Results ──────────────────────────────────────────────────────────────────

@router.get("/report/{contract_id}", summary="Get full pipeline report")
def get_report(contract_id: str):
    try:
        doc = contracts_collection.find_one({"_id": ObjectId(contract_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid contract ID format")

    if not doc:
        raise HTTPException(status_code=404, detail="Contract not found")

    if doc.get("status") != "processed":
        raise HTTPException(status_code=400, detail=f"Contract not yet processed. Status: {doc.get('status')}")

    return serialize(doc).get("report", {})


@router.get("/decision/{contract_id}", summary="Get decision details")
def get_decision(contract_id: str):
    decision = decisions_collection.find_one(
        {"contract_id": contract_id},
        sort=[("timestamp", -1)]
    )
    if not decision:
        raise HTTPException(status_code=404, detail="No decision found for this contract")
    return serialize(decision)


@router.get("/audit/{contract_id}", summary="Get full audit trail")
def get_audit_trail(contract_id: str):
    """Returns every log entry from every agent — the complete audit trail."""
    logs = get_logs(contract_id)
    if not logs:
        raise HTTPException(status_code=404, detail="No audit logs found for this contract")
    return {"contract_id": contract_id, "total_events": len(logs), "trail": logs}


@router.get("/decisions", summary="List all decisions made")
def list_decisions():
    docs = decisions_collection.find({}, {"contract_id": 1, "decision": 1, "confidence": 1, "timestamp": 1})
    return [serialize(d) for d in docs]
