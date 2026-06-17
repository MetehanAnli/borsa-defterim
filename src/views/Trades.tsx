import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { Input } from '../components/Input';
import { AutocompleteInput } from '../components/AutocompleteInput';
import { calculateProfitAmount, calculateProfitRatio, formatPercentage } from '../utils/math';
import { useCurrency } from '../context/CurrencyContext';
import { getMockLivePrice } from '../utils/demoData';
import { BIST_STOCKS } from '../utils/bistStocks';
import { Plus, Trash2, Edit3, CheckCircle2, AlertCircle, ArrowRightLeft } from 'lucide-react';
import { Trade } from '../types';
import { motion } from 'motion/react';

export const Trades: React.FC = () => {
  const { data, addTrade, deleteTrade, updateTrade, livePrices } = useData();
  const { formatCurrency } = useCurrency();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteConfirmationId, setDeleteConfirmationId] = useState<string | null>(null);
  const [addPositionData, setAddPositionData] = useState<{ tradeId: string; ticker: string; addedPrice: number; addedLot: number; addedCommission: number; } | null>(null);

  const getPrice = (ticker: string, buyPrice: number) => livePrices[ticker] || getMockLivePrice(ticker, buyPrice);
  const [formData, setFormData] = useState<Partial<Trade>>({
    ticker: '', buyPrice: 0, sellPrice: undefined, lot: 1, commission: 0, sector: 'Diğer', date: new Date().toISOString().split('T')[0], status: 'open'
  });

  const handleSave = () => {
    if (!formData.ticker || !formData.buyPrice || !formData.lot) return;
    
    const newTrade: Trade = {
      id: formData.id || `t_${Date.now()}`,
      ticker: formData.ticker.toUpperCase(),
      buyPrice: Number(formData.buyPrice),
      sellPrice: formData.sellPrice ? Number(formData.sellPrice) : undefined,
      lot: Number(formData.lot),
      commission: Number(formData.commission) || 0,
      sector: formData.sector || 'Diğer',
      date: formData.date || new Date().toISOString().split('T')[0],
      targetPrice: formData.targetPrice ? Number(formData.targetPrice) : undefined,
      stopLoss: formData.stopLoss ? Number(formData.stopLoss) : undefined,
      note: formData.note,
      status: formData.sellPrice ? 'closed' : 'open'
    };

    if (formData.id) {
      updateTrade(newTrade);
    } else {
      addTrade(newTrade);
    }
    
    setIsModalOpen(false);
    setFormData({ ticker: '', buyPrice: 0, sellPrice: undefined, lot: 1, commission: 0, sector: 'Diğer', date: new Date().toISOString().split('T')[0], status: 'open' });
  };

  const handleAddPositionSave = () => {
    if (!addPositionData || !addPositionData.addedPrice || !addPositionData.addedLot) return;
    
    const trade = data.trades.find(t => t.id === addPositionData.tradeId);
    if (!trade) return;

    const newLot = trade.lot + Number(addPositionData.addedLot);
    const newBuyPrice = ((trade.buyPrice * trade.lot) + (Number(addPositionData.addedPrice) * Number(addPositionData.addedLot))) / newLot;
    const newCommission = trade.commission + Number(addPositionData.addedCommission);

    updateTrade({
      ...trade,
      lot: newLot,
      buyPrice: newBuyPrice,
      commission: newCommission
    });

    setAddPositionData(null);
  };

  const openTradeModal = (trade?: Trade) => {
    if (trade) {
      setFormData(trade);
    } else {
      setFormData({ ticker: '', buyPrice: 0, sellPrice: undefined, lot: 1, commission: 0, sector: 'Diğer', date: new Date().toISOString().split('T')[0], status: 'open' });
    }
    setIsModalOpen(true);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">İşlemler</h2>
        <Button onClick={() => openTradeModal()}><Plus size={18} /> Yeni İşlem</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data.trades.map(trade => {
          const isClosed = trade.status === 'closed';
          const livePrice = isClosed ? trade.sellPrice! : getPrice(trade.ticker, trade.buyPrice);
          const pnl = calculateProfitAmount(trade.buyPrice, livePrice, trade.lot, trade.commission);
          const ratio = calculateProfitRatio(trade.buyPrice, livePrice);
          const isProfit = pnl >= 0;

          const hitTarget = trade.targetPrice && livePrice >= trade.targetPrice;
          const hitStopLoss = trade.stopLoss && livePrice <= trade.stopLoss;

          return (
            <Card key={trade.id} hoverEffect className={`relative flex flex-col gap-4 ${!isClosed ? 'border-[#10b981]/30 ring-1 ring-[#10b981]/10' : ''}`}>
              {!isClosed && <div className="absolute top-0 right-0 w-2 h-2 rounded-full bg-[#10b981] m-4 animate-pulse" title="Açık Pozisyon" />}
              
              <div className="flex justify-between items-start">
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-bold">{trade.ticker}</span>
                    <Badge variant={isClosed ? 'default' : 'info'}>{isClosed ? 'Kapalı' : 'Açık'}</Badge>
                  </div>
                  <span className="text-sm text-[var(--text-muted)]">{trade.sector} • {trade.date}</span>
                </div>
                <div className="flex gap-1">
                  {!isClosed && (
                    <button onClick={() => setAddPositionData({ tradeId: trade.id, ticker: trade.ticker, addedPrice: 0, addedLot: 0, addedCommission: 0 })} className="p-1.5 text-[var(--text-muted)] hover:text-[#10b981] transition-colors" title="Ek Alım Yap"><Plus size={16} /></button>
                  )}
                  <button onClick={() => openTradeModal(trade)} className="p-1.5 text-[var(--text-muted)] hover:text-blue-500 transition-colors" title="Düzenle"><Edit3 size={16} /></button>
                  <button onClick={() => setDeleteConfirmationId(trade.id)} className="p-1.5 text-[var(--text-muted)] hover:text-[#f43f5e] transition-colors" title="Sil"><Trash2 size={16} /></button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-sm bg-[var(--bg-main)] p-3 rounded-xl">
                <div className="flex flex-col"><span className="text-[var(--text-muted)] text-xs">Alış</span><span className="font-medium">{formatCurrency(trade.buyPrice)}</span></div>
                <div className="flex flex-col items-center"><span className="text-[var(--text-muted)] text-xs">Hedef</span><span className="font-medium text-[#10b981]">{trade.targetPrice ? formatCurrency(trade.targetPrice) : '-'}</span></div>
                <div className="flex flex-col items-end"><span className="text-[var(--text-muted)] text-xs">{isClosed ? 'Satış' : 'Güncel'}</span><span className="font-medium">{formatCurrency(livePrice)}</span></div>
                
                <div className="flex flex-col"><span className="text-[var(--text-muted)] text-xs">Lot</span><span className="font-medium">{trade.lot}</span></div>
                <div className="flex flex-col items-center"><span className="text-[var(--text-muted)] text-xs">Stop</span><span className="font-medium text-[#f43f5e]">{trade.stopLoss ? formatCurrency(trade.stopLoss) : '-'}</span></div>
                <div className="flex flex-col items-end">
                  <span className="text-[var(--text-muted)] text-xs">K/Z</span>
                  <span className={`font-bold ${isProfit ? 'text-[#10b981]' : 'text-[#f43f5e]'}`}>
                    {formatCurrency(pnl)} ({formatPercentage(ratio)})
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mt-auto pt-2">
                {!isClosed && hitTarget && <Badge variant="success" className="w-full justify-center py-1.5"><CheckCircle2 size={14} /> HEDEF GÖRÜLDÜ</Badge>}
                {!isClosed && hitStopLoss && <Badge variant="danger" className="w-full justify-center py-1.5"><AlertCircle size={14} /> STOP-LOSS</Badge>}
                {trade.note && <p className="text-xs text-[var(--text-muted)] italic w-full">"{trade.note}"</p>}
              </div>
            </Card>
          );
        })}
        {data.trades.length === 0 && (
          <div className="col-span-full py-12 text-center text-[var(--text-muted)] flex flex-col items-center gap-2">
            <ArrowRightLeft size={48} className="opacity-20" />
            <p>Henüz işlem bulunmuyor.</p>
          </div>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={formData.id ? "İşlemi Düzenle" : "Yeni İşlem Ekle"}>
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <AutocompleteInput 
              label="Hisse Kodu" 
              value={formData.ticker} 
              onChange={e => setFormData({...formData, ticker: e.target.value.toUpperCase()})}
              onSelectOption={val => setFormData({...formData, ticker: val})}
              options={BIST_STOCKS.map(s => ({ label: s.name, value: s.symbol }))}
              placeholder="örn. THYAO" 
            />
            <Input label="Sektör" value={formData.sector} onChange={e => setFormData({...formData, sector: e.target.value})} placeholder="örn. Bankacılık" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Alış Fiyatı" type="number" step="0.01" value={formData.buyPrice || ''} onChange={e => setFormData({...formData, buyPrice: Number(e.target.value)})} />
            <Input label="Satış Fiyatı" type="number" step="0.01" value={formData.sellPrice || ''} onChange={e => setFormData({...formData, sellPrice: e.target.value ? Number(e.target.value) : undefined})} placeholder="Boş = Açık Pozisyon" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Lot Sayısı" type="number" value={formData.lot || ''} onChange={e => setFormData({...formData, lot: Number(e.target.value)})} />
            <Input label="Komisyon" type="number" step="0.01" value={formData.commission || ''} onChange={e => setFormData({...formData, commission: Number(e.target.value)})} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Hedef Fiyat" type="number" step="0.01" value={formData.targetPrice || ''} onChange={e => setFormData({...formData, targetPrice: e.target.value ? Number(e.target.value) : undefined})} />
            <Input label="Stop-Loss" type="number" step="0.01" value={formData.stopLoss || ''} onChange={e => setFormData({...formData, stopLoss: e.target.value ? Number(e.target.value) : undefined})} />
          </div>
          <Input label="İşlem Tarihi" type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
          <Input label="Not" value={formData.note || ''} onChange={e => setFormData({...formData, note: e.target.value})} />
          
          <Button onClick={handleSave} className="mt-4" size="lg">Kaydet</Button>
        </div>
      </Modal>

      <Modal isOpen={!!deleteConfirmationId} onClose={() => setDeleteConfirmationId(null)} title="İşlemi Sil">
        <div className="flex flex-col gap-4">
          <p className="text-[var(--text-main)] font-medium">Bu işlemi silmek istediğinize emin misiniz?</p>
          <p className="text-sm text-[var(--text-muted)]">Yanlışlıkla silinmesini önlemek için onayınız gerekiyor. Bu işlem geri alınamaz.</p>
          <div className="flex gap-3 justify-end mt-4">
            <Button variant="secondary" onClick={() => setDeleteConfirmationId(null)}>İptal</Button>
            <Button variant="danger" onClick={() => {
              if (deleteConfirmationId) deleteTrade(deleteConfirmationId);
              setDeleteConfirmationId(null);
            }}>Evet, Sil</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={!!addPositionData} onClose={() => setAddPositionData(null)} title={`${addPositionData?.ticker} Ek Alım Yap`}>
        <div className="flex flex-col gap-4">
          <p className="text-sm text-[var(--text-muted)] mb-2">Hissenin yeni maliyeti ve toplam lot sayısı ağırlıklı ortalama alınarak otomatik hesaplanacaktır.</p>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Eklenen Fiyat" type="number" step="0.01" value={addPositionData?.addedPrice || ''} onChange={e => setAddPositionData(prev => prev ? {...prev, addedPrice: Number(e.target.value)} : null)} />
            <Input label="Eklenen Lot" type="number" value={addPositionData?.addedLot || ''} onChange={e => setAddPositionData(prev => prev ? {...prev, addedLot: Number(e.target.value)} : null)} />
          </div>
          <Input label="Eklenen Komisyon (İsteğe Bağlı)" type="number" step="0.01" value={addPositionData?.addedCommission || ''} onChange={e => setAddPositionData(prev => prev ? {...prev, addedCommission: Number(e.target.value)} : null)} />
          
          <Button onClick={handleAddPositionSave} className="mt-2" size="lg">Ortalamayı Güncelle</Button>
        </div>
      </Modal>
    </div>
  );
};
