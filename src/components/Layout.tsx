import React from 'react';
import { motion } from 'motion/react';
import { LayoutDashboard, ArrowRightLeft, DollarSign, Eye, LineChart, Settings as SettingsIcon, Sun, Moon, User } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useData } from '../context/DataContext';
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
  { id: 'analytics', label: 'Analiz', icon: LineChart },
  { id: 'settings', label: 'Ayarlar', icon: SettingsIcon },
];

export const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab }) => {
  const { theme, toggleTheme } = useTheme();
  const { user } = useData();

  return (
    <div className="min-h-screen flex flex-col pb-20 md:pb-0">
      <header className="sticky top-0 z-40 w-full border-b border-[var(--border-color)] bg-[var(--bg-main)]/80 backdrop-blur-md">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#10b981] to-[#059669] flex items-center justify-center text-white font-bold">
              B
            </div>
            <span className="text-xl font-bold tracking-tight hidden sm:block">Borsa Defterim</span>
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
              onClick={toggleTheme}
              className="p-2 rounded-xl text-[var(--text-muted)] hover:bg-[var(--bg-card)] hover:text-[var(--text-main)] transition-colors"
            >
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <div className="flex items-center gap-2 bg-[var(--bg-card)] border border-[var(--border-color)] px-3 py-1.5 rounded-full">
              <div className="w-6 h-6 rounded-full bg-[#10b981] flex items-center justify-center text-white text-xs">
                <User size={14} />
              </div>
              <span className="text-sm font-medium hidden sm:block">Misafir</span>
            </div>
          </div>
        </div>
      </header>

      {/* Desktop Main Content Area with Ads */}
      <div className="flex-1 container mx-auto px-4 py-8 max-w-[1600px] flex justify-center gap-6">
        
        {/* Left Ad - Desktop Only */}
        <div className="hidden xl:block w-[160px] 2xl:w-[250px] shrink-0">
          <div className="sticky top-28">
            <AdBanner orientation="vertical" />
          </div>
        </div>

        {/* Main Content */}
        <main className="flex-1 max-w-5xl min-w-0 flex flex-col gap-6">
          {/* Mobile Top Ad - Only on small screens */}
          <div className="block xl:hidden w-full">
            <AdBanner orientation="horizontal" />
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
            <AdBanner orientation="vertical" />
          </div>
        </div>
      </div>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[var(--bg-card)] border-t border-[var(--border-color)] pb-safe">
        <div className="flex items-center justify-around p-2">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex flex-col items-center gap-1 p-2 min-w-[4rem] rounded-xl transition-colors",
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
