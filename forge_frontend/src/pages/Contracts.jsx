import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { listContracts } from "../utils/api";
import "../components/StatCard.css";

function DecisionBadge({ d }) {
  const cls = { ACCEPT: "badge-accept", REJECT: "badge-reject", COUNTER: "badge-counter" };
  return <span className={`badge ${cls[d] || "badge-pending"}`}>{d || "Pending"}</span>;
}

export default function Contracts() {
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("ALL");
  const navigate = useNavigate();

  useEffect(() => {
    listContracts()
      .then((r) => setContracts(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = contracts.filter((c) => {
    const matchSearch = c.title?.toLowerCase().includes(search.toLowerCase()) || c._id?.includes(search);
    const matchFilter = filter === "ALL" || c.final_decision === filter || (filter === "PENDING" && !c.final_decision);
    return matchSearch && matchFilter;
  });

  return (
    <div className="page fade-up">
      <div className="page-title">Contracts</div>
      <div className="page-sub">All submitted contracts and their agent outcomes</div>

      {/* Filters */}
      <div className="row-between" style={{ marginBottom: 20 }}>
        <input className="input" style={{ maxWidth: 280 }} placeholder="Search by title or ID..." value={search} onChange={(e) => setSearch(e.target.value)} />
        <div className="row">
          {["ALL", "ACCEPT", "REJECT", "COUNTER", "PENDING"].map((f) => (
            <button
              key={f}
              className={`btn ${filter === f ? "btn-primary" : "btn-ghost"}`}
              style={{ padding: "7px 14px", fontSize: 12, fontFamily: "var(--font-mono)" }}
              onClick={() => setFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="loading-wrap"><div className="spinner" /><span>Loading contracts...</span></div>
      ) : filtered.length === 0 ? (
        <div className="empty">No contracts found. <span className="amber" style={{ cursor: "pointer" }} onClick={() => navigate("/submit")}>Submit one →</span></div>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Contract ID</th>
                  <th>Status</th>
                  <th>Decision</th>
                  <th>Created</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {[...filtered].reverse().map((c) => (
                  <tr key={c._id} style={{ cursor: "pointer" }} onClick={() => navigate(`/contracts/${c._id}`)}>
                    <td style={{ fontWeight: 500 }}>{c.title || "Untitled"}</td>
                    <td className="td-mono">{c._id?.slice(-12)}</td>
                    <td>
                      <span style={{ fontSize: 12, color: c.status === "processed" ? "var(--green)" : "var(--text3)" }}>
                        {c.status || "pending"}
                      </span>
                    </td>
                    <td><DecisionBadge d={c.final_decision} /></td>
                    <td className="td-mono">
                      {c.created_at ? new Date(c.created_at).toLocaleDateString() : "—"}
                    </td>
                    <td>
                      <span style={{ color: "var(--amber)", fontSize: 13 }}>View →</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
