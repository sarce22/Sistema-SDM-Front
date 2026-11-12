import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
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
import { ArrowLeft, Save, Pin, RefreshCw, Plus, X, Info } from 'lucide-react';
import { SkeletonList } from '../components/SkeletonLoaders';
import { getCurrentUser } from '../services/authService';

// Componente para cada Tarjeta (Empleado)
const SortableItem = ({ id, trabajador, isOverlay = false, disabled = false, onTogglePin }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id, disabled: disabled || trabajador.fijado });

  const isCocina = trabajador.cargo === 'Cocina';
  const roleColor = isCocina ? '#f59e0b' : '#3b82f6'; // Ámbar para cocina, azul para mesero

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    cursor: (disabled || trabajador.fijado) ? 'default' : 'grab',
    zIndex: isOverlay ? 999 : 1,
    borderLeft: `3px solid ${roleColor}`,
    backgroundColor: `${roleColor}10`,
    position: 'relative'
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...(disabled ? {} : attributes)}
      {...(disabled ? {} : listeners)}
      className="employee-card"
    >
      <div className="employee-info">
        <strong>{trabajador.nombre}</strong>
        <span style={{ color: roleColor, fontWeight: '500' }}>{trabajador.cargo}</span>
      </div>
      {!disabled && onTogglePin && (
        <button 
          onClick={(e) => {
            e.stopPropagation(); // Evitar que el clic interfiera con dnd-kit
            onTogglePin(trabajador.trabajador_id);
          }}
          style={{
            position: 'absolute',
            right: '8px',
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: trabajador.fijado ? 'var(--accent-primary)' : 'var(--text-secondary)',
            opacity: trabajador.fijado ? 1 : 0.3,
            transition: 'all 0.2s ease',
            padding: '4px',
            zIndex: 10
          }}
          title={trabajador.fijado ? "Empleado fijado. Haz clic para soltar." : "Fijar empleado a esta sede"}
        >
          <Pin size={18} fill={trabajador.fijado ? 'currentColor' : 'none'} />
        </button>
      )}
    </div>
  );
};

// Componente para las Columnas
const Column = ({ id, title, items, color, bgHover, disabled, onTogglePin }) => {
  const { setNodeRef } = useDroppable({ id });
  const { over } = useDndContext();
  
  // Detectar si el puntero está directamente sobre el contenedor vacío, 
  // o si está sobre un empleado que pertenece a este contenedor
  const isOverContainer = over ? (over.id === id || items.some(i => i.trabajador_id.toString() === over.id.toString())) : false;

  return (
    <div 
      className="board-column" 
      style={{ 
        borderColor: isOverContainer ? color : 'var(--border-color)',
        backgroundColor: isOverContainer ? bgHover : 'var(--bg-secondary)',
        boxShadow: isOverContainer ? `0 0 15px ${bgHover}` : 'none',
        transform: isOverContainer ? 'scale(1.02)' : 'scale(1)',
        transition: 'all 0.2s ease',
        zIndex: isOverContainer ? 10 : 1
      }}
    >
      <div className="column-header" style={{ borderBottomColor: color }}>
        <h3 style={{ color: color }}>{title}</h3>
        <span className="column-count">{items.length}</span>
      </div>
      <div className="column-content" ref={setNodeRef}>
        <SortableContext id={id} items={items.map(i => i.trabajador_id.toString())} strategy={verticalListSortingStrategy}>
          {items.map((trabajador) => (
            <SortableItem 
              key={trabajador.trabajador_id} 
              id={trabajador.trabajador_id.toString()} 
              trabajador={trabajador} 
              disabled={disabled}
              onTogglePin={onTogglePin}
            />
          ))}
        </SortableContext>
        
        {items.length === 0 && !isOverContainer && <p className="empty-column">Sin empleados</p>}
        
        {isOverContainer && items.length === 0 && (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            padding: '24px', 
            border: `2px dashed ${color}`, 
            borderRadius: '8px', 
            color: color, 
            fontWeight: '600',
            backgroundColor: bgHover
          }}>
            Soltar aquí
          </div>
        )}
      </div>
    </div>
  );
};

const COLORES_SEDE = ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EC4899', '#14B8A6'];

