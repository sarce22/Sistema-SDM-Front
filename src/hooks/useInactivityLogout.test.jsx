import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import InactivityHandler from '../components/InactivityHandler';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

describe('useInactivityLogout / InactivityHandler Modal', () => {
    const TIMEOUT = 5 * 60 * 1000; // 5 minutos

    beforeEach(() => {
        vi.useFakeTimers();
        vi.clearAllMocks();
        localStorage.clear();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('no debe mostrar el modal si no hay usuario autenticado', () => {
        render(
            <MemoryRouter initialEntries={['/admin']}>
                <InactivityHandler />
            </MemoryRouter>
        );

        act(() => {
            vi.advanceTimersByTime(6 * 60 * 1000);
        });

        expect(screen.queryByText(/Sesión cerrada por inactividad/i)).not.toBeInTheDocument();
        expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('debe mostrar el modal tras cumplirse el tiempo de inactividad (5 min) y redirigir al hacer clic en Aceptar', () => {
        localStorage.setItem('token', 'fake-jwt');
        localStorage.setItem('user', JSON.stringify({ usuario: 'chef1', rol: 'Chef' }));

        render(
            <MemoryRouter initialEntries={['/chef']}>
                <InactivityHandler />
            </MemoryRouter>
        );

        // Avanzamos 4 minutos (aún no debe aparecer el modal)
        act(() => {
            vi.advanceTimersByTime(4 * 60 * 1000);
        });

        expect(screen.queryByText(/Sesión cerrada por inactividad/i)).not.toBeInTheDocument();
        expect(mockNavigate).not.toHaveBeenCalled();
        expect(localStorage.getItem('token')).toBe('fake-jwt');

        // Completamos los 5 minutos
        act(() => {
            vi.advanceTimersByTime(1 * 60 * 1000);
        });

        // Credenciales borradas
        expect(localStorage.getItem('token')).toBeNull();
        expect(localStorage.getItem('user')).toBeNull();

        // El modal debe estar en pantalla
        expect(screen.getByText('Sesión cerrada por inactividad')).toBeInTheDocument();
        expect(screen.getByText(/Tu sesión ha expirado porque no se registró actividad/i)).toBeInTheDocument();

        // El usuario hace clic en el botón de aceptar
        const acceptBtn = screen.getByRole('button', { name: /aceptar e ir al inicio de sesión/i });
        fireEvent.click(acceptBtn);

        expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true });
    });

    it('debe reiniciar el temporizador si el usuario interactúa antes del tiempo límite', () => {
        localStorage.setItem('token', 'fake-jwt');
        localStorage.setItem('user', JSON.stringify({ usuario: 'admin', rol: 'Admin' }));

        render(
            <MemoryRouter initialEntries={['/admin']}>
                <InactivityHandler timeoutMs={TIMEOUT} />
            </MemoryRouter>
        );

        // Pasan 4 minutos
        act(() => {
            vi.advanceTimersByTime(4 * 60 * 1000);
        });

        // Interacción del usuario
        act(() => {
            window.dispatchEvent(new MouseEvent('mousedown'));
        });

        // Pasan otros 4 minutos (total 8 min acumulados, pero solo 4 min desde la interacción)
        act(() => {
            vi.advanceTimersByTime(4 * 60 * 1000);
        });

        // El modal NO debe haber aparecido todavía
        expect(screen.queryByText(/Sesión cerrada por inactividad/i)).not.toBeInTheDocument();
        expect(localStorage.getItem('token')).toBe('fake-jwt');

        // Pasa 1 minuto más (total 5 min desde la interacción)
        act(() => {
            vi.advanceTimersByTime(1 * 60 * 1000);
        });

        // Ahora sí aparece el modal
        expect(screen.getByText('Sesión cerrada por inactividad')).toBeInTheDocument();
        expect(localStorage.getItem('token')).toBeNull();
    });
});
