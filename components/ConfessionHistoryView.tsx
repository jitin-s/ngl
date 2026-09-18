'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Heart, 
  Sparkles, 
  Clock, 
  MessageSquare, 
  Bell, 
  ShieldCheck, 
  Search, 
  RefreshCw, 
  Plus, 
  ExternalLink,
  Filter,
  Eye, 
  CheckCircle2, 
  Lock,
  LogIn,
  LockKeyhole,
  ArrowRight,
  AlertCircle,
  Trash2
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { Tilt3DCard } from '@/components/Tilt3DCard';
import { GuestWarningModal } from '@/components/GuestWarningModal';
import { InstitutionLogo } from '@/components/InstitutionLogo';

function InstagramIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

export interface ConfessionItem {
  id: string;
  name_or_nickname: string;
  instagram_id?: string;
  has_relationship: boolean;
  has_crush: boolean;
  crush_name?: string;
  crush_organization?: string;
  crush_duration?: string;
  crush_id_or_number?: string;
  comments: string;
  notify_when_single?: boolean;
  notification_channel?: string;
  contact_info?: string;
  is_confidential?: boolean;
  created_at: string;
  user_id?: string;
  guest_id?: string;
}

interface ConfessionHistoryViewProps {
  onNewConfession?: () => void;
  onCountLoaded?: (total: number, crushes: number) => void;
}

