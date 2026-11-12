import React from 'react';
import { Navigate } from 'react-router-dom';
import { getCurrentUser } from '../services/authService';
import { obtenerConfigSedeLocal } from '../services/sedesService';

const ProtectedRoute = ({ children, allowedRoles, requiredModule }) => {
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

    if (requiredModule) {
        const configSede = obtenerConfigSedeLocal();
        if (Number(configSede[requiredModule]) === 0) {
            const fallbackPath = user.rol === 'Admin' ? '/admin/menu' : user.rol === 'Chef' ? '/chef' : '/mesera';
            return <Navigate to={fallbackPath} replace />;
        }
    }

    return children;
};

export default ProtectedRoute;
