
import React, { useState, useMemo } from 'react';
import { useApp } from '../store';
import { formatCurrency, isDateInRange } from '../utils';
import { TradeStatus, Trade, ObjectiveStatus } from '../types';
import { startOfWeek, endOfWeek, eachDayOfInterval, format, isSameDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import Modal from './Modal';
import TradeForm from './TradeForm';
import AppHeader from './AppHeader';

const DashboardView: React.FC = () => {
  const { stats, trades, timeFilter, setTimeFilter, objectives, settings } = useApp();
  const [showTradeForm, setShowTradeForm] = useState(false);

  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const getDailyPnL = (day: Date) => {
    return trades
      .filter(t => isSameDay(new Date(t.date), day))
      .reduce((acc, t) => acc + t.result_usd, 0);
  };

  const weeklyTrades = trades.filter(t => {
    const d = new Date(t.date);
    return d >= weekStart && d <= weekEnd;
  });
  const weeklyPnL = weeklyTrades.reduce((acc, t) => acc + t.result_usd, 0);

  const nextObjective = useMemo(() => {
    const activeOnes = objectives.filter(o => o.status === ObjectiveStatus.IN_PROGRESS);
    if (activeOnes.length === 0) return null;

    return activeOnes.reduce((prev, current) => {
      const prevPerc = (prev.current_value / prev.target_value);
      const currPerc = (current.current_value / current.target_value);
      return currPerc > prevPerc ? current : prev;
    });
  }, [objectives]);

  return (
    <div className="flex flex-col">
      {/* Insertion du Header Rectangle Dynamique */}
      <AppHeader />

      <div className="p-4 space-y-6">
        <header className="flex justify-between items-center px-1">
          <div className="flex items-center gap-3">
            <div className="size-11 rounded-full border-2 border-white shadow-sm overflow-hidden">
               <img 
                 src={settings.profile.photo} 
                 alt="Avatar" 
                 className="w-full h-full object-cover"
               />
            </div>
            <div>
              <p className="text-[9px] text-text-muted font-black uppercase tracking-widest opacity-60">Session de</p>
              <h1 className="text-base font-black tracking-tight text-text-main truncate max-w-[140px] leading-tight">{settings.profile.name}</h1>
            </div>
          </div>
          <div className="flex gap-1 bg-card p-1 rounded-full border border-border-main">
            {['Week', 'Month', 'All'].map(f => (
              <button
                key={f}
                onClick={() => setTimeFilter(f as any)}
                className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase transition-all ${
                  timeFilter === f ? 'bg-primary text-background shadow-sm' : 'text-text-muted'
                }`}
              >
                {f === 'All' ? 'Full' : f}
              </button>
            ))}
          </div>
        </header>

        {/* Main PnL Card */}
        <div className="relative overflow-hidden rounded-[32px] bg-card p-6 shadow-sm border border-border-main">
          <div className="absolute top-0 right-0 p-4">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${stats.totalPnL >= 0 ? 'bg-primary/10 text-primary' : 'bg-accent-red/10 text-accent-red'}`}>
              <span className="material-symbols-outlined text-[12px] mr-1">{stats.totalPnL >= 0 ? 'trending_up' : 'trending_down'}</span>
              {stats.totalPnL >= 0 ? '+' : ''}{((stats.totalPnL / 10000) * 100).toFixed(1)}%
            </span>
          </div>
          <p className="text-text-muted mb-1 uppercase tracking-widest text-[10px] font-black opacity-50">Performance Totale ({timeFilter})</p>
          <h2 className={`text-4xl font-black tracking-tighter ${stats.totalPnL >= 0 ? 'text-primary' : 'text-accent-red'}`}>
            {stats.totalPnL >= 0 ? '+' : ''}{formatCurrency(stats.totalPnL)}
          </h2>
          <div className="mt-8 h-12 w-full flex items-end gap-1.5 opacity-30">
            {Array.from({ length: 12 }).map((_, i) => (
              <div 
                key={i} 
                className={`flex-1 rounded-t-lg bg-primary transition-all duration-700`}
                style={{ height: `${20 + Math.random() * 80}%` }}
              ></div>
            ))}
          </div>
        </div>

        {/* Featured Goal */}
        {nextObjective && (
          <div className="space-y-3">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted px-1 opacity-60">Objectif Prioritaire</h3>
            <div className="relative group overflow-hidden bg-card rounded-[32px] border border-border-main shadow-sm p-4 flex gap-4 transition-all active:scale-[0.99]">
              <div className="size-20 rounded-2xl overflow-hidden shrink-0">
                <img src={nextObjective.image_url} alt="" className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0 flex flex-col justify-center">
                <div className="flex justify-between items-center mb-1">
                  <h4 className="font-black text-text-main text-xs uppercase tracking-tight">{nextObjective.title}</h4>
                  <span className="text-[9px] font-black text-primary">{((nextObjective.current_value / nextObjective.target_value) * 100).toFixed(0)}%</span>
                </div>
                <div className="h-2 w-full bg-background rounded-full overflow-hidden mb-2">
                    <div 
                      className="h-full bg-primary transition-all duration-1000 ease-out"
                      style={{ width: `${Math.min(100, (nextObjective.current_value / nextObjective.target_value) * 100)}%` }}
                    ></div>
                </div>
                <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider">{formatCurrency(nextObjective.current_value)} accumulés</p>
              </div>
            </div>
          </div>
        )}

        {/* Weekly Summary */}
        <div className="space-y-3">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted px-1 opacity-60">Flux de la Semaine</h3>
          <div className="bg-card rounded-[32px] p-5 shadow-sm border border-border-main">
            <div className="flex justify-between items-center">
              {weekDays.map((day) => {
                const pnl = getDailyPnL(day);
                let colorClass = "bg-slate-50 text-slate-300";
                let icon = "";
                if (pnl > 0) { colorClass = "bg-primary text-white shadow-md shadow-primary/20"; icon = "check"; }
                else if (pnl < 0) { colorClass = "bg-accent-red text-white shadow-md shadow-accent-red/20"; icon = "close"; }

                return (
                  <div key={day.toString()} className="flex flex-col items-center gap-2">
                    <span className="text-[9px] uppercase tracking-wider text-text-muted font-black opacity-40">{format(day, 'EEE', { locale: fr })}</span>
                    <div className={`size-8 rounded-full flex items-center justify-center transition-all ${colorClass}`}>
                      {icon ? <span className="material-symbols-outlined text-xs font-black">{icon}</span> : <span className="text-[8px] font-black">.</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="space-y-3 pb-8">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted px-1 opacity-60">Statistiques de Trading</h3>
          <div className="grid grid-cols-2 gap-3">
            <StatCard icon="analytics" label="Trades" value={trades.filter(t => isDateInRange(t.date, timeFilter)).length.toString()} color="primary" />
            <StatCard icon="stars" label="Win Rate" value={`${stats.winRate.toFixed(1)}%`} color="primary" />
            <StatCard icon="insights" label="Avg R/R" value={`1:${stats.avgRR.toFixed(1)}`} color="primary" />
            <StatCard icon="bolt" label="Profit Factor" value={stats.profitFactor === Infinity ? '∞' : stats.profitFactor.toFixed(2)} color="primary" />
          </div>
        </div>

        <button 
          onClick={() => setShowTradeForm(true)}
          className="fixed bottom-24 right-6 size-14 bg-primary text-background rounded-full shadow-2xl shadow-primary/40 flex items-center justify-center z-40 active:scale-90 transition-all border-4 border-white"
        >
          <span className="material-symbols-outlined text-3xl font-black">add</span>
        </button>

        {showTradeForm && (
          <Modal onClose={() => setShowTradeForm(false)} title="Nouveau Trade">
            <TradeForm onSuccess={() => setShowTradeForm(false)} />
          </Modal>
        )}
      </div>
    </div>
  );
};

const StatCard = ({ icon, label, value, color }: { icon: string; label: string; value: string; color: string }) => {
  return (
    <div className="bg-card p-4 rounded-[28px] border border-border-main shadow-sm flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <div className="p-1.5 rounded-xl bg-primary/10 text-primary">
          <span className="material-symbols-outlined text-base font-black">{icon}</span>
        </div>
        <span className="text-[9px] font-black uppercase tracking-widest text-text-muted opacity-60">{label}</span>
      </div>
      <p className="text-xl font-black text-text-main tracking-tight">{value}</p>
    </div>
  );
};

export default DashboardView;
