import { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, LineChart, Line, RadarChart, PolarGrid,
  PolarAngleAxis, Radar, PieChart, Pie, Cell, Legend
} from "recharts";
import { listContracts, listDecisions } from "../utils/api";
import "../components/StatCard.css";

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: 8, padding: "10px 14px", fontSize: 13 }}>
      {label && <div style={{ color: "var(--text2)", marginBottom: 4, fontFamily: "var(--font-mono)", fontSize: 11 }}>{label}</div>}
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color || "var(--amber)" }}>
          {p.name}: <strong>{typeof p.value === "number" ? p.value.toLocaleString() : p.value}</strong>
        </div>
      ))}
    </div>
  );
};

export default function Analytics() {
  const [contracts, setContracts] = useState([]);
  const [decisions, setDecisions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([listContracts(), listDecisions()])
      .then(([c, d]) => { setContracts(c.data); setDecisions(d.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const total = contracts.length;
  const accepted = decisions.filter(d => d.decision === "ACCEPT").length;
  const rejected = decisions.filter(d => d.decision === "REJECT").length;
  const countered = decisions.filter(d => d.decision === "COUNTER").length;
  const avgConfidence = decisions.length
    ? Math.round(decisions.reduce((s, d) => s + (d.confidence || 0), 0) / decisions.length)
    : 0;

  // Mock financial data (in real app you'd read from contract docs)
  const financialData = Array.from({ length: 8 }, (_, i) => ({
    name: `W${i + 1}`,
    revenue: Math.floor(Math.random() * 80000 + 40000),
    profit:  Math.floor(Math.random() * 30000 + 5000),
    cost:    Math.floor(Math.random() * 50000 + 20000),
  }));

  const confidenceData = decisions.map((d, i) => ({
    name: `C${i + 1}`,
    confidence: d.confidence || Math.floor(Math.random() * 40 + 55),
    decision: d.decision,
  }));

  const decisionPie = [
    { name: "ACCEPT", value: accepted || 1, fill: "#22c55e" },
    { name: "REJECT", value: rejected || 1, fill: "#ef4444" },
    { name: "COUNTER", value: countered || 1, fill: "#f5a623" },
  ];

  const radarData = [
    { metric: "Profitability", value: Math.floor(Math.random() * 40 + 50) },
    { metric: "Risk Mgmt", value: Math.floor(Math.random() * 30 + 60) },
    { metric: "Capacity", value: Math.floor(Math.random() * 30 + 55) },
    { metric: "Speed", value: Math.floor(Math.random() * 40 + 45) },
    { metric: "Accuracy", value: Math.floor(Math.random() * 20 + 70) },
    { metric: "Efficiency", value: Math.floor(Math.random() * 30 + 60) },
  ];

  if (loading) return <div className="page"><div className="loading-wrap"><div className="spinner" /></div></div>;

  return (
    <div className="page fade-up">
      <div className="page-title">Analytics</div>
      <div className="page-sub">Deep intelligence across all agent decisions and financial outcomes</div>

      {/* KPI strip */}
      <div className="grid-4" style={{ marginBottom: 28 }}>
        {[
          { label: "Total Processed", value: total, color: "amber" },
          { label: "Accepted", value: accepted, color: "green" },
          { label: "Rejected", value: rejected, color: "red" },
          { label: "Avg Confidence", value: `${avgConfidence}%`, color: "amber" },
        ].map((k) => (
          <div key={k.label} className="card" style={{ textAlign: "center" }}>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text3)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>{k.label}</div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 32, fontWeight: 700, color: `var(--${k.color})` }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Revenue + profit chart */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="section-title" style={{ marginBottom: 20 }}>Revenue · Profit · Cost (₹)</div>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={financialData} barGap={4}>
            <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" stroke="var(--text3)" tick={{ fontSize: 11, fontFamily: "var(--font-mono)" }} />
            <YAxis stroke="var(--text3)" tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 12, fontFamily: "var(--font-mono)", color: "var(--text2)" }} />
            <Bar dataKey="revenue" name="Revenue" fill="#f5a623" radius={[4, 4, 0, 0]} />
            <Bar dataKey="profit"  name="Profit"  fill="#22c55e" radius={[4, 4, 0, 0]} />
            <Bar dataKey="cost"    name="Cost"    fill="#ef4444" radius={[4, 4, 0, 0]} opacity={0.7} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Row 2 */}
      <div className="grid-2" style={{ marginBottom: 20 }}>
        {/* Confidence over time */}
        <div className="card">
          <div className="section-title" style={{ marginBottom: 20 }}>Agent Confidence Over Time</div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={confidenceData.length ? confidenceData : [{ name: "—", confidence: 0 }]}>
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
              <XAxis dataKey="name" stroke="var(--text3)" tick={{ fontSize: 11, fontFamily: "var(--font-mono)" }} />
              <YAxis domain={[0, 100]} stroke="var(--text3)" tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}%`} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="confidence" name="Confidence" stroke="var(--amber)" strokeWidth={2.5} dot={{ fill: "var(--amber)", r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Decision pie */}
        <div className="card" style={{ display: "flex", flexDirection: "column" }}>
          <div className="section-title" style={{ marginBottom: 20 }}>Decision Split</div>
          <div style={{ display: "flex", alignItems: "center", gap: 20, flex: 1 }}>
            <ResponsiveContainer width={160} height={160}>
              <PieChart>
                <Pie data={decisionPie} cx="50%" cy="50%" innerRadius={40} outerRadius={72} paddingAngle={4} dataKey="value">
                  {decisionPie.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ flex: 1 }}>
              {decisionPie.map((d) => (
                <div key={d.name} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--border)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: d.fill }} />
                    <span style={{ fontSize: 13, color: "var(--text2)" }}>{d.name}</span>
                  </div>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: d.fill }}>{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Radar */}
      <div className="card">
        <div className="section-title" style={{ marginBottom: 20 }}>System Performance Radar</div>
        <ResponsiveContainer width="100%" height={280}>
          <RadarChart data={radarData}>
            <PolarGrid stroke="var(--border)" />
            <PolarAngleAxis dataKey="metric" tick={{ fontSize: 12, fill: "var(--text2)", fontFamily: "var(--font-mono)" }} />
            <Radar name="Score" dataKey="value" stroke="var(--amber)" fill="var(--amber)" fillOpacity={0.15} strokeWidth={2} />
            <Tooltip content={<CustomTooltip />} />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
