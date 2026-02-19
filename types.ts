
export enum TradeType {
  BUY = 'Buy',
  SELL = 'Sell'
}

export enum TradeStatus {
  WIN = 'Win',
  LOSS = 'Loss',
  BE = 'BE'
}

export interface Trade {
  id: string;
  pair: string;
  type: TradeType;
  lot_size: number;
  entry_price: number;
  exit_price: number;
  stop_loss: number;
  take_profit: number;
  result_usd: number;
  risk_reward: number;
  status: TradeStatus;
  date: string;
  timeframe?: string;
  image_url?: string;
  notes?: string;
}

export enum TransactionType {
  INCOME = 'Income',
  EXPENSE = 'Expense'
}

export type TransactionCategory = 
  | 'Salaire' | 'Freelance' | 'Dividendes' | 'Vente' | 'Cadeau Recu'
  | 'Alimentation' | 'Transport' | 'Abonnement' | 'Shopping' | 'Loisirs' 
  | 'Divertissement' | 'Factures' | 'Cadeau Offert' | 'Santé' | 'Sport' 
  | 'Voyages' | 'Matériel' | 'Formation' | 'Autre' | 'Profit Retiré' | 'Dépôt' | 'Objectif';

export interface WalletTransaction {
  id: string;
  type: TransactionType;
  amount: number;
  category: TransactionCategory;
  description: string;
  date: string;
}

// Added ObjectiveStatus enum to track progress state
export enum ObjectiveStatus {
  IN_PROGRESS = 'In Progress',
  COMPLETED = 'Completed'
}

// Added ObjectiveType enum to define objective categories
export enum ObjectiveType {
  FINANCIAL = 'Financial',
  PERFORMANCE = 'Performance',
  PERSONAL = 'Personal'
}

// Added Objective interface for goal tracking
export interface Objective {
  id: string;
  title: string;
  description?: string;
  target_value: number;
  current_value: number;
  type: ObjectiveType;
  image_url: string;
  start_date: string;
  end_date: string;
  status: ObjectiveStatus;
  deposited_funds: number;
  manual_progress?: number;
}

export interface UserProfile {
  name: string;
  photo: string;
  headerImage?: string;
}

export interface NotificationChannel {
  enabled: boolean;
  soundEnabled: boolean;
  soundUrl: string;
}

export interface AppSettings {
  notifications: {
    winTrade: NotificationChannel;
    lossTrade: NotificationChannel;
    objectiveReached: NotificationChannel;
    dailyMantra: NotificationChannel;
  };
  profile: UserProfile;
  security: {
    biometricEnabled: boolean;
  };
}

export type TimeFilter = 'Week' | 'Month' | 'Year' | 'All';

export type View = 'Dashboard' | 'Journal' | 'Wallet' | 'Objectives' | 'Settings' | 'PnLCalendar' | 'Report';
