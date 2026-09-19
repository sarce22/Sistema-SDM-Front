import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { getSemana, updateSemana, updateDistribucion } from '../services/propinasService';
import { showSuccess, showError } from '../utils/alerts';
import { ArrowLeft, Save, Check, Plus, Trash2 } from 'lucide-react';
import { SkeletonList } from '../components/SkeletonLoaders';

const ToggleSwitch = ({ checked, onChange }) => (
    <div 
        onClick={() => onChange(!checked)}
        style={{
            width: '56px',
            height: '28px',
            background: checked ? '#10B981' : '#374151',
            borderRadius: '14px',
            position: 'relative',
            cursor: 'pointer',
            transition: 'background 0.3s',
            display: 'inline-flex',
            alignItems: 'center',
            padding: '2px',
            boxSizing: 'border-box'
        }}
    >
        {checked && <div style={{ position: 'absolute', left: '8px', color: 'white', display: 'flex' }}><Check size={16} strokeWidth={4} /></div>}
        {!checked && <div style={{ position: 'absolute', right: '10px', color: '#1f2937', display: 'flex', fontWeight: 'bold', fontSize: '14px', fontFamily: 'sans-serif' }}>✕</div>}
        <div style={{
            width: '24px',
            height: '24px',
            background: '#E5E7EB',
            borderRadius: '50%',
            position: 'absolute',
            left: checked ? '29px' : '2px',
            transition: 'left 0.3s',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
        }} />
    </div>
);

