'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { 
  Heart, 
  Sparkles, 
  MessageSquare, 
  Plus, 
  History, 
  ShieldCheck, 
  User, 
  LayoutDashboard, 
  Lock, 
  Share2, 
  LogOut,
  Smile,
  Shield,
  Send
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { ConfessionWizard } from '@/components/ConfessionWizard';
import { DashboardOverview } from '@/components/DashboardOverview';
import { ConfessionHistoryView } from '@/components/ConfessionHistoryView';
import { AccountHub } from '@/components/AccountHub';
import { FloatingHeartsBackground } from '@/components/FloatingHeartsBackground';
import { CosmicRomanticCanvas } from '@/components/CosmicRomanticCanvas';
import { Floating3DCrystals } from '@/components/Floating3DCrystals';

type DashboardTab = 'overview' | 'new_confession' | 'history' | 'account';

export default function DashboardHome() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<DashboardTab>('overview');
  const [confessionsCount, setConfessionsCount] = useState(0);
  const [crushCount, setCrushCount] = useState(0);

  const handleCountsLoaded = (total: number, crushes: number) => {
    setConfessionsCount(total);
    setCrushCount(crushes);
  };

  return (
    <main className="min-h-screen relative bg-[#140211] text-white flex flex-col overflow-x-hidden">
      {/* Interactive 3D Cosmic Constellation Physics Canvas */}
      <CosmicRomanticCanvas />

      {/* 3D Floating Love Crystals & Diamonds */}
      <Floating3DCrystals />

      {/* Floating Animated Romantic Particles */}
      <FloatingHeartsBackground />

      {/* Soft Romantic Ambient Background Glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-rose-500/25 via-pink-500/20 to-amber-300/15 rounded-full blur-3xl animate-warm-pulse" />
        <div className="absolute bottom-10 left-10 w-96 h-96 bg-pink-600/20 rounded-full blur-3xl" />
        <div className="absolute top-1/3 right-10 w-80 h-80 bg-rose-400/15 rounded-full blur-3xl" />
      </div>

      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-50 backdrop-blur-2xl bg-[#170313]/80 border-b border-pink-500/20 px-4 sm:px-8 py-3.5 shadow-lg">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
          {/* Logo & Brand */}
          <div 
            onClick={() => setActiveTab('overview')}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="relative w-10 h-10 rounded-2xl overflow-hidden shadow-lg shadow-pink-500/30 group-hover:scale-105 group-hover:shadow-pink-500/50 transition-all border border-pink-500/30 bg-black/50 flex-shrink-0">
              <img
                src="/logo.jpg"
                alt="nglcrush logo"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-base sm:text-lg font-black tracking-tight bg-gradient-to-r from-pink-100 via-rose-200 to-amber-100 bg-clip-text text-transparent lowercase">
                  nglcrush
                </h1>
                <span className="text-[10px] bg-pink-500/20 text-pink-300 px-2 py-0.5 rounded-full border border-pink-500/30 font-bold hidden sm:inline-block">
                  Vault
                </span>
              </div>
              <p className="text-[10.5px] text-pink-200/60 hidden sm:block">
                Anonymous Confession & Crush Sanctuary 🌸
              </p>
            </div>
          </div>

          {/* Desktop Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1.5 bg-black/40 p-1.5 rounded-2xl border border-white/10 text-xs">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-3.5 py-2 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'overview'
                  ? 'bg-gradient-to-r from-rose-500 to-pink-600 text-white shadow-md shadow-pink-500/25'
                  : 'text-pink-200/70 hover:text-white hover:bg-white/5'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Overview</span>
            </button>

            <button
              onClick={() => setActiveTab('new_confession')}
              className={`px-3.5 py-2 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'new_confession'
                  ? 'bg-gradient-to-r from-rose-500 to-pink-600 text-white shadow-md shadow-pink-500/25'
                  : 'text-pink-200/70 hover:text-white hover:bg-white/5'
              }`}
            >
              <Plus className="w-4 h-4" />
              <span>New Confession</span>
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className={`px-3.5 py-2 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'history'
                  ? 'bg-gradient-to-r from-rose-500 to-pink-600 text-white shadow-md shadow-pink-500/25'
                  : 'text-pink-200/70 hover:text-white hover:bg-white/5'
              }`}
            >
              <History className="w-4 h-4" />
              <span>My Secrets</span>
            </button>

            <button
              onClick={() => setActiveTab('account')}
              className={`px-3.5 py-2 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'account'
                  ? 'bg-gradient-to-r from-rose-500 to-pink-600 text-white shadow-md shadow-pink-500/25'
                  : 'text-pink-200/70 hover:text-white hover:bg-white/5'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Account & Shield</span>
            </button>
          </nav>

          {/* User Profile Pill / Auth Button */}
          <div className="flex items-center gap-2">
            {user ? (
              <div 
                onClick={() => setActiveTab('account')}
                className="flex items-center gap-2 bg-black/35 hover:bg-black/50 border border-pink-500/30 px-3 py-1.5 rounded-2xl text-xs text-pink-200 backdrop-blur-md transition-all cursor-pointer shadow-sm"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                <span className="truncate max-w-[120px] font-semibold">
                  {user.isGuest ? `🎭 ${user.displayName}` : `👤 ${user.displayName}`}
                </span>
              </div>
            ) : (
              <Link
                href="/auth"
                className="inline-flex items-center gap-1.5 bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 px-3.5 py-2 rounded-2xl text-xs text-white font-bold backdrop-blur-md transition-all shadow-md shadow-rose-500/25"
              >
                <User className="w-3.5 h-3.5" />
                <span>Log In / Guest 🎭</span>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Main Dashboard Content */}
      <div className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-8 py-6 md:py-8 relative z-10">
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div
              key="tab-overview"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
            >
              <DashboardOverview
                onStartConfession={() => setActiveTab('new_confession')}
                onViewHistory={() => setActiveTab('history')}
                confessionsCount={confessionsCount}
                crushCount={crushCount}
              />
            </motion.div>
          )}

          {activeTab === 'new_confession' && (
            <motion.div
              key="tab-new-confession"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
              className="py-2"
            >
              {/* Friendly Box Subtitle */}
              <div className="text-center mb-6 max-w-md mx-auto">
                <h2 className="text-2xl font-black bg-gradient-to-r from-pink-200 via-rose-200 to-amber-200 bg-clip-text text-transparent">
                  Seal a Heartfelt Secret 💌
                </h2>
                <p className="text-xs sm:text-sm text-pink-200/70 mt-1">
                  100% confidential. Your crush or friends will never know who submitted this!
                </p>
              </div>

              <ConfessionWizard
                onSuccess={() => setConfessionsCount((prev) => prev + 1)}
                onViewHistory={() => setActiveTab('history')}
              />
            </motion.div>
          )}

          {activeTab === 'history' && (
            <motion.div
              key="tab-history"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
            >
              <ConfessionHistoryView
                onNewConfession={() => setActiveTab('new_confession')}
                onCountLoaded={handleCountsLoaded}
              />
            </motion.div>
          )}

          {activeTab === 'account' && (
            <motion.div
              key="tab-account"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
            >
              <AccountHub />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <div className="md:hidden sticky bottom-0 z-50 bg-[#170313]/90 backdrop-blur-2xl border-t border-pink-500/20 px-3 py-2 flex items-center justify-around">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl transition-all ${
            activeTab === 'overview' ? 'text-pink-300 font-bold' : 'text-pink-200/50'
          }`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-[10px]">Home</span>
        </button>

        <button
          onClick={() => setActiveTab('new_confession')}
          className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl transition-all ${
            activeTab === 'new_confession' ? 'text-pink-300 font-bold' : 'text-pink-200/50'
          }`}
        >
          <Plus className="w-5 h-5" />
          <span className="text-[10px]">Confess</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl transition-all ${
            activeTab === 'history' ? 'text-pink-300 font-bold' : 'text-pink-200/50'
          }`}
        >
          <History className="w-5 h-5" />
          <span className="text-[10px]">Secrets</span>
        </button>

        <button
          onClick={() => setActiveTab('account')}
          className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl transition-all ${
            activeTab === 'account' ? 'text-pink-300 font-bold' : 'text-pink-200/50'
          }`}
        >
          <ShieldCheck className="w-5 h-5" />
          <span className="text-[10px]">Account</span>
        </button>
      </div>

      {/* Footer */}
      <footer className="mt-auto py-6 text-center text-xs text-pink-200/50 border-t border-white/5 space-y-1">
        <p className="flex items-center justify-center gap-1.5 text-[11.5px]">
          Made with 💖 • Zero-Gap Risk Encryption • 100% Anonymous
        </p>
        <p className="text-[10.5px] text-pink-300/40">© {new Date().getFullYear()} nglcrush • All rights reserved</p>
      </footer>
    </main>
  );
}
