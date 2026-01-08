
import React from 'react';
import { 
  LayoutDashboard, 
  X,
  User as UserIcon,
  Users,
  Image as ImageIcon,
  BookOpen,
  LogOut,
  ShieldCheck
} from 'lucide-react';
import { Section, User, UserRole } from '../types';

interface SidebarProps {
  user: User;
  currentSection: Section;
  setSection: (section: Section) => void;
  onLogout: () => void;
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ user, currentSection, setSection, onLogout, isOpen, onClose }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: [UserRole.ADMIN, UserRole.OPERATOR] },
    { id: 'bitacora', label: 'Bitácora de Gastos', icon: BookOpen, roles: [UserRole.OPERATOR, UserRole.ADMIN] },
    { id: 'logbook_evidence', label: 'Evidencias Bitácoras', icon: ShieldCheck, roles: [UserRole.ADMIN] },
    { id: 'operators', label: 'Operadores', icon: Users, roles: [UserRole.ADMIN] },
    { id: 'media', label: 'Medios / Archivos', icon: ImageIcon, roles: [UserRole.ADMIN, UserRole.OPERATOR] },
    { id: 'profile', label: 'Mi Perfil', icon: UserIcon, roles: [UserRole.ADMIN, UserRole.OPERATOR] },
  ];

  const handleNavClick = (id: Section) => {
    setSection(id);
    if (window.innerWidth < 1024) onClose();
  };

  return (
    <>
      {/* Overlay for mobile - Lower z-index than sidebar, higher than content */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 z-[450] lg:hidden backdrop-blur-sm no-print"
          onClick={onClose}
        />
      )}

      {/* Sidebar - Highest z-index below notification popups */}
      <aside className={`
        fixed inset-y-0 left-0 z-[500] w-64 bg-slate-900 transition-transform duration-300 ease-in-out transform no-print
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 flex flex-col text-slate-300 shadow-[20px_0_60px_-15px_rgba(0,0,0,0.3)]
      `}>
        <div className="p-6 flex justify-between items-center bg-white border-b border-slate-100">
          <img 
            src="https://tritex.com.mx/tlslogo.png" 
            alt="TLS Logo" 
            className="h-10 w-auto object-contain mx-auto lg:mx-0"
          />
          <button onClick={onClose} className="lg:hidden text-slate-900 hover:text-blue-600 p-1">
            <X size={24} />
          </button>
        </div>

        <nav className="flex-1 mt-6 overflow-y-auto custom-scrollbar">
          {menuItems
            .filter(item => item.roles.includes(user.role))
            .map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id as Section)}
                className={`w-full flex items-center gap-3 px-6 py-4 transition-all duration-200 ${
                  currentSection === item.id 
                  ? 'bg-blue-600 text-white border-r-4 border-blue-400' 
                  : 'hover:bg-slate-800'
                }`}
              >
                <item.icon size={20} />
                <span className="font-medium">{item.label}</span>
              </button>
            ))}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3 mb-6 px-2 cursor-pointer hover:bg-slate-800 p-2 rounded-xl transition-all" onClick={() => handleNavClick('profile')}>
            <div className="w-10 h-10 rounded-full bg-slate-700 overflow-hidden shrink-0 border-2 border-blue-500/40 shadow-lg">
              <img 
                src={user.avatar} 
                alt={user.name} 
                className="w-full h-full object-cover" 
                onError={(e) => (e.currentTarget.src = 'https://i.pravatar.cc/150')}
              />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-black text-white leading-tight truncate">{user.name}</p>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest">{user.role.toLowerCase()}</p>
            </div>
          </div>
          <button 
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-2 text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors font-black uppercase text-[10px] tracking-widest"
          >
            <LogOut size={18} />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
