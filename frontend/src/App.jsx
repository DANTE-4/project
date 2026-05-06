// frontend/src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./store/AuthContext";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DiagnosisPage from "./pages/DiagnosisPage";
import HistoryPage from "./pages/HistoryPage";
import AdminPage from "./pages/AdminPage";
import Layout from "./components/Layout";

function ProtectedRoute({ children, requiredRole }) {
  const { user, isLoading } = useAuth();

  if (isLoading) return <div className="flex items-center justify-center h-screen">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (requiredRole && user.role !== requiredRole) return <Navigate to="/diagnose" replace />;

  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/diagnose" replace />} />
            <Route path="diagnose" element={<DiagnosisPage />} />
            <Route path="history" element={<HistoryPage />} />
            <Route
              path="admin"
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminPage />
                </ProtectedRoute>
              }
            />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
