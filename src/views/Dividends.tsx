import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { AutocompleteInput } from '../components/AutocompleteInput';
import { useCurrency } from '../context/CurrencyContext';
import { Plus, Trash2, DollarSign } from 'lucide-react';
import { Dividend } from '../types';
import { BIST_STOCKS } from '../utils/bistStocks';

export const Dividends: React.FC = () => {
  const { data, addDividend, deleteDividend } = useData();
  const { formatCurrency, currency } = useCurrency();
  const [formData, setFormData] = useState<Partial<Dividend>>({
    ticker: '', amount: 0, date: new Date().toISOString().split('T')[0], note: ''
  });

  const handleSave = () => {
    if (!formData.ticker || !formData.amount) return;
    
    addDividend({
      id: `d_${Date.now()}`,
      ticker: formData.ticker.toUpperCase(),
      amount: Number(formData.amount),
      date: formData.date || new Date().toISOString().split('T')[0],
      note: formData.note
    });
    
    setFormData({ ticker: '', amount: 0, date: new Date().toISOString().split('T')[0], note: '' });
  };

  const totalDividends = data.dividends.reduce((sum, d) => sum + d.amount, 0);

  return (
    <div className="flex flex-col md:flex-row gap-6">
      <div className="w-full md:w-1/3 flex flex-col gap-6">
        <Card className="flex flex-col gap-4">
          <h2 className="text-xl font-bold flex items-center gap-2"><Plus size={20} className="text-primary" /> Temettü Ekle</h2>
          <AutocompleteInput 
            label="Hisse Kodu" 
            value={formData.ticker} 
            onChange={e => setFormData({...formData, ticker: e.target.value.toUpperCase()})}
            onSelectOption={val => setFormData({...formData, ticker: val})}
            options={BIST_STOCKS.map(s => ({ label: s.name, value: s.symbol }))}
          />
          <Input label={`Tutar (${currency === 'TRY' ? '₺' : '$'})`} type="number" step="0.01" value={formData.amount || ''} onChange={e => setFormData({...formData, amount: Number(e.target.value)})} />
          <Input label="Tarih" type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
          <Input label="Not" value={formData.note || ''} onChange={e => setFormData({...formData, note: e.target.value})} />
          <Button onClick={handleSave} className="mt-2">Kaydet</Button>
        </Card>

        <Card className="bg-gradient-to-br from-[#10b981]/10 to-transparent border-[#10b981]/20">
          <h3 className="text-sm font-medium text-[var(--text-muted)]">Toplam Temettü Geliri</h3>
          <div className="text-3xl font-bold mt-2 text-[#10b981]">{formatCurrency(totalDividends)}</div>
        </Card>
      </div>

      <div className="w-full md:w-2/3 flex flex-col gap-4">
        <h2 className="text-xl font-bold">Temettü Geçmişi</h2>
        {data.dividends.length === 0 ? (
          <div className="py-12 text-center text-[var(--text-muted)] flex flex-col items-center gap-2 bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)]">
            <DollarSign size={48} className="opacity-20" />
            <p>Henüz temettü kaydı bulunmuyor.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {data.dividends.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(d => (
              <Card key={d.id} className="flex items-center justify-between p-4 py-3">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-[#f59e0b]/20 text-[#f59e0b] flex items-center justify-center">
                    <DollarSign size={20} />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-bold text-lg">{d.ticker}</span>
                    <span className="text-xs text-[var(--text-muted)]">{d.date} {d.note ? `• ${d.note}` : ''}</span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-bold text-[#10b981] text-lg">+{formatCurrency(d.amount)}</span>
                  <button onClick={() => deleteDividend(d.id)} className="p-2 text-[var(--text-muted)] hover:text-[#f43f5e] transition-colors rounded-full hover:bg-[var(--bg-main)]">
                    <Trash2 size={18} />
                  </button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
