import React, { useState, useEffect, useMemo } from 'react';
import { Card } from '../components/Card';
import { Modal } from '../components/Modal';
import { Search, Plus, Trash2, Image as ImageIcon, X, Loader2, Share2, Check, ArrowUpDown } from 'lucide-react';
import { useData } from '../context/DataContext';
import { db, storage } from '../utils/firebase';
import { collection, addDoc, onSnapshot, query, orderBy, deleteDoc, doc, getDocs, where } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';

interface Analysis {
  id: string;
  ticker: string;
  title: string;
  content: string;
  imageUrl?: string;
  score?: number | null;
  timestamp: number;
}

const scoreColor = (s: number) =>
  s >= 80
    ? 'bg-[#10b981]/15 text-[#10b981] border-[#10b981]/30'
    : s >= 65
    ? 'bg-[#3b82f6]/15 text-[#3b82f6] border-[#3b82f6]/30'
    : s >= 50
    ? 'bg-yellow-500/15 text-yellow-600 dark:text-yellow-400 border-yellow-500/30'
    : 'bg-red-500/15 text-red-500 border-red-500/30';

const XLogo: React.FC<{ size?: number }> = ({ size = 14 }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" aria-hidden="true">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const shareTextToX = async (text: string) => {
  try { await navigator.clipboard.writeText(text); } catch {}
  window.open('https://x.com/intent/post?text=' + encodeURIComponent(text), '_blank', 'noopener,noreferrer');
};

const ScoreBadge: React.FC<{ score: number; size?: 'sm' | 'lg' }> = ({ score, size = 'sm' }) => (
  <div
    className={`inline-flex items-baseline gap-0.5 font-extrabold rounded-lg border ${scoreColor(score)} ${
      size === 'lg' ? 'px-3 py-1.5 text-xl' : 'px-2 py-0.5 text-sm'
    }`}
    title="Borsa Defterim Skoru (100 üzerinden)"
  >
    {score}
    <span className="text-[0.55em] font-bold opacity-70">/100</span>
  </div>
);

