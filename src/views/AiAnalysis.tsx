import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card } from '../components/Card';
import { useData } from '../context/DataContext';
import { Sparkles, Upload, Copy, Check, RefreshCw, Trash2, KeyRound, Lock, ExternalLink, AlertCircle } from 'lucide-react';
import { generateFinancialAnalysis, GEMINI_MODEL } from '../utils/geminiAnalysis';

const API_KEY_STORAGE = 'bd-gemini-key';

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
  const [dragOver, setDragOver] = useState(false);

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
    if (!imageBase64) { setError('Analiz için bir Fintables görseli yükle.'); return; }
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

  const clearImage = () => {
    setImagePreview(null);
    setImageBase64(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
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
        <p className="text-[var(--text-muted)] text-sm">Fintables özet raporunun ekran görüntüsünü yükle, yapay zeka senin tarzında analiz yazsın.</p>
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
        <div className="flex items-center gap-2 font-bold"><Upload size={18} className="text-[#8b5cf6]" /> Fintables Görseli</div>

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
            <div className="flex gap-2">
              <button onClick={runAnalysis} disabled={loading} className="flex items-center gap-1.5 text-xs font-bold text-[#8b5cf6] hover:bg-[#8b5cf6]/10 px-3 py-1.5 rounded-lg disabled:opacity-50">
                <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Yeniden Üret
              </button>
              <button onClick={copyResult} className="flex items-center gap-1.5 text-xs font-bold bg-[#10b981]/10 text-[#10b981] px-3 py-1.5 rounded-lg hover:bg-[#10b981]/20">
                {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? 'Kopyalandı' : 'Kopyala'}
              </button>
            </div>
          </div>
          <textarea
            value={result}
            onChange={(e) => setResult(e.target.value)}
            className="w-full min-h-[500px] bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl p-4 outline-none focus:border-[#8b5cf6] text-sm leading-relaxed font-mono resize-y"
            spellCheck={false}
          />
          <p className="text-xs text-[var(--text-muted)]">Metni düzenleyip kopyalayabilirsin. Paylaşırken Fintables görselini de eklemeyi unutma. ⚠️ Yatırım tavsiyesi değildir.</p>
        </Card>
      )}
    </div>
  );
};
