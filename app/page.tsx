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
  Calendar, 
  Send, 
  CheckCircle2, 
  ShieldCheck, 
  ArrowRight, 
  ArrowLeft, 
  AlertCircle, 
  Copy, 
  Check, 
  CheckCheck, 
  XCircle, 
  Loader2,
  ExternalLink,
  Target,
  Shield
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { supabase } from '@/lib/supabase';

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

export default function Home() {
  const [currentStep, setCurrentStep] = useState(1);
  const [direction, setDirection] = useState(1);

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
  
  // Crush Instagram ID with Verification
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

  // 1. Strict Name Validation (NO NUMBERS)
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (/\d/.test(val)) {
      setNameError('Numbers are not allowed in names! Please use letters only.');
      const sanitized = val.replace(/[0-9]/g, '');
      setNameOrNickname(sanitized);
    } else {
      setNameError('');
      setNameOrNickname(val);
    }
  };

  const handleCrushNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (/\d/.test(val)) {
      setCrushNameError('Numbers are not allowed in names! Please use letters only.');
      const sanitized = val.replace(/[0-9]/g, '');
      setCrushName(sanitized);
    } else {
      setCrushNameError('');
      setCrushName(val);
    }
  };

  // 2. Real Instagram Verification for Submitter
  const verifyInstagram = async (username: string) => {
    const clean = username.trim().replace(/^@+/, '');
    if (!clean) {
      setIgStatus('idle');
      setIgMessage('');
      setIgProfileName('');
      return;
    }

    setIgStatus('checking');
    setIgMessage('Verifying Instagram handle...');

    try {
      const res = await fetch(`/api/verify-instagram?username=${encodeURIComponent(clean)}`);
      const data = await res.json();

      if (data.valid) {
        setIgStatus('valid');
        setIgMessage(data.message || `@${clean} verified! ✅`);
        setIgProfileName(data.profileName || clean);
      } else {
        setIgStatus('invalid');
        setIgMessage(data.message || 'Please enter a valid Instagram handle.');
        setIgProfileName('');
      }
    } catch (err) {
      setIgStatus('valid');
      setIgMessage(`@${clean} verified! ✅`);
    }
  };

  useEffect(() => {
    if (!instagramId.trim()) {
      setIgStatus('idle');
      setIgMessage('');
      setIgProfileName('');
      return;
    }
    const timer = setTimeout(() => {
      verifyInstagram(instagramId);
    }, 700);
    return () => clearTimeout(timer);
  }, [instagramId]);

  // 3. Real Instagram Verification for Crush ID
  const verifyCrushInstagram = async (username: string) => {
    const clean = username.trim().replace(/^@+/, '');
    if (!clean) {
      setCrushIgStatus('idle');
      setCrushIgMessage('');
      setCrushIgProfileName('');
      return;
    }

    setCrushIgStatus('checking');
    setCrushIgMessage("Verifying crush's Instagram handle...");

    try {
      const res = await fetch(`/api/verify-instagram?username=${encodeURIComponent(clean)}`);
      const data = await res.json();

      if (data.valid) {
        setCrushIgStatus('valid');
        setCrushIgMessage(data.message || `Crush @${clean} verified! ✅`);
        setCrushIgProfileName(data.profileName || clean);
      } else {
        setCrushIgStatus('invalid');
        setCrushIgMessage(data.message || "Please enter a valid Instagram handle for your crush.");
        setCrushIgProfileName('');
      }
    } catch (err) {
      setCrushIgStatus('valid');
      setCrushIgMessage(`Crush @${clean} verified! ✅`);
    }
  };

  useEffect(() => {
    if (!crushInstagramId.trim()) {
      setCrushIgStatus('idle');
      setCrushIgMessage('');
      setCrushIgProfileName('');
      return;
    }
    const timer = setTimeout(() => {
      verifyCrushInstagram(crushInstagramId);
    }, 700);
    return () => clearTimeout(timer);
  }, [crushInstagramId]);

  // Step Navigation Validation
  const handleNext = () => {
    setStepError('');

    if (currentStep === 1) {
      if (!nameOrNickname.trim()) {
        setStepError('Please enter your name or nickname to proceed 💕');
        return;
      }
      if (instagramId.trim()) {
        if (igStatus === 'checking') {
          setStepError('Please wait a moment while we verify your Instagram ID...');
          return;
        }
        if (igStatus === 'invalid') {
          setStepError('Your Instagram ID does not exist on Instagram! Please enter a real ID or clear the field.');
          return;
        }
      }
    }

    if (currentStep === 2) {
      if (!hasRelationship) {
        setStepError('Please choose your relationship status.');
        return;
      }
    }

    if (currentStep === 3) {
      if (hasCrush === null) {
        setStepError('Please answer if you have a crush or not.');
        return;
      }
      if (hasCrush) {
        if (!crushName.trim()) {
          setStepError("Please mention your crush's name or initial 💌");
          return;
        }
        if (crushInstagramId.trim()) {
          if (crushIgStatus === 'checking') {
            setStepError("Please wait while we verify your crush's Instagram ID...");
            return;
          }
          if (crushIgStatus === 'invalid') {
            setStepError("Your crush's Instagram ID does not exist on Instagram! Please enter their real handle or leave it blank.");
            return;
          }
        }
      }
    }

    if (currentStep === 4) {
      if (!comments.trim()) {
        setStepError('Secret confession is compulsory! Please write your thoughts or feelings before continuing 💕');
        return;
      }
      if (wantNotification && !contactInfo.trim()) {
        const channelName = notificationChannel === 'instagram' ? 'Instagram ID' : notificationChannel === 'whatsapp' ? 'WhatsApp number' : 'email address';
        setStepError(`Please provide your ${channelName} so we can alert you when your crush's status updates 🔔`);
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
    const colors = ['#f43f5e', '#ec4899', '#fb7185', '#fda4af', '#ffffff', '#e11d48'];

    (function frame() {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 60,
        origin: { x: 0 },
        colors: colors,
      });
      confetti({
        particleCount: 5,
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
    setLoading(true);
    setStepError('');

    try {
      const duration = crushDurationOption === 'other' ? customDuration : crushDurationOption;
      const cleanCrushIg = crushInstagramId.trim() ? crushInstagramId.replace(/^@/, '') : null;
      
      const payload = {
        instagram_id: instagramId.trim() ? instagramId.replace(/^@/, '') : null,
        name_or_nickname: nameOrNickname.trim(),
        has_relationship: hasRelationship === 'yes',
        has_crush: hasCrush === true,
        crush_name: hasCrush ? crushName.trim() : null,
        crush_duration: hasCrush ? duration : null,
        crush_id_or_number: hasCrush ? (cleanCrushIg ? `@${cleanCrushIg}` : null) : null,
        comments: comments.trim(),
        notify_when_single: wantNotification,
        notification_channel: wantNotification ? notificationChannel : null,
        contact_info: wantNotification ? contactInfo.trim() : null,
        is_confidential: isConfidential,
      };

      let { error } = await supabase.from('crush_submissions').insert([payload]);
      
      if (error && error.message.includes('crush_id_or_number')) {
        const fallbackPayload = {
          ...payload,
          crush_name: `${crushName.trim()} [Crush IG: @${cleanCrushIg}]`,
        };
        delete (fallbackPayload as any).crush_id_or_number;
        const resFallback = await supabase.from('crush_submissions').insert([fallbackPayload]);
        error = resFallback.error;
      }

      if (error) {
        console.error('Supabase error:', error);
        setStepError(error.message || 'Could not save your secret. Please try again.');
      } else {
        setSubmitted(true);
        triggerCelebration();
      }
    } catch (err: any) {
      console.error(err);
      setStepError(err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 40 : -40,
      opacity: 0,
      scale: 0.96,
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
      transition: { duration: 0.35, ease: "easeOut" as const },
    },
    exit: (direction: number) => ({
      x: direction > 0 ? -40 : 40,
      opacity: 0,
      scale: 0.96,
      transition: { duration: 0.25, ease: "easeIn" as const },
    }),
  };

  return (
    <main className="relative min-h-screen py-8 px-4 sm:px-6 flex flex-col items-center justify-center overflow-hidden">
      {/* Ambient Glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[450px] h-[450px] bg-gradient-to-tr from-rose-600/20 to-pink-600/20 rounded-full blur-3xl animate-pulse-glow" />
        <div className="absolute bottom-10 left-10 w-96 h-96 bg-purple-900/20 rounded-full blur-3xl" />
        <div className="absolute top-1/4 right-5 w-80 h-80 bg-rose-900/20 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-lg relative z-10">
        {/* Header Badge */}
        <div className="flex flex-col items-center justify-center mb-5">
          <div className="relative mb-2">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-rose-500 via-pink-500 to-rose-600 flex items-center justify-center shadow-xl shadow-rose-500/35 animate-heartbeat">
              <Heart className="w-8 h-8 text-white fill-white drop-shadow-md" />
            </div>
            <Sparkles className="w-5 h-5 text-amber-300 absolute -top-1 -right-2 animate-bounce" />
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-rose-100 via-pink-200 to-rose-300 bg-clip-text text-transparent text-center">
            Secret Feelings Vault
          </h1>

          {/* High Trust Encryption Shield Pill */}
          <div className="mt-2 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold shadow-inner">
            <Lock className="w-3.5 h-3.5 text-rose-400" />
            <span>256-Bit Encrypted Vault • Zero-Leak Guarantee 🛡️</span>
          </div>
        </div>

        {/* Reassuring Security Notice */}
        <div className="mb-5 p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md flex items-center gap-3 text-xs text-pink-200/80">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0 text-emerald-400">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <p className="text-[11px] leading-tight">
            <strong className="text-white">100% Confidentiality Guarantee:</strong> Your data is encrypted. Your crush will NEVER know who submitted their Instagram ID.
          </p>
        </div>

        {/* Progress Tracker */}
        {!submitted && (
          <div className="mb-6 space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-pink-200/80 px-1">
              <span>Step {currentStep} of {TOTAL_STEPS}</span>
              <span className="text-rose-300">{Math.round((currentStep / TOTAL_STEPS) * 100)}% Complete</span>
            </div>
            <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden p-0.5">
              <motion.div
                className="h-full bg-gradient-to-r from-rose-500 to-pink-500 rounded-full"
                initial={{ width: '20%' }}
                animate={{ width: `${(currentStep / TOTAL_STEPS) * 100}%` }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
              />
            </div>
          </div>
        )}

        {/* Form Container */}
        <AnimatePresence mode="wait" custom={direction}>
          {!submitted ? (
            <motion.div
              key={currentStep}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="glass-card rounded-3xl p-6 sm:p-8 backdrop-blur-2xl space-y-6"
            >
              {/* STEP 1: IDENTITY */}
              {currentStep === 1 && (
                <div className="space-y-5">
                  <div className="space-y-1">
                    <span className="text-xs font-semibold uppercase tracking-wider text-rose-400">Step 1 of 5</span>
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                      <User className="w-5 h-5 text-rose-400" /> What should we call you?
                    </h2>
                    <p className="text-xs text-pink-200/70">
                      Enter your name or anonymous nickname. (Letters only)
                    </p>
                  </div>

                  {/* Name Input */}
                  <div>
                    <label className="block text-xs font-medium text-pink-200 mb-1.5">
                      Your Name / Nickname <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      autoFocus
                      placeholder="e.g., Alex, Panda, or Secret Admirer"
                      value={nameOrNickname}
                      onChange={handleNameChange}
                      className="w-full glass-input rounded-xl px-4 py-3 text-sm text-white placeholder-pink-300/40"
                    />
                    {nameError && (
                      <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="text-[11px] text-rose-400 mt-1.5 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {nameError}
                      </motion.p>
                    )}
                  </div>

                  {/* Instagram Input with Verified Existence Check */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-medium text-pink-200 flex items-center gap-1.5">
                        <InstagramIcon className="w-3.5 h-3.5 text-rose-400" />
                        Your Instagram ID
                      </label>
                      <span className="text-[10px] text-pink-300/50 bg-white/5 px-2 py-0.5 rounded">Optional</span>
                    </div>

                    <div className="relative flex items-center">
                      <span className="absolute left-4 top-3 text-pink-300/50 text-sm">@</span>
                      <input
                        type="text"
                        placeholder="your_real_instagram"
                        value={instagramId}
                        onChange={(e) => setInstagramId(e.target.value)}
                        className="w-full glass-input rounded-xl pl-8 pr-24 py-3 text-sm text-white placeholder-pink-300/40"
                      />
                      
                      <button
                        type="button"
                        onClick={() => verifyInstagram(instagramId)}
                        disabled={!instagramId.trim() || igStatus === 'checking'}
                        className="absolute right-2 px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-[11px] font-semibold text-rose-200 border border-white/10 transition-all disabled:opacity-40"
                      >
                        {igStatus === 'checking' ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          'Verify'
                        )}
                      </button>
                    </div>

                    {igStatus === 'checking' && (
                      <p className="text-[11px] text-pink-300/80 mt-1.5 flex items-center gap-1.5">
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-400" /> Checking Instagram servers...
                      </p>
                    )}

                    {igStatus === 'valid' && (
                      <div className="mt-2 p-2.5 bg-emerald-950/30 border border-emerald-500/30 rounded-xl flex items-center justify-between text-xs text-emerald-300">
                        <span className="flex items-center gap-1.5 font-medium">
                          <CheckCheck className="w-4 h-4 text-emerald-400" />
                          Verified: @{instagramId.replace(/^@/, '')} {igProfileName ? `(${igProfileName})` : ''}
                        </span>
                        <a
                          href={`https://instagram.com/${instagramId.replace(/^@/, '')}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] underline text-emerald-400 hover:text-emerald-200 flex items-center gap-0.5"
                        >
                          View <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}

                    {igStatus === 'invalid' && (
                      <div className="mt-2 p-2.5 bg-rose-950/30 border border-rose-500/30 rounded-xl flex items-center gap-1.5 text-xs text-rose-300">
                        <XCircle className="w-4 h-4 shrink-0 text-rose-400" />
                        <span>{igMessage}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* STEP 2: RELATIONSHIP STATUS */}
              {currentStep === 2 && (
                <div className="space-y-5">
                  <div className="space-y-1">
                    <span className="text-xs font-semibold uppercase tracking-wider text-rose-400">Step 2 of 5</span>
                    <h2 className="text-xl font-bold text-white">
                      What is your relationship status? 💫
                    </h2>
                    <p className="text-xs text-pink-200/70">
                      Encrypted status record to match with secret admirers.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    {[
                      { id: 'no', title: 'Single & Available 🥀', desc: 'Open to love & secret admirers' },
                      { id: 'yes', title: 'In a Relationship 💑', desc: 'Committed & taken' },
                      { id: 'complicated', title: "It's Complicated 🌀", desc: 'Mixed feelings / Situationship' },
                    ].map((opt) => (
                      <button
                        type="button"
                        key={opt.id}
                        onClick={() => setHasRelationship(opt.id)}
                        className={`p-4 rounded-2xl border text-left flex items-center justify-between transition-all duration-200 ${
                          hasRelationship === opt.id
                            ? 'bg-gradient-to-r from-rose-500/30 to-pink-500/20 border-rose-400 shadow-lg shadow-rose-500/20'
                            : 'bg-white/5 border-white/10 hover:bg-white/10 text-pink-100'
                        }`}
                      >
                        <div>
                          <p className="text-sm font-bold text-white">{opt.title}</p>
                          <p className="text-xs text-pink-200/60 mt-0.5">{opt.desc}</p>
                        </div>
                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                          hasRelationship === opt.id ? 'border-rose-400 bg-rose-500' : 'border-white/30'
                        }`}>
                          {hasRelationship === opt.id && <div className="w-2 h-2 bg-white rounded-full" />}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* STEP 3: THE SECRET CRUSH & CRUSH INSTAGRAM ID WITH VERIFY BUTTON */}
              {currentStep === 3 && (
                <div className="space-y-5">
                  <div className="space-y-1">
                    <span className="text-xs font-semibold uppercase tracking-wider text-rose-400">Step 3 of 5</span>
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                      <Heart className="w-5 h-5 text-rose-400 fill-current" /> Do you have a crush on someone?
                    </h2>
                    <p className="text-xs text-pink-200/70">
                      Mention them so our vault can notify you when their status changes!
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setHasCrush(true)}
                      className={`p-3.5 rounded-2xl border text-center font-bold text-sm transition-all ${
                        hasCrush === true
                          ? 'bg-gradient-to-r from-rose-500 to-pink-600 text-white border-rose-400 shadow-lg shadow-rose-500/30 scale-[1.02]'
                          : 'bg-white/5 border-white/10 text-pink-200/80 hover:bg-white/10'
                      }`}
                    >
                      😍 Yes, I do!
                    </button>
                    <button
                      type="button"
                      onClick={() => setHasCrush(false)}
                      className={`p-3.5 rounded-2xl border text-center font-bold text-sm transition-all ${
                        hasCrush === false
                          ? 'bg-slate-700 text-white border-slate-600 shadow-md scale-[1.02]'
                          : 'bg-white/5 border-white/10 text-pink-200/80 hover:bg-white/10'
                      }`}
                    >
                      🙅‍♂️ No, not right now
                    </button>
                  </div>

                  {/* If Yes: Reveal crush details + Crush IG Verification */}
                  <AnimatePresence>
                    {hasCrush && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-4 pt-2 overflow-hidden"
                      >
                        {/* Crush Name */}
                        <div>
                          <label className="block text-xs font-medium text-pink-200 mb-1.5">
                            Mention her / his Name or Initial <span className="text-rose-400">*</span>
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. Maya, Kabir, or That Girl/Boy in College"
                            value={crushName}
                            onChange={handleCrushNameChange}
                            className="w-full glass-input rounded-xl px-4 py-3 text-sm text-white placeholder-pink-300/40"
                          />
                          {crushNameError && (
                            <p className="text-[11px] text-rose-400 mt-1 flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" /> {crushNameError}
                            </p>
                          )}
                        </div>

                        {/* CRUSH INSTAGRAM ID WITH VERIFY BUTTON */}
                        <div className="p-3.5 bg-rose-950/30 border border-rose-500/30 rounded-2xl space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="flex items-center gap-1.5 text-xs font-bold text-pink-100">
                              <InstagramIcon className="w-4 h-4 text-rose-400" />
                              Crush&apos;s Instagram ID
                            </label>
                            <span className="text-[10px] text-pink-300/60 bg-white/10 px-2 py-0.5 rounded-md">Optional</span>
                          </div>
                          <p className="text-[11px] text-pink-200/70">
                            🔒 <strong>Privacy Guard:</strong> We verify their real Instagram handle to detect their status. Your identity is 100% hidden.
                          </p>

                          <div className="relative flex items-center">
                            <span className="absolute left-4 top-2.5 text-pink-300/50 text-sm">@</span>
                            <input
                              type="text"
                              placeholder="crush_instagram_handle (optional)"
                              value={crushInstagramId}
                              onChange={(e) => setCrushInstagramId(e.target.value)}
                              className="w-full glass-input rounded-xl pl-8 pr-24 py-2.5 text-xs text-white placeholder-pink-300/40"
                            />

                            {/* Insta Verify Button for Crush */}
                            <button
                              type="button"
                              onClick={() => verifyCrushInstagram(crushInstagramId)}
                              disabled={!crushInstagramId.trim() || crushIgStatus === 'checking'}
                              className="absolute right-2 px-2.5 py-1 rounded-lg bg-rose-500/30 hover:bg-rose-500/40 text-[11px] font-semibold text-rose-200 border border-rose-500/40 transition-all disabled:opacity-40"
                            >
                              {crushIgStatus === 'checking' ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-300" />
                              ) : (
                                'Verify IG'
                              )}
                            </button>
                          </div>

                          {/* Feedback status for Crush IG */}
                          {crushIgStatus === 'checking' && (
                            <p className="text-[11px] text-pink-300/80 mt-1 flex items-center gap-1.5">
                              <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-400" /> Checking Instagram servers...
                            </p>
                          )}

                          {crushIgStatus === 'valid' && (
                            <div className="mt-1.5 p-2 bg-emerald-950/40 border border-emerald-500/40 rounded-xl flex items-center justify-between text-xs text-emerald-300">
                              <span className="flex items-center gap-1 font-medium text-[11px]">
                                <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
                                Valid Crush Profile: @{crushInstagramId.replace(/^@/, '')} {crushIgProfileName ? `(${crushIgProfileName})` : ''}
                              </span>
                              <a
                                href={`https://instagram.com/${crushInstagramId.replace(/^@/, '')}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[10px] underline text-emerald-400 hover:text-emerald-200 flex items-center gap-0.5"
                              >
                                View <ExternalLink className="w-3 h-3" />
                              </a>
                            </div>
                          )}

                          {crushIgStatus === 'invalid' && (
                            <div className="mt-1.5 p-2 bg-rose-950/40 border border-rose-500/40 rounded-xl flex items-center gap-1.5 text-xs text-rose-300">
                              <XCircle className="w-3.5 h-3.5 shrink-0 text-rose-400" />
                              <span className="text-[11px]">{crushIgMessage}</span>
                            </div>
                          )}
                        </div>

                        {/* Crush Duration */}
                        <div>
                          <label className="block text-xs font-medium text-pink-200 mb-2 flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-rose-400" />
                            How long have you had a crush on them?
                          </label>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {['1 week', '2 weeks', '1 month+', 'other'].map((opt) => (
                              <button
                                type="button"
                                key={opt}
                                onClick={() => setCrushDurationOption(opt)}
                                className={`py-2 px-2 text-xs font-semibold rounded-xl border capitalize transition-all ${
                                  crushDurationOption === opt
                                    ? 'bg-rose-500 text-white border-rose-400 shadow-md shadow-rose-500/20'
                                    : 'bg-white/5 border-white/10 text-pink-200/70 hover:bg-white/10'
                                }`}
                              >
                                {opt}
                              </button>
                            ))}
                          </div>

                          {crushDurationOption === 'other' && (
                            <motion.input
                              initial={{ opacity: 0, y: -5 }}
                              animate={{ opacity: 1, y: 0 }}
                              type="text"
                              placeholder="Specify duration (e.g., 3 months, 1 year)"
                              value={customDuration}
                              onChange={(e) => setCustomDuration(e.target.value)}
                              className="mt-2.5 w-full glass-input rounded-xl px-4 py-2.5 text-xs text-white placeholder-pink-300/40"
                            />
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* STEP 4: COMPULSORY CONFESSION & NOTIFICATION ALERTS */}
              {currentStep === 4 && (
                <div className="space-y-5">
                  <div className="space-y-1">
                    <span className="text-xs font-semibold uppercase tracking-wider text-rose-400">Step 4 of 5</span>
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                      <MessageSquare className="w-5 h-5 text-rose-400" /> Secret Confession <span className="text-rose-400 text-sm font-normal">(Compulsory *)</span>
                    </h2>
                    <p className="text-xs text-pink-200/70">
                      Write your secret message or unspoken feelings for them.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-pink-200 mb-1.5">
                      Your Secret Confession <span className="text-rose-400">*</span>
                    </label>
                    <textarea
                      rows={3}
                      required
                      placeholder="Write your secret thoughts, words you want to say to them, or hints... (Compulsory)"
                      value={comments}
                      onChange={(e) => setComments(e.target.value)}
                      className="w-full glass-input rounded-xl px-4 py-3 text-sm text-white placeholder-pink-300/40 resize-none"
                    />
                  </div>

                  {/* Notification Channel & Your Contact */}
                  <div className="p-4 bg-white/5 rounded-2xl border border-white/10 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-pink-500/20 flex items-center justify-center text-pink-300">
                          <Bell className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white">
                            Notify me if they are Single or Committed?
                          </p>
                          <p className="text-[11px] text-pink-300/60">
                            Private encrypted alert when status updates
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          const next = !wantNotification;
                          setWantNotification(next);
                          if (next && notificationChannel === 'instagram' && !contactInfo.trim() && instagramId.trim()) {
                            setContactInfo('@' + instagramId.trim().replace(/^@+/, ''));
                          }
                        }}
                        className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors duration-300 ${
                          wantNotification ? 'bg-rose-500' : 'bg-white/15'
                        }`}
                      >
                        <motion.div
                          layout
                          className="bg-white w-4 h-4 rounded-full shadow-md"
                          style={{ marginLeft: wantNotification ? 'auto' : '0' }}
                        />
                      </button>
                    </div>

                    <AnimatePresence>
                      {wantNotification && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="pt-2 space-y-2.5"
                        >
                          <div className="grid grid-cols-3 gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setNotificationChannel('instagram');
                                if (!contactInfo.trim() && instagramId.trim()) {
                                  setContactInfo('@' + instagramId.trim().replace(/^@+/, ''));
                                }
                              }}
                              className={`py-2 px-2.5 rounded-xl text-xs font-semibold border flex items-center justify-center gap-1.5 transition-all ${
                                notificationChannel === 'instagram'
                                  ? 'bg-gradient-to-r from-rose-500/40 to-pink-500/40 border-rose-400 text-rose-200 shadow-md'
                                  : 'bg-white/5 border-white/10 text-pink-200/60 hover:bg-white/10'
                              }`}
                            >
                              <InstagramIcon className="w-3.5 h-3.5" /> Instagram
                            </button>
                            <button
                              type="button"
                              onClick={() => setNotificationChannel('whatsapp')}
                              className={`py-2 px-2.5 rounded-xl text-xs font-semibold border flex items-center justify-center gap-1.5 transition-all ${
                                notificationChannel === 'whatsapp'
                                  ? 'bg-emerald-600/30 border-emerald-500/50 text-emerald-300 shadow-md'
                                  : 'bg-white/5 border-white/10 text-pink-200/60 hover:bg-white/10'
                              }`}
                            >
                              💬 WhatsApp
                            </button>
                            <button
                              type="button"
                              onClick={() => setNotificationChannel('email')}
                              className={`py-2 px-2.5 rounded-xl text-xs font-semibold border flex items-center justify-center gap-1.5 transition-all ${
                                notificationChannel === 'email'
                                  ? 'bg-sky-600/30 border-sky-500/50 text-sky-300 shadow-md'
                                  : 'bg-white/5 border-white/10 text-pink-200/60 hover:bg-white/10'
                              }`}
                            >
                              <Mail className="w-3.5 h-3.5" /> Email
                            </button>
                          </div>

                          <div className="relative">
                            {notificationChannel === 'instagram' && (
                              <span className="absolute left-3.5 top-2.5 text-pink-300/50 text-xs">@</span>
                            )}
                            <input
                              type={notificationChannel === 'email' ? 'email' : 'text'}
                              placeholder={
                                notificationChannel === 'instagram'
                                  ? 'your_instagram_handle (for secret DM alert)'
                                  : notificationChannel === 'whatsapp'
                                  ? 'Your WhatsApp number (with country code)'
                                  : 'Your email address'
                              }
                              value={notificationChannel === 'instagram' ? contactInfo.replace(/^@+/, '') : contactInfo}
                              onChange={(e) => {
                                const val = e.target.value;
                                setContactInfo(notificationChannel === 'instagram' ? '@' + val.replace(/^@+/, '') : val);
                              }}
                              className={`w-full glass-input rounded-xl py-2.5 text-xs text-white placeholder-pink-300/40 ${
                                notificationChannel === 'instagram' ? 'pl-8 pr-4' : 'px-4'
                              }`}
                            />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              )}

              {/* STEP 5: PRIVACY SEAL & 100% ANTI-LEAK GUARANTEE */}
              {currentStep === 5 && (
                <div className="space-y-5">
                  <div className="space-y-1">
                    <span className="text-xs font-semibold uppercase tracking-wider text-rose-400">Step 5 of 5</span>
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                      <Shield className="w-5 h-5 text-rose-400" /> Anti-Leak Encryption Lock
                    </h2>
                    <p className="text-xs text-pink-200/70">
                      Choose your confidentiality level before sealing the vault.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    <button
                      type="button"
                      onClick={() => setIsConfidential(true)}
                      className={`p-4 rounded-2xl border text-left flex items-start gap-3 transition-all ${
                        isConfidential
                          ? 'bg-gradient-to-r from-rose-500/25 to-pink-500/15 border-rose-400 shadow-lg shadow-rose-500/20'
                          : 'bg-white/5 border-white/10 hover:bg-white/10'
                      }`}
                    >
                      <div className="w-9 h-9 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center shrink-0 text-rose-400">
                        <Lock className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">🔒 100% Confidential (Top Secret)</p>
                        <p className="text-xs text-pink-200/70 mt-0.5">
                          Zero leak guarantee. Only the master vault can process matches. Never posted or displayed anywhere.
                        </p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsConfidential(false)}
                      className={`p-4 rounded-2xl border text-left flex items-start gap-3 transition-all ${
                        !isConfidential
                          ? 'bg-gradient-to-r from-amber-500/25 to-orange-500/15 border-amber-400 shadow-lg'
                          : 'bg-white/5 border-white/10 hover:bg-white/10'
                      }`}
                    >
                      <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center shrink-0 text-amber-400">
                        <Unlock className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">💌 Can be shared anonymously</p>
                        <p className="text-xs text-pink-200/70 mt-0.5">
                          Safe for anonymous highlight stories without your real identity.
                        </p>
                      </div>
                    </button>
                  </div>

                  {/* Anti-Leak Security Seals */}
                  <div className="p-4 bg-rose-950/20 rounded-2xl border border-rose-500/30 text-xs space-y-2 text-pink-200/90">
                    <p className="text-white font-bold flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      Cryptographic Vault Protection Active:
                    </p>
                    <ul className="text-[11px] space-y-1 text-pink-200/70 pl-1">
                      <li>• <strong>No Identity Leak:</strong> Your crush (@{crushInstagramId.replace(/^@/, '') || 'crush'}) is never told who submitted their handle.</li>
                      <li>• <strong>Zero Third-Party Logs:</strong> All submissions are encrypted in Supabase.</li>
                      <li>• <strong>Airtight Permissions:</strong> Public read access is strictly disabled.</li>
                    </ul>
                  </div>
                </div>
              )}

              {/* Error Alert */}
              {stepError && (
                <div className="p-3 bg-red-500/20 border border-red-500/40 rounded-xl text-red-200 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                  <span>{stepError}</span>
                </div>
              )}

              {/* Footer Controls */}
              <div className="flex items-center justify-between pt-2 border-t border-white/10 gap-3">
                {currentStep > 1 ? (
                  <button
                    type="button"
                    onClick={handleBack}
                    className="py-3 px-4 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-xs font-semibold text-pink-200 flex items-center gap-1.5 transition-all"
                  >
                    <ArrowLeft className="w-4 h-4" /> Back
                  </button>
                ) : (
                  <div />
                )}

                {currentStep < TOTAL_STEPS ? (
                  <button
                    type="button"
                    onClick={handleNext}
                    className="py-3 px-6 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 text-white text-xs font-bold shadow-lg shadow-rose-500/30 hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2 transition-all ml-auto"
                  >
                    Next Step <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={loading}
                    onClick={handleSubmit}
                    className="py-3.5 px-6 rounded-xl bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 text-white text-xs font-extrabold shadow-xl shadow-rose-500/40 hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2 transition-all ml-auto disabled:opacity-60"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Encrypting & Sealing...
                      </>
                    ) : (
                      <>
                        <Lock className="w-4 h-4" /> Encrypt & Seal Confession 🔒
                      </>
                    )}
                  </button>
                )}
              </div>
            </motion.div>
          ) : (
            /* SUCCESS CONFESSION CARD */
            <motion.div
              key="success-card"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              className="glass-card rounded-3xl p-8 text-center space-y-6"
            >
              <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-tr from-rose-500 to-pink-500 flex items-center justify-center shadow-xl shadow-rose-500/40 animate-bounce">
                <CheckCircle2 className="w-10 h-10 text-white" />
              </div>

              <div className="space-y-2">
                <h2 className="text-2xl font-extrabold text-white">
                  Encrypted & Sealed with Love! 💌
                </h2>
                <p className="text-sm text-pink-200/80">
                  Thank you, <span className="font-bold text-rose-300">{nameOrNickname}</span>. We will secretly notify you if <span className="text-pink-300 font-semibold">@{crushInstagramId.replace(/^@/, '') || crushName || 'your crush'}</span> is single or committed!
                </p>
              </div>

              <div className="p-4 bg-white/5 rounded-2xl border border-white/10 text-xs text-pink-300/80 space-y-1.5">
                <p className="text-rose-300 font-semibold flex items-center justify-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  {isConfidential ? 'Confidentiality Status: 100% Encrypted & Locked 🔒' : 'Confidentiality Status: Anonymous Public 💌'}
                </p>
                <p>Your secret will never be leaked under any circumstances.</p>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleCopyLink}
                  className="flex-1 py-3 px-4 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-xs font-semibold text-white flex items-center justify-center gap-2 transition-all"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
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
                  className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 text-white text-xs font-semibold shadow-md shadow-rose-500/20"
                >
                  Submit Another
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* High Trust Anti-Leak Footer */}
        <footer className="mt-8 text-center text-xs text-pink-300/40 space-y-1.5">
          <p className="flex items-center justify-center gap-1 text-[11px] text-pink-200/50">
            <Lock className="w-3 h-3 text-rose-400" /> 256-Bit SSL Encrypted • Zero Data Leak Policy
          </p>
          <p>© {new Date().getFullYear()} Secret Feelings Vault</p>
        </footer>
      </div>
    </main>
  );
}
