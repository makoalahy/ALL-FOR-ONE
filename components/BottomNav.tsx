
import React from 'react';
import { View } from '../types';

interface BottomNavProps {
  currentView: View;
  setCurrentView: (view: View) => void;
}

const BottomNav: React.FC<BottomNavProps> = ({ currentView, setCurrentView }) => {
  const navItems: { label: string; view: View; icon: string }[] = [
    { label: 'Dash', view: 'Dashboard', icon: 'grid_view' },
    { label: 'Journal', view: 'Journal', icon: 'menu_book' },
    { label: 'Wallet', view: 'Wallet', icon: 'account_balance_wallet' },
    { label: 'Goal', view: 'Objectives', icon: 'track_changes' },
    { label: 'Settings', view: 'Settings', icon: 'settings' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-nav-bg backdrop-blur-xl border-t border-border-main px-4 py-3 flex items-center justify-between max-w-md mx-auto z-50 shadow-[0_-5px_15px_rgba(0,0,0,0.02)] transition-colors duration-300">
      {navItems.map((item) => (
        <button
          key={item.view}
          onClick={() => setCurrentView(item.view)}
          className={`flex flex-col items-center gap-1 transition-all duration-200 ${
            currentView === item.view ? 'text-primary' : 'text-text-muted hover:text-text-main'
          }`}
        >
          <span className={`material-symbols-outlined text-[24px] ${currentView === item.view ? 'filled' : ''}`}>
            {item.icon}
          </span>
          <span className={`text-[9px] font-bold uppercase tracking-wider ${currentView === item.view ? 'font-black' : ''}`}>
            {item.label}
          </span>
        </button>
      ))}
    </nav>
  );
};

export default BottomNav;
