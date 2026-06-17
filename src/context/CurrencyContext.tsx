import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

type Currency = 'TRY' | 'USD';

interface CurrencyContextType {
  currency: Currency;
  toggleCurrency: () => void;
  usdRate: number;
  formatCurrency: (amount: number) => string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currency, setCurrency] = useState<Currency>(() => {
    const saved = localStorage.getItem('borsa-currency');
    return (saved === 'TRY' || saved === 'USD') ? saved : 'TRY';
  });
  
  const [usdRate, setUsdRate] = useState<number>(32.5); // Fallback rate

  useEffect(() => {
    // Fetch live USD to TRY rate
    fetch('https://api.exchangerate-api.com/v4/latest/USD')
      .then(res => res.json())
      .then(data => {
        if (data && data.rates && data.rates.TRY) {
          setUsdRate(data.rates.TRY);
        }
      })
      .catch(err => console.error("Could not fetch exchange rate:", err));
  }, []);

  useEffect(() => {
    localStorage.setItem('borsa-currency', currency);
  }, [currency]);

  const toggleCurrency = () => {
    setCurrency(prev => (prev === 'TRY' ? 'USD' : 'TRY'));
  };

  const formatCurrency = useCallback((amount: number) => {
    if (currency === 'USD' && usdRate > 0) {
      return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount / usdRate);
    }
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);
  }, [currency, usdRate]);

  return (
    <CurrencyContext.Provider value={{ currency, toggleCurrency, usdRate, formatCurrency }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};
