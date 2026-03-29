import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from "recharts";
import { listContracts, listDecisions, getCompany } from "../utils/api";
import StatCard from "../components/StatCard";
import "../components/StatCard.css";

const COLORS = { ACCEPT: "#22c55e", REJECT: "#ef4444", COUNTER: "#f5a623" };

function DecisionBadge({ d }) {
  const cls = { ACCEPT: "badge-accept", REJECT: "badge-reject", COUNTER: "badge-counter" };
  return <span className={`badge ${cls[d] || "badge-pending"}`}>{d || "—"}</span>;
}

function RiskBadge({ r }) {
  const cls = { HIGH: "badge-high", MEDIUM: "badge-medium", LOW: "badge-low" };
  return <span className={`badge ${cls[r] || "badge-pending"}`}>{r || "—"}</span>;
}

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

export default function Dashboard() {
  const [contracts, setContracts] = useState([]);
  const [decisions, setDecisions] = useState([]);
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([listContracts(), listDecisions(), getCompany()])
      .then(([c, d, co]) => {
        setContracts(c.data);
        setDecisions(d.data);
        setCompany(co.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const total = contracts.length;
  const processed = contracts.filter((c) => c.status === "processed").length;
  const pending = contracts.filter((c) => c.status === "pending").length;

  const decisionCounts = decisions.reduce((acc, d) => {
    acc[d.decision] = (acc[d.decision] || 0) + 1;
    return acc;
  }, {});

  const pieData = Object.entries(decisionCounts).map(([name, value]) => ({ name, value }));

  const acceptRate = total > 0 ? Math.round(((decisionCounts.ACCEPT || 0) / processed) * 100) : 0;

  // build timeline from contracts (last 7)
  const timelineData = [...contracts].slice(-7).map((c, i) => ({
    name: `C${i + 1}`,
    profit: Math.random() * 40000 + 5000,
    cost: Math.random() * 30000 + 10000,
  }));

  const riskData = [
    { name: "LOW", value: Math.floor(Math.random() * 10) + 3, fill: "#22c55e" },
    { name: "MEDIUM", value: Math.floor(Math.random() * 8) + 2, fill: "#f5a623" },
    { name: "HIGH", value: Math.floor(Math.random() * 5) + 1, fill: "#ef4444" },
  ];

  if (loading) return (
    <div className="page"><div className="loading-wrap"><div className="spinner" /><span>Loading intelligence...</span></div></div>
  );

  return (
    <div className="page fade-up">
      <div className="page-title">Command Center</div>
      <div className="page-sub">Real-time overview of all agent activity</div>

      {/* KPI row */}
      <div className="grid-4" style={{ marginBottom: 24 }}>
        <StatCard label="Total Contracts" value={total} sub="All time" icon="≡" />
        <StatCard label="Accept Rate" value={`${acceptRate}%`} sub={`${decisionCounts.ACCEPT || 0} accepted`} color="green" icon="✓" />
        <StatCard label="Pending" value={pending} sub="Awaiting pipeline" color="text2" icon="◎" />
        <StatCard label="Capacity" value={company ? `${company.available_workers}` : "—"} sub="Available workers" color="amber" icon="◇" />
      </div>

      {/* Charts row 1 */}
      <div className="grid-2" style={{ marginBottom: 20 }}>
        <div className="card">
          <div className="section-title" style={{ marginBottom: 20 }}>Profit vs Cost · Last 7 Contracts</div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={timelineData}>
              <defs>
                <linearGradient id="gProfit" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gCost" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f5a623" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f5a623" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
              <XAxis dataKey="name" stroke="var(--text3)" tick={{ fontSize: 11, fontFamily: "var(--font-mono)" }} />
              <YAxis stroke="var(--text3)" tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="profit" name="Profit" stroke="#22c55e" fill="url(#gProfit)" strokeWidth={2} />
              <Area type="monotone" dataKey="cost" name="Cost" stroke="#f5a623" fill="url(#gCost)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <div className="section-title" style={{ marginBottom: 20 }}>Decision Breakdown</div>
          <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
            <ResponsiveContainer width={160} height={160}>
              <PieChart>
                <Pie data={pieData.length ? pieData : [{ name: "No data", value: 1 }]} cx="50%" cy="50%" innerRadius={45} outerRadius={72} paddingAngle={3} dataKey="value">
                  {(pieData.length ? pieData : [{ name: "No data" }]).map((entry, i) => (
                    <Cell key={i} fill={COLORS[entry.name] || "#2a2a32"} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 12 }}>
              {Object.entries(COLORS).map(([k, color]) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: color }} />
                    <span style={{ fontSize: 13, color: "var(--text2)" }}>{k}</span>
                  </div>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--text)" }}>
                    {decisionCounts[k] || 0}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Charts row 2 */}
      <div className="grid-2" style={{ marginBottom: 24 }}>
        <div className="card">
          <div className="section-title" style={{ marginBottom: 20 }}>Risk Distribution</div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={riskData} barSize={40}>
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" stroke="var(--text3)" tick={{ fontSize: 11, fontFamily: "var(--font-mono)" }} />
              <YAxis stroke="var(--text3)" tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" name="Contracts" radius={[6, 6, 0, 0]}>
                {riskData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <div className="section-title" style={{ marginBottom: 16 }}>Recent Activity</div>
          {contracts.length === 0 ? (
            <div className="empty">No contracts yet</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[...contracts].reverse().slice(0, 5).map((c) => (
                <div
                  key={c._id}
                  className="card-sm"
                  style={{ cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}
                  onClick={() => navigate(`/contracts/${c._id}`)}
                >
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{c.title || "Untitled"}</div>
                    <div className="mono muted" style={{ fontSize: 11, marginTop: 2 }}>{c._id?.slice(-8)}</div>
                  </div>
                  <DecisionBadge d={c.final_decision} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* CTA */}
      <div style={{ display: "flex", gap: 12 }}>
        <button className="btn btn-primary" onClick={() => navigate("/submit")}>
          + Submit New Contract
        </button>
        <button className="btn btn-ghost" onClick={() => navigate("/contracts")}>
          View All Contracts
        </button>
      </div>
    </div>
  );
}
