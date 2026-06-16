import { Trade, Dividend } from '../types';

export const exportToCSV = (trades: Trade[], dividends: Dividend[]) => {
  let csvContent = "data:text/csv;charset=utf-8,\uFEFF"; // UTF-8 BOM

  // Trades Section
  csvContent += "ISLEMLER\n";
  csvContent += "ID,Hisse,Durum,Alis Fiyati,Satis Fiyati,Lot,Komisyon,Sektor,Tarih,Hedef Fiyat,Stop Loss,Not\n";
  
  trades.forEach(t => {
    const row = [
      t.id,
      t.ticker,
      t.status === 'open' ? 'Acik' : 'Kapali',
      t.buyPrice,
      t.sellPrice || '',
      t.lot,
      t.commission,
      t.sector,
      t.date,
      t.targetPrice || '',
      t.stopLoss || '',
      `"${t.note || ''}"`
    ].join(",");
    csvContent += row + "\n";
  });

  csvContent += "\nTEMETTULER\n";
  csvContent += "ID,Hisse,Tutar,Tarih,Not\n";

  dividends.forEach(d => {
    const row = [
      d.id,
      d.ticker,
      d.amount,
      d.date,
      `"${d.note || ''}"`
    ].join(",");
    csvContent += row + "\n";
  });

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `borsa_defterim_export_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
