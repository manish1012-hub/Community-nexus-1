import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { Patients } from './pages/Patients';
import { PatientDetail } from './pages/PatientDetail';
import { Medications } from './pages/Medications';
import { ADRMonitoring } from './pages/ADRMonitoring';
import { MLAnalytics } from './pages/MLAnalytics';
import { IoTSimulator } from './pages/IoTSimulator';
import { Reports } from './pages/Reports';
import { AdminPanel } from './pages/AdminPanel';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading, role } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="patients" element={<Patients />} />
            <Route path="patients/:id" element={<PatientDetail />} />
            <Route path="medications" element={<Medications />} />
            <Route path="adr-monitoring" element={<ADRMonitoring />} />
            <Route
              path="ml-analytics"
              element={
                <ProtectedRoute allowedRoles={['admin', 'doctor', 'pharmacist', 'researcher']}>
                  <MLAnalytics />
                </ProtectedRoute>
              }
            />
            <Route path="iot-simulator" element={<IoTSimulator />} />
            <Route
              path="reports"
              element={
                <ProtectedRoute allowedRoles={['admin', 'doctor', 'pharmacist', 'researcher']}>
                  <Reports />
                </ProtectedRoute>
              }
            />
            <Route
              path="admin"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminPanel />
                </ProtectedRoute>
              }
            />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
