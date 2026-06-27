import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useData } from '../context/DataContext';
import { Card } from '../components/Card';
import { Rocket, Plus, Trash2, Users, TrendingUp, Settings as SettingsIcon, Save, X, Share2, Pencil, CalendarDays, Calendar as CalendarIcon } from 'lucide-react';
import { IpoData, IpoScenario } from '../types';
import { Modal } from '../components/Modal';
import { toPng } from 'html-to-image';

export const IPOs: React.FC = () => {
  const { ipos, user, addIpo, deleteIpo, updateIpo, livePrices } = useData();
  const [showForm, setShowForm] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [selectedIpo, setSelectedIpo] = useState<IpoData | null>(null);
  const [selectedScenarioIndex, setSelectedScenarioIndex] = useState<number>(0);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [adminEditMode, setAdminEditMode] = useState(false);
  const [adminScenarios, setAdminScenarios] = useState<IpoScenario[]>([]);
  const [adminFinalLots, setAdminFinalLots] = useState<number | ''>('');
  const [adminStatus, setAdminStatus] = useState<'Yaklaşan' | 'İşlem Görüyor'>('Yaklaşan');
  
  const [adminTotalLots, setAdminTotalLots] = useState<number | ''>('');
  const [adminDiscount, setAdminDiscount] = useState<string>('');
  const [adminFundUsage, setAdminFundUsage] = useState<string>('');
  const [adminT1T2, setAdminT1T2] = useState<boolean>(false);
  const [adminPriceStability, setAdminPriceStability] = useState<string>('');
  
  const captureRef = useRef<HTMLDivElement>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [customParticipants, setCustomParticipants] = useState<number>(1000000);

  const calculateCeilings = (price: number, lots: number) => {
    let days = [];
    let currentPrice = price;
    for (let i = 1; i <= 10; i++) {
      currentPrice = currentPrice * 1.10;
      days.push({
        day: i,
        price: currentPrice,
        totalValue: currentPrice * lots,
        profit: (currentPrice - price) * lots
      });
    }
    return days;
  };
  
  const upcomingIpos = ipos.filter(i => i.status === 'Yaklaşan');
  const tradingIpos = ipos.filter(i => i.status === 'İşlem Görüyor');

  const [formData, setFormData] = useState<Omit<IpoData, 'id'>>({
    ticker: '', companyName: '', price: 0, lotAmount: 0, 
    distributionType: 'Tamamı Eşit', dateRange: '', tradingDate: '', status: 'Yaklaşan',
    scenarios: [], finalLots: null, totalLotsForIndividuals: 0, discountRate: '',
    prospectusSummary: { fundUsage: '', t1t2: false, priceStability: '' }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      await updateIpo({ ...formData, id: editingId } as IpoData);
    } else {
      await addIpo(formData);
    }
    setShowForm(false);
    setEditingId(null);
    setFormData({ ticker: '', companyName: '', price: 0, lotAmount: 0, distributionType: 'Tamamı Eşit', dateRange: '', tradingDate: '', status: 'Yaklaşan', scenarios: [], finalLots: null, totalLotsForIndividuals: 0, discountRate: '', prospectusSummary: { fundUsage: '', t1t2: false, priceStability: '' } });
  };

  const IpoCard: React.FC<{ ipo: IpoData }> = ({ ipo }) => (
    <Card 
      onClick={() => setSelectedIpo(ipo)}
      className="flex flex-col gap-4 relative overflow-hidden group cursor-pointer hover:border-[#3b82f6]/50 transition-colors"
    >
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-bold">{ipo.ticker}</h3>
            <span className={`px-2 py-0.5 rounded text-xs font-bold ${ipo.status === 'Yaklaşan' ? 'bg-[#3b82f6]/20 text-[#3b82f6]' : 'bg-[#10b981]/20 text-[#10b981]'}`}>
              {ipo.status}
            </span>
          </div>
          <p className="text-[var(--text-muted)] text-sm mt-1">{ipo.companyName}</p>
        </div>
        <div className="text-right flex flex-col items-end">
          {ipo.status === 'İşlem Görüyor' && livePrices[ipo.ticker] ? (
            <>
              <span className="text-2xl font-extrabold bg-gradient-to-r from-[#10b981] to-[#3b82f6] bg-clip-text text-transparent">
                ₺{livePrices[ipo.ticker].toFixed(2)}
              </span>
              {livePrices[ipo.ticker] !== ipo.price && (
                <span className={`text-xs font-bold px-1.5 rounded ${livePrices[ipo.ticker] > ipo.price ? 'text-[#10b981] bg-[#10b981]/10' : 'text-red-500 bg-red-500/10'}`}>
                  {livePrices[ipo.ticker] > ipo.price ? '+' : ''}{(((livePrices[ipo.ticker] - ipo.price) / ipo.price) * 100).toFixed(2)}%
                </span>
              )}
            </>
          ) : (
            <span className="text-2xl font-extrabold bg-gradient-to-r from-[#10b981] to-[#3b82f6] bg-clip-text text-transparent">
              ₺{ipo.price.toFixed(2)}
            </span>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4 mt-2 bg-[var(--bg-main)] p-3 rounded-xl border border-[var(--border-color)]">
        <div>
          <p className="text-[10px] uppercase font-bold text-[var(--text-muted)]">Dağıtım Şekli</p>
          <p className="font-semibold text-sm">{ipo.distributionType}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase font-bold text-[var(--text-muted)]">Lot Miktarı</p>
          <p className="font-semibold text-sm">{ipo.lotAmount.toLocaleString('tr-TR')} Lot</p>
        </div>
        <div>
          <p className="text-[10px] uppercase font-bold text-[var(--text-muted)]">Arz Büyüklüğü</p>
          <p className="font-semibold text-sm">{(ipo.lotAmount * ipo.price).toLocaleString('tr-TR')} ₺</p>
        </div>
        {ipo.tradingDate ? (
          <div>
            <p className="text-[10px] uppercase font-bold text-[var(--text-muted)]">İşleme Başlama Tarihi</p>
            <p className="font-semibold text-sm text-[#10b981]">{ipo.tradingDate}</p>
          </div>
        ) : (
          <div>
            <p className="text-[10px] uppercase font-bold text-[var(--text-muted)]">Talep Toplama Tarihi</p>
            <p className="font-semibold text-sm">{ipo.dateRange}</p>
          </div>
        )}
      </div>

      {user && (
        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 flex gap-2">
          <button 
            onClick={(e) => { 
              e.stopPropagation(); 
              setEditingId(ipo.id);
              setFormData({
                ticker: ipo.ticker, companyName: ipo.companyName, price: ipo.price, lotAmount: ipo.lotAmount, 
                distributionType: ipo.distributionType, dateRange: ipo.dateRange, tradingDate: ipo.tradingDate || '', status: ipo.status,
                scenarios: ipo.scenarios || [], finalLots: ipo.finalLots || null, totalLotsForIndividuals: ipo.totalLotsForIndividuals || 0, discountRate: ipo.discountRate || '',
                prospectusSummary: ipo.prospectusSummary || { fundUsage: '', t1t2: false, priceStability: '' }
              });
              setShowForm(true);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }} 
            className="p-2 bg-[#3b82f6]/20 text-[#3b82f6] rounded-lg hover:bg-[#3b82f6]/40 transition-all"
            title="Düzenle"
          >
            <Pencil size={16} />
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); deleteIpo(ipo.id); }} 
            className="p-2 bg-red-500/20 text-red-500 rounded-lg hover:bg-red-500/40 transition-all"
            title="Sil"
          >
            <Trash2 size={16} />
          </button>
        </div>
      )}
    </Card>
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Rocket className="text-[#3b82f6]" /> Halka Arzlar
          </h2>
          <p className="text-[var(--text-muted)] text-sm">Yaklaşan ve yeni işlem görmeye başlayan arzları takip edin.</p>
        </div>
        {user && (
          <button onClick={() => {
            if (!showForm) {
              setEditingId(null);
              setFormData({ ticker: '', companyName: '', price: 0, lotAmount: 0, distributionType: 'Tamamı Eşit', dateRange: '', tradingDate: '', status: 'Yaklaşan', scenarios: [], finalLots: null, totalLotsForIndividuals: 0, discountRate: '', prospectusSummary: { fundUsage: '', t1t2: false, priceStability: '' } });
            }
            setShowForm(!showForm);
          }} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 font-medium">
            <Plus size={18} /> Yeni Ekle
          </button>
        )}
      </div>

      <AnimatePresence>
        {showForm && user && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <Card className="mb-6 border-[#3b82f6]/30">
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <h3 className="font-bold text-lg mb-2">{editingId ? 'Halka Arzı Düzenle' : 'Yeni Halka Arz Ekle'} (Admin)</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-[var(--text-muted)]">Hisse Kodu</label>
                    <input required value={formData.ticker} onChange={e => setFormData({...formData, ticker: e.target.value.toUpperCase()})} className="bg-[var(--bg-main)] border border-[var(--border-color)] rounded p-2 outline-none focus:border-primary uppercase" placeholder="ÖRNEK" />
                  </div>
                  <div className="flex flex-col gap-1 md:col-span-2">
                    <label className="text-xs font-bold text-[var(--text-muted)]">Şirket Adı</label>
                    <input required value={formData.companyName} onChange={e => setFormData({...formData, companyName: e.target.value})} className="bg-[var(--bg-main)] border border-[var(--border-color)] rounded p-2 outline-none focus:border-primary" placeholder="Örnek Şirket A.Ş." />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-[var(--text-muted)]">Fiyat (₺)</label>
                    <input required type="number" step="0.01" value={formData.price || ''} onChange={e => setFormData({...formData, price: parseFloat(e.target.value)})} className="bg-[var(--bg-main)] border border-[var(--border-color)] rounded p-2 outline-none focus:border-primary" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-[var(--text-muted)]">Toplam Lot</label>
                    <input required type="number" value={formData.lotAmount || ''} onChange={e => setFormData({...formData, lotAmount: parseInt(e.target.value)})} className="bg-[var(--bg-main)] border border-[var(--border-color)] rounded p-2 outline-none focus:border-primary" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-[var(--text-muted)]">Dağıtım Şekli</label>
                    <select value={formData.distributionType} onChange={e => setFormData({...formData, distributionType: e.target.value})} className="bg-[var(--bg-main)] border border-[var(--border-color)] rounded p-2 outline-none focus:border-primary">
                      <option>Tamamı Eşit</option>
                      <option>Bireysele Eşit</option>
                      <option>Oransal</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-[var(--text-muted)]">Talep Toplama Tarihi</label>
                    <input required value={formData.dateRange} onChange={e => setFormData({...formData, dateRange: e.target.value})} className="bg-[var(--bg-main)] border border-[var(--border-color)] rounded p-2 outline-none focus:border-primary" placeholder="14-15 Eylül" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-[var(--text-muted)] text-[#10b981]">İşleme Başlama Tarihi (Opsiyonel)</label>
                    <input value={formData.tradingDate || ''} onChange={e => setFormData({...formData, tradingDate: e.target.value})} className="bg-[var(--bg-main)] border border-[#10b981]/50 rounded p-2 outline-none focus:border-[#10b981]" placeholder="Örn: 20 Eylül (İşleme Başlama)" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-[var(--text-muted)]">Durum</label>
                    <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as any})} className="bg-[var(--bg-main)] border border-[var(--border-color)] rounded p-2 outline-none focus:border-primary">
                      <option>Yaklaşan</option>
                      <option>İşlem Görüyor</option>
                    </select>
                  </div>
                  
                  <div className="flex flex-col gap-1 md:col-span-3 mt-2 border-t border-[var(--border-color)] pt-3">
                    <label className="text-xs font-bold text-[#3b82f6]">Bireysele Dağıtılacak Toplam Lot (Hesaplayıcı İçin)</label>
                    <input type="number" value={formData.totalLotsForIndividuals || ''} onChange={e => setFormData({...formData, totalLotsForIndividuals: parseInt(e.target.value) || 0})} className="bg-[var(--bg-main)] border border-[var(--border-color)] rounded p-2 outline-none focus:border-[#3b82f6] w-full md:w-1/3" placeholder="Örn: 25000000" />
                  </div>
                  
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-[var(--text-muted)]">İskonto Oranı</label>
                    <input value={formData.discountRate || ''} onChange={e => setFormData({...formData, discountRate: e.target.value})} className="bg-[var(--bg-main)] border border-[var(--border-color)] rounded p-2 outline-none focus:border-primary" placeholder="Örn: %20" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-[var(--text-muted)]">Fiyat İstikrarı</label>
                    <input value={formData.prospectusSummary?.priceStability || ''} onChange={e => setFormData({...formData, prospectusSummary: {...(formData.prospectusSummary || {}), priceStability: e.target.value}})} className="bg-[var(--bg-main)] border border-[var(--border-color)] rounded p-2 outline-none focus:border-primary" placeholder="Örn: 30 Gün Planlanıyor" />
                  </div>
                  <div className="flex items-center gap-2 mt-4 md:mt-6">
                    <input type="checkbox" id="t1t2" checked={formData.prospectusSummary?.t1t2 || false} onChange={e => setFormData({...formData, prospectusSummary: {...(formData.prospectusSummary || {}), t1t2: e.target.checked}})} className="w-4 h-4" />
                    <label htmlFor="t1t2" className="text-sm font-bold text-[var(--text-muted)]">T1-T2 Bakiye Kullanılabilir mi?</label>
                  </div>
                  <div className="flex flex-col gap-1 md:col-span-3">
                    <label className="text-xs font-bold text-[var(--text-muted)]">Fon Kullanım Yeri</label>
                    <textarea value={formData.prospectusSummary?.fundUsage || ''} onChange={e => setFormData({...formData, prospectusSummary: {...(formData.prospectusSummary || {}), fundUsage: e.target.value}})} className="bg-[var(--bg-main)] border border-[var(--border-color)] rounded p-2 outline-none focus:border-primary h-20" placeholder="Örn: %40 İşletme Sermayesi, %60 Yeni Yatırım" />
                  </div>

                  <div className="flex flex-col gap-1 md:col-span-3 mt-2 border-t border-[var(--border-color)] pt-3">
                    <label className="text-xs font-bold text-[var(--text-muted)]">Kesinleşen Lot (Eğer dağıtım belli olduysa senaryolar yerine bunu gösterir)</label>
                    <input 
                      type="number" 
                      value={formData.finalLots || ''} 
                      onChange={e => setFormData({...formData, finalLots: parseInt(e.target.value) || null})} 
                      className="bg-[var(--bg-main)] border border-[var(--border-color)] rounded p-2 outline-none focus:border-primary w-full md:w-1/3" 
                      placeholder="Örn: 45" 
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-4">
                  <button type="button" onClick={() => {
                    setShowForm(false);
                    setEditingId(null);
                    setFormData({ ticker: '', companyName: '', price: 0, lotAmount: 0, distributionType: 'Tamamı Eşit', dateRange: '', tradingDate: '', status: 'Yaklaşan', scenarios: [], finalLots: null, totalLotsForIndividuals: 0, discountRate: '', prospectusSummary: { fundUsage: '', t1t2: false, priceStability: '' } });
                  }} className="px-4 py-2 rounded text-[var(--text-muted)] hover:bg-[var(--bg-main)]">İptal</button>
                  <button type="submit" className="px-6 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 font-medium">{editingId ? 'Güncelle' : 'Kaydet & Paylaş'}</button>
                </div>
              </form>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col gap-8">
        <div>
          <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-2 mb-4">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#3b82f6]"></span> Yaklaşan / Talep Toplananlar
            </h3>
            <button 
              onClick={() => setIsCalendarOpen(true)}
              className="flex items-center gap-2 text-sm font-bold text-[#8b5cf6] hover:text-[#7c3aed] transition-colors p-1"
            >
              <CalendarDays size={18} /> Takvim
            </button>
          </div>
          {upcomingIpos.length === 0 ? (
            <p className="text-[var(--text-muted)] text-sm">Şu anda SPK onaylı yeni bir halka arz bulunmuyor veya Firebase bağlantısı yapılmadı.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {upcomingIpos.map(ipo => <IpoCard key={ipo.id} ipo={ipo} />)}
            </div>
          )}
        </div>

        <div>
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2 border-b border-[var(--border-color)] pb-2">
            <span className="w-2 h-2 rounded-full bg-[#10b981]"></span> Yeni İşlem Görmeye Başlayanlar
          </h3>
          {tradingIpos.length === 0 ? (
            <p className="text-[var(--text-muted)] text-sm">Yakın zamanda işlem görmeye başlayan arz bulunmuyor.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tradingIpos.map(ipo => <IpoCard key={ipo.id} ipo={ipo} />)}
            </div>
          )}
        </div>
      </div>

      <Modal 
        isOpen={!!selectedIpo} 
        onClose={() => { setSelectedIpo(null); setSelectedScenarioIndex(0); setAdminEditMode(false); setCustomParticipants(1000000); }} 
        title={selectedIpo?.ticker || 'Halka Arz Detayı'}
      >
        {selectedIpo && (() => {
          const isFinalized = !!selectedIpo.finalLots;
          const hasTotalLots = !!selectedIpo.totalLotsForIndividuals && selectedIpo.totalLotsForIndividuals > 0;
          
          const generatedScenarios = [];
          if (hasTotalLots) {
            for (let p = 600000; p <= 1200000; p += 100000) {
              generatedScenarios.push({
                participants: `${p >= 1000000 ? (p / 1000000).toFixed(1) + 'M' : (p / 1000) + 'B'} Kişi`,
                lots: Math.floor(selectedIpo.totalLotsForIndividuals! / p)
              });
            }
          }
          
          const displayScenarios = hasTotalLots ? generatedScenarios : (selectedIpo.scenarios || []);
          const actualHasScenarios = displayScenarios.length > 0;
          
          let baseLot = 0;
          if (isFinalized) {
            baseLot = selectedIpo.finalLots!;
          } else if (hasTotalLots && selectedScenarioIndex === -1) {
            baseLot = Math.floor(selectedIpo.totalLotsForIndividuals! / customParticipants);
          } else if (actualHasScenarios) {
            const safeIdx = selectedScenarioIndex >= 0 && selectedScenarioIndex < displayScenarios.length ? selectedScenarioIndex : 0;
            baseLot = displayScenarios[safeIdx]?.lots || 0;
          }
          
          const requiredAmount = baseLot * selectedIpo.price;
          const ceilingDays = calculateCeilings(selectedIpo.price, baseLot);

          const handleShare = async () => {
            if (!captureRef.current || !selectedIpo) return;
            setIsCapturing(true);
            try {
              await new Promise(r => setTimeout(r, 150)); // UI'ın güncellenmesi için bekle
              
              const isDark = document.documentElement.classList.contains('dark');
              const bgColor = isDark ? '#0b1121' : '#f8fafc';
              
              const dataUrl = await toPng(captureRef.current, {
                cacheBust: true,
                backgroundColor: bgColor,
                style: { margin: '0' },
                pixelRatio: 2 // Daha net görüntü için
              });
              
              if (navigator.share) {
                try {
                  const res = await fetch(dataUrl);
                  const blob = await res.blob();
                  const file = new File([blob], `BorsaDefterim-${selectedIpo.ticker}.png`, { type: 'image/png' });
                  await navigator.share({
                    title: `${selectedIpo.ticker} Halka Arz`,
                    files: [file]
                  });
                  return;
                } catch (err) {
                  console.warn('Native share failed or cancelled', err);
                }
              }
              
              const link = document.createElement('a');
              link.download = `BorsaDefterim-${selectedIpo.ticker}.png`;
              link.href = dataUrl;
              link.click();
            } catch (err) {
              console.error('Share capture error', err);
            } finally {
              setIsCapturing(false);
            }
          };

          return (
            <div className="flex flex-col gap-6">
              <div className="flex justify-between mb-[-1rem]">
                <button 
                  onClick={handleShare}
                  disabled={isCapturing}
                  className="flex items-center gap-1.5 text-xs font-bold bg-[#10b981]/10 text-[#10b981] px-3 py-1.5 rounded-lg hover:bg-[#10b981]/20 transition-colors"
                >
                  <Share2 size={14} /> 
                  {isCapturing ? 'Hazırlanıyor...' : 'Paylaş / İndir'}
                </button>
                {user && (
                  <button 
                    onClick={() => {
                      setAdminScenarios(selectedIpo.scenarios || []);
                      setAdminFinalLots(selectedIpo.finalLots || '');
                      setAdminStatus(selectedIpo.status);
                      setAdminTotalLots(selectedIpo.totalLotsForIndividuals || '');
                      setAdminDiscount(selectedIpo.discountRate || '');
                      setAdminFundUsage(selectedIpo.prospectusSummary?.fundUsage || '');
                      setAdminT1T2(selectedIpo.prospectusSummary?.t1t2 || false);
                      setAdminPriceStability(selectedIpo.prospectusSummary?.priceStability || '');
                      setAdminEditMode(!adminEditMode);
                    }}
                    className="flex items-center gap-1.5 text-xs font-bold bg-[#3b82f6]/10 text-[#3b82f6] px-3 py-1.5 rounded-lg hover:bg-[#3b82f6]/20 transition-colors"
                  >
                    <SettingsIcon size={14} /> 
                    {adminEditMode ? 'İptal Et' : 'Senaryo Düzenle'}
                  </button>
                )}
              </div>

              <div 
                ref={captureRef} 
                className={`flex flex-col gap-6 ${isCapturing ? 'p-8 bg-[#0b1121] text-white rounded-3xl' : ''}`}
                style={isCapturing ? { width: '540px', minWidth: '540px', margin: '0 auto' } : undefined}
              >
                {isCapturing && (
                  <div className="flex flex-col items-center justify-center mb-2 pb-6 border-b border-[#1e293b]">
                    <span className="text-[32px] font-extrabold italic tracking-tight bg-gradient-to-r from-[#10b981] to-[#3b82f6] bg-clip-text text-transparent drop-shadow-sm">Borsa Defterim</span>
                    <h2 className="text-2xl font-bold mt-3 text-white text-center">{selectedIpo.ticker} Halka Arz Tahmini</h2>
                  </div>
                )}
                
                {adminEditMode && user && (
                <div className="bg-[var(--bg-card)] p-4 rounded-xl border-2 border-dashed border-[#3b82f6] flex flex-col gap-4 mb-2 animate-in fade-in slide-in-from-top-4">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                    <div className="flex flex-col gap-2 flex-1">
                      <label className="text-xs font-bold text-[var(--text-muted)]">Durum</label>
                      <select 
                        value={adminStatus} 
                        onChange={e => setAdminStatus(e.target.value as 'Yaklaşan' | 'İşlem Görüyor')} 
                        className="bg-[var(--bg-main)] border border-[var(--border-color)] rounded p-2 text-sm outline-none focus:border-[#3b82f6]"
                      >
                        <option value="Yaklaşan">Yaklaşan</option>
                        <option value="İşlem Görüyor">İşlem Görüyor</option>
                      </select>
                    </div>

                    <div className="flex flex-col gap-2 flex-1">
                      <label className="text-xs font-bold text-[var(--text-muted)]">Kesinleşen Lot (Senaryoları Gizler)</label>
                      <input 
                        type="number" 
                        value={adminFinalLots}
                        onChange={e => setAdminFinalLots(e.target.value ? parseInt(e.target.value) : '')}
                        className="bg-[var(--bg-main)] border border-[var(--border-color)] rounded p-2 text-sm outline-none focus:border-[#3b82f6]"
                        placeholder="Örn: 45"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 border-t border-[var(--border-color)] pt-3">
                    <label className="text-xs font-bold text-[#3b82f6]">Bireysele Dağıtılacak Toplam Lot</label>
                    <input 
                      type="number" 
                      value={adminTotalLots}
                      onChange={e => setAdminTotalLots(e.target.value ? parseInt(e.target.value) : '')}
                      className="bg-[var(--bg-main)] border border-[var(--border-color)] rounded p-2 text-sm outline-none focus:border-[#3b82f6] w-full md:w-1/3"
                      placeholder="Örn: 25000000"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-[var(--border-color)] pt-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-bold text-[var(--text-muted)]">İskonto Oranı</label>
                      <input value={adminDiscount} onChange={e => setAdminDiscount(e.target.value)} className="bg-[var(--bg-main)] border border-[var(--border-color)] rounded p-2 outline-none focus:border-primary text-sm" placeholder="Örn: %20" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-bold text-[var(--text-muted)]">Fiyat İstikrarı</label>
                      <input value={adminPriceStability} onChange={e => setAdminPriceStability(e.target.value)} className="bg-[var(--bg-main)] border border-[var(--border-color)] rounded p-2 outline-none focus:border-primary text-sm" placeholder="Örn: 30 Gün Planlanıyor" />
                    </div>
                    <div className="flex items-center gap-2 mt-2 md:col-span-2">
                      <input type="checkbox" id="adminT1T2" checked={adminT1T2} onChange={e => setAdminT1T2(e.target.checked)} className="w-4 h-4" />
                      <label htmlFor="adminT1T2" className="text-sm font-bold text-[var(--text-muted)]">T1-T2 Bakiye Kullanılabilir mi?</label>
                    </div>
                    <div className="flex flex-col gap-1 md:col-span-2">
                      <label className="text-xs font-bold text-[var(--text-muted)]">Fon Kullanım Yeri</label>
                      <textarea value={adminFundUsage} onChange={e => setAdminFundUsage(e.target.value)} className="bg-[var(--bg-main)] border border-[var(--border-color)] rounded p-2 outline-none focus:border-primary h-20 text-sm" placeholder="Örn: %40 İşletme Sermayesi, %60 Yeni Yatırım" />
                    </div>
                  </div>

                  <div className="flex justify-end pt-2 border-t border-[var(--border-color)]">
                    <button 
                      onClick={async () => {
                        const updated = { 
                          ...selectedIpo, 
                          scenarios: adminScenarios, 
                          finalLots: typeof adminFinalLots === 'number' ? adminFinalLots : null,
                          status: adminStatus,
                          totalLotsForIndividuals: typeof adminTotalLots === 'number' ? adminTotalLots : undefined,
                          discountRate: adminDiscount,
                          prospectusSummary: {
                            fundUsage: adminFundUsage,
                            t1t2: adminT1T2,
                            priceStability: adminPriceStability
                          }
                        };
                        await updateIpo(updated);
                        setSelectedIpo(updated);
                        setAdminEditMode(false);
                      }}
                      className="flex items-center gap-2 bg-[#3b82f6] text-white px-4 py-2 rounded-lg font-bold hover:bg-[#3b82f6]/90 transition-colors"
                    >
                      <Save size={16} /> Kaydet
                    </button>
                  </div>
                </div>
              )}

              {/* IPO Basic Details Summary */}
              {!adminEditMode && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-2">
                  <div className={`p-3 rounded-xl border flex flex-col justify-center ${isCapturing ? 'bg-[#1e293b] border-[#334155]' : 'bg-[var(--bg-card)] border-[var(--border-color)]'}`}>
                    <p className={`text-[10px] uppercase font-bold ${isCapturing ? 'text-slate-400' : 'text-[var(--text-muted)]'}`}>Dağıtım</p>
                    <p className={`font-semibold text-sm ${isCapturing ? 'text-white' : ''}`}>{selectedIpo.distributionType}</p>
                  </div>
                  <div className={`p-3 rounded-xl border flex flex-col justify-center ${isCapturing ? 'bg-[#1e293b] border-[#334155]' : 'bg-[var(--bg-card)] border-[var(--border-color)]'}`}>
                    <p className={`text-[10px] uppercase font-bold ${isCapturing ? 'text-slate-400' : 'text-[var(--text-muted)]'}`}>Lot Miktarı</p>
                    <p className={`font-semibold text-sm ${isCapturing ? 'text-white' : ''}`}>{selectedIpo.lotAmount.toLocaleString('tr-TR')}</p>
                  </div>
                  <div className={`p-3 rounded-xl border flex flex-col justify-center ${isCapturing ? 'bg-[#1e293b] border-[#334155]' : 'bg-[var(--bg-card)] border-[var(--border-color)]'}`}>
                    <p className={`text-[10px] uppercase font-bold ${isCapturing ? 'text-slate-400' : 'text-[var(--text-muted)]'}`}>Arz Büyüklüğü</p>
                    <p className={`font-semibold text-sm ${isCapturing ? 'text-white' : ''}`}>{(selectedIpo.lotAmount * selectedIpo.price).toLocaleString('tr-TR')} ₺</p>
                  </div>
                  <div className={`p-3 rounded-xl border flex flex-col justify-center ${isCapturing ? 'bg-[#1e293b] border-[#334155]' : 'bg-[var(--bg-card)] border-[var(--border-color)]'}`}>
                    {selectedIpo.tradingDate ? (
                      <>
                        <p className="text-[10px] uppercase font-bold text-[#10b981]">İşlem Tarihi</p>
                        <p className="font-semibold text-sm text-[#10b981]">{selectedIpo.tradingDate}</p>
                      </>
                    ) : (
                      <>
                        <p className={`text-[10px] uppercase font-bold ${isCapturing ? 'text-slate-400' : 'text-[var(--text-muted)]'}`}>Talep Toplama</p>
                        <p className={`font-semibold text-sm ${isCapturing ? 'text-white' : ''}`}>{selectedIpo.dateRange}</p>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Prospectus Badges */}
              {(selectedIpo.discountRate || selectedIpo.prospectusSummary?.t1t2 || selectedIpo.prospectusSummary?.priceStability) && (
                <div className="flex flex-wrap gap-2 animate-in fade-in slide-in-from-bottom-4">
                  {selectedIpo.discountRate && (
                    <div className="bg-yellow-500/10 border border-yellow-500/30 text-yellow-600 dark:text-yellow-400 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5">
                      <TrendingUp size={14} /> İskonto: {selectedIpo.discountRate}
                    </div>
                  )}
                  {selectedIpo.prospectusSummary?.t1t2 && (
                    <div className="bg-[#10b981]/10 border border-[#10b981]/30 text-[#10b981] px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5">
                      <Rocket size={14} /> T1-T2 Geçerli
                    </div>
                  )}
                  {selectedIpo.prospectusSummary?.priceStability && (
                    <div className="bg-[#3b82f6]/10 border border-[#3b82f6]/30 text-[#3b82f6] px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5">
                      <SettingsIcon size={14} /> Fiyat İstikrarı: {selectedIpo.prospectusSummary.priceStability}
                    </div>
                  )}
                </div>
              )}

              {selectedIpo.prospectusSummary?.fundUsage && (
                <div className="bg-[var(--bg-card)] border border-[var(--border-color)] p-3 rounded-xl text-sm animate-in fade-in slide-in-from-bottom-4">
                  <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase block mb-1">Fon Kullanım Yeri</span>
                  <p className="font-medium text-[var(--text-main)]">{selectedIpo.prospectusSummary.fundUsage}</p>
                </div>
              )}

              {!adminEditMode && isFinalized ? (
                <div className="bg-[#10b981]/10 border border-[#10b981]/30 p-5 rounded-xl flex flex-col items-center justify-center gap-2">
                  <div className="flex items-center gap-2 text-[#10b981]">
                    <Users size={24} />
                    <span className="text-sm font-bold uppercase tracking-wider">Kesinleşen Dağıtım</span>
                  </div>
                  <span className="text-4xl font-extrabold text-[#10b981]">{baseLot} Lot</span>
                  <span className="text-sm font-semibold text-[var(--text-muted)] bg-[var(--bg-card)] px-3 py-1 rounded-full">Gereken Tutar: ₺{requiredAmount.toFixed(2)}</span>
                </div>
              ) : actualHasScenarios ? (
                <div className={`p-4 rounded-xl border flex flex-col gap-3 ${isCapturing ? 'bg-[#0f172a] border-[#1e293b]' : 'bg-[var(--bg-main)] border-[var(--border-color)]'}`}>
                  <div className="flex items-center gap-2 text-lg font-bold">
                    <Users className="text-[#3b82f6]" size={20} />
                    <span className={isCapturing ? 'text-white' : ''}>Tahmini Katılım Senaryoları</span>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {displayScenarios.map((scen, idx) => {
                      const isSelected = selectedScenarioIndex === idx;
                      const reqAmt = scen.lots * selectedIpo.price;
                      
                      return (
                        <button 
                          key={idx}
                          onClick={() => !isCapturing && setSelectedScenarioIndex(idx)}
                          className={`flex flex-col items-center p-3 rounded-xl border transition-all ${isSelected ? 'bg-[#3b82f6]/10 border-[#3b82f6] shadow-sm scale-[1.02]' : isCapturing ? 'bg-[#1e293b] border-[#334155]' : 'bg-[var(--bg-card)] border-[var(--border-color)] hover:border-[#3b82f6]/50'}`}
                        >
                          <span className={`text-[11px] sm:text-xs font-bold uppercase ${isCapturing ? 'text-slate-400' : 'text-[var(--text-muted)]'}`}>{scen.participants}</span>
                          <span className={`text-lg font-extrabold ${isSelected ? 'text-[#3b82f6]' : isCapturing ? 'text-white' : 'text-[var(--text-main)]'}`}>{scen.lots} Lot</span>
                          <span className="text-xs font-semibold text-[#10b981]">₺{reqAmt.toFixed(2)}</span>
                        </button>
                      )
                    })}
                  </div>

                  {hasTotalLots && !isCapturing && (
                    <div className="mt-4 pt-4 border-t border-[var(--border-color)] flex flex-col gap-3">
                      <div className="flex justify-between items-center">
                         <span className="text-sm font-bold">Özel Katılım Tahmini</span>
                         <span className="text-xs bg-[var(--bg-card)] px-2 py-1 rounded text-[var(--text-muted)] font-bold">
                           {(customParticipants / 1000000).toFixed(2)}M Kişi
                         </span>
                      </div>
                      <input 
                        type="range" 
                        min="300000" 
                        max="4000000" 
                        step="50000" 
                        value={customParticipants} 
                        onChange={e => {
                          setCustomParticipants(parseInt(e.target.value));
                          setSelectedScenarioIndex(-1);
                        }}
                        className="w-full accent-[#3b82f6]"
                      />
                      {selectedScenarioIndex === -1 && (
                         <div className="flex justify-between items-center bg-[#3b82f6]/10 p-3 rounded-xl border border-[#3b82f6]/30 animate-in fade-in zoom-in-95">
                           <div className="flex flex-col">
                             <span className="text-[10px] text-[var(--text-muted)] font-bold uppercase">Düşecek Lot</span>
                             <span className="text-xl font-extrabold text-[#3b82f6]">{baseLot} Lot</span>
                           </div>
                           <div className="flex flex-col items-end">
                             <span className="text-[10px] text-[var(--text-muted)] font-bold uppercase">Gereken Tutar</span>
                             <span className="text-lg font-extrabold text-[#10b981]">₺{(baseLot * selectedIpo.price).toFixed(2)}</span>
                           </div>
                         </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-[var(--bg-main)] p-4 rounded-xl border border-[var(--border-color)] text-center text-sm text-[var(--text-muted)] font-medium">
                  Henüz katılım senaryosu veya kesinleşen lot bilgisi girilmemiş.
                </div>
              )}

              {baseLot > 0 && (
                <div className={`p-4 rounded-xl border flex flex-col gap-3 ${isCapturing ? 'bg-[#0f172a] border-[#1e293b]' : 'bg-[var(--bg-main)] border-[var(--border-color)]'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-lg font-bold">
                      <TrendingUp className="text-[#10b981]" size={20} />
                      <span className={isCapturing ? 'text-white' : ''}>10 Günlük Tavan Tablosu</span>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-1 rounded border ${isCapturing ? 'bg-[#1e293b] text-slate-300 border-[#334155]' : 'text-[var(--text-muted)] bg-[var(--bg-card)] border-[var(--border-color)]'}`}>{baseLot} Lot için</span>
                  </div>

                  <div className={`rounded-lg border ${isCapturing ? 'overflow-visible border-[#1e293b]' : 'overflow-x-auto hide-scrollbar border-[var(--border-color)]'}`}>
                    <table className="w-full text-sm text-left">
                      <thead className={`text-[10px] uppercase border-b ${isCapturing ? 'bg-[#1e293b] text-slate-400 border-[#334155]' : 'text-[var(--text-muted)] bg-[var(--bg-card)] border-[var(--border-color)]'}`}>
                        <tr>
                          <th className="px-3 py-3">Gün</th>
                          <th className="px-3 py-3">Fiyat</th>
                          <th className="px-3 py-3 text-right">Net Kâr</th>
                          <th className="px-3 py-3 text-right">Toplam</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ceilingDays.map((d, i) => (
                          <tr key={d.day} className={`border-b last:border-0 ${isCapturing ? 'border-[#1e293b]' : 'border-[var(--border-color)]'} ${i % 2 === 0 ? 'bg-transparent' : isCapturing ? 'bg-[#1e293b]/30' : 'bg-[var(--bg-card)]/50'}`}>
                            <td className={`px-3 py-2.5 font-bold ${isCapturing ? 'text-slate-400' : 'text-[var(--text-muted)]'}`}>{d.day}. Gün</td>
                            <td className={`px-3 py-2.5 font-semibold ${isCapturing ? 'text-white' : ''}`}>₺{d.price.toFixed(2)}</td>
                            <td className="px-3 py-2.5 font-bold text-[#10b981] text-right">+₺{d.profit.toFixed(2)}</td>
                            <td className="px-3 py-2.5 font-extrabold text-right text-[#3b82f6]">₺{d.totalValue.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              
              {isCapturing && (
                <div className="text-center mt-2 text-[11px] text-slate-500 uppercase tracking-widest font-bold">
                  Bu görsel Borsa Defterim uygulaması ile oluşturulmuştur. Yatırım Tavsiyesi Değildir.
                </div>
              )}
              </div>
            </div>
          );
        })()}
      </Modal>

      {/* Takvim Modal */}
      <Modal isOpen={isCalendarOpen} onClose={() => setIsCalendarOpen(false)} title="Halka Arz Takvimi">
        <div className="flex flex-col gap-4">
          {upcomingIpos.length === 0 ? (
            <p className="text-[var(--text-muted)] text-sm text-center py-4">Yaklaşan arz bulunmuyor.</p>
          ) : (
            upcomingIpos.map(ipo => (
              <div 
                key={ipo.id} 
                onClick={() => { setIsCalendarOpen(false); setTimeout(() => setSelectedIpo(ipo), 200); }}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-4 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl hover:border-[#3b82f6] transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#3b82f6]/10 text-[#3b82f6] flex items-center justify-center font-bold group-hover:scale-110 transition-transform">
                    <CalendarIcon size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold group-hover:text-[#3b82f6] transition-colors">{ipo.ticker}</h4>
                    <p className="text-xs text-[var(--text-muted)]">{ipo.companyName}</p>
                  </div>
                </div>
                <div className="flex flex-col sm:items-end text-sm">
                  {ipo.tradingDate ? (
                    <span className="font-bold text-[#10b981]">{ipo.tradingDate}</span>
                  ) : (
                    <span className="font-bold text-[#3b82f6]">{ipo.dateRange}</span>
                  )}
                  <span className="text-xs text-[var(--text-muted)] uppercase font-semibold">
                    {ipo.tradingDate ? 'İşleme Başlıyor' : 'Talep Toplama'}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </Modal>
    </div>
  );
};
