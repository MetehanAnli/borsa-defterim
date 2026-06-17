import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { UserData, defaultUserData, Trade, Dividend, WatchlistItem, IpoData } from '../types';
import { generateDemoData } from '../utils/demoData';
import { db } from '../utils/firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot } from 'firebase/firestore';
import { auth, googleProvider } from '../utils/firebase';
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';

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
  ipos: IpoData[];
  addIpo: (ipo: Omit<IpoData, 'id'>) => Promise<void>;
  updateIpo: (ipo: IpoData) => Promise<void>;
  deleteIpo: (id: string) => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'borsa-defterim-data';

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [data, setData] = useState<UserData>(defaultUserData);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any | null>(null);

  useEffect(() => {
    try {
      const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
        if (currentUser && currentUser.email !== 'metehananli@gmail.com') {
          alert('Yetkisiz giriş! Sadece yönetici yetkisine sahip hesaplar bu panele erişebilir.');
          await signOut(auth);
          setUser(null);
        } else {
          setUser(currentUser);
        }
      });
      return () => unsubscribe();
    } catch(e) {}
  }, []);
  const [livePrices, setLivePrices] = useState<Record<string, number>>({});
  const [ipos, setIpos] = useState<IpoData[]>([]);

  // Listen to IPOs from Firebase
  useEffect(() => {
    try {
      const unsubscribe = onSnapshot(collection(db, 'ipos'), (snapshot) => {
        const ipoList: IpoData[] = [];
        snapshot.forEach((docSnap) => {
          ipoList.push({ id: docSnap.id, ...docSnap.data() } as IpoData);
        });
        setIpos(ipoList);
      }, (error) => {
        console.error("Firebase IPO listener error (check config):", error);
      });
      return () => unsubscribe();
    } catch (e) {
      console.warn("Firebase not properly configured yet.");
    }
  }, []);

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
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      console.error("Google login failed", error);
      alert(`Giriş hatası detayları: ${error.message || error}`);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout failed", error);
    }
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

  const addIpo = async (ipo: Omit<IpoData, 'id'>) => {
    try {
      await addDoc(collection(db, 'ipos'), ipo);
    } catch (e) {
      console.error("Error adding IPO", e);
      alert("Halka arz eklenemedi. Firebase ayarlarını kontrol edin.");
    }
  };

  const updateIpo = async (ipo: IpoData) => {
    try {
      const { id, ...data } = ipo;
      await updateDoc(doc(db, 'ipos', id), data as any);
    } catch (e) {
      console.error("Error updating IPO", e);
    }
  };

  const deleteIpo = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'ipos', id));
    } catch (e) {
      console.error("Error deleting IPO", e);
    }
  };

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
      livePrices,
      ipos, addIpo, updateIpo, deleteIpo
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
