'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { 
  Heart, 
  Sparkles, 
  Lock, 
  Mail, 
  User, 
  KeyRound, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  Copy, 
  Check, 
  Loader2, 
  ShieldCheck, 
  Dice5, 
  ArrowLeft,
  AlertCircle,
  Shield,
  CheckCircle2,
  LockKeyhole,
  RefreshCw,
  Edit3,
  MailCheck,
  Send
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { FloatingHeartsBackground } from '@/components/FloatingHeartsBackground';
import { CosmicRomanticCanvas } from '@/components/CosmicRomanticCanvas';
import { Floating3DCrystals } from '@/components/Floating3DCrystals';
import { Tilt3DCard } from '@/components/Tilt3DCard';
import { GuestWarningModal } from '@/components/GuestWarningModal';

function GoogleIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path
        fill="#EA4335"
        d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.4 1 3.5 3.6 1.6 7.3l3.7 2.9C6.2 7.3 8.9 5 12 5z"
      />
      <path
        fill="#4285F4"
        d="M23.5 12.3c0-.8-.1-1.7-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z"
      />
      <path
        fill="#FBBC05"
        d="M5.3 14.8c-.2-.7-.4-1.5-.4-2.8s.1-2.1.4-2.8L1.6 6.3C.6 8.3 0 10.1 0 12s.6 3.7 1.6 5.7l3.7-2.9z"
      />
      <path
        fill="#34A853"
        d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3.1 0-5.8-2.3-6.7-5.2L1.6 16c1.9 3.7 5.8 7 10.4 7z"
      />
    </svg>
  );
}

function calculatePasswordStrength(pass: string): { score: number; label: string; color: string } {
  if (!pass) return { score: 0, label: 'Empty', color: 'bg-white/20' };
  let score = 0;
  if (pass.length >= 6) score += 1;
  if (pass.length >= 10) score += 1;
  if (/[A-Z]/.test(pass)) score += 1;
  if (/[0-9]/.test(pass)) score += 1;
  if (/[^A-Za-z0-9]/.test(pass)) score += 1;

  if (score <= 1) return { score: 20, label: 'Weak', color: 'bg-rose-500' };
  if (score <= 3) return { score: 60, label: 'Good & Safe', color: 'bg-amber-400' };
  return { score: 100, label: 'Strong & Zero-Gap Safe 🛡️', color: 'bg-emerald-400' };
}

function AuthContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialMode = searchParams.get('mode') === 'signup' ? 'signup' : searchParams.get('mode') === 'guest' ? 'guest' : 'login';

  const { 
    user, 
    signIn,
    signInWithEmail, 
    signUpWithEmail,
    sendSignupOtp,
    verifySignupOtp,
    signInWithGoogle, 
    loginAsGuest, 
    generateNewGuestCredentials,
    checkUsernameAvailable,
    logout 
  } = useAuth();

  const [mode, setMode] = useState<'login' | 'signup' | 'guest'>(initialMode);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // OTP Signup State
  const [signupStep, setSignupStep] = useState<'form' | 'otp'>('form');
  const [otpLength, setOtpLength] = useState<number>(6);
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [otpToken, setOtpToken] = useState('');
  const [resendCountdown, setResendCountdown] = useState(0);
  const [otpLoading, setOtpLoading] = useState(false);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Live Database Username Availability State
  const [signupUserStatus, setSignupUserStatus] = useState<{ checking: boolean; available: boolean | null; message: string }>({
    checking: false,
    available: null,
    message: '',
  });
  const [guestUserStatus, setGuestUserStatus] = useState<{ checking: boolean; available: boolean | null; message: string }>({
    checking: false,
    available: null,
    message: '',
  });

  // Guest Mode State
  const [guestCredentials, setGuestCredentials] = useState<{ username: string; pass: string; id: string; expiresAt: string } | null>(null);
  const [copiedCreds, setCopiedCreds] = useState(false);
  const [showGuestWarningModal, setShowGuestWarningModal] = useState(false);
  const [guestLoading, setGuestLoading] = useState(false);
  const [guestModalError, setGuestModalError] = useState('');

  useEffect(() => {
    if (mode === 'guest' && !guestCredentials) {
      setGuestCredentials(generateNewGuestCredentials());
    }
  }, [mode, generateNewGuestCredentials, guestCredentials]);

  // Debounced live check for Sign Up Name / Username
  useEffect(() => {
    if (mode !== 'signup' || !displayName.trim()) {
      setSignupUserStatus({ checking: false, available: null, message: '' });
      return;
    }

    const clean = displayName.trim();
    if (clean.length < 3) {
      setSignupUserStatus({ checking: false, available: false, message: 'Username must be at least 3 characters' });
      return;
    }

    setSignupUserStatus(prev => ({ ...prev, checking: true, message: 'Checking database...' }));
    const timer = setTimeout(async () => {
      const res = await checkUsernameAvailable(clean);
      setSignupUserStatus({
        checking: false,
        available: res.available,
        message: res.message,
      });
    }, 400);

    return () => clearTimeout(timer);
  }, [displayName, mode, checkUsernameAvailable]);

  // Debounced live check for Guest Username
  useEffect(() => {
    if (mode !== 'guest' || !guestCredentials?.username) {
      setGuestUserStatus({ checking: false, available: null, message: '' });
      return;
    }

    const clean = guestCredentials.username.trim();
    if (clean.length < 3) {
      setGuestUserStatus({ checking: false, available: false, message: 'Guest username must be at least 3 characters' });
      return;
    }

    setGuestUserStatus(prev => ({ ...prev, checking: true, message: 'Checking database...' }));
    const timer = setTimeout(async () => {
      const res = await checkUsernameAvailable(clean, guestCredentials.id);
      setGuestUserStatus({
        checking: false,
        available: res.available,
        message: res.message,
      });
    }, 400);

    return () => clearTimeout(timer);
  }, [guestCredentials?.username, guestCredentials?.id, mode, checkUsernameAvailable]);

  // Countdown Timer for OTP Resend
  useEffect(() => {
    if (resendCountdown <= 0) return;
    const interval = setInterval(() => {
      setResendCountdown(prev => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCountdown]);

  const handleRegenerateGuest = () => {
    const fresh = generateNewGuestCredentials();
    setGuestCredentials(fresh);
    setCopiedCreds(false);
    setGuestModalError('');
    setGuestUserStatus({ checking: false, available: true, message: 'Unique fresh guest pass generated ✨' });
  };

  const handleCopyGuest = () => {
    if (!guestCredentials) return;
    const text = `nglcrush Guest Credentials:\nUsername: ${guestCredentials.username}\nPassword: ${guestCredentials.pass}\nKeep this safe to track your secret confessions! 🌸`;
    navigator.clipboard.writeText(text);
    setCopiedCreds(true);
    setTimeout(() => setCopiedCreds(false), 2500);
  };

  const handleGuestSubmit = async () => {
    if (!guestCredentials) return;
    setGuestModalError('');
    setErrorMsg('');
    setGuestLoading(true);

    try {
      await loginAsGuest(guestCredentials);
      setShowGuestWarningModal(false);
      setSuccessMsg('Logged in as Guest! Temporary credentials saved. Opening your vault... 🎭');
      
      // Direct instant redirection to dashboard
      if (typeof window !== 'undefined') {
        window.location.href = '/';
      } else {
        router.push('/');
      }
    } catch (err: any) {
      console.error('Guest submit error:', err);
      setGuestModalError(err.message || 'Failed to initialize guest session.');
      setErrorMsg(err.message || 'Failed to initialize guest session.');
      setGuestLoading(false);
    }
  };

  // Submit handler: Direct login OR Step 1 of OTP Signup
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    // Sanitization & Zero-Gap Validation
    const cleanId = identifier.trim().replace(/[<>/"']/g, '');
    if (!cleanId || !password) {
      setErrorMsg('Please enter your email/username and password 💕');
      return;
    }

    if (mode === 'signup') {
      if (!displayName.trim()) {
        setErrorMsg('Please enter your name or nickname 🌸');
        return;
      }
      if (!cleanId.includes('@')) {
        setErrorMsg('Please enter a valid email address 💌');
        return;
      }
      if (password.length < 6) {
        setErrorMsg('Password must be at least 6 characters 🔒');
        return;
      }
    }

    setLoading(true);

    try {
      if (mode === 'login') {
        const res = await signIn(cleanId, password);
        if (!res.success) {
          setErrorMsg(res.error || 'Invalid credentials. Please verify your email/username and password.');
        } else {
          setSuccessMsg('Welcome back! Unlocking your confidential vault... ✨');
          setTimeout(() => router.push('/'), 600);
        }
      } else {
        // Step 1: Send OTP to email
        const cleanName = displayName.trim().replace(/[<>/"'\\;]/g, '');
        const res = await sendSignupOtp(cleanId.toLowerCase(), cleanName);
        if (!res.success) {
          setErrorMsg(res.error || 'Could not send verification code.');
        } else {
          setOtpToken(res.token || '');
          setResendCountdown(60);
          setSignupStep('otp');
          setOtpDigits(['', '', '', '', '', '']);
          setSuccessMsg(`A 6-digit verification code was sent to ${cleanId.toLowerCase()}! 💌`);
          setTimeout(() => {
            otpInputRefs.current[0]?.focus();
          }, 200);
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP handler
  const handleResendOtp = async () => {
    if (resendCountdown > 0 || loading) return;
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);
    try {
      const cleanEmail = identifier.trim().toLowerCase();
      const cleanName = displayName.trim();
      const res = await sendSignupOtp(cleanEmail, cleanName);
      if (!res.success) {
        setErrorMsg(res.error || 'Failed to resend verification code.');
      } else {
        setOtpToken(res.token || '');
        setResendCountdown(60);
        setSuccessMsg(`Fresh 6-digit code sent to ${cleanEmail}! 💌`);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to resend verification code.');
    } finally {
      setLoading(false);
    }
  };

  // Verify OTP and complete registration (Supports both 6-digit and 8-digit OTPs)
  const handleVerifyOtp = async (codeOverride?: string) => {
    const fullCode = (codeOverride || otpDigits.join('')).trim();
    if (fullCode.length < 6) {
      setErrorMsg(`Please enter the complete ${otpLength}-digit verification code 🔒`);
      return;
    }

    setErrorMsg('');
    setSuccessMsg('');
    setOtpLoading(true);

    try {
      const cleanEmail = identifier.trim().toLowerCase();
      const cleanName = displayName.trim();
      const res = await verifySignupOtp(
        cleanEmail,
        password,
        cleanName,
        fullCode,
        otpToken
      );

      if (!res.success) {
        setErrorMsg(res.error || 'Invalid or expired verification code.');
      } else {
        setSuccessMsg('Email verified & account securely encrypted! Welcome 💖✨');
        setTimeout(() => {
          if (typeof window !== 'undefined') {
            window.location.href = '/';
          } else {
            router.push('/');
          }
        }, 750);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'OTP verification failed.');
    } finally {
      setOtpLoading(false);
    }
  };

  // OTP digit input change handler
  const handleOtpDigitChange = (index: number, value: string) => {
    const cleanDigit = value.replace(/[^0-9]/g, '');

    if (cleanDigit.length > 1) {
      // If user pasted into a single digit box
      const targetLen = cleanDigit.length >= 8 ? 8 : 6;
      setOtpLength(targetLen);
      const pasted = cleanDigit.slice(0, targetLen);
      const newDigits = new Array(targetLen).fill('');
      for (let i = 0; i < targetLen; i++) {
        newDigits[i] = pasted[i] || '';
      }
      setOtpDigits(newDigits);
      if (pasted.length === targetLen) {
        handleVerifyOtp(pasted);
      } else {
        const nextIdx = Math.min(pasted.length, targetLen - 1);
        otpInputRefs.current[nextIdx]?.focus();
      }
      return;
    }

    const newDigits = [...otpDigits];
    newDigits[index] = cleanDigit;
    setOtpDigits(newDigits);

    // Auto-advance to next input box
    if (cleanDigit && index < otpLength - 1) {
      otpInputRefs.current[index + 1]?.focus();
    }

    // If all digits are filled, automatically trigger verification
    if (cleanDigit && index === otpLength - 1) {
      const full = newDigits.join('');
      if (full.length === otpLength) {
        handleVerifyOtp(full);
      }
    }
  };

  // OTP backspace navigation handler
  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  // OTP paste event handler
  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const rawPasted = e.clipboardData.getData('text').replace(/[^0-9]/g, '');
    if (!rawPasted) return;

    const targetLen = rawPasted.length >= 8 ? 8 : 6;
    setOtpLength(targetLen);
    const pasted = rawPasted.slice(0, targetLen);
    const newDigits = new Array(targetLen).fill('');
    for (let i = 0; i < targetLen; i++) {
      newDigits[i] = pasted[i] || '';
    }
    setOtpDigits(newDigits);

    if (pasted.length === targetLen) {
      handleVerifyOtp(pasted);
    } else {
      const nextIdx = Math.min(pasted.length, targetLen - 1);
      otpInputRefs.current[nextIdx]?.focus();
    }
  };

  const handleGoogleAuth = async () => {
    setErrorMsg('');
    setGoogleLoading(true);
    const res = await signInWithGoogle();
    if (!res.success) {
      setErrorMsg(res.error || 'Google login failed. Please verify Supabase OAuth setup.');
      setGoogleLoading(false);
    }
  };

  const passStrength = calculatePasswordStrength(password);

  return (
    <main className="min-h-screen relative flex items-center justify-center p-4 md:p-10 bg-[#140211] overflow-hidden">
      {/* Interactive 3D Cosmic Constellation Physics Canvas */}
      <CosmicRomanticCanvas />

      {/* 3D Floating Love Crystals */}
      <Floating3DCrystals />

      {/* Floating Animated Particles */}
      <FloatingHeartsBackground />

      {/* Background ambient lighting */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-rose-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute bottom-1/4 right-1/4 w-[450px] h-[450px] bg-pink-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '10s' }} />
        <div className="absolute top-1/2 right-1/3 w-80 h-80 bg-amber-400/15 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-5xl relative z-10 flex flex-col md:flex-row items-stretch justify-center gap-6 lg:gap-10">
        {/* Left Hero / Security Showcase Panel */}
        <motion.div
          initial={{ opacity: 0, x: -25 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full md:w-1/2 glass-card p-6 md:p-10 rounded-3xl border border-pink-500/25 flex flex-col justify-between shadow-2xl backdrop-blur-2xl relative overflow-hidden"
        >
          <div>
            <div className="flex items-center gap-2 mb-6">
              <div className="relative w-12 h-12 rounded-2xl overflow-hidden shadow-lg shadow-pink-500/30 border border-pink-500/30 bg-black/50 flex-shrink-0">
                <img
                  src="/logo.jpg"
                  alt="nglcrush logo"
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h1 className="text-xl font-black bg-gradient-to-r from-pink-100 via-rose-200 to-amber-100 bg-clip-text text-transparent lowercase">
                  nglcrush
                </h1>
                <span className="text-[11px] text-pink-200/60">
                  Zero-Gap Risk Protected
                </span>
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-2xl lg:text-3xl font-black text-white leading-tight">
                Your Heart's Safest Sanctuary 🌸✨
              </h2>
              <p className="text-xs lg:text-sm text-pink-200/80 leading-relaxed">
                Whether you are professing your first crush or saving lifelong memories, your data is sealed in a private vault that only you can unlock.
              </p>
            </div>

            {/* Zero-Gap Security Seals */}
            <div className="space-y-3 mt-8">
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/10 text-xs">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300 shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-white">Zero-Gap Encryption</h4>
                  <p className="text-[11px] text-pink-200/70">SHA-256 and PostgreSQL profile security.</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/10 text-xs">
                <div className="w-8 h-8 rounded-xl bg-pink-500/20 border border-pink-400/30 flex items-center justify-center text-pink-300 shrink-0">
                  <LockKeyhole className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-white">100% Anonymous Guarantees</h4>
                  <p className="text-[11px] text-pink-200/70">Nobody can trace your identity without permission.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-white/10 mt-6 flex items-center justify-between text-[11px] text-pink-200/50">
            <Link
              href="/"
              className="hover:text-pink-100 flex items-center gap-1 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Sanctuary
            </Link>
            <span>v2.5 Enterprise Edition</span>
          </div>
        </motion.div>

        {/* Right Form Card */}
        <motion.div
          initial={{ opacity: 0, x: 25 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full md:w-1/2 glass-card p-6 md:p-8 rounded-3xl border border-pink-400/30 shadow-2xl backdrop-blur-2xl relative"
        >
          {/* Header Title */}
          <div className="text-center mb-6">
            <h2 className="text-2xl font-black bg-gradient-to-r from-pink-200 via-rose-200 to-amber-200 bg-clip-text text-transparent">
              {mode === 'login' ? 'Welcome Back 💕' : mode === 'signup' ? 'Create Your Account 🌸' : 'Instant Guest Access 🎭'}
            </h2>
            <p className="text-pink-200/70 text-xs mt-1">
              {mode === 'login' 
                ? 'Sign in to access your confession history & secrets' 
                : mode === 'signup'
                ? 'Register to permanently sync all your confessions'
                : 'Fast anonymous identity with temporary passkey'}
            </p>
          </div>

          {/* Active User Banner if already logged in */}
          {user && (
            <div className="mb-4 p-3 rounded-2xl bg-pink-500/15 border border-pink-500/30 text-xs text-pink-200 flex items-center justify-between">
              <div className="flex items-center gap-2 truncate">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                <span className="truncate">Active: <strong>{user.displayName}</strong></span>
              </div>
              <button
                onClick={logout}
                className="text-pink-300 hover:text-white underline text-[11px] shrink-0 ml-2 cursor-pointer"
              >
                Sign Out
              </button>
            </div>
          )}

          {/* Mode Switcher Tabs */}
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-black/40 rounded-2xl border border-white/10 mb-6 text-xs">
            <button
              type="button"
              onClick={() => { setMode('login'); setSignupStep('form'); setErrorMsg(''); setSuccessMsg(''); }}
              className={`py-2 px-1 rounded-xl font-bold transition-all text-center cursor-pointer ${
                mode === 'login' 
                  ? 'bg-gradient-to-r from-rose-500 to-pink-600 text-white shadow-md' 
                  : 'text-pink-200/70 hover:text-pink-100 hover:bg-white/5'
              }`}
            >
              Log In
            </button>
            <button
              type="button"
              onClick={() => { setMode('signup'); setSignupStep('form'); setErrorMsg(''); setSuccessMsg(''); }}
              className={`py-2 px-1 rounded-xl font-bold transition-all text-center cursor-pointer ${
                mode === 'signup' 
                  ? 'bg-gradient-to-r from-rose-500 to-pink-600 text-white shadow-md' 
                  : 'text-pink-200/70 hover:text-pink-100 hover:bg-white/5'
              }`}
            >
              Sign Up
            </button>
            <button
              type="button"
              onClick={() => { setMode('guest'); setSignupStep('form'); setErrorMsg(''); setSuccessMsg(''); }}
              className={`py-2 px-1 rounded-xl font-bold transition-all text-center cursor-pointer ${
                mode === 'guest' 
                  ? 'bg-gradient-to-r from-amber-500 to-rose-500 text-white shadow-md' 
                  : 'text-amber-200/70 hover:text-amber-100 hover:bg-white/5'
              }`}
            >
              Guest 🎭
            </button>
          </div>

          {/* Alerts */}
          {errorMsg && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-3 rounded-2xl bg-rose-500/20 border border-rose-400/40 text-rose-200 text-xs flex items-center gap-2"
            >
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-300" />
              <span>{errorMsg}</span>
            </motion.div>
          )}

          {successMsg && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-3 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 text-xs flex items-center gap-2"
            >
              <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-300" />
              <span>{successMsg}</span>
            </motion.div>
          )}

          {/* OTP Verification Step for Sign Up */}
          {mode === 'signup' && signupStep === 'otp' ? (
            <div className="space-y-5">
              {/* OTP Header Card */}
              <div className="p-3.5 rounded-2xl bg-pink-500/15 border border-pink-500/30 flex items-center justify-between">
                <div className="flex items-center gap-2.5 truncate">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-rose-500 to-pink-500 flex items-center justify-center text-white shadow-md shadow-pink-500/30 shrink-0">
                    <MailCheck className="w-4 h-4" />
                  </div>
                  <div className="truncate">
                    <h4 className="text-xs font-bold text-white">Verification Code Sent</h4>
                    <p className="text-[11px] text-pink-200/80 font-mono truncate">
                      {identifier}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSignupStep('form');
                    setErrorMsg('');
                    setSuccessMsg('');
                  }}
                  className="text-[11px] text-pink-300 hover:text-white flex items-center gap-1 bg-white/10 hover:bg-white/15 px-2.5 py-1.5 rounded-xl border border-white/10 transition-colors cursor-pointer shrink-0 ml-2"
                >
                  <Edit3 className="w-3 h-3" /> Edit
                </button>
              </div>

              {/* Email Delivery Info Note */}
              <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-xs text-pink-200/80 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-pink-400 shrink-0" />
                  <p className="leading-relaxed">
                    Check your email inbox or spam folder for your confirmation code.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const newLen = otpLength === 6 ? 8 : 6;
                    setOtpLength(newLen);
                    const newArr = new Array(newLen).fill('');
                    for (let i = 0; i < newLen; i++) newArr[i] = otpDigits[i] || '';
                    setOtpDigits(newArr);
                  }}
                  className="text-[11px] text-pink-300 hover:text-white underline shrink-0 ml-2 cursor-pointer font-medium"
                >
                  {otpLength === 6 ? 'Have 8 digits?' : 'Have 6 digits?'}
                </button>
              </div>

              {/* Digit Inputs */}
              <div>
                <label className="block text-xs font-semibold text-pink-200 mb-2.5 text-center">
                  Enter {otpLength}-Digit Verification Code 💌
                </label>
                <div className="flex items-center justify-center gap-1.5 sm:gap-2 flex-wrap">
                  {otpDigits.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => { otpInputRefs.current[index] = el; }}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpDigitChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      onPaste={handleOtpPaste}
                      className="w-9 h-11 sm:w-11 sm:h-13 text-center text-lg sm:text-xl font-bold font-mono bg-black/40 border border-pink-500/40 focus:border-pink-300 focus:ring-2 focus:ring-pink-500/40 rounded-xl sm:rounded-2xl text-white outline-none transition-all shadow-inner"
                    />
                  ))}
                </div>
              </div>

              {/* Verify Button */}
              <button
                type="button"
                onClick={() => handleVerifyOtp()}
                disabled={otpLoading || otpDigits.filter(d => d.length > 0).length < 6}
                className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 hover:from-rose-600 hover:to-pink-700 text-white font-bold text-sm shadow-lg shadow-rose-500/25 flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
              >
                {otpLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verifying & Encrypting...</span>
                  </>
                ) : (
                  <>
                    <span>Verify OTP & Enter Vault 💖</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {/* Resend Timer / Action */}
              <div className="flex items-center justify-between text-xs pt-1">
                <button
                  type="button"
                  onClick={() => setSignupStep('form')}
                  className="text-pink-300/80 hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to details
                </button>

                {resendCountdown > 0 ? (
                  <span className="text-pink-200/60 text-[11px]">
                    Resend code in <strong className="text-pink-200 font-mono">{resendCountdown}s</strong>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={loading}
                    className="text-pink-300 hover:text-white font-semibold flex items-center gap-1 transition-colors cursor-pointer text-xs"
                  >
                    {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                    <span>Resend Code</span>
                  </button>
                )}
              </div>
            </div>
          ) : (mode === 'login' || mode === 'signup') && (
            <form onSubmit={handleAuthSubmit} className="space-y-4">
              {mode === 'signup' && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-pink-200">
                      Unique Name / Handle 🌸
                    </label>
                    {displayName.trim().length >= 3 && (
                      <div className="flex items-center gap-1 text-[11px]">
                        {signupUserStatus.checking ? (
                          <span className="text-pink-300 flex items-center gap-1">
                            <Loader2 className="w-3 h-3 animate-spin" />
                            Checking database...
                          </span>
                        ) : signupUserStatus.available === true ? (
                          <span className="text-emerald-300 font-medium flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            Available in database ✨
                          </span>
                        ) : signupUserStatus.available === false ? (
                          <span className="text-rose-300 font-medium flex items-center gap-1">
                            <AlertCircle className="w-3 h-3 text-rose-400" />
                            Already taken in database ❌
                          </span>
                        ) : null}
                      </div>
                    )}
                  </div>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-pink-300/60" />
                    <input
                      type="text"
                      placeholder="e.g. Juliet, angel_48, Alex"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value.replace(/[<>/"'\\;]/g, ''))}
                      className={`w-full bg-black/30 border rounded-2xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-pink-200/40 focus:outline-none focus:ring-2 transition-all ${
                        signupUserStatus.available === false
                          ? 'border-rose-500/60 focus:border-rose-400 focus:ring-rose-500/30'
                          : signupUserStatus.available === true
                          ? 'border-emerald-500/60 focus:border-emerald-400 focus:ring-emerald-500/30'
                          : 'border-pink-500/30 focus:border-pink-400 focus:ring-pink-500/30'
                      }`}
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-pink-200 mb-1">
                  {mode === 'login' ? 'Email Address or Username 💌' : 'Email Address 💌'}
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-pink-300/60" />
                  <input
                    type={mode === 'login' ? 'text' : 'email'}
                    required
                    placeholder={mode === 'login' ? 'Email, username, or guest passkey' : 'youremail@domain.com'}
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className="w-full bg-black/30 border border-pink-500/30 focus:border-pink-400 rounded-2xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-pink-200/40 focus:outline-none focus:ring-2 focus:ring-pink-500/30 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-pink-200 mb-1">
                  {mode === 'login' ? 'Password or Guest Passkey 🔒' : 'Password 🔒'}
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-pink-300/60" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    placeholder={mode === 'login' ? 'Your password or vault_xxxxxx' : 'At least 6 characters'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-black/30 border border-pink-500/30 focus:border-pink-400 rounded-2xl py-2.5 pl-10 pr-10 text-sm text-white placeholder-pink-200/40 focus:outline-none focus:ring-2 focus:ring-pink-500/30 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-pink-300/60 hover:text-pink-200 focus:outline-none cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Password Strength Indicator for Sign Up */}
                {mode === 'signup' && password && (
                  <div className="mt-2 space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-pink-200/70">
                      <span>Zero-Gap Strength:</span>
                      <span className="font-bold">{passStrength.label}</span>
                    </div>
                    <div className="w-full h-1.5 bg-black/30 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${passStrength.color} transition-all duration-300`}
                        style={{ width: `${passStrength.score}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || googleLoading || (mode === 'signup' && (signupUserStatus.available === false || signupUserStatus.checking))}
                className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 hover:from-rose-600 hover:to-pink-700 text-white font-bold text-sm shadow-lg shadow-rose-500/25 flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-60 cursor-pointer disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Please wait...</span>
                  </>
                ) : (
                  <>
                    <span>{mode === 'login' ? 'Unlock My Vault 💕' : 'Send Verification Code 💌'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {/* Divider */}
              <div className="relative flex items-center justify-center my-3">
                <div className="border-t border-white/10 w-full" />
                <span className="bg-[#1e0518] px-3 text-[11px] text-pink-200/60 uppercase tracking-wider">or</span>
                <div className="border-t border-white/10 w-full" />
              </div>

              {/* Google OAuth Button */}
              <button
                type="button"
                onClick={handleGoogleAuth}
                disabled={googleLoading || loading}
                className="w-full py-2.5 px-4 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/20 text-white text-xs font-semibold flex items-center justify-center gap-2.5 transition-all active:scale-[0.98] disabled:opacity-60 cursor-pointer backdrop-blur-md"
              >
                {googleLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-pink-300" />
                    <span>Connecting to Google...</span>
                  </>
                ) : (
                  <>
                    <GoogleIcon className="w-4 h-4" />
                    <span>Continue with Google</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* Guest Mode Content */}
          {mode === 'guest' && (
            <div className="space-y-4">
              {/* Advance Warning Box */}
              <div className="p-4 rounded-2xl bg-amber-500/15 border border-amber-400/40 text-xs text-amber-100/90 leading-relaxed space-y-2">
                <div className="flex items-center gap-2 font-bold text-amber-300">
                  <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Advance 3-Week Purge Warning ⚠️</span>
                </div>
                <p>
                  Guest accounts & confessions are temporarily saved in the vault database. After <strong className="text-amber-200">3 weeks (21 days)</strong>, guest sessions and submitted secrets will be <strong className="text-amber-300">permanently wiped</strong>.
                </p>
                <p className="text-[11px] text-pink-200/80">
                  Tip: Create a free permanent account to preserve your memories forever!
                </p>
              </div>

              {guestCredentials && (
                <div className="p-4 rounded-2xl bg-black/40 border border-pink-500/30 space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] uppercase tracking-wider text-pink-200/70 font-semibold block">
                        Guest Username (Auto-Generated or Customize)
                      </label>
                      {guestCredentials.username.length >= 3 && (
                        <div className="flex items-center gap-1 text-[11px]">
                          {guestUserStatus.checking ? (
                            <span className="text-pink-300 flex items-center gap-1">
                              <Loader2 className="w-3 h-3 animate-spin" />
                              Checking...
                            </span>
                          ) : guestUserStatus.available === true ? (
                            <span className="text-emerald-300 font-medium flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                              Unique & Available ✨
                            </span>
                          ) : guestUserStatus.available === false ? (
                            <span className="text-rose-300 font-medium flex items-center gap-1">
                              <AlertCircle className="w-3 h-3 text-rose-400" />
                              Already taken in DB ❌
                            </span>
                          ) : null}
                        </div>
                      )}
                    </div>
                    <div className="relative">
                      <User className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-pink-300/60" />
                      <input
                        type="text"
                        value={guestCredentials.username}
                        onChange={(e) => {
                          const val = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '');
                          setGuestCredentials(prev => prev ? { ...prev, username: val } : null);
                        }}
                        className={`w-full bg-black/50 border rounded-xl py-1.5 pl-8 pr-3 text-xs font-mono text-pink-200 focus:outline-none transition-all ${
                          guestUserStatus.available === false
                            ? 'border-rose-500/60 focus:border-rose-400'
                            : guestUserStatus.available === true
                            ? 'border-emerald-500/60 focus:border-emerald-400'
                            : 'border-pink-500/40 focus:border-pink-300'
                        }`}
                        placeholder="guest_your_name"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] uppercase tracking-wider text-pink-200/70 font-semibold block mb-1">
                      Temporary Passkey
                    </label>
                    <div className="relative">
                      <KeyRound className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-amber-300/60" />
                      <input
                        type="text"
                        value={guestCredentials.pass}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^a-zA-Z0-9_]/g, '');
                          setGuestCredentials(prev => prev ? { ...prev, pass: val } : null);
                        }}
                        className="w-full bg-black/50 border border-amber-500/40 rounded-xl py-1.5 pl-8 pr-3 text-xs font-mono text-amber-300 font-bold focus:outline-none focus:border-amber-300"
                        placeholder="vault_passkey"
                      />
                    </div>
                  </div>

                  <div className="pt-1 flex gap-2">
                    <button
                      type="button"
                      onClick={handleCopyGuest}
                      className="flex-1 py-2 px-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-xs text-pink-100 font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      {copiedCreds ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-300">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-pink-300" />
                          <span>Copy Credentials</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={handleRegenerateGuest}
                      className="py-2 px-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-xs text-pink-200 font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Dice5 className="w-4 h-4 text-amber-300" />
                      <span>Reroll</span>
                    </button>
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={() => setShowGuestWarningModal(true)}
                disabled={guestLoading || guestUserStatus.available === false || guestUserStatus.checking}
                className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-amber-500 via-rose-500 to-pink-500 hover:from-amber-600 hover:to-rose-600 text-white font-bold text-sm shadow-lg shadow-rose-500/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {guestLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving Temporary Session...</span>
                  </>
                ) : (
                  <>
                    <span>Enter Vault Dashboard as Guest 🎭</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          )}
        </motion.div>
      </div>

      {/* 3-Week Guest Advance Warning Modal */}
      <GuestWarningModal
        isOpen={showGuestWarningModal}
        onClose={() => {
          setShowGuestWarningModal(false);
          setGuestModalError('');
        }}
        onConfirmGuest={handleGuestSubmit}
        isLoading={guestLoading}
        error={guestModalError}
      />
    </main>
  );
}

export default function AuthPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#160312] text-pink-200">
          <Loader2 className="w-8 h-8 animate-spin text-pink-400" />
        </div>
      }
    >
      <AuthContent />
    </React.Suspense>
  );
}
