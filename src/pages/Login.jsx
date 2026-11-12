import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Lock, LogIn, Delete } from 'lucide-react';
import { showSuccess, showError } from '../utils/alerts';
import { login } from '../services/authService';

const Login = () => {
    const navigate = useNavigate();
    const [usuario, setUsuario] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [recentUsers, setRecentUsers] = useState([]);
    const [activeKey, setActiveKey] = useState(null);

    useEffect(() => {
        const stored = localStorage.getItem('recentUsers');
        if (stored) {
            try {
                setRecentUsers(JSON.parse(stored));
            } catch (e) {
                console.error("Error parsing recent users", e);
            }
        }
    }, []);

    const saveRecentUser = (username) => {
        let users = [...recentUsers];
        users = users.filter(u => u !== username); // evitar duplicados
        users.unshift(username); // agregar al inicio
        if (users.length > 5) users = users.slice(0, 5); // mantener máximo 5
        setRecentUsers(users);
        localStorage.setItem('recentUsers', JSON.stringify(users));
    };

    const triggerKeyVisual = (keyStr) => {
        setActiveKey(keyStr);
        setTimeout(() => {
            setActiveKey(prev => (prev === keyStr ? null : prev));
        }, 180);
    };

    const handleKeypadClick = (num) => {
        triggerKeyVisual(num);
        if (password.length < 20) {
            setPassword(prev => prev + num);
        }
    };

    const handleDelete = () => {
        triggerKeyVisual('delete');
        setPassword(prev => prev.slice(0, -1));
    };

    useEffect(() => {
        const handleKeyDown = (e) => {
            // Si el foco está en el campo de usuario, escribir normalmente
            if (e.target.tagName === 'INPUT' && e.target.getAttribute('name') === 'usuario') {
                return;
            }

            let digit = null;
            if (/^[0-9]$/.test(e.key)) {
                digit = e.key;
            } else if (/^Numpad[0-9]$/.test(e.code)) {
                digit = e.code.replace('Numpad', '');
            }

            if (digit !== null) {
                e.preventDefault();
                handleKeypadClick(digit);
                return;
            }

            if (e.key === 'Backspace') {
                e.preventDefault();
                handleDelete();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [password]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!usuario || !password) {
            showError('Por favor ingresa usuario y contraseña');
            return;
        }

        setIsLoading(true);
        try {
            const data = await login(usuario, password);
            saveRecentUser(usuario);
            showSuccess("Inicio de sesión exitoso", `Bienvenido al sistema, ${data.user.rol}!`);
            
            // Redirect based on role
            switch (data.user.rol) {
                case 'Admin':
                    navigate('/admin');
                    break;
                case 'Chef':
                    navigate('/chef');
                    break;
                case 'Mesera':
                    navigate('/mesera');
                    break;
                default:
                    navigate('/login');
            }
        } catch (error) {
            showError("Error al iniciar sesión", error);
        } finally {
            setIsLoading(false);
        }
    };

    const keypadNumbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];

    return (
        <div className="login-container" style={{ position: 'relative' }}>
            <div className="login-card">
                <div className="login-header">
                    <h1>SistemaSDM</h1>
                    <p>Ingresa tus credenciales para acceder</p>
                </div>

                <form onSubmit={handleSubmit}>
                    {recentUsers.length > 0 && (
                        <div className="recent-users-container" style={{ marginBottom: '1.5rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                            <p style={{ width: '100%', fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0 0 0.4rem 0' }}>Usuarios recientes:</p>
                            {recentUsers.map(u => (
                                <button 
                                    key={u} 
                                    type="button" 
                                    onClick={() => setUsuario(u)}
                                    style={{
                                        padding: '0.3rem 0.8rem',
                                        borderRadius: '20px',
                                        background: usuario === u ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
                                        color: usuario === u ? '#ffffff' : 'var(--text-primary)',
                                        border: '1px solid var(--border-color)',
                                        cursor: 'pointer',
                                        fontSize: '0.9rem',
                                        transition: 'all 0.2s ease'
                                    }}
                                >
                                    <User size={12} style={{ display: 'inline', marginRight: '4px', marginBottom: '-2px' }} />
                                    {u}
                                </button>
                            ))}
                        </div>
                    )}

                    <div className="input-group" style={{ marginBottom: '1.5rem' }}>
                        <label>Usuario</label>
                        <div className="input-wrapper">
                            <User size={20} className="input-icon" />
                            <input 
                                type="text" 
                                name="usuario"
                                className="input-field" 
                                value={usuario}
                                onChange={(e) => setUsuario(e.target.value)}
                                placeholder="Ingresa tu usuario"
                                autoComplete="username"
                            />
                        </div>
                    </div>

                    <div className="input-group">
                        <label>Contraseña (PIN)</label>
                        <div className="input-wrapper">
                            <Lock size={20} className="input-icon" />
                            <input 
                                type="password" 
                                name="password"
                                className="input-field" 
                                value={password}
                                onChange={(e) => {
                                    const digits = e.target.value.replace(/\D/g, '').slice(0, 20);
                                    setPassword(digits);
                                }}
                                placeholder="••••"
                                autoComplete="current-password"
                            />
                        </div>
                    </div>

                    <div className="numeric-keypad">
                        {keypadNumbers.map(num => (
                            <button 
                                key={num} 
                                type="button" 
                                className={`keypad-btn ${activeKey === num.toString() ? 'active' : ''}`}
                                onClick={() => handleKeypadClick(num.toString())}
                            >
                                {num}
                            </button>
                        ))}
                        <button 
                            type="button" 
                            className={`keypad-btn action-btn ${activeKey === 'delete' ? 'active' : ''}`} 
                            onClick={handleDelete}
                            title="Borrar dígito"
                        >
                            <Delete size={24} />
                        </button>
                        <button 
                            type="button" 
                            className={`keypad-btn ${activeKey === '0' ? 'active' : ''}`} 
                            onClick={() => handleKeypadClick('0')}
                        >
                            0
                        </button>
                        <button type="button" className="keypad-btn" style={{ visibility: 'hidden' }}>
                        </button>
                    </div>

                    <button type="submit" className="submit-btn" disabled={isLoading} style={{ width: '100%', marginTop: '1.5rem' }}>
                        {isLoading ? 'Verificando...' : (
                            <>
                                <LogIn size={20} />
                                Iniciar Sesión
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Login;
