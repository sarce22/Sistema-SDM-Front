import api from './api';

export const getUsuarios = async (sede_id) => {
    try {
        const query = sede_id ? `?sede_id=${sede_id}` : '';
        const response = await api.get(`/usuarios${query}`);
        return response.data;
    } catch (error) {
        throw error.response?.data?.error || 'Error al obtener usuarios';
    }
};

export const crearUsuario = async (data) => {
    try {
        const response = await api.post('/usuarios', data);
        return response.data;
    } catch (error) {
        throw error.response?.data?.error || 'Error al crear usuario';
    }
};

export const eliminarUsuario = async (id) => {
    try {
        const response = await api.delete(`/usuarios/${id}`);
        return response.data;
    } catch (error) {
        throw error.response?.data?.error || 'Error al eliminar usuario';
    }
};

export const editarUsuario = async (id, data) => {
    try {
        const response = await api.put(`/usuarios/${id}`, data);
        return response.data;
    } catch (error) {
        throw error.response?.data?.error || 'Error al editar usuario';
    }
};
