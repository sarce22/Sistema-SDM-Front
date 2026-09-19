import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { getAlertas, markAlertaAsRead, markAllAlertasAsRead } from '../services/alertaService';
import { showSuccess, showError } from '../utils/alerts';
import { AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { SkeletonList } from '../components/SkeletonLoaders';

const AdminAlerts = () => {
    const navigate = useNavigate();
    const [alertas, setAlertas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('no_leidas');

    // Helper for relative time
    const timeAgo = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);
        
        if (diffInSeconds < 60) return 'Hace unos segundos';
        if (diffInSeconds < 3600) return `Hace ${Math.floor(diffInSeconds / 60)} minutos`;
        if (diffInSeconds < 86400) return `Hace ${Math.floor(diffInSeconds / 3600)} horas`;
        return `Hace ${Math.floor(diffInSeconds / 86400)} días`;
    };

    const loadAlertas = async () => {
        try {
            setLoading(true);
            const data = await getAlertas();
            setAlertas(data);
        } catch (error) {
            showError("Ocurrió un error", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadAlertas();
    }, []);

    const handleMarkAsRead = async (id) => {
        try {
            await markAlertaAsRead(id);
            showSuccess('Alerta marcada como leída');
            loadAlertas();
        } catch (error) {
            showError("Ocurrió un error", error);
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await markAllAlertasAsRead();
            showSuccess('Todas las alertas marcadas como leídas');
            loadAlertas();
        } catch (error) {
            showError("Ocurrió un error", error);
        }
    };

    return (
        <Layout title="Alertas del Sistema">
            <div className="dashboard-header">
                <button className="btn-secondary" onClick={() => navigate(-1)}>
                    <ArrowLeft size={16} />
                    <span>Volver al Menú</span>
                </button>
            </div>
            
            <div className="card mt-2" style={{ padding: '32px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <div className="tabs" style={{ marginBottom: 0, paddingBottom: 0, borderBottom: 'none' }}>
                        <button 
                            className={`tab-btn ${activeTab === 'no_leidas' ? 'active' : ''}`}
                            onClick={() => setActiveTab('no_leidas')}
                        >
                            No Leídas ({alertas.filter(a => !a.leida).length})
                        </button>
                        <button 
                            className={`tab-btn ${activeTab === 'todas' ? 'active' : ''}`}
                            onClick={() => setActiveTab('todas')}
                        >
                            Historial Completo
                        </button>
                    </div>
                    {alertas.some(a => !a.leida) && activeTab === 'no_leidas' && (
                        <button className="btn-secondary" onClick={handleMarkAllAsRead}>
                            <CheckCircle size={16} />
                            <span>Marcar todas como leídas</span>
                        </button>
                    )}
                </div>
                {loading ? (
                    <SkeletonList items={4} />
                ) : alertas.filter(a => activeTab === 'todas' || !a.leida).length === 0 ? (
                    <div className="empty-state">
                        <CheckCircle size={48} className="success-color" />
                        <p>No hay alertas en esta sección.</p>
                    </div>
                ) : (
                    <div>
                        {alertas.filter(a => activeTab === 'todas' || !a.leida).map(alerta => (
                            <div key={alerta.id} className={`alert-card ${alerta.leida ? 'read' : (alerta.mensaje.includes('Crítico') || alerta.mensaje.includes('Agotado') ? 'critical' : 'info')}`}>
                                <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                                    <div style={{ marginTop: '4px' }}>
                                        <AlertCircle size={24} color={alerta.leida ? 'var(--text-secondary)' : (alerta.mensaje.includes('Crítico') || alerta.mensaje.includes('Agotado') ? 'var(--accent-danger)' : '#3b82f6')} />
                                    </div>
                                    <div>
                                        <h4 style={{ fontSize: '1.1rem', marginBottom: '4px' }}>{alerta.mensaje}</h4>
                                        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                                            Generada por: {alerta.usuario_nombre} ({alerta.usuario_rol})
                                        </p>
                                        <p className="time-ago">
                                            {timeAgo(alerta.fecha)} &bull; {new Date(alerta.fecha).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                                {!alerta.leida && (
                                    <button className="btn-primary" onClick={() => handleMarkAsRead(alerta.id)}>
                                        Marcar como Leída
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default AdminAlerts;
