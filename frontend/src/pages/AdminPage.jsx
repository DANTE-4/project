// frontend/src/pages/AdminPage.jsx
import { useState, useEffect } from "react";
import { adminApi } from "../services/api";

export default function AdminPage() {
  const [analytics, setAnalytics] = useState(null);
  const [users, setUsers] = useState([]);
  const [metrics, setMetrics] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      adminApi.getAnalytics(),
      adminApi.getUsers(),
      adminApi.getModelMetrics(),
    ])
      .then(([a, u, m]) => {
        setAnalytics(a);
        setUsers(u);
        setMetrics(m.report || "No data");
      })
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <div className="w-12 h-12 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
        <p className="text-slate-500 font-medium animate-pulse">Loading system analytics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto mt-12 p-8 bg-danger-50 border border-danger-100 rounded-3xl text-center">
        <h2 className="text-xl font-bold text-danger-900 mb-2">Access Denied</h2>
        <p className="text-danger-700 text-sm mb-6">{error}</p>
        <button onClick={() => window.location.reload()} className="px-6 py-2 bg-danger-600 text-white font-bold rounded-xl hover:bg-danger-700 transition-all">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">System Dashboard</h1>
          <p className="text-slate-500 mt-1">Global platform overview and AI model performance metrics.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-600 shadow-sm hover:bg-slate-50 transition-all">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh Data
        </button>
      </div>

      {/* Analytics cards */}
      {analytics && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { 
              label: "Total Users", 
              value: analytics.total_users, 
              color: "text-brand-600", 
              bg: "bg-brand-50",
              icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" 
            },
            { 
              label: "Diagnoses", 
              value: analytics.total_diagnoses, 
              color: "text-brand-600", 
              bg: "bg-brand-50",
              icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
            },
            { 
              label: "Positive Cases", 
              value: analytics.positive_count, 
              color: "text-danger-600", 
              bg: "bg-danger-50",
              icon: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
            },
            { 
              label: "Positive Rate", 
              value: `${(analytics.positive_rate * 100).toFixed(1)}%`, 
              color: "text-warning-600", 
              bg: "bg-warning-50",
              icon: "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" 
            },
          ].map(({ label, value, color, bg, icon }) => (
            <div key={label} className="bg-white rounded-[2rem] border border-slate-200 p-8 shadow-sm group hover:border-brand-300 transition-all">
              <div className={`w-12 h-12 ${bg} ${color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
                </svg>
              </div>
              <div className={`text-4xl font-black ${color} tracking-tight`}>{value}</div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2">{label}</div>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Users table */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-900">Registered Practitioners</h2>
              <button className="text-xs font-bold text-brand-600 hover:text-brand-700 uppercase tracking-widest">View All</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50">
                    <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Practitioner</th>
                    <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Role</th>
                    <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Registration Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs">
                            {u.email[0].toUpperCase()}
                          </div>
                          <div>
                            <div className="text-sm font-bold text-slate-900 group-hover:text-brand-600 transition-colors">{u.full_name || "Anonymous User"}</div>
                            <div className="text-xs text-slate-400">{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <span className={`px-2 py-1 text-[10px] font-black rounded-md uppercase tracking-tighter ${
                          u.role === "admin" ? "bg-purple-50 text-purple-700" : "bg-brand-50 text-brand-700"
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-sm text-slate-500 font-medium">
                        {u.created_at ? new Date(u.created_at).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Model metrics */}
        <div className="space-y-6">
          <div className="bg-slate-900 rounded-[2rem] p-8 text-white shadow-xl shadow-slate-200">
            <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-success-500 animate-pulse" />
              Model Insights
            </h2>
            <div className="space-y-4">
              <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Algorithm</div>
                <div className="text-sm font-medium">XGBoost Classifier</div>
              </div>
              <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Version</div>
                <div className="text-sm font-medium">1.0.0 (Production Ready)</div>
              </div>
              <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Last Updated</div>
                <div className="text-sm font-medium">May 06, 2026</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-[2rem] border border-slate-200 p-8 shadow-sm">
            <h2 className="text-sm font-bold text-slate-900 mb-6 uppercase tracking-widest">Evaluation Report</h2>
            <pre className="text-[10px] leading-relaxed text-slate-500 whitespace-pre-wrap bg-slate-50 rounded-2xl p-6 border border-slate-100 font-mono overflow-y-auto max-h-96">
              {metrics}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
