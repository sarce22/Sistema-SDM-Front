import api from './api';

export const MODULOS_SEDE = [
    {
        key: 'mod_meseras',
        label: 'Inventario Meseras',
        shortLabel: 'Meseras',
        description: 'Stock general de bebidas, salón y precios'
    },
    {
        key: 'mod_chef',
        label: 'Inventario Chef',
        shortLabel: 'Chef',
        description: 'Control de insumos de cocina (verduras y pescados)'
    },
    {
        key: 'mod_alertas',
        label: 'Alertas del Sistema',
        shortLabel: 'Alertas',
        description: 'Notificaciones automáticas por bajo stock y avisos'
    },
    {
        key: 'mod_propinas',
        label: 'Gestión de Propinas',
        shortLabel: 'Propinas',
        description: 'Liquidación y distribución semanal de propinas'
    },
    {
        key: 'mod_accesos',
        label: 'Accesos del Sistema',
        shortLabel: 'Accesos',
        description: 'Administración de cuentas y permisos de usuarios'
    }
];

export const DEFAULT_SEDE_CONFIG = {
    mod_meseras: 1,
    mod_chef: 1,
    mod_alertas: 1,
    mod_propinas: 1,
    mod_accesos: 1
};

export const getSedes = async () => {
    const response = await api.get('/sedes');
    return response.data;
};

export const getSedeById = async (id) => {
    const response = await api.get(`/sedes/${id}`);
    return response.data;
};

export const crearSede = async (sedeData) => {
    const response = await api.post('/sedes', sedeData);
    return response.data;
};

export const actualizarSede = async (id, sedeData) => {
    const response = await api.put(`/sedes/${id}`, sedeData);
    return response.data;
};

export const eliminarSede = async (id) => {
    const response = await api.delete(`/sedes/${id}`);
    return response.data;
};

export const guardarSedeActivaLocal = (sede) => {
    if (!sede) return;
    localStorage.setItem('admin_sede_id', sede.id);
    localStorage.setItem('admin_sede_name', sede.nombre);
    localStorage.setItem('admin_sede_config', JSON.stringify({
        mod_meseras: sede.mod_meseras ?? 1,
        mod_chef: sede.mod_chef ?? 1,
        mod_alertas: sede.mod_alertas ?? 1,
        mod_propinas: sede.mod_propinas ?? 1,
        mod_accesos: sede.mod_accesos ?? 1
    }));
};

export const obtenerConfigSedeLocal = () => {
    try {
        const raw = localStorage.getItem('admin_sede_config');
        if (!raw) return { ...DEFAULT_SEDE_CONFIG };
        return { ...DEFAULT_SEDE_CONFIG, ...JSON.parse(raw) };
    } catch {
        return { ...DEFAULT_SEDE_CONFIG };
    }
};
