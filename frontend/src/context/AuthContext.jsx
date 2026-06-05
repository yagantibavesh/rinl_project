import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // 🚀 CRITICAL FIX: Initialize values synchronously from localStorage on boot!
  const [token, setToken] = useState(() => {
    return localStorage.getItem("rinl_token") || null;
  });

  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem("rinl_user");
    try {
      return storedUser ? JSON.parse(storedUser) : null;
    } catch {
      return null;
    }
  });

  // Because states are loaded synchronously above, loading can default to false!
  const [loading, setLoading] = useState(false);

  // We keep the useEffect clean just as a sync backup listener 
  useEffect(() => {
    const storedToken = localStorage.getItem("rinl_token");
    const storedUser  = localStorage.getItem("rinl_user");
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = (tokenVal, userData) => {
    localStorage.setItem("rinl_token", tokenVal);
    localStorage.setItem("rinl_user",  JSON.stringify(userData));
    setToken(tokenVal);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem("rinl_token");
    localStorage.removeItem("rinl_user");
    setToken(null);
    setUser(null);
  };

  const isAuthenticated = !!token;

  // Role helpers
  const isAdmin    = user?.role === "admin";
  const isManager  = user?.role === "manager" || user?.role === "hod" || isAdmin;
  const isEmployee = !!user;

  return (
    <AuthContext.Provider value={{
      user, token, loading,
      login, logout,
      isAuthenticated, isAdmin, isManager, isEmployee,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}