const TableroAsignaciones = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [sedesList, setSedesList] = useState([
    { id: 1, nombre: 'Sede Centro' },
    { id: 2, nombre: 'Sede Norte' }
  ]);
  
  // Estado agrupado por contenedores (fundamental para dnd-kit)
  const [asignaciones, setAsignaciones] = useState({
    'col_null': [],
    'col_1': [],
    'col_2': []
  });
  
  const [activeId, setActiveId] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newWorkerData, setNewWorkerData] = useState({ nombre: '', usuario: '', password: '', rol: 'Mesera' });

  const user = getCurrentUser();
  const isAdmin = user?.rol === 'Admin';

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
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

      const sedesActivas = sedesData && sedesData.length > 0
        ? sedesData
        : [{ id: 1, nombre: 'Sede Centro' }, { id: 2, nombre: 'Sede Norte' }];
      setSedesList(sedesActivas);

      const initialData = { 'col_null': [] };
      sedesActivas.forEach(s => {
        initialData[`col_${s.id}`] = [];
      });

      if (data.asignaciones) {
        data.asignaciones.forEach(a => {
          const container = a.sede_asignada === null ? 'col_null' : `col_${a.sede_asignada}`;
          if (initialData[container]) {
            initialData[container].push(a);
          } else {
            initialData['col_null'].push({ ...a, sede_asignada: null });
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
      Object.keys(asignaciones).forEach(containerId => {
        const sedeId = containerId === 'col_null' ? null : Number(containerId.replace('col_', ''));
        asignaciones[containerId].forEach(a => {
          datosParaGuardar.push({ trabajador_id: a.trabajador_id, sede_id: sedeId, fijado: a.fijado });
        });
      });
      await saveAsignaciones(datosParaGuardar);
      showSuccess('Tablero guardado con éxito');
      setHasChanges(false);
    } catch (error) {
      showError('Error al guardar', error);
    }
  };

  const handleTogglePin = (trabajadorId) => {
    setAsignaciones((prev) => {
      const newAsignaciones = { ...prev };
      Object.keys(newAsignaciones).forEach(containerId => {
        newAsignaciones[containerId] = newAsignaciones[containerId].map(a => 
          a.trabajador_id === trabajadorId ? { ...a, fijado: !a.fijado } : a
        );
      });
      setHasChanges(true);
      return newAsignaciones;
    });
  };

  const handleResetBoard = () => {
    setAsignaciones((prev) => {
      const nextState = { 'col_null': [...(prev['col_null'] || [])] };
      Object.keys(prev).forEach((key) => {
        if (key === 'col_null') return;
        nextState[key] = [];
        prev[key].forEach((a) => {
          if (a.fijado) nextState[key].push(a);
          else nextState['col_null'].push({ ...a, sede_asignada: null });
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

  // Encuentra a qué contenedor pertenece un item (o si es el propio contenedor)
  const findContainer = (idStr) => {
    if (Object.prototype.hasOwnProperty.call(asignaciones, idStr)) {
      return idStr;
    }
    return Object.keys(asignaciones).find((key) =>
      asignaciones[key].some(item => item.trabajador_id.toString() === idStr)
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
      
      const activeIndex = activeItems.findIndex(i => i.trabajador_id.toString() === activeIdStr);
      const overIndex = overItems.findIndex(i => i.trabajador_id.toString() === overIdStr);
      
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
        [activeContainer]: prev[activeContainer].filter(item => item.trabajador_id.toString() !== activeIdStr),
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
    
    const activeIndex = asignaciones[activeContainer].findIndex(i => i.trabajador_id.toString() === activeIdStr);
    const overIndex = asignaciones[overContainer].findIndex(i => i.trabajador_id.toString() === overIdStr);
    
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

  const activeTrabajador = activeId 
    ? Object.values(asignaciones).flat().find(a => a.trabajador_id.toString() === activeId.toString()) 
    : null;

  return (
    <Layout title="Tablero de Asignación de Personal">
      <div className="dashboard-header" style={{ marginBottom: '24px', display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'space-between' }}>
        <button className="btn-secondary" onClick={() => navigate('/admin')}>
          <ArrowLeft size={16} />
          <span>Volver</span>
        </button>

        {isAdmin && (
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button 
              className="btn-secondary" 
              style={{ borderColor: 'var(--accent-warning)', color: 'var(--accent-warning)' }}
              onClick={handleResetBoard}
            >
              <RefreshCw size={16} />
              <span>Limpiar Tablero</span>
            </button>
            <button 
              className="btn-secondary" 
              onClick={() => setShowAddModal(true)}
            >
              <Plus size={16} />
              <span>Nuevo Empleado</span>
            </button>
            <button 
              className="btn-primary" 
              disabled={!hasChanges} 
              onClick={handleSave}
            >
              <Save size={16} />
              <span>Guardar Cambios</span>
            </button>
          </div>
        )}
      </div>

      {!isAdmin && (
        <div style={{ background: 'var(--bg-secondary)', padding: '16px', borderRadius: '8px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px', border: '1px solid var(--border-color)' }}>
          <Info size={24} style={{ color: 'var(--text-secondary)' }} />
          <div>
            <h4 style={{ margin: 0, color: 'var(--text-primary)' }}>Modo Consulta</h4>
            <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Como empleado, puedes ver las asignaciones de hoy, pero no modificarlas.</p>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ padding: '24px' }}><SkeletonList items={3} /></div>
      ) : (
        <DndContext 
          sensors={sensors} 
          collisionDetection={closestCenter} 
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="board-grid">
            <Column 
              id="col_null" 
              title="Sin Asignar" 
              items={asignaciones['col_null'] || []} 
              color="#9CA3AF" 
              bgHover="#9CA3AF15"
              disabled={!isAdmin} 
              onTogglePin={isAdmin ? handleTogglePin : null}
            />
            {sedesList.map((sede, idx) => {
              const colColor = COLORES_SEDE[idx % COLORES_SEDE.length];
              return (
                <Column
                  key={sede.id}
                  id={`col_${sede.id}`}
                  title={sede.nombre}
                  items={asignaciones[`col_${sede.id}`] || []}
                  color={colColor}
                  bgHover={`${colColor}15`}
                  disabled={!isAdmin}
                  onTogglePin={isAdmin ? handleTogglePin : null}
                />
              );
            })}
          </div>

          <DragOverlay>
            {activeId && activeTrabajador ? (
              <SortableItem id={activeId} trabajador={activeTrabajador} isOverlay={true} disabled={!isAdmin} />
            ) : null}
          </DragOverlay>
        </DndContext>
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
              flexDirection: 'column'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
              <h3 style={{ margin: 0 }}>Nuevo Empleado</h3>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleAddWorker}>
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label>Nombre del Empleado</label>
                <input 
                  type="text" 
                  className="input-field"
                  value={newWorkerData.nombre}
                  onChange={e => setNewWorkerData({...newWorkerData, nombre: e.target.value})}
                  required
                  placeholder="Ej. Juan Pérez"
                />
              </div>
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label>Cargo/Rol</label>
                <select 
                  className="input-field"
                  value={newWorkerData.rol}
                  onChange={e => setNewWorkerData({...newWorkerData, rol: e.target.value})}
                >
                  <option value="Mesera">Mesero</option>
                  <option value="Chef">Cocina</option>
                </select>
              </div>

              <h4 style={{ marginTop: '24px', marginBottom: '16px', color: 'var(--text-primary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>Credenciales de Acceso</h4>
              
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label>Nombre de Usuario</label>
                <input 
                  type="text" 
                  className="input-field"
                  value={newWorkerData.usuario}
                  onChange={e => setNewWorkerData({...newWorkerData, usuario: e.target.value})}
                  required
                  placeholder="Ej. jperez"
                />
              </div>
              <div className="form-group" style={{ marginBottom: '24px' }}>
                <label>Contraseña</label>
                <input 
                  type="password" 
                  className="input-field"
                  value={newWorkerData.password}
                  onChange={e => setNewWorkerData({...newWorkerData, password: e.target.value})}
                  required
                  placeholder="Ej. secreto123"
                  minLength="4"
                />
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: 'auto', paddingTop: '32px' }}>
                <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={() => setShowAddModal(false)}>Cancelar</button>
                <button type="submit" className="btn-primary" style={{ flex: 1 }}>Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default TableroAsignaciones;
