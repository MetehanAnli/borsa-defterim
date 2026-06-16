import React from 'react';
import { cn } from './Card';

interface AdBannerProps {
  orientation?: 'vertical' | 'horizontal';
  className?: string;
}

export const AdBanner: React.FC<AdBannerProps> = ({ orientation = 'horizontal', className }) => {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl overflow-hidden relative",
        "before:absolute before:inset-0 before:bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] before:opacity-5",
        orientation === 'vertical' ? "w-full min-h-[600px]" : "w-full min-h-[100px]",
        className
      )}
    >
      {/* Decorative dots in corners */}
      <div className="absolute top-2 left-2 w-1.5 h-1.5 rounded-full bg-[var(--border-color)]" />
      <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-[var(--border-color)]" />
      <div className="absolute bottom-2 left-2 w-1.5 h-1.5 rounded-full bg-[var(--border-color)]" />
      <div className="absolute bottom-2 right-2 w-1.5 h-1.5 rounded-full bg-[var(--border-color)]" />
      
      <span className="text-xs uppercase tracking-widest text-[var(--text-muted)] font-bold mb-1">
        Reklam Alanı
      </span>
      <span className="text-[10px] text-[var(--text-muted)]/60 text-center px-4">
        Google AdSense kodunuzu buraya ekleyebilirsiniz.
      </span>

      {/* 
        İleride buraya Google AdSense kodunu ekleyebilirsiniz:
        <ins className="adsbygoogle"
             style={{ display: "block" }}
             data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
             data-ad-slot="XXXXXXXXXX"
             data-ad-format="auto"
             data-full-width-responsive="true"></ins>
        <script>(adsbygoogle = window.adsbygoogle || []).push({});</script>
      */}
    </div>
  );
};
