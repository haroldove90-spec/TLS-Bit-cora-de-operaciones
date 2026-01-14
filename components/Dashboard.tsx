
import React, { useState, useEffect, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from 'recharts';
import { User, UserRole, Trip, Expense, AppNotification, LogBookEntry, Section } from '../types';
import { TrendingUp, Truck, Bell, Sparkles, BookOpen, Clock, ChevronRight, Globe, Edit3, Gauge, ShieldCheck, Zap, AlertCircle } from 'lucide-react';
import { getFleetStatusSummary } from '../services/geminiService';
import MapView from './MapView';
import { marked } from 'marked';

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
    .slice(-8)
    .map(e => ({ name: e.operatorName.split(' ')[0], kmL: e.performance }));

  const getOperatorAvatar = (id: string, name: string) => {
    const op = operators.find(o => o.id === id || o.name === name);
    return op?.avatar || `https://i.pravatar.cc/150?u=${id}`;
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-500 max-w-full overflow-x-hidden">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-1">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tighter">
            {isAdmin ? 'Panel de Control de Flota' : 'Mi Bitácora de Vuelo'}
          </h2>
          <p className="text-slate-500 font-medium text-xs sm:text-sm">
            {isAdmin ? 'Supervisión global de activos y logística.' : `Bienvenido de vuelta, ${user.name.split(' ')[0]}. Revisa tus pendientes.`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex bg-emerald-50 px-4 py-2 rounded-2xl border border-emerald-100 items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">Servidor Activo</span>
          </div>
          <button 
            onClick={() => window.location.reload()}
            className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-blue-600 transition-colors"
          >
            <Clock size={20} />
          </button>
        </div>
      </header>

      {/* Main Grid: Map & Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-200 overflow-hidden h-[400px] lg:h-[550px] relative w-full group">
            <MapView trips={myTrips} userRole={user.role} currentUserCoords={userCoords} />
            <div className="absolute bottom-6 left-6 z-[20] flex gap-2">
              <span className="px-4 py-2 bg-slate-900/90 backdrop-blur-md text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 border border-white/10 shadow-2xl">
                <Truck size={14} className="text-blue-400" /> {activeTripsCount} Unidades en Ruta
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatCard title="Total Gastos" value={`$${totalExpenses.toLocaleString()}`} icon={<TrendingUp className="text-emerald-500" />} color="emerald" />
            <StatCard title="Viajes Activos" value={activeTripsCount.toString()} icon={<Truck className="text-blue-500" />} color="blue" />
            <StatCard title="Bitácoras" value={myLogBooks.length.toString()} icon={<BookOpen className="text-purple-500" />} color="purple" subtitle={pendingLogCount > 0 ? `${pendingLogCount} por aceptar` : undefined} />
            <StatCard title="Alertas" value={notifications.filter(n => !n.read).length.toString()} icon={<Bell className="text-rose-500" />} color="rose" />
          </div>
        </div>

        {/* AI Sidebar & Notifications */}
        <div className="space-y-6">
          {isAdmin && (
            <div className="bg-slate-900 text-white p-8 rounded-[3rem] shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full -mr-16 -mt-16 group-hover:scale-125 transition-transform duration-700"></div>
              <div className="relative z-10 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-600 rounded-2xl shadow-lg shadow-blue-500/20">
                    <Sparkles size={20} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-blue-400">AI Command Center</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Análisis predictivo Gemini 3</p>
                  </div>
                </div>
                
                <div className="min-h-[200px] flex items-center justify-center">
                  {loadingAi ? (
                    <div className="flex flex-col items-center gap-4 py-8">
                      <Zap className="text-blue-500 animate-pulse" size={32} />
                      <p className="text-[10px] font-black uppercase tracking-widest text-blue-400 animate-bounce">Generando Reporte...</p>
                    </div>
                  ) : aiSummary ? (
                    <div className="ai-markdown-content text-[11px] text-slate-300 leading-relaxed max-h-[300px] overflow-y-auto custom-scrollbar pr-2" 
                         dangerouslySetInnerHTML={{ __html: marked.parse(aiSummary) }} />
                  ) : (
                    <p className="text-xs text-slate-500 italic text-center">Iniciando auditoría de flota...</p>
                  )}
                </div>
                
                <button 
                  onClick={() => window.location.reload()}
                  className="w-full py-3 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white hover:text-slate-900 transition-all active:scale-95"
                >
                  Actualizar Análisis
                </button>
              </div>
            </div>
          )}

          <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-200">
            <h3 className="font-black text-sm text-slate-800 mb-6 flex justify-between items-center">
              Alertas Recientes 
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
            </h3>
            <div className="space-y-4">
              {notifications.slice(0, 4).map(notif => (
                <div key={notif.id} className="p-4 rounded-3xl bg-slate-50 border border-slate-100 flex gap-3 hover:bg-slate-100/50 transition-colors group">
                  <img src={getOperatorAvatar(notif.fromId, notif.fromName)} className="w-10 h-10 rounded-2xl object-cover shadow-sm group-hover:scale-110 transition-transform" alt="" />
                  <div className="min-w-0">
                    <p className="text-[9px] font-black text-blue-600 uppercase mb-0.5">{notif.fromName}</p>
                    <p className="text-[11px] font-bold text-slate-700 leading-tight truncate">{notif.message}</p>
                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">Hace un momento</p>
                  </div>
                </div>
              ))}
              {notifications.length === 0 && (
                <div className="py-8 text-center text-slate-300 italic text-xs">Sin avisos pendientes</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bitácoras Section */}
      <section className="bg-white p-8 sm:p-12 rounded-[3.5rem] shadow-sm border border-slate-200 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-slate-900 text-white rounded-3xl shadow-xl shadow-slate-200">
              <BookOpen size={24} />
            </div>
            <div>
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em]">Operatividad en Tiempo Real</h3>
              <p className="text-xl font-black text-slate-900 tracking-tight">Seguimiento de Bitácoras Activas</p>
            </div>
          </div>
          <button 
            onClick={() => onNavigateToSection?.('bitacora')}
            className="px-8 py-4 bg-slate-100 hover:bg-slate-900 hover:text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95"
          >
            Ver Historial Completo
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activeLogBooks.length === 0 ? (
            <div className="col-span-full py-20 text-center text-slate-300 bg-slate-50/50 rounded-[3rem] border-2 border-dashed border-slate-200">
              <Zap size={48} className="mx-auto mb-4 text-slate-200" />
              <p className="text-[11px] font-black uppercase tracking-[0.2em]">Tranquilidad absoluta. Sin bitácoras pendientes.</p>
            </div>
          ) : (
            activeLogBooks.map(log => (
              <div key={log.id} className="bg-slate-50 p-8 rounded-[3rem] border border-slate-100 hover:bg-white hover:shadow-2xl hover:border-blue-100 transition-all group relative overflow-hidden">
                <div className={`absolute top-0 right-0 w-2 h-full ${log.status === 'pending' ? 'bg-amber-400' : 'bg-blue-500'}`}></div>
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${log.status === 'pending' ? 'bg-amber-500 animate-pulse' : 'bg-blue-500'}`}></div>
                    <span className={`text-[10px] font-black uppercase tracking-widest ${log.status === 'pending' ? 'text-amber-600' : 'text-blue-600'}`}>
                      {log.status === 'pending' ? 'Por Validar' : 'Operando'}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{new Date(log.timestamp).toLocaleDateString()}</span>
                </div>
                
                <h4 className="font-black text-slate-900 text-2xl leading-tight mb-2 truncate group-hover:text-blue-600 transition-colors">{log.client}</h4>
                <div className="flex items-center gap-4 mb-8">
                  <div className="px-3 py-1 bg-slate-200 text-slate-700 rounded-lg text-[10px] font-black uppercase tracking-widest">
                    ECO {log.unit_eco}
                  </div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Viaje: {log.trip_num}
                  </div>
                </div>
                
                <div className="flex items-center justify-between pt-6 border-t border-slate-200/60">
                  <div className="flex items-center gap-3">
                     <img src={getOperatorAvatar(log.operator_id, log.operator_name)} className="w-8 h-8 rounded-xl object-cover border-2 border-white shadow-sm" alt="" />
                     <div>
                       <p className="text-[9px] font-black text-slate-400 uppercase leading-none mb-0.5">Operador</p>
                       <span className="text-[10px] font-black text-slate-700 uppercase">{log.operator_name || 'Sin Asignar'}</span>
                     </div>
                  </div>
                  <button 
                    onClick={() => onNavigateToSection?.('bitacora', log.id)} 
                    className="p-3 bg-blue-600 text-white rounded-2xl shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all active:scale-90"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Performance Section */}
      <div className="bg-white p-10 rounded-[3.5rem] shadow-sm border border-slate-200">
        <div className="flex items-center gap-3 mb-10">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl"><Gauge size={24} /></div>
          <div>
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Eficiencia Energética</h3>
            <p className="text-xl font-black text-slate-900">Rendimiento Promedio (km/L)</p>
          </div>
        </div>
        <div className="h-64 sm:h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#94a3b8' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} />
              <Tooltip 
                cursor={{ fill: '#f8fafc' }} 
                contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontWeight: 800, fontSize: '12px' }} 
              />
              <Bar dataKey="kmL" radius={[12, 12, 0, 0]} barSize={40}>
                {performanceData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.kmL > 5 ? '#10b981' : '#f59e0b'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon, subtitle, color }: any) => {
  const colorStyles: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    purple: 'bg-purple-50 text-purple-600 border-purple-100',
    rose: 'bg-rose-50 text-rose-600 border-rose-100'
  };

  return (
    <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-200 hover:border-blue-200 hover:shadow-xl transition-all group">
      <div className={`p-3 rounded-2xl w-fit mb-4 transition-transform group-hover:scale-110 ${colorStyles[color]}`}>
        {icon}
      </div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{title}</p>
      <h4 className="text-2xl font-black text-slate-800 tracking-tighter">{value}</h4>
      {subtitle && (
        <div className="mt-2 flex items-center gap-1.5 text-rose-500 animate-pulse">
          <AlertCircle size={10} />
          <span className="text-[8px] font-black uppercase tracking-widest">{subtitle}</span>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
