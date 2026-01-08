
import React, { useState, useEffect, useRef } from 'react';
import { Bell, X, Send, User, CreditCard, History, Clock, Volume2, BellRing, CheckCircle, ExternalLink, Eye } from 'lucide-react';
import { AppNotification, UserRole, User as UserType } from '../types';

interface NotificationCenterProps {
  notifications: AppNotification[];
  operators: UserType[];
  onMarkRead: (id: string) => void;
  onReply?: (toId: string, message: string) => void;
  onAction?: (notif: AppNotification) => void; 
  isAdmin: boolean;
  currentUser?: UserType;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({ 
  notifications, 
  operators, 
  onMarkRead, 
  onReply, 
  onAction,
  isAdmin,
  currentUser 
}) => {
  const [activePopup, setActivePopup] = useState<AppNotification | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const lastProcessedId = useRef<string | null>(null);

  const playNotificationSound = () => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') ctx.resume();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); 
      osc.frequency.exponentialRampToValueAtTime(783.99, ctx.currentTime + 0.1); 
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.5);
    } catch (e) {
      console.warn("Audio Context blocked");
    }
  };

  useEffect(() => {
    if (!currentUser) return;
    const latestNotif = notifications[0];
    if (latestNotif && !latestNotif.read && latestNotif.id !== lastProcessedId.current) {
      if (latestNotif.fromId === currentUser.id) return;
      const isForMe = 
        (isAdmin && latestNotif.toId === 'ADMIN') || 
        (!isAdmin && (latestNotif.toId === currentUser.id || latestNotif.toId === 'OPERATORS_ALL'));
      
      if (isForMe) {
        lastProcessedId.current = latestNotif.id;
        playNotificationSound();
        setActivePopup(latestNotif);
      }
    }
  }, [notifications, isAdmin, currentUser]);

  const handleClose = () => {
    if (activePopup) {
      onMarkRead(activePopup.id);
      setActivePopup(null);
    }
  };

  const handleAction = () => {
    if (activePopup && onAction) {
      onAction(activePopup);
      handleClose();
    }
  };

  const getOperatorAvatar = (id: string, name: string) => {
    const op = operators.find(o => o.id === id || o.name === name);
    return op?.avatar || `https://i.pravatar.cc/150?u=${id}`;
  };

  const visibleNotifications = notifications.filter(n => {
    if (isAdmin) return n.toId === 'ADMIN' || n.fromId === currentUser?.id;
    return n.toId === currentUser?.id || n.toId === 'OPERATORS_ALL' || n.fromId === currentUser?.id;
  });

  return (
    <>
      {!activePopup && (
        <button 
          onClick={() => setShowHistory(!showHistory)}
          className="fixed bottom-6 right-6 p-5 bg-slate-900 text-white rounded-full shadow-2xl hover:bg-slate-800 transition-all z-[1000] group no-print"
        >
          <Bell size={24} className={visibleNotifications.some(n => !n.read && n.fromId !== currentUser?.id) ? "animate-swing" : ""} />
          {visibleNotifications.filter(n => !n.read && n.fromId !== currentUser?.id).length > 0 && (
            <span className="absolute top-0 right-0 w-5 h-5 bg-rose-500 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-black">
              {visibleNotifications.filter(n => !n.read && n.fromId !== currentUser?.id).length}
            </span>
          )}
        </button>
      )}

      {showHistory && (
        <div className="fixed inset-0 z-[1100] lg:inset-auto lg:bottom-24 lg:right-6 lg:w-[400px] no-print">
          <div className="bg-white h-full lg:h-[600px] flex flex-col shadow-2xl rounded-[2rem] border border-slate-200 overflow-hidden animate-in slide-in-from-bottom-4">
            <div className="bg-slate-900 p-6 text-white flex justify-between items-center">
              <div className="flex items-center gap-2 font-black uppercase tracking-[0.2em] text-[10px]">
                <BellRing size={16} className="text-blue-400" /> Historial de Avisos
              </div>
              <button onClick={() => setShowHistory(false)} className="hover:bg-slate-800 p-2 rounded-xl transition-colors text-slate-400">
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50 custom-scrollbar">
              {visibleNotifications.map(n => (
                <div key={n.id} className={`p-4 rounded-2xl border ${n.read ? 'bg-white border-slate-100' : 'bg-blue-50 border-blue-100 shadow-sm'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <img src={getOperatorAvatar(n.fromId, n.fromName)} className="w-8 h-8 rounded-xl object-cover" />
                    <span className="text-[10px] font-black text-blue-600 uppercase truncate">{n.fromName}</span>
                  </div>
                  <p className="text-xs font-medium text-slate-800 leading-snug">{n.message}</p>
                </div>
              ))}
              {visibleNotifications.length === 0 && <p className="text-center text-slate-400 font-bold uppercase tracking-widest text-[10px] pt-12">Sin notificaciones</p>}
            </div>
          </div>
        </div>
      )}

      {activePopup && (
        <div className="fixed bottom-6 right-6 z-[1200] w-[calc(100%-3rem)] max-w-md animate-in slide-in-from-bottom-10 no-print">
          <div className="bg-white rounded-[2.5rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.4)] border-2 border-blue-600 overflow-hidden">
            <div className="bg-blue-600 p-5 flex justify-between items-center text-white">
              <div className="flex items-center gap-2 font-black uppercase tracking-[0.2em] text-[10px]">
                <BellRing size={20} className="animate-bounce" /> NUEVA NOTIFICACIÓN
              </div>
              <button onClick={handleClose} className="hover:bg-blue-700 p-1.5 rounded-xl transition-colors"><X size={18} /></button>
            </div>
            <div className="p-8 space-y-6">
              <div className="flex items-start gap-5">
                <img src={getOperatorAvatar(activePopup.fromId, activePopup.fromName)} className="w-16 h-16 rounded-3xl object-cover shadow-xl border-2 border-slate-50" />
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">{activePopup.fromName}</p>
                  <p className="text-slate-900 font-black leading-tight text-lg">{activePopup.message}</p>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-2 flex items-center gap-1"><Clock size={10}/> RECIBIDO AHORA</p>
                </div>
              </div>
              <div className="flex gap-3">
                 <button onClick={handleClose} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-colors">DESCARTAR</button>
                 <button onClick={handleAction} className="flex-[2] py-4 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 shadow-xl shadow-blue-200 flex items-center justify-center gap-2 active:scale-95 transition-all">
                   <Eye size={16} /> REVISAR DETALLES
                 </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default NotificationCenter;
