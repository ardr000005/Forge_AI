from app.db.mongo import contracts_collection, company_collection
from app.agents.logging_agent import log_event
from bson import ObjectId

AGENT_NAME = "capacity_agent"


def check_capacity(contract_id: str):
    """
    Agent 2: Company Capacity Intelligence Agent
    Compares contract workforce requirements against current company availability.
    Calculates how many external/outsourced workers are needed.
    """
    log_event(contract_id, AGENT_NAME, "Checking company capacity")

    contract = contracts_collection.find_one({"_id": ObjectId(contract_id)})
    if not contract:
        raise ValueError(f"Contract {contract_id} not found")

    company = company_collection.find_one({})
    if not company:
        # Use safe defaults if no company data seeded yet
        company = {
            "available_workers": 10,
            "cost_per_worker": 3000,
            "max_concurrent_projects": 5,
            "active_projects": 0
        }
        log_event(contract_id, AGENT_NAME, "No company data found — using defaults", level="WARN")

    required = contract.get("workers_required", 0)
    available = company.get("available_workers", 0)
    active_projects = company.get("active_projects", 0)
    max_projects = company.get("max_concurrent_projects", 5)

    extra_workers = max(0, required - available)
    can_take_project = active_projects < max_projects

    capacity_result = {
        "workers_required": required,
        "workers_available": available,
        "extra_workers_needed": extra_workers,
        "can_take_project": can_take_project,
        "capacity_utilization_pct": round((required / max(available, 1)) * 100, 1)
    }

    contracts_collection.update_one(
        {"_id": ObjectId(contract_id)},
        {"$set": {
            "extra_workers": extra_workers,
            "can_take_project": can_take_project,
            "capacity_result": capacity_result,
            "cost_per_worker": company.get("cost_per_worker", 3000)
        }}
    )

    log_event(
        contract_id, AGENT_NAME,
        f"Capacity check done — available: {available}, required: {required}, extra needed: {extra_workers}"
    )
    return capacity_result
