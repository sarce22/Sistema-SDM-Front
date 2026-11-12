import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragOverlay,
  useDroppable,
  useDndContext
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import Layout from '../components/Layout';
import { getAsignaciones, saveAsignaciones } from '../services/asignacionesService';
import { getSedes } from '../services/sedesService';
import { crearUsuario } from '../services/usuariosService';
import { showSuccess, showError } from '../utils/alerts';
import {
  ArrowLeft,
  Save,
  Pin,
  RefreshCw,
  Plus,
  X,
  Info,
  MapPin,
  GripVertical,
  Clock,
  Calendar,
  Coffee
} from 'lucide-react';
import { SkeletonList } from '../components/SkeletonLoaders';
import { getCurrentUser } from '../services/authService';

const COLORES_SEDE = ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EC4899', '#14B8A6'];

const DIAS_SEMANA = [
  { key: 'Lun', nombre: 'Lunes' },
  { key: 'Mar', nombre: 'Martes' },
  { key: 'Mié', nombre: 'Miércoles' },
  { key: 'Jue', nombre: 'Jueves' },
  { key: 'Vie', nombre: 'Viernes' },
  { key: 'Sáb', nombre: 'Sábado' },
  { key: 'Dom', nombre: 'Domingo' }
];

const TURNOS_RAPIDOS = [
  { label: 'Apertura (9:00 AM - 5:30 PM)', valor: '09:00 AM - 05:30 PM' },
  { label: 'Mañana / Almuerzo (10:30 AM - 7:30 PM)', valor: '10:30 AM - 07:30 PM' },
  { label: 'Intermedio (11:00 AM - 8:00 PM)', valor: '11:00 AM - 08:00 PM' },
  { label: 'Tarde / Cierre (1:00 PM - 10:00 PM)', valor: '01:00 PM - 10:00 PM' },
  { label: 'En Descanso Hoy', valor: 'En Descanso Hoy' }
];

