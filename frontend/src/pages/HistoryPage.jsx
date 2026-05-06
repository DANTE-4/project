// frontend/src/pages/HistoryPage.jsx
import { useState, useEffect } from "react";
import { diagnosisApi } from "../services/api";

export default function HistoryPage() {
  const [records, setRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    diagnosisApi.getMyHistory()
      .then(setRecords)
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <div className="w-12 h-12 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
        <p className="text-slate-500 font-medium animate-pulse">Retrieving your medical history...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto mt-12 p-8 bg-danger-50 border border-danger-100 rounded-3xl text-center">
        <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-danger-600 mx-auto mb-4 shadow-sm">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-danger-900 mb-2">Sync Error</h2>
        <p className="text-danger-700 text-sm mb-6">{error}</p>
        <button onClick={() => window.location.reload()} className="px-6 py-2 bg-danger-600 text-white font-bold rounded-xl hover:bg-danger-700 transition-all">
          Retry Connection
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Diagnosis History</h1>
          <p className="text-slate-500 mt-1">Manage and review your past AI-assisted health assessments.</p>
        </div>
        <div className="px-4 py-2 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-600 shadow-sm">
          {records.length} Total Records
        </div>
      </div>

      {records.length === 0 ? (
        <div className="bg-white rounded-[2rem] border border-slate-200 p-20 text-center shadow-sm">
          <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center text-slate-300 mx-auto mb-6">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">No Records Found</h3>
          <p className="text-slate-500 max-w-xs mx-auto mb-8">You haven't completed any health assessments yet. Start your first one today.</p>
          <a href="/diagnose" className="inline-flex items-center gap-2 px-8 py-3 bg-brand-600 text-white font-bold rounded-xl shadow-lg shadow-brand-100 hover:bg-brand-700 transition-all">
            Start Assessment
          </a>
        </div>
      ) : (
        <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Prediction</th>
                <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Confidence</th>
                <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Model Version</th>
                <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Timestamp</th>
                <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {records.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-8 py-5">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full border ${
                        r.prediction === "positive"
                          ? "bg-danger-50 text-danger-700 border-danger-100"
                          : "bg-success-50 text-success-700 border-success-100"
                      }`}
                    >
                      <div className={`w-1.5 h-1.5 rounded-full ${r.prediction === "positive" ? "bg-danger-500" : "bg-success-500"}`} />
                      {r.prediction.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 bg-slate-100 rounded-full h-1.5 w-16 overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${r.prediction === "positive" ? "bg-danger-400" : "bg-success-400"}`}
                          style={{ width: `${Math.round(r.confidence_score * 100)}%` }}
                        />
                      </div>
                      <span className="text-sm font-bold text-slate-700">{Math.round(r.confidence_score * 100)}%</span>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <span className="px-2 py-1 bg-slate-100 text-slate-500 text-[10px] font-black rounded border border-slate-200">
                      v{r.model_version || "1.0.0"}
                    </span>
                  </td>
                  <td className="px-8 py-5">
                    <div className="text-sm font-medium text-slate-900">
                      {new Date(r.created_at).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}
                    </div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">
                      {new Date(r.created_at).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <button className="p-2 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-all">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
