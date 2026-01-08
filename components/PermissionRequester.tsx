
import React, { useState, useEffect } from 'react';
import { ShieldCheck, MapPin, Camera, CheckCircle2, AlertCircle, ArrowRight, Info, BellRing, Volume2, Bell } from 'lucide-react';

interface PermissionRequesterProps {
  onPermissionsGranted: () => void;
}

const PermissionRequester: React.FC<PermissionRequesterProps> = ({ onPermissionsGranted }) => {
  const [geoStatus, setGeoStatus] = useState<'prompt' | 'granted' | 'denied'>('prompt');
  const [cameraStatus, setCameraStatus] = useState<'prompt' | 'granted' | 'denied'>('prompt');
  const [notificationStatus, setNotificationStatus] = useState<'prompt' | 'granted' | 'denied'>(Notification.permission as any);
  const [isVerifying, setIsVerifying] = useState(false);

  const checkPermissions = async () => {
    setIsVerifying(true);
    
    try {
      if (navigator.permissions && navigator.permissions.query) {
        const geoResult = await navigator.permissions.query({ name: 'geolocation' as any });
        setGeoStatus(geoResult.state as any);
        
        const camResult = await navigator.permissions.query({ name: 'camera' as any });
        setCameraStatus(camResult.state as any);
        
        // Notification check actual status
        setNotificationStatus(Notification.permission as any);
      }
    } catch (e) {
      console.log('Permission API partially supported');
    }
    
    setIsVerifying(false);
  };

  useEffect(() => {
    checkPermissions();
  }, []);

  const requestGeo = () => {
    navigator.geolocation.getCurrentPosition(
      () => setGeoStatus('granted'),
      () => setGeoStatus('denied'),
      { timeout: 5000 }
    );
  };

  const requestNotifications = async () => {
    if (Notification.permission === 'granted') {
      setNotificationStatus('granted');
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      setNotificationStatus(permission as any);
      
      // Intentar iniciar audio context como gesto del usuario para sonidos futuros
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      if (ctx.state === 'suspended') ctx.resume();
    } catch (e) {
      console.error("Error requesting notifications", e);
      setNotificationStatus('denied');
    }
  };

  const requestCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(track => track.stop());
      setCameraStatus('granted');
    } catch (e) {
      setCameraStatus('denied');
    }
  };

  return (
    <div className="fixed inset-0 z-[300] bg-slate-900/95 flex items-center justify-center p-4 backdrop-blur-md">
      <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-2xl p-8 space-y-6 animate-in zoom-in-95 duration-300 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full -mr-16 -mt-16 opacity-50"></div>
        
        <div className="text-center space-y-2 relative">
          <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600 mx-auto mb-4">
            <ShieldCheck size={40} />
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Acceso TBS Logistics</h2>
          <p className="text-slate-500 text-sm font-medium">Configura los permisos para recibir alertas críticas, seguimiento en tiempo real y registro de evidencias.</p>
        </div>

        <div className="space-y-3">
          <PermissionItem 
            title="Alertas de Sistema" 
            desc="Para bitácoras nuevas con app cerrada." 
            status={notificationStatus} 
            onAllow={requestNotifications} 
            icon={<Bell size={20} />} 
          />
          <PermissionItem 
            title="GPS y Ubicación" 
            desc="Rastreo de unidades en vivo." 
            status={geoStatus} 
            onAllow={requestGeo} 
            icon={<MapPin size={20} />} 
          />
          <PermissionItem 
            title="Cámara" 
            desc="Captura de evidencias y documentos." 
            status={cameraStatus} 
            onAllow={requestCamera} 
            icon={<Camera size={20} />} 
          />
        </div>

        <div className="pt-4 space-y-3 relative">
          <button 
            onClick={onPermissionsGranted}
            className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-slate-800 transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            Comenzar Operación
            <ArrowRight size={18} />
          </button>
          <p className="text-[10px] text-slate-400 font-bold text-center flex items-center justify-center gap-1 uppercase tracking-widest">
            <Info size={12} /> Imprescindible para la operación diaria.
          </p>
        </div>
      </div>
    </div>
  );
};

const PermissionItem = ({ title, desc, status, onAllow, icon }: any) => (
  <div className={`p-4 rounded-2xl border-2 transition-all flex items-center justify-between ${status === 'granted' ? 'bg-emerald-50 border-emerald-100' : 'bg-slate-50 border-slate-100'}`}>
    <div className="flex items-center gap-3">
      <div className={`p-2 rounded-xl ${status === 'granted' ? 'bg-emerald-500 text-white' : 'bg-blue-100 text-blue-600'}`}>
        {icon}
      </div>
      <div>
        <h4 className="text-xs font-black text-slate-800 uppercase tracking-tight">{title}</h4>
        <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">{desc}</p>
      </div>
    </div>
    {status === 'granted' ? (
      <CheckCircle2 className="text-emerald-500" size={24} />
    ) : (
      <button 
        type="button" 
        onClick={onAllow} 
        className="px-3 py-1.5 bg-blue-600 text-white text-[9px] font-black rounded-xl hover:bg-blue-700 transition-all uppercase tracking-widest shadow-md"
      >
        Activar
      </button>
    )}
  </div>
);

export default PermissionRequester;
