import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './contexts/AppContext';
import Landing from './pages/Landing';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import Send from './pages/Send';
import Claim from './pages/Claim';
import Withdraw from './pages/Withdraw';
import History from './pages/History';
import Insights from './pages/Insights';
import BankEdit from './pages/BankEdit';
import Settings from './pages/Settings';
import TransactionDetail from './pages/TransactionDetail';
import Profile from './pages/Profile';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useApp();
  const [authFailed, setAuthFailed] = useState(false);

  // Firebase unreachable / network offline: hard-redirect after 3s so we never
  // get stuck on a spinner or accidentally show the dashboard to unauthenticated users
  useEffect(() => {
    if (isLoading) {
      const timer = setTimeout(() => setAuthFailed(true), 3000);
      return () => clearTimeout(timer);
    } else {
      setAuthFailed(false);
    }
  }, [isLoading]);

  if (isLoading && !authFailed) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public — always show landing. Get Started → /dashboard (seeds demo data) */}
      <Route path="/" element={<Landing />} />
      <Route path="/auth" element={<Auth />} />

      {/* Protected — App Shell */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/send"
        element={
          <ProtectedRoute>
            <Send />
          </ProtectedRoute>
        }
      />
      <Route
        path="/history"
        element={
          <ProtectedRoute>
            <History />
          </ProtectedRoute>
        }
      />
      <Route
        path="/insights"
        element={
          <ProtectedRoute>
            <Insights />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />

      {/* Claim — Public (recipient clicks link) */}
      <Route path="/claim/:id" element={<Claim />} />
      <Route path="/claim/:id/withdraw" element={<Withdraw />} />

      {/* Transaction Detail */}
      <Route
        path="/transaction/:id"
        element={
          <ProtectedRoute>
            <TransactionDetail />
          </ProtectedRoute>
        }
      />

      {/* Settings Pages */}
      <Route
        path="/settings/bank"
        element={
          <ProtectedRoute>
            <BankEdit />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings/:page"
        element={
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        }
      />

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <AppRoutes />
      </AppProvider>
    </BrowserRouter>
  );
}
