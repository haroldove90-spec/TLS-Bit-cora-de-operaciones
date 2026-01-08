
import React from 'react';
import { CheckCircle, MapPin, Play, Home, MessageSquare, BellRing, Truck, Sparkles, Clock, AlertTriangle, BookOpen, ChevronRight } from 'lucide-react';
import { Trip, LogBookEntry } from '../types';

interface OperatorActionsProps {
  scheduledTrips: Trip[];
  inProgressTrip: Trip | undefined;
  pendingLogBooks?: LogBookEntry[];
  onSendNotification: (message: string, type: 'info' | 'alert' | 'success' | 'request') => void;
  onAcceptTrip: (trip: Trip) => void;
  onAcceptLogBook?: (id: string) => void;
}

const OperatorActions: React.FC<OperatorActionsProps> = ({ 
  scheduledTrips, 
  inProgressTrip, 
  pendingLogBooks = [],
  onSendNotification, 
  onAcceptTrip,
  onAcceptLogBook
}) => {
  const hasScheduled = scheduledTrips.length > 0;
  const hasLogBooks = pendingLogBooks.length > 0;

  return (
    <div className="space-y-6 animate-in slide-in-from-top-4 duration-500">
      {/* Sección de Bitácoras Nuevas (Prioridad) */}
      {hasLogBooks && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-2 px-2">
            <BookOpen className="text-blue-600 animate-pulse" size={18} />
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Bitácoras por Aceptar</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingLogBooks.map(log => (
              <div key={log.id} className="bg-white rounded-[2rem] p-6 border-2 border-blue-100 shadow-xl shadow-blue-50/50 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <span className="px-2 py-1 bg-blue-600 text-white rounded-lg text-[8px] font-black uppercase tracking-widest">Nueva Asignación</span>
                    <span className="text-[10px] font-bold text-slate-400">{new Date(log.timestamp).toLocaleDateString()}</span>
                  </div>
                  <div>
                    <h4 className="text-xl font-black text-slate-900 leading-tight">{log.client}</h4>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">
                      Viaje: {log.trip_num} • ECO: {log.unit_eco}
                    </p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Destinos:</p>
                    <p className="text-xs font-bold text-slate-700 truncate">{log.destinations || 'No especificado'}</p>
                  </div>
                </div>
                <button 
                  onClick={() => onAcceptLogBook?.(log.id)}
                  className="mt-6 w-full py-4 bg-blue-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-blue-200 hover:bg-blue-700 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <CheckCircle size={16} /> Aceptar y Comenzar Registro
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Viajes Programados (Tabla Trips clásica) */}
      {hasScheduled && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-2 px-2">
            <AlertTriangle className="text-amber-500 animate-pulse" size={18} />
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Viajes Programados</h3>
          </div>
          {scheduledTrips.map(trip => (
            <div key={trip.id} className="bg-indigo-600 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden group border-4 border-white ring-4 ring-indigo-100">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform"></div>
              <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="space-y-2 text-center md:text-left">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/30 animate-pulse">
                    <Sparkles size={12} className="text-amber-300" /> Viaje Programado
                  </div>
                  <h3 className="text-3xl font-black">{trip.client}</h3>
                  <p className="text-indigo-100 font-medium flex items-center justify-center md:justify-start gap-2">
                    <Clock size={16} /> Cita: {trip.appointmentTime} • Unidad {trip.vehicleId}
                  </p>
                </div>
                <button 
                  onClick={() => onAcceptTrip(trip)}
                  className="w-full md:w-auto px-10 py-5 bg-white text-indigo-600 rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-xl hover:bg-slate-50 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <CheckCircle size={20} className="animate-pulse" /> Confirmar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Viaje en Curso */}
      {inProgressTrip ? (
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-50 rounded-2xl text-blue-600 shadow-sm">
                <BellRing size={20} className="animate-swing" />
              </div>
              <div>
                <h3 className="font-black text-slate-800 tracking-tight uppercase text-xs">Control Operativo en Ruta</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Viaje: {inProgressTrip.client}</p>
              </div>
            </div>
            <div className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-200 animate-pulse">
              En Ruta
            </div>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Llegada Carga', icon: MapPin, color: 'bg-blue-500', type: 'info' as const, msg: `Llegada al sitio de carga: ${inProgressTrip.client}` },
              { label: 'Inicio Ruta', icon: Play, color: 'bg-indigo-500', type: 'info' as const, msg: `Iniciando ruta: ${inProgressTrip.project}` },
              { label: 'Llegada Cliente', icon: Home, color: 'bg-purple-500', type: 'success' as const, msg: `Llegada al cliente final: ${inProgressTrip.client}` },
              { label: 'Atención', icon: MessageSquare, color: 'bg-rose-500', type: 'request' as const, msg: `SOLICITO ATENCIÓN para el viaje ${inProgressTrip.project}` },
            ].map((action, idx) => (
              <button
                key={idx}
                onClick={() => onSendNotification(action.msg, action.type)}
                className="flex flex-col items-center justify-center gap-3 p-6 rounded-3xl border border-slate-100 bg-slate-50 hover:bg-white hover:shadow-xl hover:border-blue-200 transition-all group"
              >
                <div className={`p-4 rounded-2xl ${action.color} text-white shadow-lg group-active:scale-90 transition-transform`}>
                  <action.icon size={20} />
                </div>
                <span className="text-[10px] font-black text-slate-700 text-center uppercase tracking-widest">{action.label}</span>
              </button>
            ))}
          </div>
        </div>
      ) : (!hasScheduled && !hasLogBooks) && (
        <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-200 text-center space-y-4">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300">
            <Truck size={32} />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-800">Sin Actividad Pendiente</h3>
            <p className="text-slate-500 font-medium text-sm italic">No tienes bitácoras lanzadas ni viajes activos.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default OperatorActions;
