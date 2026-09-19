import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';

describe('Componente ProtectedRoute', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it('debe redirigir a /login si no hay usuario autenticado', () => {
        render(
            <MemoryRouter initialEntries={['/admin']}>
                <Routes>
                    <Route
                        path="/admin"
                        element={
                            <ProtectedRoute allowedRoles={['Admin']}>
                                <div>Panel Admin</div>
                            </ProtectedRoute>
                        }
                    />
                    <Route path="/login" element={<div>Página de Login</div>} />
                </Routes>
            </MemoryRouter>
        );

        expect(screen.queryByText('Panel Admin')).not.toBeInTheDocument();
        expect(screen.getByText('Página de Login')).toBeInTheDocument();
    });

    it('debe redirigir al dashboard correspondiente si el rol no está permitido', () => {
        // Simulamos un usuario con rol 'Chef' intentando entrar a ruta de mesera
        localStorage.setItem('user', JSON.stringify({ usuario: 'chef1', rol: 'Chef' }));

        render(
            <MemoryRouter initialEntries={['/mesera']}>
                <Routes>
                    <Route
                        path="/mesera"
                        element={
                            <ProtectedRoute allowedRoles={['Mesera']}>
                                <div>Panel Mesera</div>
                            </ProtectedRoute>
                        }
                    />
                    <Route path="/chef" element={<div>Dashboard de Cocina</div>} />
                </Routes>
            </MemoryRouter>
        );

        expect(screen.queryByText('Panel Mesera')).not.toBeInTheDocument();
        expect(screen.getByText('Dashboard de Cocina')).toBeInTheDocument();
    });

    it('debe renderizar el contenido hijo si el usuario tiene un rol permitido', () => {
        localStorage.setItem('user', JSON.stringify({ usuario: 'admin', rol: 'Admin' }));

        render(
            <MemoryRouter initialEntries={['/admin']}>
                <Routes>
                    <Route
                        path="/admin"
                        element={
                            <ProtectedRoute allowedRoles={['Admin']}>
                                <div>Panel de Administración</div>
                            </ProtectedRoute>
                        }
                    />
                </Routes>
            </MemoryRouter>
        );

        expect(screen.getByText('Panel de Administración')).toBeInTheDocument();
    });
});
