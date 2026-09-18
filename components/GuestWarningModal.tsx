'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { 
  AlertTriangle, 
  Sparkles, 
  Clock, 
  Trash2, 
  ShieldAlert, 
  ArrowRight, 
  X, 
  CheckCircle2, 
  HeartHandshake,
  UserCheck
} from 'lucide-react';
import { Tilt3DCard } from '@/components/Tilt3DCard';

interface GuestWarningModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmGuest: () => void;
  isLoading?: boolean;
  error?: string;
}

export function GuestWarningModal({
  isOpen,
  onClose,
  onConfirmGuest,
  isLoading = false,
  error,
}: GuestWarningModalProps) {
  if (!isOpen) return null;

  // Calculate 21 days from today
  const expiryDate = new Date(Date.now() + 21 * 24 * 60 * 60 * 1000);
  const formattedExpiry = expiryDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-black/80 backdrop-blur-xl">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ duration: 0.2 }}
        className="w-full max-w-lg relative z-50"
      >
        <div className="glass-card p-6 sm:p-8 rounded-3xl border border-amber-400/50 bg-gradient-to-b from-[#280c20]/98 via-[#1f0619]/98 to-[#140210]/98 text-white shadow-2xl relative overflow-hidden space-y-5">
          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 flex items-center justify-center text-pink-200 transition-all cursor-pointer z-20"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Header Icon */}
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500/30 to-rose-500/40 border border-amber-400/50 flex items-center justify-center text-amber-300 shadow-lg shadow-amber-500/20 shrink-0 animate-cute-bounce">
              <AlertTriangle className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 text-[10.5px] font-black uppercase tracking-wider text-amber-300 bg-amber-500/15 px-2.5 py-0.5 rounded-full border border-amber-400/30">
                <Clock className="w-3 h-3" />
                <span>Advance Warning • 3-Week Limit</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-white mt-1">
                Temporary Guest Mode
              </h3>
            </div>
          </div>

          {/* Error alert inside modal */}
          {error && (
            <div className="p-3 rounded-2xl bg-rose-500/20 border border-rose-400/40 text-rose-200 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-300 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Warning Content */}
          <div className="space-y-3 text-xs sm:text-sm text-pink-100/90 leading-relaxed">
            <p>
              You are about to enter using <strong className="text-amber-200">Temporary Guest Credentials</strong>. Your generated login passkey and confessions will be securely saved in our database, but:
            </p>

            {/* Expiry Box */}
            <div className="p-4 rounded-2xl bg-amber-500/15 border border-amber-400/30 space-y-2 text-xs">
              <div className="flex items-center gap-2 font-bold text-amber-200">
                <Trash2 className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Automatic Purge Policy (21 Days / 3 Weeks)</span>
              </div>
              <p className="text-pink-100/80">
                All guest login credentials, temporary session IDs, and associated confessions are <strong className="text-amber-300">permanently wiped and deleted from the database after 3 weeks</strong>.
              </p>
              <div className="pt-1 text-[11px] font-mono text-amber-200 bg-black/40 px-3 py-1.5 rounded-xl border border-amber-400/20 flex items-center justify-between">
                <span>Scheduled Permanent Deletion:</span>
                <span className="font-bold text-amber-300">{formattedExpiry}</span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-1 text-xs">
              <span className="font-bold text-pink-200 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-pink-400" />
                Want your confessions preserved forever?
              </span>
              <p className="text-pink-200/70 text-[11.5px]">
                Create a free permanent account with Email or 1-Click Google to keep your memories, confessions, and crush tracking safe forever with zero time limits.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2.5 pt-2 relative z-20">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onConfirmGuest();
              }}
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-amber-500 via-rose-500 to-pink-500 hover:from-amber-600 hover:to-pink-600 text-white font-bold text-xs sm:text-sm shadow-xl shadow-amber-500/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer disabled:opacity-60"
            >
              <span>{isLoading ? 'Opening Your Guest Vault...' : 'I Understand, Enter 3-Week Guest Vault 🎭'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <Link
              href="/auth?mode=signup"
              onClick={onClose}
              className="w-full py-2.5 px-4 rounded-2xl bg-white/10 hover:bg-white/15 border border-pink-400/30 text-pink-100 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer backdrop-blur-md text-center"
            >
              <UserCheck className="w-4 h-4 text-emerald-300" />
              <span>Create Permanent Account Instead 🌸</span>
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
