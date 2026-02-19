
import React, { useState } from 'react';
import { useApp } from '../store';
import { formatCurrency } from '../utils';
import { ObjectiveStatus, ObjectiveType, Objective } from '../types';
import Modal from './Modal';
import ObjectiveForm from './ObjectiveForm';

const ObjectiveView: React.FC = () => {
  const { objectives, updatePersonalObjective, depositToObjective } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [selectedObjective, setSelectedObjective] = useState<Objective | null>(null);

  return (
    <div className="p-4 space-y-6">
      <header className="flex flex-col gap-1 mt-2">
        <h1 className="text-2xl font-black tracking-tight text-slate-900">Mes Objectifs</h1>
        <p className="text-sm text-slate-500 font-medium">Suivez vos paliers financiers et performances.</p>
      </header>

      {objectives.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 border-2 border-dashed border-slate-200 text-center flex flex-col items-center gap-4">
          <div className="size-16 rounded-full bg-slate-50 flex items-center justify-center text-slate-300">
            <span className="material-symbols-outlined text-4xl">flag</span>
          </div>
          <p className="text-slate-500 font-bold">Aucun objectif actif</p>
          <button onClick={() => setShowForm(true)} className="text-primary font-black uppercase text-xs tracking-widest hover:underline">
            Créer mon premier objectif
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 pb-24">
          {objectives.map((obj) => (
            <ObjectiveCard 
              key={obj.id} 
              objective={obj} 
              onUpdateManual={(val) => updatePersonalObjective(obj.id, val)} 
              onClick={() => setSelectedObjective(obj)}
            />
          ))}
        </div>
      )}

      <button 
        onClick={() => setShowForm(true)}
        className="fixed bottom-24 right-6 size-14 bg-primary text-white rounded-full shadow-lg shadow-primary/40 flex items-center justify-center z-40 active:scale-90 transition-all"
      >
        <span className="material-symbols-outlined text-2xl font-black">add</span>
      </button>

      {showForm && (
        <Modal onClose={() => setShowForm(false)} title="Nouvel Objectif">
          <ObjectiveForm onSuccess={() => setShowForm(false)} />
        </Modal>
      )}

      {selectedObjective && (
        <Modal onClose={() => setSelectedObjective(null)} title="Détails de l'Objectif">
          <ObjectiveDetailModal 
            objective={selectedObjective} 
            onDeposit={(amount) => {
              depositToObjective(selectedObjective.id, amount);
              setSelectedObjective(null);
            }} 
          />
        </Modal>
      )}
    </div>
  );
};

