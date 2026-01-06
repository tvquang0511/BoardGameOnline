import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

// Client Pages
import Dashboard from './pages/client/Dashboard';
import GameSelection from './pages/client/GameSelection';
import GamePlay from './pages/client/GamePlay';
import Profile from './pages/client/Profile';
import Friends from './pages/client/Friends';
import Messages from './pages/client/Messages';
import Achievements from './pages/client/Achievements';
import Ranking from './pages/client/Ranking';
import Settings from './pages/client/Settings';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import UserManagement from './pages/admin/UserManagement';
import Statistics from './pages/admin/Statistics';
import GameManagement from './pages/admin/GameManagement';

// Other Pages
import NotFound from './pages/NotFound';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Check authentication status from localStorage
    const auth = localStorage.getItem('isAuthenticated');
    const admin = localStorage.getItem('isAdmin');
    if (auth === 'true') {
      setIsAuthenticated(true);
    }
    if (admin === 'true') {
      setIsAdmin(true);
    }
  }, []);

  const handleLogin = (admin = false) => {
    setIsAuthenticated(true);
    setIsAdmin(admin);
    localStorage.setItem('isAuthenticated', 'true');
    localStorage.setItem('isAdmin', admin.toString());
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setIsAdmin(false);
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('isAdmin');
  };

  return (
    <BrowserRouter>
      <Routes>
        {/* Auth Routes */}
        <Route 
          path="/login" 
          element={isAuthenticated ? <Navigate to="/" /> : <Login onLogin={handleLogin} />} 
        />
        <Route 
          path="/register" 
          element={isAuthenticated ? <Navigate to="/" /> : <Register />} 
        />

        {/* Client Routes */}
        <Route 
          path="/" 
          element={isAuthenticated ? <Dashboard onLogout={handleLogout} /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/games" 
          element={isAuthenticated ? <GameSelection onLogout={handleLogout} /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/game/:gameId" 
          element={isAuthenticated ? <GamePlay onLogout={handleLogout} /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/profile" 
          element={isAuthenticated ? <Profile onLogout={handleLogout} /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/friends" 
          element={isAuthenticated ? <Friends onLogout={handleLogout} /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/messages" 
          element={isAuthenticated ? <Messages onLogout={handleLogout} /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/achievements" 
          element={isAuthenticated ? <Achievements onLogout={handleLogout} /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/ranking" 
          element={isAuthenticated ? <Ranking onLogout={handleLogout} /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/settings" 
          element={isAuthenticated ? <Settings onLogout={handleLogout} /> : <Navigate to="/login" />} 
        />

        {/* Admin Routes */}
        <Route 
          path="/admin" 
          element={isAuthenticated && isAdmin ? <AdminDashboard onLogout={handleLogout} /> : <Navigate to="/" />} 
        />
        <Route 
          path="/admin/users" 
          element={isAuthenticated && isAdmin ? <UserManagement onLogout={handleLogout} /> : <Navigate to="/" />} 
        />
        <Route 
          path="/admin/statistics" 
          element={isAuthenticated && isAdmin ? <Statistics onLogout={handleLogout} /> : <Navigate to="/" />} 
        />
        <Route 
          path="/admin/games" 
          element={isAuthenticated && isAdmin ? <GameManagement onLogout={handleLogout} /> : <Navigate to="/" />} 
        />

        {/* 404 Page */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;