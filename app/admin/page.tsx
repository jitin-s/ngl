'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Lock, 
  Unlock, 
  Heart, 
  User, 
  Calendar, 
  Bell, 
  RefreshCw, 
  Shield, 
  Search, 
  KeyRound, 
  ExternalLink,
  Target,
  Sparkles,
  Download,
  Flame,
  ShieldCheck,
  ShieldAlert,
  Eye,
  EyeOff,
  LogOut,
  AlertTriangle,
  Trash2,
  LayoutGrid,
  Table as TableIcon,
  MessageCircle,
  Copy,
  Check,
  Star,
  CheckCheck,
  X,
  History,
  AlertOctagon,
  Clock,
  Fingerprint,
  FileSpreadsheet
} from 'lucide-react';
import Link from 'next/link';

function InstagramIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

// Client-side CSV cell sanitizer against DDE / Formula Injection
function sanitizeCsvCell(value: any): string {
  if (value === null || value === undefined) return '""';
  let str = String(value);
  if (/^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }
  return `"${str.replace(/"/g, '""')}"`;
}

// Privacy Camouflage Masking Helper
function maskSensitive(text: string | null | undefined, isMasked: boolean): string {
  if (!text) return '-';
  if (!isMasked) return text;
  if (text.length <= 3) return '***';
  const start = text.slice(0, 2);
  const end = text.slice(-2);
  return `${start}${'*'.repeat(Math.min(text.length - 4, 6))}${end}`;
}

const IDLE_TIMEOUT_SECONDS = 15 * 60; // 15 minutes

