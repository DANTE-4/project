// frontend/src/pages/RegisterPage.jsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authApi } from "../services/api";

export default function RegisterPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      await authApi.register(email, password, fullName || null);
      navigate("/login");
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="w-full max-w-5xl bg-white rounded-[2rem] shadow-2xl shadow-slate-200 overflow-hidden flex flex-col md:flex-row-reverse border border-slate-100">
        {/* Branding/Info Side */}
        <div className="w-full md:w-1/2 bg-brand-900 p-12 text-white flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-full h-full opacity-10 pointer-events-none">
            <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
              <path d="M0 0 L100 100 M100 0 L0 100" stroke="white" fill="transparent" strokeWidth="0.5" />
            </svg>
          </div>
          
          <div className="relative text-right">
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-brand-900 font-black text-xl mb-8 ml-auto">
              AI
            </div>
            <h1 className="text-4xl font-black tracking-tight mb-4">Join ChikAI</h1>
            <p className="text-brand-200 text-lg leading-relaxed max-w-sm ml-auto">
              Access the world's most advanced AI-driven infectious disease screening platform.
            </p>
          </div>

          <div className="relative space-y-6">
            <div className="flex items-center justify-end gap-4">
              <span className="text-sm font-medium text-brand-100">Privacy-First Data Policy</span>
              <div className="w-10 h-10 rounded-xl bg-brand-800 flex items-center justify-center">
                <svg className="w-5 h-5 text-brand-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
            </div>
            <div className="flex items-center justify-end gap-4">
              <span className="text-sm font-medium text-brand-100">Instant Risk Stratification</span>
              <div className="w-10 h-10 rounded-xl bg-brand-800 flex items-center justify-center">
                <svg className="w-5 h-5 text-brand-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Register Form Side */}
        <div className="w-full md:w-1/2 p-12 flex flex-col justify-center bg-white">
          <div className="max-w-sm mx-auto w-full">
            <h2 className="text-3xl font-black text-slate-900 mb-2">Create Account</h2>
            <p className="text-slate-500 mb-10">Start your first assessment in seconds.</p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Full Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-4 py-4 text-sm focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all outline-none"
                    placeholder="John Doe"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Email Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                    </svg>
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-4 py-4 text-sm focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all outline-none"
                    placeholder="you@hospital.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-4 py-4 text-sm focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all outline-none"
                    placeholder="Min 8 chars, 1 uppercase, 1 digit"
                  />
                </div>
              </div>

              {error && (
                <div className="p-4 bg-danger-50 border border-danger-100 text-danger-700 text-xs font-bold rounded-2xl flex items-center gap-3">
                  <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-4 rounded-2xl shadow-xl shadow-brand-100 transition-all flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : "Create Account"}
              </button>
            </form>

            <p className="text-sm text-slate-500 text-center mt-10">
              Already have an account?{" "}
              <Link to="/login" className="text-brand-600 font-bold hover:text-brand-700">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
