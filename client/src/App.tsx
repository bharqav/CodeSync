import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Workspace from './pages/Workspace';
import WorkspaceDemo from './pages/WorkspaceDemo';
import { useAuthStore } from './stores/authStore';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const token = useAuthStore((state) => state.token);
    if (!token) return <Navigate to="/login" replace />;
    return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
    const token = useAuthStore((state) => state.token);
    if (token) return <Navigate to="/dashboard" replace />;
    return <>{children}</>;
}

function App() {
    return (
        <BrowserRouter>
            <Routes>
                {/* Landing page */}
                <Route path="/" element={<Landing />} />

                {/* Demo Workspace - No Auth */}
                <Route path="/demo" element={<WorkspaceDemo />} />

                {/* Public routes */}
                <Route
                    path="/login"
                    element={
                        <PublicRoute>
                            <Login />
                        </PublicRoute>
                    }
                />
                <Route
                    path="/signup"
                    element={
                        <PublicRoute>
                            <Signup />
                        </PublicRoute>
                    }
                />

                {/* Protected routes */}
                <Route
                    path="/dashboard"
                    element={
                        <ProtectedRoute>
                            <Dashboard />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/workspace/:code"
                    element={
                        <ProtectedRoute>
                            <Workspace />
                        </ProtectedRoute>
                    }
                />

                {/* Catch all */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
