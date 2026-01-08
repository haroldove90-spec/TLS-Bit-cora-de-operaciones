
import React, { useState } from 'react';
import { Activity, User } from '../types';
import { PlusCircle, Clock, MapPin, AlertCircle, CheckCircle2, Navigation } from 'lucide-react';

interface ActivityLogProps {
  activities: Activity[];
  operators: User[];
  onAddActivity: (activity: Omit<Activity, 'id' | 'timestamp'>) => void;
  activeTripId?: string; // Prop dinámica para evitar hardcode
}

const ActivityLog: React.FC<ActivityLogProps> = ({ activities, operators, onAddActivity, activeTripId }) => {
  const [desc, setDesc] = useState('');
  const [type, setType] = useState<Activity['type']>('status_update');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTripId) {
      alert("Selecciona un viaje activo para registrar una actividad.");
      return;
    }
    onAddActivity({ tripId: activeTripId, description: desc, type, operatorName: '' }); 
    setDesc('');
  };

  const getIcon = (type: Activity['type']) => {
    switch(type) {
      case 'check_in': return <MapPin className="text-blue-500" size={18} />;
      case 'incident': return <AlertCircle className="text-red-500" size={18} />;
      case 'maintenance': return <Clock className="text-amber-500" size={18} />;
      default: return <CheckCircle2 className="text-emerald-500" size={18} />;
    }
  };

  const getOperatorAvatar = (id?: string, name?: string) => {
    const op = operators.find(o => o.id === id || o.name === name);
    return op?.avatar || `https://i.pravatar.cc/100?u=${name}`;
  };

  return (
    <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 pb-20 px-2">
      <div className="lg:col-span-2 space-y-6">
        <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Timeline Operativo</h3>
        <div className="relative border-l-2 border-slate-200 ml-4 space-y-8 pb-8">
          {activities.filter(a => !activeTripId || a.tripId === activeTripId).length === 0 && <p className="ml-8 text-slate-500 italic text-sm">No hay registros hoy para este viaje.</p>}
          {activities.filter(a => !activeTripId || a.tripId === activeTripId).map((act) => (
            <div key={act.id} className="relative ml-8 group">
              <div className="absolute -left-12 top-0 w-8 h-8 rounded-full bg-white border-2 border-slate-200 flex items-center justify-center group-hover:border-blue-500 transition-colors z-10 shadow-sm">
                {getIcon(act.type)}
              </div>
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-all">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{act.type.replace('_', ' ')}</span>
                  <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1"><Clock size={10}/> {new Date(act.timestamp).toLocaleTimeString()}</span>
                </div>
                <p className="text-slate-800 font-medium leading-relaxed">{act.description}</p>
                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-50">
                   <img src={getOperatorAvatar(act.operatorId, act.operatorName)} className="w-6 h-6 rounded-full object-cover border border-slate-100" alt={act.operatorName} />
                   <p className="text-[10px] font-black text-blue-600 uppercase">{act.operatorName}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-6">
        <div className="bg-white p-6 rounded-2xl shadow-xl border border-slate-200 sticky top-6">
          <h4 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2"><PlusCircle className="text-blue-600" size={20} /> Evento Manual</h4>
          <form onSubmit={handleSubmit} className="space-y-4">
            <select className="w-full p-3 bg-slate-100 border border-slate-200 rounded-xl text-sm font-bold outline-none text-slate-900" value={type} onChange={(e) => setType(e.target.value as any)}>
              <option value="status_update">Actualización General</option>
              <option value="check_in">Check-in Localización</option>
              <option value="incident">Incidente en Ruta</option>
              <option value="maintenance">Parada Técnica</option>
            </select>
            <textarea required className="w-full p-4 bg-slate-100 border border-slate-200 rounded-xl text-sm outline-none min-h-[120px] text-slate-900 font-medium" placeholder="Describe lo sucedido..." value={desc} onChange={(e) => setDesc(e.target.value)} />
            <button className="w-full py-3.5 bg-slate-900 text-white rounded-xl font-black uppercase text-xs tracking-widest hover:bg-slate-800 transition-all shadow-lg">Guardar Registro</button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ActivityLog;