export const BalanceAnalyses: React.FC = () => {
  const { user } = useData(); // Admin ise user dolu gelir
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [searchQuery, setSearchQuery] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('search') || '';
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAnalysis, setSelectedAnalysis] = useState<Analysis | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'newest' | 'score-desc' | 'score-asc' | 'ticker'>('newest');
  const [scoreFilter, setScoreFilter] = useState<'all' | 'strong' | 'medium' | 'weak'>('all');

  // URL'den seçili analizi al
  useEffect(() => {
    if (analyses.length > 0 && !selectedAnalysis) {
      const urlParams = new URLSearchParams(window.location.search);
      const id = urlParams.get('id');
      if (id) {
        const target = analyses.find(a => a.id === id);
        if (target) setSelectedAnalysis(target);
      }
    }
  }, [analyses]);

  const handleSelect = (analysis: Analysis | null) => {
    setSelectedAnalysis(analysis);
    const url = new URL(window.location.href);
    if (analysis) {
      url.searchParams.set('tab', 'balance-analyses');
      url.searchParams.set('id', analysis.id);
    } else {
      url.searchParams.delete('id');
    }
    window.history.pushState({}, '', url);
  };

  const handleShare = (e: React.MouseEvent, analysis: Analysis) => {
    e.stopPropagation(); // Kartın tıklama olayını engelle
    const url = new URL(window.location.href);
    url.searchParams.set('tab', 'balance-analyses');
    url.searchParams.set('id', analysis.id);
    navigator.clipboard.writeText(url.toString());
    setCopiedId(analysis.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Firestore'dan analizleri dinle
  useEffect(() => {
    const q = query(collection(db, 'bilanco_analizleri'), orderBy('timestamp', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data: Analysis[] = [];
      snapshot.forEach((docSnap) => {
        data.push({ id: docSnap.id, ...docSnap.data() } as Analysis);
      });
      setAnalyses(data);
      setIsLoading(false);
    }, (error) => {
      console.error("Firebase fetch error:", error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredAnalyses = useMemo(() => {
    const q = searchQuery.toLowerCase();
    let list = analyses.filter(a =>
      a.ticker.toLowerCase().includes(q) || a.title.toLowerCase().includes(q)
    );
    if (scoreFilter !== 'all') {
      list = list.filter(a => {
        if (typeof a.score !== 'number') return false;
        if (scoreFilter === 'strong') return a.score >= 80;
        if (scoreFilter === 'medium') return a.score >= 50 && a.score < 80;
        return a.score < 50; // weak
      });
    }
    const sorted = [...list];
    if (sortBy === 'score-desc') sorted.sort((a, b) => (b.score ?? -1) - (a.score ?? -1));
    else if (sortBy === 'score-asc') sorted.sort((a, b) => (a.score ?? 101) - (b.score ?? 101));
    else if (sortBy === 'ticker') sorted.sort((a, b) => a.ticker.localeCompare(b.ticker, 'tr'));
    else sorted.sort((a, b) => b.timestamp - a.timestamp); // newest
    return sorted;
  }, [analyses, searchQuery, scoreFilter, sortBy]);

  const scoreChips: { id: typeof scoreFilter; label: string }[] = [
    { id: 'all', label: 'Tümü' },
    { id: 'strong', label: '🟢 Güçlü 80+' },
    { id: 'medium', label: '🟡 Orta 50-79' },
    { id: 'weak', label: '🔴 Zayıf <50' },
  ];

  const handleDelete = async (analysis: Analysis) => {
    if (!confirm('Bu analizi silmek istediğinize emin misiniz?')) return;
    
    try {
      // Önce resmi sil
      if (analysis.imageUrl) {
        try {
          const imageRef = ref(storage, analysis.imageUrl);
          await deleteObject(imageRef);
        } catch (e) {
          console.error("Resim silinemedi (zaten silinmiş olabilir):", e);
        }
      }
      
      // Sonra dokümanı sil
      await deleteDoc(doc(db, 'bilanco_analizleri', analysis.id));
    } catch (e) {
      console.error("Analiz silinirken hata:", e);
      alert("Hata oluştu.");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Bilanço Analizleri</h2>
          <p className="text-[var(--text-muted)] text-sm">
            Hisse senetlerinin temel analiz ve bilanço incelemeleri
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={16} />
            <input 
              type="text" 
              placeholder="Hisse kodu ara (Örn: THYAO)..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-[#8b5cf6] transition-colors"
            />
          </div>
          
          {user && (
            <button 
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 bg-[#8b5cf6] hover:bg-[#7c3aed] text-white px-4 py-2 rounded-xl text-sm font-bold transition-colors whitespace-nowrap w-full sm:w-auto justify-center"
            >
              <Plus size={16} />
              Yeni Analiz Ekle
            </button>
          )}
        </div>
      </div>

      {!isLoading && analyses.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            {scoreChips.map(c => (
              <button
                key={c.id}
                onClick={() => setScoreFilter(c.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                  scoreFilter === c.id
                    ? 'bg-[#8b5cf6] text-white border-[#8b5cf6]'
                    : 'bg-[var(--bg-card)] text-[var(--text-muted)] border-[var(--border-color)] hover:border-[#8b5cf6]/50'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <ArrowUpDown size={16} className="text-[var(--text-muted)]" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-[#8b5cf6]"
            >
              <option value="newest">En Yeni</option>
              <option value="score-desc">Skor (Yüksek → Düşük)</option>
              <option value="score-asc">Skor (Düşük → Yüksek)</option>
              <option value="ticker">Hisse (A-Z)</option>
            </select>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-[#8b5cf6]" size={32} />
        </div>
      ) : filteredAnalyses.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-20 text-center gap-4">
          <div className="w-16 h-16 rounded-full bg-[var(--bg-main)] flex items-center justify-center">
            <Search className="text-[var(--text-muted)]" size={24} />
          </div>
          <div>
            <h3 className="font-bold text-lg mb-1">Analiz Bulunamadı</h3>
            <p className="text-[var(--text-muted)] text-sm">
              Henüz analiz eklenmemiş veya aramanızla eşleşen bir sonuç yok.
            </p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredAnalyses.map(analysis => (
            <Card 
              key={analysis.id} 
              className="flex flex-col overflow-hidden p-0 border border-[var(--border-color)] hover:border-[#8b5cf6] cursor-pointer transition-colors"
              onClick={() => handleSelect(analysis)}
            >
              <div className="p-5 flex flex-col gap-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className="inline-block bg-[#8b5cf6]/10 text-[#8b5cf6] text-xs font-extrabold px-2.5 py-1 rounded-lg">
                        {analysis.ticker}
                      </span>
                      {typeof analysis.score === 'number' && <ScoreBadge score={analysis.score} />}
                    </div>
                    <h3 className="font-bold text-lg leading-tight">{analysis.title}</h3>
                  </div>
                  <div className="flex items-center gap-1 -mr-2 -mt-2">
                    <button 
                      onClick={(e) => handleShare(e, analysis)}
                      className="text-[var(--text-muted)] hover:text-[#8b5cf6] transition-colors p-2"
                      title="Linki Kopyala"
                    >
                      {copiedId === analysis.id ? <Check size={16} className="text-green-500" /> : <Share2 size={16} />}
                    </button>
                    {user && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleDelete(analysis); }}
                        className="text-[var(--text-muted)] hover:text-red-500 transition-colors p-2"
                        title="Analizi Sil"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
                
                <p className="text-[var(--text-muted)] text-sm line-clamp-3 leading-relaxed mt-1">
                  {analysis.content}
                </p>
                
                <div className="text-xs text-[var(--text-muted)] font-medium mt-1">
                  {new Date(analysis.timestamp).toLocaleDateString('tr-TR', {
                    day: 'numeric', month: 'long', year: 'numeric'
                  })}
                </div>
              </div>

              {analysis.imageUrl && (
                <div className="w-full h-48 bg-[var(--bg-main)] relative border-t border-[var(--border-color)]">
                  <img src={analysis.imageUrl} alt={analysis.ticker} className="w-full h-full object-cover opacity-90 hover:opacity-100 transition-opacity" />
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {user && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Yeni Bilanço Analizi"
        >
          <AnalysisForm onClose={() => setIsModalOpen(false)} />
        </Modal>
      )}

      {/* Analiz Detay Modalı */}
      <Modal
        isOpen={!!selectedAnalysis}
        onClose={() => handleSelect(null)}
        title={`${selectedAnalysis?.ticker} - ${selectedAnalysis?.title}`}
      >
        {selectedAnalysis && (
          <div className="flex flex-col gap-5">
            {typeof selectedAnalysis.score === 'number' && (
              <div className="flex items-center gap-3 bg-[var(--bg-card)] p-3 rounded-xl border border-[var(--border-color)]">
                <ScoreBadge score={selectedAnalysis.score} size="lg" />
                <div>
                  <p className="font-bold text-sm">Borsa Defterim Skoru</p>
                  <p className="text-xs text-[var(--text-muted)]">Yapay zekânın 100 üzerinden genel değerlendirmesi</p>
                </div>
              </div>
            )}
            <p className="text-[var(--text-main)] text-sm whitespace-pre-wrap leading-relaxed bg-[var(--bg-card)] p-4 rounded-xl border border-[var(--border-color)]">
              {selectedAnalysis.content}
            </p>
            
            {selectedAnalysis.imageUrl && (
              <div className="w-full rounded-xl overflow-hidden border border-[var(--border-color)] bg-[var(--bg-main)] flex items-center justify-center">
                <img 
                  src={selectedAnalysis.imageUrl} 
                  alt={selectedAnalysis.ticker} 
                  className="w-full max-h-[70vh] object-contain" 
                />
              </div>
            )}
            
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <button
                onClick={() => shareTextToX(selectedAnalysis.content)}
                className="flex items-center gap-1.5 text-sm font-bold bg-black text-white px-4 py-2 rounded-lg hover:bg-black/80 dark:bg-white dark:text-black dark:hover:bg-white/80"
              >
                <XLogo size={14} /> X'te Paylaş
              </button>
              <div className="text-xs text-[var(--text-muted)]">
                Yayınlanma: {new Date(selectedAnalysis.timestamp).toLocaleDateString('tr-TR', {
                  day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
                })}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

// ----------------------------------------------------
// Form Bileşeni
// ----------------------------------------------------
const AnalysisForm: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [ticker, setTicker] = useState('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [score, setScore] = useState<string>('');
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        alert('Resim boyutu 5MB\'dan küçük olmalıdır.');
        return;
      }
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const removeImage = () => {
    setImage(null);
    setImagePreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticker || !title || !content) return;
    
    setIsSubmitting(true);
    const upperTicker = ticker.toUpperCase().trim();

    try {
      let uploadedUrl = '';
      
      // 1. Resim varsa Storage'a yükle
      if (image) {
        const ext = image.name.split('.').pop();
        const fileName = `bilancolar/${upperTicker}_${Date.now()}.${ext}`;
        const storageRef = ref(storage, fileName);
        
        const uploadTask = uploadBytesResumable(storageRef, image);
        
        await new Promise<void>((resolve, reject) => {
          uploadTask.on('state_changed', 
            (snapshot) => {
              const p = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
              setProgress(p);
            },
            (error) => reject(error),
            async () => {
              uploadedUrl = await getDownloadURL(uploadTask.snapshot.ref);
              resolve();
            }
          );
        });
      }

      // 2. Maksimum 2 kuralını uygula (Eskileri sil)
      // Firestore index hatası almamak için orderBy'ı kaldırdık, hafızada sıralayacağız (Zaten en fazla 3 kayıt gelecek)
      const q = query(
        collection(db, 'bilanco_analizleri'), 
        where('ticker', '==', upperTicker)
      );
      const snapshot = await getDocs(q);
      
      const existingDocs: any[] = [];
      snapshot.forEach(doc => existingDocs.push({ id: doc.id, ...doc.data() }));
      
      // Tarihe göre yeniden eskiye sırala
      existingDocs.sort((a, b) => b.timestamp - a.timestamp);
      
      // Eğer zaten 2 (veya daha fazla) analiz varsa, sondakileri sil (sadece en yeni 1 taneyi bırak, yenisi eklenince 2 olacak)
      if (existingDocs.length >= 2) {
        // İlk index en yenidir (desc sıralı). Biz ilk 1 taneyi saklayıp, geri kalan hepsini silmeliyiz.
        const docsToDelete = existingDocs.slice(1);
        
        for (const docToDelete of docsToDelete) {
          // Resmi de Storage'dan sil
          if (docToDelete.imageUrl) {
            try {
              await deleteObject(ref(storage, docToDelete.imageUrl));
            } catch (err) {
              console.warn("Eski resim silinirken hata (bulunamadı):", err);
            }
          }
          await deleteDoc(doc(db, 'bilanco_analizleri', docToDelete.id));
        }
      }

      // 3. Yeni analizi veritabanına ekle
      await addDoc(collection(db, 'bilanco_analizleri'), {
        ticker: upperTicker,
        title,
        content,
        imageUrl: uploadedUrl || null,
        score: score.trim() === '' ? null : Math.max(0, Math.min(100, parseInt(score, 10))),
        timestamp: Date.now()
      });

      onClose();
    } catch (e: any) {
      console.error("Yükleme hatası:", e);
      alert("Hata oluştu: " + e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label className="block text-xs font-bold text-[var(--text-muted)] mb-1 uppercase tracking-wider">Hisse Kodu</label>
        <input 
          type="text" 
          value={ticker} 
          onChange={(e) => setTicker(e.target.value.toUpperCase())}
          placeholder="Örn: THYAO" 
          maxLength={5}
          required
          className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl px-4 py-2 focus:outline-none focus:border-[#8b5cf6]"
        />
      </div>

      <div>
        <label className="block text-xs font-bold text-[var(--text-muted)] mb-1 uppercase tracking-wider">Başlık</label>
        <input 
          type="text" 
          value={title} 
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Örn: 2024/1. Çeyrek Bilanço İncelemesi" 
          required
          className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl px-4 py-2 focus:outline-none focus:border-[#8b5cf6]"
        />
      </div>

      <div>
        <label className="block text-xs font-bold text-[var(--text-muted)] mb-1 uppercase tracking-wider">İçerik (Analiz)</label>
        <textarea 
          value={content} 
          onChange={(e) => setContent(e.target.value)}
          placeholder="Analiz detaylarını buraya yazın..." 
          required
          rows={6}
          className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl px-4 py-2 focus:outline-none focus:border-[#8b5cf6] resize-none"
        />
      </div>

      <div>
        <label className="block text-xs font-bold text-[var(--text-muted)] mb-1 uppercase tracking-wider">Skor (Opsiyonel, 0-100)</label>
        <input
          type="number"
          min={0}
          max={100}
          value={score}
          onChange={(e) => setScore(e.target.value)}
          placeholder="Örn: 85"
          className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl px-4 py-2 focus:outline-none focus:border-[#8b5cf6]"
        />
      </div>

      <div>
        <label className="block text-xs font-bold text-[var(--text-muted)] mb-1 uppercase tracking-wider">Görsel (Opsiyonel, Maks 5MB)</label>
        
        {!imagePreview ? (
          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-[var(--border-color)] rounded-xl cursor-pointer hover:bg-[var(--bg-main)] hover:border-[#8b5cf6] transition-colors">
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <ImageIcon className="w-8 h-8 text-[var(--text-muted)] mb-2" />
              <p className="text-sm text-[var(--text-muted)]"><span className="font-semibold text-[#8b5cf6]">Tıkla</span> ve resim seç</p>
            </div>
            <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
          </label>
        ) : (
          <div className="relative w-full h-48 rounded-xl overflow-hidden border border-[var(--border-color)]">
            <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
            <button 
              type="button" 
              onClick={removeImage}
              className="absolute top-2 right-2 bg-black/60 text-white p-1.5 rounded-full hover:bg-red-500 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        )}
      </div>

      <button 
        type="submit" 
        disabled={isSubmitting}
        className="w-full bg-[#8b5cf6] hover:bg-[#7c3aed] text-white font-bold py-3 rounded-xl mt-4 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="animate-spin" size={20} />
            Yükleniyor... {progress > 0 && `%${progress}`}
          </>
        ) : 'Analizi Yayınla'}
      </button>
    </form>
  );
};
