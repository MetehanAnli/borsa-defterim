import React from 'react';
import { motion } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  hoverEffect?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, className, hoverEffect = false, ...props }) => {
  return (
    <motion.div
      whileHover={hoverEffect ? { y: -4, transition: { duration: 0.2 } } : {}}
      className={cn(
        "rounded-2xl p-6 transition-all duration-300",
        "bg-[var(--bg-card)] border border-[var(--border-color)] shadow-sm backdrop-blur-md transform-gpu backface-hidden",
        hoverEffect && "hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:hover:shadow-[0_0_20px_rgba(16,185,129,0.15)] hover:border-[#10b981]/30",
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  );
};
