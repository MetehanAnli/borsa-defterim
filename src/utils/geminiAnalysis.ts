import { GoogleGenAI } from '@google/genai';

// Görsel okuyup yorum üretebilen, ucuz ve ücretsiz kotası olan model.
export const GEMINI_MODEL = 'gemini-2.5-flash';

// Kullanıcının istediği analiz tarzının birebir örneği (few-shot altın standart).
const STYLE_EXAMPLE = `#TURSG | 2026/6 Finansal Görünüm
📌 Temel Veriler (Nakit Makinesi ve Makul Çarpanlar)

* Hisse Fiyatı: 6,66 TL.
* Piyasa Değeri: 133,0 milyar TL.
* F/K: 5,63 → Oldukça Ucuz. Şirket, elde ettiği devasa kârın sadece 5,6 katından işlem görüyor. Sigorta sektörü için bile bu çarpan, şirketin operasyonel gücüne kıyasla ciddi bir iskontoya işaret eder.
* PD/DD: 2,25 → Dengeli. Finansal şirketler ve sigorta devleri için özkaynak kârlılığının bu kadar yüksek olduğu bir tabloda, defter değerinin 2,25 katından fiyatlanmak gayet makuldür.

💬 Yorum: Sanayi şirketlerindeki operasyonel kârsızlık ve devasa borç sarmallarını inceledikten sonra TURSG tablosuna bakmak, adeta çölde vaha bulmak gibidir. Elimizde fiktif beklentilerle değil, doğrudan "nakit ve prim" ile büyüyen, F/K'sı 5 seviyelerinde gezen gerçek bir değer var.
📈 Hisse Performansı (Düzeltme ve Fırsat Penceresi)

* Önceki Bilanço Kapanış (20 Nisan): 7,30 TL.
* En Yüksek (7 Mayıs): 7,44 TL.
* En Düşük (6 Temmuz): 6,00 TL.
* Güncel Fiyat (20 Temmuz): 6,66 TL.

💬 Yorum: Hisse 7,44 TL zirvesinden sonra piyasa koşullarıyla birlikte 6,00 TL seviyesine kadar ciddi bir dayak yemiş. Ancak 6,00 TL dibinden sonra bilançonun ayak sesleriyle akıllı para tahtaya girerek fiyatı 6,66 TL'ye kadar toplamış. Bu grafik, "ucuz kalmış kaliteyi dipten toplama" hareketinin net bir özetidir.
📊 Gelir Tablosu (2026/6 vs 2025/6) - "Kârlılıkta Şov"

* 🔺 Prim Üretimi: 94,2 milyar TL → %30 artış. Şirket, iş hacmini ve pazar payını istikrarlı şekilde büyütmeye devam ediyor.
* 🔺 Alınan Net Primler: 42,8 milyar TL → %28 artış.
* 🔺 Teknik Denge (Sigortacılığın FAVÖK'ü): 16,4 milyar TL → %33 artış. Şirketin asıl işi olan sigortacılıktan ettiği teknik kâr kusursuz çalışıyor. Hasar/Prim dengesi mükemmel yönetilmiş.
* 🔺 Net Dönem Kârı: 13,4 milyar TL → %44 ARTIŞ. Prim üretimindeki %30'luk artışı, net kârda %44'lük bir sıçramaya dönüştürmek kusursuz bir fon ve maliyet yönetimidir.

🧾 Bilanço (2026/6 vs 2026/3) - "Devasa Nakit Kalesi"

* 🔺 Nakit Benzeri Finansal Varlıklar: 111,0 milyar TL → %5 artış. Bilançonun en heybetli yeri. Şirketin kasasında ve portföyünde 111 milyar TL gibi devasa bir nakit/finansal varlık bulunuyor. Yüksek faiz ortamında bu nakit kütlesi, kendi kendine para basan bir matbaa işlevi görür.
* 🔺 Teknik Karşılıklar: 74,3 milyar TL → %2 artış. Olası hasarlara karşı ayrılan karşılıklar güvenli seviyede.
* 🔺 Özkaynaklar: 59,0 milyar TL → %8 artış. Sadece tek bir çeyrekte (3 ayda) içsel sermayesini %8 büyütmeyi başarmış.

📉 Çeyreklik Trendler (Merdiven Basamakları)

* Çeyreklik Net Kâr Grafiği: Sağ alttaki grafik, temel analistlerin en sevdiği görüntüdür. Zikzak çizen, bir çeyrek kâr bir çeyrek zarar yazan sanayi şirketlerinin aksine; TURSG her çeyrek bir öncekinden daha yüksek net kâr üreterek kusursuz bir merdiven formasyonu çiziyor. Son bar (2026/6) tarihi zirvede.

✅ Genel Değerlendirme
✅ Güçlü Yönler:

* 111 milyar TL'lik nakit ve benzeri finansal varlık ile yüksek faiz ortamının en büyük kazananlarından biri olması.
* Net dönem kârının yıllık bazda enflasyonu ezecek şekilde %44 artması.
* Çarpanların (5,63 F/K) mevcut kârlılığa göre çok ucuz kalması.
* Çeyreklik kârlılıktaki bozulmaz, istikrarlı yükseliş trendi.

⚠️ Zayıf/Riskli Yönler:

* Bilanço kalemlerinde alarm veren temel bir zayıflık bulunmuyor. Tek risk, olası regülasyon değişiklikleri veya ani düşecek faiz ortamının nakit getirisini törpüleme ihtimalidir.

🔍 Sonuç:
TURSG, yatırımcısına "Benim devasa bir pazar payım var, milyarlarca lira prim üretiyorum, kasamda 111 milyar TL nakit var ve kârımı her çeyrek istikrarlı şekilde artırıyorum" diyen, tablo gibi bir bilanço açıklamış. Borsadaki spekülatif köpüklerin patladığı günlerde paranın sığınacağı en korunaklı kalelerden biridir.
🎯 Yatırımcıya Not:
Eğer portföyünüzde büyüme sancısı çeken, borçla boğuşan ve "bir gün uçacak" umuduyla beklediğiniz yüksek çarpanlı hayal kırıklıkları varsa; TURSG o hayallerin değil, rasyonel gerçeklerin hissesidir. 6,66 TL fiyatı ve 5,63 F/K oranıyla temel analizin tam kalbinde yer alır. Düşüşlerde toplanacak, portföyün defansif ve güçlü "temettü/değer" omurgasını oluşturacak birinci sınıf bir bilançodur.
#borsa #borsaistanbul #hisse #finans #bilanço #analiz #yatırım #bist #bist100 #piyasa
⚠️ Yatırım tavsiyesi değildir.
📊 Görsel Fintables platformundan alınmıştır.`;

