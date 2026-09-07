'use client';

import React, { useState } from 'react';
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
  X
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

export default function AdminDashboard() {
  const [passkey, setPasskey] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  
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

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passkey.trim()) {
      setErrorMsg('Please enter your master vault passkey.');
      return;
    }
    setErrorMsg('');
    await fetchSubmissionsWithPasskey(passkey);
  };

  const fetchSubmissionsWithPasskey = async (key: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passkey: key }),
      });

      const result = await res.json();

      if (!res.ok) {
        setErrorMsg(result.error || 'Authentication failed. Access denied.');
        setIsAuthenticated(false);
      } else {
        setSubmissions(result.submissions || []);
        setIsAuthenticated(true);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Secure connection failed.');
    } finally {
      setLoading(false);
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
        body: JSON.stringify({ passkey, id }),
      });

      const result = await res.json();
      if (res.ok && result.success) {
        setSubmissions((prev) => prev.filter((item) => item.id !== id));
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

  const handleExportCSV = () => {
    if (submissions.length === 0) return;
    const headers = ['Date', 'Name', 'Submitter_IG', 'Status', 'Has_Crush', 'Crush_Name', 'Crush_IG', 'Duration', 'Confession', 'Notification', 'Contact', 'Confidential'];
    const rows = submissions.map(s => [
      new Date(s.created_at).toISOString(),
      `"${s.name_or_nickname || ''}"`,
      s.instagram_id || '',
      s.has_relationship ? 'Committed' : 'Single',
      s.has_crush ? 'Yes' : 'No',
      `"${s.crush_name || ''}"`,
      `"${s.crush_id_or_number || ''}"`,
      s.crush_duration || '',
      `"${(s.comments || '').replace(/"/g, '""')}"`,
      s.notify_when_single ? s.notification_channel : 'No',
      `"${s.contact_info || ''}"`,
      s.is_confidential ? 'Yes' : 'No'
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `vault_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('CSV export downloaded successfully! 📊');
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
              Protected by Anti-Bruteforce & Cryptographic Verification.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter Master Passkey"
                value={passkey}
                onChange={(e) => setPasskey(e.target.value)}
                className="w-full glass-input rounded-xl px-4 py-3 text-sm text-white placeholder-pink-300/40 text-center tracking-widest"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-pink-300/50 hover:text-pink-200"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {errorMsg && (
              <p className="text-xs text-rose-400 bg-rose-500/10 py-2.5 px-3 rounded-xl border border-rose-500/30 flex items-center gap-1.5 justify-center">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                {errorMsg}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 text-white font-bold text-sm shadow-xl shadow-rose-500/30 flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-60"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> Verifying Security Token...
                </>
              ) : (
                <>
                  <KeyRound className="w-4 h-4" /> Unlock Master Vault
                </>
              )}
            </button>
          </form>

          <p className="text-[11px] text-pink-300/40">
            🔒 IP Rate Limiter Active • 5 Failed Attempts = 15 Min Lockout
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen py-8 px-4 sm:px-8 max-w-7xl mx-auto space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 py-3 px-5 rounded-2xl bg-emerald-950/90 border border-emerald-500/40 text-emerald-200 text-xs font-semibold shadow-2xl backdrop-blur-xl flex items-center gap-2 animate-bounce">
          <CheckCheck className="w-4 h-4 text-emerald-400" />
          {toastMessage}
        </div>
      )}

      {/* RLS Warning Box if Delete is blocked by Supabase Policy */}
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

      {/* Top Navigation Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 glass-card p-6 rounded-3xl border border-rose-500/20">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-500 to-pink-500 flex items-center justify-center text-white shadow-lg shadow-rose-500/30">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              Master Confession Vault <span className="text-xs px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 font-normal">Encrypted Session</span>
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
            onClick={() => fetchSubmissionsWithPasskey(passkey)}
            disabled={loading}
            className="py-2 px-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-xs font-semibold text-white flex items-center gap-1.5 transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
          
          <button
            onClick={handleExportCSV}
            className="py-2 px-3 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 text-xs font-semibold text-emerald-300 flex items-center gap-1.5 transition-all"
          >
            <Download className="w-3.5 h-3.5" /> CSV
          </button>

          <button
            onClick={() => {
              setIsAuthenticated(false);
              setPasskey('');
            }}
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
          {filteredSubmissions.map((item) => (
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
                    {item.name_or_nickname}
                  </h3>
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                    item.has_relationship ? 'bg-purple-500/20 text-purple-300' : 'bg-emerald-500/20 text-emerald-300'
                  }`}>
                    {item.has_relationship ? 'Committed 💑' : 'Single 🥀'}
                  </span>
                </div>

                {item.instagram_id && (
                  <a
                    href={`https://instagram.com/${item.instagram_id.replace(/^@/, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-rose-300 hover:text-rose-200 mt-1 underline"
                  >
                    <InstagramIcon className="w-3.5 h-3.5" /> @{item.instagram_id.replace(/^@/, '')}
                    <ExternalLink className="w-3 h-3" />
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
                      <span className="font-bold text-rose-200">{item.crush_name}</span>
                    </div>

                    {/* Crush Instagram Handle */}
                    {(item.crush_id_or_number || item.crush_name) && (
                      <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-[11px]">
                        <p className="text-rose-300 font-bold flex items-center gap-1">
                          <Target className="w-3.5 h-3.5" /> Target Crush Instagram:
                        </p>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-white font-mono font-bold">
                            {item.crush_id_or_number || item.crush_name}
                          </span>
                          {item.crush_id_or_number && (
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
                    &ldquo;{item.comments}&rdquo;
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
                          {item.notification_channel}: {item.contact_info}
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
          ))}
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
                {filteredSubmissions.map((item) => (
                  <tr key={item.id} className="hover:bg-white/5 transition-all">
                    <td className="p-3.5 font-bold text-white whitespace-nowrap">
                      {item.name_or_nickname}
                      {item.instagram_id && (
                        <p className="text-[11px] text-rose-300 font-normal">@{item.instagram_id}</p>
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
                      {item.has_crush ? item.crush_name : 'No Crush'}
                    </td>
                    <td className="p-3.5 font-mono text-pink-300 whitespace-nowrap">
                      {item.crush_id_or_number || '-'}
                    </td>
                    <td className="p-3.5 max-w-xs truncate italic text-pink-100/90" title={item.comments}>
                      &ldquo;{item.comments}&rdquo;
                    </td>
                    <td className="p-3.5 font-mono text-[11px] text-emerald-300 whitespace-nowrap">
                      {item.notify_when_single ? `${item.notification_channel}: ${item.contact_info}` : 'No'}
                    </td>
                    <td className="p-3.5 text-right whitespace-nowrap">
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
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </main>
  );
}
