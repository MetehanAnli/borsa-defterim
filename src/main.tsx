import React from 'react';
import { createRoot } from 'react-dom/client';
import AppContent from './App';
import { ThemeProvider } from './context/ThemeContext';
import { DataProvider } from './context/DataContext';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <DataProvider>
        <AppContent />
        <Analytics />
        <SpeedInsights />
      </DataProvider>
    </ThemeProvider>
  </React.StrictMode>
);
