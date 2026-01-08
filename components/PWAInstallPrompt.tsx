
import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone, ArrowRight, Zap, CloudOff, Bell } from 'lucide-react';

const PWAInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`PWA Install Choice: ${outcome}`);
    
    setDeferredPrompt(null);
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 sm:inset-auto sm:bottom-6 sm:right-6 z-[300] flex items-end sm:items-center justify-center p-4 sm:p-0 animate-in fade-in slide-in-from-bottom-10 duration-700">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm sm:hidden" onClick={() => setIsVisible(false)}></div>
      
      <div className="relative w-full max-w-sm bg-white rounded-[2.5rem] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.3)] border border-slate-100 overflow-hidden ring-1 ring-slate-200">
        {/* Decorative elements */}
        <div className="absolute -top-12 -right-12 w-40 h-40 bg-blue-600 rounded-full opacity-10"></div>
        <div className="absolute top-20 -left-10 w-24 h-24 bg-blue-400 rounded-full opacity-5"></div>
        
        <div className="p-8 relative">
          <button 
            onClick={() => setIsVisible(false)}
            className="absolute top-4 right-4 p-2 text-slate-300 hover:text-slate-900 hover:bg-slate-50 rounded-full transition-all"
          >
            <X size={20} />
          </button>

          <div className="flex flex-col items-center text-center space-y-6">
            <div className="relative">
              <div className="w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center text-white shadow-2xl shadow-blue-200 animate-pulse">
                <Smartphone size={36} />
              </div>
              <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center text-white border-4 border-white">
                <Zap size={14} fill="currentColor" />
              </div>
            </div>

            <div>
              <h3 className="text-xl font-black text-slate-900 leading-tight tracking-tight uppercase">Instala TLS Móvil</h3>
              <p className="text-slate-500 font-medium text-sm mt-2">Accede de forma profesional desde tu pantalla de inicio.</p>
            </div>

            <div className="w-full space-y-3">
              <BenefitItem icon={<Zap size={14} />} text="Carga mucho más rápida" />
              <BenefitItem icon={<CloudOff size={14} />} text="Funciona sin internet" />
              <BenefitItem icon={<Bell size={14} />} text="Notificaciones en tiempo real" />
            </div>

            <div className="w-full pt-4">
              <button 
                onClick={handleInstallClick}
                className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-2xl hover:bg-blue-600 transition-all active:scale-95 flex items-center justify-center gap-2 group"
              >
                Instalar Ahora
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </button>
              <button 
                onClick={() => setIsVisible(false)}
                className="w-full mt-4 text-[10px] text-slate-400 font-black uppercase tracking-widest hover:text-slate-600 transition-colors"
              >
                Tal vez más tarde
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const BenefitItem = ({ icon, text }: { icon: React.ReactNode, text: string }) => (
  <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-100">
    <div className="text-blue-600">{icon}</div>
    <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{text}</span>
  </div>
);

export default PWAInstallPrompt;
