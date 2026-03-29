import { useEffect, useState } from "react";
import { getCompany, seedCompany } from "../utils/api";
import toast from "react-hot-toast";
import "../components/StatCard.css";

export default function Company() {
  const [company, setCompany] = useState(null);
  const [form, setForm] = useState({
    company_name: "", available_workers: "", cost_per_worker: "",
    max_concurrent_projects: "", active_projects: ""
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getCompany()
      .then((r) => {
        setCompany(r.data);
        setForm({
          company_name: r.data.company_name || "",
          available_workers: r.data.available_workers ?? "",
          cost_per_worker: r.data.cost_per_worker ?? "",
          max_concurrent_projects: r.data.max_concurrent_projects ?? "",
          active_projects: r.data.active_projects ?? "",
        });
      })
      .catch(() => {});
  }, []);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await seedCompany({
        ...form,
        available_workers: parseInt(form.available_workers),
        cost_per_worker: parseInt(form.cost_per_worker),
        max_concurrent_projects: parseInt(form.max_concurrent_projects),
        active_projects: parseInt(form.active_projects),
      });
      toast.success("Company profile updated!");
      const r = await getCompany();
      setCompany(r.data);
    } catch (err) {
      toast.error("Failed to save: " + (err?.response?.data?.detail || err.message));
    } finally {
      setSaving(false);
    }
  }

  const utilization = company
    ? Math.round((company.active_projects / Math.max(company.max_concurrent_projects, 1)) * 100)
    : 0;

  const workerUtil = company
    ? Math.round((Math.max(company.max_concurrent_projects - company.available_workers, 0) / Math.max(company.max_concurrent_projects, 1)) * 100)
    : 0;

  return (
    <div className="page fade-up">
      <div className="page-title">Company Profile</div>
      <div className="page-sub">Configure your company's capacity — agents use this to evaluate contracts</div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 24, alignItems: "start" }}>
        {/* Form */}
        <div className="card">
          <div className="section-title" style={{ marginBottom: 20 }}>Update Profile</div>
          <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div>
              <label>Company Name</label>
              <input className="input" value={form.company_name} onChange={set("company_name")} placeholder="Forge Solutions Pvt Ltd" />
            </div>
            <div className="grid-2">
              <div>
                <label>Available Workers</label>
                <input className="input" type="number" min="0" value={form.available_workers} onChange={set("available_workers")} placeholder="12" />
              </div>
              <div>
                <label>Cost per Worker (₹/mo)</label>
                <input className="input" type="number" min="0" value={form.cost_per_worker} onChange={set("cost_per_worker")} placeholder="3000" />
              </div>
            </div>
            <div className="grid-2">
              <div>
                <label>Max Concurrent Projects</label>
                <input className="input" type="number" min="1" value={form.max_concurrent_projects} onChange={set("max_concurrent_projects")} placeholder="5" />
              </div>
              <div>
                <label>Active Projects Now</label>
                <input className="input" type="number" min="0" value={form.active_projects} onChange={set("active_projects")} placeholder="2" />
              </div>
            </div>
            <button className="btn btn-primary" type="submit" disabled={saving} style={{ marginTop: 4 }}>
              {saving ? <><div className="spinner" /> Saving...</> : "Save Profile"}
            </button>
          </form>
        </div>

        {/* Live stats */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {company && (
            <>
              <div className="card" style={{ textAlign: "center" }}>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text3)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>Company</div>
                <div style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 700 }}>{company.company_name || "—"}</div>
              </div>

              <div className="card">
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text3)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 12 }}>Project Utilization</div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ fontSize: 13, color: "var(--text2)" }}>{company.active_projects} / {company.max_concurrent_projects} projects</span>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: utilization > 80 ? "var(--red)" : "var(--amber)" }}>{utilization}%</span>
                </div>
                <div style={{ background: "var(--bg3)", borderRadius: 6, height: 8, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${utilization}%`, background: utilization > 80 ? "var(--red)" : "var(--amber)", borderRadius: 6, transition: "width 0.5s" }} />
                </div>
              </div>

              <div className="card">
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text3)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 16 }}>Quick Stats</div>
                {[
                  { label: "Available Workers", value: company.available_workers, color: "var(--green)" },
                  { label: "Cost per Worker", value: `₹${company.cost_per_worker?.toLocaleString()}`, color: "var(--amber)" },
                  { label: "Monthly Capacity Cost", value: `₹${(company.available_workers * company.cost_per_worker)?.toLocaleString()}`, color: "var(--text)" },
                ].map((s) => (
                  <div key={s.label} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--border)" }}>
                    <span style={{ fontSize: 13, color: "var(--text2)" }}>{s.label}</span>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: s.color, fontWeight: 500 }}>{s.value}</span>
                  </div>
                ))}
              </div>
            </>
          )}

          {!company && (
            <div className="card" style={{ textAlign: "center", color: "var(--text3)", fontSize: 13 }}>
              No company data yet. Fill in the form and save.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
