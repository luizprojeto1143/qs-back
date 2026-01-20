import { Navigate, Outlet } from 'react-router-dom';

interface ProtectedRouteProps {
    allowedRoles?: string[];
}

export const ProtectedRoute = ({ allowedRoles }: ProtectedRouteProps) => {
    const userStr = localStorage.getItem('user');
    let user = null;

    if (userStr) {
        try {
            user = JSON.parse(userStr);
        } catch (e) {
            console.error('Invalid user data', e);
        }
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
        // Redirect based on role defaults if trying to access restricted area
        if (user.role === 'RH') return <Navigate to="/rh" replace />;
        if (['COLABORADOR', 'LIDER'].includes(user.role)) return <Navigate to="/app" replace />;
        return <Navigate to="/dashboard" replace />;
    }

    return <Outlet />;
};
