import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { calculateProfitAmount, calculateProfitRatio, formatPercentage, calculateTotalProfitRatio, calculateAverageProfitRatio } from '../utils/math';
import { useCurrency } from '../context/CurrencyContext';
import { getMockLivePrice } from '../utils/demoData';
import { TrendingUp, TrendingDown, Wallet, DollarSign, Activity, PackageOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AnimatedNumber } from '../components/AnimatedNumber';

export const Dashboard: React.FC = () => {
  const { data, livePrices } = useData();
  const { formatCurrency } = useCurrency();
  const [profitMode, setProfitMode] = useState<'total' | 'average'>('total');

  const getPrice = (ticker: string, buyPrice: number) => livePrices[ticker] || getMockLivePrice(ticker, buyPrice);

  // Metrics calculations
  const openTrades = data.trades.filter(t => t.status === 'open');
  
  const portfolioValue = openTrades.reduce((sum, t) => {
    const livePrice = getPrice(t.ticker, t.buyPrice);
    return sum + (livePrice * t.lot);
  }, 0);

  const realizedProfit = data.trades.filter(t => t.status === 'closed').reduce((sum, t) => {
    return sum + calculateProfitAmount(t.buyPrice, t.sellPrice!, t.lot, t.commission);
  }, 0);

  const unrealizedProfit = openTrades.reduce((sum, t) => {
    const livePrice = getPrice(t.ticker, t.buyPrice);
    return sum + calculateProfitAmount(t.buyPrice, livePrice, t.lot, t.commission);
  }, 0);

  const totalDividends = data.dividends.reduce((sum, d) => sum + d.amount, 0);
  const netProfitTotal = realizedProfit + unrealizedProfit + totalDividends;
  const netProfitAvg = data.trades.length ? netProfitTotal / data.trades.length : 0;

  const profitRatioTotal = calculateTotalProfitRatio(data.trades, (t) => getPrice(t, 0));
  const profitRatioAvg = calculateAverageProfitRatio(data.trades, (t) => getPrice(t, 0));

  const MetricCard = ({ title, rawValue, formatter, icon: Icon, trend, onToggle, toggleLabel }: any) => (
    <Card className="relative overflow-hidden group h-full flex flex-col justify-center">
      <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
        <Icon size={64} />
      </div>
      <div className="flex flex-col gap-2 relative z-10">
        <div className="flex items-center justify-between">
          <span className="text-[var(--text-muted)] font-medium text-sm">{title}</span>
          {onToggle && (
            <button 
              onClick={onToggle}
              className="text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded bg-[var(--bg-main)] text-[var(--text-muted)] hover:text-primary transition-colors"
            >
              {toggleLabel}
            </button>
          )}
        </div>
        <AnimatedNumber value={rawValue} formatter={formatter} className="text-3xl font-extrabold bg-gradient-to-r from-[var(--text-main)] to-[var(--text-muted)] bg-clip-text text-transparent" />
        {trend !== undefined && (
          <div className="flex items-center gap-1 mt-1">
            {trend > 0 ? <TrendingUp size={14} className="text-[#10b981]" /> : trend < 0 ? <TrendingDown size={14} className="text-[#f43f5e]" /> : null}
            <span className={`text-sm font-semibold ${trend > 0 ? 'text-[#10b981]' : trend < 0 ? 'text-[#f43f5e]' : 'text-[var(--text-muted)]'}`}>
              {trend > 0 ? '+' : ''}{trend.toFixed(2)}%
            </span>
          </div>
        )}
      </div>
    </Card>
  );

  return (
    <motion.div 
      initial="hidden" animate="visible" 
      variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } }}
      className="flex flex-col gap-6"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div className="h-full" variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}>
          <MetricCard title="Portföy Değeri" rawValue={portfolioValue} formatter={formatCurrency} icon={Wallet} />
        </motion.div>
        <motion.div className="h-full" variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}>
          <MetricCard
            title="Net Kar/Zarar"
            rawValue={profitMode === 'total' ? netProfitTotal : netProfitAvg}
            formatter={formatCurrency}
            icon={DollarSign}
            onToggle={() => setProfitMode(p => p === 'total' ? 'average' : 'total')}
            toggleLabel={profitMode === 'total' ? 'TOTAL' : 'AVG'}
          />
        </motion.div>
        <motion.div className="h-full" variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}>
          <MetricCard
            title="Kar Oranı"
            rawValue={profitMode === 'total' ? profitRatioTotal : profitRatioAvg}
            formatter={formatPercentage}
            icon={Activity}
            onToggle={() => setProfitMode(p => p === 'total' ? 'average' : 'total')}
            toggleLabel={profitMode === 'total' ? 'TOTAL' : 'AVG'}
            trend={profitMode === 'total' ? profitRatioTotal : profitRatioAvg}
          />
        </motion.div>
        <motion.div className="h-full" variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}>
          <MetricCard title="Temettü Geliri" rawValue={totalDividends} formatter={formatCurrency} icon={DollarSign} toggleLabel={`${data.dividends.length} İşlem`} />
        </motion.div>
      </div>

      {data.settings.targetPortfolioValue > 0 && (
        <Card className="flex flex-col gap-3">
          <div className="flex justify-between items-center text-sm">
            <span className="font-medium text-[var(--text-muted)]">Portföy Hedefi İlerlemesi</span>
            <span className="font-bold">{formatCurrency(portfolioValue)} / {formatCurrency(data.settings.targetPortfolioValue)}</span>
          </div>
          <div className="h-4 w-full bg-[var(--bg-main)] rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, (portfolioValue / data.settings.targetPortfolioValue) * 100)}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="h-full bg-gradient-to-r from-[#10b981] to-[#059669]"
            />
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 flex flex-col gap-4">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <Activity size={18} className="text-primary" />
            Aktif Pozisyonlar
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-[var(--text-muted)] uppercase bg-[var(--bg-main)]">
                <tr>
                  <th className="px-4 py-3 rounded-l-lg">Hisse</th>
                  <th className="px-4 py-3">Maliyet</th>
                  <th className="px-4 py-3">Güncel</th>
                  <th className="px-4 py-3">Hedef</th>
                  <th className="px-4 py-3 text-right rounded-r-lg">Kar/Zarar</th>
                </tr>
              </thead>
              <tbody>
                {openTrades.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-16 text-center">
                      <div className="flex flex-col items-center justify-center gap-3 text-[var(--text-muted)]">
                        <div className="w-16 h-16 rounded-full bg-[var(--bg-main)] flex items-center justify-center border border-[var(--border-color)]">
                          <PackageOpen size={32} className="opacity-50" />
                        </div>
                        <p className="font-medium">Henüz aktif bir pozisyonunuz bulunmuyor.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  openTrades.map(trade => {
                    const livePrice = getPrice(trade.ticker, trade.buyPrice);
                    const pnl = calculateProfitAmount(trade.buyPrice, livePrice, trade.lot, trade.commission);
                    const ratio = calculateProfitRatio(trade.buyPrice, livePrice);
                    const isProfit = pnl >= 0;

                    return (
                      <tr key={trade.id} className="border-b border-[var(--border-color)] last:border-0 hover:bg-[var(--bg-main)] transition-colors">
                        <td className="px-4 py-3 font-semibold">{trade.ticker}</td>
                        <td className="px-4 py-3">{formatCurrency(trade.buyPrice)}</td>
                        <td className="px-4 py-3">{formatCurrency(livePrice)}</td>
                        <td className="px-4 py-3 font-medium text-[#10b981]">{trade.targetPrice ? formatCurrency(trade.targetPrice) : '-'}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex flex-col items-end">
                            <span className={isProfit ? 'text-[#10b981] font-medium' : 'text-[#f43f5e] font-medium'}>
                              {formatCurrency(pnl)}
                            </span>
                            <span className={`text-xs ${isProfit ? 'text-[#10b981]' : 'text-[#f43f5e]'}`}>
                              {formatPercentage(ratio)}
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="flex flex-col gap-4">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <TrendingUp size={18} className="text-primary" />
            En İyi 5 İşlem
          </h3>
          <div className="flex flex-col gap-3">
            {[...data.trades]
              .sort((a, b) => {
                const aPrice = a.status === 'open' ? getPrice(a.ticker, a.buyPrice) : a.sellPrice!;
                const bPrice = b.status === 'open' ? getPrice(b.ticker, b.buyPrice) : b.sellPrice!;
                return calculateProfitRatio(b.buyPrice, bPrice) - calculateProfitRatio(a.buyPrice, aPrice);
              })
              .slice(0, 5)
              .map((trade, idx) => {
                const currentPrice = trade.status === 'open' ? getPrice(trade.ticker, trade.buyPrice) : trade.sellPrice!;
                const ratio = calculateProfitRatio(trade.buyPrice, currentPrice);
                return (
                  <div key={trade.id} className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-main)]">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-[var(--bg-card)] flex items-center justify-center text-xs font-bold text-[var(--text-muted)] border border-[var(--border-color)]">
                        {idx + 1}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-semibold text-sm">{trade.ticker}</span>
                        <span className="text-[10px] text-[var(--text-muted)] uppercase">{trade.status === 'open' ? 'Açık' : 'Kapalı'}</span>
                      </div>
                    </div>
                    <Badge variant={ratio > 0 ? 'success' : ratio < 0 ? 'danger' : 'default'}>
                      {formatPercentage(ratio)}
                    </Badge>
                  </div>
                );
              })}
              {data.trades.length === 0 && (
                <div className="text-center text-sm text-[var(--text-muted)] py-4">İşlem verisi yok.</div>
              )}
          </div>
        </Card>
      </div>
    </motion.div>
  );
};
