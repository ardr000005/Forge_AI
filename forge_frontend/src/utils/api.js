import axios from "axios";

const BASE = "http://localhost:8000/api";
const api = axios.create({ baseURL: BASE });

export const submitContract = (data) => api.post("/contract", data);
export const runPipeline = (id) => api.post(`/run/${id}`);
export const getReport = (id) => api.get(`/report/${id}`);
export const getAudit = (id) => api.get(`/audit/${id}`);
export const getDecision = (id) => api.get(`/decision/${id}`);
export const getContract = (id) => api.get(`/contract/${id}`);
export const listContracts = () => api.get("/contracts");
export const listDecisions = () => api.get("/decisions");
export const getCompany = () => api.get("/company");
export const seedCompany = (data) => api.post("/company/seed", data);
export const healthCheck = () => axios.get("http://localhost:8000/");
