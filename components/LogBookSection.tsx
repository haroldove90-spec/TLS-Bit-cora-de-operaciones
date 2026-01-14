
import React, { useState, useMemo, useRef, useEffect, useCallback, memo } from 'react';
import { 
  BookOpen, Calendar, Truck, User as UserIcon, Loader2, 
  ArrowLeft, Plus, X, Printer, CheckCircle, ChevronRight, 
  CreditCard, DollarSign, FileText, FileDown, Pen, Gauge, MapPin, Clock, ShieldCheck
} from 'lucide-react';
import { User, LogBookEntry, UserRole } from '../types';
import { jsPDF } from 'jspdf';
import { supabase } from '../services/supabase';

// Componentes de formulario originales restaurados
const Field = memo(({ label, name, type = "text", dark = false, ...props }: any) => (
  <div className="space-y-1">
    <label className={`text-[9px] font-black uppercase tracking-widest ml-1 ${dark ? 'text-slate-400' : 'text-slate-500'}`}>{label}</label>
    <input 
      name={name} 
      type={type} 
      {...props} 
      className={`w-full px-4 py-3 rounded-xl font-bold text-xs outline-none transition-all ${dark ? 'bg-white/10 border-white/20 text-white' : 'bg-slate-100 border-slate-200 text-slate-900 focus:border-slate-400'}`} 
    />
  </div>
));

