import { useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getCurrentUser } from '../services/authService';

const DEFAULT_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutos de inactividad
const THROTTLE_MS = 1000; // Throttling para eventos de alta frecuencia

/**
 * Hook para detectar inactividad del usuario y cerrar sesión automáticamente tras un tiempo límite.
 * Monitorea clics, teclas, movimientos del mouse, toques táctiles y scroll.
 * 
 * @param {number|Object} options - Milisegundos o configuración { timeoutMs, onTimeout }
 */
export const useInactivityLogout = (options = DEFAULT_TIMEOUT_MS) => {
    const config = typeof options === 'number' ? { timeoutMs: options } : (options || {});
    const timeoutMs = config.timeoutMs || DEFAULT_TIMEOUT_MS;
    const onTimeout = config.onTimeout;

    const navigate = useNavigate();
    const location = useLocation();
    const timerRef = useRef(null);
    const lastActivityRef = useRef(Date.now());

    const handleTimeout = useCallback(() => {
        const user = getCurrentUser();
        if (user && location.pathname !== '/login') {
            localStorage.removeItem('token');
            localStorage.removeItem('user');

            if (onTimeout) {
                onTimeout();
            } else {
                navigate('/login', { replace: true });
            }
        }
    }, [navigate, location.pathname, onTimeout]);

    const resetTimer = useCallback(() => {
        const now = Date.now();
        if (now - lastActivityRef.current < THROTTLE_MS && timerRef.current) {
            return;
        }
        lastActivityRef.current = now;

        if (timerRef.current) {
            clearTimeout(timerRef.current);
        }

        const user = getCurrentUser();
        if (user && location.pathname !== '/login') {
            timerRef.current = setTimeout(handleTimeout, timeoutMs);
        }
    }, [handleTimeout, timeoutMs, location.pathname]);

    useEffect(() => {
        const user = getCurrentUser();
        if (!user || location.pathname === '/login') {
            if (timerRef.current) {
                clearTimeout(timerRef.current);
                timerRef.current = null;
            }
            return;
        }

        timerRef.current = setTimeout(handleTimeout, timeoutMs);

        const events = ['mousedown', 'mousemove', 'keydown', 'touchstart', 'scroll', 'click'];
        const onUserActivity = () => resetTimer();

        events.forEach(eventName => {
            window.addEventListener(eventName, onUserActivity, { passive: true });
        });

        return () => {
            if (timerRef.current) {
                clearTimeout(timerRef.current);
            }
            events.forEach(eventName => {
                window.removeEventListener(eventName, onUserActivity);
            });
        };
    }, [handleTimeout, resetTimer, timeoutMs, location.pathname]);
};
