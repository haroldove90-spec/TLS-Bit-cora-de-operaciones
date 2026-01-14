
import React, { useMemo } from 'react';
import { LogBookEntry } from '../types';
import { FileDown, Truck, Gauge } from 'lucide-react';
import * as XLSX from 'xlsx';

interface LogBookAuditProps {
  logBookEntries: LogBookEntry[];
}

const LogBookAudit: React.FC<LogBookAuditProps> = ({ logBookEntries }) => {
  const allLogs = useMemo(() => logBookEntries, [logBookEntries]);

  const exportToExcel = () => {
    const data = allLogs.map(l => ({
      Fecha: l.timestamp,
      Cliente: l.client,
      Viaje: l.trip_num,
      Unidad: l.unit_eco,
      Operador: l.operator_name,
      Distancia_KM: l.total_distance,
      Total_Gastos: l.total_expenses,
      Gastos_Efectivo: l.subtotal_cash,
      Gastos_Electronicos: l.subtotal_electronic,
      Destinos: l.destinations,
      Estatus: l.status.toUpperCase()
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Auditoria_Bitacoras");
    XLSX.writeFile(wb, "Reporte_General_Bitacoras.xlsx");
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-emerald-100 text-emerald-700';
      case 'pending': return 'bg-amber-100 text-amber-700';
      case 'approved': return 'bg-blue-100 text-blue-700';
      case 'rejected': return 'bg-rose-100 text-rose-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed': return 'Finalizada';
      case 'pending': return 'Pendiente';
      case 'approved': return 'En Curso';
      case 'rejected': return 'Rechazada';
      default: return status;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-1">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Registro General de Bitácoras</h2>
          <p className="text-slate-500 font-medium italic text-xs uppercase tracking-widest">Historial completo de liquidación</p>
        </div>
        <button onClick={exportToExcel} className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-slate-800 shadow-xl transition-all active:scale-95">
          <FileDown size={18} /> EXPORTAR EXCEL
        </button>
      </header>

      <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm print:shadow-none print:border-none">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[1000px]">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Viaje / Folio</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Ruta / Distancia</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Monto Liquidado</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Operador</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Estatus</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {allLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-slate-900 text-white rounded-xl"><Truck size={16}/></div>
                      <div>
                        <p className="text-sm font-black text-slate-900 uppercase tracking-tighter">{log.client}</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Folio: {log.trip_num} • ECO: {log.unit_eco}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                       <Gauge size={12} className="text-blue-500" />
                       <p className="text-xs font-black text-slate-800">{log.total_distance || 0} KM</p>
                    </div>
                    <p className="text-[9px] font-bold text-slate-400 uppercase truncate max-w-[200px]">{log.destinations || 'Ruta Local'}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-black text-slate-900">$ {log.total_expenses.toLocaleString()}</p>
                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Efectivo + Tarjeta</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-black text-slate-700 uppercase">{log.operator_name || 'Sin Asignar'}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${getStatusStyle(log.status)}`}>
                      {getStatusLabel(log.status)}
                    </span>
                  </td>
                </tr>
              ))}
              {allLogs.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic font-bold uppercase tracking-widest text-[10px]">Sin registros para mostrar.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default LogBookAudit;
