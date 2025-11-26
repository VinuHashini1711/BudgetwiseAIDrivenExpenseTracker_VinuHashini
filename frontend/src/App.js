import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Budgets from './pages/Budgets';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import AIInsights from './pages/AIInsights';
import Goals from './pages/Goals';
import Community from './pages/Community';
import Welcome from './pages/Welcome';
import Sidebar from './components/Sidebar';
import ProtectedRoute from './components/ProtectedRoute';
import { useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { TransactionProvider } from './context/TransactionContext';

function AppContent() {
  const { user } = useAuth();
  const location = useLocation();

  // Pages where Sidebar should be hidden
  const noSidebarRoutes = ['/login', '/register', '/welcome', '/'];

  // Force redirect to Welcome/Home page unless user is authenticated
  // If not authenticated, ALWAYS redirect to home (/) first
  if (!user && location.pathname !== '/' && location.pathname !== '/login' && location.pathname !== '/register') {
    return (
      <div className="app">
        <div className="container">
          <Routes>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      {/* ✅ Sidebar visible only when user logged in AND not on auth pages */}
      {user && !noSidebarRoutes.includes(location.pathname) && <Sidebar />}

      <div className="container">
        <Routes>
          {/* Root path - Shows Welcome if not authenticated, Dashboard if authenticated */}
          <Route
            path="/"
            element={
              user
                ? <Navigate to="/dashboard" replace />
                : <Welcome />
            }
          />

          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected Routes */}
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/transactions" element={<ProtectedRoute><Transactions /></ProtectedRoute>} />
          <Route path="/budgets" element={<ProtectedRoute><Budgets /></ProtectedRoute>} />
          <Route path="/goals" element={<ProtectedRoute><Goals /></ProtectedRoute>} />
          <Route path="/ai-insights" element={<ProtectedRoute><AIInsights /></ProtectedRoute>} />
          <Route path="/community" element={<ProtectedRoute><Community /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />

          {/* Fallback - Redirect any unknown routes to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <TransactionProvider>
        <AppContent />
      </TransactionProvider>
    </ThemeProvider>
  );
}

export default App;
