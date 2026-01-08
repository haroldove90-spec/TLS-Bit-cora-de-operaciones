
import React, { useMemo } from 'react';
import { LogBookEntry } from '../types';
import { FileDown, Search, Truck, User, Calendar, DollarSign, ExternalLink } from 'lucide-react';
import * as XLSX from 'xlsx';

interface LogBookAuditProps {
  logBookEntries: LogBookEntry[];
}

const LogBookAudit: React.FC<LogBookAuditProps> = ({ logBookEntries }) => {
  const completedLogs = useMemo(() => logBookEntries.filter(l => l.status === 'completed'), [logBookEntries]);

  const exportToExcel = () => {
    const data = completedLogs.map(l => ({
      Fecha: l.timestamp,
      Cliente: l.client,
      Viaje: l.trip_num,
      Unidad: l.unit_eco,
      Operador: l.operator_name,
      Distancia_KM: l.total_distance,
      Total_Gastos: l.total_expenses,
      Gastos_Efectivo: l.subtotal_cash,
      Gastos_Electronicos: l.subtotal_electronic,
      Destinos: l.destinations
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Bitacoras_Terminadas");
    XLSX.writeFile(wb, "Reporte_Bitacoras_Finalizadas.xlsx");
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div><h2 className="text-2xl font-black text-slate-800 tracking-tight">Registro General de Bitácoras</h2><p className="text-slate-500 font-medium italic">Historial completo para auditoría y descarga.</p></div>
        <button onClick={exportToExcel} className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-emerald-700 shadow-xl shadow-emerald-100 transition-all active:scale-95"><FileDown size={18} /> EXPORTAR EXCEL</button>
      </header>

      <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[1000px]">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Información de Viaje</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Recorrido</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Monto Total</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Operador</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Estatus</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {completedLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-50 text-blue-600 rounded-xl"><Truck size={18}/></div>
                      <div>
                        <p className="text-sm font-black text-slate-900">{log.client}</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Folio: {log.trip_num} • ECO: {log.unit_eco}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-xs font-bold text-slate-800">{log.total_distance || 0} KM</p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase">{log.destinations || 'S/D'}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-black text-emerald-600">$ {log.total_expenses.toLocaleString()}</p>
                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Liquidado</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                       <span className="text-xs font-bold text-slate-700">{log.operator_name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-[8px] font-black uppercase tracking-widest">Finalizada</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default LogBookAudit;
