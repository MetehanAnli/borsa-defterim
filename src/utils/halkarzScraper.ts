import { IpoData } from '../types';

// halkarz.com'dan halka arz verisi çeker.
// Tarayıcı CORS engeli nedeniyle doğrudan halkarz.com'a istek atamaz; bu yüzden
// Yahoo Finance için kullanılan proxy mantığının aynısıyla /api/halkarz üzerinden
// gider (bkz. vercel.json / netlify.toml / vite.config.ts).

const PROXY_PREFIX = '/api/halkarz';
const HALKARZ_ORIGIN = 'https://halkarz.com';

export type ImportedIpo = Omit<IpoData, 'id'> & { sourceUrl: string };

const TR_MONTHS: Record<string, number> = {
  ocak: 0, 'şubat': 1, subat: 1, mart: 2, nisan: 3, 'mayıs': 4, mayis: 4,
  haziran: 5, temmuz: 6, 'ağustos': 7, agustos: 7, 'eylül': 8, eylul: 8,
  ekim: 9, 'kasım': 10, kasim: 10, 'aralık': 11, aralik: 11,
};

// Detay/liste URL'sini proxy üzerinden erişilebilir hale getirir.
const toProxyUrl = (url: string): string =>
  url.replace(/^https?:\/\/(www\.)?halkarz\.com/i, PROXY_PREFIX);

async function fetchHtml(url: string): Promise<Document> {
  const res = await fetch(url, { headers: { Accept: 'text/html' } });
  if (!res.ok) throw new Error(`halkarz isteği başarısız (${res.status})`);
  const html = await res.text();
  return new DOMParser().parseFromString(html, 'text/html');
}

// "1.234,56" / "89.000.000" gibi Türkçe sayıları number'a çevirir.
function parseTrNumber(raw: string | null | undefined): number {
  if (!raw) return 0;
  const m = raw.match(/[\d.,]+/g);
  if (!m) return 0;
  // Birden fazla sayı varsa (fiyat aralığı gibi) en büyüğünü al.
  const nums = m.map((s) => {
    const normalized = s.replace(/\./g, '').replace(',', '.');
    return parseFloat(normalized);
  }).filter((n) => !isNaN(n));
  return nums.length ? Math.max(...nums) : 0;
}

// "17 Temmuz 2026" veya "8-9-10 Temmuz 2026" -> Date | null (aralıkta son gün)
function parseTrDate(raw: string | null | undefined): Date | null {
  if (!raw) return null;
  const yearMatch = raw.match(/\b(20\d{2})\b/);
  const monthMatch = raw.toLowerCase().match(/[a-zçğıöşü]+/g)?.find((w) => w in TR_MONTHS);
  if (!yearMatch || !monthMatch) return null;
  // Yılı çıkardıktan sonra gün sayılarını bul; aralıkta en büyüğünü (son gün) al.
  const withoutYear = raw.replace(yearMatch[0], '');
  const days = (withoutYear.match(/\d{1,2}/g) || []).map((d) => parseInt(d, 10));
  if (!days.length) return null;
  const d = new Date(parseInt(yearMatch[1], 10), TR_MONTHS[monthMatch], Math.max(...days));
  return isNaN(d.getTime()) ? null : d;
}

function mapDistribution(raw: string): string {
  const t = raw.toLocaleLowerCase('tr');
  if (t.includes('oransal')) return 'Oransal';
  if (t.includes('bireysel')) return 'Bireysele Eşit';
  if (t.includes('eşit') || t.includes('esit')) return 'Tamamı Eşit';
  return raw.trim() || 'Tamamı Eşit';
}

function textOf(el: Element | null | undefined): string {
  return (el?.textContent || '').replace(/\s+/g, ' ').trim();
}

// Detay tablosundaki "Etiket : değer" satırından değeri bulur.
function findRowValue(rows: HTMLTableRowElement[], labelKeyword: string): string {
  const kw = labelKeyword.toLocaleLowerCase('tr');
  for (const row of rows) {
    const cells = row.querySelectorAll('td');
    if (cells.length < 2) continue;
    const label = textOf(cells[0]).toLocaleLowerCase('tr');
    if (label.includes(kw)) return textOf(cells[cells.length - 1]);
  }
  return '';
}

