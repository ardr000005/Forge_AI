import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getReport, getContract, getAudit } from "../utils/api";
import "../components/StatCard.css";

function Metric({ label, value, color }) {
  return (
    <div className="card-sm" style={{ textAlign: "center" }}>
      <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text3)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6 }}>{label}</div>
      <div style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 700, color: color || "var(--text)" }}>{value}</div>
    </div>
  );
}

export default function ContractDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [contract, setContract] = useState(null);
  const [audit, setAudit] = useState(null);
  const [tab, setTab] = useState("report");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getContract(id).catch(() => ({ data: null })),
      getReport(id).catch(() => ({ data: null })),
      getAudit(id).catch(() => ({ data: null })),
    ]).then(([c, r, a]) => {
      setContract(c.data);
      setReport(r.data);
      setAudit(a.data);
    }).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="page"><div className="loading-wrap"><div className="spinner" /></div></div>;

  const decision = report?.final_decision || contract?.final_decision;
  const decisionColor = { ACCEPT: "var(--green)", REJECT: "var(--red)", COUNTER: "var(--amber)" }[decision] || "var(--text2)";
  const fin = report?.financial_summary || {};
  const risk = report?.risk_summary || {};
  const workforce = report?.workforce_summary || {};

  const tabs = ["report", "financial", "risk", "audit"];

  return (
    <div className="page fade-up">
      <div className="row" style={{ marginBottom: 20 }}>
        <button className="btn btn-ghost" style={{ padding: "6px 12px", fontSize: 13 }} onClick={() => navigate("/contracts")}>
          ← Back
        </button>
        <div className="page-title" style={{ margin: 0 }}>{contract?.title || "Contract Detail"}</div>
        {decision && (
          <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 18, color: decisionColor, marginLeft: "auto" }}>
            {decision}
          </span>
        )}
      </div>

      {/* ID strip */}
      <div className="card-sm mono muted" style={{ marginBottom: 20, fontSize: 12 }}>
        ID: {id} · Status: {contract?.status || "unknown"}
        {report?.confidence && <span style={{ marginLeft: 16, color: "var(--amber)" }}>Confidence: {report.confidence}%</span>}
      </div>

      {/* Tabs */}
      <div className="row" style={{ marginBottom: 20, gap: 4 }}>
        {tabs.map((t) => (
          <button
            key={t}
            className={`btn ${tab === t ? "btn-primary" : "btn-ghost"}`}
            style={{ padding: "7px 16px", fontSize: 13, textTransform: "capitalize" }}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </div>

      {/* REPORT TAB */}
      {tab === "report" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {report?.reasoning && (
            <div className="card" style={{ borderLeft: `3px solid ${decisionColor}` }}>
              <div className="section-title">AI Reasoning</div>
              <p style={{ color: "var(--text)", lineHeight: 1.7, fontSize: 14 }}>{report.reasoning}</p>
              {report.conditions && (
                <p style={{ color: "var(--amber)", fontSize: 13, marginTop: 10 }}>Conditions: {report.conditions}</p>
              )}
              {report.recommended_bid && (
                <p style={{ color: "var(--blue)", fontSize: 13, marginTop: 6 }}>Recommended Bid: ₹{report.recommended_bid?.toLocaleString()}</p>
              )}
            </div>
          )}

          <div className="grid-3">
            <Metric label="Budget" value={`₹${(fin.budget || 0).toLocaleString()}`} />
            <Metric label="Expected Profit" value={`₹${(fin.expected_profit || 0).toLocaleString()}`} color={fin.expected_profit > 0 ? "var(--green)" : "var(--red)"} />
            <Metric label="Risk Level" value={risk.level || "—"} color={{ HIGH: "var(--red)", MEDIUM: "var(--amber)", LOW: "var(--green)" }[risk.level]} />
          </div>

          {report?.actions_taken?.length > 0 && (
            <div className="card">
              <div className="section-title">Actions Taken</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {report.actions_taken.map((a, i) => (
                  <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", fontSize: 13, color: "var(--text2)" }}>
                    <span style={{ color: "var(--green)", marginTop: 1 }}>✓</span>
                    <span>{a}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* FINANCIAL TAB */}
      {tab === "financial" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="grid-2">
            <Metric label="Total Budget" value={`₹${(fin.budget || 0).toLocaleString()}`} />
            <Metric label="Total Cost" value={`₹${(fin.total_cost || 0).toLocaleString()}`} color="var(--red)" />
            <Metric label="Net Profit" value={`₹${(fin.expected_profit || 0).toLocaleString()}`} color={fin.expected_profit > 0 ? "var(--green)" : "var(--red)"} />
            <Metric label="Profit Margin" value={`${fin.margin_pct || 0}%`} color={fin.margin_pct > 15 ? "var(--green)" : fin.margin_pct > 5 ? "var(--amber)" : "var(--red)"} />
          </div>

          {/* margin bar */}
          <div className="card">
            <div className="section-title" style={{ marginBottom: 12 }}>Margin Health</div>
            <div style={{ background: "var(--bg3)", borderRadius: 6, height: 10, overflow: "hidden" }}>
              <div style={{
                height: "100%",
                width: `${Math.min(Math.max(fin.margin_pct || 0, 0), 100)}%`,
                background: fin.margin_pct > 15 ? "var(--green)" : fin.margin_pct > 5 ? "var(--amber)" : "var(--red)",
                borderRadius: 6,
                transition: "width 0.5s ease"
              }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--text3)" }}>
              <span>0%</span><span>Target: 10%+</span><span>100%</span>
            </div>
          </div>

          <div className="card">
            <div className="section-title" style={{ marginBottom: 12 }}>Workforce Cost</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
              <div className="card-sm">
                <div className="mono muted" style={{ fontSize: 10, marginBottom: 4 }}>REQUIRED</div>
                <div style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 700 }}>{workforce.required || 0}</div>
              </div>
              <div className="card-sm">
                <div className="mono muted" style={{ fontSize: 10, marginBottom: 4 }}>INTERNAL</div>
                <div style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 700, color: "var(--green)" }}>{workforce.available || 0}</div>
              </div>
              <div className="card-sm">
                <div className="mono muted" style={{ fontSize: 10, marginBottom: 4 }}>OUTSOURCED</div>
                <div style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 700, color: workforce.outsourced > 0 ? "var(--amber)" : "var(--text3)" }}>{workforce.outsourced || 0}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* RISK TAB */}
      {tab === "risk" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="grid-2">
            <Metric label="Risk Level" value={risk.level || "—"} color={{ HIGH: "var(--red)", MEDIUM: "var(--amber)", LOW: "var(--green)" }[risk.level]} />
            <Metric label="Risk Score" value={`${risk.score || 0}/100`} color={risk.score > 60 ? "var(--red)" : risk.score > 30 ? "var(--amber)" : "var(--green)"} />
          </div>

          {/* risk score bar */}
          <div className="card">
            <div className="section-title" style={{ marginBottom: 12 }}>Risk Score</div>
            <div style={{ background: "var(--bg3)", borderRadius: 6, height: 12, overflow: "hidden" }}>
              <div style={{
                height: "100%",
                width: `${Math.min(risk.score || 0, 100)}%`,
                background: risk.score > 60 ? "var(--red)" : risk.score > 30 ? "var(--amber)" : "var(--green)",
                borderRadius: 6,
                transition: "width 0.5s ease"
              }} />
            </div>
          </div>

          {risk.flags?.length > 0 && (
            <div className="card">
              <div className="section-title" style={{ marginBottom: 12 }}>Risk Flags</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {risk.flags.map((f, i) => (
                  <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "8px 12px", background: "var(--red-dim)", borderRadius: 8, border: "1px solid #3d1515", fontSize: 13, color: "var(--red)" }}>
                    <span>⚠</span><span>{f}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* AUDIT TAB */}
      {tab === "audit" && (
        <div className="card" style={{ padding: 0 }}>
          {!audit?.trail?.length ? (
            <div className="empty">No audit trail yet</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column" }}>
              {audit.trail.map((log, i) => (
                <div key={i} style={{ display: "flex", gap: 16, padding: "12px 20px", borderBottom: "1px solid var(--border)", alignItems: "flex-start" }}>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text3)", whiteSpace: "nowrap", paddingTop: 2, minWidth: 80 }}>
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </div>
                  <div style={{
                    fontFamily: "var(--font-mono)", fontSize: 11, padding: "1px 8px", borderRadius: 4, whiteSpace: "nowrap",
                    background: log.level === "ERROR" ? "var(--red-dim)" : log.level === "WARN" ? "var(--amber-dim)" : "var(--bg4)",
                    color: log.level === "ERROR" ? "var(--red)" : log.level === "WARN" ? "var(--amber)" : "var(--text3)",
                    border: `1px solid ${log.level === "ERROR" ? "#5c1a1a" : log.level === "WARN" ? "#5c3a10" : "var(--border)"}`,
                    alignSelf: "flex-start"
                  }}>
                    {log.agent}
                  </div>
                  <div style={{ fontSize: 13, color: log.level === "ERROR" ? "var(--red)" : "var(--text2)", lineHeight: 1.5 }}>{log.message}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
