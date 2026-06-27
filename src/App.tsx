import React, { useState } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './views/Dashboard';
import { Trades } from './views/Trades';
import { Dividends } from './views/Dividends';
import { Watchlist } from './views/Watchlist';
import { Analytics } from './views/Analytics';
import { IPOs } from './views/IPOs';
import { Funds } from './views/Funds';
import { Splits } from './views/Splits';
import { BalanceAnalyses } from './views/BalanceAnalyses';
import { Settings } from './views/Settings';
import { useData } from './context/DataContext';
function AppContent() {
  const urlParams = new URLSearchParams(window.location.search);
  const initialTab = urlParams.get('tab') || 'dashboard';
  const [activeTab, setActiveTab] = useState(initialTab);
  const { isLoading } = useData();

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    const url = new URL(window.location.href);
    url.searchParams.set('tab', tab);
    url.searchParams.delete('id'); // Sayfa değiştiğinde alt parametreleri temizle
    window.history.pushState({}, '', url);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-main)]">
        <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <Layout activeTab={activeTab} setActiveTab={handleTabChange}>
      {activeTab === 'dashboard' && <Dashboard />}
      {activeTab === 'trades' && <Trades />}
      {activeTab === 'dividends' && <Dividends />}
      {activeTab === 'watchlist' && <Watchlist />}
      {activeTab === 'ipos' && <IPOs />}
      {activeTab === 'funds' && <Funds />}
      {activeTab === 'splits' && <Splits />}
      {activeTab === 'balance-analyses' && <BalanceAnalyses />}
      {activeTab === 'analytics' && <Analytics />}
      {activeTab === 'settings' && <Settings />}
    </Layout>
  );
}

export default AppContent;
