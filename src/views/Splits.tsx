import React, { useState, useRef, useEffect } from 'react';
import { Card } from '../components/Card';
import { Layers, Plus, Share2, X, Calculator } from 'lucide-react';
import { SplitEvent } from '../types';
import { toPng } from 'html-to-image';
import { AutocompleteInput } from '../components/AutocompleteInput';
import { BIST_STOCKS } from '../utils/bistStocks';

const SPLITS_STORAGE_KEY = 'borsa_defterim_splits_data';

export const Splits: React.FC = () => {
  const [ticker, setTicker] = useState(() => {
    try {
      const saved = localStorage.getItem(SPLITS_STORAGE_KEY);
      return saved ? JSON.parse(saved).ticker || 'ÖRNEK HİSSE' : 'ÖRNEK HİSSE';
    } catch { return 'ÖRNEK HİSSE'; }
  });
  
  const [startingLot, setStartingLot] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(SPLITS_STORAGE_KEY);
      return saved ? JSON.parse(saved).startingLot || 1 : 1;
    } catch { return 1; }
  });
  
  const [events, setEvents] = useState<SplitEvent[]>(() => {
    try {
      const saved = localStorage.getItem(SPLITS_STORAGE_KEY);
      return saved && JSON.parse(saved).events ? JSON.parse(saved).events : [
        { date: new Date().toISOString().split('T')[0], ratio: 100, newPrice: 0 }
      ];
    } catch { 
      return [{ date: new Date().toISOString().split('T')[0], ratio: 100, newPrice: 0 }];
    }
  });

  useEffect(() => {
    localStorage.setItem(SPLITS_STORAGE_KEY, JSON.stringify({ ticker, startingLot, events }));
  }, [ticker, startingLot, events]);

  const captureRef = useRef<HTMLDivElement>(null);
  const [isCapturing, setIsCapturing] = useState(false);

  let currentLot = startingLot || 0;
  // "events" listesinde en üstte en yeni tarihli bölünme var.
  // Matematiksel olarak en eskiden (sondan) başlayıp hesaplamalıyız.
  const chronologicalEvents = [...events].reverse();
  const calculatedNodes = chronologicalEvents.map(ev => {
    const beforeLot = currentLot;
    currentLot = currentLot * (1 + (ev.ratio / 100));
    return {
      ...ev,
      beforeLot,
      afterLot: currentLot
    };
  });
  // Ekranda en yenisi en üstte görünsün diye tekrar ters çeviriyoruz
  const timelineNodes = calculatedNodes.reverse();

  const totalGrowthMultiplier = startingLot > 0 ? (currentLot / startingLot) : 0;

  const handleShare = async () => {
    if (!captureRef.current) return;
    setIsCapturing(true);
    try {
      await new Promise(r => setTimeout(r, 150));
      const isDark = document.documentElement.classList.contains('dark');
      const bgColor = isDark ? '#0b1121' : '#f8fafc';
      
      const dataUrl = await toPng(captureRef.current, {
        cacheBust: true,
        backgroundColor: bgColor,
        style: { margin: '0' },
        pixelRatio: 2
      });
      
      const link = document.createElement('a');
      link.download = `BorsaDefterim-${ticker}-Bedelsiz.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Share capture error', err);
    } finally {
      setIsCapturing(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto w-full">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Calculator className="text-[#10b981]" /> Bedelsiz Hesaplayıcı
          </h2>
          <p className="text-[var(--text-muted)] text-sm">Hissenizin bedelsiz bölünme oranlarını girerek lotunuzun nasıl büyüyeceğini hesaplayın.</p>
        </div>
        <button 
          onClick={handleShare}
          disabled={isCapturing}
          className="flex items-center gap-2 text-sm font-bold bg-[#10b981] text-white px-4 py-2 rounded-lg hover:bg-[#10b981]/90 transition-colors shadow-lg shadow-[#10b981]/20"
        >
          <Share2 size={16} /> 
          {isCapturing ? 'Görsel Hazırlanıyor...' : 'Haritayı İndir'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        {/* Sol Taraf: Kullanıcı Giriş Formu */}
        <div className="md:col-span-1 flex flex-col gap-4">
          <Card className="flex flex-col gap-4 sticky top-24 border-[#10b981]/30">
            <h3 className="font-bold text-lg flex items-center gap-2 border-b border-[var(--border-color)] pb-2">
              Verileri Girin
            </h3>
            
            <AutocompleteInput 
              label="Hisse Adı (Opsiyonel)" 
              value={ticker} 
              onChange={e => setTicker(e.target.value.toUpperCase())}
              onSelectOption={val => setTicker(val)}
              options={BIST_STOCKS.map(s => ({ label: s.name, value: s.symbol }))}
            />

            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-[var(--text-muted)] uppercase">Başlangıç Lotunuz</label>
              <input 
                type="number" 
                min="1"
                value={startingLot || ''} 
                onChange={e => setStartingLot(parseInt(e.target.value) || 0)}
                className="bg-[var(--bg-main)] border border-[var(--border-color)] rounded-lg p-2.5 font-bold outline-none focus:border-[#10b981] w-full"
              />
            </div>

            <div className="flex flex-col gap-3 mt-2 border-t border-[var(--border-color)] pt-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-[var(--text-muted)] uppercase">Bölünmeler (En Yeni Üstte)</label>
              </div>
              
              <div className="flex flex-col gap-3">
                {events.map((ev, idx) => (
                  <div key={idx} className="flex flex-col gap-2 bg-[var(--bg-main)] p-3 rounded-lg border border-[var(--border-color)] relative group">
                    <button 
                      onClick={() => {
                        const newEvs = [...events];
                        newEvs.splice(idx, 1);
                        setEvents(newEvs);
                      }}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                    >
                      <X size={12} />
                    </button>
                    
                    <div className="flex gap-2">
                      <div className="flex-1 flex flex-col gap-1">
                        <label className="text-[10px] text-[var(--text-muted)]">Tarih (Opsiyonel)</label>
                        <input 
                          type="date"
                          value={ev.date} 
                          onChange={e => { const newEvs = [...events]; newEvs[idx].date = e.target.value; setEvents(newEvs); }} 
                          className="bg-transparent border-b border-[var(--border-color)] p-1 text-xs outline-none focus:border-[#10b981]"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex flex-col gap-1 min-w-0">
                        <label className="text-[10px] text-[#f59e0b] font-bold truncate">Oran (%)</label>
                        <input 
                          type="number"
                          value={ev.ratio || ''} 
                          onChange={e => { const newEvs = [...events]; newEvs[idx].ratio = parseFloat(e.target.value) || 0; setEvents(newEvs); }} 
                          placeholder="% Örn: 200"
                          className="bg-[var(--bg-card)] border border-[#f59e0b]/30 rounded p-1.5 text-sm outline-none focus:border-[#f59e0b] w-full min-w-0"
                        />
                      </div>
                      <div className="flex flex-col gap-1 min-w-0">
                        <label className="text-[10px] text-[var(--text-muted)] truncate">Bölünme Fiyatı (₺)</label>
                        <input 
                          type="number"
                          step="0.01"
                          value={ev.newPrice || ''} 
                          onChange={e => { const newEvs = [...events]; newEvs[idx].newPrice = parseFloat(e.target.value) || 0; setEvents(newEvs); }} 
                          placeholder="Örn: 15.50"
                          className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded p-1.5 text-sm outline-none focus:border-[#10b981] w-full min-w-0"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button 
                onClick={() => setEvents([{date: new Date().toISOString().split('T')[0], ratio: 100, newPrice: 0}, ...events])} 
                className="flex items-center justify-center gap-1.5 text-xs bg-[#10b981]/10 hover:bg-[#10b981]/20 text-[#10b981] rounded-lg p-2.5 font-bold transition-colors w-full border border-[#10b981]/20"
              >
                <Plus size={14} /> Yeni Bölünme Ekle
              </button>
            </div>
          </Card>
        </div>

        {/* Sağ Taraf: Timeline Sonucu */}
        <div className="md:col-span-2 flex justify-center">
          <div 
            ref={captureRef} 
            className={`flex flex-col w-full max-w-md ${isCapturing ? 'p-8 bg-[#0b1121] text-white rounded-3xl border border-[#1e293b]' : ''}`}
            style={isCapturing ? { width: '500px', minWidth: '500px', margin: '0 auto' } : undefined}
          >
            {/* Header Section */}
            <div className="flex flex-col items-center mb-6">
              {isCapturing && <span className="text-[28px] font-extrabold italic tracking-tight bg-gradient-to-r from-[#10b981] to-[#3b82f6] bg-clip-text text-transparent drop-shadow-sm mb-4">Borsa Defterim</span>}
              <h2 className="text-xl font-bold uppercase tracking-widest text-[#f59e0b] mb-1">BEDELSİZ BÖLÜNME HARİTASI</h2>
              <h3 className="text-2xl font-extrabold mb-6 text-center">{ticker || 'HİSSE'} <span className="text-[#f59e0b]">{totalGrowthMultiplier.toFixed(1)}X</span></h3>
              
              {/* Stats Bar */}
              <div className={`grid grid-cols-2 sm:grid-cols-4 gap-px w-full ${isCapturing ? 'bg-[#1e293b]' : 'bg-[var(--border-color)]'} rounded-xl overflow-hidden border ${isCapturing ? 'border-[#1e293b]' : 'border-[var(--border-color)]'}`}>
                <div className={`flex flex-col items-center py-2 ${isCapturing ? 'bg-[#0f172a]' : 'bg-[var(--bg-main)]'}`}>
                  <span className="text-[9px] uppercase font-bold text-[#10b981]">Başlangıç</span>
                  <span className={`font-bold text-sm ${isCapturing ? 'text-white' : ''}`}>{startingLot} Lot</span>
                </div>
                <div className={`flex flex-col items-center py-2 ${isCapturing ? 'bg-[#0f172a]' : 'bg-[var(--bg-main)]'}`}>
                  <span className="text-[9px] uppercase font-bold text-[#f59e0b]">Bugünkü Lot</span>
                  <span className="font-bold text-sm">{currentLot.toFixed(0)}</span>
                </div>
                <div className={`flex flex-col items-center py-2 ${isCapturing ? 'bg-[#0f172a]' : 'bg-[var(--bg-main)]'}`}>
                  <span className="text-[9px] uppercase font-bold text-[#3b82f6]">Bölünme</span>
                  <span className="font-bold text-sm">{events.length} Kez</span>
                </div>
                <div className={`flex flex-col items-center py-2 ${isCapturing ? 'bg-[#0f172a]' : 'bg-[var(--bg-main)]'}`}>
                  <span className="text-[9px] uppercase font-bold text-[#10b981]">Büyüme</span>
                  <span className="font-bold text-sm">{totalGrowthMultiplier.toFixed(1)}X</span>
                </div>
              </div>

              <div className={`mt-6 w-full max-w-xs p-3 rounded-xl border ${isCapturing ? 'border-[#f59e0b]/30 bg-[#f59e0b]/5 text-center' : 'border-[#f59e0b]/30 bg-[#f59e0b]/5 text-center'}`}>
                <span className="text-xs font-bold text-[#f59e0b] uppercase tracking-wider block mb-1">BUGÜNKÜ TEORİK LOT</span>
                <span className="text-3xl font-extrabold text-[#f59e0b]">{currentLot.toFixed(0)} Lot</span>
              </div>
            </div>

            {/* Vertical Timeline */}
            <div className="relative flex flex-col items-center py-4 w-full">
              {/* Center Line */}
              <div className={`absolute top-0 bottom-0 w-1 ${isCapturing ? 'bg-[#f59e0b]/20' : 'bg-[#f59e0b]/20'} left-1/2 -translate-x-1/2 z-0`}></div>
              
              {timelineNodes.map((node, idx) => (
                <div key={idx} className="relative z-10 w-full flex items-center justify-center my-8 px-2 sm:px-8">
                  
                  {/* Left Side: New Price & Arrow */}
                  <div className="flex-1 flex justify-end items-center gap-3 sm:gap-6">
                    <div className={`flex flex-col items-center px-3 py-1.5 rounded-xl border ${isCapturing ? 'bg-[#0f172a] border-[#1e293b]' : 'bg-[var(--bg-card)] border-[var(--border-color)]'} shadow-sm min-w-[80px] text-center`}>
                      <span className="text-[9px] text-[var(--text-muted)] font-bold uppercase mb-0.5">YENİ FİYAT</span>
                      {node.newPrice ? (
                        <div className="flex flex-col items-center leading-tight">
                          <span className="text-[10px] text-[var(--text-muted)] line-through decoration-red-500/50">{node.newPrice.toFixed(2)} ₺</span>
                          <span className="text-sm font-extrabold text-[#10b981]">{(node.newPrice / (1 + (node.ratio / 100))).toFixed(2)} ₺</span>
                        </div>
                      ) : (
                        <span className="text-sm font-extrabold text-[var(--text-muted)]">-</span>
                      )}
                    </div>
                    <div className="text-[var(--text-muted)] font-bold text-xs opacity-40">←</div>
                  </div>

                  {/* Center Node */}
                  <div className={`flex flex-col items-center px-4 py-2 rounded-2xl border-2 border-[#f59e0b] ${isCapturing ? 'bg-[#0b1121]' : 'bg-[var(--bg-main)]'} min-w-[130px] shadow-lg z-10 mx-2 sm:mx-4`}>
                    <span className="text-sm font-extrabold text-[#f59e0b]">%{node.ratio} BEDELSİZ</span>
                    {node.date && <span className="text-[10px] text-[var(--text-muted)] font-bold mt-0.5">{node.date.split('-').reverse().join('.')}</span>}
                  </div>

                  {/* Right Side: Arrow & Total Lot */}
                  <div className="flex-1 flex justify-start items-center gap-3 sm:gap-6">
                    <div className="text-[var(--text-muted)] font-bold text-xs opacity-40">→</div>
                    <div className={`flex flex-col items-center px-3 py-1.5 rounded-xl border ${isCapturing ? 'bg-[#0f172a] border-[#1e293b]' : 'bg-[var(--bg-card)] border-[var(--border-color)]'} shadow-sm min-w-[80px] text-center`}>
                      <span className="text-[9px] text-[var(--text-muted)] font-bold uppercase mb-0.5">TOPLAM LOT</span>
                      <span className="text-sm font-extrabold text-[#f59e0b]">{node.afterLot.toFixed(0)}</span>
                    </div>
                  </div>

                </div>
              ))}
              
              {/* Starting Node at the bottom */}
              <div className="relative z-10 mt-8 mb-2">
                 <div className={`px-4 py-1.5 rounded-lg border ${isCapturing ? 'bg-[#0f172a] border-[#1e293b]' : 'bg-[var(--bg-card)] border-[var(--border-color)]'} text-[10px] text-[var(--text-muted)] font-bold uppercase shadow-sm flex items-center gap-1.5`}>
                   BAŞLANGIÇ: <span className="text-[#f59e0b] text-sm">{startingLot} LOT</span>
                 </div>
              </div>
            </div>
            
            {isCapturing && (
              <div className="text-center mt-6 pt-4 border-t border-[#1e293b] text-[10px] text-slate-500 uppercase tracking-widest font-bold flex justify-between items-center px-4">
                <span>Borsa Defterim ile oluşturuldu</span>
                <span>Yatırım Tavsiyesi Değildir</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
