
import React, { useState } from 'react';
import { Truck, Lock, User, AlertCircle, Loader2, UserPlus, ArrowRight, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import { UserRole } from '../types';
import { supabase } from '../services/supabase';

interface LoginFormProps {
  onLogin: (user: any) => void;
}

const AuthForm: React.FC<LoginFormProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // Form States
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.OPERATOR);

  // Credenciales administrativas maestras
  const adminCredentials = ['admin1', 'admin2', 'admin3', 'admin4'];
  const adminPassword = '123_admin';

  // Credenciales de operador maestras (Solicitadas por el usuario)
  const operatorCredentials = ['ope01'];
  const operatorPassword = '123_ope';

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const cleanUsername = username.toLowerCase().trim();
    const cleanPassword = password.trim();

    try {
      if (isLogin) {
        // 1. Verificar si es una credencial administrativa maestra
        if (adminCredentials.includes(cleanUsername) && cleanPassword === adminPassword) {
          const { data: dbAdmin } = await supabase
            .from('profiles')
            .select('*')
            .eq('employee_id', cleanUsername)
            .maybeSingle();

          if (dbAdmin) {
            onLogin({
              ...dbAdmin,
              employeeId: dbAdmin.employee_id
            });
          } else {
            onLogin({
              id: `ADM-${cleanUsername}`,
              name: cleanUsername.toUpperCase(),
              role: UserRole.ADMIN,
              avatar: `https://i.pravatar.cc/150?u=${cleanUsername}`,
              employeeId: cleanUsername
            });
          }
          return;
        }

        // 2. Verificar si es la credencial de operador maestra solicitada
        if (operatorCredentials.includes(cleanUsername) && cleanPassword === operatorPassword) {
          const { data: dbOp } = await supabase
            .from('profiles')
            .select('*')
            .eq('employee_id', cleanUsername)
            .maybeSingle();

          if (dbOp) {
            onLogin({
              ...dbOp,
              employeeId: dbOp.employee_id
            });
          } else {
            onLogin({
              id: `OPE-${cleanUsername}`,
              name: 'OPERADOR 01',
              role: UserRole.OPERATOR,
              avatar: `https://i.pravatar.cc/150?u=${cleanUsername}`,
              employeeId: cleanUsername
            });
          }
          return;
        }

        // 3. Buscar en la base de datos de perfiles normal
        const { data: dbUser, error: dbError } = await supabase
          .from('profiles')
          .select('*')
          .eq('employee_id', cleanUsername)
          .eq('password', cleanPassword)
          .maybeSingle();

        if (dbError) throw dbError;

        if (dbUser) {
          onLogin({
            ...dbUser,
            employeeId: dbUser.employee_id
          });
          return;
        }

        // 4. Verificación de existencia para mensaje de error preciso
        const { data: userExists } = await supabase
          .from('profiles')
          .select('id')
          .eq('employee_id', cleanUsername)
          .maybeSingle();

        if (userExists) {
          throw new Error('Contraseña incorrecta');
        } else {
          throw new Error('Usuario no registrado en el sistema');
        }
      } else {
        // Lógica de Registro
        const newProfile = {
          name: name.trim(),
          role,
          employee_id: cleanUsername,
          password: cleanPassword,
          avatar: `https://i.pravatar.cc/150?u=${cleanUsername}`,
          status: 'active',
          hire_date: new Date().toISOString().split('T')[0]
        };

        const { data, error: regError } = await supabase
          .from('profiles')
          .insert([newProfile])
          .select()
          .single();

        if (regError) {
          if (regError.code === '23505') throw new Error('El ID de empleado ya está registrado');
          throw regError;
        }

        onLogin({
          ...data,
          employeeId: data.employee_id
        });
      }
    } catch (err: any) {
      console.error("Auth error:", err);
      setError(err.message || 'Error en la autenticación');
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-2xl p-8 sm:p-12 space-y-8 animate-in zoom-in-95 duration-500 overflow-hidden relative border border-slate-100">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full -mr-16 -mt-16 opacity-50"></div>
        
        <div className="text-center space-y-4 relative">
          <img 
            src="https://tritex.com.mx/tlslogo.png" 
            alt="TLS Logo" 
            className="h-16 w-auto mx-auto object-contain transition-transform duration-500 hover:scale-105"
          />
          <h1 className="text-2xl font-black text-slate-900 tracking-tight pt-2 uppercase text-center">Bitácora de Operaciones</h1>
          <p className="text-slate-500 font-medium text-sm">
            {isLogin ? 'Control de Operaciones y Bitácora TLS' : 'Registro de Nuevo Usuario'}
          </p>
        </div>

        <div className="flex bg-slate-100 p-1 rounded-2xl relative z-10">
          <button 
            type="button"
            onClick={() => { setIsLogin(true); setError(''); }}
            className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${isLogin ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Ingresar
          </button>
          <button 
            type="button"
            onClick={() => { setIsLogin(false); setError(''); }}
            className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${!isLogin ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Registrarse
          </button>
        </div>

        <form onSubmit={handleAuth} className="space-y-4 relative z-10">
          {!isLogin && (
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nombre Completo</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  required
                  type="text"
                  placeholder="Juan Pérez"
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-100 border-2 border-slate-200 rounded-2xl outline-none focus:border-blue-600 focus:bg-white transition-all text-sm font-bold"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Usuario / ID Empleado</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                required
                type="text"
                placeholder="ope01 o admin1"
                className="w-full pl-12 pr-4 py-3.5 bg-slate-100 border-2 border-slate-200 rounded-2xl outline-none focus:border-blue-600 focus:bg-white transition-all text-sm font-bold"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Contraseña</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                required
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                className="w-full pl-12 pr-12 py-3.5 bg-slate-100 border-2 border-slate-200 rounded-2xl outline-none focus:border-blue-600 focus:bg-white transition-all text-sm font-bold"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={togglePasswordVisibility}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600 p-1"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {!isLogin && (
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Rol</label>
              <select
                className="w-full px-4 py-3.5 bg-slate-100 border-2 border-slate-200 rounded-2xl outline-none focus:border-blue-600 text-sm font-bold"
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
              >
                <option value={UserRole.OPERATOR}>Operador</option>
                <option value={UserRole.ADMIN}>Administrador</option>
              </select>
            </div>
          )}

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl flex items-center gap-2 text-rose-600 text-[10px] font-bold">
              <AlertCircle size={14} /> {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : <>{isLogin ? 'Entrar' : 'Registrar'} <ArrowRight size={18} /></>}
          </button>
        </form>

        <p className="text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest pt-4">
          © 2025 tritex.com.mx
        </p>
      </div>
    </div>
  );
};

export default AuthForm;
