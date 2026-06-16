import { Trade, Dividend, WatchlistItem } from '../types';

export const generateDemoData = () => {
  const trades: Trade[] = [
    {
      id: 'demo-t1',
      ticker: 'THYAO',
      buyPrice: 250,
      lot: 100,
      commission: 25,
      sector: 'Ulaşım',
      date: '2025-01-15',
      targetPrice: 350,
      stopLoss: 220,
      status: 'open',
      note: 'Uzun vade yatırım'
    },
    {
      id: 'demo-t2',
      ticker: 'EREGL',
      buyPrice: 40,
      sellPrice: 50,
      lot: 500,
      commission: 20,
      sector: 'Demir Çelik',
      date: '2025-02-10',
      status: 'closed',
      note: 'Kısa vade kar satışı'
    },
    {
      id: 'demo-t3',
      ticker: 'TUPRS',
      buyPrice: 140,
      lot: 200,
      commission: 30,
      sector: 'Enerji',
      date: '2025-03-01',
      status: 'open'
    },
    {
      id: 'demo-t4',
      ticker: 'SISE',
      buyPrice: 45,
      sellPrice: 42,
      lot: 300,
      commission: 15,
      sector: 'Cam',
      date: '2025-04-05',
      status: 'closed',
      note: 'Stop-loss patladı'
    }
  ];

  const dividends: Dividend[] = [
    {
      id: 'demo-d1',
      ticker: 'EREGL',
      amount: 1500,
      date: '2025-03-15',
      note: 'Yıllık temettü ödemesi'
    },
    {
      id: 'demo-d2',
      ticker: 'TUPRS',
      amount: 2400,
      date: '2025-05-20'
    }
  ];

  const watchlist: WatchlistItem[] = [
    {
      id: 'demo-w1',
      ticker: 'FROTO',
      targetPrice: 1100,
      note: '1000 TL altına sarkarsa alım fırsatı'
    },
    {
      id: 'demo-w2',
      ticker: 'KCHOL',
      targetPrice: 250,
      note: 'Holding iskontosu cazip'
    }
  ];

  return { trades, dividends, watchlist };
};

// Mock live prices for demo open positions
export const mockLivePrices: Record<string, number> = {
  'THYAO': 295.50,
  'TUPRS': 165.20,
  'EREGL': 48.10,
  'SISE': 43.50,
  'FROTO': 1050.00,
  'KCHOL': 230.00
};

import { getLivePriceForStock } from './bistStocks';

export const getMockLivePrice = (ticker: string, fallbackPrice: number): number => {
  return mockLivePrices[ticker] || getLivePriceForStock(ticker, fallbackPrice);
};
