
import React, { useState } from 'react';
import { useApp } from '../store';
import { TransactionType, TransactionCategory } from '../types';
import { CATEGORY_STYLES } from './WalletView';

interface TransactionFormProps {
  onSuccess: () => void;
  initialType?: TransactionType;
}

const TransactionForm: React.FC<TransactionFormProps> = ({ onSuccess, initialType }) => {
  const { addTransaction } = useApp();
  const [formData, setFormData] = useState({
    amount: 0,
    type: initialType || TransactionType.INCOME,
    category: (initialType === TransactionType.INCOME ? 'Salaire' : 'Alimentation') as TransactionCategory,
    description: '',
  });

  const incomeCategories: TransactionCategory[] = ['Salaire', 'Freelance', 'Dividendes', 'Vente', 'Cadeau Recu', 'Autre'];
  const expenseCategories: TransactionCategory[] = [
    'Alimentation', 'Transport', 'Abonnement', 'Shopping', 'Loisirs', 
    'Divertissement', 'Factures', 'Cadeau Offert', 'Santé', 'Sport', 
    'Voyages', 'Matériel', 'Formation', 'Autre'
  ];

  const categories = formData.type === TransactionType.INCOME ? incomeCategories : expenseCategories;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.amount <= 0) return;
    
    addTransaction({
      ...formData,
      date: new Date().toISOString()
    });
    onSuccess();
  };

  const inputClass = "w-full bg-background border-none rounded-2xl text-xl font-black text-center py-5 focus:ring-primary shadow-inner placeholder:opacity-20";
  const labelClass = "block text-[10px] font-black text-text-muted uppercase mb-3 tracking-[0.2em] text-center opacity-50";

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Central Amount Input */}
      <div className="space-y-3">
        <label className={labelClass}>Montant de l'opération ($)</label>
        <div className="relative">
            <span className="absolute left-8 top-1/2 -translate-y-1/2 text-2xl font-black text-text-muted opacity-20">$</span>
            <input 
                type="number" 
                name="amount" 
                autoFocus
                value={formData.amount || ''} 
                onChange={(e) => setFormData({...formData, amount: parseFloat(e.target.value) || 0})} 
                className={inputClass} 
                placeholder="0.00"
                autoComplete="off" 
            />
        </div>
      </div>

      {/* Categories Grid */}
      <div className="space-y-4">
        <label className={labelClass}>Choisir une Catégorie</label>
        <div className="grid grid-cols-3 gap-3 max-h-[280px] overflow-y-auto pr-2 hide-scrollbar">
          {categories.map((cat) => {
            const style = CATEGORY_STYLES[cat] || CATEGORY_STYLES['Autre'];
            const isActive = formData.category === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setFormData({...formData, category: cat})}
                className={`flex flex-col items-center justify-center gap-2 p-4 rounded-3xl transition-all border-2 ${
                  isActive 
                    ? `border-primary ${style.bg} scale-105 shadow-md` 
                    : 'border-transparent bg-background text-text-muted hover:bg-slate-50'
                }`}
              >
                <div className={`size-10 rounded-xl flex items-center justify-center ${isActive ? style.color : 'text-text-muted'}`}>
                    <span className="material-symbols-outlined text-2xl">{style.icon}</span>
                </div>
                <span className={`text-[9px] font-black uppercase tracking-tighter text-center leading-tight ${isActive ? 'text-text-main' : 'text-text-muted'}`}>
                    {cat}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Manual Description */}
      <div className="space-y-3">
        <label className={labelClass}>Description Manuelle</label>
        <input 
            name="description" 
            value={formData.description} 
            onChange={(e) => setFormData({...formData, description: e.target.value})} 
            className="w-full bg-background border-none rounded-2xl text-sm font-bold px-6 py-4 focus:ring-primary shadow-inner" 
            placeholder="Ex: McDonald's, Abonnement Netflix..." 
            autoComplete="off" 
        />
      </div>

      <button 
        type="submit" 
        disabled={formData.amount <= 0}
        className={`w-full py-5 text-white font-black rounded-[32px] shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-30 disabled:grayscale ${
            formData.type === TransactionType.INCOME ? 'bg-primary shadow-primary/30' : 'bg-text-main shadow-slate-300'
        }`}
      >
        <span className="material-symbols-outlined text-xl">check_circle</span>
        VALIDER LA TRANSACTION
      </button>
    </form>
  );
};

export default TransactionForm;