const PropinasCalculadora = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [showExitModal, setShowExitModal] = useState(false);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    
    const [semana, setSemana] = useState(null);
    const [distribucion, setDistribucion] = useState([]);
    
    // Estado del modal de descuentos
    const [showDescuentoModal, setShowDescuentoModal] = useState(false);
    const [newDescuento, setNewDescuento] = useState({ grupo: 'Mesero', motivo: '', valor: '' });

    // Totales calculados
    const [totales, setTotales] = useState({
        incluidas: 0,
        general: 0,
        dias: 0,
        valorDia: 0,
        descuentoDiaMeseros: 0,
        descuentoDiaCocina: 0
    });

    useEffect(() => {
        loadData();
    }, [id]);

    useEffect(() => {
        if (semana && distribucion.length > 0) {
            calcularTotales();
        }
    }, [semana, distribucion]);

    const loadData = async () => {
        try {
            setLoading(true);
            const data = await getSemana(id);
            const parsedSemana = {
                ...data.semana,
                total_efectivo: data.semana.total_efectivo ? Number(data.semana.total_efectivo) : '',
                incluido_martes: data.semana.incluido_martes ? Number(data.semana.incluido_martes) : '',
                incluido_miercoles: data.semana.incluido_miercoles ? Number(data.semana.incluido_miercoles) : '',
                incluido_jueves: data.semana.incluido_jueves ? Number(data.semana.incluido_jueves) : '',
                incluido_viernes: data.semana.incluido_viernes ? Number(data.semana.incluido_viernes) : '',
                incluido_sabado: data.semana.incluido_sabado ? Number(data.semana.incluido_sabado) : '',
                incluido_domingo: data.semana.incluido_domingo ? Number(data.semana.incluido_domingo) : '',
                incluido_lunes: data.semana.incluido_lunes ? Number(data.semana.incluido_lunes) : '',
                descuento_cafe: data.semana.descuento_cafe ? Number(data.semana.descuento_cafe) : '',
                descuentos_meseros: data.semana.descuentos_meseros ? (typeof data.semana.descuentos_meseros === 'string' ? JSON.parse(data.semana.descuentos_meseros) : data.semana.descuentos_meseros) : [],
                descuentos_cocina: data.semana.descuentos_cocina ? (typeof data.semana.descuentos_cocina === 'string' ? JSON.parse(data.semana.descuentos_cocina) : data.semana.descuentos_cocina) : []
            };
            setSemana(parsedSemana);
            setDistribucion(data.distribucion.map(d => ({
                ...d,
                dias_seleccionados: d.dias_seleccionados ? (typeof d.dias_seleccionados === 'string' ? JSON.parse(d.dias_seleccionados) : d.dias_seleccionados) : []
            })));
            setHasUnsavedChanges(false);
        } catch (error) {
            showError("Error", error);
        } finally {
            setLoading(false);
        }
    };

    const calcularTotales = () => {
        const { 
            total_efectivo, incluido_martes, incluido_miercoles, incluido_jueves, 
            incluido_viernes, incluido_sabado, incluido_domingo, incluido_lunes, descuento_cafe,
            descuentos_meseros, descuentos_cocina
        } = semana;

        const sumIncluidas = Number(incluido_martes) + Number(incluido_miercoles) + Number(incluido_jueves) + 
                             Number(incluido_viernes) + Number(incluido_sabado) + Number(incluido_domingo) + Number(incluido_lunes);
        
        // El total real a repartir = efectivo + incluidas - café
        const sumGeneral = Number(total_efectivo) + sumIncluidas - Number(descuento_cafe || 0);
        
        const sumDias = distribucion.reduce((acc, curr) => acc + Number(curr.dias_trabajados), 0);
        
        const valorPorDia = sumDias > 0 ? (sumGeneral / sumDias) : 0;

        // Descuentos por grupos
        const sumDescMeseros = (descuentos_meseros || []).reduce((acc, d) => acc + Number(d.valor), 0);
        const sumDescCocina = (descuentos_cocina || []).reduce((acc, d) => acc + Number(d.valor), 0);

        const diasMeseros = distribucion.filter(d => d.cargo === 'Mesero').reduce((acc, curr) => acc + Number(curr.dias_trabajados), 0);
        const diasCocina = distribucion.filter(d => d.cargo === 'Cocina').reduce((acc, curr) => acc + Number(curr.dias_trabajados), 0);

        // Descuento dividido por los días trabajados del respectivo grupo
        const descuentoDiaMeseros = diasMeseros > 0 ? (sumDescMeseros / diasMeseros) : 0;
        const descuentoDiaCocina = diasCocina > 0 ? (sumDescCocina / diasCocina) : 0;

        // Redondear a la centena más cercana (ej: 114.586 -> 114.600)
        const roundTo100 = (val) => Math.round(val / 100) * 100;

        setTotales({
            incluidas: sumIncluidas,
            general: sumGeneral,
            dias: sumDias,
            valorDia: Math.max(0, roundTo100(valorPorDia)),
            descuentoDiaMeseros: descuentoDiaMeseros,
            descuentoDiaCocina: descuentoDiaCocina
        });
    };

    const formatNumber = (num) => {
        if (num === '' || num === null || num === undefined) return '';
        return Number(num).toLocaleString('es-ES'); // Usa punto como separador de miles
    };

    const handleSemanaChange = (field, value) => {
        setSemana(prev => ({
            ...prev,
            [field]: value === '' ? '' : Number(value)
        }));
        setHasUnsavedChanges(true);
    };

    const handleNumberInput = (field, value) => {
        // Eliminar los puntos antes de procesar el número
        const unformatted = value.replace(/\./g, '');
        const numericValue = unformatted === '' ? '' : Number(unformatted);
        if (!isNaN(numericValue)) {
            setSemana(prev => ({ ...prev, [field]: numericValue }));
            setHasUnsavedChanges(true);
        }
    };

    const handleDistribucionChange = (id_trabajador, field, value) => {
        setDistribucion(prev => prev.map(d => 
            d.id_trabajador === id_trabajador 
                ? { ...d, [field]: value } 
                : d
        ));
        setHasUnsavedChanges(true);
    };

    const toggleDia = (id_trabajador, diaIndex) => {
        setDistribucion(prev => prev.map(d => {
            if (d.id_trabajador === id_trabajador) {
                const actuales = Array.isArray(d.dias_seleccionados) ? d.dias_seleccionados : [];
                const nuevos = actuales.includes(diaIndex) 
                    ? actuales.filter(i => i !== diaIndex) 
                    : [...actuales, diaIndex];
                
                return { 
                    ...d, 
                    dias_seleccionados: nuevos,
                    dias_trabajados: nuevos.length
                };
            }
            return d;
        }));
        setHasUnsavedChanges(true);
    };

    const handleAgregarDescuentoModal = (e) => {
        e.preventDefault();
        if (!newDescuento.motivo || !newDescuento.valor) return;
        
        const unformattedVal = newDescuento.valor.replace(/\./g, '');
        const numericVal = Number(unformattedVal);
        if (isNaN(numericVal)) return;

        const isMesero = newDescuento.grupo === 'Mesero';
        const field = isMesero ? 'descuentos_meseros' : 'descuentos_cocina';
        const item = { id: Date.now(), motivo: newDescuento.motivo, valor: numericVal };
    
        setSemana(prev => ({
            ...prev,
            [field]: [...(prev[field] || []), item]
        }));
    
        setShowDescuentoModal(false);
        setNewDescuento({ grupo: 'Mesero', motivo: '', valor: '' });
        setHasUnsavedChanges(true);
    };

    const removeDescuento = (grupo, id) => {
        const field = grupo === 'Mesero' ? 'descuentos_meseros' : 'descuentos_cocina';
        setSemana(prev => ({
            ...prev,
            [field]: prev[field].filter(d => d.id !== id)
        }));
        setHasUnsavedChanges(true);
    };

    const handleSave = async () => {
        try {
            await updateSemana(id, semana);
            for (let d of distribucion) {
                await updateDistribucion(id, d.id_trabajador, {
                    dias_trabajados: Number(d.dias_trabajados),
                    pagado: d.pagado,
                    dias_seleccionados: d.dias_seleccionados || []
                });
            }
            showSuccess('Datos guardados correctamente');
            setHasUnsavedChanges(false);
        } catch (error) {
            showError("Error al guardar", error);
        }
    };

    const handleToggleEstadoClick = () => {
        setShowConfirmModal(true);
    };

    const confirmToggleEstado = async () => {
        const nuevoEstado = semana.estado === 'Borrador' ? 'Cerrado' : 'Borrador';
        try {
            const updatedSemana = { ...semana, estado: nuevoEstado };
            await updateSemana(id, updatedSemana);
            setSemana(updatedSemana);
            showSuccess(`Semana marcada como ${nuevoEstado}`);
        } catch (error) {
            showError("Error", error);
        } finally {
            setShowConfirmModal(false);
        }
    };

    const handleAtras = () => {
        if (hasUnsavedChanges) {
            setShowExitModal(true);
        } else {
            navigate('/propinas');
        }
    };

    if (loading) return <Layout title="Calculadora de Propinas"><div style={{ padding: '24px' }}><SkeletonList items={3} /></div></Layout>;
    if (!semana) return <Layout title="Calculadora de Propinas"><p>Semana no encontrada</p></Layout>;

    // Combinar descuentos para la vista de lista
    const todosLosDescuentos = [
        ...(semana.descuentos_meseros || []).map(d => ({ ...d, grupo: 'Mesero' })),
        ...(semana.descuentos_cocina || []).map(d => ({ ...d, grupo: 'Cocina' }))
    ].sort((a, b) => b.id - a.id);

    return (
        <Layout title="Calculadora de Propinas">
            <div className="dashboard-header" style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <button className="btn-secondary" onClick={handleAtras}>
                        <ArrowLeft size={16} />
                        <span>Atrás</span>
                    </button>
                    <h2>Cuaderno: {new Date(semana.fecha_inicio).toLocaleDateString()} al {new Date(semana.fecha_fin).toLocaleDateString()}</h2>
                </div>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <span className={`status-badge ${semana.estado === 'Cerrado' ? 'success' : 'warning'}`}>
                        {semana.estado}
                    </span>
                    <button 
                        className={semana.estado === 'Cerrado' ? "btn-secondary" : "btn-primary"} 
                        style={semana.estado === 'Borrador' ? { background: 'var(--accent-danger)' } : {}}
                        onClick={handleToggleEstadoClick}
                    >
                        {semana.estado === 'Borrador' ? 'Cerrar Semana' : 'Reabrir Semana'}
                    </button>
                    <button className="btn-primary" onClick={handleSave}>
                        <Save size={20} />
                        <span>Guardar Cambios</span>
                    </button>
                </div>
            </div>

            <div className="propinas-grid">
                
                {/* Lado Izquierdo: Entradas Generales y Descuentos */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', minWidth: 0 }}>
                    
                    {/* Caja de Recaudo */}
                    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <h3 style={{ borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>Recaudo General</h3>
                        
                        <div className="input-group">
                            <label style={{ color: 'var(--accent)' }}>Total Efectivo</label>
                            <input 
                                type="text" 
                                className="input-field" 
                                placeholder="0"
                                value={formatNumber(semana.total_efectivo)} 
                                onChange={e => handleNumberInput('total_efectivo', e.target.value)} 
                            />
                        </div>

                        <div className="input-group">
                            <label style={{ color: 'var(--accent-danger)' }}>Descuento por Café (Global)</label>
                            <input 
                                type="text" 
                                className="input-field" 
                                placeholder="0"
                                value={formatNumber(semana.descuento_cafe)} 
                                onChange={e => handleNumberInput('descuento_cafe', e.target.value)} 
                            />
                        </div>

                        <h4 style={{ marginTop: '16px', color: 'var(--text-secondary)' }}>Propinas Incluidas</h4>
                        {['martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo', 'lunes'].map(dia => (
                            <div className="input-group" key={dia} style={{ marginBottom: '8px' }}>
                                <label style={{ textTransform: 'capitalize' }}>{dia}</label>
                                <input 
                                    type="text" 
                                    className="input-field" 
                                    placeholder="0"
                                    value={formatNumber(semana[`incluido_${dia}`])} 
                                    onChange={e => handleNumberInput(`incluido_${dia}`, e.target.value)} 
                                />
                            </div>
                        ))}
                    </div>

                    {/* Nueva Caja Unificada de Descuentos */}
                    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
                            <h3 style={{ margin: 0 }}>Descuentos Dinámicos</h3>
                            <button className="btn-primary" style={{ padding: '6px 12px', fontSize: '14px' }} onClick={() => setShowDescuentoModal(true)}>
                                <Plus size={16} style={{ marginRight: '4px' }} />
                                Añadir Descuento
                            </button>
                        </div>
                        
                        {todosLosDescuentos.length === 0 ? (
                            <p style={{ color: 'var(--text-secondary)', textAlign: 'center', fontSize: '14px', margin: '20px 0' }}>No hay descuentos aplicados.</p>
                        ) : (
                            todosLosDescuentos.map(desc => (
                                <div key={desc.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-secondary)', padding: '10px 12px', borderRadius: '6px' }}>
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <span style={{ display: 'block', fontSize: '14px', fontWeight: 'bold' }}>{desc.motivo}</span>
                                            <span style={{ 
                                                fontSize: '11px', 
                                                background: desc.grupo === 'Mesero' ? '#3b82f640' : '#f59e0b40', 
                                                color: desc.grupo === 'Mesero' ? '#60a5fa' : '#fbbf24', 
                                                padding: '2px 6px', 
                                                borderRadius: '4px' 
                                            }}>
                                                {desc.grupo}
                                            </span>
                                        </div>
                                        <span style={{ color: 'var(--accent-danger)', fontSize: '14px' }}>-${formatNumber(desc.valor)}</span>
                                    </div>
                                    <button className="btn-icon btn-danger" onClick={() => removeDescuento(desc.grupo, desc.id)}>
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>

                </div>

                {/* Lado Derecho: Calculadora y Empleados */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', minWidth: 0 }}>
                    
                    {/* Resultados Resumen */}
                    <div className="math-summary-box">
                        <div className="math-summary-item no-border">
                            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '4px' }}>Total a Repartir</p>
                            <h2 style={{ color: 'var(--text)', fontSize: '24px' }}>${formatNumber(totales.general.toFixed(0))}</h2>
                        </div>
                        <div className="math-summary-item no-border">
                            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '4px' }}>Total Días</p>
                            <h2 style={{ color: 'var(--text)', fontSize: '24px' }}>{totales.dias}</h2>
                        </div>
                        <div className="math-summary-item">
                            <p style={{ color: 'var(--text-secondary)', fontSize: '12px', marginBottom: '4px' }}>Día Efectivo (Meseros)</p>
                            <h2 style={{ color: 'var(--accent)', fontSize: '22px' }}>${formatNumber(Math.max(0, totales.valorDia - totales.descuentoDiaMeseros).toFixed(0))}</h2>
                        </div>
                        <div className="math-summary-item">
                            <p style={{ color: 'var(--text-secondary)', fontSize: '12px', marginBottom: '4px' }}>Día Efectivo (Cocina)</p>
                            <h2 style={{ color: 'var(--accent)', fontSize: '22px' }}>${formatNumber(Math.max(0, totales.valorDia - totales.descuentoDiaCocina).toFixed(0))}</h2>
                        </div>
                    </div>

                    {/* Tabla Trabajadores */}
                    <div className="card" style={{ overflow: 'hidden' }}>
                        <div className="table-container">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Trabajador</th>
                                        <th style={{ width: '240px', textAlign: 'center' }}>Días Trabajados</th>
                                        <th>Total Pagar</th>
                                        <th style={{ textAlign: 'center' }}>Pagado</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {distribucion.map(d => {
                                        const descuentoDia = d.cargo === 'Mesero' ? totales.descuentoDiaMeseros : totales.descuentoDiaCocina;
                                        const valorEfectivo = Math.max(0, totales.valorDia - descuentoDia);
                                        // Redondear el pago final a la centena más cercana para efectivo real
                                        const aPagar = Math.round((Number(d.dias_trabajados) * valorEfectivo) / 100) * 100;
                                        
                                        return (
                                            <tr key={d.id_trabajador}>
                                                <td>
                                                    <strong>{d.nombre}</strong><br/>
                                                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{d.cargo}</span>
                                                </td>
                                                <td>
                                                    <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                                                        {['M', 'M', 'J', 'V', 'S', 'D', 'L'].map((letra, index) => {
                                                            const isSelected = Array.isArray(d.dias_seleccionados) && d.dias_seleccionados.includes(index);
                                                            return (
                                                                <button
                                                                    key={index}
                                                                    className="btn-icon"
                                                                    style={{
                                                                        width: '28px',
                                                                        height: '28px',
                                                                        borderRadius: '50%',
                                                                        padding: 0,
                                                                        fontSize: '12px',
                                                                        fontWeight: 'bold',
                                                                        background: isSelected ? 'var(--text-primary)' : 'transparent',
                                                                        color: isSelected ? 'var(--bg-primary)' : 'var(--text-secondary)',
                                                                        border: `1px solid ${isSelected ? 'var(--text-primary)' : 'var(--border-color)'}`,
                                                                        transition: 'all 0.2s ease'
                                                                    }}
                                                                    onClick={() => toggleDia(d.id_trabajador, index)}
                                                                    title={`Día ${index + 1}`}
                                                                >
                                                                    {letra}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </td>
                                                <td style={{ fontSize: '18px', fontWeight: 'bold' }}>
                                                    ${formatNumber(aPagar.toFixed(0))}
                                                </td>
                                                <td style={{ textAlign: 'center' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                                                        <ToggleSwitch 
                                                            checked={!!d.pagado} 
                                                            onChange={val => handleDistribucionChange(d.id_trabajador, 'pagado', val)} 
                                                        />
                                                    </div>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

            </div>

            {/* Modal Confirmación Estado */}
            {showConfirmModal && createPortal(
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '400px', textAlign: 'center' }}>
                        <h3>{semana.estado === 'Borrador' ? 'Cerrar Semana' : 'Reabrir Semana'}</h3>
                        <p style={{ margin: '20px 0', color: 'var(--text-secondary)' }}>
                            {semana.estado === 'Borrador' 
                                ? "¿Estás seguro de cerrar la semana? Esto indica que ya finalizaste los cálculos y has pagado las propinas correspondientes." 
                                : "¿Deseas reabrir esta semana para realizar modificaciones?"}
                        </p>
                        <div className="modal-actions" style={{ justifyContent: 'center' }}>
                            <button type="button" className="btn-secondary" onClick={() => setShowConfirmModal(false)}>Cancelar</button>
                            <button 
                                type="button" 
                                className="btn-primary" 
                                style={semana.estado === 'Borrador' ? { background: 'var(--accent-danger)' } : {}}
                                onClick={confirmToggleEstado}
                            >
                                Confirmar
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* Modal Salir sin guardar */}
            {showExitModal && createPortal(
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '400px', textAlign: 'center' }}>
                        <h3>¿Salir sin guardar?</h3>
                        <p style={{ margin: '20px 0', color: 'var(--text-secondary)' }}>
                            Tienes cambios sin guardar en esta semana. Si regresas ahora, perderás todos los datos ingresados.
                        </p>
                        <div className="modal-actions" style={{ justifyContent: 'center' }}>
                            <button type="button" className="btn-secondary" onClick={() => setShowExitModal(false)}>Permanecer aquí</button>
                            <button 
                                type="button" 
                                className="btn-primary" 
                                style={{ background: 'var(--accent-danger)' }}
                                onClick={() => navigate('/propinas')}
                            >
                                Sí, salir
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* Modal para Añadir Descuento Dinámico */}
            {showDescuentoModal && createPortal(
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '400px' }}>
                        <h3>Añadir Descuento</h3>
                        <form onSubmit={handleAgregarDescuentoModal}>
                            <div className="input-group">
                                <label>Grupo a Descontar</label>
                                <select 
                                    className="input-field" 
                                    value={newDescuento.grupo}
                                    onChange={e => setNewDescuento({...newDescuento, grupo: e.target.value})}
                                >
                                    <option value="Mesero">Meseros</option>
                                    <option value="Cocina">Cocina</option>
                                </select>
                            </div>
                            <div className="input-group">
                                <label>Motivo</label>
                                <input 
                                    type="text" 
                                    className="input-field" 
                                    placeholder="Ej: Vaso roto"
                                    value={newDescuento.motivo}
                                    onChange={e => setNewDescuento({...newDescuento, motivo: e.target.value})}
                                    required
                                />
                            </div>
                            <div className="input-group">
                                <label>Valor ($)</label>
                                <input 
                                    type="text" 
                                    className="input-field" 
                                    placeholder="0"
                                    value={formatNumber(newDescuento.valor)}
                                    onChange={e => {
                                        const unformatted = e.target.value.replace(/\./g, '');
                                        if (!isNaN(unformatted)) setNewDescuento({...newDescuento, valor: unformatted});
                                    }}
                                    required
                                />
                            </div>
                            <div className="modal-actions" style={{ justifyContent: 'flex-end', marginTop: '20px' }}>
                                <button type="button" className="btn-secondary" onClick={() => setShowDescuentoModal(false)}>Cancelar</button>
                                <button type="submit" className="btn-primary">Añadir Descuento</button>
                            </div>
                        </form>
                    </div>
                </div>,
                document.body
            )}
        </Layout>
    );
};

export default PropinasCalculadora;
