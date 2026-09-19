import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Login from './Login';
import * as authService from '../services/authService';
import * as alerts from '../utils/alerts';

vi.mock('../services/authService', () => ({
    login: vi.fn(),
}));

vi.mock('../utils/alerts', () => ({
    showSuccess: vi.fn(),
    showError: vi.fn(),
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

describe('Página de Login', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
    });

    it('debe renderizar el título, campos de entrada y botón de iniciar sesión', () => {
        render(
            <MemoryRouter>
                <Login />
            </MemoryRouter>
        );

        expect(screen.getByText('SistemaSDM')).toBeInTheDocument();
        expect(screen.getByText('Usuario')).toBeInTheDocument();
        expect(screen.getByText('Contraseña (PIN)')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /iniciar sesión/i })).toBeInTheDocument();
    });

    it('debe permitir ingresar el PIN usando el teclado numérico en pantalla', () => {
        render(
            <MemoryRouter>
                <Login />
            </MemoryRouter>
        );

        // Click en los botones del teclado numérico 1, 2, 3
        const btn1 = screen.getByRole('button', { name: '1' });
        const btn2 = screen.getByRole('button', { name: '2' });
        const btn3 = screen.getByRole('button', { name: '3' });

        fireEvent.click(btn1);
        fireEvent.click(btn2);
        fireEvent.click(btn3);

        const pinInput = document.querySelector('input[type="password"]');
        expect(pinInput).toHaveValue('123');
    });

    it('debe permitir ingresar PIN con el teclado físico y resaltar visualmente el botón', () => {
        render(
            <MemoryRouter>
                <Login />
            </MemoryRouter>
        );

        const btn7 = screen.getByRole('button', { name: '7' });

        // Pulsamos la tecla '7' en el teclado físico
        fireEvent.keyDown(window, { key: '7' });

        const pinInput = document.querySelector('input[type="password"]');
        expect(pinInput).toHaveValue('7');
        expect(btn7).toHaveClass('active');

        // Pulsamos '8' en el teclado físico
        const btn8 = screen.getByRole('button', { name: '8' });
        fireEvent.keyDown(window, { key: '8' });

        expect(pinInput).toHaveValue('78');
        expect(btn8).toHaveClass('active');

        // Pulsamos Backspace para borrar
        fireEvent.keyDown(window, { key: 'Backspace' });
        expect(pinInput).toHaveValue('7');
    });

    it('debe mostrar error si se intenta enviar el formulario vacío', () => {
        render(
            <MemoryRouter>
                <Login />
            </MemoryRouter>
        );

        const submitBtn = screen.getByRole('button', { name: /iniciar sesión/i });
        fireEvent.click(submitBtn);

        expect(alerts.showError).toHaveBeenCalledWith('Por favor ingresa usuario y contraseña');
        expect(authService.login).not.toHaveBeenCalled();
    });

    it('debe llamar al servicio de login y redirigir al rol correspondiente al autenticar', async () => {
        authService.login.mockResolvedValueOnce({
            token: 'fake-jwt-token',
            user: { id: 1, usuario: 'adminUser', rol: 'Admin' }
        });

        render(
            <MemoryRouter>
                <Login />
            </MemoryRouter>
        );

        const userInput = document.querySelector('input[type="text"]');
        fireEvent.change(userInput, { target: { value: 'adminUser' } });

        const btn5 = screen.getByRole('button', { name: '5' });
        fireEvent.click(btn5);

        const submitBtn = screen.getByRole('button', { name: /iniciar sesión/i });
        await act(async () => {
            fireEvent.click(submitBtn);
        });

        await vi.waitFor(() => {
            expect(authService.login).toHaveBeenCalledWith('adminUser', '5');
            expect(alerts.showSuccess).toHaveBeenCalledWith(
                'Inicio de sesión exitoso',
                'Bienvenido al sistema, Admin!'
            );
            expect(mockNavigate).toHaveBeenCalledWith('/admin');
        });
    });
});
