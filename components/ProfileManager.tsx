
import React, { useState, useRef, useEffect } from 'react';
import { User, UserRole } from '../types';
import { supabase } from '../services/supabase';
import { 
  User as UserIcon, 
  Camera, 
  Mail, 
  Phone, 
  IdCard, 
  Calendar, 
  ShieldAlert, 
  Droplets, 
  Save, 
  CheckCircle2,
  Briefcase,
  FileText,
  Loader2,
  AlertCircle
} from 'lucide-react';

interface ProfileManagerProps {
  user: User;
  onUpdateUser: (updatedUser: User) => void;
}

const ProfileManager: React.FC<ProfileManagerProps> = ({ user, onUpdateUser }) => {
  const [formData, setFormData] = useState<User>({
    ...user,
    email: user.email || '',
    phone: user.phone || '',
    employeeId: user.employeeId || '',
    licenseNumber: user.licenseNumber || '',
    licenseType: user.licenseType || 'Federal B',
    licenseExpiry: user.licenseExpiry || '',
    emergencyContact: user.emergencyContact || '',
    emergencyPhone: user.emergencyPhone || '',
    bloodType: user.bloodType || 'O+',
    position: user.position || (user.role === UserRole.ADMIN ? 'Administrador' : 'Operador'),
    hireDate: user.hireDate || new Date().toISOString().split('T')[0]
  });

  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setError("La imagen es demasiado grande (máx 2MB)");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, avatar: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    
    try {
      // Intentar actualizar usando employeeId como respaldo si el ID es temporal (ADM-...)
      const query = supabase.from('profiles').update({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        avatar: formData.avatar,
        position: formData.position,
        license_number: formData.licenseNumber,
        license_type: formData.licenseType,
        license_expiry: formData.licenseExpiry,
        emergency_contact: formData.emergencyContact,
        emergency_phone: formData.emergencyPhone,
        blood_type: formData.bloodType
      });

      // Si el ID es de los estáticos "ADM-", filtramos por employee_id
      const { error: dbError } = user.id.startsWith('ADM-') 
        ? await query.eq('employee_id', user.name.toLowerCase())
        : await query.eq('id', user.id);

      if (dbError) throw dbError;

      onUpdateUser(formData);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 4000);
    } catch (err: any) {
      console.error("Error al guardar perfil:", err);
      setError(`Error de Base de Datos: ${err.message || "Verifica tu conexión"}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header>
        <h2 className="text-2xl font-black text-slate-800 tracking-tight">Mi Perfil</h2>
        <p className="text-slate-500 font-medium">Gestiona tu información personal y credenciales de acceso.</p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Cabecera / Foto */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 flex flex-col md:flex-row items-center gap-8">
          <div className="relative group">
            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-xl bg-slate-100 ring-2 ring-blue-500/20">
              <img 
                src={formData.avatar || 'https://i.pravatar.cc/150'} 
                alt={formData.name} 
                className="w-full h-full object-cover" 
              />
            </div>
            <button 
              type="button"
              onClick={handlePhotoClick}
              className="absolute bottom-0 right-0 p-2.5 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-all scale-90 group-hover:scale-100"
            >
              <Camera size={18} />
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={handleFileChange} 
            />
          </div>

          <div className="flex-1 text-center md:text-left space-y-2">
            <h3 className="text-2xl font-black text-slate-900">{formData.name}</h3>
            <div className="flex flex-wrap justify-center md:justify-start gap-3">
              <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-blue-100 flex items-center gap-1.5">
                <Briefcase size={12} /> {formData.position}
              </span>
              <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-slate-200 flex items-center gap-1.5">
                <IdCard size={12} /> {formData.employeeId || "PERFIL MASTER"}
              </span>
            </div>
            <p className="text-slate-400 text-sm font-medium">Desde: {new Date(formData.hireDate!).toLocaleDateString()}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Datos Personales */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 space-y-6">
            <h4 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
              <UserIcon size={16} className="text-blue-500" />
              Datos Personales
            </h4>
            
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 px-1 uppercase tracking-widest">Nombre Completo</label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-3 text-slate-400" size={18} />
                  <input 
                    name="name" 
                    value={formData.name} 
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all text-slate-900 font-bold"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 px-1 uppercase tracking-widest">Correo Electrónico</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 text-slate-400" size={18} />
                  <input 
                    name="email" 
                    type="email"
                    value={formData.email} 
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all text-slate-900 font-medium"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 px-1 uppercase tracking-widest">Teléfono de Contacto</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 text-slate-400" size={18} />
                  <input 
                    name="phone" 
                    value={formData.phone} 
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all text-slate-900 font-bold"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Documentación */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 space-y-6">
            <h4 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
              <FileText size={16} className="text-blue-500" />
              Documentación y Licencia
            </h4>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 px-1 uppercase tracking-widest">Tipo</label>
                  <select 
                    name="licenseType" 
                    value={formData.licenseType} 
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none appearance-none text-slate-900 font-bold"
                  >
                    <option value="Federal B">Federal B</option>
                    <option value="Federal C">Federal C</option>
                    <option value="Federal E">Federal E</option>
                    <option value="Estatal B">Estatal B</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 px-1 uppercase tracking-widest">Número</label>
                  <input 
                    name="licenseNumber" 
                    value={formData.licenseNumber} 
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 font-bold"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 px-1 uppercase tracking-widest">Vigencia</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3 text-slate-400" size={18} />
                  <input 
                    name="licenseExpiry" 
                    type="date"
                    value={formData.licenseExpiry} 
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 font-bold"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 px-1 uppercase tracking-widest">Grupo Sanguíneo</label>
                <div className="relative">
                  <Droplets className="absolute left-3 top-3 text-slate-400" size={18} />
                  <select 
                    name="bloodType" 
                    value={formData.bloodType} 
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none appearance-none text-slate-900 font-bold"
                  >
                    <option value="O+">O Positivo (O+)</option>
                    <option value="O-">O Negativo (O-)</option>
                    <option value="A+">A Positivo (A+)</option>
                    <option value="B+">B Positivo (B+)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Contacto Emergencia */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 space-y-6 lg:col-span-2">
            <h4 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
              <ShieldAlert size={16} className="text-rose-500" />
              Contacto de Emergencia
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <input 
                name="emergencyContact" 
                value={formData.emergencyContact} 
                onChange={handleChange}
                placeholder="Nombre del contacto"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 font-bold"
              />
              <input 
                name="emergencyPhone" 
                value={formData.emergencyPhone} 
                onChange={handleChange}
                placeholder="Teléfono de emergencia"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 font-bold"
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
          <div className="flex-1">
            {showSuccess && (
              <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm animate-bounce">
                <CheckCircle2 size={18} /> ¡Cambios guardados exitosamente!
              </div>
            )}
            {error && (
              <div className="flex items-center gap-2 text-rose-600 font-bold text-sm animate-pulse">
                <AlertCircle size={18} /> {error}
              </div>
            )}
          </div>
          <button 
            type="submit" 
            disabled={isSaving}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-12 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
            Guardar Cambios
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProfileManager;
