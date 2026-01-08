
import React, { useState, useMemo, useRef, useEffect, useCallback, memo } from 'react';
import { 
  BookOpen, Calendar, Truck, User as UserIcon, Loader2, 
  ArrowLeft, Plus, X, Printer, CheckCircle, ChevronRight, 
  PenTool, Eraser, CreditCard, Fuel, DollarSign, FileText, 
  Save, Edit3, Download, FileDown, Pen, Trash2, Gauge, ClipboardCheck,
  ShieldCheck as ShieldIcon, Camera, Image as ImageIcon
} from 'lucide-react';
import { User, LogBookEntry, UserRole } from '../types';
import { jsPDF } from 'jspdf';
import { supabase } from '../services/supabase';

const Field = memo(({ label, name, type = "text", dark = false, ...props }: any) => (
  <div className="space-y-1">
    <label className={`text-[9px] font-black uppercase tracking-widest ml-1 ${dark ? 'text-slate-400' : 'text-slate-500'}`}>{label}</label>
    <input 
      name={name} 
      type={type} 
      {...props} 
      className={`w-full px-4 py-3 rounded-xl font-bold text-xs outline-none transition-all ${dark ? 'bg-white/10 border-white/20 text-white focus:border-blue-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-blue-600'}`} 
    />
  </div>
));

