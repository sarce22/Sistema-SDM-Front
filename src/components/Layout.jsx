import React, { useState, useEffect, useRef } from 'react';
import { LogOut, User as UserIcon, ChevronDown, Bell, CheckCircle } from 'lucide-react';
import { getCurrentUser, logout } from '../services/authService';
import { getAlertas, markAlertaAsRead } from '../services/alertaService';
import { obtenerConfigSedeLocal } from '../services/sedesService';
import { useNavigate } from 'react-router-dom';

const Layout = ({ children, title }) => {
    const user = getCurrentUser();
    const navigate = useNavigate();
    const configSede = obtenerConfigSedeLocal();
    const alertasHabilitadas = user?.rol === 'Admin' && Number(configSede.mod_alertas) === 1;
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [notifOpen, setNotifOpen] = useState(false);
    const [alertas, setAlertas] = useState([]);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const dropdownRef = useRef(null);
    const notifRef = useRef(null);

    useEffect(() => {
        if (alertasHabilitadas) {
            loadAlertas();
        } else {
            setAlertas([]);
        }
    }, [alertasHabilitadas]);

    const loadAlertas = async () => {
        try {
            const data = await getAlertas();
            setAlertas(data.filter(a => !a.leida));
        } catch (error) {
            console.error("Error al cargar alertas");
        }
    };

    const handleReadAlerta = async (id, e) => {
        if (e) e.stopPropagation();
        try {
            await markAlertaAsRead(id);
            loadAlertas();
        } catch (error) {
            console.error(error);
        }
    };

    // Close dropdowns if clicked outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setDropdownOpen(false);
            }
            if (notifRef.current && !notifRef.current.contains(event.target)) {
                setNotifOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleHomeClick = () => {
        if (!user) return;
        switch (user.rol) {
            case 'Admin': navigate('/admin'); break;
            case 'Chef': navigate('/chef'); break;
            case 'Mesera': navigate('/mesera'); break;
            default: navigate('/login');
        }
    };

    const handleLogoutClick = () => {
        setDropdownOpen(false);
        setShowLogoutConfirm(true);
    };

    const confirmLogout = () => {
        logout();
    };

    return (
        <div className="layout-container">
            <header className="top-navbar">
                <div 
                    className="nav-brand" 
                    onClick={handleHomeClick}
                    style={{ cursor: 'pointer' }}
                >
                    <h2 style={{ margin: 0 }}>SistemaSDM</h2>
                </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{ position: 'relative' }} ref={notifRef}>
                            {alertasHabilitadas && (
                                <button 
                                    className="btn-icon" 
                                    onClick={() => setNotifOpen(!notifOpen)}
                                    title="Notificaciones"
                                    style={{ position: 'relative' }}
                                >
                                    <Bell size={20} />
                                    {alertas.length > 0 && (
                                        <span className="notif-badge">{alertas.length > 9 ? '+9' : alertas.length}</span>
                                    )}
                                </button>
                            )}
                            
                            {notifOpen && alertasHabilitadas && (
                                <div className="notif-menu">
                                    <div className="dropdown-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontWeight: 600 }}>Alertas Recientes</span>
                                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{alertas.length} nuevas</span>
                                    </div>
                                    <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                                        {alertas.length === 0 ? (
                                            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                                                <CheckCircle size={32} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
                                                <p style={{ fontSize: '0.9rem' }}>Todo está al día</p>
                                            </div>
                                        ) : (
                                            alertas.slice(0, 5).map(alerta => (
                                                <div key={alerta.id} className="notif-item">
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                        <span className="notif-title">{alerta.mensaje}</span>
                                                        <button 
                                                            className="btn-icon" 
                                                            style={{ padding: '4px' }} 
                                                            title="Marcar como leída"
                                                            onClick={(e) => handleReadAlerta(alerta.id, e)}
                                                        >
                                                            <CheckCircle size={14} />
                                                        </button>
                                                    </div>
                                                    <span className="notif-time">Por {alerta.usuario_nombre} - {new Date(alerta.fecha).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                    <button 
                                        style={{ width: '100%', padding: '12px', background: 'var(--bg-secondary)', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', borderTop: '1px solid var(--border-color)' }}
                                        onClick={() => { setNotifOpen(false); navigate('/admin/alertas'); }}
                                    >
                                        Ver todas las alertas
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="user-menu-container" ref={dropdownRef}>
                            <button 
                                className="user-menu-btn" 
                                onClick={() => setDropdownOpen(!dropdownOpen)}
                            >
                                <UserIcon size={16} />
                                <span className="nav-item">{user?.usuario}</span>
                                <ChevronDown size={14} className={`chevron-icon ${dropdownOpen ? 'open' : ''}`} />
                            </button>

                            {dropdownOpen && (
                                <div className="dropdown-menu">
                                    <div className="dropdown-header">
                                        <span className="user-role-badge">Rol: {user?.rol}</span>
                                    </div>
                                    <button className="dropdown-item text-danger" onClick={handleLogoutClick}>
                                        <LogOut size={16} />
                                        <span>Cerrar Sesión</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </header>
            <main className="main-content">
                <div className="content-wrapper">
                    <div className="content-header">
                        <h1>{title}</h1>
                    </div>
                    <div className="content-body">
                        {children}
                    </div>
                </div>
            </main>

            <footer className="app-footer">
                <p>&copy; {new Date().getFullYear()} Sistema SDM. Todos los derechos reservados.</p>
                <p style={{ marginTop: '4px', fontSize: '0.75rem', opacity: 0.7 }}>Gestión Inteligente de Restaurantes</p>
            </footer>

            {showLogoutConfirm && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '400px', textAlign: 'center' }}>
                        <h3>Cerrar Sesión</h3>
                        <p style={{ margin: '20px 0', color: 'var(--text-secondary)' }}>
                            ¿Estás seguro de que deseas cerrar tu sesión actual?
                        </p>
                        <div className="modal-actions" style={{ justifyContent: 'center' }}>
                            <button type="button" className="btn-secondary" onClick={() => setShowLogoutConfirm(false)}>Cancelar</button>
                            <button type="button" className="btn-primary" style={{ background: 'var(--accent-danger)' }} onClick={confirmLogout}>Salir</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Layout;
