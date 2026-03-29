from app.db.mongo import contracts_collection
from app.agents.logging_agent import log_event
from bson import ObjectId

AGENT_NAME = "profit_agent"

OUTSOURCING_MARKUP = 1.3   # outsourced workers cost 30% more than internal
OVERHEAD_RATE = 0.15       # 15% overhead on total cost
MIN_MARGIN_PCT = 0.10      # we want at least 10% profit margin


def calculate_profit(contract_id: str):
    """
    Agent 3: Cost Optimization & Profit Agent
    Calculates total cost, profit, and margin.
    Flags contracts that fall below minimum acceptable margin.
    """
    log_event(contract_id, AGENT_NAME, "Calculating cost and profit")

    contract = contracts_collection.find_one({"_id": ObjectId(contract_id)})
    if not contract:
        raise ValueError(f"Contract {contract_id} not found")

    budget = contract.get("budget", 0)
    extra_workers = contract.get("extra_workers", 0)
    cost_per_worker = contract.get("cost_per_worker", 3000)
    deadline_days = contract.get("deadline_days", 30)
    workers_required = contract.get("workers_required", 0)

    # Cost breakdown
    internal_workers = workers_required - extra_workers
    internal_cost = internal_workers * cost_per_worker * (deadline_days / 30)
    outsourcing_cost = extra_workers * cost_per_worker * OUTSOURCING_MARKUP * (deadline_days / 30)
    base_cost = internal_cost + outsourcing_cost
    overhead = base_cost * OVERHEAD_RATE
    total_cost = base_cost + overhead

    profit = budget - total_cost
    margin_pct = (profit / budget * 100) if budget > 0 else 0
    profitable = profit > 0 and margin_pct >= (MIN_MARGIN_PCT * 100)

    profit_result = {
        "budget": budget,
        "internal_cost": round(internal_cost, 2),
        "outsourcing_cost": round(outsourcing_cost, 2),
        "overhead": round(overhead, 2),
        "total_cost": round(total_cost, 2),
        "profit": round(profit, 2),
        "margin_pct": round(margin_pct, 2),
        "is_profitable": profitable
    }

    contracts_collection.update_one(
        {"_id": ObjectId(contract_id)},
        {"$set": {
            "profit": round(profit, 2),
            "margin_pct": round(margin_pct, 2),
            "is_profitable": profitable,
            "profit_result": profit_result
        }}
    )

    log_event(
        contract_id, AGENT_NAME,
        f"Profit: ₹{profit:.2f} | Margin: {margin_pct:.1f}% | Profitable: {profitable}"
    )
    return profit_result