export default function AdminDashboard() {
  const [passkey, setPasskey] = useState('');
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Security features state
  const [privacyMasked, setPrivacyMasked] = useState<boolean>(true);
  const [unmaskedItemIds, setUnmaskedItemIds] = useState<Set<string>>(new Set());
  const [idleSecondsRemaining, setIdleSecondsRemaining] = useState<number>(IDLE_TIMEOUT_SECONDS);
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [showPurgeModal, setShowPurgeModal] = useState(false);
  const [purgeConfirmText, setPurgeConfirmText] = useState('');
  const [lockoutRemaining, setLockoutRemaining] = useState<number>(0);
  
  // UI Preferences
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [filter, setFilter] = useState<'all' | 'mutual' | 'single' | 'confidential' | 'starred'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'name'>('newest');
  
  // Interactive features
  const [starredIds, setStarredIds] = useState<Set<string>>(new Set());
  const [toastMessage, setToastMessage] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [rlsWarning, setRlsWarning] = useState('');

  const lastActivityRef = useRef<number>(Date.now());

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  // Emergency Panic Lock
  const handlePanicLock = useCallback((reason = '🚨 Emergency Panic Lock Engaged! Session purged.') => {
    setIsAuthenticated(false);
    setSessionToken(null);
    setPasskey('');
    setSubmissions([]);
    setAuditLogs([]);
    setUnmaskedItemIds(new Set());
    setErrorMsg(reason);
  }, []);

  // Idle Timer & Inactivity Auto-Lock
  useEffect(() => {
    if (!isAuthenticated) return;

    const updateActivity = () => {
      lastActivityRef.current = Date.now();
      setIdleSecondsRemaining(IDLE_TIMEOUT_SECONDS);
    };

    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'];
    events.forEach(ev => window.addEventListener(ev, updateActivity, { passive: true }));

    const timer = setInterval(() => {
      const elapsed = Math.floor((Date.now() - lastActivityRef.current) / 1000);
      const remaining = Math.max(0, IDLE_TIMEOUT_SECONDS - elapsed);
      setIdleSecondsRemaining(remaining);

      if (remaining <= 0) {
        handlePanicLock('⏰ Session auto-locked after 15 minutes of inactivity for your security.');
      }
    }, 1000);

    return () => {
      events.forEach(ev => window.removeEventListener(ev, updateActivity));
      clearInterval(timer);
    };
  }, [isAuthenticated, handlePanicLock]);

  // Lockout countdown timer
  useEffect(() => {
    if (lockoutRemaining <= 0) return;
    const timer = setInterval(() => {
      setLockoutRemaining(prev => {
        if (prev <= 1) {
          setErrorMsg('');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [lockoutRemaining]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lockoutRemaining > 0) return;
    if (!passkey.trim()) {
      setErrorMsg('Please enter your master vault passkey.');
      return;
    }
    setErrorMsg('');
    await fetchSubmissionsWithCredentials({ passkey });
  };

  const fetchSubmissionsWithCredentials = async (creds: { passkey?: string; sessionToken?: string }) => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(creds),
      });

      const result = await res.json();

      if (!res.ok) {
        if (result.lockedSecs) {
          setLockoutRemaining(result.lockedSecs);
        }
        setErrorMsg(result.error || 'Authentication failed. Access denied.');
        setIsAuthenticated(false);
        setSessionToken(null);
      } else {
        setSubmissions(result.submissions || []);
        if (result.sessionToken) {
          setSessionToken(result.sessionToken);
        }
        if (result.auditLogs) {
          setAuditLogs(result.auditLogs);
        }
        setIsAuthenticated(true);
        lastActivityRef.current = Date.now();
        setIdleSecondsRemaining(IDLE_TIMEOUT_SECONDS);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Secure connection failed.');
    } finally {
      setLoading(false);
    }
  };

  const refreshAuditLogs = async () => {
    if (!sessionToken && !passkey) return;
    try {
      const res = await fetch('/api/admin/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'get_audit_logs',
          sessionToken,
          passkey: passkey || undefined
        }),
      });
      const data = await res.json();
      if (res.ok && data.auditLogs) {
        setAuditLogs(data.auditLogs);
        showToast('Security audit trail refreshed 🛡️');
      }
    } catch (err: any) {
      alert('Failed to refresh audit logs: ' + err.message);
    }
  };

  // Delete Individual Submission
  const handleDeleteSubmission = async (id: string) => {
    setDeletingId(id);
    setRlsWarning('');
    try {
      const res = await fetch('/api/admin/submissions', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          sessionToken,
          passkey: passkey || undefined,
          id 
        }),
      });

      const result = await res.json();
      if (res.ok && result.success) {
        setSubmissions((prev) => prev.filter((item) => item.id !== id));
        if (result.auditLogs) setAuditLogs(result.auditLogs);
        showToast('Record deleted permanently from database! 🗑️');
        setDeleteConfirmId(null);
      } else {
        if (result.warning === 'RLS_DELETE_BLOCKED') {
          setRlsWarning('Supabase RLS is blocking delete. Please run the SQL DELETE policy in Supabase SQL editor: CREATE POLICY "Allow delete" ON public.crush_submissions FOR DELETE TO anon, authenticated USING (true);');
        } else {
          alert(result.error || 'Could not delete entry.');
        }
      }
    } catch (err: any) {
      alert('Delete failed: ' + err.message);
    } finally {
      setDeletingId(null);
    }
  };

  // Bulk Purge All Submissions
  const handleBulkPurge = async () => {
    if (purgeConfirmText !== 'CONFIRM PURGE') {
      alert('Please type "CONFIRM PURGE" exactly to authorize permanent destruction.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/admin/submissions', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          sessionToken,
          passkey: passkey || undefined,
          deleteAll: true 
        }),
      });
      const result = await res.json();
      if (res.ok && result.success) {
        setSubmissions([]);
        if (result.auditLogs) setAuditLogs(result.auditLogs);
        setShowPurgeModal(false);
        setPurgeConfirmText('');
        showToast('🚨 All vault confessions purged permanently!');
      } else {
        alert(result.error || 'Purge failed.');
      }
    } catch (err: any) {
      alert('Purge error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleStar = (id: string) => {
    setStarredIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleItemPrivacy = (id: string) => {
    setUnmaskedItemIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Sanitized CSV Export preventing DDE & Formula Injections
  const handleExportCSV = () => {
    if (submissions.length === 0) return;
    const headers = ['Date', 'Name', 'Submitter_IG', 'Status', 'Has_Crush', 'Crush_Name', 'Crush_IG', 'Duration', 'Confession', 'Notification', 'Contact', 'Confidential'];
    const rows = submissions.map(s => [
      sanitizeCsvCell(new Date(s.created_at).toISOString()),
      sanitizeCsvCell(s.name_or_nickname || ''),
      sanitizeCsvCell(s.instagram_id || ''),
      sanitizeCsvCell(s.has_relationship ? 'Committed' : 'Single'),
      sanitizeCsvCell(s.has_crush ? 'Yes' : 'No'),
      sanitizeCsvCell(s.crush_name || ''),
      sanitizeCsvCell(s.crush_id_or_number || ''),
      sanitizeCsvCell(s.crush_duration || ''),
      sanitizeCsvCell(s.comments || ''),
      sanitizeCsvCell(s.notify_when_single ? s.notification_channel : 'No'),
      sanitizeCsvCell(s.contact_info || ''),
      sanitizeCsvCell(s.is_confidential ? 'Yes' : 'No')
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `vault_export_sanitized_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Secure CSV exported with formula sanitization! 📊🛡️');
  };

  const handleSendWhatsAppAlert = (item: any) => {
    const contact = (item.contact_info || '').replace(/[^0-9]/g, '');
    const crush = item.crush_name || 'your crush';
    const text = encodeURIComponent(`Hey ${item.name_or_nickname}! 💕 Secret update from feelings vault: We detected that ${crush} is currently Single!`);
    window.open(`https://wa.me/${contact}?text=${text}`, '_blank');
  };

  const handleSendInstagramAlert = (item: any) => {
    const handle = (item.contact_info || item.instagram_id || '').replace(/^@+/, '').trim();
    window.open(`https://ig.me/m/${handle}`, '_blank');
  };

  // Filter & Search Logic
  const filteredSubmissions = submissions
    .filter((item) => {
      if (filter === 'mutual' && !item.isMutualMatch) return false;
      if (filter === 'confidential' && !item.is_confidential) return false;
      if (filter === 'single' && item.has_relationship) return false;
      if (filter === 'starred' && !starredIds.has(item.id)) return false;
      
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase().trim();
        const matchName = item.name_or_nickname?.toLowerCase().includes(term);
        const matchCrush = item.crush_name?.toLowerCase().includes(term);
        const matchIg = item.instagram_id?.toLowerCase().includes(term);
        const matchTarget = item.crush_id_or_number?.toLowerCase().includes(term);
        const matchComment = item.comments?.toLowerCase().includes(term);
        const matchContact = item.contact_info?.toLowerCase().includes(term);
        return matchName || matchCrush || matchIg || matchTarget || matchComment || matchContact;
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      if (sortBy === 'oldest') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      if (sortBy === 'name') return (a.name_or_nickname || '').localeCompare(b.name_or_nickname || '');
      return 0;
    });

  const mutualMatchesCount = submissions.filter(s => s.isMutualMatch).length;
  const singleCount = submissions.filter(s => !s.has_relationship).length;
  const crushCount = submissions.filter(s => s.has_crush).length;

  const formatIdleTime = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins}:${s < 10 ? '0' : ''}${s}`;
  };

  if (!isAuthenticated) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4 bg-black selection:bg-rose-500 selection:text-white">
        <div className="w-full max-w-md glass-card rounded-3xl p-8 backdrop-blur-2xl text-center space-y-6 border border-rose-500/20 shadow-2xl shadow-rose-950/50">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-rose-500/20 to-pink-500/10 border border-rose-500/30 flex items-center justify-center mx-auto text-rose-400 shadow-inner">
            <Lock className="w-8 h-8" />
          </div>

          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-rose-500/10 border border-rose-500/30 text-rose-300 mb-2">
              <ShieldCheck className="w-3.5 h-3.5" /> 256-Bit Encrypted Master Vault
            </span>
            <h1 className="text-2xl font-extrabold text-white">Owner Access Only</h1>
            <p className="text-xs text-pink-200/60 mt-1">
              Protected by HMAC Session Tokens, Anti-Bruteforce & Timing Attack Protection.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter Master Passkey"
                value={passkey}
                disabled={lockoutRemaining > 0}
                onChange={(e) => setPasskey(e.target.value)}
                className="w-full glass-input rounded-xl px-4 py-3 text-sm text-white placeholder-pink-300/40 text-center tracking-widest disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-pink-300/50 hover:text-pink-200"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {lockoutRemaining > 0 && (
              <div className="p-3 bg-red-950/90 border border-red-500/50 rounded-xl text-xs text-red-200 flex flex-col items-center gap-1">
                <div className="flex items-center gap-2 font-bold text-red-300">
                  <AlertOctagon className="w-4 h-4 animate-spin text-red-400" />
                  Anti-Bruteforce Lockout Active
                </div>
                <p className="text-[11px] text-pink-200/80 font-mono font-bold">
                  Next attempt allowed in: {formatIdleTime(lockoutRemaining)}
                </p>
              </div>
            )}

            {errorMsg && lockoutRemaining <= 0 && (
              <p className="text-xs text-rose-400 bg-rose-500/10 py-2.5 px-3 rounded-xl border border-rose-500/30 flex items-center gap-1.5 justify-center">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                {errorMsg}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || lockoutRemaining > 0}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 text-white font-bold text-sm shadow-xl shadow-rose-500/30 flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-60"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> Verifying HMAC Cryptographic Token...
                </>
              ) : (
                <>
                  <KeyRound className="w-4 h-4" /> Unlock Master Vault
                </>
              )}
            </button>
          </form>

          <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-[11px] text-pink-200/60 space-y-1 text-left">
            <p className="flex items-center gap-1.5 font-semibold text-pink-200">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Enterprise Security Features:
            </p>
            <p>• Short-lived HMAC-SHA256 session tokenization</p>
            <p>• 15-Minute auto-lock on inactivity</p>
            <p>• IP rate limiter: 5 attempts triggers 15 min lock</p>
            <p>• Constant-time cryptographic password comparison</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen py-6 px-4 sm:px-8 max-w-7xl mx-auto space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 py-3 px-5 rounded-2xl bg-emerald-950/95 border border-emerald-500/50 text-emerald-200 text-xs font-semibold shadow-2xl backdrop-blur-xl flex items-center gap-2 animate-bounce">
          <CheckCheck className="w-4 h-4 text-emerald-400" />
          {toastMessage}
        </div>
      )}

      {/* RLS Warning Box */}
      {rlsWarning && (
        <div className="p-4 bg-rose-950/80 border border-rose-500/50 rounded-2xl text-xs text-rose-200 space-y-2">
          <p className="font-bold flex items-center gap-2 text-rose-300">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            Supabase Delete Permission Required
          </p>
          <p className="text-[11px] text-pink-200/80">
            Supabase Row Level Security (RLS) is blocking delete queries. Run this SQL in your Supabase SQL Editor:
          </p>
          <code className="block p-2 rounded bg-black/60 font-mono text-[11px] text-emerald-300 select-all">
            CREATE POLICY &quot;Allow delete for all&quot; ON public.crush_submissions FOR DELETE TO anon, authenticated USING (true);
          </code>
        </div>
      )}

      {/* ENTERPRISE SECURITY CONTROL BAR */}
      <div className="p-3.5 rounded-2xl bg-gradient-to-r from-rose-950/60 via-purple-950/40 to-black border border-rose-500/30 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-bold">
            <ShieldCheck className="w-4 h-4 text-emerald-400" /> HMAC-SHA256 Active
          </span>

          <span className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/10 border border-white/10 text-pink-200/80 font-mono">
            <Clock className="w-3.5 h-3.5 text-rose-400" />
            Auto-Locks in: <strong className="text-white font-bold">{formatIdleTime(idleSecondsRemaining)}</strong>
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Privacy Camouflage Mode Toggle */}
          <button
            onClick={() => {
              setPrivacyMasked(!privacyMasked);
              showToast(privacyMasked ? 'Privacy Shield Disabled (Revealed)' : 'Privacy Shield Enabled (Masked)');
            }}
            className={`py-1.5 px-3 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all ${
              privacyMasked 
                ? 'bg-rose-500/20 border-rose-500/40 text-rose-300 hover:bg-rose-500/30' 
                : 'bg-amber-500/20 border-amber-500/40 text-amber-300 hover:bg-amber-500/30'
            }`}
            title="Toggle Privacy Camouflage (Shoulder Surfing Protection)"
          >
            {privacyMasked ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            Privacy Shield: {privacyMasked ? 'ON (Masked)' : 'OFF (Visible)'}
          </button>

          {/* Audit Logs Viewer */}
          <button
            onClick={() => {
              refreshAuditLogs();
              setShowAuditModal(true);
            }}
            className="py-1.5 px-3 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 text-xs font-semibold text-purple-200 flex items-center gap-1.5 transition-all"
            title="View Real-Time Security Audit Trail"
          >
            <History className="w-3.5 h-3.5 text-purple-400" /> Audit Trail ({auditLogs.length})
          </button>

          {/* Emergency Panic Lock */}
          <button
            onClick={() => handlePanicLock('🚨 Emergency Panic Lock Triggered! All session memory & cached data wiped.')}
            className="py-1.5 px-3 rounded-xl bg-red-600 hover:bg-red-700 text-white border border-red-500 text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-red-600/30 active:scale-95 transition-all"
            title="Instantly Wipe Memory & Lock Down Dashboard"
          >
            <AlertOctagon className="w-3.5 h-3.5" /> Panic Lock 🚨
          </button>
        </div>
      </div>

      {/* Top Navigation Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 glass-card p-6 rounded-3xl border border-rose-500/20">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-500 to-pink-500 flex items-center justify-center text-white shadow-lg shadow-rose-500/30">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              Master Confession Vault <span className="text-xs px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 font-normal">Encrypted Vault</span>
            </h1>
            <p className="text-xs text-pink-200/60">
              Only You Can View Submissions • Total Records: {submissions.length}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-white/5 border border-white/10 p-1 rounded-xl">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg text-xs font-medium transition-all ${
                viewMode === 'grid' ? 'bg-rose-500 text-white shadow' : 'text-pink-200/60 hover:text-white'
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg text-xs font-medium transition-all ${
                viewMode === 'table' ? 'bg-rose-500 text-white shadow' : 'text-pink-200/60 hover:text-white'
              }`}
              title="Table View"
            >
              <TableIcon className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => fetchSubmissionsWithCredentials({ passkey, sessionToken: sessionToken || undefined })}
            disabled={loading}
            className="py-2 px-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-xs font-semibold text-white flex items-center gap-1.5 transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
          
          <button
            onClick={handleExportCSV}
            className="py-2 px-3 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 text-xs font-semibold text-emerald-300 flex items-center gap-1.5 transition-all"
            title="Download CSV sanitized against spreadsheet formula injection"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" /> Export Safe CSV
          </button>

          <button
            onClick={() => setShowPurgeModal(true)}
            className="py-2 px-3 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/30 text-xs font-semibold text-rose-300 flex items-center gap-1.5 transition-all"
            title="Wipe all database records"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-400" /> Purge DB
          </button>

          <button
            onClick={() => handlePanicLock('Vault session locked successfully.')}
            className="py-2 px-3 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/30 text-xs font-semibold text-rose-300 flex items-center gap-1.5 transition-all"
          >
            <LogOut className="w-3.5 h-3.5" /> Lock
          </button>
        </div>
      </div>

      {/* Prominent Global Search Bar */}
      <div className="glass-card p-4 rounded-2xl border border-rose-500/30 bg-black/40 space-y-3">
        <div className="relative flex items-center">
          <Search className="w-5 h-5 text-rose-400 absolute left-4" />
          <input
            type="text"
            placeholder="Search by Submitter Name, Instagram ID, Crush Name, Crush IG, Confession message, Phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full glass-input rounded-2xl pl-12 pr-10 py-3.5 text-sm text-white placeholder-pink-300/40 border border-white/15 focus:border-rose-400"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3.5 p-1 rounded-full text-pink-300/50 hover:text-white bg-white/10"
              title="Clear Search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Live Search Status */}
        {searchTerm.trim() && (
          <div className="flex items-center justify-between text-xs px-2 text-pink-200/80">
            <span>
              Searching for: <strong className="text-rose-300">&ldquo;{searchTerm}&rdquo;</strong>
            </span>
            <span className="font-bold text-emerald-400">
              Found {filteredSubmissions.length} matching {filteredSubmissions.length === 1 ? 'record' : 'records'}
            </span>
          </div>
        )}
      </div>

      {/* Analytics Counter Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="glass-card p-4 rounded-2xl border border-white/10">
          <p className="text-xs text-pink-300/70">Total Submissions</p>
          <p className="text-2xl font-black text-white mt-1">{submissions.length}</p>
        </div>
        <div className="glass-card p-4 rounded-2xl border border-white/10">
          <p className="text-xs text-pink-300/70">Active Crushes</p>
          <p className="text-2xl font-black text-rose-400 mt-1">{crushCount}</p>
        </div>
        <div className="glass-card p-4 rounded-2xl border border-white/10">
          <p className="text-xs text-pink-300/70">Singles in Vault</p>
          <p className="text-2xl font-black text-pink-300 mt-1">{singleCount}</p>
        </div>
        <div className="glass-card p-4 rounded-2xl border border-rose-500/30 bg-rose-950/20">
          <p className="text-xs text-rose-300 font-semibold flex items-center gap-1">
            <Flame className="w-3.5 h-3.5 text-amber-400" /> Mutual Matches
          </p>
          <p className="text-2xl font-black text-amber-300 mt-1">{mutualMatchesCount}</p>
        </div>
      </div>

      {/* Filter Tabs & Sort Selector */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {[
            { id: 'all', label: 'All Responses' },
            { id: 'mutual', label: '🔥 Mutual Matches' },
            { id: 'single', label: '🥀 Single Users' },
            { id: 'starred', label: '⭐ Starred' },
            { id: 'confidential', label: '🔒 Confidential' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id as any)}
              className={`py-2 px-3.5 rounded-xl text-xs font-bold border whitespace-nowrap transition-all ${
                filter === tab.id
                  ? 'bg-gradient-to-r from-rose-500 to-pink-600 text-white border-rose-400 shadow-md shadow-rose-500/25'
                  : 'bg-white/5 border-white/10 text-pink-200/70 hover:bg-white/10'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <span className="text-xs text-pink-300/60 whitespace-nowrap">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="glass-input rounded-xl px-3 py-2 text-xs text-pink-200 bg-black/40 border border-white/15"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="name">Submitter Name</option>
          </select>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="text-center py-20 text-pink-200/60 text-sm flex items-center justify-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin text-rose-400" /> Decrypting vault data...
        </div>
      ) : filteredSubmissions.length === 0 ? (
        <div className="text-center py-20 glass-card rounded-3xl text-pink-200/60 text-sm">
          No records found matching your filter or search query.
        </div>
      ) : viewMode === 'grid' ? (
        /* GRID CARDS VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSubmissions.map((item) => {
            const isItemMasked = privacyMasked && !unmaskedItemIds.has(item.id);
            return (
              <div
                key={item.id}
                className={`glass-card rounded-2xl p-5 space-y-4 border transition-all relative overflow-hidden ${
                  item.isMutualMatch 
                    ? 'border-amber-400/50 bg-gradient-to-b from-amber-950/25 to-black shadow-lg shadow-amber-500/10' 
                    : 'border-white/10'
                }`}
              >
                {/* Mutual Match Banner */}
                {item.isMutualMatch && (
                  <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-black font-extrabold text-[11px] py-1 px-3 -mx-5 -mt-5 mb-3 flex items-center justify-center gap-1.5 shadow-md">
                    <Flame className="w-3.5 h-3.5 fill-current" /> 🔥 MUTUAL MATCH DETECTED! Both have a crush on each other!
                  </div>
                )}

                {/* Status Header & Action Controls */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                        item.is_confidential
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}
                    >
                      {item.is_confidential ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                      {item.is_confidential ? '100% Confidential' : 'Public'}
                    </span>

                    {/* Star Button */}
                    <button
                      onClick={() => toggleStar(item.id)}
                      className={`p-1 rounded-lg transition-all ${
                        starredIds.has(item.id) ? 'text-amber-400 scale-110' : 'text-pink-300/30 hover:text-amber-300'
                      }`}
                      title="Star Confession"
                    >
                      <Star className={`w-4 h-4 ${starredIds.has(item.id) ? 'fill-current' : ''}`} />
                    </button>

                    {/* Individual Privacy Reveal Button */}
                    {privacyMasked && (
                      <button
                        onClick={() => toggleItemPrivacy(item.id)}
                        className={`p-1 rounded-lg transition-all ${
                          unmaskedItemIds.has(item.id) ? 'text-rose-400 bg-rose-500/20' : 'text-pink-300/40 hover:text-white'
                        }`}
                        title={unmaskedItemIds.has(item.id) ? 'Mask Details' : 'Reveal Details'}
                      >
                        {unmaskedItemIds.has(item.id) ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-pink-200/40">
                      {new Date(item.created_at).toLocaleDateString()}
                    </span>

                    {/* Delete Button with Inline Confirmation */}
                    {deleteConfirmId === item.id ? (
                      <div className="flex items-center gap-1.5 bg-red-950 border border-red-500/50 px-2.5 py-1 rounded-xl text-[11px] shadow-lg">
                        <span className="text-red-300 font-bold">Delete?</span>
                        <button
                          onClick={() => handleDeleteSubmission(item.id)}
                          disabled={deletingId === item.id}
                          className="text-white bg-red-600 px-2 py-0.5 rounded font-extrabold hover:bg-red-700 transition-all"
                        >
                          {deletingId === item.id ? '...' : 'Yes'}
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(null)}
                          className="text-pink-300 hover:text-white px-1"
                        >
                          No
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeleteConfirmId(item.id)}
                        className="p-1.5 rounded-lg text-pink-300/40 hover:text-rose-400 hover:bg-rose-500/15 transition-all"
                        title="Permanently Delete Record"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Submitter Info */}
                <div>
                  <p className="text-[11px] text-pink-300/60 uppercase tracking-wider font-semibold">Submitter</p>
                  <div className="flex items-center justify-between mt-0.5">
                    <h3 className="text-base font-bold text-white flex items-center gap-1.5">
                      <User className="w-4 h-4 text-rose-400" />
                      {maskSensitive(item.name_or_nickname, isItemMasked)}
                    </h3>
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                      item.has_relationship ? 'bg-purple-500/20 text-purple-300' : 'bg-emerald-500/20 text-emerald-300'
                    }`}>
                      {item.has_relationship ? 'Committed 💑' : 'Single 🥀'}
                    </span>
                  </div>

                  {item.instagram_id && (
                    <a
                      href={isItemMasked ? '#' : `https://instagram.com/${item.instagram_id.replace(/^@/, '')}`}
                      target={isItemMasked ? '_self' : '_blank'}
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-rose-300 hover:text-rose-200 mt-1 underline"
                    >
                      <InstagramIcon className="w-3.5 h-3.5" /> @{maskSensitive(item.instagram_id.replace(/^@/, ''), isItemMasked)}
                      {!isItemMasked && <ExternalLink className="w-3 h-3" />}
                    </a>
                  )}
                </div>

                {/* Target Crush Match Details */}
                <div className="p-3 bg-white/5 rounded-xl space-y-2 text-xs border border-white/5">
                  <div className="flex items-center justify-between">
                    <span className="text-pink-300/70">Has Crush:</span>
                    <span className="font-bold text-white">
                      {item.has_crush ? 'Yes 😍' : 'No 🙅‍♂️'}
                    </span>
                  </div>

                  {item.has_crush && (
                    <div className="space-y-1.5 pt-1.5 border-t border-white/10">
                      <div className="flex items-center justify-between">
                        <span className="text-rose-300 font-semibold">Crush Name:</span>
                        <span className="font-bold text-rose-200">
                          {maskSensitive(item.crush_name, isItemMasked)}
                        </span>
                      </div>

                      {/* Crush Instagram Handle */}
                      {(item.crush_id_or_number || item.crush_name) && (
                        <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-[11px]">
                          <p className="text-rose-300 font-bold flex items-center gap-1">
                            <Target className="w-3.5 h-3.5" /> Target Crush Instagram:
                          </p>
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-white font-mono font-bold">
                              {maskSensitive(item.crush_id_or_number || item.crush_name, isItemMasked)}
                            </span>
                            {item.crush_id_or_number && !isItemMasked && (
                              <a
                                href={`https://instagram.com/${item.crush_id_or_number.replace(/^@/, '').replace(/[[\]]/g, '').trim()}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[10px] text-rose-300 hover:text-white underline flex items-center gap-0.5"
                              >
                                Open IG <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            )}
                          </div>
                        </div>
                      )}

                      {item.crush_duration && (
                        <div className="flex items-center justify-between pt-0.5">
                          <span className="text-pink-300/70">Duration:</span>
                          <span className="text-white">{item.crush_duration}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Compulsory Confession Box */}
                {item.comments && (
                  <div>
                    <p className="text-[11px] text-pink-300/60 mb-1 font-semibold">Secret Confession:</p>
                    <p className="text-xs bg-black/40 p-3 rounded-xl text-pink-100 italic border border-white/5 leading-relaxed">
                      &ldquo;{isItemMasked ? '•••••••••••••••••••••••••••• (Confession masked under Privacy Shield)' : item.comments}&rdquo;
                    </p>
                  </div>
                )}

                {/* Notification Destination & 1-Click Alert Button */}
                {item.notify_when_single && (
                  <div className="p-2.5 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-xs flex flex-col gap-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-1.5">
                        <Bell className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold text-emerald-300 text-[11px]">Alert destination:</p>
                          <p className="text-white font-mono text-[11px]">
                            {item.notification_channel}: {maskSensitive(item.contact_info, isItemMasked)}
                          </p>
                        </div>
                      </div>

                      {item.notification_channel === 'whatsapp' && item.contact_info && (
                        <button
                          onClick={() => handleSendWhatsAppAlert(item)}
                          className="py-1 px-2.5 rounded-lg bg-emerald-500/30 hover:bg-emerald-500/50 border border-emerald-400/40 text-[10px] font-bold text-emerald-200 flex items-center gap-1 transition-all"
                        >
                          <MessageCircle className="w-3 h-3" /> Ping WA
                        </button>
                      )}

                      {item.notification_channel === 'instagram' && (item.contact_info || item.instagram_id) && (
                        <button
                          onClick={() => handleSendInstagramAlert(item)}
                          className="py-1 px-2.5 rounded-lg bg-rose-500/30 hover:bg-rose-500/50 border border-rose-400/40 text-[10px] font-bold text-rose-200 flex items-center gap-1 transition-all"
                        >
                          <InstagramIcon className="w-3 h-3" /> DM on IG
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* DENSE TABLE VIEW */
        <div className="glass-card rounded-2xl overflow-hidden border border-white/10">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-pink-200/80">
              <thead className="bg-white/5 border-b border-white/10 text-pink-100 font-bold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="p-3.5">Submitter</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Target Crush</th>
                  <th className="p-3.5">Crush IG</th>
                  <th className="p-3.5">Secret Confession</th>
                  <th className="p-3.5">Notification</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredSubmissions.map((item) => {
                  const isItemMasked = privacyMasked && !unmaskedItemIds.has(item.id);
                  return (
                    <tr key={item.id} className="hover:bg-white/5 transition-all">
                      <td className="p-3.5 font-bold text-white whitespace-nowrap">
                        {maskSensitive(item.name_or_nickname, isItemMasked)}
                        {item.instagram_id && (
                          <p className="text-[11px] text-rose-300 font-normal">
                            @{maskSensitive(item.instagram_id, isItemMasked)}
                          </p>
                        )}
                      </td>
                      <td className="p-3.5 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          item.has_relationship ? 'bg-purple-500/20 text-purple-300' : 'bg-emerald-500/20 text-emerald-300'
                        }`}>
                          {item.has_relationship ? 'Committed' : 'Single'}
                        </span>
                      </td>
                      <td className="p-3.5 font-semibold text-rose-200 whitespace-nowrap">
                        {item.has_crush ? maskSensitive(item.crush_name, isItemMasked) : 'No Crush'}
                      </td>
                      <td className="p-3.5 font-mono text-pink-300 whitespace-nowrap">
                        {maskSensitive(item.crush_id_or_number || '-', isItemMasked)}
                      </td>
                      <td className="p-3.5 max-w-xs truncate italic text-pink-100/90" title={item.comments}>
                        &ldquo;{isItemMasked ? '••••••••••' : item.comments}&rdquo;
                      </td>
                      <td className="p-3.5 font-mono text-[11px] text-emerald-300 whitespace-nowrap">
                        {item.notify_when_single ? `${item.notification_channel}: ${maskSensitive(item.contact_info, isItemMasked)}` : 'No'}
                      </td>
                      <td className="p-3.5 text-right whitespace-nowrap space-x-1">
                        {privacyMasked && (
                          <button
                            onClick={() => toggleItemPrivacy(item.id)}
                            className="p-1.5 rounded-lg text-pink-300/40 hover:text-white"
                            title="Toggle Mask"
                          >
                            {unmaskedItemIds.has(item.id) ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteSubmission(item.id)}
                          disabled={deletingId === item.id}
                          className="p-1.5 rounded-lg text-pink-300/40 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SECURITY AUDIT LOGS MODAL */}
      {showAuditModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-3xl glass-card rounded-3xl p-6 border border-purple-500/30 space-y-4 shadow-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-purple-400" />
                <h2 className="text-base font-bold text-white">Live Cryptographic Audit Trail</h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={refreshAuditLogs}
                  className="py-1 px-2.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs text-white flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" /> Refresh Logs
                </button>
                <button
                  onClick={() => setShowAuditModal(false)}
                  className="p-1.5 rounded-full hover:bg-white/10 text-pink-300/60 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <p className="text-xs text-pink-200/70">
              Captures all authentication requests, vault access, record deletions, rate limits, and brute-force blockades in real-time.
            </p>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {auditLogs.length === 0 ? (
                <div className="text-center py-12 text-pink-200/40 text-xs">
                  No security events recorded in this session.
                </div>
              ) : (
                auditLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-3 rounded-xl bg-white/5 border border-white/5 text-xs flex items-center justify-between gap-3 hover:bg-white/10 transition-all"
                  >
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          log.status === 'SUCCESS' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                          log.status === 'BLOCKED' ? 'bg-red-500/20 text-red-300 border border-red-500/30' :
                          'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}>
                          {log.status}
                        </span>
                        <span className="font-mono text-[11px] font-bold text-purple-300">
                          {log.event}
                        </span>
                        <span className="text-[10px] text-pink-200/40 font-mono">
                          IP: {log.ip}
                        </span>
                      </div>
                      <p className="text-pink-100 text-[11px] truncate">
                        {log.details}
                      </p>
                    </div>

                    <span className="text-[10px] text-pink-200/40 whitespace-nowrap font-mono">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* DANGEROUS PURGE DATABASE MODAL */}
      {showPurgeModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md glass-card rounded-3xl p-6 border border-red-500/50 space-y-4 shadow-2xl text-center">
            <div className="w-12 h-12 rounded-2xl bg-red-500/20 border border-red-500/40 text-red-400 flex items-center justify-center mx-auto">
              <AlertOctagon className="w-6 h-6" />
            </div>

            <div>
              <h2 className="text-lg font-black text-white">Emergency Database Wipe</h2>
              <p className="text-xs text-rose-200/70 mt-1">
                This will permanently delete all {submissions.length} confessions from the database. This action CANNOT be undone.
              </p>
            </div>

            <div className="space-y-2 text-left">
              <label className="text-[11px] text-pink-200 font-semibold block">
                Type <span className="font-mono text-rose-400 font-bold">CONFIRM PURGE</span> to authorize:
              </label>
              <input
                type="text"
                placeholder="CONFIRM PURGE"
                value={purgeConfirmText}
                onChange={(e) => setPurgeConfirmText(e.target.value)}
                className="w-full glass-input rounded-xl px-3 py-2.5 text-xs text-white text-center font-mono border-red-500/40"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowPurgeModal(false);
                  setPurgeConfirmText('');
                }}
                className="w-1/2 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-semibold text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleBulkPurge}
                disabled={purgeConfirmText !== 'CONFIRM PURGE' || loading}
                className="w-1/2 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-xs font-bold text-white disabled:opacity-40 transition-all shadow-lg shadow-red-600/40"
              >
                {loading ? 'Purging...' : 'Execute Wipe'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
