
import React, { useState, useRef } from 'react';
import { useApp } from '../store';
import { TradeType } from '../types';

interface TradeFormProps {
  onSuccess: () => void;
}

const TradeForm: React.FC<TradeFormProps> = ({ onSuccess }) => {
  const { addTrade } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    pair: 'USDJPY',
    type: TradeType.BUY,
    lot_size: 0.01,
    entry_price: 150.00,
    exit_price: 150.50,
    stop_loss: 149.50,
    take_profit: 151.50,
    timeframe: 'M15',
    notes: '',
    image_url: ''
  });

  const [customPair, setCustomPair] = useState('');
  const [isCustomPair, setIsCustomPair] = useState(false);

  const pairs = ['USDJPY', 'GOLD', 'BTCUSDT'];
  const timeframes = ['M1', 'M5', 'M15'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addTrade({
      ...formData,
      pair: isCustomPair ? customPair : formData.pair,
      date: new Date().toISOString()
    });
    onSuccess();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: (name === 'pair' || name === 'type' || name === 'timeframe' || name === 'notes' || name === 'image_url') ? value : parseFloat(value) || 0
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

  const inputClass = "w-full bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-primary transition-colors shadow-none appearance-none";
  const labelClass = "block text-xs font-black text-slate-400 uppercase mb-1.5 tracking-widest";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Pair Selection */}
      <div>
        <label className={labelClass}>Instrument</label>
        <div className="grid grid-cols-4 gap-2 mb-2">
          {pairs.map(p => (
            <button
              key={p}
              type="button"
              onClick={() => { setIsCustomPair(false); setFormData(p2 => ({ ...p2, pair: p })); }}
              className={`py-2 text-[10px] font-black rounded-xl border transition-all ${!isCustomPair && formData.pair === p ? 'bg-primary border-primary text-white' : 'bg-white border-slate-100 text-slate-500'}`}
            >
              {p}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setIsCustomPair(true)}
            className={`py-2 text-[10px] font-black rounded-xl border transition-all ${isCustomPair ? 'bg-primary border-primary text-white' : 'bg-white border-slate-100 text-slate-500'}`}
          >
            AUTRE
          </button>
        </div>
        {isCustomPair && (
          <input 
            placeholder="Ex: EURUSD" 
            value={customPair} 
            onChange={(e) => setCustomPair(e.target.value.toUpperCase())}
            className={inputClass}
            autoComplete="off"
          />
        )}
      </div>

      {/* Type Selection */}
      <div className="grid grid-cols-2 gap-4">
        <button
          type="button"
          onClick={() => setFormData(p => ({ ...p, type: TradeType.BUY }))}
          className={`py-4 rounded-2xl font-black text-sm transition-all border-2 ${formData.type === TradeType.BUY ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20' : 'bg-white border-slate-50 text-primary opacity-60'}`}
        >
          BUY
        </button>
        <button
          type="button"
          onClick={() => setFormData(p => ({ ...p, type: TradeType.SELL }))}
          className={`py-4 rounded-2xl font-black text-sm transition-all border-2 ${formData.type === TradeType.SELL ? 'bg-accent-red border-accent-red text-white shadow-lg shadow-accent-red/20' : 'bg-white border-slate-50 text-accent-red opacity-60'}`}
        >
          SELL
        </button>
      </div>

      {/* Lot Size & Entry Price */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Lot Size</label>
          <input type="number" step="0.01" min="0.01" name="lot_size" value={formData.lot_size} onChange={handleChange} className={inputClass} autoComplete="off" />
        </div>
        <div>
          <label className={labelClass}>Entry Price</label>
          <input type="number" step="0.0001" name="entry_price" value={formData.entry_price} onChange={handleChange} className={inputClass} autoComplete="off" />
        </div>
      </div>

      {/* Exit & SL/TP */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Exit Price</label>
          <input type="number" step="0.0001" name="exit_price" value={formData.exit_price} onChange={handleChange} className={inputClass} autoComplete="off" />
        </div>
        <div>
          <label className={labelClass}>Stop Loss</label>
          <input type="number" step="0.0001" name="stop_loss" value={formData.stop_loss} onChange={handleChange} className={inputClass} autoComplete="off" />
        </div>
      </div>

      <div>
        <label className={labelClass}>Take Profit</label>
        <input type="number" step="0.0001" name="take_profit" value={formData.take_profit} onChange={handleChange} className={inputClass} autoComplete="off" />
      </div>

      {/* Timeframe */}
      <div>
        <label className={labelClass}>Timeframe</label>
        <div className="flex gap-2">
          {timeframes.map(tf => (
            <button
              key={tf}
              type="button"
              onClick={() => setFormData(p => ({ ...p, timeframe: tf }))}
              className={`flex-1 py-2 text-[11px] font-black rounded-xl border transition-all ${formData.timeframe === tf ? 'bg-slate-900 text-white border-slate-900' : 'bg-white border-slate-100 text-slate-500'}`}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      {/* Image Upload */}
      <div>
        <label className={labelClass}>Capture d'écran</label>
        <div 
          onClick={() => fileInputRef.current?.click()}
          className="w-full h-32 border-2 border-dashed border-slate-100 rounded-2xl flex flex-col items-center justify-center gap-2 cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors overflow-hidden"
        >
          {formData.image_url ? (
            <img src={formData.image_url} className="w-full h-full object-cover" alt="Preview" />
          ) : (
            <>
              <span className="material-symbols-outlined text-slate-300">add_a_photo</span>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Importer image</span>
            </>
          )}
        </div>
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
      </div>

      {/* Notes */}
      <div>
        <label className={labelClass}>Notes</label>
        <textarea 
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          rows={3}
          placeholder="Détails de l'analyse..."
          className={`${inputClass} resize-none py-3 px-4`}
          autoComplete="off"
        />
      </div>

      <button type="submit" className="w-full py-4 bg-primary text-white font-black rounded-2xl shadow-lg shadow-primary/20 transition-all hover:brightness-110 active:scale-95">
        Enregistrer le Trade
      </button>
    </form>
  );
};

export default TradeForm;
