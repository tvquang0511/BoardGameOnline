import React, { createContext, useContext, useEffect, useState } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const auth = localStorage.getItem('isAuthenticated');
    const admin = localStorage.getItem('isAdmin');
    if (auth === 'true') setIsAuthenticated(true);
    if (admin === 'true') setIsAdmin(true);
    setInitialized(true);
  }, []);

  const login = (admin = false) => {
    // Ghi localStorage + cập nhật state ngay lập tức,
    // trả Promise resolved sau một tick để caller có thể điều hướng an toàn.
    localStorage.setItem('isAuthenticated', 'true');
    localStorage.setItem('isAdmin', admin.toString());
    setIsAuthenticated(true);
    setIsAdmin(admin);

    return new Promise((resolve) => {
      setTimeout(resolve, 0);
    });
  };

  const logout = () => {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('isAdmin');
    setIsAuthenticated(false);
    setIsAdmin(false);
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isAdmin,
        initialized,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}