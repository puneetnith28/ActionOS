"use client";
import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface InteractiveCardProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  hoverScale?: number;
}

export default function InteractiveCard({ 
  children, 
  className = "", 
  delay = 0,
  hoverScale = 1.05 
}: InteractiveCardProps) {
  return (
    <motion.div
      className={`group relative ${className}`}
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay }}
      whileHover={{ 
        scale: hoverScale,
        transition: { duration: 0.2 }
      }}
    >
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-primary/10 to-blue-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        initial={{ scale: 0.8, opacity: 0 }}
        whileHover={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3 }}
      />
      <div className="relative z-10">
        {children}
      </div>
    </motion.div>
  );
}
