import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Auth pages
import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';

// Route groups (hàm trả về fragment <Route>...)
import AdminRoutes from './AdminRoutes';
import UserRoutes from './UserRoutes';

// Other
import NotFound from '../pages/NotFound';

export default function AppRoutes({ onLogout }) {
  const { isAuthenticated, isAdmin, initialized } = useAuth();

  // Chờ init từ localStorage để tránh redirect sai lúc khởi tạo
  if (!initialized) return null;

  return (
    <Routes>
      {/* Auth */}
      <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/register" element={isAuthenticated ? <Navigate to="/" replace /> : <Register />} />

      {/* Gọi trực tiếp các hàm trả về Route elements */}
      {AdminRoutes({ onLogout, isAuthenticated, isAdmin })}
      {UserRoutes({ onLogout, isAuthenticated })}

      {/* Fallback */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}