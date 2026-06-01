import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";

interface Particle {
  id: number;
  emoji: string;
  x: number;
  y: number;
  size: number;
  delay: number;
  duration: number;
}

interface FestivalParticlesProps {
  emojis: string[];
  animationType: "float" | "sparkle" | "spin" | "none";
}

export const FestivalParticles: React.FC<FestivalParticlesProps> = ({ emojis, animationType }) => {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    if (animationType === "none" || !emojis || emojis.length === 0) {
      setParticles([]);
      return;
    }

    // Generate 18 floating elements across the screen
    const items: Particle[] = Array.from({ length: 18 }, (_, idx) => {
      const emoji = emojis[idx % emojis.length];
      const x = Math.random() * 100; // % width
      const y = Math.random() * 100; // % height
      const size = Math.floor(Math.random() * (28 - 14 + 1)) + 14; // size in px
      const delay = Math.random() * 4;
      const duration = Math.random() * (12 - 7 + 1) + 7; // speed in seconds

      return {
        id: idx,
        emoji,
        x,
        y,
        size,
        delay,
        duration,
      };
    });

    setParticles(items);
  }, [emojis, animationType]);

  if (animationType === "none" || particles.length === 0) return null;

  return (
    <div className="absolute inset-0 max-w-full overflow-hidden pointer-events-none select-none z-0">
      <AnimatePresence>
        {particles.map((p) => {
          if (animationType === "sparkle") {
            return (
              <motion.div
                key={p.id}
                className="absolute"
                style={{
                  left: `${p.x}%`,
                  top: `${p.y}%`,
                  fontSize: `${p.size}px`,
                }}
                initial={{ opacity: 0, scale: 0.3 }}
                animate={{
                  opacity: [0, 0.7, 1, 0.7, 0],
                  scale: [0.6, 1.2, 0.9, 1.3, 0.6],
                  y: [0, -40, -80, -40, 0],
                  x: [0, Math.random() * 40 - 20, Math.random() * 40 - 20, 0],
                }}
                transition={{
                  duration: p.duration,
                  repeat: Infinity,
                  delay: p.delay,
                  ease: "easeInOut",
                }}
              >
                {p.emoji}
              </motion.div>
            );
          } else if (animationType === "float") {
            return (
              <motion.div
                key={p.id}
                className="absolute"
                style={{
                  left: `${p.x}%`,
                  top: `${p.y}%`,
                  fontSize: `${p.size}px`,
                }}
                initial={{ opacity: 0, y: 150 }}
                animate={{
                  opacity: [0, 0.8, 0.8, 0],
                  y: [-90, -350],
                  x: [0, Math.sin(p.id) * 60],
                  rotate: [0, p.id % 2 === 0 ? 360 : -360],
                }}
                transition={{
                  duration: p.duration + 5,
                  repeat: Infinity,
                  delay: p.delay,
                  ease: "easeOut",
                }}
              >
                {p.emoji}
              </motion.div>
            );
          } else if (animationType === "spin") {
            return (
              <motion.div
                key={p.id}
                className="absolute animate-pulse"
                style={{
                  left: `${p.x}%`,
                  top: `${p.y}%`,
                  fontSize: `${p.size}px`,
                }}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{
                  opacity: [0.1, 0.9, 0.1],
                  scale: [0.8, 1.1, 0.8],
                  rotate: [0, 360],
                }}
                transition={{
                  duration: p.duration + 3,
                  repeat: Infinity,
                  delay: p.delay,
                  ease: "linear",
                }}
              >
                {p.emoji}
              </motion.div>
            );
          }
          return null;
        })}
      </AnimatePresence>
    </div>
  );
};
