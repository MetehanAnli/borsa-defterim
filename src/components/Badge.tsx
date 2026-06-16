import React from 'react';
import { cn } from './Card';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'success' | 'danger' | 'warning' | 'info' | 'default';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'default', className }) => {
  const variants = {
    success: 'bg-[#10b981]/10 text-[#10b981] border-[#10b981]/20',
    danger: 'bg-[#f43f5e]/10 text-[#f43f5e] border-[#f43f5e]/20',
    warning: 'bg-[#f59e0b]/10 text-[#f59e0b] border-[#f59e0b]/20',
    info: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    default: 'bg-[var(--bg-main)] text-[var(--text-muted)] border-[var(--border-color)]'
  };

  return (
    <span className={cn(
      "px-2 py-0.5 rounded-full text-xs font-semibold border inline-flex items-center gap-1",
      variants[variant],
      className
    )}>
      {children}
    </span>
  );
};
