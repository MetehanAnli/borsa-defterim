import React, { useEffect } from 'react';
import { cn } from './Card';

declare global {
  interface Window {
    adsbygoogle: any[];
  }
}

interface AdBannerProps {
  orientation?: 'vertical' | 'horizontal';
  className?: string;
}

export const AdBanner: React.FC<AdBannerProps> = ({ orientation = 'horizontal', className }) => {
  useEffect(() => {
    try {
      // Sadece component mount olduğunda (reklam alanı sayfaya yüklendiğinde) Google'a "reklamı göster" komutu yolluyoruz.
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (err) {
      console.error('AdSense error:', err);
    }
  }, []);

  return (
    <div
      className={cn(
        "flex items-center justify-center bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl overflow-hidden relative",
        orientation === 'vertical' ? "w-full min-h-[600px]" : "w-full min-h-[100px]",
        className
      )}
    >
      {/* 
        Eğer Google reklam göndermezse (henüz onaylanmadıysa veya adblock varsa) 
        arkada hafif bir "Reklam Alanı" yazısı kalması için:
      */}
      <span className="absolute text-xs uppercase tracking-widest text-[var(--text-muted)] font-bold opacity-30 -z-10">
        Reklam
      </span>

      <ins className="adsbygoogle"
           style={{ display: "block", width: "100%", height: "100%" }}
           data-ad-client="ca-pub-4772123019002421"
           data-ad-slot="8176312991"
           data-ad-format={orientation === 'vertical' ? "auto" : "horizontal"}
           data-full-width-responsive="true"></ins>
    </div>
  );
};
