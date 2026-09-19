import api from './api';

export const getAlertas = async () => {
    try {
        const response = await api.get('/alertas');
        return response.data;
    } catch (error) {
        throw error.response?.data?.error || 'Error al obtener alertas';
    }
};

export const markAlertaAsRead = async (id) => {
    try {
        const response = await api.put(`/alertas/${id}/leida`);
        return response.data;
    } catch (error) {
        throw error.response?.data?.error || 'Error al marcar alerta como leída';
    }
};

export const getUnreadAlertsCount = async () => {
    try {
        const response = await api.get('/alertas/count/unread');
        return response.data;
    } catch (error) {
        throw error.response?.data?.error || 'Error al obtener conteo de alertas';
    }
};

export const markAllAlertasAsRead = async () => {
    try {
        const response = await api.put('/alertas/leidas/todas');
        return response.data;
    } catch (error) {
        throw error.response?.data?.error || 'Error al marcar todas las alertas como leídas';
    }
};
