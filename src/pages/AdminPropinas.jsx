import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { getSemanas, createSemana } from '../services/propinasService';
import { showSuccess, showError } from '../utils/alerts';
import { ArrowLeft, Plus, Edit2, Trash2, Calculator, Calendar } from 'lucide-react';

const AdminPropinas = () => {
    const navigate = useNavigate();
    const rol = localStorage.getItem('rol');
    
    const handleVolver = () => {
        if (rol === 'Mesera') {
            navigate('/mesera');
        } else {
            navigate('/admin/menu');
        }
    };

    const [semanas, setSemanas] = useState([]);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const data = await getSemanas();
            setSemanas(data);
        } catch (error) {
            showError("Error al cargar datos", error);
        }
    };

    const handleNuevaSemana = async () => {
        const format = (d) => d.toISOString().split('T')[0];
        const hoy = new Date();
        const dayOfWeek = hoy.getDay(); // 0 = Sun, 1 = Mon, 2 = Tue
        const distToTue = (dayOfWeek >= 2) ? dayOfWeek - 2 : dayOfWeek + 5;
        
        const martesInicio = new Date(hoy);
        martesInicio.setDate(hoy.getDate() - distToTue);
        
        const lunesFin = new Date(martesInicio);
        lunesFin.setDate(martesInicio.getDate() + 6);

        try {
            const res = await createSemana({ 
                fecha_inicio: format(martesInicio), 
                fecha_fin: format(lunesFin) 
            });
            showSuccess("Semana creada");
            navigate(`/propinas/${res.id}`);
        } catch (error) {
            showError("Error", error);
        }
    };

    return (
        <Layout title="Gestión de Propinas Semanales">
            <div className="dashboard-header">
                <button className="btn-secondary" onClick={handleVolver}>
                    <ArrowLeft size={16} />
                    <span>Volver al Menú</span>
                </button>
                <h2>Registro de Propinas</h2>
                <button className="btn-primary" onClick={handleNuevaSemana}>
                    <Calendar size={20} />
                    <span>Nueva Semana</span>
                </button>
            </div>

            <div className="card mt-2">
                <div className="table-container">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Fechas (Mar-Lun)</th>
                                    <th>Total Recaudado</th>
                                    <th>Estado</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {semanas.length > 0 ? semanas.map(s => {
                                    const total = Number(s.total_efectivo) + Number(s.incluido_martes) + Number(s.incluido_miercoles) + Number(s.incluido_jueves) + Number(s.incluido_viernes) + Number(s.incluido_sabado) + Number(s.incluido_domingo) + Number(s.incluido_lunes);
                                    return (
                                        <tr key={s.id}>
                                            <td>{new Date(s.fecha_inicio).toLocaleDateString()} - {new Date(s.fecha_fin).toLocaleDateString()}</td>
                                            <td>${total.toFixed(0)}</td>
                                            <td>
                                                <span className={`status-badge ${s.estado === 'Cerrado' ? 'success' : 'warning'}`}>
                                                    {s.estado}
                                                </span>
                                            </td>
                                            <td>
                                                <button className="btn-icon" onClick={() => navigate(`/propinas/${s.id}`)}>
                                                    <Calculator size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                }) : (
                                    <tr><td colSpan="4" className="text-center">No hay semanas registradas</td></tr>
                                )}
                            </tbody>
                        </table>
                </div>
            </div>
        </Layout>
    );
};

export default AdminPropinas;
