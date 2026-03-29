#  FORGE AI — Autonomous Contract Intelligence System

> **7 Agents. 1 Decision. Zero Human Bottlenecks.**

FORGE AI is a **full-stack AI-powered contract intelligence system** that autonomously evaluates business contracts using a **multi-agent architecture**.

It analyzes:

* Workforce capacity
* Profitability
* Execution risk

…and generates:

 **ACCEPT / REJECT / COUNTER decisions** with reasoning and full audit logs.

---

## Problem

In real-world companies:

*  Contract evaluation takes days
*  Decisions are inconsistent
*  No transparency or audit trail
*  Leads to poor financial outcomes

---

##  Solution

FORGE AI replaces manual workflows with an **AI-driven decision engine**:

* Understands contracts automatically
* Evaluates internal company capacity
* Calculates cost & profit
* Assesses execution risk
* Makes optimized decisions
* Stores complete audit trail

---

##  Key Features

*  Multi-agent AI pipeline
*  Contract understanding (AI extraction)
*  Capacity analysis
*  Profit calculation
*  Risk scoring system
*  Decision engine
*  Full audit logs (MongoDB)
*  React dashboard
*  Modular architecture

---

##  Agent Architecture

```
Incoming Contract
       │
  Orchestrator
       │
  ├── Contract Agent     → Extract structured data
  ├── Capacity Agent     → Workforce analysis
  ├── Profit Agent       → Cost & margin calculation
  ├── Risk Agent         → Risk scoring
  ├── Decision Agent     → Final decision
  ├── Execution Agent    → Report generation
  └── Logging Agent      → Audit trail
```

---

##  Tech Stack

| Layer     | Technology        |
| --------- | ----------------- |
| Backend   | FastAPI + Uvicorn |
| Frontend  | React             |
| Database  | MongoDB           |
| AI Engine | OpenAI API        |
| Config    | python-dotenv     |

---

## 📁 Project Structure

```
.
├── forge_ai/            
│   ├── app/
│   ├── requirements.txt
│
├── forge_frontend/      
│   ├── src/
│   ├── public/
│   ├── package.json
│
├── .gitignore
├── LICENSE
└── README.md
```

---

## Setup Instructions

### Clone Repository

```bash
git clone https://github.com/ardr000005/Forge_AI.git
cd Forge_AI
```

---

## 🔧 Backend Setup

```bash
cd forge_ai
pip install -r requirements.txt
```

Create `.env` file inside `forge_ai/`:

```
MONGO_URI=
DB_NAME=forge_ai

OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-4o-mini
```

---

### ▶️ Run Backend

```bash
uvicorn app.main:app --reload
```

 Backend: [http://localhost:8000](http://localhost:8000)
 API Docs: [http://localhost:8000/docs](http://localhost:8000/docs)

---

##  Frontend Setup

```bash
cd forge_frontend
npm install
npm start
```

 Frontend: [http://localhost:3000](http://localhost:3000)

---

##  Workflow

1. Submit contract via UI
2. Orchestrator triggers AI agents
3. Each agent analyzes different aspects:

   * Capacity
   * Profit
   * Risk
4. Decision is generated
5. Audit trail stored
6. Results shown in dashboard

---

##  API Endpoints

```
POST /api/contract        → Submit contract
POST /api/run/{id}        → Run AI pipeline
GET  /api/report/{id}     → Get final decision
GET  /api/audit/{id}      → Get audit logs
GET  /api/contracts       → List contracts
```

---

##  Sample Output

```json
{
  "decision": "ACCEPT",
  "confidence": 87,
  "profit": 27600,
  "margin": 23,
  "risk": "LOW",
  "reasoning": "High profit and low risk with sufficient workforce."
}
```

---

##  Highlights

*  Decision in < 60 seconds
*  AI-driven reasoning
*  Fully explainable decisions
*  Complete audit logs
*  Business intelligence dashboard

---

##  Future Improvements

*  PDF contract parsing
*  Email / Slack integration
*  Advanced analytics
*  SaaS deployment
*  Authentication system

---

