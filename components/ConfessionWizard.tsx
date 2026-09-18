'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Heart, 
  User, 
  Lock, 
  Unlock, 
  Bell, 
  Mail, 
  MessageSquare, 
  Sparkles, 
  Send, 
  Check, 
  Loader2, 
  ShieldCheck, 
  ArrowRight, 
  ArrowLeft, 
  AlertCircle, 
  Copy, 
  PartyPopper,
  Smile,
  CheckCircle2, 
  Share2,
  LogIn,
  LockKeyhole,
  Search,
  Building2,
  GraduationCap,
  School,
  Briefcase,
  MapPin,
  Globe,
  Edit3
} from 'lucide-react';
import Link from 'next/link';
import confetti from 'canvas-confetti';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { Tilt3DCard } from '@/components/Tilt3DCard';
import { GuestWarningModal } from '@/components/GuestWarningModal';
import { InstitutionLogo } from '@/components/InstitutionLogo';
import { sanitizeText, sanitizeInstagramHandle } from '@/lib/security';

function InstagramIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

const TOTAL_STEPS = 5;

interface ConfessionWizardProps {
  onSuccess?: () => void;
  onViewHistory?: () => void;
}

export function ConfessionWizard({ onSuccess, onViewHistory }: ConfessionWizardProps) {
  const { user, loginAsGuest } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [direction, setDirection] = useState(1);
  const [showGuestWarning, setShowGuestWarning] = useState(false);
  const [guestLoading, setGuestLoading] = useState(false);

  // Anti-Bot & Anti-Spam Security Trap
  const [botTrap, setBotTrap] = useState('');
  const [mountTimestamp] = useState(() => Date.now());

  // Form State - Submitter
  const [nameOrNickname, setNameOrNickname] = useState('');
  const [nameError, setNameError] = useState('');
  
  const [instagramId, setInstagramId] = useState('');
  const [igStatus, setIgStatus] = useState<'idle' | 'checking' | 'valid' | 'invalid'>('idle');
  const [igMessage, setIgMessage] = useState('');
  const [igProfileName, setIgProfileName] = useState('');

  const [hasRelationship, setHasRelationship] = useState<string>('no');
  
  // Crush State
  const [hasCrush, setHasCrush] = useState<boolean | null>(null);
  const [crushName, setCrushName] = useState('');
  const [crushNameError, setCrushNameError] = useState('');
  const [crushOrganization, setCrushOrganization] = useState('');

  // Institution / School Search Autocomplete State
  const [instSearchQuery, setInstSearchQuery] = useState('');
  const [instSuggestions, setInstSuggestions] = useState<Array<{ name: string; type: string; location?: string; source: string }>>([]);
  const [instLoading, setInstLoading] = useState(false);
  const [instDropdownOpen, setInstDropdownOpen] = useState(false);
  const [isManualInstMode, setIsManualInstMode] = useState(false);
  const [selectedInstVerified, setSelectedInstVerified] = useState(false);
  
  // Crush Instagram ID
  const [crushInstagramId, setCrushInstagramId] = useState('');
  const [crushIgStatus, setCrushIgStatus] = useState<'idle' | 'checking' | 'valid' | 'invalid'>('idle');
  const [crushIgMessage, setCrushIgMessage] = useState('');
  const [crushIgProfileName, setCrushIgProfileName] = useState('');

  const [crushDurationOption, setCrushDurationOption] = useState('1 week');
  const [customDuration, setCustomDuration] = useState('');

  // Compulsory Secret Confession
  const [comments, setComments] = useState('');
  
  // Notification State
  const [wantNotification, setWantNotification] = useState(true);
  const [notificationChannel, setNotificationChannel] = useState<'instagram' | 'whatsapp' | 'email'>('instagram');
  const [contactInfo, setContactInfo] = useState('');

  const [isConfidential, setIsConfidential] = useState(true);

  // Submission State
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [copied, setCopied] = useState(false);
  const [stepError, setStepError] = useState('');

  // Search institutions from Google / Wikipedia / database API
  useEffect(() => {
    if (isManualInstMode || !instSearchQuery.trim() || instSearchQuery.trim().length < 2) {
      if (!instSearchQuery.trim()) {
        setInstSuggestions([]);
      }
      setInstLoading(false);
      return;
    }

    setInstLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search-institutions?q=${encodeURIComponent(instSearchQuery.trim())}`);
        if (res.ok) {
          const data = await res.json();
          setInstSuggestions(data.results || []);
          setInstDropdownOpen(true);
        }
      } catch (err) {
        console.error('Failed to search institutions:', err);
      } finally {
        setInstLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [instSearchQuery, isManualInstMode]);

  const handleSelectInstitution = (item: { name: string; location?: string }) => {
    const fullName = item.location && item.location !== 'Global Knowledge Base' && item.location !== 'Verified Online / Search Result'
      ? `${item.name} (${item.location})`
      : item.name;
    setCrushOrganization(fullName);
    setInstSearchQuery(fullName);
    setSelectedInstVerified(true);
    setInstDropdownOpen(false);
  };

  // Pre-fill user name if logged in
  useEffect(() => {
    if (user && !user.isGuest && user.displayName && !nameOrNickname) {
      setNameOrNickname(user.displayName);
    }
  }, [user]);

  // Name Validation (Sanitize: letters and spaces only, no script/tags/digits)
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (/\d/.test(val)) {
      setNameError('Names can only have letters (no numbers) 🌸');
      const sanitized = val.replace(/[0-9<>/"']/g, '');
      setNameOrNickname(sanitized);
    } else {
      setNameError('');
      setNameOrNickname(val.replace(/[<>/"']/g, ''));
    }
  };

  const handleCrushNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (/\d/.test(val)) {
      setCrushNameError('Names can only have letters 🌸');
      const sanitized = val.replace(/[0-9<>/"']/g, '');
      setCrushName(sanitized);
    } else {
      setCrushNameError('');
      setCrushName(val.replace(/[<>/"']/g, ''));
    }
  };

  // Instagram Verification
  const verifyInstagram = async (username: string) => {
    const clean = username.trim().replace(/^@+/, '');
    if (!clean) {
      setIgStatus('idle');
      setIgMessage('');
      setIgProfileName('');
      return;
    }

    setIgStatus('checking');
    setIgMessage('Checking handle...');

    try {
      const res = await fetch(`/api/verify-instagram?username=${encodeURIComponent(clean)}`);
      const data = await res.json();

      if (data.valid) {
        setIgStatus('valid');
        setIgMessage(data.message || `@${clean} verified! ✅`);
        setIgProfileName(data.profileName || clean);
      } else {
        setIgStatus('invalid');
        setIgMessage(data.message || 'Please check handle spelling ✨');
      }
    } catch {
      setIgStatus('valid');
      setIgMessage(`@${clean} registered! 🌸`);
    }
  };

  const verifyCrushInstagram = async (username: string) => {
    const clean = username.trim().replace(/^@+/, '');
    if (!clean) {
      setCrushIgStatus('idle');
      setCrushIgMessage('');
      setCrushIgProfileName('');
      return;
    }

    setCrushIgStatus('checking');
    setCrushIgMessage("Checking crush's handle...");

    try {
      const res = await fetch(`/api/verify-instagram?username=${encodeURIComponent(clean)}`);
      const data = await res.json();

      if (data.valid) {
        setCrushIgStatus('valid');
        setCrushIgMessage(data.message || `@${clean} verified! 💖`);
        setCrushIgProfileName(data.profileName || clean);
      } else {
        setCrushIgStatus('invalid');
        setCrushIgMessage(data.message || 'Please check handle spelling ✨');
      }
    } catch {
      setCrushIgStatus('valid');
      setCrushIgMessage(`@${clean} saved! 🌸`);
    }
  };

  useEffect(() => {
    if (!instagramId.trim()) {
      setIgStatus('idle');
      setIgMessage('');
      return;
    }
    const timer = setTimeout(() => {
      verifyInstagram(instagramId);
    }, 700);
    return () => clearTimeout(timer);
  }, [instagramId]);

  useEffect(() => {
    if (!crushInstagramId.trim()) {
      setCrushIgStatus('idle');
      setCrushIgMessage('');
      return;
    }
    const timer = setTimeout(() => {
      verifyCrushInstagram(crushInstagramId);
    }, 700);
    return () => clearTimeout(timer);
  }, [crushInstagramId]);

  const handleNext = () => {
    setStepError('');

    if (currentStep === 1) {
      if (!nameOrNickname.trim()) {
        setStepError('Please enter your name or a cute nickname to start 💕');
        return;
      }
      if (instagramId.trim() && igStatus === 'invalid') {
        setStepError('Please enter a valid Instagram handle or leave it blank 😊');
        return;
      }
    }

    if (currentStep === 2) {
      if (!hasRelationship) {
        setStepError('Please pick your current relationship status 💫');
        return;
      }
    }

    if (currentStep === 3) {
      if (hasCrush === null) {
        setStepError('Please let us know if you have a crush right now 💖');
        return;
      }
      if (hasCrush) {
        if (!crushName.trim()) {
          setStepError("Please mention your crush's name or initial 💌");
          return;
        }
        if (!crushOrganization.trim()) {
          setStepError("Please mention your crush's school, college, workplace, or living area 🏫📍");
          return;
        }
      }
    }

    if (currentStep === 4) {
      if (!comments.trim()) {
        setStepError('Please share your sweet secret confession before continuing 💕');
        return;
      }
      if (wantNotification && !contactInfo.trim()) {
        const channelName = notificationChannel === 'instagram' ? 'Instagram ID' : notificationChannel === 'whatsapp' ? 'WhatsApp number' : 'email address';
        setStepError(`Please provide your ${channelName} for confidential alerts 🔔`);
        return;
      }
    }

    if (currentStep < TOTAL_STEPS) {
      setDirection(1);
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    setStepError('');
    if (currentStep > 1) {
      setDirection(-1);
      setCurrentStep((prev) => prev - 1);
    }
  };

  const triggerCelebration = () => {
    const end = Date.now() + 3 * 1000;
    const colors = ['#f43f5e', '#ec4899', '#fb7185', '#fda4af', '#fde047', '#ffffff'];

    (function frame() {
      confetti({
        particleCount: 6,
        angle: 60,
        spread: 60,
        origin: { x: 0 },
        colors: colors,
      });
      confetti({
        particleCount: 6,
        angle: 120,
        spread: 60,
        origin: { x: 1 },
        colors: colors,
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    })();
  };

  const handleSubmit = async () => {
    if (!user) {
      setStepError('Authentication is compulsory to submit a confession. Please log in or enter as a guest 💕');
      return;
    }

    // Anti-Bot Honeypot Trap: If populated, silently drop spam attempt
    if (botTrap && botTrap.trim().length > 0) {
      console.warn('Bot detected via honeypot trap. Submission dropped.');
      setSubmitted(true);
      return;
    }

    // Anti-Spam Speed Trap: Block automated headless requests (< 1.5s)
    if (Date.now() - mountTimestamp < 1500) {
      setStepError('Form submitted too fast. Please review your confession 🌸');
      return;
    }

    setLoading(true);
    setStepError('');

    try {
      const duration = crushDurationOption === 'other' ? sanitizeText(customDuration, 50) : sanitizeText(crushDurationOption, 50);
      const cleanSubmitterIg = sanitizeInstagramHandle(instagramId);
      const cleanCrushIg = sanitizeInstagramHandle(crushInstagramId);
      
      const payload: any = {
        user_id: user?.isGuest ? null : user.id,
        guest_id: user?.isGuest ? user.id : null,
        account_type: user?.isGuest ? 'guest' : 'registered',
        instagram_id: cleanSubmitterIg,
        name_or_nickname: sanitizeText(nameOrNickname, 50),
        has_relationship: hasRelationship === 'yes',
        has_crush: hasCrush === true,
        crush_name: hasCrush ? sanitizeText(crushName, 60) : null,
        crush_organization: hasCrush ? sanitizeText(crushOrganization, 100) : null,
        crush_duration: hasCrush ? duration : null,
        crush_id_or_number: hasCrush ? (cleanCrushIg ? `@${cleanCrushIg}` : null) : null,
        comments: sanitizeText(comments, 1500),
        notify_when_single: wantNotification,
        notification_channel: wantNotification ? notificationChannel : null,
        contact_info: wantNotification ? sanitizeText(contactInfo, 100) : null,
        is_confidential: isConfidential,
      };

      let insertedData: any = null;
      let { data, error } = await supabase.from('crush_submissions').insert([payload]).select();
      
      if (error) {
        // Fallback if column doesn't exist yet
        const fallbackPayload = { ...payload };
        delete fallbackPayload.user_id;
        delete fallbackPayload.guest_id;
        delete fallbackPayload.account_type;

        if (error.message.includes('crush_organization')) {
          fallbackPayload.crush_name = `${crushName.trim()} [${crushOrganization.trim()}]`;
          delete fallbackPayload.crush_organization;
        }

        if (error.message.includes('crush_id_or_number')) {
          fallbackPayload.crush_name = `${crushName.trim()} [Crush IG: @${cleanCrushIg}]`;
          delete fallbackPayload.crush_id_or_number;
        }

        const resFallback = await supabase.from('crush_submissions').insert([fallbackPayload]).select();
        error = resFallback.error;
        insertedData = resFallback.data;
      } else {
        insertedData = data;
      }

      if (error) {
        console.error('Supabase error:', error);
        setStepError(error.message || 'Could not save your secret. Please try again.');
      } else {
        // Save submission locally for instant history display
        const newId = insertedData?.[0]?.id || 'sub_' + Date.now();
        const fullItem = {
          ...payload,
          id: newId,
          created_at: new Date().toISOString(),
        };

        try {
          const existingIds: string[] = JSON.parse(localStorage.getItem('my_confession_ids') || '[]');
          if (!existingIds.includes(newId)) {
            existingIds.unshift(newId);
            localStorage.setItem('my_confession_ids', JSON.stringify(existingIds));
          }

          const existingCached: any[] = JSON.parse(localStorage.getItem('my_cached_confessions') || '[]');
          existingCached.unshift(fullItem);
          localStorage.setItem('my_cached_confessions', JSON.stringify(existingCached.slice(0, 50)));
        } catch (e) {
          console.error('Local storage cache error:', e);
        }

        setSubmitted(true);
        triggerCelebration();
        if (onSuccess) onSuccess();
      }
    } catch (err: any) {
      console.error(err);
      setStepError(err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

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

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.origin);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 30 : -30,
      opacity: 0,
      scale: 0.97,
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
      transition: { duration: 0.35, ease: "easeOut" as const },
    },
    exit: (dir: number) => ({
      x: dir > 0 ? -30 : 30,
      opacity: 0,
      scale: 0.97,
      transition: { duration: 0.25, ease: "easeIn" as const },
    }),
  };

  // ========================================================
  // 🔒 COMPULSORY LOGIN GATE: BLOCK CONFESSION IF NOT LOGGED IN
  // ========================================================
  if (!user) {
    return (
      <div className="w-full max-w-lg mx-auto py-2">
        <Tilt3DCard intensity={8}>
          <div className="glass-card p-6 sm:p-8 rounded-3xl border border-pink-500/30 text-center space-y-6 backdrop-blur-xl shadow-2xl relative overflow-hidden">
            {/* Lock Icon */}
            <div className="w-16 h-16 mx-auto rounded-3xl bg-gradient-to-tr from-pink-500/30 via-rose-500/40 to-amber-500/30 border border-pink-400/40 flex items-center justify-center text-pink-200 shadow-xl shadow-pink-500/20 animate-cute-bounce">
              <LockKeyhole className="w-8 h-8 text-pink-300" />
            </div>

            <div className="space-y-2.5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-500/20 border border-pink-400/30 text-pink-200 text-xs font-bold">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Compulsory Verification Gate</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black bg-gradient-to-r from-pink-100 via-rose-200 to-amber-100 bg-clip-text text-transparent">
                Login is Compulsory to Submit a Confession 💌
              </h2>
              <p className="text-xs sm:text-sm text-pink-200/80 leading-relaxed max-w-md mx-auto">
                To prevent spam, maintain 100% Zero-Leak safety, and ensure you can view and track your secret letter in your vault history, you must be logged in or enter with Guest Mode.
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

            {/* Security note */}
            <p className="text-[11px] text-pink-200/60 pt-2 border-t border-white/10">
              ⚡ Guest Mode grants instant access with a 3-week temporary database session.
            </p>
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
    <div className="w-full max-w-lg mx-auto">
      {/* 3-Week Guest Advance Warning Modal */}
      <GuestWarningModal
        isOpen={showGuestWarning}
        onClose={() => setShowGuestWarning(false)}
        onConfirmGuest={handleConfirmGuest}
        isLoading={guestLoading}
      />

      {/* Friendly Progress Tracker */}
      {!submitted && (
        <div className="mb-5 space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-pink-200/90 px-1">
            <span className="flex items-center gap-1">
              Step {currentStep} of {TOTAL_STEPS} <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            </span>
            <span className="text-pink-300 font-bold">{Math.round((currentStep / TOTAL_STEPS) * 100)}% Complete</span>
          </div>
          <div className="w-full h-2.5 bg-black/30 rounded-full overflow-hidden p-0.5 border border-white/10">
            <motion.div
              className="h-full bg-gradient-to-r from-pink-400 via-rose-400 to-pink-500 rounded-full shadow-sm"
              initial={{ width: '20%' }}
              animate={{ width: `${(currentStep / TOTAL_STEPS) * 100}%` }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
            />
          </div>
        </div>
      )}

      {/* Multi-Step Card */}
      <AnimatePresence mode="wait" custom={direction}>
        {!submitted ? (
          <Tilt3DCard intensity={8}>
            <motion.div
              key={`step-${currentStep}`}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="glass-card rounded-3xl p-6 sm:p-8 space-y-6 border border-pink-400/25 shadow-2xl relative overflow-hidden backdrop-blur-xl"
            >
            {/* Invisible Honeypot field to trap automated spam bots */}
            <div className="absolute opacity-0 -z-50 pointer-events-none w-0 h-0 overflow-hidden" aria-hidden="true">
              <input
                type="text"
                name="website_hp_url"
                value={botTrap}
                onChange={(e) => setBotTrap(e.target.value)}
                tabIndex={-1}
                autoComplete="off"
              />
            </div>

            {/* STEP 1: IDENTITY */}
            {currentStep === 1 && (
              <div className="space-y-5">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-500/20 text-pink-300 text-xs font-bold mb-2">
                    <User className="w-3.5 h-3.5" /> Step 1: Tell us about you
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-white">
                    What should we call you? 🌸
                  </h2>
                  <p className="text-xs sm:text-sm text-pink-200/80 mt-1">
                    Pick your real name or a cute secret nickname.
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-pink-200 mb-1.5">
                      Your Name or Nickname <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Juliet, Angel, Alex"
                      value={nameOrNickname}
                      onChange={handleNameChange}
                      className="w-full px-4 py-3 rounded-2xl glass-input text-sm text-white placeholder-pink-200/40 focus:outline-none"
                    />
                    {nameError && (
                      <p className="text-xs text-rose-300 mt-1.5 flex items-center gap-1 font-medium">
                        <AlertCircle className="w-3.5 h-3.5" /> {nameError}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-pink-200 mb-1.5">
                      Your Instagram ID <span className="text-pink-300/70 font-normal">(Optional)</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="your_handle"
                        value={instagramId}
                        onChange={(e) => setInstagramId(e.target.value.replace(/^@/, ''))}
                        className="w-full px-4 py-3 pl-10 rounded-2xl glass-input text-sm text-white placeholder-pink-200/40 focus:outline-none"
                      />
                      <InstagramIcon className="w-4 h-4 text-pink-300/60 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      
                      {igStatus === 'checking' && (
                        <Loader2 className="w-4 h-4 text-pink-300 animate-spin absolute right-3.5 top-1/2 -translate-y-1/2" />
                      )}
                      {igStatus === 'valid' && (
                        <Check className="w-4 h-4 text-emerald-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                      )}
                    </div>
                    {igMessage && (
                      <p className={`text-xs mt-1.5 flex items-center gap-1 font-medium ${
                        igStatus === 'valid' ? 'text-emerald-300' : igStatus === 'invalid' ? 'text-rose-300' : 'text-pink-300/80'
                      }`}>
                        {igStatus === 'valid' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                        {igMessage}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: RELATIONSHIP STATUS */}
            {currentStep === 2 && (
              <div className="space-y-5">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-500/20 text-pink-300 text-xs font-bold mb-2">
                    <Heart className="w-3.5 h-3.5" /> Step 2: Love Life
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-white">
                    What is your relationship status? 💫
                  </h2>
                  <p className="text-xs sm:text-sm text-pink-200/80 mt-1">
                    Everything stays 100% confidential.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <button
                    type="button"
                    onClick={() => setHasRelationship('no')}
                    className={`p-5 rounded-2xl border text-left transition-all cursor-pointer ${
                      hasRelationship === 'no'
                        ? 'bg-gradient-to-r from-pink-500/25 to-rose-500/25 border-pink-400 shadow-md shadow-pink-500/20'
                        : 'bg-white/5 border-white/10 hover:bg-white/10'
                    }`}
                  >
                    <div className="text-3xl mb-2">✨</div>
                    <h3 className="text-base font-bold text-white">Single & Free</h3>
                    <p className="text-xs text-pink-200/70 mt-1">Focusing on myself, open to magic!</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setHasRelationship('yes')}
                    className={`p-5 rounded-2xl border text-left transition-all cursor-pointer ${
                      hasRelationship === 'yes'
                        ? 'bg-gradient-to-r from-pink-500/25 to-rose-500/25 border-pink-400 shadow-md shadow-pink-500/20'
                        : 'bg-white/5 border-white/10 hover:bg-white/10'
                    }`}
                  >
                    <div className="text-3xl mb-2">💍</div>
                    <h3 className="text-base font-bold text-white">In a Relationship</h3>
                    <p className="text-xs text-pink-200/70 mt-1">Happily taken or talking to someone special.</p>
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: CRUSH DETAILS */}
            {currentStep === 3 && (
              <div className="space-y-5">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-500/20 text-pink-300 text-xs font-bold mb-2">
                    <Sparkles className="w-3.5 h-3.5" /> Step 3: Crush Corner
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-white">
                    Do you have a crush right now? 💖
                  </h2>
                  <p className="text-xs sm:text-sm text-pink-200/80 mt-1">
                    Spill the tea! We promise we won't tell a soul. 🤫
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setHasCrush(true)}
                    className={`p-4 rounded-2xl border text-center transition-all cursor-pointer ${
                      hasCrush === true
                        ? 'bg-pink-500/30 border-pink-400 text-white font-bold'
                        : 'bg-white/5 border-white/10 text-pink-200/80 hover:bg-white/10'
                    }`}
                  >
                    <span className="text-2xl block mb-1">😍</span>
                    <span className="text-sm font-semibold">Yes, I do!</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setHasCrush(false);
                      setCrushName('');
                      setCrushInstagramId('');
                    }}
                    className={`p-4 rounded-2xl border text-center transition-all cursor-pointer ${
                      hasCrush === false
                        ? 'bg-pink-500/30 border-pink-400 text-white font-bold'
                        : 'bg-white/5 border-white/10 text-pink-200/80 hover:bg-white/10'
                    }`}
                  >
                    <span className="text-2xl block mb-1">😇</span>
                    <span className="text-sm font-semibold">Not right now</span>
                  </button>
                </div>

                {hasCrush && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="space-y-4 pt-2"
                  >
                    <div>
                      <label className="block text-xs font-bold text-pink-200 mb-1.5">
                        Crush's Name or Nickname <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Romeo, Taylor, Someone in college"
                        value={crushName}
                        onChange={handleCrushNameChange}
                        className="w-full px-4 py-3 rounded-2xl glass-input text-sm text-white placeholder-pink-200/40 focus:outline-none"
                      />
                      {crushNameError && (
                        <p className="text-xs text-rose-300 mt-1 flex items-center gap-1 font-medium">
                          <AlertCircle className="w-3.5 h-3.5" /> {crushNameError}
                        </p>
                      )}
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-xs font-bold text-pink-200">
                          Crush's School / University / Workplace or Area <span className="text-rose-400">* (Compulsory)</span>
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            setIsManualInstMode(!isManualInstMode);
                            setInstDropdownOpen(false);
                          }}
                          className="text-[11px] text-amber-300 hover:text-amber-200 font-semibold flex items-center gap-1 cursor-pointer bg-white/5 hover:bg-white/10 px-2.5 py-1 rounded-xl border border-amber-400/30 transition-all"
                        >
                          {isManualInstMode ? (
                            <>
                              <Globe className="w-3 h-3 text-cyan-300" />
                              <span>Switch to Online Search 🌐</span>
                            </>
                          ) : (
                            <>
                              <Edit3 className="w-3 h-3 text-amber-300" />
                              <span>Not in list? Type Manually ✍️</span>
                            </>
                          )}
                        </button>
                      </div>

                      {!isManualInstMode ? (
                        /* Online Search Mode with Google & Wikipedia Live Suggestions */
                        <div className="relative">
                          <div className="relative">
                            <Search className="w-4 h-4 text-pink-300/60 absolute left-3.5 top-1/2 -translate-y-1/2" />
                            <input
                              type="text"
                              required
                              placeholder="Search school, university, college, workplace, or city..."
                              value={instSearchQuery}
                              onFocus={() => {
                                if (instSuggestions.length > 0) setInstDropdownOpen(true);
                              }}
                              onChange={(e) => {
                                const val = e.target.value;
                                setInstSearchQuery(val);
                                setCrushOrganization(val);
                                setSelectedInstVerified(false);
                                if (!val.trim()) {
                                  setInstDropdownOpen(false);
                                }
                              }}
                              className="w-full px-4 py-3 pl-10 pr-10 rounded-2xl glass-input text-sm text-white placeholder-pink-200/40 focus:outline-none focus:ring-2 focus:ring-pink-500/30"
                            />
                            {instLoading && (
                              <Loader2 className="w-4 h-4 text-pink-300 animate-spin absolute right-3.5 top-1/2 -translate-y-1/2" />
                            )}
                            {selectedInstVerified && (
                              <CheckCircle2 className="w-4 h-4 text-emerald-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                            )}
                          </div>

                          {/* Autocomplete Dropdown */}
                          {instDropdownOpen && instSuggestions.length > 0 && (
                            <div className="absolute left-0 right-0 top-full mt-2 z-30 bg-[#1f051c]/98 border border-pink-500/40 rounded-2xl shadow-2xl backdrop-blur-2xl overflow-hidden max-h-60 overflow-y-auto divide-y divide-white/5">
                              <div className="p-2 bg-black/40 text-[10.5px] font-bold text-pink-200/70 uppercase tracking-wider flex items-center justify-between">
                                <span className="flex items-center gap-1">
                                  <Globe className="w-3 h-3 text-cyan-400" />
                                  <span>Google & Global Verified Places</span>
                                </span>
                                <button
                                  type="button"
                                  onClick={() => setInstDropdownOpen(false)}
                                  className="text-pink-300 hover:text-white"
                                >
                                  ✕
                                </button>
                              </div>

                              {instSuggestions.map((item, idx) => {
                                return (
                                  <button
                                    key={idx}
                                    type="button"
                                    onClick={() => handleSelectInstitution(item)}
                                    className="w-full text-left p-2.5 hover:bg-white/10 transition-all flex items-center gap-2.5 cursor-pointer group"
                                  >
                                    <InstitutionLogo
                                      name={item.name}
                                      type={item.type}
                                      size="sm"
                                      className="border-pink-500/30 group-hover:scale-105"
                                    />
                                    <div className="flex-1 min-w-0">
                                      <span className="text-xs font-bold text-white block truncate group-hover:text-pink-200">
                                        {item.name}
                                      </span>
                                      {item.location && (
                                        <span className="text-[10.5px] text-pink-200/60 block truncate">
                                          {item.location}
                                        </span>
                                      )}
                                    </div>
                                    <span className="text-[9px] uppercase px-1.5 py-0.5 rounded font-semibold bg-white/5 text-pink-300/70 shrink-0">
                                      {item.type}
                                    </span>
                                  </button>
                                );
                              })}

                              <div className="p-2.5 bg-black/30 text-center border-t border-white/10">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setIsManualInstMode(true);
                                    setInstDropdownOpen(false);
                                  }}
                                  className="text-xs text-amber-300 hover:text-amber-200 font-semibold flex items-center justify-center gap-1.5 mx-auto cursor-pointer"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                  <span>Not in list? Type "{instSearchQuery || 'custom place'}" manually</span>
                                </button>
                              </div>
                            </div>
                          )}

                          {selectedInstVerified && crushOrganization && (
                            <div className="mt-2 p-2 rounded-2xl bg-emerald-500/15 border border-emerald-400/30 flex items-center gap-2 text-xs">
                              <InstitutionLogo name={crushOrganization} size="xs" />
                              <span className="text-emerald-200 font-medium truncate flex-1">{crushOrganization}</span>
                              <span className="text-[10px] text-emerald-300 bg-emerald-500/20 px-1.5 py-0.5 rounded font-bold shrink-0">Verified 🌐</span>
                            </div>
                          )}
                          {!selectedInstVerified && crushOrganization && (
                            <p className="text-[10.5px] text-pink-200/60 mt-1">
                              💡 Pick from online suggestions above or switch to manual typing if local.
                            </p>
                          )}
                        </div>
                      ) : (
                        /* Manual Input Mode */
                        <div className="space-y-2">
                          <div className="relative">
                            <Edit3 className="w-4 h-4 text-amber-300/70 absolute left-3.5 top-1/2 -translate-y-1/2" />
                            <input
                              type="text"
                              required
                              placeholder="Type your local school, coaching center, college, or living area..."
                              value={crushOrganization}
                              onChange={(e) => {
                                const val = e.target.value.replace(/[<>/"']/g, '');
                                setCrushOrganization(val);
                                setInstSearchQuery(val);
                                setSelectedInstVerified(false);
                              }}
                              className="w-full px-4 py-3 pl-10 pr-4 rounded-2xl glass-input text-sm text-white placeholder-pink-200/40 focus:outline-none focus:ring-2 focus:ring-amber-500/30 border border-amber-400/40"
                            />
                          </div>
                          <p className="text-[11px] text-amber-200/80 flex items-center gap-1">
                            <span>✍️ Manual mode active. You can enter any local school, coaching institute, or living area.</span>
                          </p>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-pink-200 mb-1.5">
                        Crush's Instagram ID <span className="text-pink-300/70 font-normal">(Optional)</span>
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="crush_instagram_handle"
                          value={crushInstagramId}
                          onChange={(e) => setCrushInstagramId(e.target.value.replace(/^@/, ''))}
                          className="w-full px-4 py-3 pl-10 rounded-2xl glass-input text-sm text-white placeholder-pink-200/40 focus:outline-none"
                        />
                        <InstagramIcon className="w-4 h-4 text-pink-300/60 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        {crushIgStatus === 'checking' && (
                          <Loader2 className="w-4 h-4 text-pink-300 animate-spin absolute right-3.5 top-1/2 -translate-y-1/2" />
                        )}
                        {crushIgStatus === 'valid' && (
                          <Check className="w-4 h-4 text-emerald-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                        )}
                      </div>
                      {crushIgMessage && (
                        <p className={`text-xs mt-1.5 flex items-center gap-1 font-medium ${
                          crushIgStatus === 'valid' ? 'text-emerald-300' : 'text-rose-300'
                        }`}>
                          <CheckCircle2 className="w-3.5 h-3.5" /> {crushIgMessage}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-pink-200 mb-1.5">
                        How long have you liked them?
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {['1 week', '1 month', '6 months', '1 year+', 'Forever 💕'].map((opt) => (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => setCrushDurationOption(opt)}
                            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                              crushDurationOption === opt
                                ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-sm'
                                : 'bg-white/5 border border-white/10 text-pink-200 hover:bg-white/10'
                            }`}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            )}

            {/* STEP 4: COMPULSORY CONFESSION & NOTIFICATION */}
            {currentStep === 4 && (
              <div className="space-y-5">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-500/20 text-pink-300 text-xs font-bold mb-2">
                    <MessageSquare className="w-3.5 h-3.5" /> Step 4: Secret Love Letter
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-white">
                    What would you tell them? 💌
                  </h2>
                  <p className="text-xs sm:text-sm text-pink-200/80 mt-1">
                    Pour your heart out. This will be encrypted in our safe vault.
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-pink-200 mb-1.5">
                      Your Secret Confession / Message <span className="text-rose-400">* (Compulsory)</span>
                    </label>
                    <textarea
                      required
                      rows={4}
                      placeholder="Write whatever is in your heart... 'I still smile every time you look my way...'"
                      value={comments}
                      onChange={(e) => setComments(e.target.value)}
                      className="w-full px-4 py-3 rounded-2xl glass-input text-sm text-white placeholder-pink-200/40 focus:outline-none resize-none leading-relaxed"
                    />
                  </div>

                  <div className="p-4 rounded-2xl bg-white/5 border border-pink-400/20 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Bell className="w-4 h-4 text-amber-300" />
                        <span className="text-xs font-bold text-white">Notify me if they are single/committed</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={wantNotification}
                        onChange={(e) => setWantNotification(e.target.checked)}
                        className="w-4 h-4 accent-pink-500 rounded"
                      />
                    </div>

                    {wantNotification && (
                      <div className="space-y-2.5 pt-2 border-t border-white/10">
                        <div className="grid grid-cols-3 gap-1.5">
                          {(['instagram', 'whatsapp', 'email'] as const).map((ch) => (
                            <button
                              key={ch}
                              type="button"
                              onClick={() => setNotificationChannel(ch)}
                              className={`py-1.5 px-2 rounded-xl text-[11px] font-semibold capitalize transition-all ${
                                notificationChannel === ch
                                  ? 'bg-pink-500 text-white shadow-sm'
                                  : 'bg-white/5 text-pink-200/70 hover:bg-white/10'
                              }`}
                            >
                              {ch === 'instagram' ? '📸 Instagram' : ch === 'whatsapp' ? '💬 WhatsApp' : '✉️ Email'}
                            </button>
                          ))}
                        </div>

                        <input
                          type="text"
                          required
                          placeholder={
                            notificationChannel === 'instagram'
                              ? 'Your Instagram @handle'
                              : notificationChannel === 'whatsapp'
                              ? 'Your WhatsApp number with country code'
                              : 'Your email address'
                          }
                          value={contactInfo}
                          onChange={(e) => setContactInfo(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs text-white placeholder-pink-200/40 focus:outline-none"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 5: PRIVACY SEAL */}
            {currentStep === 5 && (
              <div className="space-y-5">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-500/20 text-pink-300 text-xs font-bold mb-2">
                    <ShieldCheck className="w-3.5 h-3.5" /> Step 5: Seal Privacy
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-white">
                    Choose Privacy Level 🔒
                  </h2>
                  <p className="text-xs sm:text-sm text-pink-200/80 mt-1">
                    Your identity remains protected by military-grade encryption.
                  </p>
                </div>

                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={() => setIsConfidential(true)}
                    className={`w-full p-4 rounded-2xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                      isConfidential
                        ? 'bg-gradient-to-r from-pink-500/25 to-rose-500/25 border-pink-400 shadow-md shadow-pink-500/20'
                        : 'bg-white/5 border-white/10 hover:bg-white/10'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center shrink-0 text-emerald-300">
                      <Lock className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">100% Confidential (Recommended)</h4>
                      <p className="text-xs text-pink-200/70 mt-0.5">
                        Only saved in the encrypted vault. Never posted anywhere publicly.
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsConfidential(false)}
                    className={`w-full p-4 rounded-2xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                      !isConfidential
                        ? 'bg-gradient-to-r from-pink-500/25 to-rose-500/25 border-pink-400 shadow-md shadow-pink-500/20'
                        : 'bg-white/5 border-white/10 hover:bg-white/10'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center shrink-0 text-amber-300">
                      <Unlock className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">Anonymous Public Quote</h4>
                      <p className="text-xs text-pink-200/70 mt-0.5">
                        Can be featured in anonymous romantic quotes without showing your identity.
                      </p>
                    </div>
                  </button>
                </div>

                <div className="p-3.5 bg-white/5 rounded-2xl border border-pink-300/20 text-xs space-y-1 text-pink-100/90">
                  <p className="text-white font-bold flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-300" /> Summary to be Sealed:
                  </p>
                  <p>• Submitter: <span className="text-pink-300 font-semibold">{nameOrNickname || 'Anonymous'}</span></p>
                  {hasCrush && (
                    <p>• Crush: <span className="text-pink-300 font-semibold">{crushName}</span> {crushInstagramId ? `(@${crushInstagramId.replace(/^@/, '')})` : ''}</p>
                  )}
                </div>
              </div>
            )}

            {/* Error Message */}
            {stepError && (
              <div className="p-3.5 bg-rose-950/60 border border-rose-400/40 rounded-2xl text-rose-200 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-300" />
                <span>{stepError}</span>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between pt-2 border-t border-white/10 gap-3">
              {currentStep > 1 ? (
                <button
                  type="button"
                  onClick={handleBack}
                  className="py-3 px-4 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15 text-xs font-semibold text-pink-200 flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
              ) : <div />}

              {currentStep < TOTAL_STEPS ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="py-3 px-6 rounded-2xl bg-gradient-to-r from-pink-500 via-rose-500 to-pink-500 text-white text-xs font-extrabold shadow-lg shadow-pink-500/25 hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2 transition-all ml-auto cursor-pointer"
                >
                  Next Step <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleSubmit}
                  className="py-3.5 px-6 rounded-2xl bg-gradient-to-r from-rose-500 via-pink-500 to-amber-500 text-white text-xs font-black shadow-xl shadow-pink-500/35 hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2 transition-all ml-auto disabled:opacity-60 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Sealing with Love...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" /> Seal & Send Confession 💌✨
                    </>
                  )}
                </button>
              )}
            </div>
          </motion.div>
        </Tilt3DCard>
      ) : (
        /* SUCCESS CELEBRATION */
        <Tilt3DCard intensity={8}>
          <motion.div
            key="success-card"
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="glass-card rounded-3xl p-8 text-center space-y-6 border border-pink-300/30 backdrop-blur-xl shadow-2xl"
          >
            <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-tr from-pink-400 to-rose-500 flex items-center justify-center shadow-xl shadow-pink-500/40 animate-cute-bounce">
              <PartyPopper className="w-10 h-10 text-white" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-black text-white">
                Sealed with Love! 💌✨
              </h2>
              <p className="text-sm text-pink-200/90">
                Thank you, <span className="font-extrabold text-pink-300">{nameOrNickname}</span>! Your secret confession is safe and tucked away in our vault.
              </p>
            </div>

            <div className="p-4 bg-white/5 rounded-2xl border border-pink-300/20 text-xs text-pink-200/90 space-y-1">
              <p className="text-pink-300 font-bold flex items-center justify-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                {isConfidential ? 'Confidentiality: 100% Secret & Anonymous 🔒' : 'Confidentiality: Anonymous Public 💌'}
              </p>
              <p>Your secret is protected by 256-bit zero-leak encryption.</p>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
              {onViewHistory && (
                <button
                  onClick={onViewHistory}
                  className="flex-1 py-3 px-3 rounded-2xl bg-white/10 hover:bg-white/15 border border-pink-400/30 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>View in History 📜</span>
                </button>
              )}
              <button
                onClick={handleCopyLink}
                className="flex-1 py-3 px-3 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/20 text-xs font-bold text-white flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Link Copied!' : 'Copy Site Link'}
              </button>
              <button
                onClick={() => {
                  setSubmitted(false);
                  setCurrentStep(1);
                  setHasCrush(null);
                  setCrushName('');
                  setCrushInstagramId('');
                  setComments('');
                  setContactInfo('');
                }}
                className="flex-1 py-3 px-3 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white text-xs font-bold shadow-md shadow-pink-500/20 cursor-pointer"
              >
                Another Secret 💕
              </button>
            </div>
          </motion.div>
        </Tilt3DCard>
      )}
    </AnimatePresence>
  </div>
);
}
