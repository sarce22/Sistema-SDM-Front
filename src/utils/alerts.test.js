import { describe, it, expect, vi, beforeEach } from 'vitest';
import { showSuccess, showError, showWarning, showInfo, toast } from './alerts';

vi.mock('sonner', () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
        warning: vi.fn(),
        info: vi.fn(),
    },
}));

describe('Utilidades de Alertas (Sonner Wrapper)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('showSuccess debe llamar a toast.success con título y descripción', () => {
        showSuccess('Operación exitosa', 'Todo se guardó correctamente');
        expect(toast.success).toHaveBeenCalledWith('Operación exitosa', {
            description: 'Todo se guardó correctamente',
        });
    });

    it('showSuccess debe omitir descripción si no se pasa', () => {
        showSuccess('Listo');
        expect(toast.success).toHaveBeenCalledWith('Listo', {
            description: undefined,
        });
    });

    it('showError debe llamar a toast.error extrayendo el mensaje de error', () => {
        showError('Fallo al guardar', { message: 'Error de red' });
        expect(toast.error).toHaveBeenCalledWith('Fallo al guardar', {
            description: 'Error de red',
        });
    });

    it('showWarning debe llamar a toast.warning con los parámetros correspondientes', () => {
        showWarning('Atención', 'Stock por debajo de 5');
        expect(toast.warning).toHaveBeenCalledWith('Atención', {
            description: 'Stock por debajo de 5',
        });
    });

    it('showInfo debe llamar a toast.info', () => {
        showInfo('Información', 'Nueva asignación disponible');
        expect(toast.info).toHaveBeenCalledWith('Información', {
            description: 'Nueva asignación disponible',
        });
    });
});
