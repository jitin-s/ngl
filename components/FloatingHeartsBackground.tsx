'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface Particle {
  id: number;
  x: number; // percentage
  size: number; // px
  duration: number; // seconds
  delay: number; // seconds
  type: 'heart' | 'sparkle' | 'star' | 'petal';
  opacity: number;
  rotation: number;
}

export function FloatingHeartsBackground() {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    // Generate deterministic particles on client mount
    const count = 22;
    const generated: Particle[] = [];
    const types: Particle['type'][] = ['heart', 'sparkle', 'star', 'petal'];

    for (let i = 0; i < count; i++) {
      generated.push({
        id: i,
        x: Math.random() * 96 + 2, // 2% to 98%
        size: Math.floor(Math.random() * 16) + 12, // 12px to 28px
        duration: Math.random() * 14 + 12, // 12s to 26s
        delay: Math.random() * 10,
        type: types[Math.floor(Math.random() * types.length)],
        opacity: Math.random() * 0.4 + 0.25,
        rotation: Math.random() * 360,
      });
    }
    setParticles(generated);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 select-none">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{
            y: '105vh',
            x: `${p.x}vw`,
            opacity: 0,
            rotate: p.rotation,
            scale: 0.7,
          }}
          animate={{
            y: '-10vh',
            x: [`${p.x}vw`, `${(p.x + 3) % 96}vw`, `${(p.x - 3 + 96) % 96}vw`, `${p.x}vw`],
            opacity: [0, p.opacity, p.opacity * 1.2, 0],
            rotate: p.rotation + 360,
            scale: [0.7, 1.15, 0.9, 0.7],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
            ease: 'linear',
          }}
          style={{
            position: 'absolute',
            width: p.size,
            height: p.size,
          }}
        >
          {p.type === 'heart' && (
            <svg
              viewBox="0 0 24 24"
              className="w-full h-full text-pink-400 drop-shadow-[0_0_8px_rgba(244,63,94,0.6)]"
              fill="currentColor"
            >
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
          )}

          {p.type === 'sparkle' && (
            <svg
              viewBox="0 0 24 24"
              className="w-full h-full text-amber-300 drop-shadow-[0_0_8px_rgba(253,224,71,0.7)]"
              fill="currentColor"
            >
              <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" />
            </svg>
          )}

          {p.type === 'star' && (
            <svg
              viewBox="0 0 24 24"
              className="w-full h-full text-rose-300 drop-shadow-[0_0_6px_rgba(251,113,133,0.6)]"
              fill="currentColor"
            >
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          )}

          {p.type === 'petal' && (
            <div className="w-full h-full rounded-full bg-gradient-to-tr from-rose-400 to-pink-300 rotate-45 opacity-75 blur-[0.5px] drop-shadow-[0_0_6px_rgba(244,63,94,0.5)]" />
          )}
        </motion.div>
      ))}
    </div>
  );
}
