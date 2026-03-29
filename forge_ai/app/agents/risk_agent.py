from app.db.mongo import contracts_collection
from app.agents.logging_agent import log_event
from bson import ObjectId

AGENT_NAME = "risk_agent"


def assess_risk(contract_id: str):
    """
    Agent 4: Risk & Execution Feasibility Agent
    Evaluates multiple risk dimensions and produces an overall risk score + label.
    Even profitable contracts can be flagged HIGH risk and rejected.
    """
    log_event(contract_id, AGENT_NAME, "Assessing execution risk")

    contract = contracts_collection.find_one({"_id": ObjectId(contract_id)})
    if not contract:
        raise ValueError(f"Contract {contract_id} not found")

    deadline_days = contract.get("deadline_days", 30)
    extra_workers = contract.get("extra_workers", 0)
    workers_required = contract.get("workers_required", 1)
    margin_pct = contract.get("margin_pct", 0)
    complexity = contract.get("complexity", "MEDIUM")
    can_take_project = contract.get("can_take_project", True)

    risk_flags = []
    risk_score = 0  # 0-100

    # Deadline risk
    if deadline_days < 7:
        risk_score += 40
        risk_flags.append("Very tight deadline (< 7 days)")
    elif deadline_days < 14:
        risk_score += 20
        risk_flags.append("Tight deadline (< 14 days)")

    # Outsourcing dependency risk
    outsource_ratio = extra_workers / max(workers_required, 1)
    if outsource_ratio > 0.6:
        risk_score += 30
        risk_flags.append(f"High outsourcing dependency ({outsource_ratio*100:.0f}% of workforce)")
    elif outsource_ratio > 0.3:
        risk_score += 15
        risk_flags.append(f"Moderate outsourcing dependency ({outsource_ratio*100:.0f}%)")

    # Margin risk
    if margin_pct < 5:
        risk_score += 20
        risk_flags.append(f"Very low profit margin ({margin_pct:.1f}%)")
    elif margin_pct < 10:
        risk_score += 10
        risk_flags.append(f"Low profit margin ({margin_pct:.1f}%)")

    # Complexity risk
    if complexity == "HIGH":
        risk_score += 15
        risk_flags.append("High complexity project")

    # Capacity risk
    if not can_take_project:
        risk_score += 20
        risk_flags.append("Company at maximum project capacity")

    # Determine risk label
    if risk_score >= 60:
        risk_level = "HIGH"
    elif risk_score >= 30:
        risk_level = "MEDIUM"
    else:
        risk_level = "LOW"

    risk_result = {
        "risk_level": risk_level,
        "risk_score": risk_score,
        "risk_flags": risk_flags,
        "delay_probability": f"{min(risk_score, 95)}%",
        "recommendation": "Proceed with caution" if risk_level == "MEDIUM" else (
            "High risk — consider rejecting" if risk_level == "HIGH" else "Safe to proceed"
        )
    }

    contracts_collection.update_one(
        {"_id": ObjectId(contract_id)},
        {"$set": {
            "risk": risk_level,
            "risk_score": risk_score,
            "risk_result": risk_result
        }}
    )

    log_event(
        contract_id, AGENT_NAME,
        f"Risk level: {risk_level} (score: {risk_score}) — flags: {len(risk_flags)}"
    )
    return risk_result
