import api from './api';

export const login = async (usuario, password) => {
    try {
        const response = await api.post(`/auth/login`, { usuario, password });
        if (response.data.token) {
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('user', JSON.stringify(response.data.user)); // contains id, rol, usuario
        }
        return response.data;
    } catch (error) {
        throw error.response?.data?.error || 'Error al conectar con el servidor';
    }
};

export const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
};

export const getCurrentUser = () => {
    const userStr = localStorage.getItem('user');
    if (userStr) return JSON.parse(userStr);
    return null;
};
