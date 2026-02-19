
import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../store';
import { formatCurrency, formatDate } from '../utils';
import { TransactionType, TransactionCategory, WalletTransaction } from '../types';
import Modal from './Modal';
import TransactionForm from './TransactionForm';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

export const CATEGORY_STYLES: Record<TransactionCategory, { icon: string; color: string; bg: string }> = {
  'Salaire': { icon: 'payments', color: 'text-emerald-500', bg: 'bg-emerald-50' },
  'Freelance': { icon: 'work', color: 'text-blue-500', bg: 'bg-blue-50' },
  'Dividendes': { icon: 'savings', color: 'text-amber-500', bg: 'bg-amber-50' },
  'Vente': { icon: 'sell', color: 'text-purple-500', bg: 'bg-purple-50' },
  'Cadeau Recu': { icon: 'card_giftcard', color: 'text-pink-500', bg: 'bg-pink-50' },
  'Alimentation': { icon: 'lunch_dining', color: 'text-orange-500', bg: 'bg-orange-50' },
  'Transport': { icon: 'commute', color: 'text-sky-500', bg: 'bg-sky-50' },
  'Abonnement': { icon: 'box_edit', color: 'text-indigo-500', bg: 'bg-indigo-50' },
  'Shopping': { icon: 'shopping_bag', color: 'text-rose-500', bg: 'bg-rose-50' },
  'Loisirs': { icon: 'sports_esports', color: 'text-emerald-600', bg: 'bg-emerald-50' },
  'Divertissement': { icon: 'theater_comedy', color: 'text-violet-500', bg: 'bg-violet-50' },
  'Factures': { icon: 'receipt_long', color: 'text-slate-500', bg: 'bg-slate-50' },
  'Cadeau Offert': { icon: 'redeem', color: 'text-pink-600', bg: 'bg-pink-50' },
  'Santé': { icon: 'medical_services', color: 'text-red-500', bg: 'bg-red-50' },
  'Sport': { icon: 'fitness_center', color: 'text-lime-600', bg: 'bg-lime-50' },
  'Voyages': { icon: 'flight', color: 'text-cyan-500', bg: 'bg-cyan-50' },
  'Matériel': { icon: 'inventory_2', color: 'text-slate-700', bg: 'bg-slate-100' },
  'Formation': { icon: 'auto_stories', color: 'text-amber-600', bg: 'bg-amber-50' },
  'Profit Retiré': { icon: 'account_balance_wallet', color: 'text-primary', bg: 'bg-primary/10' },
  'Dépôt': { icon: 'add_card', color: 'text-primary', bg: 'bg-primary/10' },
  'Objectif': { icon: 'track_changes', color: 'text-primary', bg: 'bg-primary/10' },
  'Autre': { icon: 'category', color: 'text-slate-400', bg: 'bg-slate-50' },
};

// --- Composants internes pour le Bilan ---

const AnimatedNumber: React.FC<{ value: number }> = ({ value }) => {
  const [displayValue, setDisplayValue] = useState(0);
  
  useEffect(() => {
    let start = 0;
    const end = value;
    const duration = 1000;
    const increment = end / (duration / 16);
    
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setDisplayValue(end);
        clearInterval(timer);
      } else {
        setDisplayValue(start);
      }
    }, 16);
    
    return () => clearInterval(timer);
  }, [value]);

  return <span>{formatCurrency(displayValue)}</span>;
};

const Mascot: React.FC<{ ratio: number }> = ({ ratio }) => {
  let expression = "😊";
  let message = "Super gestion !";
  let color = "bg-emerald-500";
  
  if (ratio > 0.8) {
    expression = "😰";
    message = "Oulà, ça chauffe !";
    color = "bg-rose-500";
  } else if (ratio > 0.5) {
    expression = "😐";
    message = "Attention au budget.";
    color = "bg-amber-500";
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <div className={`size-16 rounded-full ${color} flex items-center justify-center text-3xl shadow-lg animate-bounce`}>
        {expression}
      </div>
      <p className="text-[10px] font-black uppercase tracking-widest text-text-main">{message}</p>
    </div>
  );
};

