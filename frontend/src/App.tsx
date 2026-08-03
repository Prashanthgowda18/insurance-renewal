import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './components/Toast';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Settings } from './pages/Settings';
import { Customers } from './pages/Customers';
import { CustomerProfile } from './pages/CustomerProfile';
import { Vehicles } from './pages/Vehicles';
import { Policies } from './pages/Policies';
import { Calendar } from './pages/Calendar';
import { Reports } from './pages/Reports';
import { ActivityLogs } from './pages/ActivityLogs';
import { AddCustomer } from './pages/AddCustomer';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Loader2 } from 'lucide-react';

// Protected Route Guard
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-app flex flex-col items-center justify-center gap-4">
        <div className="w-10 h-10 rounded-2xl bg-brand-600/20 border border-brand-600/30 flex items-center justify-center">
          <Loader2 className="w-5 h-5 text-brand-400 animate-spin" />
        </div>
        <p className="text-sm text-text-muted font-medium tracking-wide">Initializing session...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// Wrap a page with the shared Layout
const WithLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRoute>
    <Layout>
      {children}
    </Layout>
  </ProtectedRoute>
);

const AppRoutes: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/login" element={<Login />} />

        {/* Protected — all wrapped in shared Layout */}
        <Route path="/"                element={<WithLayout><Dashboard /></WithLayout>} />
        <Route path="/add-customer"   element={<WithLayout><AddCustomer /></WithLayout>} />
        <Route path="/customers"       element={<WithLayout><Customers /></WithLayout>} />
        <Route path="/customers/:id"   element={<WithLayout><CustomerProfile /></WithLayout>} />
        <Route path="/vehicles"        element={<WithLayout><Vehicles /></WithLayout>} />
        <Route path="/policies"        element={<WithLayout><Policies /></WithLayout>} />
        <Route path="/renewals"        element={<WithLayout><Policies /></WithLayout>} />
        <Route path="/calendar"        element={<WithLayout><Calendar /></WithLayout>} />
        <Route path="/reports"         element={<WithLayout><Reports /></WithLayout>} />
        <Route path="/activity-logs"   element={<WithLayout><ActivityLogs /></WithLayout>} />
        <Route path="/settings"        element={<WithLayout><Settings /></WithLayout>} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ToastProvider>
          <AppRoutes />
        </ToastProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
