import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useData } from '../context/DataContext';
import { Card } from '../components/Card';
import { Rocket, Plus, Trash2, Users, TrendingUp, Settings as SettingsIcon, Save, X, Share2 } from 'lucide-react';
import { IpoData, IpoScenario } from '../types';
import { Modal } from '../components/Modal';
import { toPng } from 'html-to-image';

export const IPOs: React.FC = () => {
  const { ipos, user, addIpo, deleteIpo, updateIpo, livePrices } = useData();
  const [showForm, setShowForm] = useState(false);
  const [selectedIpo, setSelectedIpo] = useState<IpoData | null>(null);
  const [selectedScenarioIndex, setSelectedScenarioIndex] = useState<number>(0);
  
  const [adminEditMode, setAdminEditMode] = useState(false);
  const [adminScenarios, setAdminScenarios] = useState<IpoScenario[]>([]);
  const [adminFinalLots, setAdminFinalLots] = useState<number | ''>('');
  const [adminStatus, setAdminStatus] = useState<'Yaklaşan' | 'İşlem Görüyor'>('Yaklaşan');
  
  const captureRef = useRef<HTMLDivElement>(null);
  const [isCapturing, setIsCapturing] = useState(false);

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
    distributionType: 'Tamamı Eşit', dateRange: '', status: 'Yaklaşan',
    scenarios: [], finalLots: null
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await addIpo(formData);
    setShowForm(false);
    setFormData({ ticker: '', companyName: '', price: 0, lotAmount: 0, distributionType: 'Tamamı Eşit', dateRange: '', status: 'Yaklaşan', scenarios: [], finalLots: null });
  };

  const IpoCard = ({ ipo }: { ipo: IpoData }) => (
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
        <div className="col-span-2">
          <p className="text-[10px] uppercase font-bold text-[var(--text-muted)]">Talep Toplama Tarihi</p>
          <p className="font-semibold text-sm">{ipo.dateRange}</p>
        </div>
      </div>

      {user && (
        <button 
          onClick={(e) => { e.stopPropagation(); deleteIpo(ipo.id); }} 
          className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 p-2 bg-red-500/20 text-red-500 rounded-lg hover:bg-red-500/40 transition-all"
        >
          <Trash2 size={16} />
        </button>
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
          <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 font-medium">
            <Plus size={18} /> Yeni Ekle
          </button>
        )}
      </div>

      <AnimatePresence>
        {showForm && user && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <Card className="mb-6 border-[#3b82f6]/30">
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <h3 className="font-bold text-lg mb-2">Yeni Halka Arz Ekle (Admin)</h3>
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
                    <label className="text-xs font-bold text-[var(--text-muted)]">Durum</label>
                    <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as any})} className="bg-[var(--bg-main)] border border-[var(--border-color)] rounded p-2 outline-none focus:border-primary">
                      <option>Yaklaşan</option>
                      <option>İşlem Görüyor</option>
                    </select>
                  </div>
                  
                  <div className="flex flex-col gap-1 md:col-span-3 mt-2 border-t border-[var(--border-color)] pt-3">
                    <label className="text-xs font-bold text-[var(--text-muted)]">Senaryolar (Örn: 2 Milyon Kişi - 50 Lot)</label>
                    {formData.scenarios?.map((scen, idx) => (
                      <div key={idx} className="flex gap-2 mb-1">
                        <input 
                          value={scen.participants} 
                          onChange={e => {
                             const newScen = [...(formData.scenarios || [])];
                             newScen[idx].participants = e.target.value;
                             setFormData({...formData, scenarios: newScen});
                          }} 
                          placeholder="Örn: 2.5M Kişi"
                          className="bg-[var(--bg-main)] border border-[var(--border-color)] rounded p-1.5 text-sm flex-1 outline-none focus:border-primary"
                        />
                        <input 
                          type="number"
                          value={scen.lots || ''} 
                          onChange={e => {
                             const newScen = [...(formData.scenarios || [])];
                             newScen[idx].lots = parseInt(e.target.value) || 0;
                             setFormData({...formData, scenarios: newScen});
                          }} 
                          placeholder="Düşecek Lot"
                          className="bg-[var(--bg-main)] border border-[var(--border-color)] rounded p-1.5 text-sm flex-1 outline-none focus:border-primary"
                        />
                        <button type="button" onClick={() => {
                             const newScen = [...(formData.scenarios || [])];
                             newScen.splice(idx, 1);
                             setFormData({...formData, scenarios: newScen});
                        }} className="text-red-500 hover:bg-red-500/10 rounded p-1.5 px-3 font-bold transition-colors">Sil</button>
                      </div>
                    ))}
                    <button type="button" onClick={() => setFormData({...formData, scenarios: [...(formData.scenarios || []), {participants: '', lots: 0}]})} className="text-xs bg-[#3b82f6]/10 hover:bg-[#3b82f6]/20 text-[#3b82f6] rounded p-1.5 px-3 font-bold self-start mt-1 transition-colors">
                      + Senaryo Ekle
                    </button>
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
                  <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 rounded text-[var(--text-muted)] hover:bg-[var(--bg-main)]">İptal</button>
                  <button type="submit" className="px-6 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 font-medium">Kaydet & Paylaş</button>
                </div>
              </form>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col gap-8">
        <div>
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2 border-b border-[var(--border-color)] pb-2">
            <span className="w-2 h-2 rounded-full bg-[#3b82f6]"></span> Yaklaşan / Talep Toplananlar
          </h3>
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
        onClose={() => { setSelectedIpo(null); setSelectedScenarioIndex(0); setAdminEditMode(false); }} 
        title={selectedIpo?.ticker || 'Halka Arz Detayı'}
      >
        {selectedIpo && (() => {
          const isFinalized = !!selectedIpo.finalLots;
          const hasScenarios = selectedIpo.scenarios && selectedIpo.scenarios.length > 0;
          
          let baseLot = 0;
          if (isFinalized) {
            baseLot = selectedIpo.finalLots!;
          } else if (hasScenarios) {
            baseLot = selectedIpo.scenarios![selectedScenarioIndex]?.lots || 0;
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
                      setAdminEditMode(!adminEditMode);
                    }}
                    className="flex items-center gap-1.5 text-xs font-bold bg-[#3b82f6]/10 text-[#3b82f6] px-3 py-1.5 rounded-lg hover:bg-[#3b82f6]/20 transition-colors"
                  >
                    <SettingsIcon size={14} /> 
                    {adminEditMode ? 'İptal Et' : 'Senaryo Düzenle'}
                  </button>
                )}
              </div>

              <div ref={captureRef} className={`flex flex-col gap-6 ${isCapturing ? 'p-6 bg-[var(--bg-main)] rounded-2xl' : ''}`}>
                {isCapturing && (
                  <div className="flex flex-col items-center justify-center mb-2 pb-4 border-b border-[var(--border-color)]">
                    <span className="text-[28px] font-extrabold italic tracking-tight bg-gradient-to-r from-[#10b981] to-[#3b82f6] bg-clip-text text-transparent drop-shadow-sm">Borsa Defterim</span>
                    <h2 className="text-2xl font-bold mt-2">{selectedIpo.ticker} Halka Arz Tahmini</h2>
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
                    <label className="text-xs font-bold text-[var(--text-muted)]">Senaryolar</label>
                    {adminScenarios.map((scen, idx) => (
                      <div key={idx} className="flex gap-2">
                        <input 
                          value={scen.participants}
                          onChange={e => {
                            const newScen = [...adminScenarios];
                            newScen[idx].participants = e.target.value;
                            setAdminScenarios(newScen);
                          }}
                          placeholder="Örn: 1.5M Kişi"
                          className="bg-[var(--bg-main)] border border-[var(--border-color)] rounded p-2 text-sm flex-1 outline-none"
                        />
                        <input 
                          type="number"
                          value={scen.lots || ''}
                          onChange={e => {
                            const newScen = [...adminScenarios];
                            newScen[idx].lots = parseInt(e.target.value) || 0;
                            setAdminScenarios(newScen);
                          }}
                          placeholder="Lot"
                          className="bg-[var(--bg-main)] border border-[var(--border-color)] rounded p-2 text-sm w-24 outline-none"
                        />
                        <button 
                          onClick={() => {
                            const newScen = [...adminScenarios];
                            newScen.splice(idx, 1);
                            setAdminScenarios(newScen);
                          }}
                          className="text-red-500 hover:bg-red-500/10 px-3 rounded font-bold transition-colors"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                    <button 
                      onClick={() => setAdminScenarios([...adminScenarios, {participants: '', lots: 0}])}
                      className="text-xs bg-[#10b981]/10 text-[#10b981] px-3 py-2 rounded-lg font-bold self-start mt-1 hover:bg-[#10b981]/20 transition-colors"
                    >
                      + Senaryo Ekle
                    </button>
                  </div>

                  <div className="flex justify-end pt-2 border-t border-[var(--border-color)]">
                    <button 
                      onClick={async () => {
                        const updated = { 
                          ...selectedIpo, 
                          scenarios: adminScenarios, 
                          finalLots: typeof adminFinalLots === 'number' ? adminFinalLots : null,
                          status: adminStatus
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

              {!adminEditMode && isFinalized ? (
                <div className="bg-[#10b981]/10 border border-[#10b981]/30 p-5 rounded-xl flex flex-col items-center justify-center gap-2">
                  <div className="flex items-center gap-2 text-[#10b981]">
                    <Users size={24} />
                    <span className="text-sm font-bold uppercase tracking-wider">Kesinleşen Dağıtım</span>
                  </div>
                  <span className="text-4xl font-extrabold text-[#10b981]">{baseLot} Lot</span>
                  <span className="text-sm font-semibold text-[var(--text-muted)] bg-[var(--bg-card)] px-3 py-1 rounded-full">Gereken Tutar: ₺{requiredAmount.toFixed(2)}</span>
                </div>
              ) : hasScenarios ? (
                <div className="bg-[var(--bg-main)] p-4 rounded-xl border border-[var(--border-color)] flex flex-col gap-3">
                  <div className="flex items-center gap-2 text-lg font-bold">
                    <Users className="text-[#3b82f6]" size={20} />
                    <span>Tahmini Katılım Senaryoları</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    {selectedIpo.scenarios!.map((scen, idx) => {
                      const isSelected = selectedScenarioIndex === idx;
                      const reqAmt = scen.lots * selectedIpo.price;
                      
                      return (
                        <button 
                          key={idx}
                          onClick={() => setSelectedScenarioIndex(idx)}
                          className={`flex flex-col items-center p-3 rounded-xl border transition-all ${isSelected ? 'bg-[#3b82f6]/10 border-[#3b82f6] shadow-sm scale-[1.02]' : 'bg-[var(--bg-card)] border-[var(--border-color)] hover:border-[#3b82f6]/50'}`}
                        >
                          <span className="text-[11px] sm:text-xs font-bold text-[var(--text-muted)] uppercase">{scen.participants}</span>
                          <span className={`text-lg font-extrabold ${isSelected ? 'text-[#3b82f6]' : 'text-[var(--text-main)]'}`}>{scen.lots} Lot</span>
                          <span className="text-xs font-semibold text-[#10b981]">₺{reqAmt.toFixed(2)}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              ) : (
                <div className="bg-[var(--bg-main)] p-4 rounded-xl border border-[var(--border-color)] text-center text-sm text-[var(--text-muted)] font-medium">
                  Henüz katılım senaryosu veya kesinleşen lot bilgisi girilmemiş.
                </div>
              )}

              {baseLot > 0 && (
                <div className="bg-[var(--bg-main)] p-4 rounded-xl border border-[var(--border-color)] flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-lg font-bold">
                      <TrendingUp className="text-[#10b981]" size={20} />
                      <span>10 Günlük Tavan Tablosu</span>
                    </div>
                    <span className="text-[10px] font-bold text-[var(--text-muted)] bg-[var(--bg-card)] px-2 py-1 rounded border border-[var(--border-color)]">{baseLot} Lot için</span>
                  </div>

                  <div className="overflow-x-auto hide-scrollbar rounded-lg border border-[var(--border-color)]">
                    <table className="w-full text-sm text-left">
                      <thead className="text-[10px] text-[var(--text-muted)] uppercase bg-[var(--bg-card)] border-b border-[var(--border-color)]">
                        <tr>
                          <th className="px-3 py-2">Gün</th>
                          <th className="px-3 py-2">Fiyat</th>
                          <th className="px-3 py-2 text-right">Net Kâr</th>
                          <th className="px-3 py-2 text-right">Toplam</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ceilingDays.map((d, i) => (
                          <tr key={d.day} className={`border-b border-[var(--border-color)] last:border-0 ${i % 2 === 0 ? 'bg-transparent' : 'bg-[var(--bg-card)]/50'}`}>
                            <td className="px-3 py-2 font-bold text-[var(--text-muted)]">{d.day}. Gün</td>
                            <td className="px-3 py-2 font-semibold">₺{d.price.toFixed(2)}</td>
                            <td className="px-3 py-2 font-bold text-[#10b981] text-right">+₺{d.profit.toFixed(2)}</td>
                            <td className="px-3 py-2 font-extrabold text-right text-[#3b82f6]">₺{d.totalValue.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              
              {isCapturing && (
                <div className="text-center mt-4 text-[10px] text-[var(--text-muted)] uppercase tracking-widest font-bold">
                  Bu görsel Borsa Defterim uygulaması ile oluşturulmuştur. Yatırım Tavsiyesi Değildir.
                </div>
              )}
              </div>
            </div>
          );
        })()}
      </Modal>
    </div>
  );
};
