
import React, { useState, useMemo } from 'react';
import { useApp } from '../store';
import { formatCurrency } from '../utils';
import { Trade, TradeType, View, TradeStatus } from '../types';
import { 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  format, 
  isSameDay, 
  addMonths, 
  subMonths,
  isSameMonth,
  startOfYear,
  eachMonthOfInterval,
  isSameWeek,
  eachWeekOfInterval
} from 'date-fns';
import { fr } from 'date-fns/locale';
import Modal from './Modal';
import { TradeDetailView } from './JournalView';

interface PnLCalendarViewProps {
  setCurrentView: (view: View) => void;
}

type Tab = 'Trades' | 'Stats';
type PerfTab = 'Daily' | 'Weekly' | 'Monthly';

const PnLCalendarView: React.FC<PnLCalendarViewProps> = ({ setCurrentView }) => {
  const { trades } = useApp();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(new Date());
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('Trades');
  const [perfTab, setPerfTab] = useState<PerfTab>('Daily');

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

  const calendarDays = eachDayOfInterval({
    start: calendarStart,
    end: calendarEnd,
  });

  const getDayTrades = (day: Date) => {
    return trades.filter(t => isSameDay(new Date(t.date), day));
  };

  const getDayPnL = (day: Date) => {
    const dayTrades = getDayTrades(day);
    return dayTrades.reduce((acc, t) => acc + t.result_usd, 0);
  };

  const tradesForSelectedDay = useMemo(() => {
    if (!selectedDay) return [];
    return getDayTrades(selectedDay);
  }, [selectedDay, trades]);

  const selectedDayPnL = useMemo(() => {
    if (!selectedDay) return 0;
    return getDayPnL(selectedDay);
  }, [selectedDay, trades]);

  const monthlyStats = useMemo(() => {
    const monthTrades = trades.filter(t => isSameMonth(new Date(t.date), currentMonth));
    const totalTrades = monthTrades.length;
    const wins = monthTrades.filter(t => t.status === TradeStatus.WIN).length;
    const grossProfit = monthTrades.reduce((acc, t) => t.result_usd > 0 ? acc + t.result_usd : acc, 0);
    const grossLoss = monthTrades.reduce((acc, t) => t.result_usd < 0 ? acc + t.result_usd : acc, 0);
    const netPnL = grossProfit + grossLoss;
    const winRate = totalTrades > 0 ? (wins / totalTrades) * 100 : 0;

    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
    let profitableDays = 0;
    let negativeDays = 0;
    daysInMonth.forEach(day => {
      const pnl = getDayPnL(day);
      if (pnl > 0) profitableDays++;
      else if (pnl < 0) negativeDays++;
    });

    return {
      totalTrades,
      wins,
      grossProfit,
      grossLoss,
      netPnL,
      winRate,
      profitableDays,
      negativeDays
    };
  }, [currentMonth, trades]);

  const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  // --- Graph Logic ---
  const graphData = useMemo(() => {
    if (perfTab === 'Daily') {
      const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
      let cumulative = 0;
      return days.map(day => {
        cumulative += getDayPnL(day);
        return { label: format(day, 'd'), value: cumulative };
      });
    } else if (perfTab === 'Weekly') {
      const startOfYr = startOfYear(currentMonth);
      const weeks = eachWeekOfInterval({ start: startOfYr, end: monthEnd }, { weekStartsOn: 1 });
      let cumulative = 0;
      return weeks.map((week, idx) => {
        const weekPnL = trades
          .filter(t => isSameWeek(new Date(t.date), week, { weekStartsOn: 1 }))
          .reduce((acc, t) => acc + t.result_usd, 0);
        cumulative += weekPnL;
        return { label: `W${idx + 1}`, value: cumulative };
      });
    } else {
      const startOfYr = startOfYear(currentMonth);
      const months = eachMonthOfInterval({ start: startOfYr, end: monthEnd });
      let cumulative = 0;
      return months.map(m => {
        const monthPnL = trades
          .filter(t => isSameMonth(new Date(t.date), m))
          .reduce((acc, t) => acc + t.result_usd, 0);
        cumulative += monthPnL;
        return { label: format(m, 'MMM', { locale: fr }), value: cumulative };
      });
    }
  }, [perfTab, currentMonth, trades]);

  return (
    <div className="p-4 space-y-8 pb-24 max-w-md mx-auto min-h-screen bg-background">
      {/* Header Minimal */}
      <header className="flex items-center justify-between pt-2">
        <button 
          onClick={() => setCurrentView('Journal')}
          className="size-10 flex items-center justify-center text-text-muted active:opacity-50 transition-opacity"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 className="text-sm font-black uppercase tracking-[0.2em] text-text-main">P&L Calendar</h1>
        <div className="size-10"></div> {/* Spacer */}
      </header>

      {/* Calendrier Ultra Minimal */}
      <div className="space-y-6">
        <div className="flex justify-between items-center px-2">
           <button onClick={handlePrevMonth} className="text-text-muted hover:text-text-main">
              <span className="material-symbols-outlined text-lg">chevron_left</span>
           </button>
           <h2 className="text-xs font-black uppercase tracking-widest text-text-main">
             {format(currentMonth, 'MMMM yyyy', { locale: fr })}
           </h2>
           <button onClick={handleNextMonth} className="text-text-muted hover:text-text-main">
              <span className="material-symbols-outlined text-lg">chevron_right</span>
           </button>
        </div>

        <div className="grid grid-cols-7 gap-1">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
            <div key={i} className="text-center text-[10px] font-black text-text-muted uppercase opacity-30 pb-2">
              {d}
            </div>
          ))}
          
          {calendarDays.map((day) => {
            const dayPnL = getDayPnL(day);
            const tradesCount = getDayTrades(day).length;
            const isCurrentMonth = isSameMonth(day, monthStart);
            
            let tileBg = "bg-[#f3f4f6]";
            let textColor = "text-[#374151]";

            if (isCurrentMonth && tradesCount > 0) {
               if (dayPnL > 0) {
                  tileBg = "bg-[#22c55e]";
                  textColor = "text-white";
               } else if (dayPnL < 0) {
                  tileBg = "bg-[#ef4444]";
                  textColor = "text-white";
               }
            } else if (!isCurrentMonth) {
               tileBg = "bg-transparent";
               textColor = "text-transparent";
            }

            return (
              <button
                key={day.toString()}
                onClick={() => isCurrentMonth && setSelectedDay(day)}
                disabled={!isCurrentMonth}
                className={`
                  aspect-square rounded-[14px] flex items-center justify-center border-none outline-none ring-0
                  ${tileBg} ${textColor}
                  text-[14px] font-semibold transition-none
                  ${!isCurrentMonth ? 'pointer-events-none' : ''}
                `}
              >
                {format(day, 'd')}
              </button>
            );
          })}
        </div>
      </div>

      {/* Onglets de navigation */}
      <div className="flex justify-center gap-3">
        <button 
          onClick={() => setActiveTab('Trades')}
          className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'Trades' ? 'bg-[#111827] text-white' : 'bg-transparent border border-[#d1d5db] text-text-muted'}`}
        >
          Trades
        </button>
        <button 
          onClick={() => setActiveTab('Stats')}
          className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'Stats' ? 'bg-[#111827] text-white' : 'bg-transparent border border-[#d1d5db] text-text-muted'}`}
        >
          Monthly Statistics
        </button>
      </div>

      {/* Contenu dynamique */}
      <div className="space-y-6 pt-2">
        {activeTab === 'Trades' ? (
          <div className="space-y-4">
            <div className="flex justify-between items-end px-1">
               <div className="space-y-1">
                  <h3 className="text-xs font-black text-text-main uppercase tracking-widest">
                    {selectedDay ? format(selectedDay, 'EEEE d MMMM', { locale: fr }) : 'Jour'}
                  </h3>
                  <p className="text-[10px] text-text-muted font-bold uppercase">
                    {tradesForSelectedDay.length} Trades
                  </p>
               </div>
               {tradesForSelectedDay.length > 0 && (
                 <p className={`text-sm font-black ${selectedDayPnL >= 0 ? 'text-[#22c55e]' : 'text-[#ef4444]'}`}>
                   {selectedDayPnL >= 0 ? '+' : ''}{formatCurrency(selectedDayPnL)}
                 </p>
               )}
            </div>

            <div className="space-y-3">
               {tradesForSelectedDay.length === 0 ? (
                 <div className="py-12 text-center opacity-20">
                    <span className="material-symbols-outlined text-4xl">inventory_2</span>
                    <p className="text-[10px] font-black uppercase mt-2">Vide</p>
                 </div>
               ) : (
                 tradesForSelectedDay.map(trade => (
                   <button 
                    key={trade.id} 
                    onClick={() => setSelectedTrade(trade)}
                    className="w-full bg-card p-4 rounded-3xl border border-border-main flex items-center justify-between active:scale-[0.98] transition-all"
                   >
                      <div className="flex items-center gap-4">
                         <div className={`size-10 rounded-xl flex items-center justify-center font-black text-[9px] uppercase border ${trade.type === TradeType.BUY ? 'bg-primary/5 text-primary border-primary/20' : 'bg-accent-red/5 text-accent-red border-accent-red/20'}`}>
                            {trade.type}
                         </div>
                         <div className="text-left">
                            <p className="text-sm font-black text-text-main uppercase tracking-tight">{trade.pair}</p>
                            <p className="text-[9px] font-bold text-text-muted uppercase opacity-60">{trade.lot_size.toFixed(2)} Lot • {trade.timeframe}</p>
                         </div>
                      </div>
                      <div className="text-right">
                         <p className={`text-sm font-black ${trade.result_usd >= 0 ? 'text-[#22c55e]' : 'text-[#ef4444]'}`}>
                           {trade.result_usd >= 0 ? '+' : ''}{formatCurrency(trade.result_usd)}
                         </p>
                         <p className="text-[8px] font-black text-text-muted uppercase tracking-widest opacity-30">P&L</p>
                      </div>
                   </button>
                 ))
               )}
            </div>
          </div>
        ) : (
          /* Statistiques Mensuelles */
          <div className="space-y-8">
            <div className="space-y-6">
              <h3 className="text-xs font-black text-text-main uppercase tracking-widest px-1">
                Résumé {format(currentMonth, 'MMMM', { locale: fr })}
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-card p-5 rounded-3xl border border-border-main flex flex-col gap-1">
                  <p className="text-[9px] font-black text-text-muted uppercase tracking-widest opacity-50">Net P&L</p>
                  <p className={`text-lg font-black ${monthlyStats.netPnL >= 0 ? 'text-[#22c55e]' : 'text-[#ef4444]'}`}>
                    {monthlyStats.netPnL >= 0 ? '+' : ''}{formatCurrency(monthlyStats.netPnL)}
                  </p>
                </div>
                <div className="bg-card p-5 rounded-3xl border border-border-main flex flex-col gap-1">
                  <p className="text-[9px] font-black text-text-muted uppercase tracking-widest opacity-50">Win Rate</p>
                  <p className="text-lg font-black text-text-main">{monthlyStats.winRate.toFixed(1)}%</p>
                </div>
              </div>

              <div className="bg-card p-6 rounded-[32px] border border-border-main space-y-4 shadow-sm">
                <div className="flex justify-between items-center pb-4 border-b border-border-main/50">
                   <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">Total Trades</span>
                   <span className="text-xs font-black text-text-main">{monthlyStats.totalTrades}</span>
                </div>
                <div className="flex justify-between items-center pb-4 border-b border-border-main/50">
                   <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">Profits Bruts</span>
                   <span className="text-xs font-black text-[#22c55e]">{formatCurrency(monthlyStats.grossProfit)}</span>
                </div>
                <div className="flex justify-between items-center pb-4 border-b border-border-main/50">
                   <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">Pertes Brutes</span>
                   <span className="text-xs font-black text-[#ef4444]">{formatCurrency(monthlyStats.grossLoss)}</span>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-2">
                   <div className="text-center p-3 bg-primary/5 rounded-2xl">
                      <p className="text-base font-black text-[#22c55e]">{monthlyStats.profitableDays}</p>
                      <p className="text-[8px] font-black text-text-muted uppercase tracking-tighter">Vert</p>
                   </div>
                   <div className="text-center p-3 bg-accent-red/5 rounded-2xl">
                      <p className="text-base font-black text-[#ef4444]">{monthlyStats.negativeDays}</p>
                      <p className="text-[8px] font-black text-text-muted uppercase tracking-tighter">Rouge</p>
                   </div>
                </div>
              </div>
            </div>

            {/* PERFORMANCE SECTION */}
            <div className="space-y-6">
              <div className="flex justify-between items-center px-1">
                <h3 className="text-xs font-black text-text-main uppercase tracking-widest">Performance</h3>
                <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
                  {(['Daily', 'Weekly', 'Monthly'] as PerfTab[]).map(t => (
                    <button
                      key={t}
                      onClick={() => setPerfTab(t)}
                      className={`px-3 py-1.5 rounded-lg text-[8px] font-black uppercase transition-all ${perfTab === t ? 'bg-white text-text-main shadow-sm' : 'text-text-muted'}`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-card rounded-[32px] border border-border-main p-6 shadow-sm overflow-hidden">
                <PerformanceGraph data={graphData} />
                <div className="flex justify-between mt-4 px-2">
                  <span className="text-[8px] font-black text-text-muted uppercase opacity-40">{graphData[0]?.label}</span>
                  <span className="text-[8px] font-black text-text-muted uppercase opacity-40">{graphData[Math.floor(graphData.length / 2)]?.label}</span>
                  <span className="text-[8px] font-black text-text-muted uppercase opacity-40">{graphData[graphData.length - 1]?.label}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {selectedTrade && (
        <Modal onClose={() => setSelectedTrade(null)} title="Détails du Trade">
           <TradeDetailView trade={selectedTrade} />
        </Modal>
      )}
    </div>
  );
};

const PerformanceGraph: React.FC<{ data: { label: string; value: number }[] }> = ({ data }) => {
  if (data.length < 2) return <div className="h-32 flex items-center justify-center text-[10px] font-bold text-text-muted uppercase opacity-30">Pas assez de données</div>;

  const width = 300;
  const height = 120;
  const padding = 10;

  const minVal = Math.min(...data.map(d => d.value), 0);
  const maxVal = Math.max(...data.map(d => d.value), 0);
  const range = maxVal - minVal || 1;

  const points = data.map((d, i) => {
    const x = padding + (i / (data.length - 1)) * (width - 2 * padding);
    const y = height - padding - ((d.value - minVal) / range) * (height - 2 * padding);
    return `${x},${y}`;
  }).join(' ');

  const areaPoints = `${points} ${width - padding},${height - padding} ${padding},${height - padding}`;

  return (
    <div className="relative w-full h-[120px]">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
        <defs>
          <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#22c55e" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
          </linearGradient>
        </defs>
        
        {/* Zero line */}
        <line 
          x1={padding} 
          y1={height - padding - ((-minVal) / range) * (height - 2 * padding)} 
          x2={width - padding} 
          y2={height - padding - ((-minVal) / range) * (height - 2 * padding)} 
          stroke="#e5e7eb" 
          strokeWidth="1" 
          strokeDasharray="4 4"
        />

        {/* Gradient Area */}
        <polygon points={areaPoints} fill="url(#areaGradient)" />

        {/* The Line */}
        <polyline
          fill="none"
          stroke="#22c55e"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
          className="transition-all duration-700"
        />

        {/* Points */}
        {data.map((d, i) => {
          const x = padding + (i / (data.length - 1)) * (width - 2 * padding);
          const y = height - padding - ((d.value - minVal) / range) * (height - 2 * padding);
          if (i === data.length - 1 || i === 0 || i % Math.ceil(data.length / 5) === 0) {
             return (
               <circle 
                key={i} 
                cx={x} 
                cy={y} 
                r="3" 
                fill="#ffffff" 
                stroke="#22c55e" 
                strokeWidth="2" 
               />
             );
          }
          return null;
        })}
      </svg>
    </div>
  );
};

export default PnLCalendarView;
