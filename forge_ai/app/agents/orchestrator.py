from app.agents.contract_agent import analyze_contract
from app.agents.capacity_agent import check_capacity
from app.agents.profit_agent import calculate_profit
from app.agents.risk_agent import assess_risk
from app.agents.decision_agent import make_decision
from app.agents.execution_agent import execute
from app.agents.logging_agent import log_event, get_logs
from app.db.mongo import contracts_collection
from bson import ObjectId

AGENT_NAME = "orchestrator"


def run_pipeline(contract_id: str) -> dict:
    """
    Orchestrator: Central Control System
    Manages the full lifecycle of a contract through all 6 specialist agents.
    Handles errors at each stage so a failure in one agent doesn't silently
    corrupt downstream results.
    """
    log_event(contract_id, AGENT_NAME, "Pipeline started")

    steps = [
        ("Contract Understanding", analyze_contract),
        ("Capacity Analysis",      check_capacity),
        ("Profit Calculation",     calculate_profit),
        ("Risk Assessment",        assess_risk),
        ("Decision Making",        make_decision),
        ("Execution & Report",     execute),
    ]

    results = {}

    for step_name, agent_fn in steps:
        log_event(contract_id, AGENT_NAME, f"Activating agent: {step_name}")
        try:
            result = agent_fn(contract_id)
            results[step_name] = {"status": "success", "output": result}
            log_event(contract_id, AGENT_NAME, f"Agent completed: {step_name}")
        except Exception as e:
            error_msg = f"Agent FAILED [{step_name}]: {str(e)}"
            log_event(contract_id, AGENT_NAME, error_msg, level="ERROR")
            contracts_collection.update_one(
                {"_id": ObjectId(contract_id)},
                {"$set": {"status": "error", "error": error_msg}}
            )
            raise RuntimeError(error_msg)

    # Attach full audit trail to the final response
    audit_trail = get_logs(contract_id)

    final_report = results.get("Execution & Report", {}).get("output", {})
    final_report["audit_trail"] = audit_trail
    final_report["pipeline_steps_completed"] = len(steps)

    log_event(contract_id, AGENT_NAME, "Pipeline completed successfully")
    return final_report