// Componente para cada Tarjeta (Empleado) con Horario, Días de Trabajo y Día Libre
const SortableItem = ({
  id,
  trabajador,
  currentContainerId,
  sedesList = [],
  isOverlay = false,
  disabled = false,
  onTogglePin,
  onMoveWorker,
  onOpenShiftModal
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id, disabled: disabled || trabajador.fijado });

  const isCocina = trabajador.cargo === 'Cocina';
  const roleColor = isCocina ? '#f59e0b' : '#3b82f6';
  const bloqueado = disabled || trabajador.fijado;
  const diasActivos = Array.isArray(trabajador.dias_trabajo)
    ? trabajador.dias_trabajo
    : ['Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
  const horarioTexto = trabajador.horario || '11:00 AM - 08:00 PM';
  const diaLibreTexto = trabajador.dia_libre || 'Lunes';
  const enDescanso = horarioTexto.toLowerCase().includes('descanso');

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isOverlay ? 999 : 1,
    borderLeft: `4px solid ${roleColor}`,
    backgroundColor: `${roleColor}0D`,
    position: 'relative',
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: '10px',
    padding: '14px'
  };

  return (
    <div ref={setNodeRef} style={style} className="employee-card">
      {/* Cabecera: Nombre, Cargo y Pin */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
        <div
          {...(bloqueado ? {} : attributes)}
          {...(bloqueado ? {} : listeners)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            flex: 1,
            cursor: bloqueado ? 'default' : 'grab',
            touchAction: bloqueado ? 'auto' : 'none',
            minWidth: 0
          }}
        >
          {!disabled && (
            <GripVertical
              size={18}
              style={{
                color: 'var(--text-secondary)',
                opacity: trabajador.fijado ? 0.2 : 0.65,
                flexShrink: 0
              }}
            />
          )}
          <div className="employee-info" style={{ minWidth: 0 }}>
            <strong style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {trabajador.nombre}
            </strong>
            <span style={{ color: roleColor, fontWeight: '600', fontSize: '0.78rem' }}>
              {trabajador.cargo}
            </span>
          </div>
        </div>

        {!disabled && onTogglePin && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onTogglePin(trabajador.trabajador_id);
            }}
            style={{
              background: trabajador.fijado ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
              border: `1px solid ${trabajador.fijado ? '#3b82f6' : 'var(--border-color)'}`,
              borderRadius: '6px',
              cursor: 'pointer',
              color: trabajador.fijado ? '#3b82f6' : 'var(--text-secondary)',
              transition: 'all 0.2s ease',
              padding: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
            title={trabajador.fijado ? 'Empleado fijado. Toca para desbloquear.' : 'Fijar empleado en esta sede'}
          >
            <Pin size={16} fill={trabajador.fijado ? 'currentColor' : 'none'} />
          </button>
        )}
      </div>

      {/* Bloque de Horario y Día Libre */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
          background: 'var(--bg-secondary)',
          padding: '8px 10px',
          borderRadius: '6px',
          border: '1px solid var(--border-color)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px', flexWrap: 'wrap' }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              fontSize: '0.8rem',
              fontWeight: 600,
              color: enDescanso ? '#eab308' : 'var(--text-primary)'
            }}
          >
            <Clock size={13} style={{ color: enDescanso ? '#eab308' : roleColor }} />
            {horarioTexto}
          </span>

          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '0.72rem',
              fontWeight: 600,
              padding: '2px 8px',
              borderRadius: '999px',
              background: 'rgba(239, 68, 68, 0.12)',
              color: '#ef4444',
              border: '1px solid rgba(239, 68, 68, 0.28)'
            }}
          >
            <Coffee size={11} />
            Libre: {diaLibreTexto}
          </span>
        </div>

        {/* Píldoras de Días de la Semana (L M M J V S D) */}
        <div style={{ display: 'flex', gap: '4px', justifyContent: 'space-between', marginTop: '2px' }}>
          {DIAS_SEMANA.map((d) => {
            const trabaja = diasActivos.includes(d.key);
            return (
              <span
                key={d.key}
                title={trabaja ? `Trabaja el ${d.nombre}` : `Descansa el ${d.nombre}`}
                style={{
                  flex: 1,
                  textAlign: 'center',
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  padding: '3px 0',
                  borderRadius: '4px',
                  background: trabaja ? `${roleColor}22` : 'transparent',
                  color: trabaja ? roleColor : 'var(--text-secondary)',
                  border: `1px solid ${trabaja ? `${roleColor}55` : 'var(--border-color)'}`,
                  opacity: trabaja ? 1 : 0.45
                }}
              >
                {d.key}
              </span>
            );
          })}
        </div>
      </div>

      {/* Controles rápidos para Admin (Selector de Sede + Botón Editar Horario/Días) */}
      {!disabled && !isOverlay && (
        <div
          style={{
            display: 'flex',
            gap: '6px',
            alignItems: 'center',
            paddingTop: '4px'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {onMoveWorker && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1, minWidth: 0 }}>
              <MapPin size={14} style={{ color: 'var(--text-secondary)', flexShrink: 0 }} />
              <select
                aria-label={`Cambiar sede de ${trabajador.nombre}`}
                disabled={trabajador.fijado}
                value={currentContainerId || 'col_null'}
                onChange={(e) => onMoveWorker(trabajador.trabajador_id, currentContainerId, e.target.value)}
                className="input-field"
                style={{
                  padding: '6px 8px',
                  fontSize: '0.8rem',
                  borderRadius: '6px',
                  height: 'auto',
                  opacity: trabajador.fijado ? 0.55 : 1,
                  cursor: trabajador.fijado ? 'not-allowed' : 'pointer',
                  background: 'var(--bg-secondary)'
                }}
              >
                <option value="col_null">Sin Asignar / Descanso</option>
                {sedesList.map((s) => (
                  <option key={s.id} value={`col_${s.id}`}>
                    {s.nombre}
                  </option>
                ))}
              </select>
            </div>
          )}

          {onOpenShiftModal && (
            <button
              type="button"
              className="btn-secondary"
              onClick={() => onOpenShiftModal(trabajador)}
              style={{
                padding: '6px 10px',
                fontSize: '0.76rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                whiteSpace: 'nowrap',
                flexShrink: 0
              }}
              title="Editar hora, días y día libre"
            >
              <Calendar size={13} />
              <span>Turno</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};

// Componente para las Columnas
const Column = ({
  id,
  title,
  items,
  sedesList,
  color,
  bgHover,
  disabled,
  onTogglePin,
  onMoveWorker,
  onOpenShiftModal
}) => {
  const { setNodeRef } = useDroppable({ id });
  const { over } = useDndContext();

  const isOverContainer = over
    ? over.id === id || items.some((i) => i.trabajador_id.toString() === over.id.toString())
    : false;

  return (
    <div
      className="board-column"
      style={{
        borderColor: isOverContainer ? color : 'var(--border-color)',
        borderTopColor: color,
        backgroundColor: isOverContainer ? bgHover : 'var(--bg-secondary)',
        boxShadow: isOverContainer ? `0 0 15px ${bgHover}` : 'none',
        transition: 'all 0.2s ease',
        zIndex: isOverContainer ? 10 : 1
      }}
    >
      <div className="column-header" style={{ borderBottomColor: color }}>
        <h3 style={{ color: color }}>{title}</h3>
        <span className="column-count">{items.length}</span>
      </div>
      <div className="column-content" ref={setNodeRef}>
        <SortableContext id={id} items={items.map((i) => i.trabajador_id.toString())} strategy={verticalListSortingStrategy}>
          {items.map((trabajador) => (
            <SortableItem
              key={trabajador.trabajador_id}
              id={trabajador.trabajador_id.toString()}
              trabajador={trabajador}
              currentContainerId={id}
              sedesList={sedesList}
              disabled={disabled}
              onTogglePin={onTogglePin}
              onMoveWorker={onMoveWorker}
              onOpenShiftModal={onOpenShiftModal}
            />
          ))}
        </SortableContext>

        {items.length === 0 && !isOverContainer && <p className="empty-column">Sin empleados en esta sección</p>}

        {isOverContainer && items.length === 0 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '24px',
              border: `2px dashed ${color}`,
              borderRadius: '8px',
              color: color,
              fontWeight: '600',
              backgroundColor: bgHover
            }}
          >
            Soltar aquí
          </div>
        )}
      </div>
    </div>
  );
};

