import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { BookOpen, ArrowLeft, Calculator, MapPin } from 'lucide-react';
import { getCurrentUser } from '../services/authService';
import { getSedeById, obtenerConfigSedeLocal, guardarSedeActivaLocal } from '../services/sedesService';

const MeseraMenu = () => {
    const navigate = useNavigate();
    const user = getCurrentUser();
    const isAdmin = user?.rol === 'Admin';
    const [configSede, setConfigSede] = useState(() => obtenerConfigSedeLocal());

    useEffect(() => {
        const cargarConfig = async () => {
            const sedeId = isAdmin ? (localStorage.getItem('admin_sede_id') || 1) : (user?.sede_id || 1);
            try {
                const sedeData = await getSedeById(sedeId);
                if (sedeData) {
                    if (isAdmin) guardarSedeActivaLocal(sedeData);
                    setConfigSede({
                        mod_meseras: sedeData.mod_meseras ?? 1,
                        mod_propinas: sedeData.mod_propinas ?? 1
                    });
                }
            } catch (error) {
                console.error('Error cargando módulos de la sede:', error);
            }
        };
        cargarConfig();
    }, [isAdmin, user?.sede_id]);

    return (
        <Layout title="Menú Principal">
            {isAdmin && (
                <div className="dashboard-header" style={{ marginBottom: '24px' }}>
                    <button className="btn-secondary" onClick={() => navigate(-1)}>
                        <ArrowLeft size={16} />
                        <span>Volver a Menú Admin</span>
                    </button>
                </div>
            )}

            <div className="admin-menu-grid">
                {Number(configSede.mod_meseras) === 1 && (
                    <button className="admin-menu-card" onClick={() => navigate('/mesera/inventario')}>
                        <div className="admin-menu-icon">
                            <BookOpen size={48} />
                        </div>
                        <h2>Stock</h2>
                        <p>Gestionar pulpas, gaseosas, bebidas y precios</p>
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

                {!isAdmin && (
                    <button className="admin-menu-card" onClick={() => navigate('/asignaciones')}>
                        <div className="admin-menu-icon">
                            <MapPin size={48} />
                        </div>
                        <h2>Mi Asignación</h2>
                        <p>Ver sede del día</p>
                    </button>
                )}
            </div>
        </Layout>
    );
};

export default MeseraMenu;
