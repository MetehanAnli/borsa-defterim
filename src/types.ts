export type Status = 'open' | 'closed';

export interface Trade {
  id: string;
  ticker: string;
  buyPrice: number;
  sellPrice?: number; // Boşsa 'open' pozisyondur.
  lot: number;
  commission: number;
  sector: string;
  date: string;
  targetPrice?: number;
  stopLoss?: number;
  note?: string;
  status: Status;
}

export interface Dividend {
  id: string;
  ticker: string;
  amount: number;
  date: string;
  note?: string;
}

export interface WatchlistItem {
  id: string;
  ticker: string;
  targetPrice: number;
  note?: string;
}

export interface Settings {
  theme: 'light' | 'dark';
  targetPortfolioValue: number;
}

export interface UserData {
  trades: Trade[];
  dividends: Dividend[];
  watchlist: WatchlistItem[];
  settings: Settings;
}

export const defaultSettings: Settings = {
  theme: 'dark',
  targetPortfolioValue: 1000000
};

export const defaultUserData: UserData = {
  trades: [],
  dividends: [],
  watchlist: [],
  settings: defaultSettings
};

export interface IpoScenario {
  participants: string;
  lots: number;
}

export interface IpoData {
  id: string;
  ticker: string;
  companyName: string;
  price: number;
  lotAmount: number;
  distributionType: string;
  dateRange: string;
  prospectusUrl?: string;
  status: 'Yaklaşan' | 'İşlem Görüyor';
  scenarios?: IpoScenario[];
  finalLots?: number;
}
