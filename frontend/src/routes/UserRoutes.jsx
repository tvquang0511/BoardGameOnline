import React from 'react';
import { Route, Navigate } from 'react-router-dom';

import Dashboard from '../pages/client/Dashboard';

// ✅ NEW PAGES
import GamesPage from '../pages/games/GamesPage';
import GameShell from '../pages/games/GameShell';

import Profile from '../pages/client/Profile';
import Friends from '../pages/client/Friends';
import Messages from '../pages/client/Messages';
import Achievements from '../pages/client/Achievements';
import Ranking from '../pages/client/Ranking';
import Settings from '../pages/client/Settings';

export default function UserRoutes({ onLogout, isAuthenticated }) {
  return (
    <>
      <Route
        path="/"
        index
        element={isAuthenticated ? <Dashboard onLogout={onLogout} /> : <Navigate to="/login" replace />}
      />

      {/* ✅ replace /games */}
      <Route
        path="/games"
        element={isAuthenticated ? <GamesPage onLogout={onLogout} /> : <Navigate to="/login" replace />}
      />

      {/* ✅ replace /game/:gameId */}
      <Route
        path="/game/:gameId"
        element={isAuthenticated ? <GameShell onLogout={onLogout} /> : <Navigate to="/login" replace />}
      />

      <Route
        path="/profile"
        element={isAuthenticated ? <Profile onLogout={onLogout} /> : <Navigate to="/login" replace />}
      />
      <Route
        path="/friends"
        element={isAuthenticated ? <Friends onLogout={onLogout} /> : <Navigate to="/login" replace />}
      />
      <Route
        path="/messages"
        element={isAuthenticated ? <Messages onLogout={onLogout} /> : <Navigate to="/login" replace />}
      />
      <Route
        path="/achievements"
        element={isAuthenticated ? <Achievements onLogout={onLogout} /> : <Navigate to="/login" replace />}
      />
      <Route
        path="/ranking"
        element={isAuthenticated ? <Ranking onLogout={onLogout} /> : <Navigate to="/login" replace />}
      />
      <Route
        path="/settings"
        element={isAuthenticated ? <Settings onLogout={onLogout} /> : <Navigate to="/login" replace />}
      />
    </>
  );
}