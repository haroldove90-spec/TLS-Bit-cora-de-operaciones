
import React, { useState, useEffect, useCallback } from 'react';
import { User, UserRole, Section, Trip, Expense, AppNotification, AppMedia, LogBookEntry } from './types';
import { supabase } from './services/supabase';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import NotificationCenter from './components/NotificationCenter';
import PWAInstallPrompt from './components/PWAInstallPrompt';
import PermissionRequester from './components/PermissionRequester';
import ProfileManager from './components/ProfileManager';
import OperatorList from './components/OperatorList';
import MediaManager from './components/MediaManager';
import LogBookSection from './components/LogBookSection';
import LogBookAudit from './components/LogBookAudit';
import AuthForm from './components/LoginForm';
import OperatorActions from './components/OperatorActions';
import { Menu, Loader2, AlertCircle } from 'lucide-react';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [currentSection, setCurrentSection] = useState<Section>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const [trips, setTrips] = useState<Trip[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [operators, setOperators] = useState<User[]>([]);
  const [media, setMedia] = useState<AppMedia[]>([]);
  const [logBookEntries, setLogBookEntries] = useState<LogBookEntry[]>([]);
  const [activeLogId, setActiveLogId] = useState<string | undefined>(undefined);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const [tripsRes, expensesRes, notifsRes, profilesRes, mediaRes, logBooksRes] = await Promise.allSettled([
        supabase.from('trips').select('*').order('created_at', { ascending: false }),
        supabase.from('expenses').select('*').order('date', { ascending: false }),
        supabase.from('notifications').select('*').order('timestamp', { ascending: false }),
        supabase.from('profiles').select('*').order('created_at', { ascending: false }),
        supabase.from('media_assets').select('*').order('timestamp', { ascending: false }),
        supabase.from('bitacora_registros').select('*').order('timestamp', { ascending: false })
      ]);

      if (tripsRes.status === 'fulfilled' && tripsRes.value.data) setTrips(tripsRes.value.data);
      if (expensesRes.status === 'fulfilled' && expensesRes.value.data) setExpenses(expensesRes.value.data);
      if (notifsRes.status === 'fulfilled' && notifsRes.value.data) {
        setNotifications(notifsRes.value.data.map((n: any) => ({
          id: n.id, fromId: n.from_id, fromName: n.from_name, toId: n.to_id, 
          message: n.message, type: n.type, timestamp: n.timestamp, read: n.read
        })));
      }
      if (mediaRes.status === 'fulfilled' && mediaRes.value.data) setMedia(mediaRes.value.data);
      if (logBooksRes.status === 'fulfilled' && logBooksRes.value.data) setLogBookEntries(logBooksRes.value.data);
      if (profilesRes.status === 'fulfilled' && profilesRes.value.data) {
        setOperators(profilesRes.value.data.map((p: any) => ({ ...p, employeeId: p.employee_id })));
      }
    } catch (err) {
      console.error(err);
    } finally { 
      setIsLoading(false); 
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchData();
      const channel = supabase.channel('db-changes').on('postgres_changes', { event: '*', schema: 'public', table: 'bitacora_registros' }, () => fetchData()).on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, () => fetchData()).subscribe();
      return () => { supabase.removeChannel(channel); };
    }
  }, [user, fetchData]);

  const handleUpdateLogBookStatus = async (id: string, status: LogBookEntry['status'], operatorData?: {id: string, name: string}) => {
    const payload: any = { status };
    if (operatorData) { payload.operator_id = operatorData.id; payload.operator_name = operatorData.name; }
    await supabase.from('bitacora_registros').update(payload).eq('id', id);
    if (status === 'completed') {
      await supabase.from('notifications').insert([{ from_id: user?.id, from_name: user?.name, to_id: 'ADMIN', message: `El operador ${user?.name} finalizó su bitácora.`, type: 'success', timestamp: new Date().toISOString(), read: false }]);
    }
    fetchData();
  };

  const handleSaveLogBook = async (entry: Partial<LogBookEntry>) => {
    const isNew = !entry.id;
    const { data, error } = await supabase.from('bitacora_registros').upsert([entry]).select().single();
    if (error) throw error;

    if (isNew && user?.role === UserRole.ADMIN) {
      await supabase.from('notifications').insert([{ from_id: user.id, from_name: user.name, to_id: entry.operator_id || 'OPERATORS_ALL', message: `Se ha lanzado una nueva bitácora para el cliente: ${entry.client}`, type: 'info', timestamp: new Date().toISOString(), read: false }]);
    }
    fetchData();
    return data;
  };

  const handleDeleteLogBook = async (id: string) => {
    const { error } = await supabase.from('bitacora_registros').delete().eq('id', id);
    if (error) {
      alert("Error al eliminar la bitácora");
      console.error(error);
    } else {
      fetchData();
    }
  };

  if (!user) return <AuthForm onLogin={setUser} />;

  const pendingLogBooks = logBookEntries.filter(l => l.status === 'pending' && (!l.operator_id || l.operator_id === '' || l.operator_id === user.id));

  return (
    <div className="min-h-screen flex bg-slate-50">
      <Sidebar user={user} currentSection={currentSection} setSection={setCurrentSection} onLogout={() => setUser(null)} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-slate-200 p-4 flex items-center justify-between lg:hidden sticky top-0 z-30 no-print">
          <button onClick={() => setSidebarOpen(true)} className="p-2 text-slate-600"><Menu size={24} /></button>
          <img src="https://tritex.com.mx/tlslogo.png" className="h-8" alt="Logo" />
          <div className="w-10"></div>
        </header>
        <main className="flex-1 p-4 lg:p-8 lg:ml-64 relative">
          <div className="space-y-6">
            {user.role === UserRole.OPERATOR && currentSection === 'dashboard' && (
              <OperatorActions scheduledTrips={[]} inProgressTrip={undefined} pendingLogBooks={pendingLogBooks} onSendNotification={() => {}} onAcceptTrip={() => {}} onAcceptLogBook={(id) => handleUpdateLogBookStatus(id, 'approved', {id: user.id, name: user.name})} />
            )}
            {currentSection === 'dashboard' && <Dashboard user={user} trips={trips} expenses={expenses} notifications={notifications} operators={operators} logBookEntries={logBookEntries} onUpdateLogBookStatus={handleUpdateLogBookStatus} onNavigateToSection={(s, id) => { setCurrentSection(s); if(id) setActiveLogId(id); }} />}
            {currentSection === 'bitacora' && <LogBookSection user={user} logBookEntries={logBookEntries} onSave={handleSaveLogBook} onDeleteLogBook={handleDeleteLogBook} onUpdateStatus={handleUpdateLogBookStatus} operators={operators} initialSelectedId={activeLogId} onClearSelectedId={() => setActiveLogId(undefined)} />}
            {currentSection === 'logbook_evidence' && user.role === UserRole.ADMIN && <LogBookAudit logBookEntries={logBookEntries} />}
            {currentSection === 'operators' && <OperatorList operators={operators} onSaveOperator={async (o) => { await supabase.from('profiles').insert([o]); fetchData(); }} onDeleteOperator={async (id) => { await supabase.from('profiles').delete().eq('id', id); fetchData(); }} onToggleStatus={async (id, s) => { await supabase.from('profiles').update({status: s === 'active' ? 'paused' : 'active'}).eq('id', id); fetchData(); }} />}
            {currentSection === 'media' && <MediaManager media={media} onUpload={async (m) => { await supabase.from('media_assets').insert([m]); fetchData(); }} onDelete={async (id) => { await supabase.from('media_assets').delete().eq('id', id); fetchData(); }} user={user} />}
            {currentSection === 'profile' && <ProfileManager user={user} onUpdateUser={setUser} />}
          </div>
        </main>
      </div>
      <NotificationCenter notifications={notifications} operators={operators} onMarkRead={async (id) => { await supabase.from('notifications').update({read: true}).eq('id', id); fetchData(); }} isAdmin={user.role === UserRole.ADMIN} currentUser={user} onAction={() => setCurrentSection('bitacora')} />
    </div>
  );
};

export default App;
