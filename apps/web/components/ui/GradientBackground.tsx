import { motion } from "framer-motion";

export default function GradientBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Animated blended pastel orbs */}
      <motion.div
        className="absolute w-[32rem] h-[32rem] rounded-full bg-gradient-to-r from-[#e0e7ff]/30 to-[#c7d2fe]/20 blur-3xl mix-blend-lighten"
        animate={{ x: [0, 140, 0], y: [0, -100, 0], scale: [1, 1.25, 1] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        style={{ left: "4%", top: "10%" }}
      />
      <motion.div
        className="absolute w-96 h-96 rounded-full bg-gradient-to-r from-[#f0abfc]/30 to-[#fde68a]/20 blur-3xl mix-blend-lighten"
        animate={{ x: [0, -160, 0], y: [0, 140, 0], scale: [1, 0.95, 1] }}
        transition={{
          duration: 13,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2,
        }}
        style={{ right: "4%", top: "50%" }}
      />
      <motion.div
        className="absolute w-80 h-80 rounded-full bg-gradient-to-tr from-[#a7f3d0]/25 to-[#38bdf8]/25 blur-3xl mix-blend-lighten"
        animate={{ x: [0, 82, 0], y: [0, -60, 0], scale: [1, 1.09, 1] }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 4,
        }}
        style={{ left: "55%", bottom: "12%" }}
      />
      {/* Subtle grid overlay at 2% opacity */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(rgba(82, 39, 255, 0.02) 1px, transparent 1px),linear-gradient(90deg, rgba(82,39,255,0.02) 1px, transparent 1px)`,
          backgroundSize: "50px 50px",
        }}
      />
      {/* Subtle top-to-bottom dark overlay for contrast */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-transparent to-black/0 pointer-events-none z-20" />
    </div>
  );
}
