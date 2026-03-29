from app.db.mongo import contracts_collection, decisions_collection
from app.agents.logging_agent import log_event, get_logs
from bson import ObjectId
from datetime import datetime

AGENT_NAME = "execution_agent"


def execute(contract_id: str) -> dict:
    """
    Agent 6: Execution & Communication Agent
    Takes the final decision and generates a complete structured report.
    In production this would also send emails, create tasks, notify stakeholders.
    Here it simulates those actions and returns the full report.
    """
    log_event(contract_id, AGENT_NAME, "Generating execution report and simulating notifications")

    contract = contracts_collection.find_one({"_id": ObjectId(contract_id)})
    decision_doc = decisions_collection.find_one(
        {"contract_id": contract_id},
        sort=[("timestamp", -1)]
    )

    if not contract or not decision_doc:
        raise ValueError(f"Missing contract or decision for {contract_id}")

    decision = decision_doc.get("decision", "UNKNOWN")
    profit = contract.get("profit_result", {})
    risk = contract.get("risk_result", {})
    capacity = contract.get("capacity_result", {})

    # Simulate stakeholder actions
    actions_taken = []

    if decision == "ACCEPT":
        actions_taken = [
            "Email sent to Project Manager: Contract accepted, kickoff meeting scheduled",
            "HR notified: Recruit {} external workers".format(capacity.get("extra_workers_needed", 0)),
            "Finance notified: Budget approved — expected profit {}".format(profit.get("profit")),
            "Contract document generated and stored"
        ]
    elif decision == "REJECT":
        actions_taken = [
            "Email sent to client: Contract declined with explanation",
            "Management report generated",
            "Rejection reason logged for compliance audit"
        ]
    elif decision == "COUNTER":
        actions_taken = [
            f"Counter-offer prepared: recommended bid {decision_doc.get('recommended_bid')}",
            "Email sent to client with revised terms",
            "Legal team notified for counter-offer review"
        ]

    report = {
        "contract_id": contract_id,
        "contract_title": contract.get("title"),
        "final_decision": decision,
        "confidence": decision_doc.get("confidence"),
        "reasoning": decision_doc.get("reasoning"),
        "conditions": decision_doc.get("conditions"),
        "recommended_bid": decision_doc.get("recommended_bid"),
        "financial_summary": {
            "budget": profit.get("budget"),
            "total_cost": profit.get("total_cost"),
            "expected_profit": profit.get("profit"),
            "margin_pct": profit.get("margin_pct")
        },
        "risk_summary": {
            "level": risk.get("risk_level"),
            "score": risk.get("risk_score"),
            "flags": risk.get("risk_flags", [])
        },
        "workforce_summary": {
            "required": capacity.get("workers_required"),
            "available": capacity.get("workers_available"),
            "outsourced": capacity.get("extra_workers_needed")
        },
        "actions_taken": actions_taken,
        "processed_at": datetime.utcnow().isoformat()
    }

    contracts_collection.update_one(
        {"_id": ObjectId(contract_id)},
        {"$set": {"status": "processed", "report": report}}
    )

    for action in actions_taken:
        log_event(contract_id, AGENT_NAME, action)

    log_event(contract_id, AGENT_NAME, f"Pipeline complete — decision: {decision}")
    return report
