// frontend/src/store/AuthContext.jsx
/**
 * Auth Context
 *
 * Security note: access_token is stored in module-level memory (NOT localStorage/sessionStorage).
 * This prevents XSS token theft. The refresh token lives in an httpOnly cookie.
 */
import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { authApi } from "../services/api";

const AuthContext = createContext(null);

// Module-level — survives re-renders, cleared on page reload (intentional)
let _accessToken = null;

export function getAccessToken() {
  return _accessToken;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const refreshTimerRef = useRef(null);

  const scheduleRefresh = useCallback((expiresInMs) => {
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    const delay = Math.max(expiresInMs - 60_000, 0);
    refreshTimerRef.current = setTimeout(silentRefresh, delay);
  }, []);

  const silentRefresh = useCallback(async () => {
    try {
      const data = await authApi.refresh();
      _accessToken = data.access_token;
      const payload = parseJwt(data.access_token);
      setUser({ id: payload.sub, role: payload.role });
      const expiresInMs = (payload.exp - Date.now() / 1000) * 1000;
      scheduleRefresh(expiresInMs);
    } catch {
      _accessToken = null;
      setUser(null);
    }
  }, [scheduleRefresh]);

  useEffect(() => {
    silentRefresh().finally(() => setIsLoading(false));
    return () => {
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    };
  }, [silentRefresh]);

  const login = useCallback(async (email, password) => {
    const data = await authApi.login(email, password);
    _accessToken = data.access_token;
    const payload = parseJwt(data.access_token);
    setUser({ id: payload.sub, role: payload.role });
    const expiresInMs = (payload.exp - Date.now() / 1000) * 1000;
    scheduleRefresh(expiresInMs);
  }, [scheduleRefresh]);

  const logout = useCallback(async () => {
    await authApi.logout();
    _accessToken = null;
    setUser(null);
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

function parseJwt(token) {
  const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
  return JSON.parse(atob(base64));
}
