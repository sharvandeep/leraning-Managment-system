import { useCallback, useEffect, useMemo, useState } from "react";
import { authService } from "../services/authService";
import { AuthContext } from "./authContextValue";

const storageKey = "lms-auth-session";

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  useEffect(() => {
    const stored = window.localStorage.getItem(storageKey);
    if (stored) {
      setSession(JSON.parse(stored));
    }
    setIsBootstrapping(false);
  }, []);

  const persist = (nextSession) => {
    setSession(nextSession);
    window.localStorage.setItem(storageKey, JSON.stringify(nextSession));
  };

  const login = useCallback(async (credentials) => {
    const nextSession = await authService.login(credentials);
    persist(nextSession);
    return nextSession;
  }, []);

  const register = useCallback(async (payload) => {
    const nextSession = await authService.register(payload);
    persist(nextSession);
    return nextSession;
  }, []);

  const logout = useCallback(() => {
    setSession(null);
    window.localStorage.removeItem(storageKey);
  }, []);

  const value = useMemo(
    () => ({
      user: session?.user || null,
      token: session?.token || null,
      isAuthenticated: Boolean(session?.token),
      isBootstrapping,
      login,
      register,
      logout,
    }),
    [session, isBootstrapping, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
