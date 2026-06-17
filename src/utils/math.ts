import { Trade } from '../types';

export const calculateProfitRatio = (buyPrice: number, currentOrSellPrice: number): number => {
  if (buyPrice <= 0) return 0;
  return ((currentOrSellPrice - buyPrice) / buyPrice) * 100;
};

export const calculateProfitAmount = (buyPrice: number, currentOrSellPrice: number, lot: number, commission: number = 0): number => {
  return ((currentOrSellPrice - buyPrice) * lot) - commission;
};

export const calculateTotalProfitRatio = (trades: Trade[], getLivePrice: (ticker: string) => number): number => {
  // Toplam Kar Oranı: Tüm işlemlerin kar yüzdelerinin direkt toplamı (Sum of percentages)
  let totalRatio = 0;
  trades.forEach(trade => {
    const currentPrice = trade.status === 'open' ? getLivePrice(trade.ticker) : (trade.sellPrice || trade.buyPrice);
    totalRatio += calculateProfitRatio(trade.buyPrice, currentPrice);
  });
  return totalRatio;
};

export const calculateAverageProfitRatio = (trades: Trade[], getLivePrice: (ticker: string) => number): number => {
  if (trades.length === 0) return 0;
  const total = calculateTotalProfitRatio(trades, getLivePrice);
  return total / trades.length;
};



export const formatPercentage = (ratio: number): string => {
  return `${ratio > 0 ? '+' : ''}${ratio.toFixed(2)}%`;
};
