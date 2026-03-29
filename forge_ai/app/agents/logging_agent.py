from app.db.mongo import logs_collection
from datetime import datetime


def log_event(contract_id: str, agent: str, message: str, level: str = "INFO"):
    """
    Persist an audit log entry for a given contract and agent step.
    Every agent calls this — it's how we build a complete audit trail.
    """
    logs_collection.insert_one({
        "contract_id": contract_id,
        "agent": agent,
        "message": message,
        "level": level,
        "timestamp": datetime.utcnow()
    })


def get_logs(contract_id: str) -> list:
    """Retrieve the full audit trail for a contract, sorted by time."""
    logs = logs_collection.find(
        {"contract_id": contract_id},
        {"_id": 0}
    ).sort("timestamp", 1)
    return list(logs)
