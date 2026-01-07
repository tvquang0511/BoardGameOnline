import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/authContext';

// Auth pages
import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';

// Client pages
import Dashboard from '../pages/client/Dashboard';
import GameSelection from '../pages/client/GameSelection';
import GamePlay from '../pages/client/GamePlay';
import Profile from '../pages/client/Profile';
import Friends from '../pages/client/Friends';
import Messages from '../pages/client/Messages';
import Achievements from '../pages/client/Achievements';
import Ranking from '../pages/client/Ranking';
import Settings from '../pages/client/Settings';

// Admin pages
import AdminDashboard from '../pages/admin/AdminDashboard';
import UserManagement from '../pages/admin/UserManagement';
import Statistics from '../pages/admin/Statistics';
import GameManagement from '../pages/admin/GameManagement';

// Other
import NotFound from '../pages/NotFound';

export default function AppRoutes({ onLogout }) {
  const { isAuthenticated, isAdmin, initialized } = useAuth();

  // Chờ init từ localStorage để tránh redirect sai lúc khởi tạo
  if (!initialized) return null;

  return (
    <Routes>
      {/* Auth */}
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/" replace /> : <Login />}
      />
      <Route
        path="/register"
        element={isAuthenticated ? <Navigate to="/" replace /> : <Register />}
      />

      {/* Admin group - nested routes under /admin */}
      <Route path="/admin">
        <Route
          index
          element={
            isAuthenticated && isAdmin ? (
              <AdminDashboard onLogout={onLogout} />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route
          path="users"
          element={
            isAuthenticated && isAdmin ? (
              <UserManagement onLogout={onLogout} />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route
          path="statistics"
          element={
            isAuthenticated && isAdmin ? (
              <Statistics onLogout={onLogout} />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route
          path="games"
          element={
            isAuthenticated && isAdmin ? (
              <GameManagement onLogout={onLogout} />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
      </Route>

      {/* Client / user routes (nested under /) */}
      <Route path="/">
        <Route
          index
          element={
            isAuthenticated ? <Dashboard onLogout={onLogout} /> : <Navigate to="/login" replace />
          }
        />
        <Route
          path="games"
          element={isAuthenticated ? <GameSelection onLogout={onLogout} /> : <Navigate to="/login" replace />}
        />
        <Route
          path="game/:gameId"
          element={isAuthenticated ? <GamePlay onLogout={onLogout} /> : <Navigate to="/login" replace />}
        />
        <Route
          path="profile"
          element={isAuthenticated ? <Profile onLogout={onLogout} /> : <Navigate to="/login" replace />}
        />
        <Route
          path="friends"
          element={isAuthenticated ? <Friends onLogout={onLogout} /> : <Navigate to="/login" replace />}
        />
        <Route
          path="messages"
          element={isAuthenticated ? <Messages onLogout={onLogout} /> : <Navigate to="/login" replace />}
        />
        <Route
          path="achievements"
          element={isAuthenticated ? <Achievements onLogout={onLogout} /> : <Navigate to="/login" replace />}
        />
        <Route
          path="ranking"
          element={isAuthenticated ? <Ranking onLogout={onLogout} /> : <Navigate to="/login" replace />}
        />
        <Route
          path="settings"
          element={isAuthenticated ? <Settings onLogout={onLogout} /> : <Navigate to="/login" replace />}
        />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}