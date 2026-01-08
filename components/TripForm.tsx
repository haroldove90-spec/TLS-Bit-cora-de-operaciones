
import React, { useState, useRef, useEffect } from 'react';
import { Truck, MapPin, Calendar, Sparkles, Loader2, Clock, Building2, Briefcase, FileText, Camera, Upload, CheckCircle2, X, User as UserIcon, AlertCircle, ExternalLink, Gauge, Map } from 'lucide-react';
import { getTripInsights, validateAddressWithMaps } from '../services/geminiService';
import { Trip, User } from '../types';
import { marked } from 'marked';

const Field = ({ label, name, type = "text", ...props }: any) => (
  <div className="space-y-1">
    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">{label}</label>
    <input 
      name={name} 
      type={type} 
      {...props} 
      className={`w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-xs font-bold text-slate-900 ${props.className || ''}`} 
    />
  </div>
);

interface TripFormProps {
  onAddTrip: (trip: Omit<Trip, 'id' | 'aiInsights'> & { aiInsights?: string }) => void;
  onUpdateTrip: (trip: Trip) => void;
  editingTrip: Trip | null;
  onCancel: () => void;
  operators: User[];
  isAdmin: boolean;
}

const TripForm: React.FC<TripFormProps> = ({ onAddTrip, onUpdateTrip, editingTrip, onCancel, operators, isAdmin }) => {
  const [formData, setFormData] = useState({
    client: '', project: '', appointmentTime: '', arrivalTime: '', street: '', number: '', neighborhood: '', zip: '', origin: '', destination: '', vehicleId: '',
    startDate: new Date().toISOString().split('T')[0], operatorId: operators[0]?.id || '', operatorName: operators[0]?.name || '', startMileage: '', endMileage: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loadingAI, setLoadingAI] = useState(false);
  const [verifyingAddress, setVerifyingAddress] = useState(false);
  const [aiTip, setAiTip] = useState<string | null>(null);
  const [addressVerification, setAddressVerification] = useState<{text: string, links: string[]} | null>(null);

  useEffect(() => {
    if (editingTrip) {
      setFormData({
        client: editingTrip.client, project: editingTrip.project, appointmentTime: editingTrip.appointmentTime, arrivalTime: editingTrip.arrivalTime || '',
        street: editingTrip.street, number: editingTrip.number, neighborhood: editingTrip.neighborhood, zip: editingTrip.zip,
        origin: editingTrip.origin || '', destination: editingTrip.destination || '', vehicleId: editingTrip.vehicleId,
        startDate: editingTrip.startDate, operatorId: editingTrip.operatorId, operatorName: editingTrip.operatorName,
        startMileage: editingTrip.startMileage?.toString() || '', endMileage: editingTrip.endMileage?.toString() || ''
      });
      setAiTip(editingTrip.aiInsights || null);
    }
  }, [editingTrip]);

  const validateAddressLocal = () => {
    const newErrors: Record<string, string> = {};
    if (formData.street.trim().length < 3) newErrors.street = 'Mínimo 3 letras';
    if (!formData.number.trim()) newErrors.number = 'Requerido';
    if (formData.neighborhood.trim().length < 3) newErrors.neighborhood = 'Requerido';
    if (!/^\d{5}$/.test(formData.zip)) newErrors.zip = '5 dígitos';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleVerifyAddress = async () => {
    if (!validateAddressLocal()) return;
    setVerifyingAddress(true);
    const result = await validateAddressWithMaps(`${formData.street} ${formData.number}, ${formData.neighborhood}, CP ${formData.zip}`);
    setAddressVerification(result);
    setVerifyingAddress(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateAddressLocal()) return;
    const tripData = { ...formData, startMileage: parseFloat(formData.startMileage) || undefined, endMileage: parseFloat(formData.endMileage) || undefined, status: editingTrip?.status || 'scheduled' as const, aiInsights: aiTip || undefined };
    editingTrip ? onUpdateTrip({ ...tripData, id: editingTrip.id } as Trip) : onAddTrip(tripData);
  };

  return (
    <div className="max-w-5xl mx-auto pb-12">
      <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200 relative">
        <button onClick={onCancel} className="absolute top-6 right-6 p-2 text-slate-400 hover:text-rose-600"><X size={24} /></button>
        <h3 className="text-2xl font-black text-slate-800 flex items-center gap-3 mb-8"><Truck className="text-blue-600" size={24} /> {editingTrip ? 'Editar Viaje' : 'Nuevo Viaje'}</h3>

        <form onSubmit={handleSubmit} className="space-y-10">
          <section className="space-y-6">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-3 flex items-center gap-2"><MapPin size={16} /> Ubicación</h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-3"><Field label="Calle" name="street" value={formData.street} onChange={(e:any) => setFormData({...formData, street: e.target.value})} className={errors.street ? 'border-rose-300 bg-rose-50' : ''} /></div>
              <Field label="Número" name="number" value={formData.number} onChange={(e:any) => setFormData({...formData, number: e.target.value})} className={errors.number ? 'border-rose-300 bg-rose-50' : ''} />
              <div className="md:col-span-2"><Field label="Colonia" name="neighborhood" value={formData.neighborhood} onChange={(e:any) => setFormData({...formData, neighborhood: e.target.value})} className={errors.neighborhood ? 'border-rose-300 bg-rose-50' : ''} /></div>
              <div className="md:col-span-2"><Field label="CP" name="zip" value={formData.zip} onChange={(e:any) => setFormData({...formData, zip: e.target.value})} className={errors.zip ? 'border-rose-300 bg-rose-50' : ''} /></div>
            </div>
            
            <button type="button" onClick={handleVerifyAddress} disabled={verifyingAddress} className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800">
              {verifyingAddress ? <Loader2 className="animate-spin" size={16} /> : <Map size={16} className="text-blue-400" />} Verificar con Maps
            </button>
            
            {addressVerification && (
              <div className="mt-6 p-6 bg-slate-50 rounded-3xl border border-slate-200 animate-in slide-in-from-top-4">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-blue-100 text-blue-600 rounded-2xl"><MapPin size={24} /></div>
                  <div className="flex-1">
                    <div className="ai-markdown-content text-sm text-slate-800" dangerouslySetInnerHTML={{ __html: marked.parse(addressVerification.text) }} />
                    {addressVerification.links.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-4">
                        {addressVerification.links.map((link, i) => (
                          <a key={i} href={link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-5 py-3 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-blue-700 shadow-xl shadow-blue-200 transition-all">
                            <ExternalLink size={14} /> Ver en Google Maps
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </section>

          <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Field label="Cliente" name="client" value={formData.client} onChange={(e:any) => setFormData({...formData, client: e.target.value})} required />
            <Field label="Proyecto" name="project" value={formData.project} onChange={(e:any) => setFormData({...formData, project: e.target.value})} required />
            <div className="space-y-1">
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Operador</label>
              <select required disabled={!isAdmin} className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold" value={formData.operatorId} onChange={(e:any) => { const op = operators.find(o => o.id === e.target.value); if(op) setFormData({...formData, operatorId: op.id, operatorName: op.name}); }}>
                {operators.map(op => <option key={op.id} value={op.id}>{op.name}</option>)}
              </select>
            </div>
          </section>

          <div className="pt-8 border-t border-slate-100 flex gap-4">
            <button type="submit" className="flex-1 px-8 py-4 bg-blue-600 text-white rounded-[2rem] font-black uppercase text-[10px] tracking-widest hover:bg-blue-700 shadow-xl shadow-blue-200 transition-all active:scale-95">{editingTrip ? 'Guardar Cambios' : 'Confirmar Viaje'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TripForm;
