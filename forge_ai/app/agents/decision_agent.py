from app.db.mongo import contracts_collection, decisions_collection
from app.utils.gemini import ask_gemini_json
from app.agents.logging_agent import log_event
from bson import ObjectId
from datetime import datetime

AGENT_NAME = "decision_agent"


def make_decision(contract_id: str):
    """
    Agent 5: Decision-Making Agent
    Synthesizes all previous agent outputs and uses Gemini to reason through
    a final ACCEPT / REJECT / COUNTER decision with full explanation.
    This is the most important agent — it mimics how a real manager thinks.
    """
    log_event(contract_id, AGENT_NAME, "Starting final decision synthesis")

    contract = contracts_collection.find_one({"_id": ObjectId(contract_id)})
    if not contract:
        raise ValueError(f"Contract {contract_id} not found")

    # Build a clean summary for the AI to reason over
    capacity_result = contract.get("capacity_result", {})
    profit_result = contract.get("profit_result", {})
    risk_result = contract.get("risk_result", {})

    prompt = f"""
You are an enterprise decision-making agent for a company that evaluates contracts.
Based on the full analysis below, make a final decision.

=== CONTRACT ===
Title: {contract.get('title')}
Type: {contract.get('contract_type')}
Description: {contract.get('description')}
Complexity: {contract.get('complexity')}

=== CAPACITY ANALYSIS ===
Workers required: {capacity_result.get('workers_required')}
Workers available: {capacity_result.get('workers_available')}
Extra workers needed (outsourced): {capacity_result.get('extra_workers_needed')}
Can take project: {capacity_result.get('can_take_project')}

=== FINANCIAL ANALYSIS ===
Budget: {profit_result.get('budget')}
Total cost: {profit_result.get('total_cost')}
Expected profit: {profit_result.get('profit')}
Profit margin: {profit_result.get('margin_pct')}%
Is profitable: {profit_result.get('is_profitable')}

=== RISK ANALYSIS ===
Risk level: {risk_result.get('risk_level')}
Risk score: {risk_result.get('risk_score')}/100
Risk flags: {', '.join(risk_result.get('risk_flags', []))}
Delay probability: {risk_result.get('delay_probability')}

=== DECISION RULES ===
- ACCEPT if: profitable, LOW or MEDIUM risk, sufficient capacity
- REJECT if: unprofitable OR HIGH risk with no mitigation possible
- COUNTER if: profitable but needs renegotiation (timeline, budget, or team size)

Respond with a JSON object:
{{
  "decision": "<ACCEPT|REJECT|COUNTER>",
  "confidence": <0-100>,
  "reasoning": "<2-3 sentence explanation of why>",
  "recommended_bid": <null or float — only if COUNTER>,
  "conditions": "<any conditions for acceptance, or null>"
}}
"""

    result = ask_gemini_json(prompt)

    decision_doc = {
        "contract_id": contract_id,
        "decision": result.get("decision", "REJECT"),
        "confidence": result.get("confidence", 0),
        "reasoning": result.get("reasoning", ""),
        "recommended_bid": result.get("recommended_bid"),
        "conditions": result.get("conditions"),
        "profit": profit_result.get("profit"),
        "risk": risk_result.get("risk_level"),
        "timestamp": datetime.utcnow()
    }

    decisions_collection.insert_one(decision_doc)

    contracts_collection.update_one(
        {"_id": ObjectId(contract_id)},
        {"$set": {"final_decision": result.get("decision"), "decision_done": True}}
    )

    log_event(
        contract_id, AGENT_NAME,
        f"Decision: {result.get('decision')} (confidence: {result.get('confidence')}%) — {result.get('reasoning', '')[:80]}"
    )
    return result
