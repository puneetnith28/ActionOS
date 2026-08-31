"use client";
import { motion } from 'framer-motion';
import { Package, Shield, Zap, Globe, Lock, CheckCircle } from 'lucide-react';

const floatingElements = [
  { icon: Package, delay: 0, x: 20, y: 20 },
  { icon: Shield, delay: 0.5, x: -30, y: 40 },
  { icon: Zap, delay: 1, x: 50, y: 60 },
  { icon: Globe, delay: 1.5, x: -20, y: 80 },
  { icon: Lock, delay: 2, x: 40, y: 30 },
  { icon: CheckCircle, delay: 2.5, x: -40, y: 70 },
];

export default function FloatingElements() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {floatingElements.map((element, index) => (
        <motion.div
          key={index}
          className="absolute text-primary/20"
          initial={{ opacity: 0, scale: 0 }}
          animate={{ 
            opacity: [0, 0.3, 0],
            scale: [0, 1, 0],
            y: [0, -20, 0]
          }}
          transition={{
            duration: 4,
            delay: element.delay,
            repeat: Infinity,
            repeatDelay: 2
          }}
          style={{
            left: `${50 + element.x}%`,
            top: `${50 + element.y}%`,
          }}
        >
          <element.icon className="w-8 h-8" />
        </motion.div>
      ))}
    </div>
  );
}
