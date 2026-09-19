import React from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { Store, MapPin } from 'lucide-react';

const AdminSedes = () => {
    const navigate = useNavigate();

    const handleSelectSede = (sedeId, sedeName) => {
        localStorage.setItem('admin_sede_id', sedeId);
        localStorage.setItem('admin_sede_name', sedeName);
        navigate('/admin/menu');
    };

    return (
        <Layout title="Selección de Sede">
            <div className="admin-menu-grid" style={{ display: 'flex', justifyContent: 'center', gap: '2rem', padding: '2rem' }}>
                <button className="admin-menu-card" style={{ maxWidth: '300px' }} onClick={() => handleSelectSede(1, 'Sede Centro')}>
                    <div className="admin-menu-icon" style={{ color: 'var(--accent-primary)' }}>
                        <Store size={64} />
                    </div>
                    <h2 style={{ fontSize: '1.5rem', margin: '1rem 0' }}>Sede Centro</h2>
                    <p style={{ color: 'var(--text-secondary)' }}>Gestionar inventarios, propinas y reportes de la Sede Centro</p>
                </button>
                
                <button className="admin-menu-card" style={{ maxWidth: '300px' }} onClick={() => handleSelectSede(2, 'Sede Norte')}>
                    <div className="admin-menu-icon" style={{ color: 'var(--accent-secondary)' }}>
                        <Store size={64} />
                    </div>
                    <h2 style={{ fontSize: '1.5rem', margin: '1rem 0' }}>Sede Norte</h2>
                    <p style={{ color: 'var(--text-secondary)' }}>Gestionar inventarios, propinas y reportes de la Sede Norte</p>
                </button>
            </div>
            
            <div style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <h3 style={{ marginBottom: '1.5rem', color: 'var(--text-secondary)' }}>Herramientas Globales</h3>
                <button className="admin-menu-card" style={{ maxWidth: '300px', width: '100%' }} onClick={() => navigate('/asignaciones')}>
                    <div className="admin-menu-icon">
                        <MapPin size={48} />
                    </div>
                    <h2 style={{ fontSize: '1.5rem', margin: '1rem 0' }}>Asignación de Personal</h2>
                    <p style={{ color: 'var(--text-secondary)' }}>Tablero global diario de sedes</p>
                </button>
            </div>
        </Layout>
    );
};

export default AdminSedes;
