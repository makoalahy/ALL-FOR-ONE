
import React, { useState } from 'react';
import { useApp } from '../store';
import { ObjectiveType } from '../types';

interface ObjectiveFormProps {
  onSuccess: () => void;
}

const ObjectiveForm: React.FC<ObjectiveFormProps> = ({ onSuccess }) => {
  const { addObjective } = useApp();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    target_value: 1000,
    type: ObjectiveType.FINANCIAL,
    image_url: 'https://images.unsplash.com/photo-1611974714658-66d1456070bd?q=80&w=400',
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date(new Date().getFullYear(), 11, 31).toISOString().split('T')[0],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addObjective({
      ...formData,
      start_date: new Date(formData.start_date).toISOString(),
      end_date: new Date(formData.end_date).toISOString(),
    });
    onSuccess();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'target_value' ? parseFloat(value) || 0 : value
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, image_url: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-100 rounded-2xl p-4 bg-slate-50 relative overflow-hidden group cursor-pointer">
        {formData.image_url ? (
          <img src={formData.image_url} className="absolute inset-0 w-full h-full object-cover opacity-30 group-hover:opacity-50 transition-opacity" alt="Preview" />
        ) : null}
        <span className="material-symbols-outlined text-3xl text-slate-300 relative z-10">image</span>
        <span className="text-xs font-bold text-slate-400 relative z-10 mt-2">Cliquez pour choisir une image</span>
        <input type="file" accept="image/*" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer z-20" />
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-400 uppercase mb-1 tracking-wider">Titre</label>
        <input name="title" value={formData.title} onChange={handleChange} required placeholder="Ex: Macbook Pro M3" className="w-full bg-slate-50 border-none rounded-xl text-sm font-bold focus:ring-primary" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase mb-1 tracking-wider">Type</label>
          <select name="type" value={formData.type} onChange={handleChange} className="w-full bg-slate-50 border-none rounded-xl text-sm font-bold focus:ring-primary">
            <option value={ObjectiveType.FINANCIAL}>Financier (Trades)</option>
            <option value={ObjectiveType.PERFORMANCE}>Performance (Win Rate)</option>
            <option value={ObjectiveType.PERSONAL}>Personnel (Manuel)</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase mb-1 tracking-wider">Objectif Cible</label>
          <input type="number" name="target_value" value={formData.target_value} onChange={handleChange} className="w-full bg-slate-50 border-none rounded-xl text-sm font-bold focus:ring-primary" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase mb-1 tracking-wider">Début</label>
          <input type="date" name="start_date" value={formData.start_date} onChange={handleChange} className="w-full bg-slate-50 border-none rounded-xl text-sm font-bold focus:ring-primary" />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase mb-1 tracking-wider">Échéance</label>
          <input type="date" name="end_date" value={formData.end_date} onChange={handleChange} className="w-full bg-slate-50 border-none rounded-xl text-sm font-bold focus:ring-primary" />
        </div>
      </div>

      <button type="submit" className="w-full py-4 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 transition-all hover:brightness-110 active:scale-95">
        Créer l'Objectif
      </button>
    </form>
  );
};

export default ObjectiveForm;
