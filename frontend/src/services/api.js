// frontend/src/services/api.js
/**
 * Centralised API service.
 * Attaches access_token from in-memory store to every protected request.
 */
import { getAccessToken } from "../store/AuthContext";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api/v1";

async function request(method, path, body = undefined, requiresAuth = true) {
  const headers = { "Content-Type": "application/json" };

  if (requiresAuth) {
    const token = getAccessToken();
    if (!token) throw new Error("Not authenticated");
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    credentials: "include",
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Request failed" }));
    let message = err.detail || `HTTP ${res.status}`;
    if (typeof message !== "string") {
      message = JSON.stringify(message);
    }
    throw new Error(message);
  }

  if (res.status === 204) return null;
  return res.json();
}

// ── Auth ──────────────────────────────────────────────────────────
export const authApi = {
  register: (email, password, fullName) =>
    request("POST", "/auth/register", { email, password, full_name: fullName }, false),

  login: async (email, password) => {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ username: email, password }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "Login failed" }));
      let message = err.detail || "Login failed";
      if (typeof message !== "string") {
        message = JSON.stringify(message);
      }
      throw new Error(message);
    }
    return res.json();
  },

  refresh: () =>
    request("POST", "/auth/refresh", undefined, false),

  logout: () =>
    request("POST", "/auth/logout", undefined, false),
};

// ── Diagnosis ─────────────────────────────────────────────────────
export const diagnosisApi = {
  submit: (payload) => request("POST", "/diagnosis/submit", payload),
  getMyHistory: () => request("GET", "/diagnosis/my-history"),
  getAllRecords: () => request("GET", "/diagnosis/all-records"),
};

// ── Admin ─────────────────────────────────────────────────────────
export const adminApi = {
  getUsers: () => request("GET", "/admin/users"),
  getAnalytics: () => request("GET", "/admin/analytics"),
  getModelMetrics: () => request("GET", "/admin/model-metrics"),
};
