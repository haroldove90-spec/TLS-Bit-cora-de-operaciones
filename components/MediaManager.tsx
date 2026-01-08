
import React, { useState, useRef } from 'react';
import { AppMedia, User, UserRole } from '../types';
import { 
  Image as ImageIcon, 
  Upload, 
  Trash2, 
  Download, 
  Plus, 
  X, 
  Camera, 
  CheckCircle2,
  Loader2,
  Maximize2,
  Eye
} from 'lucide-react';

interface MediaManagerProps {
  media: AppMedia[];
  onUpload: (fileData: Omit<AppMedia, 'id' | 'timestamp'>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  user: User;
}

const MediaManager: React.FC<MediaManagerProps> = ({ media, onUpload, onDelete, user }) => {
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState<AppMedia | null>(null);
  const [filter, setFilter] = useState<string>('todos');
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    category: 'evidencia' as AppMedia['category']
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
        if (!formData.name) setFormData(prev => ({ ...prev, name: file.name }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!preview) return;

    setIsUploading(true);
    try {
      await onUpload({
        url: preview,
        name: formData.name || 'Archivo sin nombre',
        category: formData.category,
        uploader_id: user.id,
        uploader_name: user.name
      });
      setShowUploadModal(false);
      setPreview(null);
      setFormData({ name: '', category: 'evidencia' });
    } catch (error) {
      alert("Error al subir archivo");
    } finally {
      setIsUploading(false);
    }
  };

  const filteredMedia = media.filter(m => 
    filter === 'todos' || m.category === filter
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Centro de Medios</h2>
          <p className="text-slate-500 font-medium text-sm italic">Gestión de evidencias fotográficas y documentación.</p>
        </div>
        <button 
          onClick={() => setShowUploadModal(true)}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 active:scale-95"
        >
          <Plus size={18} />
          Nuevo Archivo
        </button>
      </header>

      {/* Filtros Estéticos */}
      <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
        {['todos', 'evidencia', 'unidad', 'documento', 'otros'].map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border-2 ${
              filter === cat 
              ? 'bg-slate-900 text-white border-slate-900 shadow-lg shadow-slate-200' 
              : 'bg-white text-slate-500 border-slate-100 hover:border-slate-300'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Grid de Medios con Efectos */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {filteredMedia.length === 0 ? (
          <div className="col-span-full py-24 text-center bg-white rounded-[2rem] border-2 border-dashed border-slate-200">
            <ImageIcon className="mx-auto text-slate-200 mb-4" size={56} />
            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No hay archivos registrados.</p>
          </div>
        ) : (
          filteredMedia.map((m) => (
            <div key={m.id} className="group bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-300 relative">
              <div className="aspect-square relative overflow-hidden bg-slate-100">
                <img src={m.url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={m.name} />
                
                {/* Overlay de Acciones */}
                <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3">
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setSelectedImage(m)}
                      className="p-3 bg-white text-slate-900 rounded-2xl hover:bg-blue-600 hover:text-white transition-all transform translate-y-4 group-hover:translate-y-0 duration-300"
                    >
                      <Eye size={20} />
                    </button>
                    <a href={m.url} download={m.name} target="_blank" rel="noreferrer" className="p-3 bg-white text-slate-900 rounded-2xl hover:bg-emerald-600 hover:text-white transition-all transform translate-y-4 group-hover:translate-y-0 duration-300 delay-75">
                      <Download size={20} />
                    </a>
                  </div>
                  {(user.role === UserRole.ADMIN || m.uploader_id === user.id) && (
                    <button 
                      onClick={() => onDelete(m.id)}
                      className="p-3 bg-rose-500 text-white rounded-2xl hover:bg-rose-600 transition-all transform translate-y-4 group-hover:translate-y-0 duration-300 delay-150"
                    >
                      <Trash2 size={20} />
                    </button>
                  )}
                </div>
              </div>
              
              <div className="p-4 space-y-1 bg-white">
                <p className="text-[10px] font-black text-slate-800 truncate uppercase tracking-tighter">{m.name}</p>
                <div className="flex justify-between items-center">
                  <span className="text-[8px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg uppercase tracking-widest">{m.category}</span>
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{m.uploader_name.split(' ')[0]}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal de Carga con Previsualización */}
      {showUploadModal && (
        <div className="fixed inset-0 z-[200] bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <header className="bg-slate-900 p-8 flex justify-between items-center text-white">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-600 rounded-2xl shadow-lg shadow-blue-500/20">
                  <Upload size={24} />
                </div>
                <div>
                  <h3 className="font-black text-lg uppercase tracking-widest">Subir Imagen</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Captura o selecciona archivo</p>
                </div>
              </div>
              <button onClick={() => setShowUploadModal(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <X size={24} />
              </button>
            </header>

            <form onSubmit={handleUploadSubmit} className="p-8 space-y-6">
              <div 
                onClick={() => fileInputRef.current?.click()}
                className={`aspect-video rounded-3xl border-4 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all ${preview ? 'border-blue-500 bg-blue-50/50' : 'border-slate-100 bg-slate-50 hover:border-blue-300'}`}
              >
                {preview ? (
                  <div className="relative w-full h-full p-2">
                    <img src={preview} className="w-full h-full object-cover rounded-2xl shadow-lg" alt="Previsualización" />
                    <button 
                      type="button" 
                      onClick={(e) => { e.stopPropagation(); setPreview(null); }}
                      className="absolute top-4 right-4 p-2 bg-rose-600 text-white rounded-full shadow-lg"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mb-4 animate-bounce">
                      <Camera size={40} />
                    </div>
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest text-center">Toca para subir o tomar foto</p>
                    <p className="text-[10px] text-slate-300 mt-2 font-medium">JPEG, PNG hasta 5MB</p>
                  </>
                )}
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Título / Descripción</label>
                  <input 
                    required
                    type="text"
                    placeholder="Ej. Evidencia Carga Monterrey"
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Categoría</label>
                  <select 
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none appearance-none transition-all"
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value as any})}
                  >
                    <option value="evidencia">Evidencia de Operación</option>
                    <option value="unidad">Unidad / Tractocamión</option>
                    <option value="documento">Factura / Carta Porte</option>
                    <option value="otros">Misceláneos</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={isUploading || !preview}
                className="w-full py-5 bg-slate-900 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-2xl hover:bg-slate-800 disabled:opacity-50 transition-all flex items-center justify-center gap-3 active:scale-95"
              >
                {isUploading ? <Loader2 className="animate-spin" size={20} /> : <CheckCircle2 size={20} />}
                {isUploading ? 'Procesando Archivo...' : 'Confirmar y Guardar'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Visor Lightbox */}
      {selectedImage && (
        <div className="fixed inset-0 z-[250] bg-slate-900/95 backdrop-blur-xl flex flex-col items-center justify-center p-4 md:p-12 animate-in fade-in duration-300">
          <div className="absolute top-6 right-6 flex gap-4">
            <a href={selectedImage.url} download={selectedImage.name} className="p-4 bg-white/10 text-white rounded-full hover:bg-emerald-600 transition-all backdrop-blur-md">
              <Download size={24} />
            </a>
            <button onClick={() => setSelectedImage(null)} className="p-4 bg-white/10 text-white rounded-full hover:bg-rose-600 transition-all backdrop-blur-md">
              <X size={24} />
            </button>
          </div>
          
          <div className="w-full max-w-5xl h-full flex flex-col items-center justify-center gap-6">
            <div className="flex-1 w-full relative group">
              <img src={selectedImage.url} className="w-full h-full object-contain drop-shadow-2xl" alt={selectedImage.name} />
            </div>
            
            <div className="bg-white/10 backdrop-blur-md p-6 rounded-3xl border border-white/20 w-full max-w-2xl text-center">
              <h4 className="text-white font-black text-lg uppercase tracking-widest">{selectedImage.name}</h4>
              <div className="flex justify-center gap-6 mt-2">
                <span className="text-blue-400 font-black text-[10px] uppercase tracking-widest">Cat: {selectedImage.category}</span>
                <span className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">Subido por: {selectedImage.uploader_name}</span>
                <span className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">{new Date(selectedImage.timestamp).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MediaManager;
