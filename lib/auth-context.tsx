'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from './supabase';

export interface GuestUser {
  id: string;
  username: string;
  temporaryPass: string;
  isGuest: true;
  createdAt: string;
  expiresAt: string;
}

export interface AuthUser {
  id: string;
  email?: string;
  displayName: string;
  isGuest: boolean;
  temporaryPass?: string;
  expiresAt?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  supabaseUser: User | null;
  isLoading: boolean;
  guestUser: GuestUser | null;
  loginAsGuest: (customCreds?: { id?: string; username?: string; pass?: string; expiresAt?: string }) => Promise<GuestUser>;
  signIn: (identifier: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  signInWithGuest: (username: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  signUpWithEmail: (email: string, pass: string, name: string) => Promise<{ success: boolean; error?: string }>;
  signInWithEmail: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  signInWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  generateNewGuestCredentials: () => { username: string; pass: string; id: string; expiresAt: string };
  checkUsernameAvailable: (username: string, excludeGuestId?: string) => Promise<{ available: boolean; message: string }>;
  cleanExpiredData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ADJECTIVES = ['sweet', 'cozy', 'starlight', 'cupid', 'velvet', 'blush', 'angel', 'honey', 'sparkle', 'cloud', 'rose', 'serenade'];
const NOUNS = ['dreamer', 'whisper', 'heart', 'petal', 'glow', 'charm', 'poet', 'secret', 'moon', 'breeze', 'butterfly', 'spark'];

// 3 Weeks = 21 days in milliseconds
const THREE_WEEKS_MS = 21 * 24 * 60 * 60 * 1000;

function generateGuestCredentials() {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  const num = Math.floor(1000 + Math.random() * 9000);
  const passNum = Math.floor(100000 + Math.random() * 900000);
  const randomId = 'guest_' + Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + THREE_WEEKS_MS).toISOString();
  
  return {
    id: randomId,
    username: `guest_${adj}_${noun}_${num}`,
    pass: `vault_${passNum}`,
    expiresAt,
  };
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [supabaseUser, setSupabaseUser] = useState<User | null>(null);
  const [guestUser, setGuestUser] = useState<GuestUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Trigger cleanup of expired guest sessions and confessions older than 3 weeks
  const cleanExpiredData = async () => {
    try {
      const nowIso = new Date().toISOString();
      const threeWeeksAgo = new Date(Date.now() - THREE_WEEKS_MS).toISOString();

      // 1. Clean expired guest sessions
      await supabase
        .from('guest_sessions')
        .delete()
        .or(`expires_at.lt.${nowIso},created_at.lt.${threeWeeksAgo}`);

      // 2. Clean expired guest submissions
      await supabase
        .from('crush_submissions')
        .delete()
        .eq('account_type', 'guest')
        .lt('created_at', threeWeeksAgo);
    } catch (e) {
      // Non-blocking background cleanup
      console.warn('Background cleanup notice:', e);
    }
  };

  // Initialize auth & stored guest session with 3-week expiration check
  useEffect(() => {
    const getInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setSupabaseUser(session.user);
        } else {
          // Check for saved guest session if no supabase user
          const savedGuest = localStorage.getItem('vault_guest_session');
          if (savedGuest) {
            try {
              const parsed: GuestUser = JSON.parse(savedGuest);
              const now = new Date();
              const expiryDate = parsed.expiresAt ? new Date(parsed.expiresAt) : new Date(new Date(parsed.createdAt).getTime() + THREE_WEEKS_MS);

              // If expired past 3 weeks, wipe local guest session
              if (now >= expiryDate) {
                console.info('Temporary 3-week guest session has expired. Clearing session.');
                localStorage.removeItem('vault_guest_session');
                setGuestUser(null);
              } else {
                setGuestUser({
                  ...parsed,
                  expiresAt: expiryDate.toISOString(),
                });
              }
            } catch (e) {
              console.error('Failed to parse guest session', e);
            }
          }
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
      } finally {
        setIsLoading(false);
      }

      // Run background cleanup for expired database sessions
      cleanExpiredData();
    };

    getInitialSession();

    // Listen to Supabase auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setSupabaseUser(session.user);
        setGuestUser(null);
      } else {
        setSupabaseUser(null);
      }
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Check if a username is available in the database (checking guest sessions and registered users)
  const checkUsernameAvailable = async (username: string, excludeGuestId?: string): Promise<{ available: boolean; message: string }> => {
    const clean = username.trim().toLowerCase().replace(/[<>/"']/g, '');
    if (!clean || clean.length < 3) {
      return { available: false, message: 'Username must be at least 3 characters long' };
    }

    try {
      // 1. Try checking via database RPC function with 2.5s timeout
      const rpcPromise = supabase.rpc('check_username_availability', {
        check_username: clean,
        exclude_guest_id: excludeGuestId || null,
      });

      const timeoutPromise = new Promise<{ data: null; error: Error }>((resolve) =>
        setTimeout(() => resolve({ data: null, error: new Error('timeout') }), 2500)
      );

      const { data: rpcResult, error: rpcError } = (await Promise.race([rpcPromise, timeoutPromise])) as any;

      if (!rpcError && typeof rpcResult === 'boolean') {
        if (!rpcResult) {
          return { available: false, message: `Username "${clean}" is already taken! 🌸 Please pick another.` };
        }
        return { available: true, message: `Username "${clean}" is available! ✨` };
      }

      // 2. Direct table check on guest_sessions table
      const { data: guestMatch, error } = await supabase
        .from('guest_sessions')
        .select('guest_id, expires_at')
        .ilike('username', clean)
        .maybeSingle();

      if (!error && guestMatch) {
        if (!excludeGuestId || guestMatch.guest_id !== excludeGuestId) {
          const now = new Date();
          const exp = new Date(guestMatch.expires_at || 0);
          if (now < exp) {
            return { available: false, message: `Username "${clean}" is already taken in the database! 🌸 Please pick another.` };
          }
        }
      }

      return { available: true, message: `Username "${clean}" is available! ✨` };
    } catch (err) {
      return { available: true, message: 'Username format is valid ✨' };
    }
  };

  // Generate Guest credentials
  const generateNewGuestCredentials = () => {
    return generateGuestCredentials();
  };

  // Login as Guest and save credentials to database with 3-week expiration
  const loginAsGuest = async (customCreds?: { id?: string; username?: string; pass?: string; expiresAt?: string }): Promise<GuestUser> => {
    const creds = customCreds?.username && customCreds?.pass
      ? {
          id: customCreds.id || ('guest_' + Math.random().toString(36).substring(2, 11) + Date.now().toString(36)),
          username: customCreds.username.trim().toLowerCase(),
          pass: customCreds.pass.trim(),
          expiresAt: customCreds.expiresAt || new Date(Date.now() + THREE_WEEKS_MS).toISOString(),
        }
      : generateGuestCredentials();

    const nowIso = new Date().toISOString();
    const newGuest: GuestUser = {
      id: creds.id,
      username: creds.username,
      temporaryPass: creds.pass,
      isGuest: true,
      createdAt: nowIso,
      expiresAt: creds.expiresAt,
    };

    // 1. Save locally immediately so user is authenticated without delay
    localStorage.setItem('vault_guest_session', JSON.stringify(newGuest));
    setGuestUser(newGuest);
    setSupabaseUser(null);

    // 2. Asynchronously sync temporary guest login credentials in Supabase database
    (async () => {
      try {
        const { error } = await supabase.from('guest_sessions').upsert(
          [
            {
              guest_id: creds.id,
              username: creds.username,
              temporary_pass: creds.pass,
              created_at: nowIso,
              expires_at: creds.expiresAt,
            },
          ],
          { onConflict: 'guest_id' }
        );
        if (error) {
          console.warn('Guest session background sync notice:', error.message);
        }
      } catch (e) {
        console.warn('Guest session DB network notice:', e);
      }
    })();

    return newGuest;
  };

  // Sign in using Guest Username & Passkey
  const signInWithGuest = async (username: string, pass: string): Promise<{ success: boolean; error?: string }> => {
    const cleanUser = username.trim().toLowerCase();
    const cleanPass = pass.trim();

    if (!cleanUser || !cleanPass) {
      return { success: false, error: 'Please enter both your guest username and passkey.' };
    }

    try {
      // 1. Check database for matching guest credentials
      const { data, error } = await supabase
        .from('guest_sessions')
        .select('*')
        .ilike('username', cleanUser)
        .eq('temporary_pass', cleanPass)
        .maybeSingle();

      if (!error && data) {
        const now = new Date();
        const expiryDate = data.expires_at ? new Date(data.expires_at) : new Date(new Date(data.created_at).getTime() + THREE_WEEKS_MS);

        if (now >= expiryDate) {
          return { success: false, error: 'This temporary guest session has expired after 3 weeks. Please generate a new guest pass.' };
        }

        const restoredGuest: GuestUser = {
          id: data.guest_id,
          username: data.username,
          temporaryPass: data.temporary_pass,
          isGuest: true,
          createdAt: data.created_at,
          expiresAt: expiryDate.toISOString(),
        };

        localStorage.setItem('vault_guest_session', JSON.stringify(restoredGuest));
        setGuestUser(restoredGuest);
        setSupabaseUser(null);
        return { success: true };
      }

      // 2. Check local storage fallback if network/db table is being initialized
      const saved = localStorage.getItem('vault_guest_session');
      if (saved) {
        try {
          const parsed: GuestUser = JSON.parse(saved);
          if (parsed.username.toLowerCase() === cleanUser && parsed.temporaryPass.trim() === cleanPass) {
            setGuestUser(parsed);
            setSupabaseUser(null);
            return { success: true };
          }
        } catch (e) {}
      }

      return { success: false, error: 'Invalid guest username or passkey. Please check your credentials or generate a new guest identity.' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to authenticate guest session.' };
    }
  };

  // Unified Sign In (Works with Email Address OR Guest Username)
  const signIn = async (identifier: string, pass: string): Promise<{ success: boolean; error?: string }> => {
    const cleanIdentifier = identifier.trim();
    if (cleanIdentifier.includes('@')) {
      return signInWithEmail(cleanIdentifier, pass);
    } else {
      return signInWithGuest(cleanIdentifier, pass);
    }
  };

  // Sign Up with Email
  const signUpWithEmail = async (email: string, pass: string, name: string) => {
    try {
      const cleanName = name.trim();
      const check = await checkUsernameAvailable(cleanName);
      if (!check.available) {
        return { success: false, error: check.message };
      }

      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password: pass,
        options: {
          data: {
            display_name: cleanName,
            nickname: cleanName,
          },
        },
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.user) {
        setSupabaseUser(data.user);
        setGuestUser(null);
        localStorage.removeItem('vault_guest_session');
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'An unexpected error occurred during signup.' };
    }
  };

  // Sign In with Email
  const signInWithEmail = async (email: string, pass: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password: pass,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.user) {
        setSupabaseUser(data.user);
        setGuestUser(null);
        localStorage.removeItem('vault_guest_session');
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'An unexpected error occurred during login.' };
    }
  };

  // Google OAuth Sign In
  const signInWithGoogle = async () => {
    try {
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${origin}/auth/callback`,
        },
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to initiate Google login.' };
    }
  };

  // Logout
  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.error('Sign out error', e);
    }
    localStorage.removeItem('vault_guest_session');
    setSupabaseUser(null);
    setGuestUser(null);
  };

  // Unified active user model
  const activeUser: AuthUser | null = supabaseUser
    ? {
        id: supabaseUser.id,
        email: supabaseUser.email,
        displayName: supabaseUser.user_metadata?.display_name || supabaseUser.user_metadata?.name || supabaseUser.email?.split('@')[0] || 'Dear Lover',
        isGuest: false,
      }
    : guestUser
    ? {
        id: guestUser.id,
        displayName: guestUser.username,
        temporaryPass: guestUser.temporaryPass,
        expiresAt: guestUser.expiresAt,
        isGuest: true,
      }
    : null;

  return (
    <AuthContext.Provider
      value={{
        user: activeUser,
        supabaseUser,
        guestUser,
        isLoading,
        loginAsGuest,
        signIn,
        signInWithGuest,
        signUpWithEmail,
        signInWithEmail,
        signInWithGoogle,
        logout,
        generateNewGuestCredentials,
        checkUsernameAvailable,
        cleanExpiredData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
