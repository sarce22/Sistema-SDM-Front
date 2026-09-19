import React from 'react';
import { Navigate } from 'react-router-dom';
import { getCurrentUser } from '../services/authService';

const ProtectedRoute = ({ children, allowedRoles }) => {
    const user = getCurrentUser();

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (allowedRoles && !allowedRoles.includes(user.rol)) {
        // Redirigir a su dashboard correspondiente o mostrar error
        switch (user.rol) {
            case 'Chef':
                return <Navigate to="/chef" replace />;
            case 'Mesera':
                return <Navigate to="/mesera" replace />;
            case 'Admin':
                return <Navigate to="/admin" replace />;
            default:
                return <Navigate to="/login" replace />;
        }
    }

    return children;
};

export default ProtectedRoute;
