'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { 
  Heart, 
  Sparkles, 
  Lock, 
  MessageSquare, 
  ShieldCheck, 
  Share2, 
  Copy, 
  Check, 
  User, 
  ArrowRight, 
  Clock, 
  CheckCircle2, 
  Flame,
  Shield,
  KeyRound,
  ExternalLink,
  Plus,
  Building2,
  GraduationCap,
  MapPin,
  Search,
  RefreshCw,
  Eye,
  Globe,
  ThumbsUp,
  LogIn,
  LockKeyhole
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { Tilt3DCard } from '@/components/Tilt3DCard';
import { supabase } from '@/lib/supabase';
import { GuestWarningModal } from '@/components/GuestWarningModal';
import { InstitutionLogo } from '@/components/InstitutionLogo';

export interface PublicConfession {
  id: string;
  name_or_nickname?: string;
  crush_name?: string;
  crush_organization?: string;
  comments: string;
  created_at: string;
  has_crush: boolean;
  has_relationship: boolean;
  likes_count?: number;
}

interface DashboardOverviewProps {
  onStartConfession: () => void;
  onViewHistory: () => void;
  confessionsCount: number;
  crushCount: number;
}

export function DashboardOverview({
  onStartConfession,
  onViewHistory,
  confessionsCount,
  crushCount,
}: DashboardOverviewProps) {
  const { user, loginAsGuest } = useAuth();
  const [copied, setCopied] = useState(false);
  const [showGuestWarning, setShowGuestWarning] = useState(false);
  const [guestLoading, setGuestLoading] = useState(false);

  const handleConfirmGuest = async () => {
    setGuestLoading(true);
    try {
      await loginAsGuest();
      setShowGuestWarning(false);
    } catch (e) {
      console.error(e);
    } finally {
      setGuestLoading(false);
    }
  };

  // Public Confessions Feed State
  const [publicFeed, setPublicFeed] = useState<PublicConfession[]>([]);
  const [feedLoading, setFeedLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [placeFilter, setPlaceFilter] = useState<'all' | 'college' | 'school' | 'work' | 'area'>('all');
  const [likedMap, setLikedMap] = useState<Record<string, number>>({});

  const fetchPublicWall = async () => {
    // Only fetch public confessions if user is logged in (registered or guest)
    if (!user) return;

    setFeedLoading(true);
    try {
      // Tier 1: Secure PostgreSQL RPC (Zero-Leak Stored Procedure)
      const rpcRes = await supabase.rpc('get_public_confessions', { limit_count: 40 });
      
      if (!rpcRes.error && rpcRes.data && rpcRes.data.length > 0) {
        setPublicFeed(rpcRes.data);
      } else {
        // Tier 2: Safe Column Restricted Query (NEVER request submitter identity or private contact info)
        const { data, error } = await supabase
          .from('crush_submissions')
          .select('id, crush_name, crush_organization, comments, created_at, has_crush, has_relationship')
          .order('created_at', { ascending: false })
          .limit(40);

        if (!error && data) {
          setPublicFeed(data);
        } else {
          // Tier 3: Local cache fallback
          try {
            const cached = localStorage.getItem('my_cached_confessions');
            if (cached) {
              const parsed = JSON.parse(cached);
              setPublicFeed(parsed.map((p: any) => ({
                id: p.id,
                crush_name: p.crush_name,
                crush_organization: p.crush_organization,
                comments: p.comments,
                created_at: p.created_at,
                has_crush: p.has_crush,
                has_relationship: p.has_relationship
              })));
            }
          } catch (e) {}
        }
      }
    } catch (err) {
      console.error('Failed to fetch public confession wall:', err);
    } finally {
      setFeedLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchPublicWall();
    } else {
      setPublicFeed([]);
    }
  }, [user]);

  const handleShareLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.origin);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleWhatsAppShare = () => {
    if (typeof window !== 'undefined') {
      const text = encodeURIComponent(`Hey! Drop your secret crush or confession anonymously on nglcrush 💕✨: ${window.location.origin}`);
      window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
    }
  };

  const handleLike = (id: string) => {
    setLikedMap((prev) => ({
      ...prev,
      [id]: (prev[id] || 0) + 1,
    }));
  };

  // Filter public confessions based on search query and place category
  const filteredFeed = publicFeed.filter((item) => {
    const q = searchQuery.toLowerCase().trim();
    const org = item.crush_organization?.toLowerCase() || '';
    const crush = item.crush_name?.toLowerCase() || '';
    const text = item.comments?.toLowerCase() || '';

    const matchesSearch = !q || (
      org.includes(q) ||
      crush.includes(q) ||
      text.includes(q)
    );

    if (!matchesSearch) return false;

    if (placeFilter === 'college') {
      return org.includes('univ') || org.includes('college') || org.includes('campus') || org.includes('iit') || org.includes('nit') || org.includes('institute');
    }
    if (placeFilter === 'school') {
      return org.includes('school') || org.includes('high') || org.includes('academy') || org.includes('class');
    }
    if (placeFilter === 'work') {
      return org.includes('corp') || org.includes('technologies') || org.includes('office') || org.includes('work') || org.includes('company') || org.includes('google') || org.includes('microsoft');
    }
    if (placeFilter === 'area') {
      return !org.includes('univ') && !org.includes('school') && !org.includes('college');
    }

    return true;
  });

  // ========================================================
  // 🔒 IF NOT LOGGED IN: SHOW LOCKED VAULT & LOGIN PORTAL
  // ========================================================
  if (!user) {
    return (
      <div className="space-y-8 max-w-4xl mx-auto py-2">
        {/* 3D Locked Vault Gate Card */}
        <Tilt3DCard intensity={8}>
          <div className="glass-card p-8 md:p-12 rounded-3xl border border-pink-500/30 text-center space-y-6 backdrop-blur-2xl shadow-2xl relative overflow-hidden">
            {/* Pulsing Lock Icon */}
            <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-tr from-pink-500/30 via-rose-500/40 to-amber-500/30 border border-pink-400/40 flex items-center justify-center text-pink-200 shadow-xl shadow-pink-500/20 animate-cute-bounce">
              <LockKeyhole className="w-10 h-10 text-pink-300" />
            </div>

            <div className="space-y-3 max-w-lg mx-auto">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-pink-500/20 border border-pink-400/30 text-pink-200 text-xs font-bold">
                <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-spin-slow" />
                <span>Private & Encrypted Sanctuary</span>
              </div>
              <h2 className="text-2xl md:text-4xl font-black bg-gradient-to-r from-pink-100 via-rose-200 to-amber-100 bg-clip-text text-transparent leading-tight">
                Unlock the Public Confessions & Crush Wall 💌✨
              </h2>
              <p className="text-xs md:text-sm text-pink-200/80 leading-relaxed">
                To keep all feelings confidential and secure, please log in, create an account, or enter with 1-click Guest Mode to explore secrets from schools, colleges, and living areas worldwide!
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2 max-w-md mx-auto">
              <Link
                href="/auth?mode=login"
                className="w-full sm:flex-1 py-3.5 px-5 rounded-2xl bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 hover:from-rose-600 hover:to-pink-700 text-white font-bold text-xs md:text-sm shadow-xl shadow-rose-500/30 flex items-center justify-center gap-2 transition-all cursor-pointer text-center"
              >
                <LogIn className="w-4 h-4" />
                <span>Log In 💖</span>
              </Link>

              <Link
                href="/auth?mode=signup"
                className="w-full sm:flex-1 py-3.5 px-5 rounded-2xl bg-white/10 hover:bg-white/15 border border-pink-400/30 text-pink-100 font-bold text-xs md:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer backdrop-blur-md text-center"
              >
                <span>Sign Up 🌸</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <button
                type="button"
                onClick={() => setShowGuestWarning(true)}
                className="w-full sm:flex-1 py-3.5 px-5 rounded-2xl bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 text-white font-bold text-xs md:text-sm shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <span>Guest Mode 🎭</span>
              </button>
            </div>

            {/* Feature Highlights Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-6 border-t border-white/10 text-xs text-left">
              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                <div className="flex items-center gap-1.5 text-pink-300 font-bold">
                  <GraduationCap className="w-4 h-4 text-amber-300" />
                  <span>Campus Crushes</span>
                </div>
                <p className="text-pink-200/70 text-[11px]">
                  Explore confessions specifically from your university, college, or school.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                <div className="flex items-center gap-1.5 text-pink-300 font-bold">
                  <MapPin className="w-4 h-4 text-rose-300" />
                  <span>Area Filter</span>
                </div>
                <p className="text-pink-200/70 text-[11px]">
                  Find anonymous feelings from your hometown, city, or neighborhood.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                <div className="flex items-center gap-1.5 text-pink-300 font-bold">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Zero-Leak Safe</span>
                </div>
                <p className="text-pink-200/70 text-[11px]">
                  Contact details & Instagram handles are 100% sealed and never exposed.
                </p>
              </div>
            </div>
          </div>
        </Tilt3DCard>

        {/* 3-Week Guest Advance Warning Modal */}
        <GuestWarningModal
          isOpen={showGuestWarning}
          onClose={() => setShowGuestWarning(false)}
          onConfirmGuest={handleConfirmGuest}
          isLoading={guestLoading}
        />
      </div>
    );
  }

  // ========================================================
  // 🔓 IF LOGGED IN: SHOW FULL STATS & PUBLIC CRUSH WALL
  // ========================================================
  return (
    <div className="space-y-8">
      {/* Welcome & Security Banner in 3D */}
      <Tilt3DCard intensity={6}>
        <div className="glass-card p-6 md:p-8 rounded-3xl border border-pink-400/30 relative overflow-hidden backdrop-blur-2xl shadow-2xl">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
            <div className="space-y-2 max-w-xl">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-pink-500/20 border border-pink-400/30 text-pink-200 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-spin-slow" />
                <span>3D Encrypted Feelings Dashboard</span>
              </div>
              <h2 className="text-2xl md:text-3xl font-extrabold bg-gradient-to-r from-pink-100 via-rose-200 to-amber-100 bg-clip-text text-transparent">
                Welcome to Your Secret Vault, {user.displayName} 🌸
              </h2>
              <p className="text-xs md:text-sm text-pink-200/80 leading-relaxed">
                Your safe, confidential sanctuary to confess feelings, find crushes by school, college, or workplace, and share anonymous love letters.
              </p>
            </div>

            <div className="flex flex-wrap gap-3 w-full md:w-auto">
              <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={onStartConfession}
                className="flex-1 md:flex-none py-3 px-6 rounded-2xl bg-gradient-to-r from-rose-500 via-pink-500 to-amber-500 hover:from-rose-600 hover:to-pink-600 text-white font-bold text-xs md:text-sm shadow-xl shadow-rose-500/30 flex items-center justify-center gap-2 transition-all cursor-pointer animate-gradient-flow"
              >
                <Plus className="w-4 h-4" />
                <span>New Confession</span>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={onViewHistory}
                className="flex-1 md:flex-none py-3 px-5 rounded-2xl bg-white/10 hover:bg-white/15 border border-pink-400/30 text-pink-100 font-semibold text-xs md:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer backdrop-blur-md"
              >
                <span>My Secrets</span>
                <ArrowRight className="w-4 h-4" />
              </motion.button>
            </div>
          </div>

          <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-rose-500/20 rounded-full blur-3xl pointer-events-none animate-pulse" />
        </div>
      </Tilt3DCard>

      {/* Metric Stats Cards in 3D (Only visible after login) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <Tilt3DCard intensity={10}>
          <div className="glass-card p-4 md:p-5 rounded-3xl border border-pink-500/20 backdrop-blur-xl space-y-2 shadow-lg cursor-pointer h-full">
            <div className="w-10 h-10 rounded-2xl bg-pink-500/20 border border-pink-400/30 flex items-center justify-center text-pink-300">
              <MessageSquare className="w-5 h-5 animate-cute-bounce" />
            </div>
            <div>
              <span className="text-[11px] uppercase tracking-wider text-pink-200/60 font-medium">Public Wall Secrets</span>
              <p className="text-xl md:text-3xl font-black text-white">{publicFeed.length}</p>
            </div>
          </div>
        </Tilt3DCard>

        <Tilt3DCard intensity={10}>
          <div className="glass-card p-4 md:p-5 rounded-3xl border border-pink-500/20 backdrop-blur-xl space-y-2 shadow-lg cursor-pointer h-full">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/20 border border-rose-400/30 flex items-center justify-center text-rose-300">
              <Heart className="w-5 h-5 fill-rose-400/30 animate-gentle-heartbeat" />
            </div>
            <div>
              <span className="text-[11px] uppercase tracking-wider text-pink-200/60 font-medium">My Recorded Crushes</span>
              <p className="text-xl md:text-3xl font-black text-rose-200">{crushCount}</p>
            </div>
          </div>
        </Tilt3DCard>

        <Tilt3DCard intensity={10}>
          <div className="glass-card p-4 md:p-5 rounded-3xl border border-pink-500/20 backdrop-blur-xl space-y-2 shadow-lg cursor-pointer h-full">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-300">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] uppercase tracking-wider text-pink-200/60 font-medium">Privacy Status</span>
              <p className="text-sm md:text-base font-bold text-emerald-300 flex items-center gap-1.5 mt-1">
                <span>Zero-Leak Safe</span>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              </p>
            </div>
          </div>
        </Tilt3DCard>

        <Tilt3DCard intensity={10}>
          <div className="glass-card p-4 md:p-5 rounded-3xl border border-pink-500/20 backdrop-blur-xl space-y-2 shadow-lg cursor-pointer h-full">
            <div className="w-10 h-10 rounded-2xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center text-purple-300">
              <User className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] uppercase tracking-wider text-pink-200/60 font-medium">Active Mode</span>
              <p className="text-xs md:text-sm font-bold text-pink-100 truncate mt-1">
                {user.isGuest ? '🎭 Guest Identity' : '👤 Registered User'}
              </p>
            </div>
          </div>
        </Tilt3DCard>
      </div>

      {/* ======================================================== */}
      {/* 🌍 PUBLIC CONFESSION & CRUSH WALL (EVERYONE'S FEELINGS) */}
      {/* ======================================================== */}
      <div className="space-y-5">
        {/* Wall Header & Search Control */}
        <div className="glass-card p-6 md:p-7 rounded-3xl border border-pink-500/25 shadow-xl backdrop-blur-xl">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <Globe className="w-5 h-5 text-pink-300 animate-spin-slow" />
                <h3 className="text-xl md:text-2xl font-black bg-gradient-to-r from-pink-200 via-rose-200 to-amber-200 bg-clip-text text-transparent">
                  Public Confessions & Crush Wall 💌✨
                </h3>
              </div>
              <p className="text-xs md:text-sm text-pink-200/80">
                Explore heartfelt secrets from schools, colleges, universities, and areas worldwide (100% confidential & zero-leak protected).
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
              {/* Search by School/Organization/Crush */}
              <div className="flex-1 sm:w-72 relative">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-pink-300/50" />
                <input
                  type="text"
                  placeholder="Search by school, college, area, or crush..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-black/35 border border-pink-500/30 focus:border-pink-400 rounded-2xl py-2.5 pl-10 pr-3 text-xs text-white placeholder-pink-200/40 focus:outline-none focus:ring-2 focus:ring-pink-500/30 transition-all"
                />
              </div>

              <button
                onClick={fetchPublicWall}
                disabled={feedLoading}
                title="Refresh Wall"
                className="p-2.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/15 text-pink-200 transition-all hover:rotate-180 duration-500 cursor-pointer"
              >
                <RefreshCw className={`w-4 h-4 ${feedLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Place Category Filter Pills */}
          <div className="flex flex-wrap gap-2 pt-4 border-t border-white/10 mt-4 text-xs">
            {[
              { id: 'all', label: `All Places (${publicFeed.length})` },
              { id: 'college', label: 'Universities & Colleges 🎓' },
              { id: 'school', label: 'Schools 🏫' },
              { id: 'work', label: 'Workplaces & Companies 💼' },
              { id: 'area', label: 'Cities & Living Areas 📍' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setPlaceFilter(tab.id as any)}
                className={`px-3.5 py-1.5 rounded-xl font-semibold transition-all cursor-pointer ${
                  placeFilter === tab.id
                    ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md shadow-pink-500/20'
                    : 'bg-white/5 text-pink-200/70 hover:bg-white/10 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Public Feed Confession Cards */}
        {feedLoading ? (
          <div className="py-16 flex flex-col items-center justify-center text-center">
            <Heart className="w-10 h-10 text-pink-400 animate-pulse mb-3" />
            <p className="text-pink-200/70 text-sm">Gathering secrets from universities and places...</p>
          </div>
        ) : filteredFeed.length === 0 ? (
          <div className="glass-card p-10 rounded-3xl border border-pink-500/20 text-center space-y-4 backdrop-blur-xl shadow-lg">
            <div className="w-16 h-16 rounded-full bg-pink-500/10 border border-pink-500/20 mx-auto flex items-center justify-center text-2xl">
              🏫
            </div>
            <div>
              <h4 className="text-lg font-bold text-pink-200">No confessions found for this place</h4>
              <p className="text-pink-200/60 text-xs md:text-sm mt-1 max-w-md mx-auto">
                {searchQuery
                  ? `No secrets found matching "${searchQuery}". Be the first to drop a confession for your school or area!`
                  : 'Be the very first one to drop an anonymous secret for your institution or area! 🌸'}
              </p>
            </div>
            <button
              onClick={onStartConfession}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-bold text-xs md:text-sm shadow-lg shadow-rose-500/25 transition-all cursor-pointer"
            >
              <span>Confess a Secret for Your School/Area 💕</span>
              <Sparkles className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredFeed.map((item, index) => {
              const dateStr = new Date(item.created_at).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              });
              const extraLikes = likedMap[item.id] || 0;

              return (
                <Tilt3DCard key={item.id || index} intensity={10}>
                  <div className="glass-card p-5 rounded-3xl border border-pink-500/20 hover:border-pink-400/50 transition-all duration-300 shadow-xl backdrop-blur-2xl flex flex-col justify-between h-full relative overflow-hidden group">
                    <div>
                      {/* Card Header - 100% Anonymous Submitter (No Username/Name Shown) */}
                      <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-3 mb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-2xl bg-gradient-to-tr from-pink-500/20 to-rose-500/30 border border-pink-400/30 flex items-center justify-center text-pink-300 shadow-inner">
                            <Lock className="w-3.5 h-3.5 text-pink-300" />
                          </div>
                          <div>
                            <span className="font-extrabold text-xs sm:text-sm text-pink-100 flex items-center gap-1.5">
                              <span>Anonymous Confession</span>
                              <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 font-medium border border-emerald-500/30">100% Secret</span>
                            </span>
                            <span className="text-[10px] text-pink-200/50 flex items-center gap-1">
                              <Clock className="w-2.5 h-2.5" />
                              {dateStr}
                            </span>
                          </div>
                        </div>

                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-pink-500/15 border border-pink-400/30 text-pink-200">
                          💌 Secret
                        </span>
                      </div>

                      {/* Crush & Organization Badge */}
                      <div className="mb-3 space-y-2">
                        {/* Crush Name Title & Value */}
                        <div className="p-2.5 rounded-2xl bg-gradient-to-r from-rose-500/15 via-pink-500/15 to-purple-500/10 border border-rose-400/30 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1.5 text-rose-300 font-bold">
                            <Heart className="w-3.5 h-3.5 fill-rose-400 text-rose-400 animate-gentle-heartbeat" />
                            <span className="text-[11px] uppercase tracking-wider">Crush Name:</span>
                          </div>
                          <span className="font-extrabold text-pink-100 bg-rose-500/25 px-2.5 py-1 rounded-xl border border-rose-400/40 text-xs shadow-sm">
                            {item.crush_name || 'Secret Admirer 🤫'}
                          </span>
                        </div>

                        {/* Compulsory Organization / Institution / Area Pill with Dynamic Logo */}
                        <div className="p-2.5 rounded-2xl bg-gradient-to-r from-amber-500/15 via-rose-500/15 to-pink-500/10 border border-amber-400/30 flex items-center gap-2.5 text-xs">
                          <InstitutionLogo
                            name={item.crush_organization || ''}
                            size="sm"
                            className="border-amber-400/30 shadow-sm"
                          />
                          <div className="flex-1 min-w-0">
                            <span className="text-[10px] uppercase tracking-wider text-amber-300/80 font-bold block">
                              From School / Institution / Area:
                            </span>
                            <span className="font-bold text-amber-100 text-xs leading-tight block truncate">
                              {item.crush_organization || 'Institution / Local Living Area'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Secret Love Letter Box */}
                      <div className="p-3.5 rounded-2xl bg-gradient-to-r from-pink-950/50 to-rose-950/40 border border-pink-500/30 mb-3">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-pink-300 flex items-center gap-1 mb-1">
                          <MessageSquare className="w-3 h-3 text-pink-400 animate-cute-bounce" />
                          <span>Secret Confession:</span>
                        </span>
                        <p className="text-xs text-pink-100/95 italic whitespace-pre-wrap leading-relaxed">
                          "{item.comments}"
                        </p>
                      </div>
                    </div>

                    {/* Footer / Send Love Reaction */}
                    <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px] text-pink-200/60">
                      <div className="flex items-center gap-1 text-emerald-300 text-[10.5px]">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Zero-Leak Safe</span>
                      </div>

                      <button
                        onClick={() => handleLike(item.id)}
                        className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-pink-500/20 hover:bg-pink-500/30 border border-pink-400/40 text-pink-200 font-bold transition-all cursor-pointer active:scale-90"
                      >
                        <Heart className="w-3.5 h-3.5 fill-pink-400 text-pink-400" />
                        <span>{extraLikes > 0 ? `💖 ${extraLikes}` : 'Send Love'}</span>
                      </button>
                    </div>
                  </div>
                </Tilt3DCard>
              );
            })}
          </div>
        )}
      </div>

      {/* Share Box & Zero-Gap Security Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
        {/* Share Anonymous Box Widget in 3D */}
        <Tilt3DCard intensity={8}>
          <div className="glass-card p-6 rounded-3xl border border-pink-500/25 space-y-4 backdrop-blur-xl shadow-xl relative overflow-hidden h-full">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-pink-500/20 border border-pink-400/30 flex items-center justify-center text-pink-300">
                <Share2 className="w-5 h-5 animate-cute-bounce" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Share Your Confession Box Link 💕</h3>
                <p className="text-xs text-pink-200/70">Let friends or your secret admirer drop anonymous messages to you!</p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-black/35 border border-pink-500/20 flex items-center justify-between gap-2">
              <span className="text-xs font-mono text-pink-200/80 truncate">
                {typeof window !== 'undefined' ? window.location.origin : 'https://your-confession-vault.vercel.app'}
              </span>
              <button
                onClick={handleShareLink}
                className="py-1.5 px-3 rounded-xl bg-pink-500/20 hover:bg-pink-500/30 border border-pink-400/40 text-xs font-semibold text-pink-200 flex items-center gap-1.5 shrink-0 transition-all cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied!' : 'Copy Link'}</span>
              </button>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              <button
                onClick={handleWhatsAppShare}
                className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/30 text-emerald-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <span>💬 Share on WhatsApp</span>
              </button>
              <button
                onClick={handleShareLink}
                className="flex-1 py-2.5 px-3 rounded-xl bg-gradient-to-r from-pink-500/20 to-purple-500/20 hover:from-pink-500/30 hover:to-purple-500/30 border border-pink-400/30 text-pink-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <span>📸 Share on Instagram Bio</span>
              </button>
            </div>
          </div>
        </Tilt3DCard>

        {/* Zero Gap Risk Security Guarantee in 3D */}
        <Tilt3DCard intensity={8}>
          <div className="glass-card p-6 rounded-3xl border border-pink-500/25 space-y-4 backdrop-blur-xl shadow-xl h-full">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Zero-Gap Risk Security System 🛡️</h3>
                <p className="text-xs text-pink-200/70">Public Wall Protection: Contact details & IG handles are NEVER leaked</p>
              </div>
            </div>

            <div className="space-y-2.5 text-xs text-pink-100/85">
              <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-white/5 border border-white/10">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white">Complete Submitter Anonymity:</strong> Submitter names and usernames are NEVER displayed in the public gallery. Only the target crush name, institution/area, and confession message are shown while keeping your identity 100% anonymous.
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-white/5 border border-white/10">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white">Anti-Brute Force Protection:</strong> Server-side timing-safe cryptography and IP rate limiting block automated penetration attempts.
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-white/5 border border-white/10">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white">Sanitized Inputs:</strong> Strips scripts, code injections, and digits in personal names automatically.
                </div>
              </div>
            </div>
          </div>
        </Tilt3DCard>
      </div>
    </div>
  );
}
