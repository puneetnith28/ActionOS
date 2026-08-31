"use client";
import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  id?: string;
}

export const GlassCard = ({ children, className = '', hover = true, id }: GlassCardProps) => {
  return (
    <motion.div
      id={id}
      className={cn(
        'relative rounded-xl border border-border/50 bg-card/30 backdrop-blur-md shadow-lg',
        hover && 'transition-all duration-300 hover:shadow-xl hover:shadow-primary/10 hover:border-primary/50',
        className
      )}
      whileHover={hover ? { y: -5, scale: 1.02 } : {}}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      {/* Gradient overlay */}
      <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />
      
      {/* Content */}
      <div className="relative z-10">{children}</div>
    </motion.div>
  );
};
