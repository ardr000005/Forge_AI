import { useState } from "react";
import { submitContract, runPipeline } from "../utils/api";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import "../components/StatCard.css";

const STEPS = [
  { key: "contract", label: "Contract Understanding", icon: "◉" },
  { key: "capacity", label: "Capacity Analysis", icon: "◈" },
  { key: "profit",   label: "Profit Calculation", icon: "◆" },
  { key: "risk",     label: "Risk Assessment", icon: "⚠" },
  { key: "decision", label: "Decision Making", icon: "◎" },
  { key: "execution",label: "Execution & Report", icon: "✓" },
];

export default function Submit() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: "", description: "", workers_required: "", deadline_days: "", budget: ""
  });
  const [phase, setPhase] = useState("idle"); // idle | submitting | running | done
  const [contractId, setContractId] = useState(null);
  const [activeStep, setActiveStep] = useState(-1);
  const [report, setReport] = useState(null);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function handleSubmit(e) {
    e.preventDefault();
    setPhase("submitting");
    try {
      const payload = {
        ...form,
        workers_required: parseInt(form.workers_required),
        deadline_days: parseInt(form.deadline_days),
        budget: parseFloat(form.budget),
      };
      const res = await submitContract(payload);
      const id = res.data.contract_id;
      setContractId(id);
      toast.success("Contract submitted!");
      setPhase("running");
      await runAgents(id);
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Submission failed");
      setPhase("idle");
    }
  }

  async function runAgents(id) {
    for (let i = 0; i < STEPS.length; i++) {
      setActiveStep(i);
      await new Promise((r) => setTimeout(r, 900 + Math.random() * 600));
    }
    try {
      const res = await runPipeline(id);
      setReport(res.data);
      setPhase("done");
      toast.success("Pipeline complete!");
    } catch (err) {
      toast.error("Pipeline error: " + (err?.response?.data?.detail || err.message));
      setPhase("idle");
    }
  }

  const decision = report?.final_decision;
  const decisionStyle = {
    ACCEPT: { color: "var(--green)", bg: "var(--green-dim)", border: "#1a5c32" },
    REJECT: { color: "var(--red)", bg: "var(--red-dim)", border: "#5c1a1a" },
    COUNTER: { color: "var(--amber)", bg: "var(--amber-dim)", border: "#5c3a10" },
  }[decision] || {};

  return (
    <div className="page fade-up">
      <div className="page-title">New Contract</div>
      <div className="page-sub">Submit a contract and watch all 7 agents process it in real time</div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 24, alignItems: "start" }}>
        {/* Form */}
        <div className="card">
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div>
              <label>Contract Title</label>
              <input className="input" placeholder="e.g. E-commerce Platform Build" value={form.title} onChange={set("title")} required />
            </div>
            <div>
              <label>Description</label>
              <textarea className="input" placeholder="Describe the project scope and requirements..." value={form.description} onChange={set("description")} required rows={3} />
            </div>
            <div className="grid-3">
              <div>
                <label>Workers Required</label>
                <input className="input" type="number" min="1" placeholder="10" value={form.workers_required} onChange={set("workers_required")} required />
              </div>
              <div>
                <label>Deadline (days)</label>
                <input className="input" type="number" min="1" placeholder="30" value={form.deadline_days} onChange={set("deadline_days")} required />
              </div>
              <div>
                <label>Budget (₹)</label>
                <input className="input" type="number" min="1" placeholder="100000" value={form.budget} onChange={set("budget")} required />
              </div>
            </div>

            <button
              className="btn btn-primary"
              type="submit"
              disabled={phase !== "idle"}
              style={{ marginTop: 4, padding: "12px 24px", fontSize: 15 }}
            >
              {phase === "submitting" ? <><div className="spinner" /> Submitting...</> :
               phase === "running"    ? <><div className="spinner" /> Agents Running...</> :
               phase === "done"       ? "✓ Complete" :
               "Launch Pipeline"}
            </button>
          </form>
        </div>

        {/* Agent progress */}
        <div className="card" style={{ position: "sticky", top: 32 }}>
          <div className="section-title" style={{ marginBottom: 16 }}>Agent Pipeline</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {STEPS.map((step, i) => {
              const done = activeStep > i || phase === "done";
              const active = activeStep === i && phase === "running";
              return (
                <div
                  key={step.key}
                  style={{
                    display: "flex", alignItems: "center", gap: 12,
                    padding: "10px 12px", borderRadius: 8,
                    background: active ? "var(--amber-dim)" : done ? "var(--bg3)" : "transparent",
                    border: `1px solid ${active ? "rgba(245,166,35,0.3)" : done ? "var(--border)" : "transparent"}`,
                    transition: "all 0.3s",
                    opacity: phase === "idle" ? 0.4 : 1,
                  }}
                >
                  <div style={{
                    width: 28, height: 28, borderRadius: "50%",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    background: done ? "var(--green-dim)" : active ? "var(--amber-dim)" : "var(--bg4)",
                    border: `1px solid ${done ? "#1a5c32" : active ? "rgba(245,166,35,0.4)" : "var(--border)"}`,
                    fontSize: 12, flexShrink: 0,
                    color: done ? "var(--green)" : active ? "var(--amber)" : "var(--text3)",
                  }}>
                    {done ? "✓" : active ? <div className="spinner" style={{ width: 12, height: 12, borderWidth: 1.5 }} /> : step.icon}
                  </div>
                  <span style={{ fontSize: 13, color: active ? "var(--amber)" : done ? "var(--text)" : "var(--text3)", fontWeight: active ? 500 : 400 }}>
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Result card */}
          {phase === "done" && report && (
            <div style={{ marginTop: 20, padding: 16, borderRadius: 10, background: decisionStyle.bg, border: `1px solid ${decisionStyle.border}` }}>
              <div style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: decisionStyle.color, marginBottom: 6, letterSpacing: "0.08em" }}>FINAL DECISION</div>
              <div style={{ fontSize: 26, fontFamily: "var(--font-display)", fontWeight: 700, color: decisionStyle.color }}>{decision}</div>
              <div style={{ fontSize: 12, color: decisionStyle.color, opacity: 0.7, marginTop: 6, lineHeight: 1.5 }}>{report.reasoning?.slice(0, 100)}...</div>
              <button
                className="btn btn-ghost"
                style={{ marginTop: 12, width: "100%", fontSize: 13 }}
                onClick={() => navigate(`/contracts/${contractId}`)}
              >
                View Full Report →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
