'use client';

import React from 'react';
import { motion } from 'framer-motion';

export function Floating3DCrystals() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none">
      {/* 3D Floating Heart 1 */}
      <motion.div
        animate={{
          y: [-15, 15, -15],
          rotateX: [15, -15, 15],
          rotateY: [-20, 20, -20],
          rotateZ: [-5, 5, -5],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="absolute top-24 left-8 md:left-20 w-16 h-16 md:w-20 md:h-20 opacity-40 hover:opacity-80 transition-opacity drop-shadow-[0_15px_25px_rgba(244,63,94,0.4)]"
        style={{ perspective: 800, transformStyle: 'preserve-3d' }}
      >
        <div className="w-full h-full rounded-2xl bg-gradient-to-tr from-rose-500/40 via-pink-400/30 to-rose-300/20 backdrop-blur-md border border-pink-300/40 flex items-center justify-center text-2xl shadow-inner">
          💖
        </div>
      </motion.div>

      {/* 3D Floating Crystal Diamond 2 */}
      <motion.div
        animate={{
          y: [15, -20, 15],
          rotateX: [-25, 25, -25],
          rotateY: [30, -30, 30],
          rotateZ: [10, -10, 10],
        }}
        transition={{
          duration: 7.5,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 1,
        }}
        className="absolute top-1/3 right-6 md:right-16 w-14 h-14 md:w-16 md:h-16 opacity-35 drop-shadow-[0_15px_25px_rgba(253,224,71,0.3)]"
        style={{ perspective: 800, transformStyle: 'preserve-3d' }}
      >
        <div className="w-full h-full rounded-2xl bg-gradient-to-tr from-amber-400/30 via-rose-400/20 to-pink-300/20 backdrop-blur-md border border-amber-300/40 flex items-center justify-center text-xl shadow-inner">
          ✨
        </div>
      </motion.div>

      {/* 3D Floating Secret Letter 3 */}
      <motion.div
        animate={{
          y: [-20, 12, -20],
          rotateX: [20, -20, 20],
          rotateY: [-25, 25, -25],
        }}
        transition={{
          duration: 8.5,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 2,
        }}
        className="absolute bottom-28 left-10 md:left-28 w-14 h-14 md:w-18 md:h-18 opacity-30 drop-shadow-[0_15px_25px_rgba(244,63,94,0.35)]"
        style={{ perspective: 800, transformStyle: 'preserve-3d' }}
      >
        <div className="w-full h-full rounded-2xl bg-gradient-to-tr from-pink-500/30 via-purple-500/20 to-rose-400/20 backdrop-blur-md border border-pink-300/40 flex items-center justify-center text-xl shadow-inner">
          💌
        </div>
      </motion.div>

      {/* 3D Floating Ring/Star 4 */}
      <motion.div
        animate={{
          y: [12, -18, 12],
          rotateX: [-15, 15, -15],
          rotateY: [20, -20, 20],
        }}
        transition={{
          duration: 6.8,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 0.5,
        }}
        className="absolute bottom-36 right-12 md:right-28 w-14 h-14 opacity-30 drop-shadow-[0_15px_25px_rgba(236,72,153,0.35)]"
        style={{ perspective: 800, transformStyle: 'preserve-3d' }}
      >
        <div className="w-full h-full rounded-2xl bg-gradient-to-tr from-rose-400/30 to-pink-500/20 backdrop-blur-md border border-rose-300/40 flex items-center justify-center text-xl shadow-inner">
          🌸
        </div>
      </motion.div>
    </div>
  );
}
