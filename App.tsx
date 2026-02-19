
import React, { useState } from 'react';
import { AppProvider } from './store';
import { View } from './types';
import DashboardView from './components/DashboardView';
import JournalView from './components/JournalView';
import WalletView from './components/WalletView';
import ObjectiveView from './components/ObjectiveView';
import SettingsView from './components/SettingsView';
import PnLCalendarView from './components/PnLCalendarView';
import ReportView from './components/ReportView';
import BottomNav from './components/BottomNav';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('Dashboard');

  const renderView = () => {
    switch (currentView) {
      case 'Dashboard': return <DashboardView />;
      case 'Journal': return <JournalView setCurrentView={setCurrentView} />;
      case 'Wallet': return <WalletView />;
      case 'Objectives': return <ObjectiveView />;
      case 'Settings': return <SettingsView setCurrentView={setCurrentView} />;
      case 'PnLCalendar': return <PnLCalendarView setCurrentView={setCurrentView} />;
      case 'Report': return <ReportView setCurrentView={setCurrentView} />;
      default: return <DashboardView />;
    }
  };

  return (
    <AppProvider>
      <div className="flex flex-col min-h-screen bg-background text-text-main overflow-x-hidden">
        <main className="flex-1 w-full max-w-md mx-auto relative pb-24">
          {renderView()}
        </main>
        {currentView !== 'Report' && (
          <BottomNav currentView={currentView === 'PnLCalendar' ? 'Journal' : currentView} setCurrentView={setCurrentView} />
        )}
      </div>
    </AppProvider>
  );
};

export default App;
