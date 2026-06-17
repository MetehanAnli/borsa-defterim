import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { AutocompleteInput } from '../components/AutocompleteInput';
import { Badge } from '../components/Badge';
import { useCurrency } from '../context/CurrencyContext';
import { getMockLivePrice } from '../utils/demoData';
import { BIST_STOCKS } from '../utils/bistStocks';
import { Plus, Trash2, Eye, Target } from 'lucide-react';
import { WatchlistItem } from '../types';

export const Watchlist: React.FC = () => {
  const { data, addWatchlistItem, deleteWatchlistItem, livePrices } = useData();
  const { formatCurrency } = useCurrency();
  const [formData, setFormData] = useState<Partial<WatchlistItem>>({
    ticker: '', targetPrice: 0, note: ''
  });

  const getPrice = (ticker: string) => livePrices[ticker] || getMockLivePrice(ticker, 0);

  const handleSave = () => {
    if (!formData.ticker || !formData.targetPrice) return;
    
    addWatchlistItem({
      id: `w_${Date.now()}`,
      ticker: formData.ticker.toUpperCase(),
      targetPrice: Number(formData.targetPrice),
      note: formData.note
    });
    
    setFormData({ ticker: '', targetPrice: 0, note: '' });
  };

  return (
    <div className="flex flex-col md:flex-row gap-6">
      <div className="w-full md:w-1/3 flex flex-col gap-6">
        <Card className="flex flex-col gap-4">
          <h2 className="text-xl font-bold flex items-center gap-2"><Eye size={20} className="text-primary" /> İzleme Listesine Ekle</h2>
          <AutocompleteInput 
            label="Hisse Kodu" 
            value={formData.ticker} 
            onChange={e => setFormData({...formData, ticker: e.target.value.toUpperCase()})}
            onSelectOption={val => setFormData({...formData, ticker: val})}
            options={BIST_STOCKS.map(s => ({ label: s.name, value: s.symbol }))}
          />
          <Input label="Hedef Fiyat (Alım)" type="number" step="0.01" value={formData.targetPrice || ''} onChange={e => setFormData({...formData, targetPrice: Number(e.target.value)})} />
          <Input label="Not" value={formData.note || ''} onChange={e => setFormData({...formData, note: e.target.value})} />
          <Button onClick={handleSave} className="mt-2">Listeye Ekle</Button>
        </Card>
      </div>

      <div className="w-full md:w-2/3 flex flex-col gap-4">
        <h2 className="text-xl font-bold">Takip Edilen Hisseler</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {data.watchlist.length === 0 ? (
            <div className="col-span-full py-12 text-center text-[var(--text-muted)] flex flex-col items-center gap-2 bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)]">
              <Eye size={48} className="opacity-20" />
              <p>İzleme listeniz boş.</p>
            </div>
          ) : (
            data.watchlist.map(item => {
              const livePrice = getPrice(item.ticker);
              const distance = livePrice > 0 ? ((livePrice - item.targetPrice) / livePrice) * 100 : 0;
              const isNearTarget = livePrice > 0 && distance <= 5 && distance >= -5;

              return (
                <Card key={item.id} hoverEffect className="flex flex-col gap-3 relative">
                  <div className="flex justify-between items-start">
                    <span className="font-bold text-xl">{item.ticker}</span>
                    <button onClick={() => deleteWatchlistItem(item.id)} className="text-[var(--text-muted)] hover:text-[#f43f5e] transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex flex-col">
                      <span className="text-[var(--text-muted)] text-xs flex items-center gap-1"><Target size={12}/> Hedef</span>
                      <span className="font-semibold">{formatCurrency(item.targetPrice)}</span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-[var(--text-muted)] text-xs">Güncel</span>
                      <span className="font-semibold">{livePrice > 0 ? formatCurrency(livePrice) : '-'}</span>
                    </div>
                  </div>

                  {item.note && <p className="text-xs text-[var(--text-muted)] italic mt-1 border-t border-[var(--border-color)] pt-2">"{item.note}"</p>}
                  
                  {isNearTarget && (
                    <Badge variant="warning" className="absolute -top-2 -right-2 animate-bounce shadow-md">Hedefe Yakın</Badge>
                  )}
                </Card>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
