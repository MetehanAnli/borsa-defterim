import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Card } from '../components/Card';
import { Modal } from '../components/Modal';
import { 
  TrendingUp, TrendingDown, Clock, Activity, 
  CheckCircle, RefreshCw, ChevronDown, ChevronUp, Info, Star, Search
} from 'lucide-react';
import { rtdb } from '../utils/firebase';
import { ref, onValue } from 'firebase/database';

// Tipler
interface FonTahmin {
  ad: string;
  tahmini_degisim: number;
  guncelleme: string;
}

interface FonKesinlesen {
  ad: string;
  fiyat: number;
  gunluk_degisim: number;
  tarih: string;
}

interface MetaBilgi {
  son_guncelleme: string;
  durum: 'canli' | 'kesinlesmis';
  fon_sayisi?: number;
}

export const Funds: React.FC = () => {
  // ŞU ANLIK GİZLEME (YAKINDA GELECEK)
  return (
    <Card className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
      <div className="w-20 h-20 rounded-3xl bg-[#8b5cf6]/10 flex items-center justify-center mb-2">
        <Clock className="text-[#8b5cf6]" size={40} />
      </div>
      <h2 className="text-2xl font-bold">Canlı Fon Takibi</h2>
      <p className="text-[var(--text-muted)] text-center max-w-md">
        Bu bölüm çok yakında eklenecektir. Tüm fonların anlık verileri ve favori sistemleri arka planda hazır durumdadır.
      </p>
    </Card>
  );

  const [tahminler, setTahminler] = useState<Record<string, FonTahmin>>({});
  const [kesinlesenler, setKesinlesenler] = useState<Record<string, FonKesinlesen>>({});
  const [meta, setMeta] = useState<MetaBilgi | null>(null);
  const [selectedFund, setSelectedFund] = useState<string | null>(null);
  const [flashMap, setFlashMap] = useState<Record<string, 'green' | 'red' | null>>({});
  const prevTahminRef = useRef<Record<string, number>>({});
  
  // Arama ve Sıralama State'leri
  const [searchQuery, setSearchQuery] = useState('');
  const [sortKey, setSortKey] = useState<'code' | 'change'>('change');
  const [sortAsc, setSortAsc] = useState(false);
  
  // Favori State
  const [favorites, setFavorites] = useState<string[]>(() => {
    const saved = localStorage.getItem('borsa_defterim_favorites');
    return saved ? JSON.parse(saved) : ["TLY", "PHE", "MAC", "IPB", "TI2", "AK5", "IIH", "NNF", "YAS"];
  });

  // Favoriler değiştiğinde localStorage'a kaydet
  useEffect(() => {
    localStorage.setItem('borsa_defterim_favorites', JSON.stringify(favorites));
  }, [favorites]);

  const toggleFavorite = (code: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites(prev => 
      prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]
    );
  };

  // Firebase RTDB dinleyicileri
  useEffect(() => {
    // Tahminler dinle
    const tahminRef = ref(rtdb, 'canli_fonlar/tahminler');
    const unsubTahmin = onValue(tahminRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const newMeta = data._meta as MetaBilgi;
        if (newMeta) setMeta(newMeta);

        // Flash animasyonu için önceki verilerle karşılaştır
        const newFlash: Record<string, 'green' | 'red' | null> = {};
        const prev = prevTahminRef.current;
        
        Object.keys(data).forEach(code => {
          if (code === '_meta') return;
          const oldVal = prev[code];
          const newVal = data[code]?.tahmini_degisim;
          if (oldVal !== undefined && newVal !== undefined && oldVal !== newVal) {
            newFlash[code] = newVal > oldVal ? 'green' : 'red';
          }
        });

        if (Object.keys(newFlash).length > 0) {
          setFlashMap(newFlash);
          setTimeout(() => setFlashMap({}), 1200);
        }

        // Mevcut değerleri kaydet
        const newPrev: Record<string, number> = {};
        Object.keys(data).forEach(code => {
          if (code !== '_meta' && data[code]?.tahmini_degisim !== undefined) {
            newPrev[code] = data[code].tahmini_degisim;
          }
        });
        prevTahminRef.current = newPrev;

        const { _meta, ...funds } = data;
        setTahminler(funds as Record<string, FonTahmin>);
      }
    });

    // Kesinleşenler dinle
    const kesinRef = ref(rtdb, 'canli_fonlar/kesinlesenler');
    const unsubKesin = onValue(kesinRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const newMeta = data._meta as MetaBilgi;
        if (newMeta?.durum === 'kesinlesmis') setMeta(newMeta);
        
        const { _meta, ...funds } = data;
        setKesinlesenler(funds as Record<string, FonKesinlesen>);
      }
    });

    return () => {
      unsubTahmin();
      unsubKesin();
    };
  }, []);

  // Fon kodlarını filtreleme ve sıralama
  const allCodes = [...new Set([...Object.keys(tahminler), ...Object.keys(kesinlesenler)])];
  
  // Önce aramaya göre filtrele
  let displayCodes = [];
  
  if (!searchQuery.trim()) {
    // Arama yoksa sadece favorileri göster
    displayCodes = allCodes.filter(code => favorites.includes(code));
  } else {
    // Arama varsa eşleşenleri göster
    const searchLower = searchQuery.toLowerCase();
    const matches = allCodes.filter(code => {
      const ad = tahminler[code]?.ad || kesinlesenler[code]?.ad || "";
      return code.toLowerCase().includes(searchLower) || ad.toLowerCase().includes(searchLower);
    });
    
    // Performans için arama sonuçlarını sınırla (favoriler ve ilk 30 sonuç)
    const favs = matches.filter(c => favorites.includes(c));
    const nonFavs = matches.filter(c => !favorites.includes(c)).slice(0, 30);
    displayCodes = [...new Set([...favs, ...nonFavs])];
  }

  const sortedCodes = displayCodes.sort((a, b) => {
    // Favoriler her zaman en üstte
    const aFav = favorites.includes(a);
    const bFav = favorites.includes(b);
    if (aFav && !bFav) return -1;
    if (!aFav && bFav) return 1;

    // Favori durumu aynıysa seçili kritere göre sırala
    if (sortKey === 'code') {
      return sortAsc ? a.localeCompare(b) : b.localeCompare(a);
    }
    const aVal = tahminler[a]?.tahmini_degisim ?? kesinlesenler[a]?.gunluk_degisim ?? -9999;
    const bVal = tahminler[b]?.tahmini_degisim ?? kesinlesenler[b]?.gunluk_degisim ?? -9999;
    return sortAsc ? aVal - bVal : bVal - aVal;
  });

  const isCanli = meta?.durum === 'canli';
  const hasData = allCodes.length > 0;

  const formatTime = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    } catch { return iso; }
  };

  const toggleSort = (key: 'code' | 'change') => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(false); }
  };

  // Seçili fon detayları
  const selectedTahmin = selectedFund ? tahminler[selectedFund] : null;
  const selectedKesin = selectedFund ? kesinlesenler[selectedFund] : null;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Star className="text-[#8b5cf6]" fill="currentColor" /> Tüm Fonlar
          </h2>
          <p className="text-[var(--text-muted)] text-sm">
            Türkiye'deki tüm yatırım fonlarının anlık tahmini getirileri
          </p>
        </div>

        {/* Arama ve Durum Badge */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          {/* Arama Kutusu */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={16} />
            <input 
              type="text" 
              placeholder="Fon kodu veya adı ara..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-[#8b5cf6] transition-colors"
            />
          </div>

          {meta && (
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className={`flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold border whitespace-nowrap flex-1 sm:flex-none ${
                isCanli 
                  ? 'bg-[#10b981]/10 border-[#10b981]/30 text-[#10b981]'
                  : 'bg-[#3b82f6]/10 border-[#3b82f6]/30 text-[#3b82f6]'
              }`}>
                {isCanli ? (
                  <>
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10b981] opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-[#10b981]"></span>
                    </span>
                    Canlı Tahmin
                  </>
                ) : (
                  <>
                    <CheckCircle size={14} />
                    Kesinleşmiş
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Veri yok durumu */}
      {!hasData && (
        <Card className="flex flex-col items-center justify-center gap-4 py-16">
          <div className="w-16 h-16 rounded-2xl bg-[#8b5cf6]/10 flex items-center justify-center">
            <Activity className="text-[#8b5cf6]" size={32} />
          </div>
          <div className="text-center">
            <h3 className="font-bold text-lg mb-1">Fon Verisi Bekleniyor</h3>
            <p className="text-[var(--text-muted)] text-sm max-w-md">
              Python botu henüz veri yazmamış. Botu çalıştırdığınızda veriler burada otomatik görünecektir.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] bg-[var(--bg-main)] px-4 py-2 rounded-xl border border-[var(--border-color)]">
            <RefreshCw size={14} className="animate-spin" />
            Firebase Realtime Database dinleniyor...
          </div>
        </Card>
      )}

      {/* Fon Tablosu */}
      {hasData && (
        <Card className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--border-color)] bg-[var(--bg-main)]">
                  <th className="w-10 px-4 py-3"></th>
                  <th 
                    className="text-left px-4 py-3 text-[10px] uppercase font-bold text-[var(--text-muted)] cursor-pointer hover:text-[var(--text-main)] transition-colors select-none"
                    onClick={() => toggleSort('code')}
                  >
                    <span className="flex items-center gap-1">
                      Fon
                      {sortKey === 'code' && (sortAsc ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
                    </span>
                  </th>
                  <th className="text-left px-4 py-3 text-[10px] uppercase font-bold text-[var(--text-muted)] hidden md:table-cell">
                    Fon Adı
                  </th>
                  <th 
                    className="text-right px-4 py-3 text-[10px] uppercase font-bold text-[var(--text-muted)] cursor-pointer hover:text-[var(--text-main)] transition-colors select-none"
                    onClick={() => toggleSort('change')}
                  >
                    <span className="flex items-center justify-end gap-1">
                      {isCanli ? 'Canlı Tahmin' : 'Tahmin'}
                      {sortKey === 'change' && (sortAsc ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
                    </span>
                  </th>
                  <th className="text-right px-4 py-3 text-[10px] uppercase font-bold text-[var(--text-muted)]">
                    Kesinleşen
                  </th>
                  <th className="text-right px-4 py-3 text-[10px] uppercase font-bold text-[var(--text-muted)] hidden sm:table-cell">
                    Güncelleme
                  </th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {sortedCodes.map((code) => {
                    const tahmin = tahminler[code];
                    const kesin = kesinlesenler[code];
                    const ad = tahmin?.ad || kesin?.ad || code;
                    const tahminVal = tahmin?.tahmini_degisim;
                    const kesinVal = kesin?.gunluk_degisim;
                    const flash = flashMap[code];
                    const guncelleme = tahmin?.guncelleme || '';
                    const isFav = favorites.includes(code);

                    return (
                      <motion.tr
                        key={code}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        onClick={() => setSelectedFund(code)}
                        className="border-b border-[var(--border-color)] last:border-0 cursor-pointer transition-colors"
                      >
                        {/* Favori Yıldızı */}
                        <td className="px-4 py-3 text-center" onClick={(e) => toggleFavorite(code, e)}>
                          <Star 
                            size={16} 
                            className={`cursor-pointer transition-colors ${isFav ? 'text-yellow-500 fill-yellow-500' : 'text-[var(--text-muted)] hover:text-yellow-500'}`} 
                          />
                        </td>

                        {/* Fon Kodu */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-extrabold ${
                              (tahminVal ?? kesinVal ?? 0) >= 0 
                                ? 'bg-[#10b981]/10 text-[#10b981]' 
                                : 'bg-red-500/10 text-red-500'
                            }`}>
                              {(tahminVal ?? kesinVal ?? 0) >= 0 
                                ? <TrendingUp size={16} /> 
                                : <TrendingDown size={16} />
                              }
                            </div>
                            <span className="font-bold text-sm">{code}</span>
                          </div>
                        </td>

                        {/* Fon Adı */}
                        <td className="px-4 py-3 text-sm text-[var(--text-muted)] hidden md:table-cell max-w-[200px] truncate" title={ad}>
                          {ad}
                        </td>

                        {/* Canlı Tahmin */}
                        <td className="px-4 py-3 text-right">
                          {tahminVal !== undefined ? (
                            <span className={`font-extrabold text-sm tabular-nums ${
                              tahminVal >= 0 ? 'text-[#10b981]' : 'text-red-500'
                            }`}>
                              {tahminVal >= 0 ? '+' : ''}{tahminVal.toFixed(2)}%
                            </span>
                          ) : (
                            <span className="text-[var(--text-muted)] text-xs">—</span>
                          )}
                        </td>

                        {/* Kesinleşen */}
                        <td className="px-4 py-3 text-right">
                          {kesinVal !== undefined ? (
                            <div className="flex items-center justify-end gap-1.5">
                              <span className={`font-extrabold text-sm tabular-nums ${
                                kesinVal >= 0 ? 'text-[#10b981]' : 'text-red-500'
                              }`}>
                                {kesinVal >= 0 ? '+' : ''}{kesinVal.toFixed(2)}%
                              </span>
                              <CheckCircle size={12} className="text-[#3b82f6]" />
                            </div>
                          ) : (
                            <span className="text-[var(--text-muted)] text-xs">—</span>
                          )}
                        </td>

                        {/* Güncelleme */}
                        <td className="px-4 py-3 text-right text-xs text-[var(--text-muted)] font-medium hidden sm:table-cell">
                          {guncelleme ? formatTime(guncelleme) : '—'}
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
                
                {sortedCodes.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-[var(--text-muted)] text-sm">
                      Aramanıza uygun fon bulunamadı.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Tablo altı bilgi */}
          {meta && (
            <div className="px-4 py-3 bg-[var(--bg-main)] border-t border-[var(--border-color)] flex items-center justify-between text-xs text-[var(--text-muted)]">
              <div className="flex items-center gap-1.5">
                <Info size={12} />
                {meta.fon_sayisi} fon listede
              </div>
              <div className="flex items-center gap-1.5">
                <Clock size={12} />
                Son API Güncellemesi: {formatTime(meta.son_guncelleme)}
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Bilgilendirme */}
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] bg-[var(--bg-card)] border border-[var(--border-color)] px-3 py-2 rounded-xl">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10b981] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#10b981]"></span>
          </span>
          <span>Canlı Tahmin: Veriler fvt.com.tr'den alınmıştır.</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] bg-[var(--bg-card)] border border-[var(--border-color)] px-3 py-2 rounded-xl">
          <CheckCircle size={12} className="text-[#3b82f6]" />
          <span>Kesinleşen: TEFAS resmi günlük getiri</span>
        </div>
      </div>

      {/* Fon Detay Modal */}
      <Modal
        isOpen={!!selectedFund}
        onClose={() => setSelectedFund(null)}
        title={selectedFund ? `${selectedFund} Detay` : 'Fon Detayı'}
      >
        {selectedFund && (
          <div className="flex flex-col gap-5">
            {/* Fon Başlığı */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg">{selectedTahmin?.ad || selectedKesin?.ad || selectedFund}</h3>
                <p className="text-sm text-[var(--text-muted)]">{selectedFund}</p>
              </div>
              <div className="text-right">
                {selectedTahmin?.tahmini_degisim !== undefined && (
                  <div className={`text-2xl font-extrabold ${
                    selectedTahmin.tahmini_degisim >= 0 ? 'text-[#10b981]' : 'text-red-500'
                  }`}>
                    {selectedTahmin.tahmini_degisim >= 0 ? '+' : ''}
                    {selectedTahmin.tahmini_degisim.toFixed(2)}%
                  </div>
                )}
                <span className="text-xs text-[var(--text-muted)]">
                  {isCanli ? 'Canlı Tahmin' : 'Son Tahmin'}
                </span>
              </div>
            </div>

            {/* Kesinleşen Bilgi */}
            {selectedKesin && (
              <div className="bg-[#3b82f6]/10 border border-[#3b82f6]/30 p-4 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle size={18} className="text-[#3b82f6]" />
                  <span className="text-sm font-bold">Kesinleşen Getiri</span>
                </div>
                <div className="text-right">
                  <span className={`font-extrabold text-lg ${
                    selectedKesin.gunluk_degisim >= 0 ? 'text-[#10b981]' : 'text-red-500'
                  }`}>
                    {selectedKesin.gunluk_degisim >= 0 ? '+' : ''}{selectedKesin.gunluk_degisim.toFixed(2)}%
                  </span>
                  <p className="text-xs text-[var(--text-muted)]">
                    ₺{selectedKesin.fiyat?.toFixed(6)} • {selectedKesin.tarih}
                  </p>
                </div>
              </div>
            )}

            {/* Bilgilendirme Notu */}
            <div className="bg-[var(--bg-main)] p-4 rounded-xl border border-[var(--border-color)] text-sm text-[var(--text-muted)] text-center">
              Bu fon için detaylı hisse kırılım verisi bulunmamaktadır. Canlı tahmin oranları direkt olarak FVT sistemi üzerinden aktarılmaktadır.
            </div>

            {/* Güncelleme bilgisi */}
            <div className="text-center text-xs text-[var(--text-muted)]">
              <Clock size={12} className="inline mr-1" />
              Son güncelleme: {selectedTahmin?.guncelleme ? formatTime(selectedTahmin.guncelleme) : '—'}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