const CategoryProgress: React.FC<{ category: string; amount: number; total: number; style: any }> = ({ category, amount, total, style }) => {
  const percent = total > 0 ? (amount / total) * 100 : 0;
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setWidth(percent), 200);
    return () => clearTimeout(timer);
  }, [percent]);

  return (
    <div className="space-y-1.5 group cursor-pointer">
      <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-tighter">
        <div className="flex items-center gap-1.5">
          <span className={`material-symbols-outlined text-sm ${style.color}`}>{style.icon}</span>
          <span className="text-text-main">{category}</span>
        </div>
        <span className="text-text-muted">{formatCurrency(amount)} ({percent.toFixed(0)}%)</span>
      </div>
      <div className="h-2 w-full bg-background rounded-full overflow-hidden">
        <div 
          className={`h-full transition-all duration-1000 ease-out flex items-center`}
          style={{ width: `${width}%`, backgroundColor: style.color.includes('emerald') ? '#10b77f' : style.color.includes('rose') ? '#f43f5e' : '#64748b' }}
        >
          <div className="w-full h-full opacity-30 bg-white animate-pulse"></div>
        </div>
      </div>
    </div>
  );
};

// --- Composant Principal ---

const WalletView: React.FC = () => {
  const { transactions, stats, settings } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [showBilan, setShowBilan] = useState(false);
  const [showReceiptPreview, setShowReceiptPreview] = useState(false);
  const [initialType, setInitialType] = useState<TransactionType>(TransactionType.INCOME);
  const [isUnlocked, setIsUnlocked] = useState(!settings.security.biometricEnabled);
  const [authError, setAuthError] = useState<string | null>(null);

  // Tentative d'authentification biométrique
  const handleUnlock = async () => {
    if (!window.PublicKeyCredential) {
      setIsUnlocked(true); // Fallback si non supporté
      return;
    }

    try {
      setAuthError(null);
      // Création d'un challenge d'authentification simple
      const challenge = new Uint8Array(32);
      window.crypto.getRandomValues(challenge);

      const options: any = {
        publicKey: {
          challenge: challenge,
          timeout: 60000,
          userVerification: "required",
          allowCredentials: [] 
        }
      };

      // Déclenchement du capteur (FaceID / Fingerprint / Windows Hello)
      await navigator.credentials.get(options);
      
      setIsUnlocked(true);
    } catch (err: any) {
      console.error("Auth Error:", err);
      setAuthError("Échec de l'authentification. Veuillez réessayer.");
    }
  };

  // Déclencher automatiquement si verrouillé au montage
  useEffect(() => {
    if (!isUnlocked) {
      handleUnlock();
    }
  }, []);

  const openForm = (type: TransactionType) => {
    setInitialType(type);
    setShowForm(true);
  };

  const categoryData = useMemo(() => {
    const expenses = transactions.filter(t => t.type === TransactionType.EXPENSE);
    const totals: Record<string, number> = {};
    expenses.forEach(t => {
      totals[t.category] = (totals[t.category] || 0) + t.amount;
    });
    return Object.entries(totals)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [transactions]);

  const spendingRatio = stats.totalIncome > 0 ? stats.totalExpense / stats.totalIncome : (stats.totalExpense > 0 ? 1 : 0);

  const handleDownloadPDF = () => {
    const doc = new jsPDF() as any;
    const dateStr = new Date().toLocaleDateString('fr-FR', {
      year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });

    // Header PDF
    doc.setFontSize(22);
    doc.setTextColor(16, 183, 127); // Primary Color
    doc.text('FIKO - REÇU DE WALLET', 14, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Propriétaire : ${settings.profile.name}`, 14, 30);
    doc.text(`Date de génération : ${dateStr}`, 14, 35);
    doc.line(14, 40, 196, 40);

    // Tableau des transactions
    const tableData = transactions.map(t => [
      new Date(t.date).toLocaleDateString('fr-FR'),
      t.category,
      t.description || '-',
      t.type === TransactionType.INCOME ? 'Revenu' : 'Dépense',
      `${t.type === TransactionType.INCOME ? '+' : '-'}${t.amount.toFixed(2)} $`
    ]);

    doc.autoTable({
      startY: 45,
      head: [['Date', 'Catégorie', 'Description', 'Type', 'Montant']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255] },
      didParseCell: (data: any) => {
        if (data.section === 'body' && data.column.index === 4) {
          const val = data.cell.raw;
          if (val.startsWith('+')) data.cell.styles.textColor = [16, 183, 127];
          if (val.startsWith('-')) data.cell.styles.textColor = [239, 68, 68];
        }
      }
    });

    // Résumé final
    const finalY = (doc as any).lastAutoTable.finalY + 15;
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text('RÉCAPITULATIF :', 14, finalY);
    doc.text(`Total Revenus : +${stats.totalIncome.toFixed(2)} $`, 14, finalY + 10);
    doc.text(`Total Dépenses : -${stats.totalExpense.toFixed(2)} $`, 14, finalY + 18);
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(`SOLDE NET : ${stats.walletBalance.toFixed(2)} $`, 14, finalY + 30);

    doc.save(`FIKO_Recu_${new Date().getTime()}.pdf`);
    setShowReceiptPreview(false);
  };

  // Écran de verrouillage
  if (!isUnlocked) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background p-8 text-center space-y-8 animate-in fade-in duration-500">
        <div className="size-24 rounded-full bg-primary/10 flex items-center justify-center text-primary shadow-2xl animate-pulse">
           <span className="material-symbols-outlined text-5xl">lock</span>
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-black text-text-main uppercase tracking-tight">Wallet Verrouillé</h2>
          <p className="text-sm text-text-muted font-medium">L'accès à vos données financières nécessite une authentification biométrique.</p>
        </div>
        
        {authError && (
          <p className="text-xs font-black text-accent-red uppercase tracking-widest">{authError}</p>
        )}

        <button 
          onClick={handleUnlock}
          className="px-8 py-4 bg-primary text-white font-black rounded-[24px] shadow-lg shadow-primary/20 flex items-center gap-3 active:scale-95 transition-all"
        >
          <span className="material-symbols-outlined">fingerprint</span>
          DÉVERROUILLER
        </button>

        <p className="text-[10px] text-text-muted font-black uppercase tracking-[0.2em] opacity-40">FIKO SECURITY PROTOCOL</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full pb-24 animate-in slide-in-from-bottom-2 duration-300">
      <header className="flex items-center justify-between p-5 bg-white/80 backdrop-blur-lg sticky top-0 z-10 border-b border-border-main">
        <h2 className="text-xl font-black text-text-main tracking-tight">Portefeuille</h2>
        <div className="flex gap-2">
            <button 
              onClick={() => setShowReceiptPreview(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-600 rounded-full border border-slate-200 active:scale-95 transition-all shadow-sm hover:bg-slate-200"
            >
              <span className="material-symbols-outlined text-[18px] font-black">receipt</span>
              <span className="text-[10px] font-black uppercase tracking-widest">Reçu</span>
            </button>
            <button 
              onClick={() => setShowBilan(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary rounded-full border border-primary/20 active:scale-95 transition-all shadow-sm hover:bg-primary/20"
            >
              <span className="material-symbols-outlined text-[18px] font-black animate-pulse">analytics</span>
              <span className="text-[10px] font-black uppercase tracking-widest">Bilan</span>
            </button>
        </div>
      </header>

      {/* Main Balance Card */}
      <div className="p-8 text-center relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-primary/5 rounded-full blur-3xl -z-10"></div>
        <p className="text-text-muted text-[10px] font-black uppercase tracking-[0.2em] mb-2">Solde Total</p>
        <h1 className="text-text-main tracking-tighter text-[44px] font-black leading-tight">
          {formatCurrency(stats.walletBalance)}
        </h1>
        <div className="flex justify-center items-center gap-2 mt-2">
            <span className="size-2 bg-primary rounded-full animate-pulse"></span>
            <p className="text-[10px] text-text-muted font-black uppercase tracking-widest">Compte Actif</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 px-4 pb-6">
        <div className="flex flex-col gap-3 rounded-[28px] bg-card p-5 border border-border-main shadow-sm">
          <div className="bg-primary/10 text-primary size-10 rounded-2xl flex items-center justify-center">
            <span className="material-symbols-outlined font-black text-xl">trending_up</span>
          </div>
          <div>
            <p className="text-text-muted text-[9px] font-black uppercase tracking-widest mb-0.5 opacity-60">Revenus</p>
            <h2 className="text-base font-black text-text-main">{formatCurrency(stats.totalIncome)}</h2>
          </div>
        </div>
        <div className="flex flex-col gap-3 rounded-[28px] bg-card p-5 border border-border-main shadow-sm">
          <div className="bg-accent-red/10 text-accent-red size-10 rounded-2xl flex items-center justify-center">
            <span className="material-symbols-outlined font-black text-xl">trending_down</span>
          </div>
          <div>
            <p className="text-text-muted text-[9px] font-black uppercase tracking-widest mb-0.5 opacity-60">Dépenses</p>
            <h2 className="text-base font-black text-text-main">{formatCurrency(stats.totalExpense)}</h2>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="px-4 pb-8 flex gap-3">
        <button 
          onClick={() => openForm(TransactionType.INCOME)}
          className="flex-1 bg-primary text-white font-black py-4 rounded-2xl shadow-lg shadow-primary/20 flex items-center justify-center gap-2 transition-all active:scale-[0.96]"
        >
          <span className="material-symbols-outlined text-xl">add_circle</span>
          <span className="text-[10px] uppercase tracking-widest">REVENU</span>
        </button>
        <button 
          onClick={() => openForm(TransactionType.EXPENSE)}
          className="flex-1 bg-text-main text-white font-black py-4 rounded-2xl shadow-lg shadow-slate-300 flex items-center justify-center gap-2 transition-all active:scale-[0.96]"
        >
          <span className="material-symbols-outlined text-xl">remove_circle</span>
          <span className="text-[10px] uppercase tracking-widest">DÉPENSE</span>
        </button>
      </div>

      {/* History List */}
      <div className="px-4 space-y-4">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">Activités Récentes</h3>
          <span className="text-[9px] font-bold text-text-muted bg-border-main px-2 py-1 rounded-lg uppercase">{transactions.length} Flux</span>
        </div>

        <div className="flex flex-col gap-3">
          {transactions.length === 0 ? (
            <div className="text-center py-20 bg-card rounded-[32px] border border-dashed border-border-main flex flex-col items-center opacity-40">
              <span className="material-symbols-outlined text-5xl mb-3">account_balance_wallet</span>
              <p className="text-[10px] font-black uppercase tracking-widest">Aucune donnée</p>
            </div>
          ) : (
            transactions.map((t) => {
              const style = CATEGORY_STYLES[t.category] || CATEGORY_STYLES['Autre'];
              return (
                <div key={t.id} className="flex items-center justify-between p-4 bg-card rounded-[24px] border border-border-main shadow-sm hover:border-primary/30 transition-all group">
                  <div className="flex items-center gap-4">
                    <div className={`size-12 rounded-2xl flex items-center justify-center transition-all ${style.bg} ${style.color}`}>
                      <span className="material-symbols-outlined text-2xl group-hover:scale-110 transition-transform">
                        {style.icon}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-black text-text-main leading-none mb-1">{t.category}</p>
                      <p className="text-[10px] text-text-muted font-bold truncate max-w-[140px]">
                        {t.description || "Aucune note ajoutée"}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-[15px] font-black ${t.type === TransactionType.INCOME ? 'text-primary' : 'text-text-main'}`}>
                      {t.type === TransactionType.INCOME ? '+' : '-'}{formatCurrency(t.amount)}
                    </p>
                    <p className="text-[8px] text-text-muted font-black uppercase tracking-tighter opacity-50">{formatDate(t.date).split('•')[0]}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Modal Bilan */}
      {showBilan && (
        <Modal onClose={() => setShowBilan(false)} title="Analyse de ton Wallet">
          <div className="space-y-8 py-2">
            <div className="flex items-center justify-between bg-background rounded-3xl p-6 border border-border-main">
              <Mascot ratio={spendingRatio} />
              <div className="text-right space-y-1">
                <p className="text-[9px] font-black text-text-muted uppercase tracking-widest">Score Santé</p>
                <p className={`text-2xl font-black ${spendingRatio < 0.6 ? 'text-primary' : 'text-accent-red'}`}>
                  {((1 - spendingRatio) * 100).toFixed(0)}%
                </p>
                <div className="h-1.5 w-24 bg-white rounded-full overflow-hidden ml-auto">
                   <div className={`h-full ${spendingRatio < 0.6 ? 'bg-primary' : 'bg-accent-red'} transition-all duration-1000`} style={{ width: `${(1 - spendingRatio) * 100}%` }}></div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-[9px] font-black text-text-muted uppercase tracking-widest">Total Encaissé</p>
                <h4 className="text-lg font-black text-primary"><AnimatedNumber value={stats.totalIncome} /></h4>
              </div>
              <div className="space-y-1 text-right">
                <p className="text-[9px] font-black text-text-muted uppercase tracking-widest">Total Sorti</p>
                <h4 className="text-lg font-black text-text-main"><AnimatedNumber value={stats.totalExpense} /></h4>
              </div>
            </div>

            <div className="space-y-4">
              <h5 className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] border-b border-border-main pb-2">Où part ton argent ?</h5>
              <div className="space-y-5">
                {categoryData.length > 0 ? (
                  categoryData.map(([cat, amount]) => (
                    <CategoryProgress 
                      key={cat} 
                      category={cat} 
                      amount={amount} 
                      total={stats.totalExpense} 
                      style={CATEGORY_STYLES[cat as TransactionCategory] || CATEGORY_STYLES['Autre']} 
                    />
                  ))
                ) : (
                  <p className="text-center text-xs text-text-muted py-4 font-bold italic">Pas assez de données de dépenses.</p>
                )}
              </div>
            </div>

            <button 
              onClick={() => setShowBilan(false)}
              className="w-full py-4 bg-text-main text-white font-black rounded-3xl text-[10px] uppercase tracking-[0.2em] hover:brightness-110 active:scale-95 transition-all"
            >
              Fermer le rapport
            </button>
          </div>
        </Modal>
      )}

      {showReceiptPreview && (
        <Modal onClose={() => setShowReceiptPreview(false)} title="Aperçu du Reçu">
          <div className="space-y-6">
             <div className="p-6 bg-slate-50 border border-border-main rounded-3xl space-y-4">
                <div className="flex justify-between items-start">
                    <div>
                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Client</h4>
                        <p className="text-sm font-black text-text-main">{settings.profile.name}</p>
                    </div>
                    <div className="text-right">
                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Date</h4>
                        <p className="text-sm font-black text-text-main">{new Date().toLocaleDateString('fr-FR')}</p>
                    </div>
                </div>

                <div className="h-px bg-slate-200"></div>

                <div className="space-y-3 max-h-[200px] overflow-y-auto pr-2 hide-scrollbar">
                    {transactions.slice(0, 10).map(t => (
                        <div key={t.id} className="flex justify-between text-[11px] font-bold">
                            <span className="text-text-muted">{t.category} {t.description && `- ${t.description.substring(0, 15)}...`}</span>
                            <span className={t.type === TransactionType.INCOME ? 'text-primary' : 'text-accent-red'}>
                                {t.type === TransactionType.INCOME ? '+' : '-'}{t.amount.toFixed(2)} $
                            </span>
                        </div>
                    ))}
                    {transactions.length > 10 && (
                        <p className="text-[10px] text-center text-text-muted italic">+ {transactions.length - 10} autres transactions</p>
                    )}
                </div>

                <div className="h-px bg-slate-200"></div>

                <div className="space-y-1 pt-2">
                    <div className="flex justify-between text-xs font-black">
                        <span className="text-text-muted uppercase">Total Revenus</span>
                        <span className="text-primary">+{stats.totalIncome.toFixed(2)} $</span>
                    </div>
                    <div className="flex justify-between text-xs font-black">
                        <span className="text-text-muted uppercase">Total Dépenses</span>
                        <span className="text-accent-red">-{stats.totalExpense.toFixed(2)} $</span>
                    </div>
                    <div className="flex justify-between text-base font-black pt-3 border-t border-slate-200 mt-2">
                        <span className="text-text-main uppercase">SOLDE FINAL</span>
                        <span className="text-text-main">{stats.walletBalance.toFixed(2)} $</span>
                    </div>
                </div>
             </div>

             <div className="flex gap-3">
                 <button 
                   onClick={() => setShowReceiptPreview(false)}
                   className="flex-1 py-4 bg-slate-100 text-slate-600 font-black rounded-3xl text-[10px] uppercase tracking-widest active:scale-95 transition-all"
                 >
                   Annuler
                 </button>
                 <button 
                   onClick={handleDownloadPDF}
                   className="flex-2 w-full py-4 bg-primary text-white font-black rounded-3xl text-[10px] uppercase tracking-widest shadow-lg shadow-primary/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                 >
                   <span className="material-symbols-outlined text-lg">download</span>
                   Télécharger PDF
                 </button>
             </div>
          </div>
        </Modal>
      )}

      {showForm && (
        <Modal onClose={() => setShowForm(false)} title={initialType === TransactionType.INCOME ? "Encaisser un Revenu" : "Saisir une Dépense"}>
          <TransactionForm initialType={initialType} onSuccess={() => setShowForm(false)} />
        </Modal>
      )}
    </div>
  );
};

export default WalletView;