const TableroAsignaciones = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [sedesList, setSedesList] = useState([
    { id: 1, nombre: 'Sede Centro' },
    { id: 2, nombre: 'Sede Norte' }
  ]);

  const [selectedTab, setSelectedTab] = useState('all');

  const [asignaciones, setAsignaciones] = useState({
    col_null: [],
    col_1: [],
    col_2: []
  });

  const [activeId, setActiveId] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newWorkerData, setNewWorkerData] = useState({ nombre: '', usuario: '', password: '', rol: 'Mesera' });

  // Estado del modal de edición de Turno (Hora, Días de Trabajo y Día Libre)
  const [workerShiftEdit, setWorkerShiftEdit] = useState(null);

  const user = getCurrentUser();
  const isAdmin = user?.rol === 'Admin';

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    loadAsignaciones();
  }, []);

  const loadAsignaciones = async () => {
    try {
      setLoading(true);
      const [data, sedesData] = await Promise.all([
        getAsignaciones(),
        getSedes().catch(() => [
          { id: 1, nombre: 'Sede Centro' },
          { id: 2, nombre: 'Sede Norte' }
        ])
      ]);

      const sedesActivas =
        sedesData && sedesData.length > 0
          ? sedesData
          : [
              { id: 1, nombre: 'Sede Centro' },
              { id: 2, nombre: 'Sede Norte' }
            ];
      setSedesList(sedesActivas);

      const initialData = { col_null: [] };
      sedesActivas.forEach((s) => {
        initialData[`col_${s.id}`] = [];
      });

      if (data.asignaciones) {
        data.asignaciones.forEach((a) => {
          const container = a.sede_asignada === null ? 'col_null' : `col_${a.sede_asignada}`;
          if (initialData[container]) {
            initialData[container].push(a);
          } else {
            initialData.col_null.push({ ...a, sede_asignada: null });
          }
        });
      }
      setAsignaciones(initialData);
      setHasChanges(false);
    } catch (error) {
      showError('Error', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const datosParaGuardar = [];
      Object.keys(asignaciones).forEach((containerId) => {
        const sedeId = containerId === 'col_null' ? null : Number(containerId.replace('col_', ''));
        asignaciones[containerId].forEach((a) => {
          datosParaGuardar.push({
            trabajador_id: a.trabajador_id,
            sede_id: sedeId,
            fijado: a.fijado,
            horario: a.horario || '11:00 AM - 08:00 PM',
            dias_trabajo: a.dias_trabajo || ['Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
            dia_libre: a.dia_libre || 'Lunes'
          });
        });
      });
      await saveAsignaciones(datosParaGuardar);
      showSuccess('Tablero y turnos guardados con éxito');
      setHasChanges(false);
    } catch (error) {
      showError('Error al guardar', error);
    }
  };

  const handleMoveWorker = (trabajadorId, fromContainer, toContainer) => {
    if (!fromContainer || !toContainer || fromContainer === toContainer) return;

    setAsignaciones((prev) => {
      const sourceList = prev[fromContainer] || [];
      const targetList = prev[toContainer] || [];
      const workerObj = sourceList.find((item) => item.trabajador_id === trabajadorId);
      if (!workerObj || workerObj.fijado) return prev;

      const nuevaSedeId = toContainer === 'col_null' ? null : Number(toContainer.replace('col_', ''));
      const updatedWorker = { ...workerObj, sede_asignada: nuevaSedeId };

      setHasChanges(true);
      return {
        ...prev,
        [fromContainer]: sourceList.filter((item) => item.trabajador_id !== trabajadorId),
        [toContainer]: [...targetList, updatedWorker]
      };
    });
  };

  const handleTogglePin = (trabajadorId) => {
    setAsignaciones((prev) => {
      const newAsignaciones = { ...prev };
      Object.keys(newAsignaciones).forEach((containerId) => {
        newAsignaciones[containerId] = newAsignaciones[containerId].map((a) =>
          a.trabajador_id === trabajadorId ? { ...a, fijado: !a.fijado } : a
        );
      });
      setHasChanges(true);
      return newAsignaciones;
    });
  };

  // Abrir modal para configurar Hora, Días de trabajo y Día Libre
  const handleOpenShiftModal = (trabajador) => {
    setWorkerShiftEdit({
      trabajador_id: trabajador.trabajador_id,
      nombre: trabajador.nombre,
      cargo: trabajador.cargo,
      horario: trabajador.horario || '11:00 AM - 08:00 PM',
      dias_trabajo: Array.isArray(trabajador.dias_trabajo)
        ? [...trabajador.dias_trabajo]
        : ['Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
      dia_libre: trabajador.dia_libre || 'Lunes'
    });
  };

  const toggleDiaEnModal = (diaKey) => {
    if (!workerShiftEdit) return;
    const actuales = workerShiftEdit.dias_trabajo || [];
    const nuevosDias = actuales.includes(diaKey)
      ? actuales.filter((d) => d !== diaKey)
      : [...actuales, diaKey];

    // Calcular automáticamente los días libres según los días no marcados
    const libres = DIAS_SEMANA.filter((d) => !nuevosDias.includes(d.key)).map((d) => d.nombre);
    const nuevoDiaLibre = libres.length > 0 ? libres.join(' y ') : 'Sin día libre';

    setWorkerShiftEdit({
      ...workerShiftEdit,
      dias_trabajo: nuevosDias,
      dia_libre: nuevoDiaLibre
    });
  };

  const handleSeleccionarDiaLibre = (nombreDia) => {
    if (!workerShiftEdit) return;
    const diaObj = DIAS_SEMANA.find((d) => d.nombre === nombreDia);
    let nuevosDias = DIAS_SEMANA.map((d) => d.key);
    if (diaObj) {
      nuevosDias = nuevosDias.filter((k) => k !== diaObj.key);
    }
    setWorkerShiftEdit({
      ...workerShiftEdit,
      dia_libre: nombreDia,
      dias_trabajo: nuevosDias
    });
  };

  const guardarTurnoEnEstado = (e) => {
    e.preventDefault();
    if (!workerShiftEdit) return;

    setAsignaciones((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((colKey) => {
        next[colKey] = next[colKey].map((item) =>
          item.trabajador_id === workerShiftEdit.trabajador_id
            ? {
                ...item,
                horario: workerShiftEdit.horario,
                dias_trabajo: workerShiftEdit.dias_trabajo,
                dia_libre: workerShiftEdit.dia_libre
              }
            : item
        );
      });
      return next;
    });

    setHasChanges(true);
    setWorkerShiftEdit(null);
  };

  const handleResetBoard = () => {
    setAsignaciones((prev) => {
      const nextState = { col_null: [...(prev.col_null || [])] };
      Object.keys(prev).forEach((key) => {
        if (key === 'col_null') return;
        nextState[key] = [];
        prev[key].forEach((a) => {
          if (a.fijado) nextState[key].push(a);
          else nextState.col_null.push({ ...a, sede_asignada: null });
        });
      });

      setHasChanges(true);
      return nextState;
    });
  };

  const handleAddWorker = async (e) => {
    e.preventDefault();
    if (!newWorkerData.nombre.trim() || !newWorkerData.usuario.trim() || !newWorkerData.password.trim()) return;

    try {
      await crearUsuario(newWorkerData);
      showSuccess('Usuario y empleado creado');
      setShowAddModal(false);
      setNewWorkerData({ nombre: '', usuario: '', password: '', rol: 'Mesera' });
      loadAsignaciones();
    } catch (error) {
      showError('Error al agregar', error);
    }
  };

  const findContainer = (idStr) => {
    if (Object.prototype.hasOwnProperty.call(asignaciones, idStr)) {
      return idStr;
    }
    return Object.keys(asignaciones).find((key) =>
      asignaciones[key].some((item) => item.trabajador_id.toString() === idStr)
    );
  };

  const handleDragStart = (event) => {
    setActiveId(event.active.id);
  };

  const handleDragOver = (event) => {
    const { active, over } = event;
    if (!over) return;

    const activeIdStr = active.id.toString();
    const overIdStr = over.id.toString();

    const activeContainer = findContainer(activeIdStr);
    const overContainer = findContainer(overIdStr);

    if (!activeContainer || !overContainer || activeContainer === overContainer) {
      return;
    }

    setAsignaciones((prev) => {
      const activeItems = prev[activeContainer];
      const overItems = prev[overContainer];

      const activeIndex = activeItems.findIndex((i) => i.trabajador_id.toString() === activeIdStr);
      const overIndex = overItems.findIndex((i) => i.trabajador_id.toString() === overIdStr);

      if (activeIndex === -1) return prev;

      let newIndex;
      if (overIdStr === overContainer) {
        newIndex = overItems.length;
      } else {
        newIndex = overIndex >= 0 ? overIndex : overItems.length;
      }

      setHasChanges(true);
      return {
        ...prev,
        [activeContainer]: prev[activeContainer].filter((item) => item.trabajador_id.toString() !== activeIdStr),
        [overContainer]: [
          ...prev[overContainer].slice(0, newIndex),
          activeItems[activeIndex],
          ...prev[overContainer].slice(newIndex)
        ]
      };
    });
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeIdStr = active.id.toString();
    const overIdStr = over.id.toString();

    const activeContainer = findContainer(activeIdStr);
    const overContainer = findContainer(overIdStr);

    if (!activeContainer || !overContainer || activeContainer !== overContainer) {
      return;
    }

    const activeIndex = asignaciones[activeContainer].findIndex((i) => i.trabajador_id.toString() === activeIdStr);
    const overIndex = asignaciones[overContainer].findIndex((i) => i.trabajador_id.toString() === overIdStr);

    if (activeIndex !== overIndex && overIndex !== -1) {
      setAsignaciones((prev) => {
        setHasChanges(true);
        return {
          ...prev,
          [activeContainer]: arrayMove(prev[activeContainer], activeIndex, overIndex)
        };
      });
    }
  };

  const todosLosEmpleados = Object.values(asignaciones).flat();

  const activeTrabajador = activeId
    ? todosLosEmpleados.find((a) => a.trabajador_id.toString() === activeId.toString())
    : null;

  // Si es Mesera o Chef, ubicamos su propia tarjeta para mostrarle un resumen destacado arriba
  const miAsignacion = !isAdmin && user
    ? todosLosEmpleados.find((a) => Number(a.trabajador_id) === Number(user.id))
    : null;

  const obtenerNombreSede = (sedeId) => {
    if (!sedeId) return 'Sin Asignar / En Descanso';
    return sedesList.find((s) => Number(s.id) === Number(sedeId))?.nombre || 'Sede Asignada';
  };

  const mostrarColumna = (colKey) => selectedTab === 'all' || selectedTab === colKey;

  return (
    <Layout title="Tablero de Turnos y Asignación de Personal">
      <div className="dashboard-header" style={{ marginBottom: '16px', display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'space-between' }}>
        <button className="btn-secondary" onClick={() => navigate(isAdmin ? '/admin' : -1)}>
          <ArrowLeft size={16} />
          <span>Volver</span>
        </button>

        {isAdmin && (
          <div className="board-actions-bar" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              className="btn-secondary"
              style={{ borderColor: 'var(--accent-warning)', color: 'var(--accent-warning)' }}
              onClick={handleResetBoard}
            >
              <RefreshCw size={16} />
              <span>Limpiar</span>
            </button>
            <button className="btn-secondary" onClick={() => setShowAddModal(true)}>
              <Plus size={16} />
              <span>Nuevo Empleado</span>
            </button>
            <button className="btn-primary" disabled={!hasChanges} onClick={handleSave}>
              <Save size={16} />
              <span>Guardar Cambios</span>
            </button>
          </div>
        )}
      </div>

      {/* Resumen personal destacado cuando entra un Chef o Mesera desde su celular */}
      {!isAdmin && miAsignacion && (
        <div
          className="card"
          style={{
            marginBottom: '20px',
            borderLeft: '4px solid #10B981',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            <div>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700 }}>
                Tu programación actual
              </span>
              <h3 style={{ margin: '2px 0 0 0', fontSize: '1.2rem' }}>{miAsignacion.nombre}</h3>
            </div>
            <span className="status-badge success">{obtenerNombreSede(miAsignacion.sede_asignada)}</span>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', fontSize: '0.9rem' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <Clock size={16} color="#10B981" />
              <strong>Horario:</strong> {miAsignacion.horario}
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#ef4444' }}>
              <Coffee size={16} />
              <strong>Día Libre:</strong> {miAsignacion.dia_libre}
            </span>
          </div>
        </div>
      )}

      {isAdmin && (
        <div
          style={{
            background: 'var(--bg-secondary)',
            padding: '12px 16px',
            borderRadius: '8px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            border: '1px solid var(--border-color)',
            fontSize: '0.85rem',
            color: 'var(--text-secondary)'
          }}
        >
          <Info size={18} style={{ flexShrink: 0, color: 'var(--text-primary)' }} />
          <span>
            En cada tarjeta puedes cambiar la <strong>Sede</strong> con el selector o tocar el botón <strong>Turno</strong> para ajustar su <strong>hora de entrada/salida, días que trabaja y día libre</strong>.
          </span>
        </div>
      )}

      {/* Barra de Pestañas (Filtros de Sede) para navegar fácil en celular */}
      <div className="board-filter-tabs" style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '12px', marginBottom: '16px' }}>
        <button
          type="button"
          onClick={() => setSelectedTab('all')}
          className={selectedTab === 'all' ? 'btn-primary' : 'btn-secondary'}
          style={{ padding: '8px 14px', fontSize: '0.85rem', whiteSpace: 'nowrap', borderRadius: '999px' }}
        >
          Todas ({todosLosEmpleados.length})
        </button>
        <button
          type="button"
          onClick={() => setSelectedTab('col_null')}
          className={selectedTab === 'col_null' ? 'btn-primary' : 'btn-secondary'}
          style={{ padding: '8px 14px', fontSize: '0.85rem', whiteSpace: 'nowrap', borderRadius: '999px' }}
        >
          Sin Asignar / Descanso ({(asignaciones.col_null || []).length})
        </button>
        {sedesList.map((sede) => (
          <button
            key={sede.id}
            type="button"
            onClick={() => setSelectedTab(`col_${sede.id}`)}
            className={selectedTab === `col_${sede.id}` ? 'btn-primary' : 'btn-secondary'}
            style={{ padding: '8px 14px', fontSize: '0.85rem', whiteSpace: 'nowrap', borderRadius: '999px' }}
          >
            {sede.nombre} ({(asignaciones[`col_${sede.id}`] || []).length})
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ padding: '24px' }}>
          <SkeletonList items={3} />
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="board-grid">
            {mostrarColumna('col_null') && (
              <Column
                id="col_null"
                title="Sin Asignar / En Descanso"
                items={asignaciones.col_null || []}
                sedesList={sedesList}
                color="#9CA3AF"
                bgHover="#9CA3AF15"
                disabled={!isAdmin}
                onTogglePin={isAdmin ? handleTogglePin : null}
                onMoveWorker={isAdmin ? handleMoveWorker : null}
                onOpenShiftModal={isAdmin ? handleOpenShiftModal : null}
              />
            )}
            {sedesList.map((sede, idx) => {
              const colKey = `col_${sede.id}`;
              if (!mostrarColumna(colKey)) return null;
              const colColor = COLORES_SEDE[idx % COLORES_SEDE.length];
              return (
                <Column
                  key={sede.id}
                  id={colKey}
                  title={sede.nombre}
                  items={asignaciones[colKey] || []}
                  sedesList={sedesList}
                  color={colColor}
                  bgHover={`${colColor}15`}
                  disabled={!isAdmin}
                  onTogglePin={isAdmin ? handleTogglePin : null}
                  onMoveWorker={isAdmin ? handleMoveWorker : null}
                  onOpenShiftModal={isAdmin ? handleOpenShiftModal : null}
                />
              );
            })}
          </div>

          <DragOverlay>
            {activeId && activeTrabajador ? (
              <SortableItem
                id={activeId}
                trabajador={activeTrabajador}
                sedesList={sedesList}
                isOverlay={true}
                disabled={!isAdmin}
              />
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      {/* Botón flotante inferior en móvil cuando hay cambios pendientes por guardar */}
      {isAdmin && hasChanges && (
        <div className="mobile-save-bar">
          <span>Tienes cambios sin guardar</span>
          <button type="button" className="btn-primary" onClick={handleSave} style={{ padding: '8px 16px' }}>
            <Save size={16} />
            <span>Guardar</span>
          </button>
        </div>
      )}

      {/* Modal para Editar Turno: Hora, Días que trabaja y Día Libre */}
      {workerShiftEdit && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '480px', maxHeight: '92vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3 style={{ margin: 0 }}>Programar Turno y Descanso</h3>
              <button
                type="button"
                onClick={() => setWorkerShiftEdit(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>
              Configurando horario semanal para <strong>{workerShiftEdit.nombre}</strong> ({workerShiftEdit.cargo}).
            </p>

            <form onSubmit={guardarTurnoEnEstado}>
              {/* 1. Horario / Turno */}
              <div className="input-group" style={{ marginBottom: '18px' }}>
                <label>Horario de Trabajo (Entrada - Salida)</label>
                <input
                  type="text"
                  className="input-field"
                  style={{ paddingLeft: '14px', marginBottom: '8px' }}
                  value={workerShiftEdit.horario}
                  onChange={(e) => setWorkerShiftEdit({ ...workerShiftEdit, horario: e.target.value })}
                  placeholder="Ej. 11:00 AM - 08:00 PM"
                  required
                />
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {TURNOS_RAPIDOS.map((t) => (
                    <button
                      key={t.valor}
                      type="button"
                      className="btn-secondary"
                      onClick={() => setWorkerShiftEdit({ ...workerShiftEdit, horario: t.valor })}
                      style={{
                        padding: '5px 10px',
                        fontSize: '0.75rem',
                        borderColor: workerShiftEdit.horario === t.valor ? '#10B981' : 'var(--border-color)',
                        color: workerShiftEdit.horario === t.valor ? '#10B981' : 'var(--text-secondary)'
                      }}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. Selección rápida de Día Libre */}
              <div className="input-group" style={{ marginBottom: '18px' }}>
                <label>Día Libre / Descanso</label>
                <select
                  className="input-field"
                  value={workerShiftEdit.dia_libre}
                  onChange={(e) => handleSeleccionarDiaLibre(e.target.value)}
                >
                  <option value="Lunes">Lunes</option>
                  <option value="Martes">Martes</option>
                  <option value="Miércoles">Miércoles</option>
                  <option value="Jueves">Jueves</option>
                  <option value="Viernes">Viernes</option>
                  <option value="Sábado">Sábado</option>
                  <option value="Domingo">Domingo</option>
                  <option value="Lunes y Martes">Lunes y Martes</option>
                  <option value="Sin día libre">Sin día libre (Semana completa)</option>
                </select>
              </div>

              {/* 3. Días que trabaja (Tocar para activar/desactivar) */}
              <div className="input-group" style={{ marginBottom: '20px' }}>
                <label>Días que Trabaja (Toca para marcar o desmarcar)</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px', marginTop: '6px' }}>
                  {DIAS_SEMANA.map((d) => {
                    const activo = (workerShiftEdit.dias_trabajo || []).includes(d.key);
                    return (
                      <button
                        key={d.key}
                        type="button"
                        onClick={() => toggleDiaEnModal(d.key)}
                        style={{
                          padding: '10px 4px',
                          borderRadius: '8px',
                          fontWeight: 700,
                          fontSize: '0.82rem',
                          cursor: 'pointer',
                          border: `2px solid ${activo ? '#10B981' : 'var(--border-color)'}`,
                          background: activo ? 'rgba(16, 185, 129, 0.16)' : 'var(--bg-secondary)',
                          color: activo ? '#10B981' : 'var(--text-secondary)',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {d.key}
                      </button>
                    );
                  })}
                </div>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '8px' }}>
                  Días laborables seleccionados: <strong>{(workerShiftEdit.dias_trabajo || []).length} días</strong> &bull; Libre:{' '}
                  <strong style={{ color: '#ef4444' }}>{workerShiftEdit.dia_libre}</strong>
                </p>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setWorkerShiftEdit(null)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  Aplicar Turno
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAddModal && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 9999 }}>
          <div
            className="drawer-content"
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              bottom: 0,
              width: '100%',
              maxWidth: '380px',
              backgroundColor: 'var(--bg-primary)',
              borderLeft: '1px solid var(--border-color)',
              padding: '32px',
              boxShadow: '-4px 0 15px rgba(0,0,0,0.1)',
              display: 'flex',
              flexDirection: 'column',
              overflowY: 'auto'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
              <h3 style={{ margin: 0 }}>Nuevo Empleado</h3>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAddWorker}>
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label>Nombre del Empleado</label>
                <input
                  type="text"
                  className="input-field"
                  style={{ paddingLeft: '14px' }}
                  value={newWorkerData.nombre}
                  onChange={(e) => setNewWorkerData({ ...newWorkerData, nombre: e.target.value })}
                  required
                  placeholder="Ej. Juan Pérez"
                />
              </div>
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label>Cargo/Rol</label>
                <select
                  className="input-field"
                  value={newWorkerData.rol}
                  onChange={(e) => setNewWorkerData({ ...newWorkerData, rol: e.target.value })}
                >
                  <option value="Mesera">Mesero</option>
                  <option value="Chef">Cocina</option>
                </select>
              </div>

              <h4 style={{ marginTop: '24px', marginBottom: '16px', color: 'var(--text-primary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                Credenciales de Acceso
              </h4>

              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label>Nombre de Usuario</label>
                <input
                  type="text"
                  className="input-field"
                  style={{ paddingLeft: '14px' }}
                  value={newWorkerData.usuario}
                  onChange={(e) => setNewWorkerData({ ...newWorkerData, usuario: e.target.value })}
                  required
                  placeholder="Ej. jperez"
                />
              </div>
              <div className="form-group" style={{ marginBottom: '24px' }}>
                <label>Contraseña (PIN Numérico)</label>
                <input
                  type="password"
                  inputMode="numeric"
                  className="input-field"
                  style={{ paddingLeft: '14px' }}
                  value={newWorkerData.password}
                  onChange={(e) => setNewWorkerData({ ...newWorkerData, password: e.target.value })}
                  required
                  placeholder="Ej. 123456"
                  minLength="4"
                />
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: 'auto', paddingTop: '24px' }}>
                <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={() => setShowAddModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary" style={{ flex: 1 }}>
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default TableroAsignaciones;
