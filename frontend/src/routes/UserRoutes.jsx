import React from 'react';
import { Route, Navigate } from 'react-router-dom';

import Dashboard from '../pages/client/Dashboard';

import GamesPage from '../pages/games';
import Profile from '../pages/client/Profile';
import Friends from '../pages/client/Friends';
import Messages from '../pages/client/Messages';
import Achievements from '../pages/client/Achievements';
import Ranking from '../pages/client/Ranking';
import EditProfile from '../pages/client/EditProfile';
import AppearanceSettings from "../pages/client/AppearanceSettings";


export default function UserRoutes({ onLogout, isAuthenticated }) {
  return (
    <>
      <Route
        path="/"
        index
        element={isAuthenticated ? <Dashboard onLogout={onLogout} /> : <Navigate to="/login" replace />}
      />

      <Route
        path="/games"
        element={isAuthenticated ? <GamesPage onLogout={onLogout} /> : <Navigate to="/login" replace />}
      />

      {/* Bạn có thể xoá route /game/:gameId vì theo đề chọn game nằm trên bàn */}
      {/* <Route path="/game/:gameId" ... /> */}

      <Route path="/profile" element={isAuthenticated ? <Profile onLogout={onLogout} /> : <Navigate to="/login" replace />} />
      <Route path="/friends" element={isAuthenticated ? <Friends onLogout={onLogout} /> : <Navigate to="/login" replace />} />
      <Route path="/messages" element={isAuthenticated ? <Messages onLogout={onLogout} /> : <Navigate to="/login" replace />} />
      <Route path="/achievements" element={isAuthenticated ? <Achievements onLogout={onLogout} /> : <Navigate to="/login" replace />} />
      <Route path="/ranking" element={isAuthenticated ? <Ranking onLogout={onLogout} /> : <Navigate to="/login" replace />} />
      <Route path="/profile/edit" element={isAuthenticated ? <EditProfile onLogout={onLogout} /> : <Navigate to="/login" replace />} />
      <Route path="/appearance" element={isAuthenticated ? <AppearanceSettings onLogout={onLogout} /> : <Navigate to="/login" replace />} />
    </>
  );
}