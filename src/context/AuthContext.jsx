import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [token, setToken]     = useState(null);
  const [loading, setLoading] = useState(true);

  // On mount, restore from localStorage
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