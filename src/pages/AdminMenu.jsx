import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { Bell, Users, ChefHat, Calculator, Key, ArrowLeft, MapPin } from 'lucide-react';
import { getUnreadAlertsCount } from '../services/alertaService';

const AdminMenu = () => {
    const navigate = useNavigate();
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        const fetchUnread = async () => {
            try {
                const data = await getUnreadAlertsCount();
                setUnreadCount(data.unreadCount);
            } catch (error) {
                console.error("Error al obtener conteo de alertas:", error);
            }
        };
        fetchUnread();
    }, []);

    const sedeName = localStorage.getItem('admin_sede_name') || 'Sede Desconocida';

    return (
        <Layout title={`Menú del Administrador - ${sedeName}`}>
            <div className="dashboard-header" style={{ marginBottom: '24px' }}>
                <button className="btn-secondary" onClick={() => navigate('/admin')}>
                    <ArrowLeft size={16} />
                    <span>Cambiar Sede</span>
                </button>
            </div>
            <div className="admin-menu-grid">
                <button className="admin-menu-card" onClick={() => navigate('/admin/alertas')}>
                    <div className="admin-menu-icon" style={{ position: 'relative' }}>
                        <Bell size={48} />
                        {unreadCount > 0 && (
                            <span style={{
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
                            }}>
                                {unreadCount > 99 ? '99+' : unreadCount}
                            </span>
                        )}
                    </div>
                    <h2>Alertas del Sistema</h2>
                    <p>Ver notificaciones y avisos</p>
                </button>
                
                <button className="admin-menu-card" onClick={() => navigate('/mesera')}>
                    <div className="admin-menu-icon">
                        <Users size={48} />
                    </div>
                    <h2>Inventario Meseras</h2>
                    <p>Gestionar stock general y precios</p>
                </button>
                
                <button className="admin-menu-card" onClick={() => navigate('/chef')}>
                    <div className="admin-menu-icon">
                        <ChefHat size={48} />
                    </div>
                    <h2>Inventario Chef</h2>
                    <p>Gestionar verduras y pescados</p>
                </button>

                <button className="admin-menu-card" onClick={() => navigate('/propinas')}>
                    <div className="admin-menu-icon">
                        <Calculator size={48} />
                    </div>
                    <h2>Gestión de Propinas</h2>
                    <p>Calculadora y distribución semanal</p>
                </button>

                <button className="admin-menu-card" onClick={() => navigate('/admin/usuarios')}>
                    <div className="admin-menu-icon">
                        <Key size={48} />
                    </div>
                    <h2>Accesos del Sistema</h2>
                    <p>Gestionar usuarios y credenciales</p>
                </button>

            </div>
        </Layout>
    );
};

export default AdminMenu;
