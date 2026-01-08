
import React, { useState, useEffect } from 'react';
import { Expense, UserRole, User } from '../types';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell 
} from 'recharts';
import { 
  Receipt, Plus, PieChart, Sparkles, Loader2, Download, 
  Trash2, Edit2, CheckCircle, XCircle, Fuel, Gauge, 
  Zap, Package, HelpCircle, FileText, User as UserIcon
} from 'lucide-react';
import { analyzeExpenses } from '../services/geminiService';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';

const AVERAGE_DIESEL_PRICE = 24.50;

interface ExpenseReportProps {
  expenses: Expense[];
  onAddExpense: (expense: Omit<Expense, 'id' | 'status'>) => void;
  onUpdateExpenseStatus?: (id: string, status: Expense['status']) => void;
  user: User;
}

const ExpenseReport: React.FC<ExpenseReportProps> = ({ expenses, onAddExpense, onUpdateExpenseStatus, user }) => {
  const [showForm, setShowForm] = useState(false);
  const [loadingAI, setLoadingAI] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const isAdmin = user.role === UserRole.ADMIN;

  const [formData, setFormData] = useState({
    category: 'fuel' as Expense['category'],
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    unitPrice: '',
    dieselLiters: '',
    odometer: '',
    tripId: 'T-001'
  });

  const [performance, setPerformance] = useState<number | null>(null);

  useEffect(() => {
    if (formData.category === 'fuel' && formData.dieselLiters && formData.odometer) {
      const liters = parseFloat(formData.dieselLiters);
      const odo = parseFloat(formData.odometer);
      if (liters > 0) {
        const calculated = (odo / 1000) / (liters / 50); 
        setPerformance(parseFloat(calculated.toFixed(2)));
      }
    } else {
      setPerformance(null);
    }
  }, [formData.dieselLiters, formData.odometer, formData.category]);

  const handleAudit = async () => {
    if (expenses.length === 0) return;
    setLoadingAI(true);
    const analysis = await analyzeExpenses(expenses);
    setAiAnalysis(analysis || null);
    setLoadingAI(false);
  };

  const handleFuelAutoCalculation = (field: 'amount' | 'liters' | 'unitPrice', value: string) => {
    const numValue = parseFloat(value);
    if (formData.category !== 'fuel' || isNaN(numValue)) return;

    if (field === 'liters') {
      const unitPrice = parseFloat(formData.unitPrice) || AVERAGE_DIESEL_PRICE;
      setFormData(prev => ({
        ...prev,
        dieselLiters: value,
        amount: (numValue * unitPrice).toFixed(2),
        unitPrice: unitPrice.toString()
      }));
    } else if (field === 'amount') {
      const unitPrice = parseFloat(formData.unitPrice) || AVERAGE_DIESEL_PRICE;
      setFormData(prev => ({
        ...prev,
        amount: value,
        dieselLiters: (numValue / unitPrice).toFixed(2),
        unitPrice: unitPrice.toString()
      }));
    } else if (field === 'unitPrice') {
      const liters = parseFloat(formData.dieselLiters);
      if (!isNaN(liters) && liters > 0) {
        setFormData(prev => ({
          ...prev,
          unitPrice: value,
          amount: (liters * numValue).toFixed(2)
        }));
      } else {
        setFormData(prev => ({ ...prev, unitPrice: value }));
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddExpense({
      ...formData,
      amount: parseFloat(formData.amount),
      unitPrice: formData.unitPrice ? parseFloat(formData.unitPrice) : undefined,
      dieselLiters: formData.dieselLiters ? parseFloat(formData.dieselLiters) : undefined,
      odometer: formData.odometer ? parseFloat(formData.odometer) : undefined,
      performance: performance || undefined,
      operatorId: user.id,
      operatorName: user.name
    });
    setFormData({ 
      category: 'fuel', amount: '', description: '', 
      date: new Date().toISOString().split('T')[0],
      unitPrice: '', dieselLiters: '', odometer: '', tripId: 'T-001'
    });
    setShowForm(false);
  };

  const exportToExcel = () => {
    const data = expenses.map(({ id, ...rest }) => ({
      ID: id,
      Fecha: rest.date,
      Operador: rest.operatorName,
      Categoría: rest.category,
      Monto: rest.amount,
      Estado: rest.status,
      Descripción: rest.description,
      Rendimiento: rest.performance || 'N/A'
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Gastos");
    XLSX.writeFile(wb, "Reporte_Gastos_LogTrack.xlsx");
  };

  const exportToPDF = (exp: Expense) => {
    const doc = new jsPDF();
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, 210, 40, 'F');
    doc.setFontSize(22);
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.text("RECIBO DE GASTO", 105, 20, { align: 'center' });
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("SISTEMA BITÁCORA DE OPERACIONES - CONTROL FINANCIERO", 105, 30, { align: 'center' });
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("INFORMACIÓN GENERAL", 20, 55);
    doc.setDrawColor(226, 232, 240);
    doc.line(20, 57, 190, 57);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`ID Reporte: ${exp.id}`, 20, 65);
    doc.text(`Fecha de Registro: ${exp.date}`, 20, 72);
    doc.text(`Operador: ${exp.operatorName}`, 20, 79);
    doc.text(`Proyecto Asociado: ${exp.tripId}`, 20, 86);
    doc.text(`Estatus: ${exp.status.toUpperCase()}`, 140, 65);
    doc.setFont("helvetica", "bold");
    doc.text("DETALLE DEL CONCEPTO", 20, 100);
    doc.line(20, 102, 190, 102);
    doc.setFont("helvetica", "normal");
    doc.text(`Categoría: ${exp.category.toUpperCase()}`, 20, 110);
    doc.text(`Monto Total:`, 20, 117);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text(`$${exp.amount.toFixed(2)} MXN`, 50, 117);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Descripción:", 20, 127);
    const splitDesc = doc.splitTextToSize(exp.description, 170);
    doc.text(splitDesc, 20, 134);
    if (exp.category === 'fuel') {
      doc.setFont("helvetica", "bold");
      doc.text("MÉTRICAS DE COMBUSTIBLE", 20, 160);
      doc.line(20, 162, 190, 162);
      doc.setFont("helvetica", "normal");
      doc.text(`Litros Cargados: ${exp.dieselLiters} L`, 20, 170);
      doc.text(`Precio por Litro: $${exp.unitPrice}`, 20, 177);
      doc.text(`Odómetro: ${exp.odometer} KM`, 20, 184);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(37, 99, 235);
      doc.text(`RENDIMIENTO CALCULADO: ${exp.performance} KM/L`, 20, 194);
    }
    doc.setTextColor(148, 163, 184);
    doc.setFontSize(8);
    doc.text("Documento generado automáticamente. Válido para comprobación interna.", 105, 280, { align: 'center' });
    doc.save(`Recibo_Gasto_${exp.id}_${exp.date}.pdf`);
  };

  // Prepara datos para la gráfica de gastos por operador
  const getOperatorExpensesData = () => {
    const dataMap: Record<string, number> = {};
    expenses.forEach(exp => {
      const name = exp.operatorName.split(' ')[0];
      dataMap[name] = (dataMap[name] || 0) + exp.amount;
    });
    return Object.keys(dataMap).map(name => ({ name, total: dataMap[name] }));
  };

  const operatorChartData = getOperatorExpensesData();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Control Financiero</h2>
          <p className="text-slate-500 text-sm">Registro detallado de gastos y auditoría.</p>
        </div>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <button 
            onClick={exportToExcel}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all text-sm font-bold"
          >
            <Download size={16} />
            Excel
          </button>
          {isAdmin && (
            <button 
              onClick={handleAudit}
              disabled={loadingAI}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-all text-sm font-bold"
            >
              {loadingAI ? <Loader2 className="animate-spin" size={16} /> : <Sparkles size={16} className="text-amber-400" />}
              IA Audit
            </button>
          )}
          {!isAdmin && (
            <button 
              onClick={() => setShowForm(!showForm)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all text-sm font-bold shadow-lg shadow-blue-200"
            >
              <Plus size={16} />
              Nuevo Gasto
            </button>
          )}
        </div>
      </div>

      {/* Gráfica de Resumen por Operador */}
      {isAdmin && operatorChartData.length > 0 && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-2 mb-6 text-slate-800">
            <UserIcon size={18} className="text-blue-600" />
            <h3 className="font-bold text-sm uppercase tracking-widest">Gastos Totales por Operador</h3>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={operatorChartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }} 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: number) => [`$${value.toLocaleString()}`, 'Total']}
                />
                <Bar dataKey="total" radius={[4, 4, 0, 0]}>
                  {operatorChartData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#3b82f6' : '#6366f1'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {aiAnalysis && (
        <div className="p-5 bg-amber-50 border-2 border-amber-200 rounded-2xl animate-in slide-in-from-top-4">
          <div className="flex items-center gap-2 text-amber-800 font-bold mb-2">
            <PieChart size={18} />
            Auditoría Inteligente de Gastos
          </div>
          <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-line">{aiAnalysis}</p>
        </div>
      )}

      {showForm && !isAdmin && (
        <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-200 animate-in zoom-in duration-300">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Receipt className="text-blue-600" />
              Nuevo Reporte de Gastos
            </h3>
            <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600">
              <XCircle size={24} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Categoría</label>
                <select 
                  className="w-full p-3 bg-slate-100 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none text-slate-900"
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value as any})}
                >
                  <option value="fuel">Combustible (Diesel)</option>
                  <option value="maniobras">Pago de Maniobras</option>
                  <option value="claves">Claves de Tránsito</option>
                  <option value="maintenance">Refacciones / Mantenimiento</option>
                  <option value="tolls">Casetas</option>
                  <option value="food">Alimentos</option>
                  <option value="others">Otros</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Fecha</label>
                <input 
                  type="date"
                  className="w-full p-3 bg-slate-100 border border-slate-200 rounded-xl text-sm text-slate-900 font-medium"
                  value={formData.date}
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Monto Total ($)</label>
                <input 
                  required type="number" step="0.01"
                  className="w-full p-3 bg-slate-100 border border-slate-200 rounded-xl text-sm font-black text-blue-700"
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={(e) => handleFuelAutoCalculation('amount', e.target.value)}
                />
              </div>
            </div>

            {formData.category === 'fuel' && (
              <div className="p-6 bg-blue-50/50 rounded-2xl border border-blue-100 grid grid-cols-1 md:grid-cols-4 gap-4 animate-in fade-in">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-blue-600 uppercase flex items-center gap-1">
                    <Fuel size={12}/> Precio Unitario
                  </label>
                  <input 
                    type="number" step="0.01"
                    className="w-full p-2 bg-slate-100 border border-blue-200 rounded-lg text-sm text-slate-900 font-bold"
                    value={formData.unitPrice}
                    onChange={(e) => handleFuelAutoCalculation('unitPrice', e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-blue-600 uppercase flex items-center gap-1">
                    <Zap size={12}/> Litros Diesel
                  </label>
                  <input 
                    type="number" step="0.01"
                    className="w-full p-2 bg-slate-100 border border-blue-200 rounded-lg text-sm text-slate-900 font-bold"
                    value={formData.dieselLiters}
                    onChange={(e) => handleFuelAutoCalculation('liters', e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-blue-600 uppercase flex items-center gap-1">
                    <Gauge size={12}/> Odómetro (Km)
                  </label>
                  <input 
                    type="number"
                    className="w-full p-2 bg-slate-100 border border-blue-200 rounded-lg text-sm text-slate-900 font-bold"
                    value={formData.odometer}
                    onChange={(e) => setFormData({...formData, odometer: e.target.value})}
                  />
                </div>
                <div className="flex flex-col justify-end">
                  <div className="p-2 bg-white rounded-lg border border-blue-200 flex flex-col items-center">
                    <span className="text-[10px] font-bold text-slate-400">RENDIMIENTO</span>
                    <span className="text-lg font-black text-blue-700">{performance || '0.0'} <small className="text-[10px]">km/L</small></span>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">Descripción / Observaciones</label>
              <textarea 
                required
                className="w-full p-3 bg-slate-100 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px] text-slate-900 font-medium"
                placeholder="Detalla el motivo del gasto o piezas adquiridas..."
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
              />
            </div>

            <div className="flex gap-4">
               <button 
                type="button"
                onClick={() => setShowForm(false)}
                className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-colors"
              >
                Cancelar
              </button>
              <button 
                type="submit"
                className="flex-[2] py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 active:scale-[0.98]"
              >
                Enviar Reporte para Aprobación
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[900px]">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Detalle del Gasto</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Monto</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Rendimiento</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Estado</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {expenses.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic">No hay reportes de gastos registrados.</td></tr>
              ) : (
                expenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${
                          exp.category === 'fuel' ? 'bg-blue-100 text-blue-600' : 
                          exp.category === 'maintenance' ? 'bg-amber-100 text-amber-600' : 
                          'bg-slate-100 text-slate-600'
                        }`}>
                          {exp.category === 'fuel' ? <Fuel size={18}/> : <Receipt size={18}/>}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 leading-tight uppercase text-xs tracking-tighter">{exp.category}</p>
                          <p className="text-sm text-slate-500 leading-tight">{exp.description}</p>
                          <div className="flex gap-2 mt-1">
                             <span className="text-[10px] font-medium text-slate-400">{exp.date}</span>
                             <span className="text-[10px] font-bold text-blue-600">• {exp.operatorName}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-black text-slate-900">${exp.amount.toFixed(2)}</p>
                    </td>
                    <td className="px-6 py-4">
                      {exp.performance ? (
                        <div className="flex items-center gap-1 text-emerald-600">
                          <Zap size={12}/>
                          <span className="text-xs font-bold">{exp.performance} km/L</span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-300">N/A</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <ExpenseStatusBadge status={exp.status} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                        {isAdmin && exp.status === 'pending' && (
                          <>
                            <button 
                              onClick={() => onUpdateExpenseStatus?.(exp.id, 'approved')}
                              className="p-2 text-emerald-500 hover:bg-emerald-50 rounded-lg"
                              title="Aprobar"
                            >
                              <CheckCircle size={18} />
                            </button>
                            <button 
                              onClick={() => onUpdateExpenseStatus?.(exp.id, 'rejected')}
                              className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg"
                              title="Rechazar"
                            >
                              <XCircle size={18} />
                            </button>
                          </>
                        )}
                        <button 
                          onClick={() => exportToPDF(exp)}
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                          title="Exportar Recibo PDF"
                        >
                          <FileText size={18} />
                        </button>
                        {!isAdmin && exp.status === 'pending' && (
                           <button className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg">
                            <Trash2 size={18} />
                           </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const ExpenseStatusBadge = ({ status }: { status: Expense['status'] }) => {
  const styles = {
    pending: 'bg-amber-100 text-amber-700 border-amber-200',
    approved: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    rejected: 'bg-rose-100 text-rose-700 border-rose-200',
  };
  const labels = {
    pending: 'Pendiente',
    approved: 'Aprobado',
    rejected: 'Rechazado',
  };
  return <span className={`px-2 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${styles[status]}`}>{labels[status]}</span>;
};

export default ExpenseReport;
