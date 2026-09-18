'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Sparkles, User, Heart } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { ConfessionHistoryView } from '@/components/ConfessionHistoryView';
import { CosmicRomanticCanvas } from '@/components/CosmicRomanticCanvas';
import { Floating3DCrystals } from '@/components/Floating3DCrystals';
import { FloatingHeartsBackground } from '@/components/FloatingHeartsBackground';

export default function HistoryPage() {
  const { user } = useAuth();

  return (
    <main className="min-h-screen relative p-4 md:p-8 bg-[#140211] text-white overflow-x-hidden">
      {/* Interactive 3D Cosmic Canvas */}
      <CosmicRomanticCanvas />

      {/* 3D Floating Love Crystals */}
      <Floating3DCrystals />

      {/* Floating Animated Particles */}
      <FloatingHeartsBackground />

      {/* Background ambient lighting */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-rose-500/15 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-pink-500/15 rounded-full blur-3xl" />
      </div>

      <div className="max-w-5xl mx-auto relative z-10 space-y-6">
        {/* Navigation Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs md:text-sm text-pink-200/90 hover:text-pink-100 bg-white/10 hover:bg-white/15 px-4 py-2 rounded-2xl backdrop-blur-md transition-all border border-pink-500/20 shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Confession Vault Dashboard</span>
          </Link>

          <div className="flex items-center gap-2">
            {!user ? (
              <Link
                href="/auth"
                className="inline-flex items-center gap-1.5 text-xs text-rose-200 hover:text-white bg-rose-500/20 hover:bg-rose-500/30 px-3.5 py-2 rounded-2xl border border-rose-500/30 backdrop-blur-md transition-all font-semibold"
              >
                <User className="w-3.5 h-3.5" />
                <span>Log In / Guest Mode</span>
              </Link>
            ) : (
              <div className="flex items-center gap-2 bg-pink-500/10 border border-pink-500/25 px-3 py-1.5 rounded-2xl text-xs text-pink-200 backdrop-blur-md">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="truncate max-w-[140px] font-semibold">{user.displayName}</span>
              </div>
            )}
          </div>
        </div>

        {/* History Component */}
        <ConfessionHistoryView />
      </div>
    </main>
  );
}
