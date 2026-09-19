import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { getChefItems, addChefItem, updateChefItem, deleteChefItem, toggleChefAlerta } from '../services/chefService';
import { getCurrentUser } from '../services/authService';
import { showSuccess, showError } from '../utils/alerts';
import { Plus, Edit2, Trash2, ArrowLeft, Bell, BellOff, Download, Mail, Search } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { sendPdfEmail } from '../services/emailService';
import { SkeletonTable } from '../components/SkeletonLoaders';

const ChefInventory = () => {
    const navigate = useNavigate();
    const { categoria } = useParams();
    const user = getCurrentUser();
    const isAdmin = user?.rol === 'Admin';
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    
    const [showModal, setShowModal] = useState(false);
    const [showPdfModal, setShowPdfModal] = useState(false);
    const [emailDestino, setEmailDestino] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [currentItem, setCurrentItem] = useState({ nombre: '', cantidad: '', unidad_medida: 'kg' });
    const [isEditing, setIsEditing] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const filteredItems = items.filter(item => 
        item.nombre.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const loadItems = async () => {
        try {
            setLoading(true);
            const data = await getChefItems(categoria);
            setItems(data);
        } catch (error) {
            showError("Error al cargar ítems", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadItems();
    }, [categoria]);

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            if (isEditing) {
                await updateChefItem(currentItem.id, currentItem);
                showSuccess('Ítem actualizado correctamente');
            } else {
                await addChefItem(categoria, currentItem);
                showSuccess('Ítem agregado correctamente');
            }
            setShowModal(false);
            loadItems();
        } catch (error) {
            showError("Error al guardar", error);
        }
    };

    const confirmDelete = (id) => {
        setItemToDelete(id);
    };

    const executeDelete = async () => {
        if (!itemToDelete) return;
        try {
            await deleteChefItem(itemToDelete);
            showSuccess('Ítem eliminado');
            loadItems();
        } catch (error) {
            showError("Error al eliminar", error);
        } finally {
            setItemToDelete(null);
        }
    };

    const handleToggleAlerta = async (id) => {
        try {
            await toggleChefAlerta(id);
            showSuccess('Preferencia de alerta actualizada');
            loadItems();
        } catch (error) {
            showError("Error al actualizar alerta", error);
        }
    };

    const openModal = (item = null) => {
        if (item) {
            setCurrentItem({
                ...item,
                cantidad: Number(item.cantidad)
            });
            setIsEditing(true);
        } else {
            setCurrentItem({ nombre: '', cantidad: '', unidad_medida: 'kg' });
            setIsEditing(false);
        }
        setShowModal(true);
    };

    const generatePDF = async (filterLowStock = false, action = 'download') => {
        const itemsToPrint = filterLowStock ? items.filter(item => Number(item.cantidad) < 5) : items;

        if (itemsToPrint.length === 0) {
            showError("No hay ítems para exportar con este filtro");
            if (action === 'download') setShowPdfModal(false);
            return;
        }

        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.width;
        const pageHeight = doc.internal.pageSize.height;
        
        // --- BANNER SUPERIOR ---
        doc.setFillColor(24, 24, 27); // Zinc 900
        doc.rect(0, 0, pageWidth, 40, 'F');
        
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(24);
        doc.setFont("helvetica", "bold");
        doc.text("SISTEMA SDM", 14, 26);

        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(161, 161, 170); // Zinc 400
        doc.text(`Generado por: ${user?.usuario || 'Desconocido'}`, pageWidth - 14, 20, { align: 'right' });
        doc.text(`Fecha: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, pageWidth - 14, 28, { align: 'right' });

        // --- TARJETAS DE RESUMEN ---
        const titleText = filterLowStock ? `Inventario del Chef - ${categoria} (Bajo en Stock)` : `Inventario del Chef - ${categoria}`;
        
        doc.setFillColor(244, 244, 245); // Zinc 100
        doc.roundedRect(14, 48, pageWidth - 28, 25, 3, 3, 'F');
        
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(39, 39, 42); // Zinc 800
        doc.text(titleText, 20, 58);
        
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(82, 82, 91); // Zinc 600
        doc.text(`Total de ítems listados: ${itemsToPrint.length}`, 20, 66);
        doc.text(`Filtro Aplicado: ${filterLowStock ? 'Bajo en Stock (< 5)' : 'Todo el inventario'}`, pageWidth / 2, 66);

        // --- TABLA ---
        const tableColumn = ["Nombre", "Cantidad", "Unidad de Medida"];
        const tableRows = [];

        itemsToPrint.forEach(item => {
            tableRows.push([
                item.nombre,
                Number(item.cantidad),
                item.unidad_medida
            ]);
        });

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 82, // Debajo de las tarjetas
            theme: 'grid',
            styles: { 
                fontSize: 10, 
                textColor: [63, 63, 70],
                cellPadding: 6 // Mayor padding para diseño limpio
            },
            headStyles: { 
                fillColor: [39, 39, 42], // Zinc 800
                textColor: [255, 255, 255],
                fontStyle: 'bold',
                halign: 'center'
            },
            alternateRowStyles: { fillColor: [250, 250, 250] },
            columnStyles: {
                1: { halign: 'center' },
                2: { halign: 'center' }
            },
            didDrawPage: (data) => {
                // --- FOOTER ---
                const str = "Página " + doc.internal.getNumberOfPages();
                doc.setFontSize(10);
                doc.setTextColor(161, 161, 170); // Zinc 400
                doc.text(str, pageWidth - 14, pageHeight - 10, { align: 'right' });
                doc.text("Generado por Sistema SDM - Documento confidencial", 14, pageHeight - 10);
            }
        });

        const fileName = `Inventario_${categoria}_${new Date().toISOString().split('T')[0]}.pdf`;

        if (action === 'download') {
            doc.save(fileName);
            setShowPdfModal(false);
        } else if (action === 'email') {
            if (!emailDestino || !emailDestino.includes('@')) {
                showError('Ingresa un correo electrónico válido');
                return;
            }
            setIsSending(true);
            try {
                const pdfBase64 = doc.output('datauristring');
                await sendPdfEmail(emailDestino, titleText, pdfBase64, fileName);
                showSuccess('Correo enviado con éxito');
                setShowPdfModal(false);
                setEmailDestino('');
            } catch (error) {
                showError('Error al enviar el correo', error);
            } finally {
                setIsSending(false);
            }
        }
    };

    return (
        <Layout title={`Inventario: ${categoria}`}>
            <div className="dashboard-header">
                <div style={{ display: 'flex', gap: '16px' }}>
                    <button className="btn-secondary" onClick={() => navigate(-1)}>
                        <ArrowLeft size={16} />
                        <span>Volver al Menú Chef</span>
                    </button>
                    <h2>Lista de {categoria}</h2>
                </div>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <div className="input-wrapper" style={{ minWidth: '250px' }}>
                        <Search size={18} className="input-icon" />
                        <input 
                            type="text" 
                            className="input-field" 
                            placeholder="Buscar ítem..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button className="btn-secondary" onClick={() => setShowPdfModal(true)} disabled={items.length === 0} title="Descargar reporte en PDF">
                        <Download size={20} />
                        <span>Descargar PDF</span>
                    </button>
                    <button className="btn-primary" onClick={() => openModal()}>
                        <Plus size={20} />
                        <span>Añadir Ítem</span>
                    </button>
                </div>
            </div>

            <div className="card mt-2">
                {loading ? (
                    <SkeletonTable columns={4} rows={5} />
                ) : (
                    <div className="table-container">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Nombre</th>
                                    <th>Cantidad</th>
                                    <th>Unidad</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.length === 0 ? (
                                    <tr>
                                        <td colSpan="4" className="text-center">No hay ítems registrados</td>
                                    </tr>
                                ) : filteredItems.length === 0 ? (
                                    <tr>
                                        <td colSpan="4" className="text-center">No se encontraron resultados para "{searchTerm}"</td>
                                    </tr>
                                ) : (
                                    filteredItems.map(item => (
                                        <tr key={item.id}>
                                            <td>{item.nombre}</td>
                                            <td>{Number(item.cantidad)}</td>
                                            <td>{item.unidad_medida}</td>
                                            <td>
                                                <div className="action-buttons">
                                                    {isAdmin && (
                                                        <button 
                                                            className="btn-icon" 
                                                            onClick={() => handleToggleAlerta(item.id)}
                                                            title={item.alerta_activada ? "Desactivar alertas para este ítem" : "Activar alertas para este ítem"}
                                                        >
                                                            {item.alerta_activada ? <Bell size={18} /> : <BellOff size={18} color="var(--text-secondary)" />}
                                                        </button>
                                                    )}
                                                    <button className="btn-icon" onClick={() => openModal(item)}>
                                                        <Edit2 size={18} />
                                                    </button>
                                                    <button className="btn-icon btn-danger" onClick={() => confirmDelete(item.id)}>
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>{isEditing ? 'Editar Ítem' : `Añadir ${categoria}`}</h3>
                        <form onSubmit={handleSave}>
                            <div className="input-group">
                                <label>Nombre</label>
                                <input 
                                    type="text" 
                                    className="input-field" 
                                    value={currentItem.nombre} 
                                    onChange={e => setCurrentItem({...currentItem, nombre: e.target.value})} 
                                    required 
                                />
                            </div>
                            <div className="input-group">
                                <label>Cantidad</label>
                                <input 
                                    type="number" 
                                    className="input-field" 
                                    value={currentItem.cantidad} 
                                    onChange={e => setCurrentItem({...currentItem, cantidad: e.target.value === '' ? '' : Number(e.target.value)})} 
                                />
                            </div>
                            <div className="input-group">
                                <label>Unidad de Medida</label>
                                <select 
                                    className="input-field" 
                                    value={currentItem.unidad_medida} 
                                    onChange={e => setCurrentItem({...currentItem, unidad_medida: e.target.value})}
                                >
                                    <option value="kg">kg</option>
                                    <option value="unidades">unidades</option>
                                </select>
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                                <button type="submit" className="btn-primary">Guardar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {itemToDelete && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '400px', textAlign: 'center' }}>
                        <h3>Confirmar Eliminación</h3>
                        <p style={{ margin: '20px 0', color: 'var(--text-secondary)' }}>
                            ¿Estás seguro de que deseas eliminar este ítem? Esta acción no se puede deshacer.
                        </p>
                        <div className="modal-actions" style={{ justifyContent: 'center' }}>
                            <button type="button" className="btn-secondary" onClick={() => setItemToDelete(null)}>Cancelar</button>
                            <button type="button" className="btn-primary" style={{ background: 'var(--accent-danger)' }} onClick={executeDelete}>Eliminar</button>
                        </div>
                    </div>
                </div>
            )}

            {showPdfModal && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '450px', textAlign: 'center' }}>
                        <h3>Exportar Inventario a PDF</h3>
                        <p style={{ margin: '20px 0', color: 'var(--text-secondary)' }}>
                            ¿Qué información deseas incluir en el reporte de PDF?
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <button 
                                type="button" 
                                className="btn-primary" 
                                style={{ width: '100%', padding: '12px' }}
                                onClick={() => generatePDF(false, 'download')}
                            >
                                Descargar Todo el Inventario
                            </button>
                            <button 
                                type="button" 
                                className="btn-secondary" 
                                style={{ width: '100%', padding: '12px', borderColor: 'var(--accent-warning)', color: 'var(--accent-warning)' }}
                                onClick={() => generatePDF(true, 'download')}
                            >
                                Descargar Bajos en Stock (Menos de 5)
                            </button>
                        </div>
                        
                        <div style={{ margin: '20px 0', borderTop: '1px solid var(--border-color)', paddingTop: '20px', textAlign: 'left' }}>
                            <p style={{ color: 'var(--text-secondary)', marginBottom: '10px', fontSize: '0.9rem', textAlign: 'center' }}>O enviar directamente por correo:</p>
                            <div className="input-group" style={{ marginBottom: '10px' }}>
                                <div className="input-wrapper">
                                    <Mail size={18} className="input-icon" />
                                    <input 
                                        type="email" 
                                        className="input-field" 
                                        placeholder="correo@ejemplo.com"
                                        value={emailDestino}
                                        onChange={(e) => setEmailDestino(e.target.value)}
                                        disabled={isSending}
                                    />
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button type="button" className="btn-primary" style={{ flex: 1, padding: '10px' }} onClick={() => generatePDF(false, 'email')} disabled={isSending}>
                                    {isSending ? 'Enviando...' : 'Enviar Todo'}
                                </button>
                                <button type="button" className="btn-secondary" style={{ flex: 1, padding: '10px', borderColor: 'var(--accent-warning)', color: 'var(--accent-warning)' }} onClick={() => generatePDF(true, 'email')} disabled={isSending}>
                                    {isSending ? 'Enviando...' : 'Enviar Bajos'}
                                </button>
                            </div>
                        </div>

                        <div className="modal-actions" style={{ justifyContent: 'center', marginTop: '10px' }}>
                            <button type="button" className="btn-secondary" onClick={() => setShowPdfModal(false)} disabled={isSending}>Cancelar</button>
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    );
};

export default ChefInventory;
