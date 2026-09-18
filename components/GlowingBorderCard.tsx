'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface GlowingBorderCardProps {
  children: React.ReactNode;
  className?: string;
  glowColors?: string;
  onClick?: () => void;
}

export function GlowingBorderCard({
  children,
  className = '',
  glowColors = 'from-rose-500 via-pink-500 to-amber-400',
  onClick,
}: GlowingBorderCardProps) {
  return (
    <div
      onClick={onClick}
      className={`relative group rounded-3xl p-[1.5px] transition-all duration-300 ${className}`}
    >
      {/* Rotating / Pulsing Glowing Border Effect */}
      <div
        className={`absolute -inset-[1px] rounded-3xl bg-gradient-to-r ${glowColors} opacity-40 group-hover:opacity-100 blur-sm group-hover:blur-md transition-all duration-500 animate-gradient-flow`}
      />

      {/* Card Inner Surface */}
      <div className="relative rounded-[22px] bg-[#1a0515]/90 backdrop-blur-2xl border border-white/10 p-6 md:p-8 h-full shadow-2xl overflow-hidden">
        {/* Subtle Specular Glow Spot */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-rose-500/15 rounded-full blur-2xl pointer-events-none group-hover:bg-rose-500/25 transition-all duration-500" />
        
        <div className="relative z-10">
          {children}
        </div>
      </div>
    </div>
  );
}
