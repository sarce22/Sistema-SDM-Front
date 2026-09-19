import api from './api';

export const getMeseraItems = async () => {
    try {
        const response = await api.get('/meseras');
        return response.data;
    } catch (error) {
        throw error.response?.data?.error || 'Error al obtener ítems de mesera';
    }
};

export const addMeseraItem = async (data) => {
    try {
        const response = await api.post('/meseras', data);
        return response.data;
    } catch (error) {
        throw error.response?.data?.error || 'Error al agregar ítem';
    }
};

export const updateMeseraItem = async (id, data) => {
    try {
        const response = await api.put(`/meseras/${id}`, data);
        return response.data;
    } catch (error) {
        throw error.response?.data?.error || 'Error al actualizar ítem';
    }
};

export const deleteMeseraItem = async (id) => {
    try {
        const response = await api.delete(`/meseras/${id}`);
        return response.data;
    } catch (error) {
        throw error.response?.data?.error || 'Error al eliminar ítem';
    }
};

export const toggleMeseraAlerta = async (id) => {
    try {
        const response = await api.put(`/meseras/${id}/alerta`);
        return response.data;
    } catch (error) {
        throw error.response?.data?.error || 'Error al cambiar estado de alerta';
    }
};
