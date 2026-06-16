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
        "bg-[var(--bg-card)] border border-[var(--border-color)] shadow-sm",
        hoverEffect && "hover:shadow-md",
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  );
};
