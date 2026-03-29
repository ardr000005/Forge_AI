export default function StatCard({ label, value, sub, color = "amber", icon }) {
  return (
    <div className="card stat-card">
      <div className="stat-top">
        <span className="stat-label mono">{label}</span>
        {icon && <span className="stat-icon">{icon}</span>}
      </div>
      <div className={`stat-value ${color}`}>{value}</div>
      {sub && <div className="stat-sub muted">{sub}</div>}
    </div>
  );
}
