import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { getUsuarios, crearUsuario, eliminarUsuario, editarUsuario } from '../services/usuariosService';
import { showSuccess, showError } from '../utils/alerts';
import { ArrowLeft, UserPlus, Trash2, Key, Edit } from 'lucide-react';
import { getCurrentUser } from '../services/authService';
import { SkeletonTable } from '../components/SkeletonLoaders';

const AdminUsuarios = () => {
    const navigate = useNavigate();
    const currentUser = getCurrentUser();
    const [usuarios, setUsuarios] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Modal
    const [showModal, setShowModal] = useState(false);
    const [nuevoUsuario, setNuevoUsuario] = useState({ nombre: '', usuario: '', password: '', rol: 'Mesera' });
    
    // Modal Edit
    const [showEditModal, setShowEditModal] = useState(false);
    const [userToEdit, setUserToEdit] = useState({ id: '', nombre: '', usuario: '', password: '', rol: '' });
    
    // Eliminar Confirm
    const [itemToDelete, setItemToDelete] = useState(null);

    useEffect(() => {
        loadUsuarios();
    }, []);

    const loadUsuarios = async () => {
        try {
            setLoading(true);
            const data = await getUsuarios();
            setUsuarios(data);
        } catch (error) {
            showError("Error al cargar datos", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveUsuario = async (e) => {
        e.preventDefault();
        try {
            const sedeActiva = localStorage.getItem('admin_sede_id') || 1;
            await crearUsuario({ ...nuevoUsuario, sede_id: Number(sedeActiva) });
            showSuccess('Usuario creado exitosamente');
            setShowModal(false);
            setNuevoUsuario({ nombre: '', usuario: '', password: '', rol: 'Mesera' });
            loadUsuarios();
        } catch (error) {
            showError("Error al crear", error);
        }
    };

    const executeDelete = async () => {
        if (!itemToDelete) return;
        try {
            await eliminarUsuario(itemToDelete);
            showSuccess('Usuario eliminado');
            loadUsuarios();
        } catch (error) {
            showError("No se puede eliminar", error);
        } finally {
            setItemToDelete(null);
        }
    };

    const openEditModal = (u) => {
        setUserToEdit({ id: u.id, usuario: u.usuario, password: '', rol: u.rol });
        setShowEditModal(true);
    };

    const handleUpdateUsuario = async (e) => {
        e.preventDefault();
        try {
            const payload = { usuario: userToEdit.usuario, rol: userToEdit.rol };
            if (userToEdit.password) {
                payload.password = userToEdit.password;
            }
            await editarUsuario(userToEdit.id, payload);
            showSuccess('Usuario actualizado');
            setShowEditModal(false);
            loadUsuarios();
        } catch (error) {
            showError("Error al actualizar", error);
        }
    };

    return (
        <Layout title="Accesos del Sistema">
            <div className="dashboard-header">
                <div style={{ display: 'flex', gap: '16px' }}>
                    <button className="btn-secondary" onClick={() => navigate(-1)}>
                        <ArrowLeft size={16} />
                        <span>Volver al Menú</span>
                    </button>
                    <h2>Gestión de Accesos</h2>
                </div>
                <button className="btn-primary" onClick={() => setShowModal(true)}>
                    <UserPlus size={20} />
                    <span>Añadir Acceso</span>
                </button>
            </div>

            <div className="card mt-2">
                <div className="table-container">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Nombre Real</th>
                                <th>Nombre de Usuario</th>
                                <th>Rol del Sistema</th>
                                <th style={{ textAlign: 'center' }}>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {usuarios.length > 0 ? usuarios.map(u => (
                                <tr key={u.id}>
                                    <td>
                                        <strong>{u.nombre || '-'}</strong>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <Key size={14} color="var(--text-secondary)" />
                                            {u.usuario}
                                            {currentUser?.id === u.id && (
                                                <span style={{ fontSize: '10px', background: 'var(--border-color)', padding: '2px 6px', borderRadius: '4px', marginLeft: '8px' }}>TÚ</span>
                                            )}
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`status-badge ${u.rol === 'Admin' ? 'warning' : 'success'}`}>
                                            {u.rol}
                                        </span>
                                    </td>
                                    <td style={{ textAlign: 'center' }}>
                                        <button className="btn-icon" style={{ color: 'var(--text-secondary)', marginRight: '8px' }} onClick={() => openEditModal(u)} title="Editar Acceso">
                                            <Edit size={18} />
                                        </button>
                                        {currentUser?.id !== u.id && (
                                            <button className="btn-icon btn-danger" onClick={() => setItemToDelete(u.id)} title="Eliminar Acceso">
                                                <Trash2 size={18} />
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="3" style={{ padding: 0 }}>
                                        <SkeletonTable columns={3} rows={4} />
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal Crear Usuario */}
            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>Crear Nuevo Acceso</h3>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '20px', fontSize: '0.9rem' }}>
                            Estas son credenciales para iniciar sesión en la plataforma.
                        </p>
                        <form onSubmit={handleSaveUsuario}>
                            <div className="form-group" style={{ marginBottom: '16px' }}>
                                <label>Nombre Completo</label>
                                <input 
                                    type="text" 
                                    className="input-field" 
                                    value={nuevoUsuario.nombre}
                                    onChange={e => setNuevoUsuario({...nuevoUsuario, nombre: e.target.value})}
                                    placeholder="Ej. Juan Pérez"
                                />
                            </div>
                            <div className="form-group" style={{ marginBottom: '16px' }}>
                                <label>Usuario (Login)</label>
                                <input 
                                    type="text" 
                                    className="input-field" 
                                    value={nuevoUsuario.usuario}
                                    onChange={e => setNuevoUsuario({...nuevoUsuario, usuario: e.target.value})}
                                    required
                                    placeholder="Ej. admin1"
                                />
                            </div>
                            <div className="input-group">
                                <label>Contraseña</label>
                                <input 
                                    type="password" 
                                    className="input-field" 
                                    value={nuevoUsuario.password} 
                                    onChange={e => setNuevoUsuario({...nuevoUsuario, password: e.target.value})} 
                                    required 
                                />
                            </div>
                            <div className="input-group">
                                <label>Rol de Permisos</label>
                                <select 
                                    className="input-field" 
                                    value={nuevoUsuario.rol} 
                                    onChange={e => setNuevoUsuario({...nuevoUsuario, rol: e.target.value})}
                                >
                                    <option value="Mesera">Mesera (Inventario Bebidas, Propinas)</option>
                                    <option value="Chef">Chef (Inventario Cocina)</option>
                                    <option value="Admin">Administrador (Acceso Total)</option>
                                </select>
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                                <button type="submit" className="btn-primary">Crear Cuenta</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Editar Usuario */}
            {showEditModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>Editar Acceso</h3>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '20px', fontSize: '0.9rem' }}>
                            Modifica los datos del usuario. Deja la contraseña en blanco si no deseas cambiarla.
                        </p>
                        <form onSubmit={handleUpdateUsuario}>
                            <div className="form-group" style={{ marginBottom: '16px' }}>
                                <label>Nombre Completo</label>
                                <input 
                                    type="text" 
                                    className="input-field" 
                                    value={userToEdit.nombre || ''}
                                    onChange={e => setUserToEdit({...userToEdit, nombre: e.target.value})}
                                    placeholder="Ej. Juan Pérez"
                                />
                            </div>
                            <div className="form-group" style={{ marginBottom: '16px' }}>
                                <label>Usuario (Login)</label>
                                <input 
                                    type="text" 
                                    className="input-field" 
                                    value={userToEdit.usuario}
                                    onChange={e => setUserToEdit({...userToEdit, usuario: e.target.value})}
                                    required
                                />
                            </div>
                            <div className="input-group">
                                <label>Nueva Contraseña (Opcional)</label>
                                <input 
                                    type="password" 
                                    className="input-field" 
                                    placeholder="Dejar en blanco para mantener la actual"
                                    value={userToEdit.password} 
                                    onChange={e => setUserToEdit({...userToEdit, password: e.target.value})} 
                                />
                            </div>
                            <div className="input-group">
                                <label>Rol de Permisos</label>
                                <select 
                                    className="input-field" 
                                    value={userToEdit.rol} 
                                    onChange={e => setUserToEdit({...userToEdit, rol: e.target.value})}
                                >
                                    <option value="Mesera">Mesera (Inventario Bebidas, Propinas)</option>
                                    <option value="Chef">Chef (Inventario Cocina)</option>
                                    <option value="Admin">Administrador (Acceso Total)</option>
                                </select>
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn-secondary" onClick={() => setShowEditModal(false)}>Cancelar</button>
                                <button type="submit" className="btn-primary">Guardar Cambios</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Eliminar */}
            {itemToDelete && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '400px', textAlign: 'center' }}>
                        <h3>Revocar Acceso</h3>
                        <p style={{ margin: '20px 0', color: 'var(--text-secondary)' }}>
                            ¿Estás seguro de que deseas eliminar este usuario? Esa persona ya no podrá iniciar sesión en el sistema.
                        </p>
                        <div className="modal-actions" style={{ justifyContent: 'center' }}>
                            <button type="button" className="btn-secondary" onClick={() => setItemToDelete(null)}>Cancelar</button>
                            <button type="button" className="btn-primary" style={{ background: 'var(--accent-danger)' }} onClick={executeDelete}>Eliminar</button>
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    );
};

export default AdminUsuarios;