export function ConfessionHistoryView({ onNewConfession, onCountLoaded }: ConfessionHistoryViewProps) {
  const { user, isLoading: authLoading, loginAsGuest } = useAuth();
  const [confessions, setConfessions] = useState<ConfessionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'single' | 'committed' | 'has_crush'>('all');
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

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const localIds: string[] = [];
      try {
        const stored = localStorage.getItem('my_confession_ids');
        if (stored) {
          localIds.push(...JSON.parse(stored));
        }
      } catch (e) {
        console.error(e);
      }

      let fetchedItems: ConfessionItem[] = [];

      if (user?.id) {
        const { data, error } = await supabase
          .from('crush_submissions')
          .select('*')
          .or(`user_id.eq.${user.id},guest_id.eq.${user.id}`)
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
          fetchedItems = data;
        }
      }

      if (fetchedItems.length === 0 && localIds.length > 0) {
        const { data, error } = await supabase
          .from('crush_submissions')
          .select('*')
          .in('id', localIds)
          .order('created_at', { ascending: false });

        if (!error && data) {
          fetchedItems = data;
        }
      }

      if (fetchedItems.length === 0) {
        try {
          const cached = localStorage.getItem('my_cached_confessions');
          if (cached) {
            fetchedItems = JSON.parse(cached);
          }
        } catch (e) {}
      }

      setConfessions(fetchedItems);
      if (onCountLoaded) {
        const crushCount = fetchedItems.filter(i => i.has_crush).length;
        onCountLoaded(fetchedItems.length, crushCount);
      }
    } catch (err) {
      console.error('Failed to load confession history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      fetchHistory();
    }
  }, [user, authLoading]);

  const filteredConfessions = confessions.filter((item) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q || (
      item.name_or_nickname?.toLowerCase().includes(q) ||
      item.crush_name?.toLowerCase().includes(q) ||
      item.comments?.toLowerCase().includes(q) ||
      item.crush_id_or_number?.toLowerCase().includes(q) ||
      item.instagram_id?.toLowerCase().includes(q)
    );

    if (!matchesSearch) return false;

    if (filterType === 'single') return !item.has_relationship;
    if (filterType === 'committed') return item.has_relationship;
    if (filterType === 'has_crush') return item.has_crush;

    return true;
  });

  // ========================================================
  // 🔒 IF NOT LOGGED IN: SHOW LOCKED VAULT GATE
  // ========================================================
  if (!user) {
    return (
      <div className="w-full max-w-xl mx-auto py-2">
        <Tilt3DCard intensity={8}>
          <div className="glass-card p-6 sm:p-8 rounded-3xl border border-pink-500/30 text-center space-y-6 backdrop-blur-xl shadow-2xl relative overflow-hidden">
            {/* Lock Icon */}
            <div className="w-16 h-16 mx-auto rounded-3xl bg-gradient-to-tr from-pink-500/30 via-rose-500/40 to-amber-500/30 border border-pink-400/40 flex items-center justify-center text-pink-200 shadow-xl shadow-pink-500/20 animate-cute-bounce">
              <LockKeyhole className="w-8 h-8 text-pink-300" />
            </div>

            <div className="space-y-2.5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-500/20 border border-pink-400/30 text-pink-200 text-xs font-bold">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Personal Secret History</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black bg-gradient-to-r from-pink-100 via-rose-200 to-amber-100 bg-clip-text text-transparent">
                Unlock Your Personal Secrets Vault 📜✨
              </h2>
              <p className="text-xs sm:text-sm text-pink-200/80 leading-relaxed max-w-md mx-auto">
                Log in or enter with Guest Mode to access all your submitted confessions, check notification statuses, and manage your private crush history.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Link
                href="/auth?mode=login"
                className="w-full sm:flex-1 py-3 px-4 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-bold text-xs sm:text-sm shadow-lg shadow-rose-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer text-center"
              >
                <LogIn className="w-4 h-4" />
                <span>Log In 💕</span>
              </Link>

              <Link
                href="/auth?mode=signup"
                className="w-full sm:flex-1 py-3 px-4 rounded-2xl bg-white/10 hover:bg-white/15 border border-pink-400/30 text-pink-100 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer backdrop-blur-md text-center"
              >
                <span>Sign Up 🌸</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <button
                type="button"
                onClick={() => setShowGuestWarning(true)}
                className="w-full sm:flex-1 py-3 px-4 rounded-2xl bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 text-white font-bold text-xs sm:text-sm shadow-md shadow-amber-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <span>Guest Mode 🎭</span>
              </button>
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

  return (
    <div className="space-y-6">
      {/* 3-Week Guest Mode Warning Alert Banner */}
      {user.isGuest && (
        <div className="p-4 rounded-3xl bg-amber-500/15 border border-amber-400/30 backdrop-blur-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs shadow-lg">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-300 shrink-0">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-amber-200 block">
                ⏳ Guest Session (Auto-Deletes After 3 Weeks)
              </span>
              <p className="text-pink-100/80 text-[11px]">
                Your confessions are temporarily saved in the vault database and will be permanently wiped on expiry.
              </p>
            </div>
          </div>

          <Link
            href="/auth?mode=signup"
            className="shrink-0 py-2 px-3.5 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-rose-500/20 transition-all text-center"
          >
            <span>Upgrade to Keep Forever 🌸</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* Header & Controls */}
      <div className="glass-card p-6 rounded-3xl border border-pink-500/25 shadow-xl backdrop-blur-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-5 h-5 text-pink-300" />
              <h2 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-pink-200 via-rose-200 to-amber-200 bg-clip-text text-transparent">
                My Secret Confessions Vault 📜
              </h2>
            </div>
            <p className="text-pink-200/70 text-xs md:text-sm">
              All your submitted confessions, crush details, and encrypted letters.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {/* Search Input */}
            <div className="flex-1 sm:w-56 relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-pink-300/50" />
              <input
                type="text"
                placeholder="Search secrets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-black/30 border border-pink-500/25 focus:border-pink-400 rounded-2xl py-2 pl-9 pr-3 text-xs text-white placeholder-pink-200/40 focus:outline-none focus:ring-1 focus:ring-pink-500/30 transition-all"
              />
            </div>

            <button
              onClick={fetchHistory}
              disabled={loading}
              title="Refresh History"
              className="p-2.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-pink-200 transition-all hover:rotate-180 duration-500 cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>

            {onNewConfession && (
              <button
                onClick={onNewConfession}
                className="py-2 px-3.5 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-md shadow-rose-500/20 transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New</span>
              </button>
            )}
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap gap-2 pt-4 border-t border-white/10 mt-4 text-xs">
          {[
            { id: 'all', label: `All (${confessions.length})` },
            { id: 'single', label: 'Single 💫' },
            { id: 'committed', label: 'Committed 💍' },
            { id: 'has_crush', label: 'Has Crush 💖' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterType(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl font-medium transition-all cursor-pointer ${
                filterType === tab.id
                  ? 'bg-pink-500 text-white shadow-sm'
                  : 'bg-white/5 text-pink-200/70 hover:bg-white/10 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Confession Cards */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-center">
          <Heart className="w-10 h-10 text-pink-400 animate-pulse mb-3" />
          <p className="text-pink-200/70 text-sm">Opening your private memory vault...</p>
        </div>
      ) : filteredConfessions.length === 0 ? (
        <div className="glass-card p-10 rounded-3xl border border-pink-500/20 text-center space-y-4 backdrop-blur-xl shadow-lg">
          <div className="w-16 h-16 rounded-full bg-pink-500/10 border border-pink-500/20 mx-auto flex items-center justify-center text-2xl">
            💌
          </div>
          <div>
            <h3 className="text-lg font-bold text-pink-200">No confessions found</h3>
            <p className="text-pink-200/60 text-xs md:text-sm mt-1 max-w-md mx-auto">
              {searchQuery
                ? 'No past secrets matched your search query.'
                : 'You haven’t submitted any secret confessions yet in this session.'}
            </p>
          </div>
          {onNewConfession && (
            <button
              onClick={onNewConfession}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-medium text-xs md:text-sm shadow-lg shadow-rose-500/25 transition-all cursor-pointer"
            >
              <span>Make Your First Confession 💕</span>
              <Sparkles className="w-4 h-4" />
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredConfessions.map((item, index) => {
            const dateStr = new Date(item.created_at).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <Tilt3DCard key={item.id || index} intensity={10}>
                <div className="glass-card p-5 rounded-3xl border border-pink-500/20 hover:border-pink-400/40 transition-all duration-300 shadow-xl backdrop-blur-xl flex flex-col justify-between h-full">
                  <div>
                    {/* Card Header */}
                    <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-3 mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-pink-500/20 to-rose-500/30 border border-pink-400/30 flex items-center justify-center text-pink-300 shadow-inner">
                          <Heart className="w-4 h-4 fill-pink-400/30 animate-gentle-heartbeat" />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-sm text-pink-100">{item.name_or_nickname}</span>
                            {item.instagram_id && (
                              <span className="text-[10px] text-pink-300 bg-pink-500/10 px-1.5 py-0.5 rounded border border-pink-500/20 flex items-center gap-1">
                                <InstagramIcon className="w-2.5 h-2.5" />
                                @{item.instagram_id.replace(/^@/, '')}
                              </span>
                            )}
                          </div>
                          <span className="text-[10.5px] text-pink-200/50 flex items-center gap-1 mt-0.5">
                            <Clock className="w-3 h-3" />
                            {dateStr}
                          </span>
                        </div>
                      </div>

                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${
                        item.has_relationship ? 'bg-amber-500/15 border-amber-400/30 text-amber-200' : 'bg-emerald-500/15 border-emerald-400/30 text-emerald-200'
                      }`}>
                        {item.has_relationship ? 'Committed 💍' : 'Single 💫'}
                      </span>
                    </div>

                    {/* Crush info */}
                    {item.has_crush && (
                      <div className="mb-3 space-y-2">
                        <div className="p-2.5 rounded-2xl bg-gradient-to-r from-rose-500/15 via-pink-500/15 to-purple-500/10 border border-rose-400/30 text-xs flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <Heart className="w-3.5 h-3.5 fill-rose-400 text-rose-400 animate-gentle-heartbeat" />
                            <span className="text-rose-300 font-bold text-[11px] uppercase tracking-wider">Crush Name:</span>
                            <span className="font-extrabold text-pink-100 bg-rose-500/25 px-2 py-0.5 rounded-lg border border-rose-400/40 ml-1">
                              {item.crush_name || 'Anonymous Crush'}
                            </span>
                          </div>
                          {item.crush_id_or_number && (
                            <span className="text-[11px] font-mono text-pink-300 flex items-center gap-1 bg-pink-500/10 px-2 py-0.5 rounded-lg border border-pink-500/20">
                              <InstagramIcon className="w-3 h-3" />
                              {item.crush_id_or_number}
                            </span>
                          )}
                          {item.crush_duration && (
                            <span className="text-[11px] text-amber-200/90 font-medium">
                              {item.crush_duration}
                            </span>
                          )}
                        </div>

                        {item.crush_organization && (
                          <div className="p-2 rounded-2xl bg-gradient-to-r from-amber-500/15 via-rose-500/15 to-pink-500/10 border border-amber-400/30 flex items-center gap-2 text-xs">
                            <InstitutionLogo name={item.crush_organization} size="xs" />
                            <div className="flex-1 min-w-0">
                              <span className="text-[10px] text-amber-300/80 font-bold uppercase block">
                                School / Institution / Area:
                              </span>
                              <span className="text-amber-100 font-semibold truncate block">
                                {item.crush_organization}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Confession Box */}
                    <div className="p-3.5 rounded-2xl bg-gradient-to-r from-pink-950/50 to-rose-950/40 border border-pink-500/30 mb-3">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-pink-300 flex items-center gap-1 mb-1">
                        <MessageSquare className="w-3 h-3 text-pink-400 animate-cute-bounce" />
                        <span>Secret Love Letter:</span>
                      </span>
                      <p className="text-xs text-pink-100/95 italic whitespace-pre-wrap leading-relaxed">
                        "{item.comments}"
                      </p>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[10.5px] text-pink-200/60">
                    <div className="flex items-center gap-1 truncate">
                      <Bell className="w-3 h-3 text-pink-400 shrink-0" />
                      <span className="truncate">
                        {item.notify_when_single ? `Alert via ${item.notification_channel || 'IG'}` : 'No notifications'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-emerald-300 shrink-0">
                      <ShieldCheck className="w-3 h-3" />
                      <span>256-bit Sealed</span>
                    </div>
                  </div>
                </div>
              </Tilt3DCard>
            );
          })}
        </div>
      )}
    </div>
  );
}
