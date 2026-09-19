import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
});

// Interceptor to add JWT token to requests
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        
        const userStr = localStorage.getItem('user');
        if (userStr) {
            try {
                const user = JSON.parse(userStr);
                if (user.rol === 'Admin') {
                    const sedeId = localStorage.getItem('admin_sede_id');
                    if (sedeId) {
                        if (config.method === 'get' || config.method === 'delete') {
                            config.params = { ...config.params, sede_id: sedeId };
                        } else {
                            if (config.data instanceof FormData) {
                                config.data.append('sede_id', sedeId);
                            } else {
                                config.data = { ...config.data, sede_id: sedeId };
                            }
                        }
                    }
                }
            } catch (e) {
                console.error('Error parsing user from localStorage in interceptor', e);
            }
        }
        
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Interceptor to handle responses and common errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            // No redirigir si el error de 401 proviene del intento de login
            if (!error.config.url.includes('/auth/login')) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default api;