const ObjectiveCard: React.FC<{ objective: Objective; onUpdateManual: (val: number) => void; onClick: () => void }> = ({ objective, onUpdateManual, onClick }) => {
  const isCompleted = objective.status === ObjectiveStatus.COMPLETED;
  const progressPercent = Math.min(100, Math.max(0, (objective.current_value / objective.target_value) * 100));
  
  const displayValue = objective.type === ObjectiveType.PERFORMANCE 
    ? `${objective.current_value.toFixed(1)}% / ${objective.target_value}%`
    : `${formatCurrency(objective.current_value)} / ${formatCurrency(objective.target_value)}`;

  return (
    <button 
      onClick={onClick}
      className={`relative group w-full text-left bg-white rounded-3xl overflow-hidden border transition-all duration-300 active:scale-[0.98] ${isCompleted ? 'border-primary/40 shadow-xl shadow-primary/5' : 'border-slate-100 shadow-sm'}`}
    >
      <div className="h-40 w-full relative overflow-hidden">
        <img src={objective.image_url} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt={objective.title} />
        <div className={`absolute inset-0 bg-gradient-to-t ${isCompleted ? 'from-primary/90' : 'from-slate-900/80'} to-transparent`}></div>
        
        <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
          <div>
            <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider mb-2 ${isCompleted ? 'bg-white text-primary' : 'bg-primary text-white'}`}>
              <span className="material-symbols-outlined text-[11px] filled">{isCompleted ? 'verified' : 'bolt'}</span>
              {objective.type}
            </div>
            <h3 className="text-white text-xl font-black tracking-tight">{objective.title}</h3>
          </div>
          {isCompleted && (
            <div className="size-10 bg-white rounded-full flex items-center justify-center text-primary shadow-lg animate-bounce">
              <span className="material-symbols-outlined font-black">check</span>
            </div>
          )}
        </div>
      </div>

      <div className="p-6 space-y-4">
        <div className="flex justify-between items-end">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Progression</p>
            <p className={`text-lg font-black ${isCompleted ? 'text-primary' : 'text-slate-900'}`}>{displayValue}</p>
          </div>
          <p className="text-2xl font-black text-slate-900">{progressPercent.toFixed(0)}%</p>
        </div>

        <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden p-0.5">
          <div 
            className={`h-full rounded-full transition-all duration-1000 ${isCompleted ? 'bg-primary shadow-[0_0_10px_rgba(16,183,127,0.5)]' : 'bg-primary'}`}
            style={{ width: `${progressPercent}%` }}
          ></div>
        </div>

        <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase pt-2 border-t border-slate-50">
          <span>{new Date(objective.start_date).toLocaleDateString()}</span>
          <span>Échéance: {new Date(objective.end_date).toLocaleDateString()}</span>
        </div>
      </div>
      
      {isCompleted && (
        <div className="absolute top-4 left-4">
          <div className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-white text-[10px] font-black uppercase tracking-widest">
            Objectif Atteint !
          </div>
        </div>
      )}
    </button>
  );
};

const ObjectiveDetailModal: React.FC<{ objective: Objective; onDeposit: (amount: number) => void }> = ({ objective, onDeposit }) => {
  const [amount, setAmount] = useState<number>(0);
  const progressPercent = Math.min(100, Math.max(0, (objective.current_value / objective.target_value) * 100));
  const isCompleted = objective.status === ObjectiveStatus.COMPLETED;

  return (
    <div className="space-y-6">
      <div className="h-48 rounded-2xl overflow-hidden relative">
        <img src={objective.image_url} className="w-full h-full object-cover" alt="" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent"></div>
        <div className="absolute bottom-4 left-4">
           <h3 className="text-white text-2xl font-black">{objective.title}</h3>
           <p className="text-slate-300 text-sm font-medium">{objective.description || "Aucune description"}</p>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between items-end">
          <span className="text-xs font-black uppercase text-slate-400 tracking-widest">Progression Actuelle</span>
          <span className="text-xl font-black text-primary">{progressPercent.toFixed(1)}%</span>
        </div>
        <div className="h-4 w-full bg-slate-100 rounded-full p-1">
          <div 
            className="h-full bg-primary rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          ></div>
        </div>
        <div className="flex justify-between text-[11px] font-bold text-slate-400">
          <span>{formatCurrency(objective.current_value)}</span>
          <span>Cible: {formatCurrency(objective.target_value)}</span>
        </div>
      </div>

      {!isCompleted && (
        <div className="bg-slate-50 p-6 rounded-3xl space-y-4">
          <label className="block text-xs font-black text-slate-400 uppercase tracking-widest text-center">Ajouter des fonds</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-black text-slate-300">$</span>
            <input 
              type="number" 
              value={amount || ''} 
              onChange={(e) => setAmount(Math.max(0, parseFloat(e.target.value) || 0))}
              className="w-full pl-10 pr-4 py-4 bg-white border-none rounded-2xl text-2xl font-black text-center focus:ring-primary"
              placeholder="0.00"
            />
          </div>
          <button 
            disabled={amount <= 0}
            onClick={() => onDeposit(amount)}
            className="w-full py-4 bg-primary text-white font-black rounded-2xl shadow-lg shadow-primary/20 transition-all hover:brightness-110 active:scale-95 disabled:opacity-50 disabled:grayscale"
          >
            Déposer maintenant
          </button>
          <p className="text-[10px] text-center text-slate-400 font-bold uppercase tracking-wider">
            L'argent sera déduit de votre Wallet
          </p>
        </div>
      )}

      {isCompleted && (
        <div className="bg-primary/10 border border-primary/20 p-6 rounded-3xl text-center">
          <span className="material-symbols-outlined text-primary text-4xl mb-2 filled">stars</span>
          <p className="text-primary font-black uppercase tracking-tight">Félicitations ! Objectif atteint.</p>
          {objective.current_value > objective.target_value && (
            <p className="text-[10px] text-primary/70 font-bold mt-1">
              Excédent: {formatCurrency(objective.current_value - objective.target_value)}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default ObjectiveView;
