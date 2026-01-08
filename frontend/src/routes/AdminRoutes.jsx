import React from 'react';
import { Route, Navigate } from 'react-router-dom';

import AdminDashboard from '../pages/admin/AdminDashboard';
import UserManagement from '../pages/admin/UserManagement';
import Statistics from '../pages/admin/Statistics';
import GameManagement from '../pages/admin/GameManagement';

/**
 * Trả về một React fragment chứa các <Route> cho nhóm /admin.
 * Lưu ý: đây là hàm trả về các Route elements (không dùng <AdminRoutes /> trực tiếp bên trong <Routes>)
 */
export default function AdminRoutes({ onLogout, isAuthenticated, isAdmin }) {
  return (
    <>
      <Route
        path="/admin"
        element={
          isAuthenticated && isAdmin ? (
            <AdminDashboard onLogout={onLogout} />
          ) : (
            <Navigate to="/" replace />
          )
        }
      />
      <Route
        path="/admin/users"
        element={
          isAuthenticated && isAdmin ? (
            <UserManagement onLogout={onLogout} />
          ) : (
            <Navigate to="/" replace />
          )
        }
      />
      <Route
        path="/admin/statistics"
        element={
          isAuthenticated && isAdmin ? (
            <Statistics onLogout={onLogout} />
          ) : (
            <Navigate to="/" replace />
          )
        }
      />
      <Route
        path="/admin/games"
        element={
          isAuthenticated && isAdmin ? (
            <GameManagement onLogout={onLogout} />
          ) : (
            <Navigate to="/" replace />
          )
        }
      />
    </>
  );
}