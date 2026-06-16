import React, { useMemo } from 'react';
import { useData } from '../context/DataContext';
import { Card } from '../components/Card';
import { useTheme } from '../context/ThemeContext';
import { calculateProfitAmount, calculateProfitRatio } from '../utils/math';
import { getMockLivePrice } from '../utils/demoData';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

export const Analytics: React.FC = () => {
  const { data, livePrices } = useData();
  const { theme } = useTheme();

  const getPrice = (ticker: string, buyPrice: number) => livePrices[ticker] || getMockLivePrice(ticker, buyPrice);

  const textColor = theme === 'dark' ? '#94a3b8' : '#64748b';
  const gridColor = theme === 'dark' ? '#334155' : '#e2e8f0';

  // 1. Portfolio Growth (Mock cumulative based on trades over time)
  // To make it realistic, we sort closed trades by date and accumulate profit.
  const growthData = useMemo(() => {
    let cumulative = 0;
    const sorted = [...data.trades].filter(t => t.status === 'closed').sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    return sorted.map(t => {
      cumulative += calculateProfitAmount(t.buyPrice, t.sellPrice!, t.lot, t.commission);
      return {
        date: t.date,
        kümülatif: cumulative
      };
    });
  }, [data.trades]);

  // 2. Sector Distribution
  const sectorData = useMemo(() => {
    const sectors: Record<string, number> = {};
    data.trades.filter(t => t.status === 'open').forEach(t => {
      const livePrice = getPrice(t.ticker, t.buyPrice);
      sectors[t.sector] = (sectors[t.sector] || 0) + (livePrice * t.lot);
    });
    return Object.entries(sectors).map(([name, value]) => ({ name, value }));
  }, [data.trades]);

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#f43f5e'];

  // 3. Success Rate
  const successData = useMemo(() => {
    let wins = 0, losses = 0;
    data.trades.filter(t => t.status === 'closed').forEach(t => {
      if (t.sellPrice! > t.buyPrice) wins++;
      else losses++;
    });
    return [
      { name: 'Kârlı', value: wins },
      { name: 'Zararlı', value: losses }
    ];
  }, [data.trades]);

  // 4. Monthly PnL
  const monthlyData = useMemo(() => {
    const months: Record<string, number> = {};
    data.trades.filter(t => t.status === 'closed').forEach(t => {
      const month = t.date.substring(0, 7); // YYYY-MM
      months[month] = (months[month] || 0) + calculateProfitAmount(t.buyPrice, t.sellPrice!, t.lot, t.commission);
    });
    return Object.entries(months).sort((a,b) => a[0].localeCompare(b[0])).map(([name, kâr]) => ({ name, kâr }));
  }, [data.trades]);

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-2xl font-bold">Performans Analizi</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="flex flex-col gap-4">
          <h3 className="font-semibold text-lg">Portföy Büyümesi (Gerçekleşen Kâr)</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={growthData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                <XAxis dataKey="date" stroke={textColor} fontSize={12} tickMargin={10} />
                <YAxis stroke={textColor} fontSize={12} tickFormatter={(val) => `₺${val}`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)', borderRadius: '8px', color: 'var(--text-main)' }}
                  formatter={(value: number) => [`₺${value.toFixed(2)}`, 'Kümülatif Kâr']}
                />
                <Line type="monotone" dataKey="kümülatif" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: 'var(--bg-main)' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="flex flex-col gap-4">
          <h3 className="font-semibold text-lg">Aylık Kâr/Zarar</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                <XAxis dataKey="name" stroke={textColor} fontSize={12} tickMargin={10} />
                <YAxis stroke={textColor} fontSize={12} tickFormatter={(val) => `₺${val}`} />
                <Tooltip 
                  cursor={{ fill: 'var(--border-color)', opacity: 0.4 }}
                  contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)', borderRadius: '8px', color: 'var(--text-main)' }}
                  formatter={(value: number) => [`₺${value.toFixed(2)}`, 'Net Kâr/Zarar']}
                />
                <Bar dataKey="kâr" radius={[4, 4, 0, 0]}>
                  {monthlyData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.kâr >= 0 ? '#10b981' : '#f43f5e'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="flex flex-col gap-4">
          <h3 className="font-semibold text-lg">Sektörel Dağılım (Açık Pozisyonlar)</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={sectorData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="var(--bg-card)"
                  strokeWidth={2}
                >
                  {sectorData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)', borderRadius: '8px', color: 'var(--text-main)' }}
                  formatter={(value: number) => [`₺${value.toFixed(2)}`, 'Değer']}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', color: 'var(--text-main)' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="flex flex-col gap-4">
          <h3 className="font-semibold text-lg">Başarı Oranı (Kapanan İşlemler)</h3>
          <div className="h-[300px] w-full flex items-center justify-center relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={successData}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={100}
                  paddingAngle={0}
                  dataKey="value"
                  stroke="var(--bg-card)"
                  strokeWidth={2}
                >
                  <Cell fill="#10b981" />
                  <Cell fill="#f43f5e" />
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)', borderRadius: '8px', color: 'var(--text-main)' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', color: 'var(--text-main)' }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-3xl font-bold text-[var(--text-main)]">
                {successData[0].value + successData[1].value > 0 
                  ? Math.round((successData[0].value / (successData[0].value + successData[1].value)) * 100)
                  : 0}%
              </span>
              <span className="text-xs text-[var(--text-muted)] uppercase tracking-widest mt-1">Win Rate</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