const CheckField = memo(({ label, checked, onChange }: any) => (
  <label className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all cursor-pointer ${checked ? 'bg-blue-50 border-blue-100' : 'bg-slate-50 border-slate-100'}`}>
    <input 
      type="checkbox" 
      checked={checked} 
      onChange={(e) => onChange(e.target.checked)}
      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
    />
    <span className={`text-[10px] font-black uppercase tracking-widest leading-none ${checked ? 'text-blue-700' : 'text-slate-600'}`}>{label}</span>
  </label>
));

const SignaturePad = ({ value, onChange }: { value?: string, onChange: (base64: string | undefined) => void }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastSignatureRef = useRef<string | undefined>(value);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => { lastSignatureRef.current = value; }, [value]);

  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (canvas && containerRef.current) {
      const parentWidth = containerRef.current.offsetWidth;
      canvas.width = parentWidth;
      canvas.height = 180;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 3;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        
        if (lastSignatureRef.current) {
          const img = new Image();
          img.onload = () => {
            const ratio = Math.min(canvas.width / img.width, canvas.height / img.height);
            ctx.drawImage(img, (canvas.width - img.width * ratio) / 2, (canvas.height - img.height * ratio) / 2, img.width * ratio, img.height * ratio);
          };
          img.src = lastSignatureRef.current;
        }
      }
    }
  }, []);

  useEffect(() => {
    initCanvas();
    const handleResize = () => {
      if (canvasRef.current) lastSignatureRef.current = canvasRef.current.toDataURL();
      initCanvas();
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [initCanvas]);

  const getCoords = (e: any) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  const startDrawing = (e: any) => {
    setIsDrawing(true);
    const { x, y } = getCoords(e);
    canvasRef.current?.getContext('2d')?.beginPath();
    canvasRef.current?.getContext('2d')?.moveTo(x, y);
  };

  const draw = (e: any) => {
    if (!isDrawing) return;
    const { x, y } = getCoords(e);
    canvasRef.current?.getContext('2d')?.lineTo(x, y);
    canvasRef.current?.getContext('2d')?.stroke();
    if (e.touches) e.preventDefault();
  };

  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false);
      const data = canvasRef.current?.toDataURL();
      lastSignatureRef.current = data;
      onChange(data);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center px-1">
        <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
          <Pen size={12} className="text-blue-500" /> Firma del Operador
        </label>
        <button type="button" onClick={() => { 
          canvasRef.current?.getContext('2d')?.clearRect(0,0,2000,2000); 
          lastSignatureRef.current = undefined;
          onChange(undefined); 
        }} className="text-[8px] font-black uppercase text-rose-500 bg-rose-50 px-3 py-1.5 rounded-xl hover:bg-rose-100 transition-colors">
          Limpiar
        </button>
      </div>
      <div ref={containerRef} className="bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200 overflow-hidden relative touch-none">
        <canvas 
          ref={canvasRef} 
          onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={stopDrawing} onMouseOut={stopDrawing}
          onTouchStart={startDrawing} onTouchMove={draw} onTouchEnd={stopDrawing}
          className="cursor-crosshair w-full" 
        />
        {!value && !isDrawing && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none opacity-20">
            <Pen size={32} className="mb-2 text-slate-400" />
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Firmar Aquí</p>
          </div>
        )}
      </div>
    </div>
  );
};

interface LogBookSectionProps {
  user: User;
  logBookEntries: LogBookEntry[];
  onSave: (entry: Partial<LogBookEntry>) => Promise<LogBookEntry | null>;
  onDeleteLogBook?: (id: string) => Promise<void>;
  onUpdateStatus?: (id: string, status: LogBookEntry['status'], operatorData?: {id: string, name: string}) => Promise<void>;
  operators?: User[];
  initialSelectedId?: string;
  onClearSelectedId?: () => void;
}

const LogBookSection: React.FC<LogBookSectionProps> = ({ 
  user, logBookEntries = [], onSave, onDeleteLogBook, onUpdateStatus, operators = [], initialSelectedId, onClearSelectedId
}) => {
  const isAdmin = user.role === UserRole.ADMIN;
  const [view, setView] = useState<'list' | 'form' | 'detail'>('list');
  const [loading, setLoading] = useState(false);
  const [uploadingEvidence, setUploadingEvidence] = useState(false);
  const [selectedLog, setSelectedLog] = useState<LogBookEntry | null>(null);

  const initialFormData: Partial<LogBookEntry> = useMemo(() => ({
    trip_num: '', departure_num: new Date().toISOString().split('T')[0], doc_delivery_date: '', log_delivery_date: '',
    fuel_card_liters: 0, fuel_card_amount: 0, tolls_tag_amount: 0, unit_eco: '',
    operator_id: '', operator_name: '',
    odo_initial: 0, odo_final: 0, total_distance: 0, client: '', destinations: '',
    fuel_cash_amount: 0, tolls_cash_amount: 0, food_amount: 0, repairs_amount: 0, maneuvers_amount: 0,
    status: 'pending', signature: '', evidence_urls: [],
    inspection: { tires: true, lights: true, fluids: true, brakes: true, documents: true, cleaned: true },
    eval_fuel_compliance: false, eval_docs_compliance: false, presented_at_load: false,
    on_time_route: false, discipline_evidence: false, final_compliance: false
  }), []);

  const [formData, setFormData] = useState<Partial<LogBookEntry>>(initialFormData);

  useEffect(() => {
    if (initialSelectedId) {
      const entry = logBookEntries.find(l => l.id === initialSelectedId);
      if (entry) { setFormData(entry); setView('form'); if (onClearSelectedId) onClearSelectedId(); }
    }
  }, [initialSelectedId, logBookEntries]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const val = type === 'number' ? parseFloat(value) || 0 : value;
    
    setFormData(prev => {
      const next = { ...prev, [name]: val };
      const currentOdoInit = name === 'odo_initial' ? Number(val) : Number(prev.odo_initial || 0);
      const currentDist = name === 'total_distance' ? Number(val) : Number(prev.total_distance || 0);
      next.odo_final = currentOdoInit + currentDist;
      return next;
    });
  };

  const handleEvidenceUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingEvidence(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        // 1. Guardar automáticamente en la sección de medios
        const mediaData = {
          url: base64,
          name: `Evidencia Bitácora - ${formData.client || 'Sin Nombre'}`,
          category: 'evidencia',
          uploader_id: user.id,
          uploader_name: user.name,
          timestamp: new Date().toISOString()
        };
        await supabase.from('media_assets').insert([mediaData]);
        
        // 2. Vincular URL al formulario local
        setFormData(prev => ({
          ...prev,
          evidence_urls: [...(prev.evidence_urls || []), base64]
        }));
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Error al subir evidencia:", error);
      alert("No se pudo cargar la foto.");
    } finally {
      setUploadingEvidence(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.signature && user.role === UserRole.OPERATOR) {
      alert("Debes firmar la bitácora para poder enviarla.");
      return;
    }
    setLoading(true);
    try {
      const subElectronic = (Number(formData.fuel_card_amount) || 0) + (Number(formData.tolls_tag_amount) || 0);
      const subCash = (Number(formData.fuel_cash_amount) || 0) + (Number(formData.tolls_cash_amount) || 0) + (Number(formData.food_amount) || 0) + (Number(formData.repairs_amount) || 0) + (Number(formData.maneuvers_amount) || 0);
      
      const entry = { 
        ...formData, 
        timestamp: new Date().toISOString(),
        subtotal_electronic: subElectronic,
        subtotal_cash: subCash,
        total_expenses: subElectronic + subCash,
        status: user.role === UserRole.OPERATOR ? 'completed' : (formData.status || 'pending')
      };
      await onSave(entry);
      setView('list');
      setFormData(initialFormData);
    } catch (err) {
      console.error(err);
      alert("Error al guardar la bitácora.");
    } finally { setLoading(false); }
  };

  const generatePDF = async (log: LogBookEntry) => {
    setLoading(true);
    try {
      const doc = new jsPDF();
      doc.setFillColor(15, 23, 42);
      doc.rect(0, 0, 210, 45, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(20);
      doc.setFont("helvetica", "bold");
      doc.text("REGISTRO DE BITÁCORA TLS", 15, 25);
      doc.setFontSize(9);
      doc.text(`FOLIO: ${log.trip_num || 'N/A'}`, 15, 33);
      
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(11);
      doc.text("DATOS DE OPERACIÓN", 15, 60);
      doc.line(15, 62, 195, 62);
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text(`Cliente: ${log.client || 'N/A'}`, 15, 70);
      doc.text(`Unidad: ${log.unit_eco || 'N/A'}`, 15, 77);
      doc.text(`Distancia: ${log.total_distance || 0} KM`, 110, 70);
      doc.text(`Operador: ${log.operator_name || 'N/A'}`, 110, 77);

      doc.setFont("helvetica", "bold");
      doc.text("RESUMEN DE GASTOS", 15, 95);
      doc.line(15, 97, 195, 97);
      doc.setFont("helvetica", "normal");
      doc.text(`Subtotal Electrónico (Tarjeta/TAG): $${(log.subtotal_electronic || 0).toLocaleString()}`, 15, 105);
      doc.text(`Subtotal Efectivo (Diesel/Casetas/Viáticos): $${(log.subtotal_cash || 0).toLocaleString()}`, 15, 112);
      doc.setFont("helvetica", "bold");
      doc.text(`TOTAL LIQUIDADO: $${(log.total_expenses || 0).toLocaleString()}`, 15, 122);

      doc.text("INSPECCIÓN DE SEGURIDAD", 15, 140);
      doc.line(15, 142, 195, 142);
      doc.setFont("helvetica", "normal");
      const insp = log.inspection || { tires: false, lights: false, fluids: false, brakes: false, documents: false, cleaned: false };
      doc.text(`Llantas: ${insp.tires ? 'OK' : 'X'} | Luces: ${insp.lights ? 'OK' : 'X'} | Fluidos: ${insp.fluids ? 'OK' : 'X'} | Frenos: ${insp.brakes ? 'OK' : 'X'}`, 15, 150);

      if (log.signature) {
        try {
          doc.addImage(log.signature, 'PNG', 75, 220, 60, 22);
        } catch (e) { console.warn("Firma no pudo cargarse en PDF"); }
      }
      doc.line(70, 245, 140, 245);
      doc.setFontSize(8);
      doc.text("FIRMA DEL OPERADOR", 105, 250, { align: 'center' });
      doc.text(log.operator_name || 'N/A', 105, 255, { align: 'center' });

      doc.save(`Bitacora_${log.trip_num || 'DOC'}.pdf`);
    } finally { setLoading(false); }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 px-1">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-2 no-print">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-slate-900 text-white rounded-2xl shadow-xl"><BookOpen size={24} /></div>
          <div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">Bitácoras TLS</h2>
            <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">Liquidación y Seguridad</p>
          </div>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          {view === 'list' && isAdmin && (
            <button onClick={() => { setFormData(initialFormData); setView('form'); }} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-blue-700 active:scale-95"><Plus size={18} /> Nueva Bitácora</button>
          )}
          {view !== 'list' && (
            <button onClick={() => setView('list')} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-slate-200 text-slate-700 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-300 transition-all"><ArrowLeft size={18} /> Volver</button>
          )}
        </div>
      </header>

      {view === 'form' ? (
        <form onSubmit={handleSubmit} className="space-y-6 animate-in slide-in-from-bottom-4 px-1 no-print">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 space-y-6">
              {isAdmin && (
                <section className="bg-white p-8 rounded-[2.5rem] border border-slate-200 space-y-6 shadow-sm">
                  <h3 className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] flex items-center gap-2"><UserIcon size={18} /> Asignación de Operador</h3>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Operador Responsable</label>
                    <select 
                      name="operator_id" 
                      value={formData.operator_id || ''} 
                      onChange={(e) => {
                        const opId = e.target.value;
                        const opName = operators.find(o => o.id === opId)?.name || 'DISPONIBLE GLOBAL';
                        setFormData({...formData, operator_id: opId, operator_name: opName});
                      }}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none"
                    >
                      <option value="">DISPONIBLE PARA TODOS (GLOBAL)</option>
                      {operators.map(op => (
                        <option key={op.id} value={op.id}>{op.name}</option>
                      ))}
                    </select>
                    <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest mt-1">Si seleccionas "Global", cualquier operador podrá aceptar esta bitácora.</p>
                  </div>
                </section>
              )}

              <section className="bg-white p-8 rounded-[2.5rem] border border-slate-200 space-y-6 shadow-sm">
                <h3 className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] flex items-center gap-2"><FileText size={18} /> Datos de Ruta</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label="Cliente" name="client" value={formData.client} onChange={handleInputChange} required />
                  <Field label="Folio / No. Viaje" name="trip_num" value={formData.trip_num} onChange={handleInputChange} required />
                  <div className="md:col-span-2"><Field label="Escalas y Destinos" name="destinations" value={formData.destinations} onChange={handleInputChange} /></div>
                  <Field label="Fecha Salida" name="departure_num" type="date" value={formData.departure_num} onChange={handleInputChange} />
                  <Field label="Fecha Entrega Doctos" name="doc_delivery_date" type="date" value={formData.doc_delivery_date} onChange={handleInputChange} />
                </div>
              </section>

              <section className="bg-white p-8 rounded-[2.5rem] border border-slate-200 space-y-6 shadow-sm">
                <h3 className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] flex items-center gap-2"><Camera size={18} /> Evidencias (Fotos / Tickets)</h3>
                <div className="flex flex-wrap gap-4">
                  {(formData.evidence_urls || []).map((url, i) => (
                    <div key={i} className="relative w-24 h-24 rounded-2xl overflow-hidden border-2 border-slate-100 shadow-sm group">
                      <img src={url} className="w-full h-full object-cover" alt="Evidencia" />
                      <button 
                        type="button" 
                        onClick={() => setFormData(p => ({...p, evidence_urls: p.evidence_urls?.filter((_, idx) => idx !== i)}))}
                        className="absolute top-1 right-1 p-1 bg-rose-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                  <label className="w-24 h-24 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 hover:border-blue-300 transition-all group">
                    {uploadingEvidence ? (
                      <Loader2 className="animate-spin text-blue-600" />
                    ) : (
                      <>
                        <Camera className="text-slate-400 group-hover:text-blue-600" size={24} />
                        <span className="text-[8px] font-black uppercase text-slate-400 mt-1 group-hover:text-blue-600">Tomar Foto</span>
                      </>
                    )}
                    <input 
                      type="file" 
                      accept="image/*" 
                      capture="environment" 
                      className="hidden" 
                      onChange={handleEvidenceUpload} 
                    />
                  </label>
                </div>
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Toma fotos de tickets de carga, sellos de cliente o incidentes. Se guardan automáticamente en tu historial de medios.</p>
              </section>

              <section className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-2xl space-y-6">
                <div className="flex justify-between items-center border-b border-white/10 pb-4">
                  <h3 className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] flex items-center gap-2"><CreditCard size={18} /> Liquidación de Gastos</h3>
                  <span className="text-2xl font-black text-emerald-400">$ {((Number(formData.subtotal_cash || 0) + Number(formData.subtotal_electronic || 0)).toLocaleString())}</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Field label="Diesel Tarjeta ($)" name="fuel_card_amount" type="number" dark value={formData.fuel_card_amount} onChange={handleInputChange} />
                  <Field label="Diesel Efectivo ($)" name="fuel_cash_amount" type="number" dark value={formData.fuel_cash_amount} onChange={handleInputChange} />
                  <Field label="TAG / Peaje ($)" name="tolls_tag_amount" type="number" dark value={formData.tolls_tag_amount} onChange={handleInputChange} />
                  <Field label="Casetas Efectivo ($)" name="tolls_cash_amount" type="number" dark value={formData.tolls_cash_amount} onChange={handleInputChange} />
                  <Field label="Viáticos ($)" name="food_amount" type="number" dark value={formData.food_amount} onChange={handleInputChange} />
                  <Field label="Varios ($)" name="maneuvers_amount" type="number" dark value={formData.maneuvers_amount} onChange={handleInputChange} />
                </div>
              </section>
            </div>

            <div className="lg:col-span-4 space-y-6">
              <section className="bg-blue-600 p-8 rounded-[2.5rem] text-white shadow-xl space-y-6">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2"><ShieldIcon size={18} /> Inspección Preventiva</h3>
                <div className="space-y-3">
                  <CheckField label="Llantas y Niveles" checked={formData.inspection?.tires} onChange={(v: boolean) => setFormData({...formData, inspection: {...formData.inspection!, tires: v}})} />
                  <CheckField label="Luces y Señalización" checked={formData.inspection?.lights} onChange={(v: boolean) => setFormData({...formData, inspection: {...formData.inspection!, lights: v}})} />
                  <CheckField label="Sist. de Frenado" checked={formData.inspection?.brakes} onChange={(v: boolean) => setFormData({...formData, inspection: {...formData.inspection!, brakes: v}})} />
                </div>
              </section>

              <section className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-4">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Control de Odómetro</h3>
                <Field label="Unidad ECO" name="unit_eco" value={formData.unit_eco} onChange={handleInputChange} />
                <Field label="Km Inicial" name="odo_initial" type="number" value={formData.odo_initial} onChange={handleInputChange} />
                <Field label="Km Recorrido" name="total_distance" type="number" value={formData.total_distance} onChange={handleInputChange} />
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex justify-between items-center">
                  <span className="text-[9px] font-black text-slate-400 uppercase">Km Final:</span>
                  <span className="text-xl font-black text-slate-900">{formData.odo_final} KM</span>
                </div>
              </section>

              <SignaturePad value={formData.signature} onChange={(sig) => setFormData(p => ({...p, signature: sig}))} />

              <button type="submit" disabled={loading} className="w-full py-5 bg-emerald-600 text-white rounded-[2rem] font-black uppercase text-[10px] tracking-widest shadow-2xl hover:bg-emerald-700 transition-all flex items-center justify-center gap-3">
                {loading ? <Loader2 className="animate-spin" size={20} /> : <CheckCircle size={20} />}
                {isAdmin ? (formData.id ? 'ACTUALIZAR BITÁCORA' : 'LANZAR BITÁCORA') : 'FINALIZAR Y ENVIAR'}
              </button>
            </div>
          </div>
        </form>
      ) : view === 'list' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-1">
          {logBookEntries.filter(l => isAdmin || l.operator_id === user.id || !l.operator_id).map(log => (
            <div key={log.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-200 hover:shadow-2xl transition-all group relative overflow-hidden">
               <div className={`absolute top-0 right-0 w-2 h-full ${log.status === 'completed' ? 'bg-emerald-500' : 'bg-blue-500'}`}></div>
               <div className="flex justify-between items-start mb-4">
                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{new Date(log.timestamp).toLocaleDateString()}</span>
                 <StatusBadge status={log.status} />
               </div>
               <h4 className="text-xl font-black text-slate-900 leading-tight mb-2 group-hover:text-blue-600 transition-colors truncate">{log.client}</h4>
               <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Viaje {log.trip_num} • ECO {log.unit_eco}</p>
               <div className="mt-8 flex items-center justify-between border-t border-slate-50 pt-4">
                  <span className="text-lg font-black text-slate-900">$ {(log.total_expenses || 0).toLocaleString()}</span>
                  <button onClick={() => { setSelectedLog(log); setView('detail'); }} className="p-3 bg-slate-100 text-slate-600 rounded-2xl hover:bg-slate-900 hover:text-white transition-all"><ChevronRight size={18}/></button>
               </div>
            </div>
          ))}
        </div>
      ) : selectedLog && (
        <div className="animate-in zoom-in-95 duration-300 px-1">
          <div className="bg-white p-12 rounded-[3.5rem] shadow-2xl border border-slate-200 relative overflow-hidden">
             <div className="flex justify-between items-start border-b border-slate-100 pb-8 mb-8">
               <div>
                 <h3 className="text-4xl font-black text-slate-900 tracking-tighter mb-2">{selectedLog.client}</h3>
                 <p className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2"><Truck size={14} /> Unidad {selectedLog.unit_eco} • Viaje {selectedLog.trip_num}</p>
               </div>
               <div className="flex gap-3 no-print">
                 <button onClick={() => generatePDF(selectedLog)} className="p-4 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 transition-all shadow-xl shadow-blue-100"><FileDown size={24} /></button>
                 <button onClick={() => window.print()} className="p-4 bg-slate-900 text-white rounded-2xl hover:bg-slate-800 transition-all"><Printer size={24} /></button>
               </div>
             </div>
             <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
                <SummaryWidget label="Distancia" value={`${selectedLog.total_distance || 0} KM`} icon={<Gauge />} />
                <SummaryWidget label="Total Liq." value={`$ ${(selectedLog.total_expenses || 0).toLocaleString()}`} icon={<DollarSign />} highlight />
                <SummaryWidget label="Electrónico" value={`$ ${(selectedLog.subtotal_electronic || 0).toLocaleString()}`} icon={<CreditCard />} />
                <SummaryWidget label="Efectivo" value={`$ ${(selectedLog.subtotal_cash || 0).toLocaleString()}`} icon={<DollarSign />} />
             </div>
             
             {selectedLog.evidence_urls && selectedLog.evidence_urls.length > 0 && (
               <div className="mb-12">
                 <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2"><ImageIcon size={14}/> Evidencias Registradas</h4>
                 <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
                   {selectedLog.evidence_urls.map((url, i) => (
                     <img key={i} src={url} className="w-full aspect-square object-cover rounded-2xl border border-slate-100 shadow-sm" alt="Evidencia" />
                   ))}
                 </div>
               </div>
             )}

             <div className="mt-12 flex flex-col items-center border-t border-slate-100 pt-12">
                {selectedLog.signature && <img src={selectedLog.signature} className="h-28 object-contain mb-4 mix-blend-multiply" alt="Firma" />}
                <div className="w-64 border-t-2 border-slate-900 pt-3 text-center">
                  <p className="text-[10px] font-black uppercase tracking-widest">{selectedLog.operator_name}</p>
                  <p className="text-[8px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">Nombre y Firma del Operador</p>
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

const SummaryWidget = ({ label, value, icon, highlight }: any) => (
  <div className={`p-6 rounded-[2.5rem] border ${highlight ? 'bg-slate-900 text-white border-slate-900' : 'bg-slate-50 border-slate-100 text-slate-900'}`}>
    <div className={`mb-3 ${highlight ? 'text-blue-400' : 'text-blue-600'}`}>{icon}</div>
    <p className={`text-[8px] font-black uppercase tracking-widest mb-1 ${highlight ? 'text-slate-400' : 'text-slate-400'}`}>{label}</p>
    <p className="text-xl font-black">{value}</p>
  </div>
);

const StatusBadge = memo(({ status }: { status: LogBookEntry['status'] }) => {
  const styles = { pending: 'bg-amber-100 text-amber-700', approved: 'bg-blue-100 text-blue-700', rejected: 'bg-rose-100 text-rose-700', completed: 'bg-emerald-100 text-emerald-700' };
  const labels = { pending: 'POR ACEPTAR', approved: 'EN CURSO', rejected: 'RECHAZADA', completed: 'FINALIZADA' };
  return <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${styles[status]}`}>{labels[status]}</span>;
});

export default LogBookSection;
