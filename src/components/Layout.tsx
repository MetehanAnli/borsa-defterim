import React from 'react';
import { motion } from 'motion/react';
import { LayoutDashboard, ArrowRightLeft, DollarSign, Eye, LineChart, Settings as SettingsIcon, Sun, Moon, User, TrendingUp, Rocket, Clock, Layers, PieChart } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useData } from '../context/DataContext';
import { useCurrency } from '../context/CurrencyContext';
import { AdBanner } from './AdBanner';
import { cn } from './Card';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const TABS = [
  { id: 'dashboard', label: 'Panel', icon: LayoutDashboard },
  { id: 'trades', label: 'İşlemler', icon: ArrowRightLeft },
  { id: 'dividends', label: 'Temettüler', icon: DollarSign },
  { id: 'watchlist', label: 'İzleme', icon: Eye },
  { id: 'ipos', label: 'Halka Arz', icon: Rocket },
  { id: 'funds', label: 'Fonlar', icon: PieChart },
  { id: 'splits', label: 'Bölünmeler', icon: Layers },
  { id: 'balance-analyses', label: 'Bilanço Analizleri', icon: LineChart },
  { id: 'analytics', label: 'Performans', icon: LineChart },
  { id: 'settings', label: 'Ayarlar', icon: SettingsIcon },
];

export const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab }) => {
  const { theme, toggleTheme } = useTheme();
  const { user, loginWithGoogle, logout } = useData();
  const { currency, toggleCurrency } = useCurrency();

  return (
    <div className="min-h-screen flex flex-col pb-20 md:pb-0">
      <header className="sticky top-0 z-40 w-full border-b border-[var(--border-color)] bg-[var(--bg-main)]/80 backdrop-blur-md">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5 select-none" onDoubleClick={!user ? loginWithGoogle : undefined}>
            <div className="w-9 h-9 rounded-xl bg-[#0f1115] dark:bg-white flex items-center justify-center text-white dark:text-[#0f1115] shadow-sm">
              <TrendingUp size={22} strokeWidth={2.5} />
            </div>
            <span className="text-[22px] font-extrabold italic tracking-tight hidden sm:block bg-gradient-to-r from-[#10b981] to-[#3b82f6] bg-clip-text text-transparent drop-shadow-sm">Borsa Defterim</span>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "px-4 py-2 rounded-xl text-sm font-medium transition-colors relative flex items-center gap-2",
                  activeTab === tab.id ? "text-[var(--text-main)]" : "text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-card)]"
                )}
              >
                <tab.icon size={16} />
                {tab.label}
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl -z-10"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-2 sm:gap-4">
            <button
              onClick={toggleCurrency}
              className="w-10 h-10 flex items-center justify-center rounded-xl text-[var(--text-muted)] hover:bg-[var(--bg-card)] hover:text-[var(--text-main)] transition-colors font-bold text-lg"
              title="Para Birimini Değiştir"
            >
              {currency === 'TRY' ? '₺' : '$'}
            </button>
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl text-[var(--text-muted)] hover:bg-[var(--bg-card)] hover:text-[var(--text-main)] transition-colors"
            >
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            {user ? (
              <button onClick={logout} className="flex items-center gap-2 bg-[var(--bg-card)] hover:bg-red-500/10 hover:border-red-500/30 border border-[var(--border-color)] px-3 py-1.5 rounded-full transition-all group">
                <img src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}`} alt="Profile" className="w-6 h-6 rounded-full" />
                <span className="text-sm font-medium hidden sm:block group-hover:text-red-500">{user.displayName?.split(' ')[0]} (Çıkış)</span>
              </button>
            ) : (
              <div className="flex items-center gap-2 bg-[var(--bg-card)] border border-[var(--border-color)] px-3 py-1.5 rounded-full">
                <div className="w-6 h-6 rounded-full bg-[#10b981] flex items-center justify-center text-white text-xs">
                  <User size={14} />
                </div>
                <span className="text-sm font-medium hidden sm:block">Misafir</span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Desktop Main Content Area with Ads */}
      <div className="flex-1 container mx-auto px-4 py-8 max-w-[1600px] flex justify-center gap-6">
        
        {/* Left Ad - Desktop Only */}
        <div className="hidden xl:block w-[160px] 2xl:w-[250px] shrink-0">
          <div className="sticky top-28">
            <AdBanner key={`left-${activeTab}`} orientation="vertical" />
          </div>
        </div>

        {/* Main Content */}
        <main className="flex-1 max-w-5xl min-w-0 flex flex-col gap-6">
          {/* Mobile Top Ad - Only on small screens */}
          <div className="block xl:hidden w-full">
            <AdBanner key={`top-${activeTab}`} orientation="horizontal" />
          </div>

          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {children}
          </motion.div>
        </main>

        {/* Right Ad - Desktop Only */}
        <div className="hidden xl:block w-[160px] 2xl:w-[250px] shrink-0">
          <div className="sticky top-28">
            <AdBanner key={`right-${activeTab}`} orientation="vertical" />
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="w-full py-8 text-center mt-auto flex flex-col items-center gap-3">
        <div className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-600 dark:text-yellow-400 text-[11px] sm:text-xs px-3 py-1.5 rounded-full inline-flex items-center gap-1.5 font-medium">
          <Clock size={14} />
          Veriler 15 dakika gecikmelidir
        </div>
        <p className="text-[11px] font-semibold text-[var(--text-muted)] tracking-widest uppercase">
          Borsa Defterim © {new Date().getFullYear()} • Yatırım Tavsiyesi Değildir
        </p>
      </footer>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[var(--bg-card)] border-t border-[var(--border-color)] pb-safe">
        <div className="flex items-center overflow-x-auto hide-scrollbar p-2 gap-1 snap-x snap-mandatory">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex flex-col items-center justify-center gap-1 p-2 min-w-[4.5rem] shrink-0 snap-center rounded-xl transition-colors",
                activeTab === tab.id ? "text-[#10b981]" : "text-[var(--text-muted)] hover:bg-[var(--bg-main)]"
              )}
            >
              <tab.icon size={20} className={cn(activeTab === tab.id && "fill-current/20")} />
              <span className="text-[10px] font-medium">{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
};
