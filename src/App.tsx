import React, { useState } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './views/Dashboard';
import { Trades } from './views/Trades';
import { Dividends } from './views/Dividends';
import { Watchlist } from './views/Watchlist';
import { Analytics } from './views/Analytics';
import { Settings } from './views/Settings';
import { useData } from './context/DataContext';

function AppContent() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const { isLoading } = useData();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-main)]">
        <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      {activeTab === 'dashboard' && <Dashboard />}
      {activeTab === 'trades' && <Trades />}
      {activeTab === 'dividends' && <Dividends />}
      {activeTab === 'watchlist' && <Watchlist />}
      {activeTab === 'analytics' && <Analytics />}
      {activeTab === 'settings' && <Settings />}
    </Layout>
  );
}

export default AppContent;
