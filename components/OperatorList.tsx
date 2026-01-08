
import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { Users, UserPlus, Phone, Mail, BadgeCheck, MapPin, ExternalLink, ShieldCheck, Trash2, PauseCircle, PlayCircle, AlertCircle } from 'lucide-react';
import OperatorForm from './OperatorForm';

interface OperatorListProps {
  operators: User[];
  onSaveOperator: (operator: Omit<User, 'id'>) => Promise<void>;
  onDeleteOperator: (id: string) => Promise<void>;
  onToggleStatus: (id: string, currentStatus: string) => Promise<void>;
}

const OperatorList: React.FC<OperatorListProps> = ({ operators, onSaveOperator, onDeleteOperator, onToggleStatus }) => {
  const [showForm, setShowForm] = useState(false);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  const handleImageError = (id: string) => {
    setImageErrors(prev => ({ ...prev, [id]: true }));
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Directorio de Operadores</h2>
          <p className="text-slate-500 font-medium">Gestión de personal y expedientes digitales.</p>
        </div>
        <button 
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs tracking-[0.1em] hover:bg-slate-800 transition-all shadow-xl active:scale-95"
        >
          <UserPlus size={18} />
          Registrar Operador
        </button>
      </header>

      {showForm && (
        <OperatorForm 
          onSave={onSaveOperator} 
          onCancel={() => setShowForm(false)} 
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {operators.length === 0 ? (
          <div className="col-span-full py-20 text-center bg-white rounded-3xl border-2 border-dashed border-slate-200">
            <Users className="mx-auto text-slate-200 mb-4" size={48} />
            <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">No hay operadores registrados.</p>
          </div>
        ) : (
          operators.map((op) => (
            <div key={op.id} className={`bg-white rounded-3xl p-6 shadow-sm border transition-all group relative overflow-hidden ${op.status === 'paused' ? 'border-amber-200 bg-amber-50/30 grayscale-[0.5]' : 'border-slate-200 hover:shadow-xl'}`}>
              <div className="absolute top-0 right-0 w-24 h-24 bg-slate-50 rounded-full -mr-12 -mt-12 group-hover:scale-110 transition-transform opacity-50"></div>
              
              <div className="flex items-start justify-between mb-4 relative">
                <div className="relative">
                  <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-slate-100 group-hover:border-blue-500 transition-colors bg-slate-200 flex items-center justify-center">
                    {imageErrors[op.id] || !op.avatar ? (
                      <div className="w-full h-full bg-blue-600 flex items-center justify-center text-white font-black text-xl">
                        {getInitials(op.name)}
                      </div>
                    ) : (
                      <img 
                        src={op.avatar} 
                        alt={op.name} 
                        className="w-full h-full object-cover" 
                        onError={() => handleImageError(op.id)}
                      />
                    )}
                  </div>
                  <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-4 border-white flex items-center justify-center text-white ${op.status === 'paused' ? 'bg-amber-500' : 'bg-emerald-500'}`}>
                    <BadgeCheck size={12} />
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">ID EMPLEADO</span>
                  <span className="text-sm font-bold text-slate-800">{op.employeeId || op.id.split('-')[0]}</span>
                </div>
              </div>

              <div className="space-y-4 relative">
                <div>
                  <h3 className="font-black text-slate-900 leading-tight truncate flex items-center gap-2">
                    {op.name}
                    {op.status === 'paused' && <span className="text-[9px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">PAUSADO</span>}
                  </h3>
                  <p className="text-xs text-blue-600 font-bold uppercase tracking-wider">{op.position || 'Operador Quinta Rueda'}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 py-4 border-y border-slate-50">
                  <div className="flex items-center gap-2 text-slate-500">
                    <div className="p-1.5 bg-slate-50 rounded-lg"><ShieldCheck size={14} /></div>
                    <div className="min-w-0">
                      <p className="text-[9px] font-black uppercase text-slate-400">Licencia</p>
                      <p className="text-xs font-bold text-slate-700 truncate">{op.licenseType || 'Federal B'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-slate-500">
                    <div className="p-1.5 bg-slate-50 rounded-lg"><MapPin size={14} /></div>
                    <div className="min-w-0">
                      <p className="text-[9px] font-black uppercase text-slate-400">Estado</p>
                      <p className={`text-xs font-bold ${op.status === 'paused' ? 'text-amber-600' : 'text-emerald-600'}`}>
                        {op.status === 'paused' ? 'Pausado' : 'Activo'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-slate-500 hover:text-blue-600 transition-colors">
                    <Phone size={14} />
                    <span className="text-xs font-medium">{op.phone || 'S/N'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-500 hover:text-blue-600 transition-colors">
                    <Mail size={14} />
                    <span className="text-xs font-medium truncate">{op.email || 'operador@logitrak.com'}</span>
                  </div>
                </div>

                <div className="flex gap-2 mt-4">
                  <button className="flex-1 py-3 bg-slate-50 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all flex items-center justify-center gap-2">
                    <ExternalLink size={12} />
                    Expediente
                  </button>
                  <button 
                    onClick={() => onToggleStatus(op.id, op.status || 'active')}
                    title={op.status === 'paused' ? "Activar Operador" : "Pausar Operador"}
                    className={`p-3 rounded-xl transition-all ${op.status === 'paused' ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white' : 'bg-amber-50 text-amber-600 hover:bg-amber-600 hover:text-white'}`}
                  >
                    {op.status === 'paused' ? <PlayCircle size={18} /> : <PauseCircle size={18} />}
                  </button>
                  <button 
                    onClick={() => onDeleteOperator(op.id)}
                    title="Eliminar Perfil"
                    className="p-3 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-600 hover:text-white transition-all"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default OperatorList;
