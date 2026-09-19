import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import Login from './pages/Login';
import AdminSedes from './pages/AdminSedes';
import AdminMenu from './pages/AdminMenu';
import AdminAlerts from './pages/AdminAlerts';
import ChefMenu from './pages/ChefMenu';
import ChefInventory from './pages/ChefInventory';
import MeseraMenu from './pages/MeseraMenu';
import MeseraInventory from './pages/MeseraInventory';
import AdminPropinas from './pages/AdminPropinas';
import PropinasCalculadora from './pages/PropinasCalculadora';
import AdminUsuarios from './pages/AdminUsuarios';
import TableroAsignaciones from './pages/TableroAsignaciones';
import ProtectedRoute from './components/ProtectedRoute';
import InactivityHandler from './components/InactivityHandler';

function App() {
    return (
        <Router>
            <Toaster position="top-center" richColors closeButton />
            <InactivityHandler />
            <Routes>
                <Route path="/login" element={<Login />} />

                <Route path="/admin" element={
                    <ProtectedRoute allowedRoles={['Admin']}>
                        <AdminSedes />
                    </ProtectedRoute>
                } />

                <Route path="/admin/menu" element={
                    <ProtectedRoute allowedRoles={['Admin']}>
                        <AdminMenu />
                    </ProtectedRoute>
                } />

                <Route path="/admin/alertas" element={
                    <ProtectedRoute allowedRoles={['Admin']}>
                        <AdminAlerts />
                    </ProtectedRoute>
                } />

                <Route path="/admin/usuarios" element={
                    <ProtectedRoute allowedRoles={['Admin']}>
                        <AdminUsuarios />
                    </ProtectedRoute>
                } />

                <Route path="/propinas" element={
                    <ProtectedRoute allowedRoles={['Admin', 'Mesera']}>
                        <AdminPropinas />
                    </ProtectedRoute>
                } />

                <Route path="/propinas/:id" element={
                    <ProtectedRoute allowedRoles={['Admin', 'Mesera']}>
                        <PropinasCalculadora />
                    </ProtectedRoute>
                } />

                <Route path="/chef" element={
                    <ProtectedRoute allowedRoles={['Admin', 'Chef']}>
                        <ChefMenu />
                    </ProtectedRoute>
                } />

                <Route path="/chef/inventario/:categoria" element={
                    <ProtectedRoute allowedRoles={['Admin', 'Chef']}>
                        <ChefInventory />
                    </ProtectedRoute>
                } />

                <Route path="/mesera" element={
                    <ProtectedRoute allowedRoles={['Admin', 'Mesera']}>
                        <MeseraMenu />
                    </ProtectedRoute>
                } />

                <Route path="/mesera/inventario" element={
                    <ProtectedRoute allowedRoles={['Admin', 'Mesera']}>
                        <MeseraInventory />
                    </ProtectedRoute>
                } />

                <Route path="/asignaciones" element={
                    <ProtectedRoute allowedRoles={['Admin', 'Mesera', 'Chef']}>
                        <TableroAsignaciones />
                    </ProtectedRoute>
                } />

                <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
        </Router>
    );
}

export default App;
