import api from './api';

export const getSemanas = async () => {
    try {
        const response = await api.get('/propinas');
        return response.data;
    } catch (error) {
        throw error.response?.data?.error || 'Error al obtener semanas de propinas';
    }
};

export const getSemana = async (id) => {
    try {
        const response = await api.get(`/propinas/${id}`);
        return response.data;
    } catch (error) {
        throw error.response?.data?.error || 'Error al obtener detalles de la semana';
    }
};

export const createSemana = async (data) => {
    try {
        const response = await api.post('/propinas', data);
        return response.data;
    } catch (error) {
        throw error.response?.data?.error || 'Error al iniciar una nueva semana';
    }
};

export const updateSemana = async (id, data) => {
    try {
        const response = await api.put(`/propinas/${id}`, data);
        return response.data;
    } catch (error) {
        throw error.response?.data?.error || 'Error al actualizar la semana';
    }
};

export const updateDistribucion = async (id_semana, id_trabajador, data) => {
    try {
        const response = await api.put(`/propinas/${id_semana}/distribucion/${id_trabajador}`, data);
        return response.data;
    } catch (error) {
        throw error.response?.data?.error || 'Error al actualizar distribución';
    }
};
