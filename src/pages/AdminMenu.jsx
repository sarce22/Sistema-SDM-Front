import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { Bell, Users, ChefHat, Calculator, Key, ArrowLeft } from 'lucide-react';
import { getUnreadAlertsCount } from '../services/alertaService';
import {
    getSedeById,
    guardarSedeActivaLocal,
    obtenerConfigSedeLocal
} from '../services/sedesService';

const AdminMenu = () => {
    const navigate = useNavigate();
    const [unreadCount, setUnreadCount] = useState(0);
    const [sedeName, setSedeName] = useState(localStorage.getItem('admin_sede_name') || 'Sede Principal');
    const [configSede, setConfigSede] = useState(() => obtenerConfigSedeLocal());

    useEffect(() => {
        const inicializarMenuSede = async () => {
            const sedeId = localStorage.getItem('admin_sede_id') || 1;
            let cfgActual = obtenerConfigSedeLocal();

            try {
                const sedeData = await getSedeById(sedeId);
                if (sedeData) {
                    guardarSedeActivaLocal(sedeData);
                    setSedeName(sedeData.nombre);
                    cfgActual = {
                        mod_meseras: sedeData.mod_meseras ?? 1,
                        mod_chef: sedeData.mod_chef ?? 1,
                        mod_alertas: sedeData.mod_alertas ?? 1,
                        mod_propinas: sedeData.mod_propinas ?? 1,
                        mod_accesos: sedeData.mod_accesos ?? 1
                    };
                    setConfigSede(cfgActual);
                }
            } catch (error) {
                console.error('Error sincronizando configuración de sede:', error);
            }

            if (Number(cfgActual.mod_alertas) === 1) {
                try {
                    const data = await getUnreadAlertsCount();
                    setUnreadCount(data.unreadCount);
                } catch (error) {
                    console.error('Error al obtener conteo de alertas:', error);
                }
            }
        };

        inicializarMenuSede();
    }, []);

    return (
        <Layout title={`Menú del Administrador - ${sedeName}`}>
            <div className="dashboard-header" style={{ marginBottom: '24px' }}>
                <button className="btn-secondary" onClick={() => navigate('/admin')}>
                    <ArrowLeft size={16} />
                    <span>Cambiar o Configurar Sede</span>
                </button>
            </div>

            <div className="admin-menu-grid">
                {Number(configSede.mod_alertas) === 1 && (
                    <button className="admin-menu-card" onClick={() => navigate('/admin/alertas')}>
                        <div className="admin-menu-icon" style={{ position: 'relative' }}>
                            <Bell size={48} />
                            {unreadCount > 0 && (
                                <span
                                    style={{
                                        position: 'absolute',
                                        top: '-5px',
                                        right: '-5px',
                                        background: 'var(--accent-danger)',
                                        color: 'white',
                                        borderRadius: '50%',
                                        width: '24px',
                                        height: '24px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '12px',
                                        fontWeight: 'bold'
                                    }}
                                >
                                    {unreadCount > 99 ? '99+' : unreadCount}
                                </span>
                            )}
                        </div>
                        <h2>Alertas del Sistema</h2>
                        <p>Ver notificaciones y avisos</p>
                    </button>
                )}

                {Number(configSede.mod_meseras) === 1 && (
                    <button className="admin-menu-card" onClick={() => navigate('/mesera')}>
                        <div className="admin-menu-icon">
                            <Users size={48} />
                        </div>
                        <h2>Inventario Meseras</h2>
                        <p>Gestionar stock general y precios</p>
                    </button>
                )}

                {Number(configSede.mod_chef) === 1 && (
                    <button className="admin-menu-card" onClick={() => navigate('/chef')}>
                        <div className="admin-menu-icon">
                            <ChefHat size={48} />
                        </div>
                        <h2>Inventario Chef</h2>
                        <p>Gestionar verduras y pescados</p>
                    </button>
                )}

                {Number(configSede.mod_propinas) === 1 && (
                    <button className="admin-menu-card" onClick={() => navigate('/propinas')}>
                        <div className="admin-menu-icon">
                            <Calculator size={48} />
                        </div>
                        <h2>Gestión de Propinas</h2>
                        <p>Calculadora y distribución semanal</p>
                    </button>
                )}

                {Number(configSede.mod_accesos) === 1 && (
                    <button className="admin-menu-card" onClick={() => navigate('/admin/usuarios')}>
                        <div className="admin-menu-icon">
                            <Key size={48} />
                        </div>
                        <h2>Accesos del Sistema</h2>
                        <p>Gestionar usuarios y credenciales</p>
                    </button>
                )}
            </div>
        </Layout>
    );
};

export default AdminMenu;
