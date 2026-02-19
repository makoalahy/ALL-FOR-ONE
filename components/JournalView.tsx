
import React, { useState } from 'react';
import { useApp } from '../store';
import { formatCurrency, formatDate, isDateInRange } from '../utils';
import { TradeStatus, TradeType, Trade, View } from '../types';
import Modal from './Modal';
import TradeForm from './TradeForm';

interface JournalViewProps {
  setCurrentView: (view: View) => void;
}

const JournalView: React.FC<JournalViewProps> = ({ setCurrentView }) => {
  const { trades, stats, timeFilter } = useApp();
  const [filter, setFilter] = useState<'All' | 'Winners' | 'Losses'>('All');
  const [showTradeForm, setShowTradeForm] = useState(false);
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);

  const filteredTrades = trades
    .filter(t => isDateInRange(t.date, timeFilter))
    .filter(t => {
      if (filter === 'Winners') return t.status === TradeStatus.WIN;
      if (filter === 'Losses') return t.status === TradeStatus.LOSS;
      return true;
    });

  return (
    <div className="flex flex-col space-y-2">
      <div className="p-4 space-y-6 pb-24">
        <header className="flex flex-col gap-4 mt-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                <span className="material-symbols-outlined font-black">book</span>
              </div>
              <div>
                <h1 className="text-xl font-black tracking-tight text-text-main">Journal</h1>
                <p className="text-[10px] text-text-muted font-black uppercase tracking-widest">Performance Live</p>
              </div>
            </div>
            
            <button 
              onClick={() => setCurrentView('PnLCalendar')}
              className="flex items-center gap-2 px-4 py-2 bg-card border border-border-main rounded-2xl shadow-sm text-text-main hover:border-primary transition-all active:scale-95"
            >
              <span className="material-symbols-outlined text-[20px] text-primary">calendar_month</span>
              <span className="text-[10px] font-black uppercase tracking-widest">P&L Calendar</span>
            </button>
          </div>

          <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-1">
            {['All', 'Winners', 'Losses'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f as any)}
                className={`shrink-0 px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
                  filter === f ? 'bg-primary text-background shadow-md shadow-primary/20' : 'bg-card text-text-muted border border-border-main'
                }`}
              >
                {f === 'All' ? 'Tous' : f === 'Winners' ? 'Gagnants' : 'Pertes'}
              </button>
            ))}
          </div>
        </header>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-card p-4 rounded-3xl shadow-sm border border-border-main">
            <p className="text-text-muted text-[10px] font-black uppercase mb-1 tracking-widest">Profit Total</p>
            <p className={`text-xl font-black ${stats.totalPnL >= 0 ? 'text-primary' : 'text-accent-red'}`}>
              {stats.totalPnL >= 0 ? '+' : ''}{formatCurrency(stats.totalPnL)}
            </p>
          </div>
          <div className="bg-card p-4 rounded-3xl shadow-sm border border-border-main">
            <p className="text-text-muted text-[10px] font-black uppercase mb-1 tracking-widest">Win Rate</p>
            <p className="text-xl font-black text-text-main">{stats.winRate.toFixed(1)}%</p>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          {filteredTrades.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-text-muted opacity-40">
              <span className="material-symbols-outlined text-5xl mb-2">history</span>
              <p className="text-sm font-bold uppercase tracking-widest">Aucun trade trouvé</p>
            </div>
          ) : (
            filteredTrades.map((trade) => (
              <button 
                key={trade.id} 
                onClick={() => setSelectedTrade(trade)}
                className="w-full text-left bg-card rounded-3xl shadow-sm border border-border-main overflow-hidden flex flex-col active:scale-[0.98] transition-all group"
              >
                {trade.image_url && (
                  <div className="w-full h-40 overflow-hidden relative">
                    <img src={trade.image_url} className="w-full h-full object-cover transition-transform group-hover:scale-105" alt="Trade analysis" />
                    <div className="absolute inset-0 bg-black/10"></div>
                  </div>
                )}
                <div className="p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                         <h3 className="text-base font-black text-text-main uppercase tracking-tight">{trade.pair}</h3>
                         <span className={`px-2 py-0.5 text-[8px] font-black rounded-lg uppercase tracking-widest ${trade.type === TradeType.BUY ? 'bg-primary/20 text-primary' : 'bg-accent-red/20 text-accent-red'}`}>
                          {trade.type}
                        </span>
                      </div>
                      <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">{formatDate(trade.date)}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-lg font-black leading-none ${trade.result_usd >= 0 ? 'text-primary' : 'text-accent-red'}`}>
                        {trade.result_usd >= 0 ? '+' : ''}{formatCurrency(trade.result_usd)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-1">
                     <div className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[12px] text-text-muted">equalizer</span>
                        <span className="text-[10px] font-black text-text-muted uppercase">{trade.lot_size.toFixed(2)} L</span>
                     </div>
                     {trade.timeframe && (
                       <div className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-[12px] text-text-muted">schedule</span>
                          <span className="text-[10px] font-black text-text-muted uppercase">{trade.timeframe}</span>
                       </div>
                     )}
                  </div>

                  {trade.notes && (
                    <p className="text-[11px] text-text-muted font-medium bg-background/50 p-3 rounded-xl border border-border-main italic line-clamp-2">
                      "{trade.notes}"
                    </p>
                  )}
                </div>
              </button>
            ))
          )}
        </div>

        <button 
          onClick={() => setShowTradeForm(true)}
          className="fixed bottom-24 right-6 size-14 bg-primary text-background rounded-full shadow-lg shadow-primary/40 flex items-center justify-center z-40 active:scale-90 transition-all"
        >
          <span className="material-symbols-outlined text-2xl font-black">add</span>
        </button>

        {showTradeForm && (
          <Modal onClose={() => setShowTradeForm(false)} title="Nouveau Trade">
            <TradeForm onSuccess={() => setShowTradeForm(false)} />
          </Modal>
        )}

        {selectedTrade && (
          <Modal onClose={() => setSelectedTrade(null)} title="Détails du Trade">
            <TradeDetailView trade={selectedTrade} />
          </Modal>
        )}
      </div>
    </div>
  );
};

