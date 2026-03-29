# Forge AI — Contract Intelligence System

A production-style **multi-agent AI backend** that autonomously evaluates contracts,
analyzes workforce capacity, calculates profit, assesses risk, and makes decisions —
with a complete audit trail stored in MongoDB.

---

## Agent Architecture

```
Incoming Contract
       │
  Orchestrator  ←──────────────────────────────────┐
       │                                            │
  Contract Agent (extract structure)                │
       │                                            │
  Capacity Agent (check workforce)                  │
       │                                            │
  Profit Agent (calculate margins)                  │
       │                                            │
  Risk Agent (assess feasibility)                   │
       │                                            │
  Decision Agent (ACCEPT / REJECT / COUNTER)        │
       │                                            │
  Execution Agent (report + notifications)          │
       │                                            │
  Logging Agent (audit every step) ─────────────────┘
```

---

## Tech Stack

| Layer      | Tool                        |
|------------|-----------------------------|
| API        | FastAPI + Uvicorn           |
| Database   | MongoDB (PyMongo)           |
| AI         | Gemini 1.5 Flash            |
| Config     | python-dotenv               |

---

## Setup

### 1. Clone and install

```bash
git clone <your-repo>
cd forge_ai
pip install -r requirements.txt
```

### 2. Configure environment

Edit `.env`:

```
MONGO_URI=mongodb://localhost:27017/
DB_NAME=forge_ai
GEMINI_API_KEY=your_actual_gemini_api_key_here
```

Get your Gemini API key free at: https://aistudio.google.com/app/apikey

### 3. Start MongoDB

Make sure MongoDB is running locally:

```bash
# macOS (Homebrew)
brew services start mongodb-community

# Linux
sudo systemctl start mongod

# Windows
net start MongoDB
```

### 4. Seed company data

```bash
python seed_company.py
```

This inserts your company's worker count, costs, and capacity into MongoDB.
Edit `seed_company.py` to match your actual company profile.

### 5. Run the server

```bash
uvicorn app.main:app --reload
```

Server runs at: **http://localhost:8000**
Swagger docs at: **http://localhost:8000/docs**

---

## API Usage

### Step 1 — Check company data
```http
GET /api/company
```

### Step 2 — Submit a contract
```http
POST /api/contract
Content-Type: application/json

{
  "title": "E-commerce Platform Build",
  "description": "Build a full-stack e-commerce platform with payment integration",
  "workers_required": 10,
  "deadline_days": 45,
  "budget": 120000
}
```
Returns: `{ "contract_id": "abc123...", "message": "..." }`

### Step 3 — Run the full pipeline
```http
POST /api/run/{contract_id}
```
This triggers all 7 agents in sequence. Takes ~5-10 seconds.
Returns the full decision report.

### Step 4 — View the report
```http
GET /api/report/{contract_id}
```

### Step 5 — Inspect the audit trail
```http
GET /api/audit/{contract_id}
```
Returns every log entry from every agent with timestamps.

### Other endpoints
```http
GET  /api/contracts          # list all contracts
GET  /api/decisions          # list all decisions
GET  /api/decision/{id}      # get one decision
GET  /api/contract/{id}      # get raw contract document
POST /api/company/seed       # update company data
```

---

## Sample Response

```json
{
  "contract_id": "...",
  "contract_title": "E-commerce Platform Build",
  "final_decision": "ACCEPT",
  "confidence": 82,
  "reasoning": "The contract is profitable with a 23% margin and presents LOW risk given the 45-day timeline and manageable outsourcing requirement.",
  "financial_summary": {
    "budget": 120000,
    "total_cost": 92400,
    "expected_profit": 27600,
    "margin_pct": 23.0
  },
  "risk_summary": {
    "level": "LOW",
    "score": 15,
    "flags": []
  },
  "workforce_summary": {
    "required": 10,
    "available": 12,
    "outsourced": 0
  },
  "actions_taken": [
    "Email sent to Project Manager: Contract accepted",
    "Finance notified: Budget approved",
    "Contract document generated"
  ],
  "audit_trail": [
    { "agent": "orchestrator", "message": "Pipeline started", "timestamp": "..." },
    { "agent": "contract_agent", "message": "Contract analyzed — complexity: MEDIUM", "timestamp": "..." },
    ...
  ]
}
```

---

## Project Structure

```
forge_ai/
├── app/
│   ├── main.py                  # FastAPI entry point
│   ├── config.py                # Environment config
│   ├── db/
│   │   └── mongo.py             # MongoDB connection + collections
│   ├── models/
│   │   ├── contract_model.py    # Pydantic input/output models
│   │   ├── decision_model.py
│   │   └── log_model.py
│   ├── agents/
│   │   ├── orchestrator.py      # Central control — runs all agents
│   │   ├── contract_agent.py    # Extracts structured data from contract
│   │   ├── capacity_agent.py    # Checks workforce availability
│   │   ├── profit_agent.py      # Calculates cost, profit, margin
│   │   ├── risk_agent.py        # Assesses execution risk
│   │   ├── decision_agent.py    # Makes final ACCEPT/REJECT/COUNTER call
│   │   ├── execution_agent.py   # Generates report + simulates actions
│   │   └── logging_agent.py     # Audit trail for every step
│   ├── routes/
│   │   └── contract_routes.py   # All API endpoints
│   └── utils/
│       └── gemini.py            # Gemini API wrapper with JSON parsing
├── seed_company.py              # One-time company data seeder
├── requirements.txt
├── .env
└── README.md
```

---

## Extending the System

- **Swap Gemini for Claude**: Replace `app/utils/gemini.py` with Anthropic SDK calls
- **Add email**: Replace simulated actions in `execution_agent.py` with `smtplib` or SendGrid
- **Add a frontend**: The API is CORS-enabled — connect any React/Streamlit UI
- **Add monitoring agent**: Poll `/api/contracts` for status changes and re-trigger on new data
