import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

const LiveStars = () => {
  const stars = useMemo(() => {
    return Array.from({ length: 300 }).map((_, i) => {
      // Random angle
      const angle = Math.random() * Math.PI * 2;
      // Random distance from the center (start further out)
      const distance = 40 + Math.random() * 80;
      
      const startX = 50 + Math.cos(angle) * distance;
      const startY = 50 + Math.sin(angle) * distance;

      return {
        id: i,
        startX: `${startX}%`,
        startY: `${startY}%`,
        size: Math.random() * 2 + 0.5,
        // Doubled duration: random duration from 6 to 14 seconds
        animationDuration: Math.random() * 8 + 6,
        animationDelay: Math.random() * 5,
      };
    });
  }, []);

  return (
    <div className="absolute inset-0 z-[2] pointer-events-none overflow-hidden">
      {stars.map((star) => (
        <motion.div
          key={star.id}
          className="absolute bg-white rounded-full mix-blend-screen"
          style={{ width: star.size, height: star.size }}
          initial={{ left: star.startX, top: star.startY, opacity: 0, scale: 1 }}
          animate={{
            left: [star.startX, "50%"],
            top: [star.startY, "50%"],
            opacity: [0, 1, 0],
            scale: [1, 0.5, 0],
          }}
          transition={{
            duration: star.animationDuration,
            repeat: Infinity,
            delay: star.animationDelay,
            ease: "easeIn", // accelerating toward the center
          }}
        />
      ))}
    </div>
  );
};

const OrbitLines = () => {
  return (
    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full pointer-events-none opacity-60 z-[1] flex items-center justify-center">
      {/* Background radial gradient to give some depth to the lines */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_20%,black_100%)] mix-blend-multiply opacity-50" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[450px] h-[450px] rounded-full border-[0.5px] border-white/20" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[650px] rounded-full border-[1px] border-white/10 border-dashed" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[850px] h-[850px] rounded-full border-[0.5px] border-white/10" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1100px] h-[1100px] rounded-full border-[0.5px] border-white/5" />
      
      {/* nodes */}
      <motion.div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[450px] h-[450px]"
        animate={{ rotate: 360 }}
        transition={{ duration: 120, repeat: Infinity, ease: 'linear' }}
      >
        <div className="absolute top-0 left-1/2 w-1.5 h-1.5 bg-white rounded-full -translate-x-1/2 -translate-y-1/2 shadow-[0_0_10px_2px_rgba(255,255,255,0.8)]" />
      </motion.div>

      <motion.div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[650px]"
        animate={{ rotate: -360 }}
        transition={{ duration: 150, repeat: Infinity, ease: 'linear' }}
      >
        <div className="absolute top-1/2 left-0 w-2 h-2 bg-white rounded-full -translate-x-1/2 -translate-y-1/2 shadow-[0_0_10px_2px_rgba(255,255,255,0.6)]" />
      </motion.div>

      <motion.div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[850px] h-[850px]"
        animate={{ rotate: 360 }}
        transition={{ duration: 180, repeat: Infinity, ease: 'linear' }}
      >
        <div className="absolute bottom-0 left-1/2 w-1.5 h-1.5 bg-white rounded-full -translate-x-1/2 translate-y-1/2 shadow-[0_0_10px_2px_rgba(255,255,255,0.8)]" />
      </motion.div>
    </div>
  );
};

export const BlackHole = () => {
  return (
    <div
      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[1200px] h-[800px] pointer-events-none flex items-center justify-center pt-20 z-0 rotate-180"
      style={{ 
        WebkitMaskImage: 'radial-gradient(ellipse 60% 50% at 50% 75%, black 40%, transparent 80%)', 
        maskImage: 'radial-gradient(ellipse 60% 50% at 50% 75%, black 40%, transparent 80%)' 
      }}
    >

      {/* Additional Visuals */}
      <LiveStars />
      <OrbitLines />

      {/* 1. Base Swirling Core (Video from Reflect) */}
      <div className="absolute inset-0 flex items-center justify-center opacity-100 mix-blend-screen">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover scale-110"
        >
          <source src="https://reflect.app/home/build/q-c3d7becf.webm" type="video/webm" />
        </video>
      </div>

      {/* 2. Static Glow Disk (Image from Reflect) */}
      <div className="absolute inset-0 flex items-center justify-center opacity-90 mix-blend-screen scale-110 transform translate-y-[-5%]">
        <img
          src="https://reflect.app/home/build/q-44e26a19.png"
          alt=""
          className="w-full max-w-[1000px] object-contain"
        />
      </div>

      {/* 3. Orbiting Rings (CSS Animation) */}
      {/* Outer slow ring */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
        className="absolute w-[700px] h-[180px] rounded-[100%] border border-white/5"
        style={{ transformOrigin: 'center center' }}
      />

      {/* Inner medium ring */}
      <motion.div
        animate={{ rotate: -360 }}
        transition={{ duration: 45, repeat: Infinity, ease: "linear" }}
        className="absolute w-[500px] h-[130px] rounded-[100%] border border-primary/10"
        style={{ transformOrigin: 'center center' }}
      />

      {/* Bright center accent line */}
      <div className="absolute w-[300px] h-[80px] rounded-[100%] border-t-[2px] border-white/40 blur-[2px] z-10 mix-blend-screen transform translate-y-[-10px]" />

      {/* 4. Foreground floating dust/stars (CSS animation) */}
      <motion.div
        animate={{ opacity: [0.1, 0.5, 0.1] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-[20%] w-[500px] h-[120px] bg-gradient-to-t from-primary/0 via-primary/20 to-primary/0 blur-[20px] mix-blend-screen"
      />
    </div>
  );
};