const CheckField = memo(({ label, checked, onChange }: any) => (
  <label className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all cursor-pointer ${checked ? 'bg-slate-50 border-slate-200' : 'bg-slate-50 border-slate-100'}`}>
    <input 
      type="checkbox" 
      checked={checked} 
      onChange={(e) => onChange(e.target.checked)}
      className="w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-500"
    />
    <span className={`text-[10px] font-black uppercase tracking-widest leading-none ${checked ? 'text-slate-900' : 'text-slate-500'}`}>{label}</span>
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
          <Pen size={12} className="text-slate-400" /> Firma del Operador
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
  const [selectedLog, setSelectedLog] = useState<LogBookEntry | null>(null);

  const initialFormData: Partial<LogBookEntry> = useMemo(() => ({
    trip_num: '', departure_num: new Date().toISOString().split('T')[0], doc_delivery_date: '', log_delivery_date: '',
    fuel_card_liters: 0, fuel_card_amount: 0, tolls_tag_amount: 0, unit_eco: '',
    operator_id: null, operator_name: '',
    odo_initial: 0, odo_final: 0, total_distance: 0, client: '', destinations: '',
    fuel_cash_amount: 0, tolls_cash_amount: 0, food_amount: 0, repairs_amount: 0, maneuvers_amount: 0,
    other_expenses: [],
    status: 'pending', signature: '', evidence_urls: [],
    inspection: { tires: true, lights: true, fluids: true, brakes: true, documents: true, cleaned: true },
    eval_fuel_compliance: false, eval_docs_compliance: false, presented_at_load: false,
    on_time_route: false, discipline_evidence: false, final_compliance: false
  }), []);

  const [formData, setFormData] = useState<Partial<LogBookEntry>>(initialFormData);

  useEffect(() => {
    if (initialSelectedId) {
      const entry = logBookEntries.find(l => l.id === initialSelectedId);
      if (entry) { 
        setFormData(entry); 
        if (entry.status === 'completed' || entry.status === 'approved') {
          setSelectedLog(entry);
          setView('detail');
        } else {
          setView('form');
        }
        if (onClearSelectedId) onClearSelectedId(); 
      }
    }
  }, [initialSelectedId, logBookEntries]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const val = type === 'number' ? parseFloat(value) || 0 : value;
    
    setFormData(prev => {
      const next = { ...prev, [name]: val };
      if (name === 'odo_initial' || name === 'total_distance') {
        const currentOdoInit = name === 'odo_initial' ? Number(val) : Number(prev.odo_initial || 0);
        const currentDist = name === 'total_distance' ? Number(val) : Number(prev.total_distance || 0);
        next.odo_final = currentOdoInit + currentDist;
      }
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.signature && user.role === UserRole.OPERATOR) {
      alert("Debes firmar la bitácora para poder enviarla.");
      return;
    }
    setLoading(true);
    try {
      const currentSubtotalElectronic = (Number(formData.fuel_card_amount) || 0) + (Number(formData.tolls_tag_amount) || 0);
      const currentSubtotalCash = (Number(formData.fuel_cash_amount) || 0) + (Number(formData.tolls_cash_amount) || 0) + (Number(formData.food_amount) || 0) + (Number(formData.repairs_amount) || 0) + (Number(formData.maneuvers_amount) || 0);
      
      const entry: any = { 
        ...formData, 
        timestamp: new Date().toISOString(),
        subtotal_electronic: currentSubtotalElectronic,
        subtotal_cash: currentSubtotalCash,
        total_expenses: currentSubtotalElectronic + currentSubtotalCash,
        status: user.role === UserRole.OPERATOR ? 'completed' : (formData.status || 'pending')
      };

      if (!entry.operator_id || entry.operator_id === '' || entry.operator_id === 'null') entry.operator_id = null;
      if (entry.departure_num === '') entry.departure_num = null;
      if (entry.doc_delivery_date === '') entry.doc_delivery_date = null;
      if (entry.log_delivery_date === '') entry.log_delivery_date = null;

      const result = await onSave(entry);
      if (!result) throw new Error("Error de guardado.");

      setView('list');
      setFormData(initialFormData);
    } catch (err: any) {
      console.error("Submit Error:", err);
    } finally { setLoading(false); }
  };

  const generatePDF = async (log: LogBookEntry) => {
    setLoading(true);
    try {
      const doc = new jsPDF();
      
      // Header Corporativo Plano
      doc.setFillColor(15, 23, 42);
      doc.rect(0, 0, 210, 40, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.text("REGISTRO DE BITÁCORA TLS", 15, 20);
      doc.setFontSize(9);
      doc.text(`FOLIO DE VIAJE: ${log.trip_num || 'N/A'}`, 15, 30);
      doc.text(`FECHA REPORTE: ${new Date(log.timestamp).toLocaleDateString()}`, 150, 20);
      
      // Secciones
      const drawSection = (title: string, y: number) => {
        doc.setTextColor(37, 99, 235);
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.text(title, 15, y);
        doc.setDrawColor(219, 234, 254);
        doc.line(15, y + 2, 195, y + 2);
        return y + 10;
      };

      let y = 55;
      y = drawSection("DATOS DE OPERACIÓN", y);
      
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      
      const leftCol = [
        ["Cliente:", log.client],
        ["Ruta / Escalas:", log.destinations],
        ["Unidad ECO:", log.unit_eco],
        ["Operador:", log.operator_name]
      ];
      
      const rightCol = [
        ["Fecha Salida:", log.departure_num],
        ["Km Recorrido:", `${log.total_distance || 0} KM`],
        ["Entrega Doctos:", log.doc_delivery_date],
        ["Entrega Bitácora:", log.log_delivery_date]
      ];

      leftCol.forEach((item, i) => {
        doc.setFont("helvetica", "bold");
        doc.text(item[0], 15, y + (i * 7));
        doc.setFont("helvetica", "normal");
        doc.text(item[1] || '---', 45, y + (i * 7));
      });

      rightCol.forEach((item, i) => {
        doc.setFont("helvetica", "bold");
        doc.text(item[0], 120, y + (i * 7));
        doc.setFont("helvetica", "normal");
        doc.text(item[1] || '---', 155, y + (i * 7));
      });

      y += 35;
      y = drawSection("LIQUIDACIÓN DE GASTOS", y);
      
      const expenses = [
        ["Diesel (Efectivo)", log.fuel_cash_amount],
        ["Casetas", log.tolls_cash_amount],
        ["Viáticos", log.food_amount],
        ["Maniobras", log.maneuvers_amount],
        ["Varios / Reparaciones", log.repairs_amount]
      ];

      expenses.forEach((exp, i) => {
        doc.setFont("helvetica", "normal");
        doc.text(exp[0].toString(), 15, y + (i * 7));
        doc.text(`$ ${(Number(exp[1]) || 0).toLocaleString()}`, 150, y + (i * 7));
      });

      y += 40;
      doc.setFont("helvetica", "bold");
      doc.text("TOTAL LIQUIDADO:", 15, y);
      doc.text(`$ ${(log.total_expenses || 0).toLocaleString()} MXN`, 150, y);

      y += 15;
      y = drawSection("INSPECCIÓN TÉCNICA", y);
      const insp = log.inspection || { tires: false, lights: false, fluids: false, brakes: false };
      doc.setFont("helvetica", "normal");
      doc.text(`Llantas: ${insp.tires ? 'OK' : 'X'}  |  Luces: ${insp.lights ? 'OK' : 'X'}  |  Frenos: ${insp.brakes ? 'OK' : 'X'}  |  Fluidos: ${insp.fluids ? 'OK' : 'X'}`, 15, y);

      if (log.signature) {
        try { doc.addImage(log.signature, 'PNG', 75, 230, 60, 25); } catch (e) {}
      }
      doc.line(70, 260, 140, 260);
      doc.text("FIRMA DEL OPERADOR", 105, 265, { align: 'center' });
      doc.text(log.operator_name || 'N/A', 105, 270, { align: 'center' });

      doc.save(`Bitacora_TLS_${log.trip_num || 'DOC'}.pdf`);
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
            <button onClick={() => { setFormData(initialFormData); setView('form'); }} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl"><Plus size={18} /> Nueva Bitácora</button>
          )}
          {view !== 'list' && (
            <button onClick={() => setView('list')} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-slate-200 text-slate-700 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-300"><ArrowLeft size={18} /> Volver</button>
          )}
        </div>
      </header>

      {view === 'form' ? (
        <form onSubmit={handleSubmit} className="space-y-6 animate-in slide-in-from-bottom-4 px-1 no-print">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 space-y-6">
              {isAdmin && (
                <section className="bg-white p-8 rounded-[2.5rem] border border-slate-200 space-y-6 shadow-sm">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2"><UserIcon size={18} /> Asignación de Operador</h3>
                  <select name="operator_id" value={formData.operator_id || ''} onChange={(e) => {
                      const opId = e.target.value;
                      const opName = operators.find(o => o.id === opId)?.name || 'DISPONIBLE GLOBAL';
                      setFormData({...formData, operator_id: opId === '' ? null : opId, operator_name: opName});
                    }}
                    className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none"
                  >
                    <option value="">DISPONIBLE PARA TODOS (GLOBAL)</option>
                    {operators.map(op => <option key={op.id} value={op.id}>{op.name}</option>)}
                  </select>
                </section>
              )}

              <section className="bg-white p-8 rounded-[2.5rem] border border-slate-200 space-y-6 shadow-sm">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2"><FileText size={18} /> Datos de Ruta</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label="Cliente" name="client" value={formData.client} onChange={handleInputChange} required />
                  <Field label="Folio / No. Viaje" name="trip_num" value={formData.trip_num} onChange={handleInputChange} required />
                  <div className="md:col-span-2"><Field label="Escalas y Destinos" name="destinations" value={formData.destinations} onChange={handleInputChange} /></div>
                  <Field label="Fecha Salida" name="departure_num" type="date" value={formData.departure_num} onChange={handleInputChange} />
                  <Field label="Fecha Entrega Doctos" name="doc_delivery_date" type="date" value={formData.doc_delivery_date} onChange={handleInputChange} />
                </div>
              </section>

              <section className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-xl space-y-6">
                <div className="flex justify-between items-center border-b border-white/10 pb-4">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2"><CreditCard size={18} /> Liquidación de Gastos</h3>
                  <span className="text-2xl font-black text-emerald-400">$ {((Number(formData.fuel_card_amount) || 0) + (Number(formData.tolls_tag_amount) || 0) + (Number(formData.fuel_cash_amount) || 0) + (Number(formData.tolls_cash_amount) || 0) + (Number(formData.food_amount) || 0) + (Number(formData.repairs_amount) || 0) + (Number(formData.maneuvers_amount) || 0)).toLocaleString()}</span>
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
              <section className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-200 space-y-6">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2"><ShieldCheck size={18} /> Inspección Preventiva</h3>
                <div className="space-y-3">
                  <CheckField label="Llantas y Niveles" checked={formData.inspection?.tires} onChange={(v: boolean) => setFormData({...formData, inspection: {...formData.inspection!, tires: v}})} />
                  <CheckField label="Luces y Señalización" checked={formData.inspection?.lights} onChange={(v: boolean) => setFormData({...formData, inspection: {...formData.inspection!, lights: v}})} />
                  <CheckField label="Sist. de Frenado" checked={formData.inspection?.brakes} onChange={(v: boolean) => setFormData({...formData, inspection: {...formData.inspection!, brakes: v}})} />
                </div>
              </section>

              <section className="bg-white p-8 rounded-[2.5rem] border border-slate-200 space-y-4 shadow-sm">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Control de Odómetro</h3>
                <Field label="Unidad ECO" name="unit_eco" value={formData.unit_eco} onChange={handleInputChange} />
                <Field label="Km Inicial" name="odo_initial" type="number" value={formData.odo_initial} onChange={handleInputChange} />
                <Field label="Km Recorrido" name="total_distance" type="number" value={formData.total_distance} onChange={handleInputChange} />
                <div className="p-4 bg-slate-50 rounded-2xl flex justify-between items-center border border-slate-100">
                  <span className="text-[9px] font-black text-slate-400 uppercase">Km Final:</span>
                  <span className="text-xl font-black text-slate-900">{formData.odo_final} KM</span>
                </div>
              </section>

              <SignaturePad value={formData.signature} onChange={(sig) => setFormData(p => ({...p, signature: sig}))} />

              <button type="submit" disabled={loading} className="w-full py-5 bg-slate-900 text-white rounded-[2rem] font-black uppercase text-[10px] tracking-widest shadow-2xl hover:bg-slate-800 transition-all flex items-center justify-center gap-3">
                {loading ? <Loader2 className="animate-spin" size={20} /> : <CheckCircle size={20} />}
                {isAdmin ? (formData.id ? 'ACTUALIZAR BITÁCORA' : 'LANZAR BITÁCORA') : 'FINALIZAR Y ENVIAR'}
              </button>
            </div>
          </div>
        </form>
      ) : view === 'list' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-1">
          {logBookEntries.filter(l => isAdmin || l.operator_id === user.id || !l.operator_id).map(log => (
            <div key={log.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-200 hover:shadow-xl transition-all relative overflow-hidden group">
               <div className={`absolute top-0 right-0 w-2 h-full ${log.status === 'completed' ? 'bg-emerald-500' : 'bg-blue-500'}`}></div>
               <div className="flex justify-between items-start mb-4">
                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{new Date(log.timestamp).toLocaleDateString()}</span>
                 <StatusBadge status={log.status} />
               </div>
               <h4 className="text-xl font-black text-slate-900 leading-tight mb-2 truncate group-hover:text-blue-600 transition-colors">{log.client}</h4>
               <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Viaje {log.trip_num} • ECO {log.unit_eco}</p>
               <div className="mt-8 flex items-center justify-between border-t border-slate-50 pt-4">
                  <span className="text-lg font-black text-slate-900">$ {(log.total_expenses || 0).toLocaleString()}</span>
                  <button onClick={() => { setSelectedLog(log); setView('detail'); }} className="p-3 bg-slate-100 text-slate-600 rounded-2xl hover:bg-slate-900 hover:text-white transition-all"><ChevronRight size={18}/></button>
               </div>
            </div>
          ))}
        </div>
      ) : selectedLog && (
        <div className="animate-in zoom-in-95 duration-300 px-1 print:p-0 print:m-0">
          <div className="bg-white min-h-[800px] print:w-full rounded-[2.5rem] shadow-2xl border border-slate-200 overflow-hidden print:shadow-none print:border-none print:rounded-none">
             
             {/* HEADER UNIFICADO (SCREEN & PRINT) */}
             <div className="bg-slate-900 p-8 text-white flex justify-between items-center">
                <div className="space-y-1">
                  <h3 className="text-2xl font-black tracking-tight">REGISTRO DE BITÁCORA TLS</h3>
                  <div className="flex items-center gap-4 text-slate-400 font-bold text-[10px] uppercase tracking-[0.2em]">
                    <span>FOLIO: {selectedLog.trip_num || 'N/A'}</span>
                    <span>FECHA: {new Date(selectedLog.timestamp).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex gap-3 no-print">
                  <button onClick={() => generatePDF(selectedLog)} className="p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-lg"><FileDown size={20}/></button>
                  <button onClick={() => window.print()} className="p-3 bg-slate-800 text-slate-400 rounded-xl hover:bg-slate-700 transition-all"><Printer size={20}/></button>
                </div>
             </div>

             {/* CUERPO DEL REPORTE (DOS COLUMNAS) */}
             <div className="p-10 space-y-10 bg-white">
                
                {/* SECCIÓN 1: DATOS DE OPERACIÓN */}
                <section>
                  <h4 className="text-sm font-black text-blue-600 uppercase tracking-widest border-b border-blue-50 pb-2 mb-6 flex items-center gap-2">
                    <Truck size={16} /> DATOS DE OPERACIÓN
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
                    <DataRow label="Cliente" value={selectedLog.client} />
                    <DataRow label="Fecha Salida" value={selectedLog.departure_num} />
                    <DataRow label="Ruta / Escalas" value={selectedLog.destinations} />
                    <DataRow label="Distancia Total" value={`${selectedLog.total_distance || 0} KM`} />
                    <DataRow label="Unidad ECO" value={selectedLog.unit_eco} />
                    <DataRow label="Entrega Doctos" value={selectedLog.doc_delivery_date} />
                    <DataRow label="Operador" value={selectedLog.operator_name} />
                    <DataRow label="Entrega Bitácora" value={selectedLog.log_delivery_date} />
                  </div>
                </section>

                {/* SECCIÓN 2: CONTROL DE KILOMETRAJE */}
                <section>
                  <h4 className="text-sm font-black text-blue-600 uppercase tracking-widest border-b border-blue-50 pb-2 mb-6 flex items-center gap-2">
                    <Gauge size={16} /> CONTROL DE KILOMETRAJE
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-6 bg-slate-50 p-6 rounded-2xl print:bg-white print:border print:border-slate-100">
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Km Inicial</p>
                      <p className="text-xl font-black text-slate-900">{selectedLog.odo_initial || 0}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Km Final</p>
                      <p className="text-xl font-black text-slate-900">{selectedLog.odo_final || 0}</p>
                    </div>
                    <div className="col-span-2 md:col-span-1 border-t md:border-t-0 md:border-l border-slate-200 pt-4 md:pt-0 md:pl-6">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Recorrido</p>
                      <p className="text-xl font-black text-blue-600">{selectedLog.total_distance || 0} KM</p>
                    </div>
                  </div>
                </section>

                {/* SECCIÓN 3: LIQUIDACIÓN DE GASTOS */}
                <section>
                  <h4 className="text-sm font-black text-blue-600 uppercase tracking-widest border-b border-blue-50 pb-2 mb-6 flex items-center gap-2">
                    <CreditCard size={16} /> LIQUIDACIÓN DE GASTOS (EFECTIVO)
                  </h4>
                  <div className="space-y-3">
                    <ExpenseLine label="Combustible Diesel" value={selectedLog.fuel_cash_amount} />
                    <ExpenseLine label="Casetas y Peajes" value={selectedLog.tolls_cash_amount} />
                    <ExpenseLine label="Viáticos y Alimentos" value={selectedLog.food_amount} />
                    <ExpenseLine label="Reparaciones Mecánicas" value={selectedLog.repairs_amount} />
                    <ExpenseLine label="Maniobras / Claves" value={selectedLog.maneuvers_amount} />
                    <div className="pt-4 mt-4 border-t-2 border-slate-900 flex justify-between items-center">
                      <span className="text-sm font-black text-slate-900 uppercase tracking-widest">TOTAL LIQUIDADO EN EFECTIVO</span>
                      <span className="text-2xl font-black text-slate-900">$ {(selectedLog.subtotal_cash || 0).toLocaleString()}</span>
                    </div>
                  </div>
                </section>

                {/* SECCIÓN 4: INSPECCIÓN TÉCNICA */}
                <section>
                  <h4 className="text-sm font-black text-blue-600 uppercase tracking-widest border-b border-blue-50 pb-2 mb-6 flex items-center gap-2">
                    <ShieldCheck size={16} /> INSPECCIÓN TÉCNICO-PREVENTIVA
                  </h4>
                  <div className="flex flex-wrap gap-10">
                    <SafetyLabel label="Sist. Llantas" ok={selectedLog.inspection?.tires} />
                    <SafetyLabel label="Sist. Luces" ok={selectedLog.inspection?.lights} />
                    <SafetyLabel label="Sist. Frenos" ok={selectedLog.inspection?.brakes} />
                    <SafetyLabel label="Sist. Fluidos" ok={selectedLog.inspection?.fluids} />
                  </div>
                </section>

                {/* FIRMA FINAL */}
                <section className="pt-16 flex flex-col items-center">
                  {selectedLog.signature && <img src={selectedLog.signature} className="h-32 object-contain mb-2 mix-blend-multiply" alt="Firma" />}
                  <div className="w-72 border-t-2 border-slate-900 pt-3 text-center">
                    <p className="text-xs font-black uppercase tracking-widest leading-none">{selectedLog.operator_name || 'PENDIENTE DE FIRMA'}</p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Sello Digital de Conformidad TLS</p>
                  </div>
                </section>

             </div>
          </div>
        </div>
      )}
    </div>
  );
};

const DataRow = ({ label, value }: { label: string, value: string | number | undefined }) => (
  <div className="flex justify-between items-center border-b border-slate-50 py-1.5">
    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
    <span className="text-[11px] font-black text-slate-800 uppercase text-right leading-tight max-w-[60%]">{value || '---'}</span>
  </div>
);

const ExpenseLine = ({ label, value }: { label: string, value: number | undefined }) => (
  <div className="flex justify-between items-center py-1">
    <span className="text-[10px] font-bold text-slate-600 uppercase">{label}</span>
    <span className="text-sm font-black text-slate-900 font-mono">$ {(Number(value) || 0).toLocaleString()}</span>
  </div>
);

const SafetyLabel = ({ label, ok }: { label: string, ok?: boolean }) => (
  <div className="flex items-center gap-2">
    <div className={`w-3 h-3 rounded-full ${ok ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
    <span className={`text-[10px] font-black uppercase tracking-widest ${ok ? 'text-slate-800' : 'text-slate-400 line-through'}`}>{label}</span>
  </div>
);

const StatusBadge = memo(({ status }: { status: LogBookEntry['status'] }) => {
  const styles = { pending: 'bg-amber-100 text-amber-700', approved: 'bg-blue-100 text-blue-700', rejected: 'bg-rose-100 text-rose-700', completed: 'bg-emerald-100 text-emerald-700' };
  const labels = { pending: 'POR ACEPTAR', approved: 'EN CURSO', rejected: 'RECHAZADA', completed: 'FINALIZADA' };
  return <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${styles[status]}`}>{labels[status]}</span>;
});

export default LogBookSection;