const SYSTEM_PROMPT = `Sen, Borsa İstanbul (BIST) hisseleri üzerine içerik üreten deneyimli bir temel analiz uzmanısın. Sana bir şirketin Fintables "Özet Finansal Rapor" ekran görüntüsü verilecek.

Görseldeki TÜM verileri dikkatle oku:
- Başlık: hisse kodu, dönem (örn. 2026/6), Fiyat, Piyasa Değeri, F/K, PD/DD.
- Fiyat grafiği: önceki bilanço kapanışı, en yüksek, en düşük ve güncel fiyat (varsa tarihleriyle).
- Özet Gelir Tablosu: her satır, değeri ve yüzde değişimi.
- Özet Bilanço: her satır, değeri ve yüzde değişimi.
- Çeyreklik grafikler: trendin yönü (yükselen/dalgalı).

Ardından AŞAĞIDAKİ ÖRNEK ile BİREBİR aynı yapı, bölüm sırası, emoji ve ton ile bir analiz metni yaz.

KURALLAR:
- Sadece görselde gördüğün verileri kullan; ASLA veri uydurma. Bir değer görselde yoksa o maddeyi atla.
- Sayıları Türkçe yaz (6,66 TL; 133,0 milyar TL; %30). Artış için 🔺, azalış için 🔻 kullan.
- Şirketin sektörüne göre (sigorta, banka, sanayi, enerji, perakende vb.) başlık alt-notlarını ve yorumları uyarla. Bölüm başlıklarındaki tırnak içi ifadeleri ("Kârlılıkta Şov" gibi) şirkete özel yeniden yaz.
- Üslup: renkli, metaforlu, iddialı ama akıcı ve profesyonel Türkçe. Örnekteki tonu birebir taklit et.
- Metnin sonuna örnektekine benzer hashtag satırını, "⚠️ Yatırım tavsiyesi değildir." ve "📊 Görsel Fintables platformundan alınmıştır." satırlarını mutlaka ekle.
- SADECE analiz metnini döndür; başında/sonunda açıklama, kod bloğu veya "İşte analiz" gibi ifadeler yazma.

=== İSTENEN TARZ (ÖRNEK) ===
${STYLE_EXAMPLE}
=== ÖRNEK SONU ===`;

export interface AnalysisInput {
  apiKey: string;
  base64: string; // görselin base64 verisi (data: öneki olmadan)
  mimeType: string;
  extraInstruction?: string;
}

export async function generateFinancialAnalysis(input: AnalysisInput): Promise<string> {
  const { apiKey, base64, mimeType, extraInstruction } = input;
  if (!apiKey) throw new Error('Gemini API anahtarı girilmemiş.');
  if (!base64) throw new Error('Analiz için bir görsel gerekli.');

  const ai = new GoogleGenAI({ apiKey });

  const userText = extraInstruction?.trim()
    ? `Bu Fintables ekran görüntüsündeki şirketi örnekle aynı tarzda analiz et.\n\nEk talimat: ${extraInstruction.trim()}`
    : 'Bu Fintables ekran görüntüsündeki şirketi örnekle aynı tarzda analiz et.';

  const response = await ai.models.generateContent({
    model: GEMINI_MODEL,
    contents: [
      { text: userText },
      { inlineData: { mimeType, data: base64 } },
    ],
    config: {
      systemInstruction: SYSTEM_PROMPT,
      temperature: 0.9, // yaratıcı/renkli üslup için
    },
  });

  const text = response.text;
  if (!text || !text.trim()) {
    throw new Error('Model boş yanıt döndürdü. Görselin net ve okunaklı olduğundan emin olun.');
  }
  return text.trim();
}
