import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { exportToCSV } from '../utils/export';
import { LogIn, LogOut, User, Target, Database, Download, AlertTriangle } from 'lucide-react';

export const Settings: React.FC = () => {
  const { data, user, loginWithGoogle, logout, updateTargetPortfolio, injectDemoData, clearAllData } = useData();
  const [targetVal, setTargetVal] = useState<string>(data.settings.targetPortfolioValue.toString());

  const handleUpdateTarget = () => {
    updateTargetPortfolio(Number(targetVal));
    alert('Portföy hedefi güncellendi!');
  };

  return (
    <div className="flex flex-col max-w-2xl mx-auto gap-6">
      <h2 className="text-2xl font-bold">Ayarlar</h2>

      <Card className="flex flex-col gap-6">
        <div className="flex items-center gap-3 border-b border-[var(--border-color)] pb-4">
          <User className="text-primary" size={24} />
          <h3 className="font-semibold text-lg">Kullanıcı Bilgileri</h3>
        </div>
        
        <div className="flex flex-col gap-4">
          <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-500/10 text-blue-500 border border-blue-500/20">
            <AlertTriangle size={20} className="shrink-0 mt-0.5" />
            <div className="flex flex-col gap-1 text-sm">
              <span className="font-bold">Local-First (Güvenli Mod)</span>
              <span>Şu anda verileriniz %100 güvenli bir şekilde sadece bu cihazın (tarayıcınızın) belleğinde saklanmaktadır. Herhangi bir uzak sunucuya veya buluta aktarılmaz. Farklı bir cihaza geçerken verilerinizi "Verileri Dışa Aktar" bölümünden indirebilirsiniz.</span>
            </div>
          </div>
        </div>
      </Card>

      <Card className="flex flex-col gap-6">
        <div className="flex items-center gap-3 border-b border-[var(--border-color)] pb-4">
          <Target className="text-primary" size={24} />
          <h3 className="font-semibold text-lg">Portföy Hedefi</h3>
        </div>
        <div className="flex items-end gap-4">
          <Input 
            label="Hedef Portföy Büyüklüğü (₺)" 
            type="number" 
            value={targetVal} 
            onChange={e => setTargetVal(e.target.value)} 
            className="max-w-xs"
          />
          <Button onClick={handleUpdateTarget}>Güncelle</Button>
        </div>
      </Card>

      <Card className="flex flex-col gap-6">
        <div className="flex items-center gap-3 border-b border-[var(--border-color)] pb-4">
          <Database className="text-primary" size={24} />
          <h3 className="font-semibold text-lg">Veri Yönetimi</h3>
        </div>
        
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between p-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-main)]">
            <div className="flex flex-col">
              <span className="font-medium">Demo Verileri Yükle</span>
              <span className="text-sm text-[var(--text-muted)]">Uygulamayı test etmek için sahte veriler ekler.</span>
            </div>
            <Button variant="secondary" onClick={() => { injectDemoData(); alert('Demo veriler eklendi!'); }}>
              Yükle
            </Button>
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-main)]">
            <div className="flex flex-col">
              <span className="font-medium">Verileri Dışa Aktar</span>
              <span className="text-sm text-[var(--text-muted)]">İşlemleri ve temettüleri CSV olarak indirir.</span>
            </div>
            <Button variant="secondary" onClick={() => exportToCSV(data.trades, data.dividends)}>
              <Download size={16} /> CSV İndir
            </Button>
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl border border-[#f43f5e]/20 bg-[#f43f5e]/5">
            <div className="flex flex-col">
              <span className="font-medium text-[#f43f5e]">Tüm Verileri Sil</span>
              <span className="text-sm text-[var(--text-muted)]">Bu işlem geri alınamaz.</span>
            </div>
            <Button variant="danger" onClick={clearAllData}>
              <Trash2 size={16} /> Sil
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

// Trash2 missing from imports, need to add it:
import { Trash2 } from 'lucide-react';
