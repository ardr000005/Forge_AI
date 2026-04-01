from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes.contract_routes import router

app = FastAPI(
    title="Forge AI — Contract Intelligence System",
    description="""
A multi-agent AI system that autonomously evaluates contracts,
analyzes workforce capacity, calculates profit, assesses risk,
and makes data-driven decisions — with a full audit trail.

## How to use

2. **Submit a contract** — `POST /api/contract`
3. **Run the pipeline** — `POST /api/run/{contract_id}`
4. **View the report** — `GET /api/report/{contract_id}`
5. **Inspect the audit trail** — `GET /api/audit/{contract_id}`
    """,
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)


@app.get("/", tags=["health"])
def root():
    return {
        "system": "Forge AI — Contract Intelligence System",
        "status": "running",
        "agents": [
            "orchestrator",
            "contract_agent",
            "capacity_agent",
            "profit_agent",
            "risk_agent",
            "decision_agent",
            "execution_agent",
            "logging_agent"
        ],
        "docs": "/docs"
    }
