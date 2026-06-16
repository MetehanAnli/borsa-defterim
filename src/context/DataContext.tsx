import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { UserData, defaultUserData, Trade, Dividend, WatchlistItem } from '../types';
import { generateDemoData } from '../utils/demoData';

interface DataContextType {
  data: UserData;
  isLoading: boolean;
  user: any | null; // Firebase user type mock
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  addTrade: (trade: Trade) => void;
  updateTrade: (trade: Trade) => void;
  deleteTrade: (id: string) => void;
  addDividend: (dividend: Dividend) => void;
  deleteDividend: (id: string) => void;
  addWatchlistItem: (item: WatchlistItem) => void;
  deleteWatchlistItem: (id: string) => void;
  updateTargetPortfolio: (target: number) => void;
  injectDemoData: () => void;
  clearAllData: () => void;
  livePrices: Record<string, number>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'borsa-defterim-data';

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [data, setData] = useState<UserData>(defaultUserData);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any | null>(null);
  const [livePrices, setLivePrices] = useState<Record<string, number>>({});

  // Load from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      try {
        setData(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse local storage data', e);
      }
    }
    setIsLoading(false);
  }, []);

  // Save to local storage on data change
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
      // TODO: If user is logged in, sync to Firebase Firestore here
    }
  }, [data, isLoading]);

  // Fetch Live Prices for Open Trades and Watchlist
  useEffect(() => {
    if (isLoading) return;

    const fetchPrices = async () => {
      const tickersToFetch = new Set<string>();
      data.trades.filter(t => t.status === 'open').forEach(t => tickersToFetch.add(t.ticker));
      data.watchlist.forEach(w => tickersToFetch.add(w.ticker));

      if (tickersToFetch.size === 0) return;

      const newPrices: Record<string, number> = {};
      
      for (const ticker of tickersToFetch) {
        try {
          // Add .IS for Borsa Istanbul
          const response = await fetch(`/api/finance/v8/finance/chart/${ticker}.IS`);
          const result = await response.json();
          if (result.chart?.result?.[0]?.meta?.regularMarketPrice) {
            newPrices[ticker] = result.chart.result[0].meta.regularMarketPrice;
          }
        } catch (error) {
          console.error(`Failed to fetch price for ${ticker}`, error);
        }
      }
      
      if (Object.keys(newPrices).length > 0) {
        setLivePrices(prev => ({ ...prev, ...newPrices }));
      }
    };

    fetchPrices();
    
    // Refresh every 60 seconds
    const interval = setInterval(fetchPrices, 60000);
    return () => clearInterval(interval);
  }, [data.trades, data.watchlist, isLoading]);

  const loginWithGoogle = async () => {
    // Mock login for now
    alert('Google Girişi (Firebase Entegrasyonu Gerektirir)');
    setUser({ displayName: 'Demo Kullanıcı', email: 'demo@example.com', photoURL: '' });
  };

  const logout = async () => {
    setUser(null);
  };

  const addTrade = useCallback((trade: Trade) => {
    setData(prev => ({ ...prev, trades: [...prev.trades, trade] }));
  }, []);

  const updateTrade = useCallback((trade: Trade) => {
    setData(prev => ({
      ...prev,
      trades: prev.trades.map(t => t.id === trade.id ? trade : t)
    }));
  }, []);

  const deleteTrade = useCallback((id: string) => {
    setData(prev => ({
      ...prev,
      trades: prev.trades.filter(t => t.id !== id)
    }));
  }, []);

  const addDividend = useCallback((dividend: Dividend) => {
    setData(prev => ({ ...prev, dividends: [...prev.dividends, dividend] }));
  }, []);

  const deleteDividend = useCallback((id: string) => {
    setData(prev => ({
      ...prev,
      dividends: prev.dividends.filter(d => d.id !== id)
    }));
  }, []);

  const addWatchlistItem = useCallback((item: WatchlistItem) => {
    setData(prev => ({ ...prev, watchlist: [...prev.watchlist, item] }));
  }, []);

  const deleteWatchlistItem = useCallback((id: string) => {
    setData(prev => ({
      ...prev,
      watchlist: prev.watchlist.filter(w => w.id !== id)
    }));
  }, []);

  const updateTargetPortfolio = useCallback((target: number) => {
    setData(prev => ({
      ...prev,
      settings: { ...prev.settings, targetPortfolioValue: target }
    }));
  }, []);

  const injectDemoData = useCallback(() => {
    const demo = generateDemoData();
    setData(prev => ({
      ...prev,
      trades: [...prev.trades, ...demo.trades],
      dividends: [...prev.dividends, ...demo.dividends],
      watchlist: [...prev.watchlist, ...demo.watchlist]
    }));
  }, []);

  const clearAllData = useCallback(() => {
    if (confirm('Tüm veriler silinecek. Emin misiniz?')) {
      setData(defaultUserData);
    }
  }, []);

  return (
    <DataContext.Provider value={{
      data, isLoading, user,
      loginWithGoogle, logout,
      addTrade, updateTrade, deleteTrade,
      addDividend, deleteDividend,
      addWatchlistItem, deleteWatchlistItem,
      updateTargetPortfolio,
      injectDemoData, clearAllData,
      livePrices
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