export const TradeDetailView: React.FC<{ trade: Trade }> = ({ trade }) => {
  const [zoomed, setZoomed] = useState(false);

  const handleDownload = () => {
    if (!trade.image_url) return;
    const link = document.createElement('a');
    link.href = trade.image_url;
    link.download = `trade-${trade.pair}-${new Date(trade.date).getTime()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-black text-text-main uppercase tracking-tight">{trade.pair}</h2>
            <span className={`px-3 py-1 text-[10px] font-black rounded-xl uppercase tracking-widest ${trade.type === TradeType.BUY ? 'bg-primary text-background' : 'bg-accent-red text-background'}`}>
              {trade.type}
            </span>
          </div>
          <p className="text-xs font-black text-text-muted uppercase tracking-widest">{formatDate(trade.date)}</p>
        </div>
        <div className="text-right">
           <p className={`text-2xl font-black ${trade.result_usd >= 0 ? 'text-primary' : 'text-accent-red'}`}>
             {trade.result_usd >= 0 ? '+' : ''}{formatCurrency(trade.result_usd)}
           </p>
           <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">Résultat Final</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-background p-4 rounded-2xl border border-border-main">
           <p className="text-[9px] font-black text-text-muted uppercase tracking-widest mb-1">Lot Size</p>
           <p className="text-sm font-black text-text-main">{trade.lot_size.toFixed(2)}</p>
        </div>
        <div className="bg-background p-4 rounded-2xl border border-border-main">
           <p className="text-[9px] font-black text-text-muted uppercase tracking-widest mb-1">Timeframe</p>
           <p className="text-sm font-black text-text-main">{trade.timeframe || "N/A"}</p>
        </div>
      </div>

      <div className="bg-slate-900 text-white p-5 rounded-3xl space-y-4 shadow-xl">
        <div className="flex justify-between items-center text-xs">
          <span className="font-black text-slate-500 uppercase tracking-widest">Prix Entrée</span>
          <span className="font-mono font-bold text-slate-300">{trade.entry_price}</span>
        </div>
        <div className="flex justify-between items-center text-xs">
          <span className="font-black text-slate-500 uppercase tracking-widest">Prix Sortie</span>
          <span className="font-mono font-bold text-slate-300">{trade.exit_price}</span>
        </div>
        <div className="h-px bg-slate-800"></div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
             <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Stop Loss</p>
             <p className="text-sm font-mono font-bold text-accent-red">{trade.stop_loss}</p>
          </div>
          <div className="space-y-1 text-right">
             <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Take Profit</p>
             <p className="text-sm font-mono font-bold text-primary">{trade.take_profit}</p>
          </div>
        </div>
      </div>

      {trade.notes && (
        <div className="space-y-2">
          <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">Notes</p>
          <div className="p-4 bg-background rounded-2xl border border-border-main max-h-32 overflow-y-auto">
             <p className="text-sm font-medium text-text-muted italic leading-relaxed">"{trade.notes}"</p>
          </div>
        </div>
      )}

      {trade.image_url && (
        <div className="space-y-3 pb-4">
          <div className="flex justify-between items-center">
             <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">Graphique</p>
             <button onClick={handleDownload} className="text-primary text-[10px] font-black uppercase tracking-widest flex items-center gap-1 hover:underline">
                <span className="material-symbols-outlined text-[14px]">download</span>
             </button>
          </div>
          <div 
            className={`relative rounded-2xl overflow-hidden cursor-zoom-in group border border-border-main ${zoomed ? 'fixed inset-4 z-[110] cursor-zoom-out bg-black/90 flex items-center justify-center p-4' : 'h-48'}`}
            onClick={() => setZoomed(!zoomed)}
          >
            <img src={trade.image_url} className={`w-full h-full object-contain transition-transform duration-300 ${zoomed ? 'scale-100' : 'group-hover:scale-110'}`} alt="Analyse" />
            {zoomed && (
              <button className="absolute top-4 right-4 size-10 bg-white/20 backdrop-blur rounded-full flex items-center justify-center text-white">
                <span className="material-symbols-outlined">close</span>
              </button>
            )}
          </div>
          {zoomed && <div className="fixed inset-0 bg-black/80 z-[105]" onClick={() => setZoomed(false)}></div>}
        </div>
      )}
    </div>
  );
};

export default JournalView;