// Yatırımcı dağıtım tablosundan (table.as-table) "Yurt İçi Bireysel" lot adedini bulur.
// Tablonun sınıfı değişebileceği için tüm tablo satırlarında arar.
function findRetailLots(doc: Document): number {
  const rows = Array.from(doc.querySelectorAll('table tr')) as HTMLTableRowElement[];
  for (const row of rows) {
    const cells = Array.from(row.querySelectorAll('td'));
    if (cells.length < 2) continue;
    const first = textOf(cells[0]).toLocaleLowerCase('tr');
    if (first.includes('yurt içi bireysel') || first.includes('yurt ici bireysel')) {
      // Satır: Grup | Kişi | Lot | Oran -> en büyük sayı lot adedidir.
      const nums = cells.slice(1).map((c) => parseTrNumber(textOf(c))).filter((n) => n > 0);
      if (nums.length) return Math.max(...nums);
    }
  }
  return 0;
}

async function parseDetail(sourceUrl: string, fallback: Partial<ImportedIpo>): Promise<ImportedIpo> {
  const doc = await fetchHtml(toProxyUrl(sourceUrl));
  const rows = Array.from(doc.querySelectorAll('table.sp-table tr')) as HTMLTableRowElement[];

  const ticker = (findRowValue(rows, 'bist kodu') || fallback.ticker || '').toUpperCase();
  const companyName =
    textOf(doc.querySelector('.detail-page .il-halka-arz-sirket')) || fallback.companyName || '';
  const price = parseTrNumber(findRowValue(rows, 'fiyat'));
  const lotAmount = parseTrNumber(findRowValue(rows, 'pay'));
  const distributionType = mapDistribution(findRowValue(rows, 'dağıtım'));
  const dateRange = findRowValue(rows, 'halka arz tarihi') || fallback.dateRange || '';
  const tradingDate = findRowValue(rows, 'ilk işlem tarihi') || findRowValue(rows, 'işlem tarihi') || '';
  const totalLotsForIndividuals = findRetailLots(doc);

  // İzahname (KAP) linki
  const prospectusLink = Array.from(doc.querySelectorAll('a')).find((a) =>
    (a.textContent || '').toLocaleLowerCase('tr').includes('izahname')
  );
  const prospectusUrl = prospectusLink?.getAttribute('href') || undefined;

  // Durum: işlem tarihi bugüne eşit/geçmişse "İşlem Görüyor", değilse "Yaklaşan".
  const tDate = parseTrDate(tradingDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const status: IpoData['status'] = tDate && tDate <= today ? 'İşlem Görüyor' : 'Yaklaşan';

  return {
    ticker,
    companyName,
    price,
    lotAmount,
    distributionType,
    dateRange,
    tradingDate: tradingDate || '',
    status,
    scenarios: [],
    finalLots: null,
    totalLotsForIndividuals,
    discountRate: '',
    prospectusUrl,
    prospectusSummary: { fundUsage: '', t1t2: false, priceStability: '' },
    sourceUrl,
  };
}

/**
 * halkarz.com ana sayfasındaki en güncel halka arzları çeker (varsayılan ilk 15).
 * Her biri için detay sayfasını da okuyup tam veriyi döndürür.
 */
export async function scrapeHalkarz(limit = 15): Promise<ImportedIpo[]> {
  const doc = await fetchHtml(`${PROXY_PREFIX}/`);
  // İlk liste "İlk Halka Arzlar" sekmesi = onaylı/güncel arzlar (en yeniler üstte).
  const firstList = doc.querySelector('ul.halka-arz-list');
  if (!firstList) throw new Error('Halka arz listesi bulunamadı (sayfa yapısı değişmiş olabilir).');

  const items = Array.from(firstList.querySelectorAll('li article.index-list')).slice(0, limit);
  const seeds = items
    .map((art) => {
      const link = art.querySelector('.il-halka-arz-sirket a') || art.querySelector('a[href]');
      const href = link?.getAttribute('href') || '';
      return {
        sourceUrl: href.startsWith('http') ? href : `${HALKARZ_ORIGIN}${href}`,
        ticker: textOf(art.querySelector('.il-bist-kod')).toUpperCase(),
        companyName: textOf(art.querySelector('.il-halka-arz-sirket')),
        dateRange: textOf(art.querySelector('.il-halka-arz-tarihi time')),
      };
    })
    .filter((s) => s.sourceUrl && /halkarz\.com\/[^/]+\/?$/.test(s.sourceUrl));

  // Detayları paralel çek; tek tek hatada o kaydı atla.
  const results = await Promise.allSettled(
    seeds.map((s) => parseDetail(s.sourceUrl, s))
  );

  return results
    .filter((r): r is PromiseFulfilledResult<ImportedIpo> => r.status === 'fulfilled')
    .map((r) => r.value)
    .filter((ipo) => ipo.ticker); // kodu olmayanları atla
}
