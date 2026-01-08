
import React, { useState } from 'react';
import { Trip, User } from '../types';
import TripForm from './TripForm';
import { Plus, Edit2, Trash2, FileText, Download, Search, CheckCircle, Gauge } from 'lucide-react';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';

interface TripManagerProps {
  trips: Trip[];
  onAddTrip: (trip: Omit<Trip, 'id'>) => void;
  onUpdateTrip: (trip: Trip) => void;
  onCompleteTrip: (trip: Trip) => void;
  onDeleteTrip: (id: string) => void;
  isAdmin: boolean;
  operators: User[];
}

const TripManager: React.FC<TripManagerProps> = ({ trips, onAddTrip, onUpdateTrip, onCompleteTrip, onDeleteTrip, isAdmin, operators }) => {
  const [view, setView] = useState<'list' | 'form'>('list');
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const handleAdd = () => {
    setEditingTrip(null);
    setView('form');
  };

  const handleEdit = (trip: Trip) => {
    setEditingTrip(trip);
    setView('form');
  };

  const handleDelete = (trip: Trip) => {
    if (window.confirm(`¿Estás seguro de que deseas borrar el registro del viaje para el cliente "${trip.client}"? Esta acción no se puede deshacer.`)) {
      onDeleteTrip(trip.id);
    }
  };

  const handleComplete = (trip: Trip) => {
    if (window.confirm(`¿Confirmas que deseas cerrar y dar por finalizado el viaje de "${trip.project}"?`)) {
      onCompleteTrip(trip);
    }
  };

  const getOperatorAvatar = (id: string, name: string) => {
    const op = operators.find(o => o.id === id || o.name === name);
    return op?.avatar || `https://i.pravatar.cc/100?u=${id}`;
  };

  const exportToExcel = () => {
    const dataForExport = trips.map(({ id, ...rest }) => ({
      ...rest,
      Distancia: rest.endMileage && rest.startMileage ? rest.endMileage - rest.startMileage : 'N/A'
    }));
    const worksheet = XLSX.utils.json_to_sheet(dataForExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Viajes");
    XLSX.writeFile(workbook, "Reporte_Viajes_LogiTrack.xlsx");
  };

  const exportToPDF = (trip: Trip) => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.setTextColor(59, 130, 246);
    doc.text(`Bitácora de Operaciones: ${trip.project}`, 10, 20);
    
    doc.setFontSize(12);
    doc.setTextColor(100, 116, 139);
    doc.text(`Detalle del Viaje: ${trip.id}`, 10, 30);
    
    doc.setDrawColor(226, 232, 240);
    doc.line(10, 35, 200, 35);
    
    doc.setTextColor(30, 41, 59);
    doc.text(`Cliente: ${trip.client}`, 10, 45);
    doc.text(`Fecha de Inicio: ${trip.startDate}`, 10, 55);
    doc.text(`Unidad: ${trip.vehicleId}`, 10, 65);
    doc.text(`Hora de Cita: ${trip.appointmentTime}`, 10, 75);
    doc.text(`Dirección: ${trip.street} #${trip.number}`, 10, 85);
    doc.text(`Colonia: ${trip.neighborhood}, C.P. ${trip.zip}`, 10, 95);
    doc.text(`Estatus: ${trip.status.toUpperCase()}`, 10, 105);
    doc.text(`Operador: ${trip.operatorName}`, 10, 115);
    
    if (trip.startMileage || trip.endMileage) {
      doc.setFontSize(10);
      doc.setTextColor(51, 65, 85);
      doc.text(`Kilometraje Inicial: ${trip.startMileage || '0'} KM`, 10, 125);
      doc.text(`Kilometraje Final: ${trip.endMileage || 'Pendiente'} KM`, 10, 132);
      if (trip.endMileage && trip.startMileage) {
        doc.setFont("helvetica", "bold");
        doc.text(`DISTANCIA TOTAL RECORRIDA: ${trip.endMileage - trip.startMileage} KM`, 10, 140);
      }
    }

    if (trip.aiInsights) {
      doc.setDrawColor(251, 191, 36);
      doc.setFillColor(255, 251, 235);
      doc.rect(10, 150, 190, 40, 'FD');
      doc.setTextColor(146, 64, 14);
      doc.text("Recomendaciones IA:", 15, 160);
      const splitText = doc.splitTextToSize(trip.aiInsights, 180);
      doc.text(splitText, 15, 170);
    }

    // Agregar miniatura de mapa representativa
    const mapUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${trip.street}+${trip.number},${trip.zip}&zoom=15&size=200x200&key=MAPS_API_KEY`;
    // Nota: Como no tenemos API Key real, se usa el espacio reservado para la lógica de PDF
    
    doc.save(`Viaje_${trip.client}_${trip.startDate}.pdf`);
  };

  const filteredTrips = trips.filter(t => 
    t.client.toLowerCase().includes(searchTerm.toLowerCase()) || 
    t.project.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.vehicleId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.operatorName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (view === 'form') {
    return (
      <TripForm 
        onAddTrip={(data) => { onAddTrip(data); setView('list'); }}
        onUpdateTrip={(data) => { onUpdateTrip(data); setView('list'); }}
        editingTrip={editingTrip}
        onCancel={() => setView('list')}
        operators={operators}
        isAdmin={isAdmin}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Gestión de Viajes</h2>
          <p className="text-slate-500 text-sm">Administra y exporta los registros de operación.</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button 
            onClick={exportToExcel}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all text-sm font-semibold"
          >
            <Download size={16} />
            Excel
          </button>
          <button 
            onClick={handleAdd}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all text-sm font-semibold shadow-lg shadow-blue-100"
          >
            <Plus size={16} />
            Nuevo
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Buscar cliente, proyecto u operador..."
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[800px]">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Viaje / Cliente</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Operador / Unidad</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Recorrido</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Estado</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTrips.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic">
                    No se encontraron registros.
                  </td>
                </tr>
              ) : (
                filteredTrips.map((trip) => {
                  const distance = trip.endMileage && trip.startMileage ? trip.endMileage - trip.startMileage : null;
                  return (
                    <tr key={trip.id} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-bold text-slate-800 leading-tight">{trip.project}</p>
                          <p className="text-sm text-slate-500 leading-tight">{trip.client}</p>
                          <p className="text-[10px] text-slate-400 mt-1 truncate max-w-[200px]">{trip.street} #{trip.number}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 border border-slate-200 bg-slate-100">
                            <img 
                              src={getOperatorAvatar(trip.operatorId, trip.operatorName)} 
                              alt={trip.operatorName}
                              className="w-full h-full object-cover"
                              onError={(e) => e.currentTarget.src = 'https://i.pravatar.cc/100'}
                            />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-semibold text-slate-700">{trip.operatorName}</span>
                            <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-[10px] font-mono font-bold w-fit mt-1">
                              {trip.vehicleId}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-black text-slate-700">{distance ? `${distance} KM` : '---'}</span>
                          {trip.startMileage && (
                            <span className="text-[10px] text-slate-400 flex items-center gap-1">
                              <Gauge size={10}/> {trip.startMileage} → {trip.endMileage || '?'}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <StatusBadge status={trip.status} />
                          {isAdmin && trip.status === 'in_progress' && (
                            <button 
                              onClick={() => handleComplete(trip)}
                              className="px-2 py-1 bg-emerald-50 text-emerald-600 rounded text-[9px] font-black uppercase tracking-widest hover:bg-emerald-600 hover:text-white transition-all border border-emerald-200"
                            >
                              Finalizar
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                          {isAdmin && trip.status === 'in_progress' && (
                            <button 
                              onClick={() => handleComplete(trip)}
                              title="Cerrar Viaje"
                              className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg"
                            >
                              <CheckCircle size={18} />
                            </button>
                          )}
                          <button 
                            onClick={() => exportToPDF(trip)}
                            title="Descargar PDF"
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                          >
                            <FileText size={18} />
                          </button>
                          <button 
                            onClick={() => handleEdit(trip)}
                            title="Editar"
                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button 
                            onClick={() => handleDelete(trip)}
                            title="Borrar"
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const StatusBadge = ({ status }: { status: Trip['status'] }) => {
  const styles = {
    scheduled: 'bg-blue-100 text-blue-700',
    in_progress: 'bg-amber-100 text-amber-700',
    completed: 'bg-emerald-100 text-emerald-700',
    cancelled: 'bg-red-100 text-red-700',
  };
  const labels = {
    scheduled: 'Programado',
    in_progress: 'En ruta',
    completed: 'Finalizado',
    cancelled: 'Cancelado',
  };
  return <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${styles[status]}`}>{labels[status]}</span>;
};

export default TripManager;
