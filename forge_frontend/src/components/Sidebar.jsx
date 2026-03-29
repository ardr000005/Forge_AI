import { NavLink, useLocation } from "react-router-dom";
import "./Sidebar.css";

const nav = [
  { to: "/", label: "Dashboard", icon: "⬡" },
  { to: "/submit", label: "New Contract", icon: "+" },
  { to: "/contracts", label: "Contracts", icon: "≡" },
  { to: "/analytics", label: "Analytics", icon: "◈" },
  { to: "/audit", label: "Audit Trail", icon: "◎" },
  { to: "/company", label: "Company", icon: "◇" },
];

export default function Sidebar({ status }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-icon">F</div>
        <div>
          <div className="brand-name">FORGE</div>
          <div className="brand-sub">AI · CONTRACT OS</div>
        </div>
      </div>

      <div className="sidebar-status">
        <div className={`pulse-dot ${status === "online" ? "" : "offline"}`} />
        <span className="status-label mono">
          {status === "online" ? "API CONNECTED" : "API OFFLINE"}
        </span>
      </div>

      <nav className="sidebar-nav">
        {nav.map((n) => (
          <NavLink
            key={n.to}
            to={n.to}
            end={n.to === "/"}
            className={({ isActive }) =>
              `nav-item ${isActive ? "active" : ""}`
            }
          >
            <span className="nav-icon">{n.icon}</span>
            <span>{n.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="footer-line mono">v1.0.0</div>
        <div className="footer-line muted">Multi-Agent System</div>
      </div>
    </aside>
  );
}
