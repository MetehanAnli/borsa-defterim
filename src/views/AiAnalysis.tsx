import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card } from '../components/Card';
import { useData } from '../context/DataContext';
import { Sparkles, Upload, Copy, Check, RefreshCw, Trash2, KeyRound, Lock, ExternalLink, AlertCircle, Send, CheckCircle2, LineChart } from 'lucide-react';
import { generateFinancialAnalysis, extractScore, GEMINI_MODEL } from '../utils/geminiAnalysis';
import { db, storage } from '../utils/firebase';
import { collection, addDoc, getDocs, getDoc, setDoc, query, where, deleteDoc, doc } from 'firebase/firestore';
import { ref, uploadString, getDownloadURL, deleteObject } from 'firebase/storage';

const API_KEY_STORAGE = 'bd-gemini-key';

const XLogo: React.FC<{ size?: number }> = ({ size = 14 }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" aria-hidden="true">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

export const AiAnalysis: React.FC = () => {
  const { user } = useData();

  const [apiKey, setApiKey] = useState('');
  const [keyInput, setKeyInput] = useState('');
  const [keySaved, setKeySaved] = useState(false);
  const [showKeyEditor, setShowKeyEditor] = useState(false);

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imageMime, setImageMime] = useState<string>('image/png');
  const [extra, setExtra] = useState('');

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [xShared, setXShared] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  // Alıntılama: hisse başına son X gönderi linki (Firestore: x_last_posts/{ticker})
  const [xPrevUrl, setXPrevUrl] = useState<string>('');
  const [xUrlInput, setXUrlInput] = useState<string>('');
  const [xUrlSaved, setXUrlSaved] = useState(false);

  // Bilançolar'da yayınlama
  const [showPublish, setShowPublish] = useState(false);
  const [pubTicker, setPubTicker] = useState('');
  const [pubTitle, setPubTitle] = useState('');
  const [includeImage, setIncludeImage] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [published, setPublished] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem(API_KEY_STORAGE) || '';
    setApiKey(saved);
    setKeyInput(saved);
    if (!saved) setShowKeyEditor(true);
  }, []);

  const saveKey = () => {
    localStorage.setItem(API_KEY_STORAGE, keyInput.trim());
    setApiKey(keyInput.trim());
    setKeySaved(true);
    setShowKeyEditor(false);
    setTimeout(() => setKeySaved(false), 2000);
  };

  const loadFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Lütfen bir görsel dosyası seçin (PNG/JPG).');
      return;
    }
    setError(null);
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setImagePreview(dataUrl);
      const comma = dataUrl.indexOf(',');
      setImageMime(dataUrl.slice(5, dataUrl.indexOf(';')) || 'image/png');
      setImageBase64(dataUrl.slice(comma + 1));
    };
    reader.readAsDataURL(file);
  }, []);

  // Pano'dan yapıştırma (Ctrl+V) ile görsel al
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const item = Array.from(e.clipboardData?.items || []).find((i) => i.type.startsWith('image/'));
      const file = item?.getAsFile();
      if (file) loadFile(file);
    };
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, [loadFile]);

  const runAnalysis = async () => {
    if (!apiKey) { setError('Önce Gemini API anahtarını kaydet.'); setShowKeyEditor(true); return; }
    if (!imageBase64) { setError('Analiz için bir Matriks görseli yükle.'); return; }
    setLoading(true);
    setError(null);
    setResult('');
    try {
      const text = await generateFinancialAnalysis({ apiKey, base64: imageBase64, mimeType: imageMime, extraInstruction: extra });
      setResult(text);
    } catch (e: any) {
      console.error('AI analysis error', e);
      const msg = String(e?.message || e);
      if (/API key|API_KEY|401|403|permission|invalid/i.test(msg)) {
        setError('API anahtarı geçersiz veya yetkisiz. Anahtarını kontrol et.');
      } else if (/quota|429|rate/i.test(msg)) {
        setError('Ücretsiz kota doldu veya çok sık istek attın. Biraz bekleyip tekrar dene.');
      } else {
        setError('Analiz üretilemedi: ' + msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const copyResult = async () => {
    try {
      await navigator.clipboard.writeText(result);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError('Kopyalanamadı. Metni elle seçip kopyalayabilirsin.');
    }
  };

  const shareToX = async () => {
    // Önceki gönderi linki varsa metnin sonuna ekle -> X onu alıntı olarak gösterir.
    const shareText = xPrevUrl ? `${result}\n\n${xPrevUrl}` : result;
    const encoded = encodeURIComponent(shareText);
    // BOSSA (~9662) sorunsuz açıldığından, o boyuta kadar X otomatik doldurur;
    // daha uzun metinler URL sınırını aşıp hata verdiği için panoya kopyalanır.
    if (encoded.length <= 9700) {
      window.open('https://x.com/intent/post?text=' + encoded, '_blank', 'noopener,noreferrer');
      return;
    }
    // Uzun metin URL sınırını aşar ("URI Too Long"): panoya kopyala + boş composer aç.
    try { await navigator.clipboard.writeText(shareText); } catch {}
    setXShared(true);
    setTimeout(() => setXShared(false), 8000);
    window.open('https://x.com/compose/post', '_blank', 'noopener,noreferrer');
  };

  const clearImage = () => {
    setImagePreview(null);
    setImageBase64(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Analiz metninin ilk satırından ("#TURSG | 2026/6 Finansal Görünüm") kod ve başlığı çıkar
  const extractMeta = (text: string) => {
    const first = text.split('\n').find((l) => l.trim()) || '';
    const m = first.match(/#?\s*([A-Za-zÇĞİÖŞÜçğıöşü0-9]{2,6})\s*\|\s*(.+)/);
    return { ticker: (m?.[1] || '').toUpperCase(), title: (m?.[2] || '').trim() };
  };

  const openPublish = () => {
    const meta = extractMeta(result);
    setPubTicker(meta.ticker);
    setPubTitle(meta.title || 'Finansal Analiz');
    setPublishError(null);
    setShowPublish(true);
  };

  // Analiz üretildiğinde, bu hissenin daha önce kaydedilmiş X gönderi linkini yükle.
  useEffect(() => {
    const meta = extractMeta(result);
    if (!result || !meta.ticker) { setXPrevUrl(''); setXUrlInput(''); return; }
    let active = true;
    (async () => {
      try {
        const snap = await getDoc(doc(db, 'x_last_posts', meta.ticker));
        const url = snap.exists() ? (snap.data() as any).url || '' : '';
        if (active) { setXPrevUrl(url); setXUrlInput(url); }
      } catch {
        if (active) { setXPrevUrl(''); setXUrlInput(''); }
      }
    })();
    return () => { active = false; };
  }, [result]);

  const saveXUrl = async () => {
    const meta = extractMeta(result);
    const url = xUrlInput.trim();
    if (!meta.ticker || !url) return;
    try {
      await setDoc(doc(db, 'x_last_posts', meta.ticker), { url, ticker: meta.ticker, updatedAt: Date.now() });
      setXPrevUrl(url);
      setXUrlSaved(true);
      setTimeout(() => setXUrlSaved(false), 2500);
    } catch (e) {
      console.error('X link kaydedilemedi', e);
    }
  };

  const publishToBilanco = async () => {
    if (!pubTicker.trim()) { setPublishError('Hisse kodu gerekli.'); return; }
    setPublishing(true);
    setPublishError(null);
    try {
      const upperTicker = pubTicker.toUpperCase().trim();
      let uploadedUrl: string | null = null;

      // Matriks görselini Storage'a yükle (mevcut Bilançolar akışıyla aynı)
      if (includeImage && imagePreview) {
        const ext = (imageMime.split('/')[1] || 'png').replace('jpeg', 'jpg');
        const storageRef = ref(storage, `bilancolar/${upperTicker}_${Date.now()}.${ext}`);
        await uploadString(storageRef, imagePreview, 'data_url');
        uploadedUrl = await getDownloadURL(storageRef);
      }

      // Hisse başına en fazla 2 kayıt: en yeni 1'i tut, gerisini sil
      const snap = await getDocs(query(collection(db, 'bilanco_analizleri'), where('ticker', '==', upperTicker)));
      const existing: any[] = [];
      snap.forEach((d) => existing.push({ id: d.id, ...d.data() }));
      existing.sort((a, b) => b.timestamp - a.timestamp);
      for (const d of existing.slice(1)) {
        if (d.imageUrl) { try { await deleteObject(ref(storage, d.imageUrl)); } catch {} }
        await deleteDoc(doc(db, 'bilanco_analizleri', d.id));
      }

      await addDoc(collection(db, 'bilanco_analizleri'), {
        ticker: upperTicker,
        title: pubTitle.trim() || 'Finansal Analiz',
        content: result,
        imageUrl: uploadedUrl,
        score: extractScore(result),
        timestamp: Date.now(),
      });

      setShowPublish(false);
      setPublished(true);
      setTimeout(() => setPublished(false), 5000);
    } catch (e: any) {
      console.error('Bilanço yayınlama hatası', e);
      setPublishError('Yayınlanamadı: ' + (e?.message || e));
    } finally {
      setPublishing(false);
    }
  };

  if (!user) {
    return (
      <Card className="flex flex-col items-center justify-center gap-3 py-16 text-center">
        <Lock className="text-[var(--text-muted)]" size={40} />
        <h2 className="text-xl font-bold">Bu bölüm yöneticiye özeldir</h2>
        <p className="text-[var(--text-muted)] text-sm max-w-md">AI Analiz aracı yalnızca yönetici hesabıyla kullanılabilir.</p>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Sparkles className="text-[#8b5cf6]" /> AI Finansal Analiz
        </h2>
        <p className="text-[var(--text-muted)] text-sm">Matriks özet raporunun ekran görüntüsünü yükle, yapay zeka senin tarzında analiz yazsın.</p>
      </div>

      {/* API Anahtarı */}
      <Card className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold">
            <KeyRound size={18} className="text-[#8b5cf6]" /> Gemini API Anahtarı
            {apiKey && !showKeyEditor && (
              <span className="text-xs font-medium text-[#10b981] bg-[#10b981]/10 px-2 py-0.5 rounded-full">Kayıtlı</span>
            )}
          </div>
          {apiKey && !showKeyEditor && (
            <button onClick={() => setShowKeyEditor(true)} className="text-xs font-bold text-[#8b5cf6] hover:underline">Değiştir</button>
          )}
        </div>
        {showKeyEditor ? (
          <div className="flex flex-col gap-2">
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="password"
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                placeholder="AIza... (Google AI Studio anahtarı)"
                className="flex-1 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-lg p-2.5 outline-none focus:border-[#8b5cf6] text-sm font-mono"
              />
              <button onClick={saveKey} disabled={!keyInput.trim()} className="px-5 py-2.5 bg-[#8b5cf6] text-white rounded-lg font-medium hover:bg-[#8b5cf6]/90 disabled:opacity-50 flex items-center justify-center gap-2">
                {keySaved ? <Check size={16} /> : null} Kaydet
              </button>
            </div>
            <p className="text-xs text-[var(--text-muted)] flex items-center gap-1.5 flex-wrap">
              <AlertCircle size={13} /> Anahtar yalnızca bu tarayıcıda saklanır, siteye gömülmez.
              <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer" className="text-[#8b5cf6] hover:underline inline-flex items-center gap-0.5">
                Ücretsiz anahtar al <ExternalLink size={11} />
              </a>
              <span className="opacity-60">• Model: {GEMINI_MODEL}</span>
            </p>
          </div>
        ) : null}
      </Card>

      {/* Görsel Yükleme */}
      <Card className="flex flex-col gap-4">
        <div className="flex items-center gap-2 font-bold"><Upload size={18} className="text-[#8b5cf6]" /> Matriks Görseli</div>

        {imagePreview ? (
          <div className="relative group">
            <img src={imagePreview} alt="Yüklenen görsel" className="w-full rounded-xl border border-[var(--border-color)]" />
            <button onClick={clearImage} className="absolute top-2 right-2 p-2 bg-black/60 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/80" title="Görseli kaldır">
              <Trash2 size={16} />
            </button>
          </div>
        ) : (
          <button
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files?.[0]; if (f) loadFile(f); }}
            className={`flex flex-col items-center justify-center gap-2 py-12 rounded-xl border-2 border-dashed transition-colors ${dragOver ? 'border-[#8b5cf6] bg-[#8b5cf6]/5' : 'border-[var(--border-color)] hover:border-[#8b5cf6]/50'}`}
          >
            <Upload size={28} className="text-[var(--text-muted)]" />
            <span className="text-sm font-medium">Tıkla, sürükle-bırak veya <b>Ctrl+V</b> ile yapıştır</span>
            <span className="text-xs text-[var(--text-muted)]">PNG / JPG</span>
          </button>
        )}
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) loadFile(f); }} />

        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold text-[var(--text-muted)]">Ek talimat (opsiyonel)</label>
          <input
            value={extra}
            onChange={(e) => setExtra(e.target.value)}
            placeholder="Örn: daha kısa yaz, temettü vurgusu ekle..."
            className="bg-[var(--bg-main)] border border-[var(--border-color)] rounded-lg p-2.5 outline-none focus:border-[#8b5cf6] text-sm"
          />
        </div>

        <button
          onClick={runAnalysis}
          disabled={loading || !imageBase64}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-[#8b5cf6] to-[#6366f1] text-white rounded-xl font-bold hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {loading ? <RefreshCw size={18} className="animate-spin" /> : <Sparkles size={18} />}
          {loading ? 'Analiz üretiliyor...' : 'Analiz Et'}
        </button>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-500 p-3 rounded-lg text-sm font-medium flex items-start gap-2">
            <AlertCircle size={16} className="shrink-0 mt-0.5" /> {error}
          </div>
        )}
      </Card>

      {/* Sonuç */}
      {result && (
        <Card className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold"><Sparkles size={18} className="text-[#10b981]" /> Analiz Sonucu</div>
            <div className="flex gap-2 flex-wrap">
              <button onClick={runAnalysis} disabled={loading} className="flex items-center gap-1.5 text-xs font-bold text-[#8b5cf6] hover:bg-[#8b5cf6]/10 px-3 py-1.5 rounded-lg disabled:opacity-50">
                <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Yeniden Üret
              </button>
              <button onClick={copyResult} className="flex items-center gap-1.5 text-xs font-bold bg-[#10b981]/10 text-[#10b981] px-3 py-1.5 rounded-lg hover:bg-[#10b981]/20">
                {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? 'Kopyalandı' : 'Kopyala'}
              </button>
              <button onClick={shareToX} className="flex items-center gap-1.5 text-xs font-bold bg-black text-white px-3 py-1.5 rounded-lg hover:bg-black/80 dark:bg-white dark:text-black dark:hover:bg-white/80">
                <XLogo size={13} /> X'te Paylaş
              </button>
              <button onClick={openPublish} className="flex items-center gap-1.5 text-xs font-bold bg-[#8b5cf6]/10 text-[#8b5cf6] px-3 py-1.5 rounded-lg hover:bg-[#8b5cf6]/20">
                <LineChart size={14} /> Bilançolar'da Yayınla
              </button>
            </div>
          </div>
          <textarea
            value={result}
            onChange={(e) => setResult(e.target.value)}
            className="w-full min-h-[500px] bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl p-4 outline-none focus:border-[#8b5cf6] text-sm leading-relaxed font-mono resize-y"
            spellCheck={false}
          />
          <p className="text-xs text-[var(--text-muted)]">Metni düzenleyip kopyalayabilirsin. Paylaşırken Matriks görselini de eklemeyi unutma. ⚠️ Yatırım tavsiyesi değildir.</p>

          {xShared && (
            <div className="bg-[var(--bg-main)] border border-[var(--border-color)] p-3 rounded-lg text-sm font-medium flex items-center gap-2">
              <XLogo size={15} /> Metin panoya kopyalandı. X'te <b>Ctrl+V</b> ile yapıştır, Matriks görselini ekle ve paylaş.
            </div>
          )}

          {/* Alıntılama: önceki gönderi linki */}
          <div className="bg-[var(--bg-main)] border border-[var(--border-color)] rounded-lg p-3 flex flex-col gap-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--text-muted)]">
              <XLogo size={12} /> Alıntılama (opsiyonel)
            </div>
            {xPrevUrl ? (
              <p className="text-xs text-[#10b981] font-medium flex items-center gap-1">
                <Check size={13} /> Bu hissenin önceki gönderisi paylaşımda otomatik alıntılanacak.
              </p>
            ) : (
              <p className="text-xs text-[var(--text-muted)]">Bu hisse için kayıtlı önceki gönderi yok.</p>
            )}
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                value={xUrlInput}
                onChange={(e) => setXUrlInput(e.target.value)}
                placeholder="https://x.com/kullanici/status/..."
                className="flex-1 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg p-2 text-sm outline-none focus:border-[#8b5cf6]"
              />
              <button
                onClick={saveXUrl}
                disabled={!xUrlInput.trim()}
                className="px-4 py-2 bg-[#8b5cf6]/15 text-[#8b5cf6] rounded-lg text-sm font-bold hover:bg-[#8b5cf6]/25 disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {xUrlSaved ? <Check size={14} /> : null} Linki Kaydet
              </button>
            </div>
            <p className="text-[11px] text-[var(--text-muted)]">Paylaştıktan sonra o gönderinin linkini buraya yapıştırıp kaydet; bir sonraki analizde otomatik alıntılanır.</p>
          </div>

          {published && (
            <div className="bg-[#10b981]/10 border border-[#10b981]/30 text-[#10b981] p-3 rounded-lg text-sm font-medium flex items-center gap-2">
              <CheckCircle2 size={16} /> Bilançolar sekmesinde yayınlandı. Herkes görebilir.
            </div>
          )}

          {showPublish && (
            <div className="bg-[var(--bg-main)] border-2 border-dashed border-[#8b5cf6] rounded-xl p-4 flex flex-col gap-3 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center gap-2 font-bold text-sm"><LineChart size={16} className="text-[#8b5cf6]" /> Bilançolar'da Yayınla</div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-[var(--text-muted)]">Hisse Kodu</label>
                  <input value={pubTicker} onChange={(e) => setPubTicker(e.target.value.toUpperCase())} maxLength={6} placeholder="TURSG" className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg p-2 outline-none focus:border-[#8b5cf6] uppercase text-sm" />
                </div>
                <div className="flex flex-col gap-1 sm:col-span-2">
                  <label className="text-xs font-bold text-[var(--text-muted)]">Başlık</label>
                  <input value={pubTitle} onChange={(e) => setPubTitle(e.target.value)} placeholder="Örn: 2026/6 Finansal Görünüm" className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg p-2 outline-none focus:border-[#8b5cf6] text-sm" />
                </div>
              </div>
              {imagePreview && (
                <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                  <input type="checkbox" checked={includeImage} onChange={(e) => setIncludeImage(e.target.checked)} className="w-4 h-4 accent-[#8b5cf6]" />
                  Matriks görselini karta ekle
                </label>
              )}
              {publishError && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-500 p-2.5 rounded-lg text-sm font-medium flex items-start gap-2">
                  <AlertCircle size={15} className="shrink-0 mt-0.5" /> {publishError}
                </div>
              )}
              <div className="flex justify-end gap-2">
                <button onClick={() => setShowPublish(false)} disabled={publishing} className="px-4 py-2 rounded-lg text-[var(--text-muted)] hover:bg-[var(--bg-card)] text-sm disabled:opacity-50">İptal</button>
                <button onClick={publishToBilanco} disabled={publishing || !pubTicker.trim()} className="flex items-center gap-2 px-5 py-2 bg-[#8b5cf6] text-white rounded-lg font-bold hover:bg-[#8b5cf6]/90 disabled:opacity-50 text-sm">
                  {publishing ? <RefreshCw size={15} className="animate-spin" /> : <Send size={15} />}
                  {publishing ? 'Yayınlanıyor...' : 'Yayınla'}
                </button>
              </div>
              <p className="text-xs text-[var(--text-muted)]">Not: Aynı hisse için en fazla 2 analiz tutulur; en eskisi otomatik silinir (mevcut Bilançolar kuralı).</p>
            </div>
          )}
        </Card>
      )}
    </div>
  );
};
