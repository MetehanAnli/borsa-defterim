import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useData } from '../context/DataContext';
import { Card } from '../components/Card';
import { Rocket, Plus, Trash2 } from 'lucide-react';
import { IpoData } from '../types';

export const IPOs: React.FC = () => {
  const { ipos, user, addIpo, deleteIpo } = useData();
  const [showForm, setShowForm] = useState(false);
  
  const upcomingIpos = ipos.filter(i => i.status === 'Yaklaşan');
  const tradingIpos = ipos.filter(i => i.status === 'İşlem Görüyor');

  const [formData, setFormData] = useState<Omit<IpoData, 'id'>>({
    ticker: '', companyName: '', price: 0, lotAmount: 0, 
    distributionType: 'Tamamı Eşit', dateRange: '', status: 'Yaklaşan'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await addIpo(formData);
    setShowForm(false);
    setFormData({ ticker: '', companyName: '', price: 0, lotAmount: 0, distributionType: 'Tamamı Eşit', dateRange: '', status: 'Yaklaşan' });
  };

  const IpoCard = ({ ipo }: { ipo: IpoData }) => (
    <Card className="flex flex-col gap-4 relative overflow-hidden group">
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
        <div className="text-right">
          <span className="text-2xl font-extrabold bg-gradient-to-r from-[#10b981] to-[#3b82f6] bg-clip-text text-transparent">₺{ipo.price.toFixed(2)}</span>
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
          <p className="text-[10px] uppercase font-bold text-[var(--text-muted)]">Tarih</p>
          <p className="font-semibold text-sm">{ipo.dateRange}</p>
        </div>
      </div>

      {user && (
        <button onClick={() => deleteIpo(ipo.id)} className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 p-2 bg-red-500/20 text-red-500 rounded-lg hover:bg-red-500/40 transition-all">
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
                    <label className="text-xs font-bold text-[var(--text-muted)]">Tarih</label>
                    <input required value={formData.dateRange} onChange={e => setFormData({...formData, dateRange: e.target.value})} className="bg-[var(--bg-main)] border border-[var(--border-color)] rounded p-2 outline-none focus:border-primary" placeholder="14-15 Eylül" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-[var(--text-muted)]">Durum</label>
                    <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as any})} className="bg-[var(--bg-main)] border border-[var(--border-color)] rounded p-2 outline-none focus:border-primary">
                      <option>Yaklaşan</option>
                      <option>İşlem Görüyor</option>
                    </select>
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
    </div>
  );
};
