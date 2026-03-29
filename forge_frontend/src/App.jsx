import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import Submit from "./pages/Submit";
import Contracts from "./pages/Contracts";
import ContractDetail from "./pages/ContractDetail";
import Analytics from "./pages/Analytics";
import AuditPage from "./pages/Audit";
import Company from "./pages/Company";
import { healthCheck } from "./utils/api";

export default function App() {
  const [apiStatus, setApiStatus] = useState("checking");

  useEffect(() => {
    healthCheck()
      .then(() => setApiStatus("online"))
      .catch(() => setApiStatus("offline"));
    const interval = setInterval(() => {
      healthCheck()
        .then(() => setApiStatus("online"))
        .catch(() => setApiStatus("offline"));
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: "var(--bg3)",
            color: "var(--text)",
            border: "1px solid var(--border)",
            fontFamily: "var(--font-body)",
            fontSize: "13px",
          },
          success: { iconTheme: { primary: "#22c55e", secondary: "#0d2818" } },
          error: { iconTheme: { primary: "#ef4444", secondary: "#2d1010" } },
        }}
      />
      <div style={{ display: "flex", minHeight: "100vh" }}>
        <Sidebar status={apiStatus} />
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/submit" element={<Submit />} />
          <Route path="/contracts" element={<Contracts />} />
          <Route path="/contracts/:id" element={<ContractDetail />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/audit" element={<AuditPage />} />
          <Route path="/company" element={<Company />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
