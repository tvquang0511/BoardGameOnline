import React from "react";
import { BrowserRouter, useNavigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ToastProvider } from "./components/ui/toast-provider";
import AppRoutes from "./routes/AppRoutes";
import { authApi } from "./api/auth.api";

function AppInner() {
  const auth = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch {
      // ignore
    } finally {
      auth.logout();
      navigate("/login");
    }
  };

  return <AppRoutes onLogout={handleLogout} />;
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <AppInner />
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}
