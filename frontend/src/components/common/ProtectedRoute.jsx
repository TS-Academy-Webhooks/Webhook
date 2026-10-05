// src/components/common/ProtectedRoute.jsx
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from "../../hooks/useAuth";
import { Loader } from './Loader';

export function ProtectedRoute({ requiredRole }) {
    const { isAuthenticated, loading, user } = useAuth();
    const location = useLocation();

    if (loading) return <Loader />;

    if (!isAuthenticated) {
        // Remember where they were headed, so Login can send them back
        // after a successful sign-in instead of always landing on /dashboard.
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (requiredRole && user?.role !== requiredRole) {
        return <Navigate to="/dashboard" replace />;
    }

    return <Outlet />;
}