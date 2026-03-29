from app.utils.gemini import ask_gemini_json
from app.db.mongo import contracts_collection
from app.agents.logging_agent import log_event
from bson import ObjectId

AGENT_NAME = "contract_agent"


def analyze_contract(contract_id: str):
    """
    Agent 1: Contract Understanding Agent
    Reads the raw contract and uses Gemini to extract structured fields.
    Stores the parsed data back into the contract document.
    """
    log_event(contract_id, AGENT_NAME, "Starting contract analysis")

    contract = contracts_collection.find_one({"_id": ObjectId(contract_id)})
    if not contract:
        log_event(contract_id, AGENT_NAME, "Contract not found", level="ERROR")
        raise ValueError(f"Contract {contract_id} not found")

    prompt = f"""
You are a contract analysis agent. Extract structured data from the following contract.

Contract details:
- Title: {contract.get('title', '')}
- Description: {contract.get('description', '')}
- Workers required: {contract.get('workers_required')}
- Deadline days: {contract.get('deadline_days')}
- Budget: {contract.get('budget')}

Return a JSON object with exactly these keys:
{{
  "workers_required": <integer>,
  "deadline_days": <integer>,
  "budget": <float>,
  "complexity": "<LOW|MEDIUM|HIGH>",
  "contract_type": "<short description of what kind of work this is>"
}}
"""

    analysis = ask_gemini_json(prompt)

    contracts_collection.update_one(
        {"_id": ObjectId(contract_id)},
        {"$set": {
            "workers_required": analysis.get("workers_required", contract["workers_required"]),
            "deadline_days": analysis.get("deadline_days", contract["deadline_days"]),
            "budget": analysis.get("budget", contract["budget"]),
            "complexity": analysis.get("complexity", "MEDIUM"),
            "contract_type": analysis.get("contract_type", "General"),
            "analysis_done": True
        }}
    )

    log_event(contract_id, AGENT_NAME, f"Contract analyzed — complexity: {analysis.get('complexity')}, type: {analysis.get('contract_type')}")
    return analysis
