import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

const AuthContext = createContext();

const LS_TOKEN = 'token';
const LS_USER = 'user';

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null); // { id, email, role }
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const t = localStorage.getItem(LS_TOKEN);
    const u = localStorage.getItem(LS_USER);
    setToken(t || null);
    setUser(u ? JSON.parse(u) : null);
    setInitialized(true);
  }, []);

  const isAuthenticated = !!token;
  const isAdmin = user?.role === 'admin';

  const login = async ({ token: newToken, user: newUser }) => {
    localStorage.setItem(LS_TOKEN, newToken);
    localStorage.setItem(LS_USER, JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
    return new Promise((resolve) => setTimeout(resolve, 0));
  };

  const logout = () => {
    localStorage.removeItem(LS_TOKEN);
    localStorage.removeItem(LS_USER);
    setToken(null);
    setUser(null);
  };

  const value = useMemo(
    () => ({
      token,
      user,
      isAuthenticated,
      isAdmin,
      initialized,
      login,
      logout,
    }),
    [token, user, isAuthenticated, isAdmin, initialized]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}