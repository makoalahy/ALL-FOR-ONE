
import React, { useMemo } from 'react';
import { useApp } from '../store';
import { formatCurrency } from '../utils';
import { TradeStatus, View } from '../types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

interface ReportViewProps {
  setCurrentView: (view: View) => void;
}

const ReportView: React.FC<ReportViewProps> = ({ setCurrentView }) => {
  const { trades, settings } = useApp();

  const reportStats = useMemo(() => {
    const totalTrades = trades.length;
    const wins = trades.filter(t => t.status === TradeStatus.WIN).length;
    const winRate = totalTrades > 0 ? (wins / totalTrades) * 100 : 0;
    const grossProfit = trades.reduce((acc, t) => t.result_usd > 0 ? acc + t.result_usd : acc, 0);
    const grossLoss = trades.reduce((acc, t) => t.result_usd < 0 ? acc + t.result_usd : acc, 0);
    const netPnL = grossProfit + grossLoss;

    return { totalTrades, winRate, grossProfit, grossLoss, netPnL };
  }, [trades]);

  const handleExportExcel = () => {
    const worksheetData = trades.map(t => ({
      'Date': format(new Date(t.date), 'yyyy-MM-dd HH:mm'),
      'Instrument': t.pair,
      'Type': t.type,
      'Lot': t.lot_size.toFixed(2),
      'Buy Price': t.entry_price,
      'Sell Price': t.exit_price,
      'Brokerage': '0.00',
      'Net P&L': t.result_usd.toFixed(2),
      'Result': t.status,
      'Note': t.notes || ''
    }));

    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Trading Report");
    
    // Generate Buffer and trigger download
    const fileName = `Trading_Report_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  const handleExportPDF = () => {
    const doc = new jsPDF() as any;
    const today = format(new Date(), 'dd/MM/yyyy HH:mm');
    const userName = settings.profile.name || "Trader";

    // Add Title
    doc.setFontSize(24);
    doc.setFont("helvetica", "bold");
    doc.text("Trading Report", 14, 20);
    
    // Add Profile Name
    doc.setFontSize(14);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(50);
    doc.text(`Name: ${userName}`, 14, 30);
    
    // Add Date
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated on: ${today}`, 14, 38);

    // Separator line
    doc.setDrawColor(200);
    doc.line(14, 42, 196, 42);

    // Add Stats Summary
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.setFont("helvetica", "bold");
    doc.text("Performance Summary", 14, 52);
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Total Trades: ${reportStats.totalTrades}`, 14, 60);
    doc.text(`Win Rate: ${reportStats.winRate.toFixed(1)}%`, 14, 66);
    doc.text(`Net P&L: ${formatCurrency(reportStats.netPnL)}`, 14, 72);

    // Add Table
    // Columns: Date, Instrument, Type, Lot, Entry, Exit, Brokerage (mock 0), Net P&L, Result, Note
    const tableHeaders = [['Date', 'Instrument', 'Type', 'Lot', 'Entry', 'Exit', 'P&L', 'Status', 'Note']];
    const tableData = trades.map(t => [
      format(new Date(t.date), 'dd/MM/yy'),
      t.pair,
      t.type,
      t.lot_size.toFixed(2),
      t.entry_price.toString(),
      t.exit_price.toString(),
      t.result_usd.toFixed(2),
      t.status,
      t.notes || ''
    ]);

    doc.autoTable({
      startY: 80,
      head: tableHeaders,
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [16, 183, 127], textColor: [255, 255, 255], fontStyle: 'bold' },
      didParseCell: (data: any) => {
        // Net P&L Column highlighting (index 6 in this new mapping)
        if (data.section === 'body' && data.column.index === 6) {
          const val = parseFloat(data.cell.raw);
          if (val > 0) data.cell.styles.textColor = [34, 197, 94]; // Green
          if (val < 0) data.cell.styles.textColor = [239, 68, 68]; // Red
        }
      },
      styles: { fontSize: 7, cellPadding: 2 },
      columnStyles: {
        6: { halign: 'right', fontStyle: 'bold' },
        8: { cellWidth: 30 } // Adjust width for notes
      }
    });

    const fileName = `Trading_Report_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
  };

  return (
    <div className="p-4 space-y-6 min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="flex items-center justify-between mt-2">
        <button 
          onClick={() => setCurrentView('Settings')}
          className="size-10 bg-card rounded-full flex items-center justify-center text-text-muted border border-border-main active:scale-95 transition-all"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <div className="text-center">
           <h1 className="text-sm font-black tracking-[0.2em] text-text-main uppercase">Trading Report</h1>
           <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest">Global Analytics</p>
        </div>
        <div className="flex gap-2">
           <button 
             onClick={handleExportExcel}
             className="size-10 bg-primary/10 text-primary rounded-full flex items-center justify-center active:scale-90 transition-all"
             title="Download Excel"
           >
             <span className="material-symbols-outlined text-lg">description</span>
           </button>
           <button 
             onClick={handleExportPDF}
             className="size-10 bg-accent-red/10 text-accent-red rounded-full flex items-center justify-center active:scale-90 transition-all"
             title="Download PDF"
           >
             <span className="material-symbols-outlined text-lg">picture_as_pdf</span>
           </button>
        </div>
      </header>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-2 gap-3">
         <div className="col-span-2 bg-card p-5 rounded-3xl border border-border-main shadow-sm">
            <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mb-2">Net P&L Total</p>
            <p className={`text-3xl font-black ${reportStats.netPnL >= 0 ? 'text-primary' : 'text-accent-red'}`}>
              {reportStats.netPnL >= 0 ? '+' : ''}{formatCurrency(reportStats.netPnL)}
            </p>
         </div>
         <div className="bg-card p-4 rounded-3xl border border-border-main shadow-sm">
            <p className="text-[9px] font-black text-text-muted uppercase tracking-widest mb-1 opacity-60">Win Rate</p>
            <p className="text-xl font-black text-text-main">{reportStats.winRate.toFixed(1)}%</p>
         </div>
         <div className="bg-card p-4 rounded-3xl border border-border-main shadow-sm">
            <p className="text-[9px] font-black text-text-muted uppercase tracking-widest mb-1 opacity-60">Total Trades</p>
            <p className="text-xl font-black text-text-main">{reportStats.totalTrades}</p>
         </div>
         <div className="bg-card p-4 rounded-3xl border border-border-main shadow-sm">
            <p className="text-[9px] font-black text-[#22c55e] uppercase tracking-widest mb-1 opacity-60">Total Profit</p>
            <p className="text-lg font-black text-[#22c55e]">{formatCurrency(reportStats.grossProfit)}</p>
         </div>
         <div className="bg-card p-4 rounded-3xl border border-border-main shadow-sm">
            <p className="text-[9px] font-black text-[#ef4444] uppercase tracking-widest mb-1 opacity-60">Total Loss</p>
            <p className="text-lg font-black text-[#ef4444]">{formatCurrency(reportStats.grossLoss)}</p>
         </div>
      </div>

      {/* Trades Table Section */}
      <div className="bg-card rounded-[32px] border border-border-main shadow-sm overflow-hidden flex flex-col">
        <div className="p-5 border-b border-border-main flex justify-between items-center">
          <h3 className="text-xs font-black text-text-main uppercase tracking-widest">Historique Complet</h3>
          <span className="text-[9px] font-bold text-text-muted uppercase px-2 py-1 bg-background rounded-lg">{trades.length} entrées</span>
        </div>
        
        <div className="overflow-x-auto hide-scrollbar">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-background/30 text-[9px] font-black text-text-muted uppercase tracking-widest border-b border-border-main">
                <th className="px-5 py-4">Date</th>
                <th className="px-5 py-4">Pair</th>
                <th className="px-5 py-4">Type</th>
                <th className="px-5 py-4 text-right">Lot</th>
                <th className="px-5 py-4 text-right">P&L</th>
                <th className="px-5 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-main/50">
              {trades.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-20 text-center opacity-30 text-[10px] font-black uppercase tracking-widest">
                    Aucun trade à afficher
                  </td>
                </tr>
              ) : (
                trades.map((t) => (
                  <tr key={t.id} className="text-[11px] font-bold text-text-main hover:bg-background/20 transition-colors">
                    <td className="px-5 py-4 whitespace-nowrap text-text-muted">{format(new Date(t.date), 'dd/MM/yy', { locale: fr })}</td>
                    <td className="px-5 py-4 font-black">{t.pair}</td>
                    <td className="px-5 py-4">
                      <span className={`px-1.5 py-0.5 rounded-md text-[8px] uppercase font-black ${t.type === 'Buy' ? 'bg-primary/10 text-primary' : 'bg-accent-red/10 text-accent-red'}`}>
                        {t.type}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">{t.lot_size.toFixed(2)}</td>
                    <td className={`px-5 py-4 text-right font-black ${t.result_usd >= 0 ? 'text-[#22c55e]' : 'text-[#ef4444]'}`}>
                      {t.result_usd >= 0 ? '+' : ''}{t.result_usd.toFixed(0)}
                    </td>
                    <td className="px-5 py-4 uppercase text-[9px] opacity-40 font-black tracking-widest">{t.status}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="p-6 bg-primary/5 rounded-[24px] border border-primary/10 text-center">
         <span className="material-symbols-outlined text-primary text-2xl mb-2">verified</span>
         <p className="text-[10px] font-black text-primary uppercase tracking-[0.1em]">Rapport généré avec succès</p>
         <p className="text-[9px] text-text-muted font-medium mt-1 uppercase tracking-tighter">Basé sur toutes vos données locales enregistrées.</p>
      </div>
    </div>
  );
};

export default ReportView;
