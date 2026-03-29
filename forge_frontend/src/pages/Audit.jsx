import { useEffect, useState } from "react";
import { listContracts, getAudit } from "../utils/api";
import "../components/StatCard.css";

export default function AuditPage() {
  const [contracts, setContracts] = useState([]);
  const [selected, setSelected] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    listContracts()
      .then((r) => {
        const processed = r.data.filter((c) => c.status === "processed");
        setContracts(processed);
        if (processed.length) selectContract(processed[processed.length - 1]._id);
      })
      .catch(() => {});
  }, []);

  async function selectContract(id) {
    setSelected(id);
    setLoading(true);
    try {
      const res = await getAudit(id);
      setLogs(res.data.trail || []);
    } catch {
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }

  const agentColors = {
    orchestrator:   "var(--purple)",
    contract_agent: "var(--amber)",
    capacity_agent: "var(--blue)",
    profit_agent:   "var(--green)",
    risk_agent:     "var(--red)",
    decision_agent: "#a78bfa",
    execution_agent:"var(--text2)",
    logging_agent:  "var(--text3)",
  };

  return (
    <div className="page fade-up">
      <div className="page-title">Audit Trail</div>
      <div className="page-sub">Complete log of every agent action — full transparency and traceability</div>

      <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: 20, alignItems: "start" }}>
        {/* Contract selector */}
        <div className="card" style={{ padding: 0 }}>
          <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--border)" }}>
            <div className="section-title" style={{ margin: 0 }}>Processed Contracts</div>
          </div>
          {contracts.length === 0 ? (
            <div className="empty" style={{ padding: "30px 16px" }}>No processed contracts yet</div>
          ) : (
            <div>
              {[...contracts].reverse().map((c) => (
                <div
                  key={c._id}
                  onClick={() => selectContract(c._id)}
                  style={{
                    padding: "12px 16px",
                    borderBottom: "1px solid var(--border)",
                    cursor: "pointer",
                    background: selected === c._id ? "var(--amber-dim)" : "transparent",
                    borderLeft: selected === c._id ? "2px solid var(--amber)" : "2px solid transparent",
                    transition: "all 0.15s",
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: 500, color: selected === c._id ? "var(--amber)" : "var(--text)" }}>
                    {c.title || "Untitled"}
                  </div>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text3)", marginTop: 3 }}>
                    {c._id?.slice(-10)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Log viewer */}
        <div className="card" style={{ padding: 0, minHeight: 400 }}>
          <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div className="section-title" style={{ margin: 0 }}>
              {selected ? `Events (${logs.length})` : "Select a contract"}
            </div>
            {logs.length > 0 && (
              <div className="row">
                {["ERROR", "WARN", "INFO"].map((level) => {
                  const count = logs.filter(l => l.level === level).length;
                  return count > 0 ? (
                    <span key={level} className={`badge ${level === "ERROR" ? "badge-reject" : level === "WARN" ? "badge-counter" : "badge-pending"}`}>
                      {count} {level}
                    </span>
                  ) : null;
                })}
              </div>
            )}
          </div>

          {loading ? (
            <div className="loading-wrap"><div className="spinner" /></div>
          ) : !selected ? (
            <div className="empty">Select a contract to view its audit trail</div>
          ) : logs.length === 0 ? (
            <div className="empty">No audit logs found</div>
          ) : (
            <div style={{ fontFamily: "var(--font-mono)" }}>
              {logs.map((log, i) => (
                <div
                  key={i}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "80px 140px 1fr",
                    gap: 16,
                    padding: "11px 20px",
                    borderBottom: "1px solid var(--border)",
                    alignItems: "flex-start",
                    background: log.level === "ERROR" ? "rgba(239,68,68,0.04)" : log.level === "WARN" ? "rgba(245,166,35,0.04)" : "transparent",
                  }}
                >
                  <div style={{ fontSize: 10, color: "var(--text3)", paddingTop: 1 }}>
                    {new Date(log.timestamp).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                  </div>
                  <div style={{
                    fontSize: 10, padding: "2px 8px", borderRadius: 4, textAlign: "center",
                    color: agentColors[log.agent] || "var(--text2)",
                    border: `1px solid ${agentColors[log.agent] || "var(--border)"}22`,
                    background: `${agentColors[log.agent] || "var(--text2)"}11`,
                    alignSelf: "flex-start",
                  }}>
                    {log.agent}
                  </div>
                  <div style={{ fontSize: 12, color: log.level === "ERROR" ? "var(--red)" : log.level === "WARN" ? "var(--amber)" : "var(--text2)", lineHeight: 1.6, fontFamily: "var(--font-body)" }}>
                    {log.message}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
