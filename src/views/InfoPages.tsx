import React from 'react';
import { Card } from '../components/Card';
import { Shield, Info, Mail, TrendingUp } from 'lucide-react';

// ÖNEMLİ: Buraya kendi gerçek iletişim e-postanı yaz (AdSense çalışan bir iletişim ister).
export const CONTACT_EMAIL = 'ygzars0@gmail.com';

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="flex flex-col gap-2">
    <h3 className="font-bold text-lg">{title}</h3>
    <div className="text-[var(--text-muted)] text-sm leading-relaxed flex flex-col gap-2">{children}</div>
  </div>
);

export const PrivacyPolicy: React.FC = () => (
  <div className="flex flex-col gap-6 max-w-3xl">
    <div>
      <h2 className="text-2xl font-bold flex items-center gap-2"><Shield className="text-[#8b5cf6]" /> Gizlilik Politikası</h2>
      <p className="text-[var(--text-muted)] text-sm">Son güncelleme: {new Date().toLocaleDateString('tr-TR', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
    </div>
    <Card className="flex flex-col gap-6">
      <Section title="Genel Bakış">
        <p>Borsa Defterim ("Site"), yatırımcıların portföylerini takip etmelerine ve halka arz, bilanço gibi finansal bilgilere ulaşmalarına yardımcı olan ücretsiz bir araçtır. Gizliliğinize önem veriyoruz. Bu politika, hangi verilerin toplandığını ve nasıl kullanıldığını açıklar.</p>
      </Section>
      <Section title="Toplanan Veriler ve Saklama">
        <p>Girdiğiniz portföy, işlem ve izleme listesi verileri <b>yalnızca kendi tarayıcınızda (localStorage)</b> saklanır; sunucularımıza gönderilmez. Bu veriler cihazınızda kalır ve tarayıcı verilerinizi temizlediğinizde silinir.</p>
        <p>Yönetici girişleri için Google ile kimlik doğrulama kullanılır ve yalnızca yetkili yönetici hesaplarının e-posta adresi doğrulama amacıyla işlenir.</p>
      </Section>
      <Section title="Çerezler ve Üçüncü Taraf Reklamlar">
        <p>Sitede Google AdSense aracılığıyla reklam gösterilebilir. Google dahil üçüncü taraf sağlayıcılar, kullanıcıların bu siteye ve internetteki diğer sitelere yaptığı ziyaretlere dayalı reklamlar sunmak için çerezler kullanır.</p>
        <p>Google'ın reklam çerezi (DART çerezi dahil) kullanması, kullanıcıların <a href="https://www.google.com/settings/ads" target="_blank" rel="noreferrer" className="text-[#8b5cf6] hover:underline">Google Reklam Ayarları</a> üzerinden kişiselleştirilmiş reklamları devre dışı bırakmasına olanak tanır. Ayrıca <a href="https://www.aboutads.info" target="_blank" rel="noreferrer" className="text-[#8b5cf6] hover:underline">www.aboutads.info</a> adresinden üçüncü taraf çerezlerini yönetebilirsiniz.</p>
      </Section>
      <Section title="Üçüncü Taraf Hizmetler">
        <p>Site; barındırma, veritabanı ve analiz için Google Firebase, Vercel ve benzeri hizmetlerden yararlanır. Bu hizmetler kendi gizlilik politikalarına tabidir.</p>
      </Section>
      <Section title="Sorumluluk Reddi">
        <p>Sitedeki tüm içerik yalnızca bilgilendirme amaçlıdır ve <b>yatırım tavsiyesi değildir</b>. Yatırım kararlarınızdan yalnızca siz sorumlusunuz.</p>
      </Section>
      <Section title="İletişim">
        <p>Gizlilikle ilgili sorularınız için: <a href={`mailto:${CONTACT_EMAIL}`} className="text-[#8b5cf6] hover:underline">{CONTACT_EMAIL}</a></p>
      </Section>
    </Card>
  </div>
);

export const About: React.FC = () => (
  <div className="flex flex-col gap-6 max-w-3xl">
    <div>
      <h2 className="text-2xl font-bold flex items-center gap-2"><Info className="text-[#8b5cf6]" /> Hakkında</h2>
    </div>
    <Card className="flex flex-col gap-6">
      <Section title="Borsa Defterim Nedir?">
        <p>Borsa Defterim; bireysel yatırımcıların Borsa İstanbul (BIST) portföylerini kolayca takip etmesi, kâr/zarar hesaplaması yapması ve halka arz, temettü, bilanço gibi finansal bilgilere tek yerden ulaşması için geliştirilmiş ücretsiz bir web uygulamasıdır.</p>
      </Section>
      <Section title="Sunduğumuz Özellikler">
        <p>• Portföy ve işlem takibi, kâr/zarar ve performans analizi<br />
          • Güncel halka arzlar, tavan hesaplama ve katılım senaryoları<br />
          • Temettü ve sermaye artırımı/bölünme takibi<br />
          • Hisse bilanço analizleri ve temel analiz içerikleri</p>
      </Section>
      <Section title="Amacımız">
        <p>Karmaşık finansal verileri sade, anlaşılır ve herkesin erişebileceği bir formata dönüştürmek. İçeriklerimiz özgün olarak hazırlanır ve düzenli güncellenir.</p>
      </Section>
      <Section title="Önemli Not">
        <p>Sitedeki hiçbir içerik yatırım tavsiyesi niteliği taşımaz. Sağlanan bilgiler bilgilendirme amaçlıdır.</p>
      </Section>
    </Card>
  </div>
);

export const Contact: React.FC = () => (
  <div className="flex flex-col gap-6 max-w-3xl">
    <div>
      <h2 className="text-2xl font-bold flex items-center gap-2"><Mail className="text-[#8b5cf6]" /> İletişim</h2>
    </div>
    <Card className="flex flex-col gap-6">
      <Section title="Bize Ulaşın">
        <p>Görüş, öneri, iş birliği veya içerikle ilgili her türlü konuda bizimle e-posta yoluyla iletişime geçebilirsiniz. Mesajlarınıza en kısa sürede yanıt vermeye çalışıyoruz.</p>
      </Section>
      <div className="flex items-center gap-3 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl p-4">
        <div className="w-10 h-10 rounded-xl bg-[#8b5cf6]/15 flex items-center justify-center text-[#8b5cf6]"><Mail size={20} /></div>
        <div>
          <p className="text-xs font-bold text-[var(--text-muted)] uppercase">E-posta</p>
          <a href={`mailto:${CONTACT_EMAIL}`} className="font-semibold text-[#8b5cf6] hover:underline">{CONTACT_EMAIL}</a>
        </div>
      </div>
      <div className="flex items-center gap-2 text-[var(--text-muted)] text-sm">
        <TrendingUp size={16} /> Borsa Defterim — BIST yatırımcıları için portföy ve finans takibi
      </div>
    </Card>
  </div>
);
