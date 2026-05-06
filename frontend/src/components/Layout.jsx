// frontend/src/components/Layout.jsx
import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../store/AuthContext";
import { useState } from "react";

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const navItems = [
    {
      path: "/diagnose",
      label: "Health Assessment",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      path: "/history",
      label: "Diagnosis History",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
  ];

  if (user?.role === "admin") {
    navItems.push({
      path: "/admin",
      label: "Admin Dashboard",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
    });
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside
        className={`${
          isSidebarOpen ? "w-64" : "w-20"
        } bg-white border-r border-slate-200 transition-all duration-300 flex flex-col fixed h-full z-20`}
      >
        <div className="p-6 flex items-center justify-between">
          {isSidebarOpen && (
            <Link to="/diagnose" className="text-xl font-bold text-brand-900 tracking-tight flex items-center gap-2">
              <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center text-white">
                <span className="text-xs">AI</span>
              </div>
              ChikAI
            </Link>
          )}
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        <nav className="flex-1 px-3 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                  isActive
                    ? "bg-brand-50 text-brand-700 font-medium"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <span className={`${isActive ? "text-brand-600" : "text-slate-400"}`}>
                  {item.icon}
                </span>
                {isSidebarOpen && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-100">
          <div className="flex items-center gap-3 px-2 py-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold text-xs">
              {user?.email?.[0].toUpperCase()}
            </div>
            {isSidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">{user?.email}</p>
                <p className="text-xs text-slate-500 capitalize">{user?.role}</p>
              </div>
            )}
          </div>
          <button
            onClick={handleLogout}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-600 hover:bg-red-50 hover:text-red-600 transition-colors ${
              !isSidebarOpen && "justify-center"
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            {isSidebarOpen && <span className="font-medium">Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`flex-1 transition-all duration-300 ${isSidebarOpen ? "ml-64" : "ml-20"} flex flex-col`}>
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-10">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <span>Portal</span>
            <span>/</span>
            <span className="text-slate-900 font-medium capitalize">
              {location.pathname.replace("/", "") || "Home"}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <div className="px-3 py-1 bg-green-50 text-green-700 text-xs font-bold rounded-full border border-green-200 uppercase tracking-wider">
              System Active
            </div>
          </div>
        </header>

        <div className="p-8">
          <Outlet />
        </div>

        <footer className="mt-auto py-6 px-8 border-t border-slate-200 bg-white text-slate-400 text-xs flex justify-between items-center">
          <span>&copy; 2026 ChikAI Diagnosis Systems. All rights reserved.</span>
          <div className="flex gap-4">
            <button className="hover:text-slate-600">Privacy Policy</button>
            <button className="hover:text-slate-600">Terms of Service</button>
          </div>
        </footer>
      </main>
    </div>
  );
}
