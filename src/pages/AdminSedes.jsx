import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import {
    Store,
    MapPin,
    Plus,
    Settings,
    Trash2,
    Users,
    ChefHat,
    Bell,
    Calculator,
    Key,
    Check
} from 'lucide-react';
import {
    getSedes,
    crearSede,
    actualizarSede,
    eliminarSede,
    guardarSedeActivaLocal,
    MODULOS_SEDE
} from '../services/sedesService';
import { showSuccess, showError } from '../utils/alerts';

const ICONOS_MODULO = {
    mod_meseras: Users,
    mod_chef: ChefHat,
    mod_alertas: Bell,
    mod_propinas: Calculator,
    mod_accesos: Key
};

const FORM_INICIAL = {
    nombre: '',
    mod_meseras: 1,
    mod_chef: 1,
    mod_alertas: 1,
    mod_propinas: 1,
    mod_accesos: 1
};

const AdminSedes = () => {
    const navigate = useNavigate();
    const [sedes, setSedes] = useState([]);
    const [loading, setLoading] = useState(true);

    // Estado del modal Crear / Editar Sede
    const [showModal, setShowModal] = useState(false);
    const [editingSedeId, setEditingSedeId] = useState(null);
    const [formData, setFormData] = useState({ ...FORM_INICIAL });
    const [saving, setSaving] = useState(false);

    // Estado del modal Eliminar Sede
    const [sedeToDelete, setSedeToDelete] = useState(null);

    useEffect(() => {
        cargarSedes();
    }, []);

    const cargarSedes = async () => {
        try {
            setLoading(true);
            const data = await getSedes();
            setSedes(data);
        } catch (error) {
            showError('Error al cargar las sedes', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectSede = (sede) => {
        guardarSedeActivaLocal(sede);
        navigate('/admin/menu');
    };

    const abrirModalCrear = () => {
        setEditingSedeId(null);
        setFormData({ ...FORM_INICIAL });
        setShowModal(true);
    };

    const abrirModalEditar = (sede, e) => {
        e.stopPropagation();
        setEditingSedeId(sede.id);
        setFormData({
            nombre: sede.nombre,
            mod_meseras: sede.mod_meseras ? 1 : 0,
            mod_chef: sede.mod_chef ? 1 : 0,
            mod_alertas: sede.mod_alertas ? 1 : 0,
            mod_propinas: sede.mod_propinas ? 1 : 0,
            mod_accesos: sede.mod_accesos ? 1 : 0
        });
        setShowModal(true);
    };

    const toggleModulo = (key) => {
        setFormData((prev) => ({
            ...prev,
            [key]: prev[key] ? 0 : 1
        }));
    };

    const aplicarPreset = (tipo) => {
        if (tipo === 'todo') {
            setFormData((prev) => ({
                ...prev,
                mod_meseras: 1,
                mod_chef: 1,
                mod_alertas: 1,
                mod_propinas: 1,
                mod_accesos: 1
            }));
        } else if (tipo === 'inventarios') {
            setFormData((prev) => ({
                ...prev,
                mod_meseras: 1,
                mod_chef: 1,
                mod_alertas: 0,
                mod_propinas: 0,
                mod_accesos: 0
            }));
        }
    };

    const handleGuardarSede = async (e) => {
        e.preventDefault();
        if (!formData.nombre.trim()) {
            showError('El nombre de la sede es obligatorio');
            return;
        }

        const totalActivos =
            formData.mod_meseras +
            formData.mod_chef +
            formData.mod_alertas +
            formData.mod_propinas +
            formData.mod_accesos;

        if (totalActivos === 0) {
            showError('Selecciona al menos una función para la sede');
            return;
        }

        try {
            setSaving(true);
            if (editingSedeId) {
                const actualizada = await actualizarSede(editingSedeId, formData);
                showSuccess('Sede actualizada exitosamente');
                const currentActiveId = Number(localStorage.getItem('admin_sede_id'));
                if (currentActiveId === Number(editingSedeId)) {
                    guardarSedeActivaLocal(actualizada);
                }
            } else {
                await crearSede(formData);
                showSuccess('Sede creada exitosamente');
            }
            setShowModal(false);
            cargarSedes();
        } catch (error) {
            showError(editingSedeId ? 'Error al actualizar sede' : 'Error al crear sede', error);
        } finally {
            setSaving(false);
        }
    };

    const confirmarEliminarSede = async () => {
        if (!sedeToDelete) return;
        try {
            await eliminarSede(sedeToDelete.id);
            showSuccess(`Sede "${sedeToDelete.nombre}" eliminada`);
            setSedeToDelete(null);
            cargarSedes();
        } catch (error) {
            showError('No se pudo eliminar la sede', error);
        }
    };

    return (
        <Layout title="Selección y Configuración de Sedes">
            <div className="dashboard-header" style={{ marginBottom: '2rem', flexWrap: 'wrap', gap: '12px' }}>
                <p style={{ margin: 0 }}>
                    Selecciona una sede para administrar sus operaciones o crea una nueva con las funciones que necesites.
                </p>
                <button className="btn-primary" onClick={abrirModalCrear}>
                    <Plus size={18} />
                    <span>Nueva Sede</span>
                </button>
            </div>

            {loading ? (
                <div className="admin-menu-grid">
                    {[1, 2].map((n) => (
                        <div key={n} className="admin-menu-card" style={{ minHeight: '260px', justifyContent: 'center' }}>
                            <div className="skeleton-box" style={{ width: '64px', height: '64px', borderRadius: '50%' }} />
                            <div className="skeleton-box" style={{ width: '60%', height: '24px' }} />
                            <div className="skeleton-box" style={{ width: '80%', height: '16px' }} />
                        </div>
                    ))}
                </div>
            ) : (
                <div
                    className="admin-menu-grid"
                    style={{
                        gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))',
                        gap: '1.75rem'
                    }}
                >
                    {sedes.map((sede) => {
                        const modulosActivos = MODULOS_SEDE.filter((m) => Number(sede[m.key]) === 1);
                        return (
                            <div
                                key={sede.id}
                                className="admin-menu-card"
                                onClick={() => handleSelectSede(sede)}
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') handleSelectSede(sede);
                                }}
                                style={{
                                    position: 'relative',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '28px 24px'
                                }}
                            >
                                <div
                                    style={{
                                        position: 'absolute',
                                        top: '14px',
                                        right: '14px',
                                        display: 'flex',
                                        gap: '6px'
                                    }}
                                >
                                    <button
                                        type="button"
                                        className="btn-icon"
                                        title="Configurar funciones de la sede"
                                        onClick={(e) => abrirModalEditar(sede, e)}
                                    >
                                        <Settings size={18} />
                                    </button>
                                    {sedes.length > 1 && (
                                        <button
                                            type="button"
                                            className="btn-icon btn-danger"
                                            title="Eliminar sede"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setSedeToDelete(sede);
                                            }}
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    )}
                                </div>

                                <div className="admin-menu-icon" style={{ color: 'var(--accent-primary)', marginTop: '8px' }}>
                                    <Store size={48} />
                                </div>

                                <div>
                                    <h2 style={{ fontSize: '1.45rem', marginBottom: '0.4rem' }}>{sede.nombre}</h2>
                                    <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                                        {modulosActivos.length} de {MODULOS_SEDE.length} módulos activos
                                    </p>
                                </div>

                                <div
                                    style={{
                                        display: 'flex',
                                        flexWrap: 'wrap',
                                        gap: '6px',
                                        justifyContent: 'center',
                                        marginTop: '8px'
                                    }}
                                >
                                    {MODULOS_SEDE.map((mod) => {
                                        const activo = Number(sede[mod.key]) === 1;
                                        const IconComp = ICONOS_MODULO[mod.key];
                                        return (
                                            <span
                                                key={mod.key}
                                                style={{
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: '4px',
                                                    padding: '4px 10px',
                                                    borderRadius: '999px',
                                                    fontSize: '0.74rem',
                                                    fontWeight: 600,
                                                    background: activo ? 'rgba(34, 197, 94, 0.12)' : 'transparent',
                                                    color: activo ? '#22c55e' : 'var(--text-secondary)',
                                                    border: `1px solid ${activo ? 'rgba(34, 197, 94, 0.35)' : 'var(--border-color)'}`,
                                                    opacity: activo ? 1 : 0.45
                                                }}
                                            >
                                                <IconComp size={12} />
                                                {mod.shortLabel}
                                            </span>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            <div
                style={{
                    marginTop: '3rem',
                    paddingTop: '2rem',
                    borderTop: '1px solid var(--border-color)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center'
                }}
            >
                <h3 style={{ marginBottom: '1.25rem', color: 'var(--text-secondary)' }}>Herramientas Globales</h3>
                <button
                    className="admin-menu-card"
                    style={{ maxWidth: '340px', width: '100%' }}
                    onClick={() => navigate('/asignaciones')}
                >
                    <div className="admin-menu-icon">
                        <MapPin size={42} />
                    </div>
                    <h2 style={{ fontSize: '1.35rem', margin: '0.5rem 0' }}>Asignación de Personal</h2>
                    <p style={{ color: 'var(--text-secondary)' }}>Tablero global diario entre todas las sedes</p>
                </button>
            </div>

            {/* Modal Crear / Editar Sede */}
            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '560px', maxHeight: '90vh', overflowY: 'auto' }}>
                        <h3 style={{ marginBottom: '8px' }}>
                            {editingSedeId ? 'Configurar Sede' : 'Crear Nueva Sede'}
                        </h3>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '20px' }}>
                            Define el nombre de la sede y activa únicamente las funciones que operarán en ella.
                        </p>

                        <form onSubmit={handleGuardarSede}>
                            <div className="input-group" style={{ marginBottom: '20px' }}>
                                <label htmlFor="sede-nombre">Nombre de la Sede</label>
                                <input
                                    id="sede-nombre"
                                    type="text"
                                    className="input-field"
                                    style={{ paddingLeft: '16px' }}
                                    placeholder="Ej. Sede Express, Sede Sur, Sede Principal..."
                                    value={formData.nombre}
                                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                                    required
                                />
                            </div>

                            <div
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    marginBottom: '12px',
                                    flexWrap: 'wrap',
                                    gap: '8px'
                                }}
                            >
                                <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                                    Funciones Habilitadas
                                </label>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button
                                        type="button"
                                        className="btn-secondary"
                                        style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                                        onClick={() => aplicarPreset('inventarios')}
                                    >
                                        Solo Inventarios (Meseras + Chef)
                                    </button>
                                    <button
                                        type="button"
                                        className="btn-secondary"
                                        style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                                        onClick={() => aplicarPreset('todo')}
                                    >
                                        Activar Todo
                                    </button>
                                </div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {MODULOS_SEDE.map((mod) => {
                                    const activo = Boolean(formData[mod.key]);
                                    const IconComp = ICONOS_MODULO[mod.key];
                                    return (
                                        <div
                                            key={mod.key}
                                            onClick={() => toggleModulo(mod.key)}
                                            role="checkbox"
                                            aria-checked={activo}
                                            tabIndex={0}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' || e.key === ' ') {
                                                    e.preventDefault();
                                                    toggleModulo(mod.key);
                                                }
                                            }}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                padding: '12px 16px',
                                                borderRadius: '8px',
                                                border: `1px solid ${activo ? '#22c55e' : 'var(--border-color)'}`,
                                                background: activo ? 'rgba(34, 197, 94, 0.08)' : 'var(--bg-secondary)',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s ease'
                                            }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <div
                                                    style={{
                                                        width: '36px',
                                                        height: '36px',
                                                        borderRadius: '8px',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        background: activo ? 'rgba(34, 197, 94, 0.2)' : 'var(--bg-tertiary)',
                                                        color: activo ? '#22c55e' : 'var(--text-secondary)'
                                                    }}
                                                >
                                                    <IconComp size={18} />
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                                                        {mod.label}
                                                    </div>
                                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                                        {mod.description}
                                                    </div>
                                                </div>
                                            </div>

                                            <div
                                                style={{
                                                    width: '24px',
                                                    height: '24px',
                                                    borderRadius: '6px',
                                                    border: `2px solid ${activo ? '#22c55e' : 'var(--border-color)'}`,
                                                    background: activo ? '#22c55e' : 'transparent',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    color: '#ffffff',
                                                    flexShrink: 0
                                                }}
                                            >
                                                {activo && <Check size={15} strokeWidth={3} />}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="modal-actions">
                                <button
                                    type="button"
                                    className="btn-secondary"
                                    onClick={() => setShowModal(false)}
                                    disabled={saving}
                                >
                                    Cancelar
                                </button>
                                <button type="submit" className="btn-primary" disabled={saving}>
                                    {saving ? 'Guardando...' : editingSedeId ? 'Guardar Cambios' : 'Crear Sede'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Confirmar Eliminación */}
            {sedeToDelete && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '420px', textAlign: 'center' }}>
                        <h3>Eliminar Sede</h3>
                        <p style={{ margin: '16px 0', color: 'var(--text-secondary)' }}>
                            ¿Estás seguro de eliminar <strong>{sedeToDelete.nombre}</strong>? Los usuarios asociados pasarán automáticamente a otra sede activa.
                        </p>
                        <div className="modal-actions" style={{ justifyContent: 'center' }}>
                            <button type="button" className="btn-secondary" onClick={() => setSedeToDelete(null)}>
                                Cancelar
                            </button>
                            <button
                                type="button"
                                className="btn-primary"
                                style={{ background: 'var(--accent-danger)', color: '#fff' }}
                                onClick={confirmarEliminarSede}
                            >
                                Eliminar Sede
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    );
};

export default AdminSedes;
