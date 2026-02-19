
import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { 
  Trade, TradeType, TradeStatus, 
  WalletTransaction, TransactionType, 
  Objective, ObjectiveStatus, ObjectiveType,
  TimeFilter, AppSettings
} from './types';
import { isDateInRange } from './utils';

interface AppContextType {
  trades: Trade[];
  transactions: WalletTransaction[];
  objectives: Objective[];
  timeFilter: TimeFilter;
  settings: AppSettings;
  setTimeFilter: (filter: TimeFilter) => void;
  setSettings: (settings: AppSettings) => void;
  addTrade: (trade: Omit<Trade, 'id' | 'result_usd' | 'risk_reward' | 'status'>) => void;
  addTransaction: (transaction: Omit<WalletTransaction, 'id'>) => void;
  addObjective: (objective: Omit<Objective, 'id' | 'current_value' | 'status' | 'deposited_funds'>) => void;
  updatePersonalObjective: (id: string, value: number) => void;
  depositToObjective: (id: string, amount: number) => void;
  importAllData: (data: string) => boolean;
  exportAllData: () => void;
  stats: {
    totalPnL: number;
    winRate: number;
    profitFactor: number;
    avgRR: number;
    walletBalance: number;
    totalIncome: number;
    totalExpense: number;
  };
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const NEUTRAL_AVATAR = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTEyIiBoZWlnaHQ9IjUxMiIgdmlld0JveD0iMCAwIDUxMiA1MTIiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI1MTIiIGhlaWdodD0iNTEyIiByeD0iMjU2IiBmaWxsPSIjRjFGNEY5Ii8+CjxwYXRoIGQ9Ik0yNTYgMTEyQzE5NS4yNDkgMTEyIDE0NiAxNjEuMjQ5IDE0NiAyMjJDMTQ2IDI4Mi43NTEgMTk1LjI0OSAzMzIgMjU2IDMzMkMzMTYuNzUxIDMzMiAzNjYgMjgyLjc1MSAzNjYgMjIyQzM2NiAxNjEuMjQ5IDMxNi43NTEgMTEyIDI1NiAxMTJaTTI1NiAyOTJDMjE3LjM0IDI5MiAxODYgMjYwLjY2IDE4NiAyMjJDMTg2IDE4My4zNCAyMTcuMzQgMTUyIDI1NiAxNTJDMjk0LjY2IDE1MiAzMjYgMTgzLjM0IDMyNiAyMjJDMzI2IDI2MC42NiAyOTQuNjYgMjkyIDI1NiAyOTJaIiBmaWxsPSIjOTQ0QzYxIi8+CjxwYXRoIGQ9Ik0yNTYgMzUyQzE3MC4zOTcgMzUyIDk3LjA5NyA0MDUuMjU5IDY2LjE1MSA0ODBDODcuMjYzIDUwMC4wODUgMTE0Ljg3MSA1MTIgMTQ1LjI5IDUxMkgzNjYuNzFDIDM5Ny4xMjkgNTEyIDQyNC43MzcgNTAwLjA4NSA0NDUuODQ5IDQ4MEM0MTQuOTAzIDQwNS4yNTkgMzQxLjYwMyAzNTIgMjU2IDM1MloiIGZpbGw9IiM5NDRDMjEiLz4KPC9zdmc+";

const DEFAULT_SOUNDS = {
  win: "https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3",
  loss: "https://assets.mixkit.co/active_storage/sfx/2018/2018-preview.mp3",
  objective: "https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3",
  mantra: "https://assets.mixkit.co/active_storage/sfx/2015/2015-preview.mp3"
};

const DEFAULT_SETTINGS: AppSettings = {
  notifications: {
    winTrade: { enabled: true, soundEnabled: true, soundUrl: DEFAULT_SOUNDS.win },
    lossTrade: { enabled: true, soundEnabled: true, soundUrl: DEFAULT_SOUNDS.loss },
    objectiveReached: { enabled: true, soundEnabled: true, soundUrl: DEFAULT_SOUNDS.objective },
    dailyMantra: { enabled: true, soundEnabled: true, soundUrl: DEFAULT_SOUNDS.mantra },
  },
  profile: {
    name: 'Trader',
    photo: NEUTRAL_AVATAR,
    headerImage: ''
  },
  security: {
    biometricEnabled: false
  }
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [trades, setTrades] = useState<Trade[]>(() => {
    const saved = localStorage.getItem('trades');
    return saved ? JSON.parse(saved) : [];
  });

  const [transactions, setTransactions] = useState<WalletTransaction[]>(() => {
    const saved = localStorage.getItem('transactions');
    return saved ? JSON.parse(saved) : [];
  });

  const [objectives, setObjectives] = useState<Objective[]>(() => {
    const saved = localStorage.getItem('objectives');
    return saved ? JSON.parse(saved) : [];
  });

  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('appSettings');
    return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
  });

  const [timeFilter, setTimeFilter] = useState<TimeFilter>('All');

  useEffect(() => {
    localStorage.setItem('trades', JSON.stringify(trades));
    localStorage.setItem('transactions', JSON.stringify(transactions));
    localStorage.setItem('objectives', JSON.stringify(objectives));
    localStorage.setItem('appSettings', JSON.stringify(settings));
  }, [trades, transactions, objectives, settings]);

  const triggerLocalNotification = (title: string, body: string, soundUrl?: string) => {
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(title, { body, icon: '/favicon.ico' });
    }
    if (soundUrl) {
      const audio = new Audio(soundUrl);
      audio.play().catch(e => console.log("Audio play blocked", e));
    }
  };

  const addTrade = (newTradeData: any) => {
    const { type, entry_price, exit_price, lot_size, stop_loss, take_profit } = newTradeData;
    let result_usd = 0;
    if (type === TradeType.BUY) {
      result_usd = (exit_price - entry_price) * lot_size * 1000;
    } else {
      result_usd = (entry_price - exit_price) * lot_size * 1000;
    }
    const risk = Math.abs(entry_price - stop_loss);
    const reward = Math.abs(take_profit - entry_price);
    const risk_reward = risk > 0 ? reward / risk : 0;
    let status = TradeStatus.BE;
    if (result_usd > 0) status = TradeStatus.WIN;
    else if (result_usd < 0) status = TradeStatus.LOSS;

    const trade: Trade = {
      ...newTradeData,
      id: Math.random().toString(36).substr(2, 9),
      result_usd,
      risk_reward,
      status
    };
    setTrades(prev => [trade, ...prev]);

    if (status === TradeStatus.WIN && settings.notifications.winTrade.enabled) {
      triggerLocalNotification("TRADE GAGNÉ ! 🚀", `Profit de ${result_usd.toFixed(2)}$ sur ${trade.pair}`, settings.notifications.winTrade.soundEnabled ? settings.notifications.winTrade.soundUrl : undefined);
    } else if (status === TradeStatus.LOSS && settings.notifications.lossTrade.enabled) {
      triggerLocalNotification("TRADE PERDU 📉", `Perte de ${Math.abs(result_usd).toFixed(2)}$ sur ${trade.pair}`, settings.notifications.lossTrade.soundEnabled ? settings.notifications.lossTrade.soundUrl : undefined);
    }
  };

  const addTransaction = (tData: any) => {
    const transaction: WalletTransaction = {
      ...tData,
      id: Math.random().toString(36).substr(2, 9),
    };
    setTransactions(prev => [transaction, ...prev]);
  };

  const addObjective = (objData: any) => {
    const objective: Objective = {
      ...objData,
      id: Math.random().toString(36).substr(2, 9),
      current_value: 0,
      deposited_funds: 0,
      status: ObjectiveStatus.IN_PROGRESS
    };
    setObjectives(prev => [objective, ...prev]);
  };

  const depositToObjective = (id: string, amount: number) => {
    const objective = objectives.find(o => o.id === id);
    if (!objective || amount <= 0) return;

    setObjectives(prev => prev.map(obj => 
      obj.id === id 
        ? { ...obj, deposited_funds: obj.deposited_funds + amount } 
        : obj
    ));

    const transaction: WalletTransaction = {
      id: Math.random().toString(36).substr(2, 9),
      type: TransactionType.EXPENSE,
      amount: amount,
      category: 'Objectif',
      description: `Dépôt sur objectif : ${objective.title}`,
      date: new Date().toISOString()
    };
    setTransactions(prev => [transaction, ...prev]);
  };

  const updatePersonalObjective = (id: string, value: number) => {
    setObjectives(prev => prev.map(obj => obj.id === id ? { ...obj, manual_progress: value } : obj));
  };

  const exportAllData = () => {
    const data = { trades, transactions, objectives, settings };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `journal-trading-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  const importAllData = (jsonStr: string) => {
    try {
      const data = JSON.parse(jsonStr);
      if (data.trades) setTrades(data.trades);
      if (data.transactions) setTransactions(data.transactions);
      if (data.objectives) setObjectives(data.objectives);
      if (data.settings) setSettings(data.settings);
      return true;
    } catch (e) {
      console.error("Failed to import data", e);
      return false;
    }
  };

  const stats = useMemo(() => {
    const filteredTrades = trades.filter(t => isDateInRange(t.date, timeFilter));
    const totalPnL = filteredTrades.reduce((acc, t) => acc + t.result_usd, 0);
    const wins = filteredTrades.filter(t => t.status === TradeStatus.WIN).length;
    const winRate = filteredTrades.length > 0 ? (wins / filteredTrades.length) * 100 : 0;
    const totalGains = filteredTrades.reduce((acc, t) => t.result_usd > 0 ? acc + t.result_usd : acc, 0);
    const totalLosses = Math.abs(filteredTrades.reduce((acc, t) => t.result_usd < 0 ? acc + t.result_usd : acc, 0));
    const profitFactor = totalLosses > 0 ? totalGains / totalLosses : (totalGains > 0 ? Infinity : 0);
    const avgRR = filteredTrades.length > 0 ? filteredTrades.reduce((acc, t) => acc + t.risk_reward, 0) / filteredTrades.length : 0;
    const totalIncome = transactions.reduce((acc, t) => t.type === TransactionType.INCOME ? acc + t.amount : acc, 0);
    const totalExpense = transactions.reduce((acc, t) => t.type === TransactionType.EXPENSE ? acc + t.amount : acc, 0);
    const walletBalance = totalIncome - totalExpense;
    return { totalPnL, winRate, profitFactor, avgRR, walletBalance, totalIncome, totalExpense };
  }, [trades, transactions, timeFilter]);

  useEffect(() => {
    const updatedObjectives = objectives.map(obj => {
      let baseVal = 0;
      const tradesInRange = trades.filter(t => new Date(t.date) >= new Date(obj.start_date));
      if (obj.type === ObjectiveType.FINANCIAL) {
        baseVal = tradesInRange.reduce((acc, t) => acc + t.result_usd, 0);
      } else if (obj.type === ObjectiveType.PERFORMANCE) {
        const wins = tradesInRange.filter(t => t.status === TradeStatus.WIN).length;
        baseVal = tradesInRange.length > 0 ? (wins / tradesInRange.length) * 100 : 0;
      } else {
        baseVal = obj.manual_progress || 0;
      }

      const currentVal = baseVal + (obj.deposited_funds || 0);
      let status = currentVal >= obj.target_value ? ObjectiveStatus.COMPLETED : ObjectiveStatus.IN_PROGRESS;
      
      if (status === ObjectiveStatus.COMPLETED && obj.status !== ObjectiveStatus.COMPLETED && settings.notifications.objectiveReached.enabled) {
        triggerLocalNotification("OBJECTIF ATTEINT ! 🏆", `Félicitations, tu as terminé : ${obj.title}`, settings.notifications.objectiveReached.soundEnabled ? settings.notifications.objectiveReached.soundUrl : undefined);
      }

      return { ...obj, current_value: currentVal, status };
    });
    if (JSON.stringify(updatedObjectives) !== JSON.stringify(objectives)) {
      setObjectives(updatedObjectives);
    }
  }, [trades, objectives]);

  return (
    <AppContext.Provider value={{ 
      trades, transactions, objectives, timeFilter, setTimeFilter, settings, setSettings,
      addTrade, addTransaction, addObjective, updatePersonalObjective, depositToObjective, stats, exportAllData, importAllData
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};
