import api from './api';

export const getChefItems = async (categoria) => {
    try {
        const response = await api.get(`/chef/${categoria.toLowerCase()}`);
        return response.data;
    } catch (error) {
        throw error.response?.data?.error || 'Error al obtener inventario del chef';
    }
};

export const addChefItem = async (categoria, data) => {
    try {
        const response = await api.post(`/chef/${categoria.toLowerCase()}`, data);
        return response.data;
    } catch (error) {
        throw error.response?.data?.error || 'Error al agregar ítem';
    }
};

export const updateChefItem = async (id, data) => {
    try {
        const response = await api.put(`/chef/item/${id}`, data);
        return response.data;
    } catch (error) {
        throw error.response?.data?.error || 'Error al actualizar ítem';
    }
};

export const deleteChefItem = async (id) => {
    try {
        const response = await api.delete(`/chef/item/${id}`);
        return response.data;
    } catch (error) {
        throw error.response?.data?.error || 'Error al eliminar ítem';
    }
};

export const toggleChefAlerta = async (id) => {
    try {
        const response = await api.put(`/chef/item/${id}/alerta`);
        return response.data;
    } catch (error) {
        throw error.response?.data?.error || 'Error al cambiar estado de alerta';
    }
};
