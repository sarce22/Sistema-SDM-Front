import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, LogIn } from 'lucide-react';
import { useInactivityLogout } from '../hooks/useInactivityLogout';

/**
 * Componente centinela que se monta dentro de BrowserRouter.
 * Si se detecta inactividad, muestra un modal avisando al usuario y solicitando
 * confirmación antes de redirigir a /login.
 */
const InactivityHandler = ({ timeoutMs }) => {
    const [showModal, setShowModal] = useState(false);
    const navigate = useNavigate();

    useInactivityLogout({
        timeoutMs,
        onTimeout: () => {
            setShowModal(true);
        },
    });

    const handleAceptar = () => {
        setShowModal(false);
        navigate('/login', { replace: true });
    };

    if (!showModal) return null;

    return (
        <div 
            className="modal-overlay" 
            style={{ 
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 99999,
                backgroundColor: 'rgba(0, 0, 0, 0.75)',
                backdropFilter: 'blur(8px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '20px'
            }}
        >
            <div 
                className="modal-content" 
                style={{ 
                    maxWidth: '440px', 
                    width: '100%',
                    textAlign: 'center', 
                    padding: '36px 28px',
                    borderRadius: '16px',
                    boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
                }}
            >
                <div 
                    style={{
                        width: '64px',
                        height: '64px',
                        borderRadius: '50%',
                        background: 'rgba(239, 68, 68, 0.12)',
                        color: 'var(--accent-danger, #ef4444)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 20px auto',
                        border: '1px solid rgba(239, 68, 68, 0.25)'
                    }}
                >
                    <Clock size={32} />
                </div>

                <h3 style={{ marginBottom: '12px', fontSize: '1.35rem', fontWeight: '700' }}>
                    Sesión cerrada por inactividad
                </h3>

                <p style={{ color: 'var(--text-secondary)', marginBottom: '28px', lineHeight: '1.55', fontSize: '0.95rem' }}>
                    Tu sesión ha expirado porque no se registró actividad en el sistema. Por favor, vuelve a iniciar sesión para continuar trabajando.
                </p>

                <div className="modal-actions" style={{ justifyContent: 'center', marginTop: '8px' }}>
                    <button
                        type="button"
                        className="btn-primary"
                        onClick={handleAceptar}
                        style={{ 
                            width: '100%', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center', 
                            gap: '10px', 
                            padding: '14px 20px',
                            fontSize: '1rem',
                            fontWeight: '600',
                            borderRadius: '8px'
                        }}
                    >
                        <LogIn size={20} />
                        Aceptar e ir al inicio de sesión
                    </button>
                </div>
            </div>
        </div>
    );
};

export default InactivityHandler;
