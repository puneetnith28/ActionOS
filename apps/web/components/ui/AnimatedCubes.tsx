"use client";
import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import gsap from 'gsap';

export const AnimatedCubes = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  

  useEffect(() => {
    if (!containerRef.current) return;

    const cubes = containerRef.current.querySelectorAll('.cube');
    
    gsap.to(cubes, {
      y: -20,
      duration: 2,
      stagger: 0.2,
      repeat: -1,
      yoyo: true,
      ease: 'power1.inOut',
    });

    gsap.to(cubes, {
      rotateY: 360,
      duration: 8,
      repeat: -1,
      ease: 'linear',
      stagger: 0.3,
    });
  }, []);

  return (
    <motion.div
      ref={containerRef}
      className="relative w-full h-64 flex items-center justify-center gap-8"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8 }}
    >
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="cube relative"
          style={{
            width: '80px',
            height: '80px',
            transformStyle: 'preserve-3d',
            transform: `translateZ(${i * 20}px)`,
          }}
        >
          <div
            className="absolute inset-0 bg-gradient-to-br from-primary via-purple-500 to-pink-500 opacity-80 rounded-lg"
            style={{
              transform: 'translateZ(40px)',
              boxShadow: '0 0 30px rgba(139, 92, 246, 0.5)',
            }}
          />
          <div
            className="absolute inset-0 bg-gradient-to-br from-primary/70 via-purple-400/70 to-pink-400/70 rounded-lg"
            style={{ transform: 'rotateY(90deg) translateZ(40px)' }}
          />
          <div
            className="absolute inset-0 bg-gradient-to-br from-primary/50 via-purple-300/50 to-pink-300/50 rounded-lg"
            style={{ transform: 'rotateY(180deg) translateZ(40px)' }}
          />
          <div
            className="absolute inset-0 bg-gradient-to-br from-primary/30 via-purple-200/30 to-pink-200/30 rounded-lg"
            style={{ transform: 'rotateY(-90deg) translateZ(40px)' }}
          />
          <div
            className="absolute inset-0 bg-gradient-to-br from-primary/20 via-purple-100/20 to-pink-100/20 rounded-lg"
            style={{ transform: 'rotateX(90deg) translateZ(40px)' }}
          />
          <div
            className="absolute inset-0 bg-gradient-to-br from-primary/10 via-purple-50/10 to-pink-50/10 rounded-lg"
            style={{ transform: 'rotateX(-90deg) translateZ(40px)' }}
          />
        </div>
      ))}
    </motion.div>
  );
};
