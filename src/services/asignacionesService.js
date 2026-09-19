import api from './api';

export const getAsignaciones = async () => {
    try {
        const response = await api.get('/asignaciones');
        return response.data;
    } catch (error) {
        throw error.response?.data?.error || 'Error al obtener las asignaciones';
    }
};

export const saveAsignaciones = async (asignaciones) => {
    try {
        const response = await api.post('/asignaciones', { asignaciones });
        return response.data;
    } catch (error) {
        throw error.response?.data?.error || 'Error al guardar las asignaciones';
    }
};
