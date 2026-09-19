import React from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { BookOpen, ArrowLeft, Calculator, MapPin } from 'lucide-react';
import { getCurrentUser } from '../services/authService';

const MeseraMenu = () => {
    const navigate = useNavigate();
    const user = getCurrentUser();
    const isAdmin = user?.rol === 'Admin';

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
                <button className="admin-menu-card" onClick={() => navigate('/mesera/inventario')}>
                    <div className="admin-menu-icon">
                        <BookOpen size={48} />
                    </div>
                    <h2>Stock</h2>
                    <p>Gestionar platos, precios y disponibilidad</p>
                </button>

                <button className="admin-menu-card" onClick={() => navigate('/propinas')}>
                    <div className="admin-menu-icon">
                        <Calculator size={48} />
                    </div>
                    <h2>Gestión de Propinas</h2>
                    <p>Calculadora y distribución semanal</p>
                </button>

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
