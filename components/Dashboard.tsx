
import React, { useState, useEffect, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { User, UserRole, Trip, Expense, AppNotification, LogBookEntry, Section } from '../types';
import { TrendingUp, Truck, Bell, Sparkles, BookOpen, Clock, ChevronRight, Globe, Edit3, Gauge } from 'lucide-react';
import { getFleetStatusSummary } from '../services/geminiService';
import MapView from './MapView';

interface DashboardProps {
  user: User;
  trips: Trip[];
  expenses: Expense[];
  notifications: AppNotification[];
  operators: User[];
  logBookEntries?: LogBookEntry[];
  onUpdateLogBookStatus?: (id: string, status: LogBookEntry['status']) => Promise<void>;
  onNavigateToSection?: (section: Section, logId?: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ 
  user, trips, expenses, notifications, operators, logBookEntries = [], onUpdateLogBookStatus, onNavigateToSection
}) => {
  const isAdmin = user.role === UserRole.ADMIN;
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);
  const [userCoords, setUserCoords] = useState<{lat: number, lng: number} | undefined>(undefined);

  useEffect(() => {
    if (isAdmin && trips.length > 0) {
      const fetchAiStatus = async () => {
        setLoadingAi(true);
        const summary = await getFleetStatusSummary(trips, expenses, notifications.filter(n => n.type === 'alert'));
        setAiSummary(summary);
        setLoadingAi(false);
      };
      fetchAiStatus();
    }
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      }, null, { enableHighAccuracy: true });
    }
  }, [trips.length, expenses.length, isAdmin]);

  const myTrips = useMemo(() => isAdmin ? trips : trips.filter(t => t.operatorId === user.id), [trips, user.id, isAdmin]);
  const myExpenses = useMemo(() => isAdmin ? expenses : expenses.filter(e => e.operatorId === user.id), [expenses, user.id, isAdmin]);
  
  // Bitácoras que me pertenecen o que están vacantes (para que el operador las vea)
  const myLogBooks = useMemo(() => {
    if (isAdmin) return logBookEntries;
    return logBookEntries.filter(l => l.operator_id === user.id || (!l.operator_id || l.operator_id === ''));
  }, [logBookEntries, user.id, isAdmin]);

  const activeLogBooks = useMemo(() => {
    return myLogBooks.filter(l => l.status === 'pending' || l.status === 'approved');
  }, [myLogBooks]);

  const totalExpenses = myExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  const activeTripsCount = myTrips.filter(t => t.status === 'in_progress').length;
  const pendingLogCount = myLogBooks.filter(l => l.status === 'pending').length;

  const performanceData = myExpenses
    .filter(e => e.category === 'fuel' && e.performance)
    .slice(-5)
    .map(e => ({ name: e.operatorName.split(' ')[0], kmL: e.performance }));

  const getOperatorAvatar = (id: string, name: string) => {
    const op = operators.find(o => o.id === id || o.name === name);
    return op?.avatar || `https://i.pravatar.cc/150?u=${id}`;
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-500 max-w-full overflow-x-hidden">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-1">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">Dashboard Operativo</h2>
          <p className="text-slate-500 font-medium text-xs sm:text-sm">
            {isAdmin ? 'Visualización de activos y flota.' : `Bienvenido al centro de mando, ${user.name.split(' ')[0]}.`}
          </p>
        </div>
        <div className="hidden sm:flex bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse ring-4 ring-emerald-500/20"></div>
          <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Sincronizado</span>
        </div>
      </header>

      <div className="bg-white rounded-[2rem] shadow-xl border border-slate-200 overflow-hidden h-[300px] sm:h-[400px] lg:h-[500px] relative w-full">
        <MapView trips={myTrips} userRole={user.role} currentUserCoords={userCoords} />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard title="Gastos" value={`$${totalExpenses.toLocaleString()}`} icon={<TrendingUp className="text-emerald-500" />} />
        <StatCard title="En Ruta" value={activeTripsCount.toString()} icon={<Truck className="text-blue-500" />} />
        <StatCard title="Bitácoras" value={myLogBooks.length.toString()} icon={<BookOpen className="text-purple-500" />} subtitle={pendingLogCount > 0 ? `${pendingLogCount} nuevas` : undefined} />
        <StatCard title="Notificaciones" value={notifications.filter(n => !n.read).length.toString()} icon={<Bell className="text-rose-500" />} />
      </div>

      <section className="bg-white p-5 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] shadow-sm border border-slate-200 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl"><Clock size={20} /></div>
            <div>
              <h3 className="text-[10px] sm:text-xs font-black text-slate-800 uppercase tracking-[0.2em]">Bitácoras en Seguimiento</h3>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Registros activos y por llenar.</p>
            </div>
          </div>
          <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-2 ${activeLogBooks.length > 0 ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-400'}`}>
            <div className={`w-1.5 h-1.5 rounded-full ${activeLogBooks.length > 0 ? 'bg-blue-600 animate-pulse' : 'bg-slate-300'}`}></div>
            {activeLogBooks.length} ACTIVAS
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {activeLogBooks.length === 0 ? (
            <div className="col-span-full py-12 text-center text-slate-300 bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-100">
              <p className="text-[10px] font-black uppercase tracking-widest italic">Sin bitácoras activas.</p>
            </div>
          ) : (
            activeLogBooks.map(log => (
              <div key={log.id} className="bg-slate-50 p-5 rounded-3xl border border-slate-100 hover:bg-white hover:shadow-xl transition-all group">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                    <Globe size={14} className={log.status === 'pending' ? 'text-amber-500 animate-pulse' : 'text-blue-500'} />
                    <span className={`text-[9px] font-black uppercase tracking-widest ${log.status === 'pending' ? 'text-amber-600' : 'text-blue-600'}`}>
                      {log.status === 'pending' ? 'POR ACEPTAR' : 'EN CURSO'}
                    </span>
                  </div>
                  <span className="text-[9px] font-bold text-slate-400">{new Date(log.timestamp).toLocaleDateString()}</span>
                </div>
                <h4 className="font-black text-slate-900 text-base leading-tight mb-1 truncate group-hover:text-blue-600">{log.client}</h4>
                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-4">Viaje: {log.trip_num} • ECO: {log.unit_eco}</p>
                
                <div className="flex items-center justify-between pt-4 border-t border-slate-200/60">
                  <div className="flex items-center gap-2">
                     <img src={getOperatorAvatar(log.operator_id, log.operator_name)} className="w-6 h-6 rounded-lg object-cover" alt="" />
                     <span className="text-[9px] font-black text-slate-600 uppercase truncate max-w-[70px]">{log.operator_name || 'Sin Asignar'}</span>
                  </div>
                  <div className="flex gap-2">
                    {log.status === 'approved' && (
                      <button onClick={() => onNavigateToSection?.('bitacora', log.id)} className="px-3 py-1.5 bg-blue-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg hover:bg-blue-700 transition-all flex items-center gap-1.5">
                        <Edit3 size={12} /> Editar
                      </button>
                    )}
                    {isAdmin && (
                      <button onClick={async () => { if(window.confirm('¿Finalizar bitácora?')) await onUpdateLogBookStatus?.(log.id, 'completed'); }} className="px-3 py-1.5 bg-emerald-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg hover:bg-emerald-700">
                        Finalizar
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-200">
            <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2 mb-6"><Gauge size={18} className="text-blue-500" /> Rendimiento de Operadores</h3>
            <div className="h-48 sm:h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={performanceData}>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 700 }} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', fontSize: '10px' }} />
                  <Bar dataKey="kmL" radius={[4, 4, 0, 0]}>
                    {performanceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.kmL > 5 ? '#10b981' : '#f59e0b'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-200 h-[350px] overflow-y-auto custom-scrollbar">
          <h3 className="font-bold text-sm text-slate-800 mb-4 flex justify-between items-center">Avisos Recientes <Bell size={16} className="text-blue-600" /></h3>
          <div className="space-y-3">
            {notifications.slice(0, 5).map(notif => (
              <div key={notif.id} className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex gap-3">
                <img src={getOperatorAvatar(notif.fromId, notif.fromName)} className="w-8 h-8 rounded-full object-cover" alt="" />
                <div>
                  <p className="text-[9px] font-black text-blue-600 uppercase mb-0.5">{notif.fromName}</p>
                  <p className="text-[10px] font-medium text-slate-700 leading-tight line-clamp-2">{notif.message}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon, subtitle }: any) => (
  <div className="bg-white p-4 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem] shadow-sm border border-slate-200 hover:border-blue-100 transition-all">
    <div className="flex justify-between mb-2"><div className="p-2 bg-slate-50 rounded-xl">{icon}</div></div>
    <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{title}</p>
    <h4 className="text-lg sm:text-2xl font-black text-slate-800">{value}</h4>
    {subtitle && <p className="text-[8px] font-bold text-rose-500 uppercase mt-1 animate-pulse">{subtitle}</p>}
  </div>
);

export default Dashboard;
