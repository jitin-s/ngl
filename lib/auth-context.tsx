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

export interface RegisteredUser {
  id: string;
  email: string;
  username: string;
  displayName: string;
  isGuest: false;
  createdAt?: string;
}

export interface AuthUser {
  id: string;
  email?: string;
  displayName: string;
  username?: string;
  isGuest: boolean;
  temporaryPass?: string;
  expiresAt?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  supabaseUser: User | null;
  isLoading: boolean;
  guestUser: GuestUser | null;
  registeredUser: RegisteredUser | null;
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

// Client-side SHA-256 password hasher with salt
async function hashPassword(password: string): Promise<string> {
  try {
    if (typeof window !== 'undefined' && window.crypto?.subtle) {
      const encoder = new TextEncoder();
      const data = encoder.encode(password.trim() + ':secret_vault_salt_2026');
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }
  } catch (e) {
    console.warn('Crypto subtle unavailable, using fallback', e);
  }
  // Simple deterministic fallback if crypto is not available
  let hash = 0;
  const str = password.trim() + ':secret_vault_salt_2026';
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return 'fallback_' + Math.abs(hash).toString(16);
}

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
  const [registeredUser, setRegisteredUser] = useState<RegisteredUser | null>(null);
  const [guestUser, setGuestUser] = useState<GuestUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Trigger background cleanup of expired guest sessions and confessions older than 3 weeks
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
      console.warn('Background cleanup notice:', e);
    }
  };

  // Initialize auth sessions on mount
  useEffect(() => {
    const getInitialSession = async () => {
      try {
        // 1. Check active Supabase Auth session
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setSupabaseUser(session.user);
          // Try to sync with profiles table
          try {
            const { data: profile } = await supabase
              .from('profiles')
              .select('*')
              .eq('email', session.user.email?.toLowerCase())
              .maybeSingle();

            if (profile) {
              setRegisteredUser({
                id: profile.user_id || session.user.id,
                email: profile.email,
                username: profile.username,
                displayName: profile.display_name || profile.username,
                isGuest: false,
                createdAt: profile.created_at,
              });
            }
          } catch (e) {}
        } else {
          // 2. Check for locally saved registered permanent user session
          const savedRegistered = localStorage.getItem('vault_registered_session');
          if (savedRegistered) {
            try {
              const parsed: RegisteredUser = JSON.parse(savedRegistered);
              if (parsed && parsed.email) {
                setRegisteredUser(parsed);
                // Revalidate with profiles table in background
                supabase
                  .from('profiles')
                  .select('*')
                  .eq('email', parsed.email.toLowerCase())
                  .maybeSingle()
                  .then(({ data }) => {
                    if (data) {
                      setRegisteredUser({
                        id: data.user_id || data.id,
                        email: data.email,
                        username: data.username,
                        displayName: data.display_name || data.username,
                        isGuest: false,
                        createdAt: data.created_at,
                      });
                    }
                  });
              }
            } catch (e) {
              console.error('Failed to parse registered session', e);
            }
          } else {
            // 3. Check for saved guest session if no registered user
            const savedGuest = localStorage.getItem('vault_guest_session');
            if (savedGuest) {
              try {
                const parsed: GuestUser = JSON.parse(savedGuest);
                const now = new Date();
                const expiryDate = parsed.expiresAt ? new Date(parsed.expiresAt) : new Date(new Date(parsed.createdAt).getTime() + THREE_WEEKS_MS);

                if (now >= expiryDate) {
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
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
      } finally {
        setIsLoading(false);
      }

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

  // Check if a username is available in the database (across profiles and guest sessions)
  const checkUsernameAvailable = async (username: string, excludeGuestId?: string): Promise<{ available: boolean; message: string }> => {
    const clean = username.trim().toLowerCase().replace(/[<>/"']/g, '');
    if (!clean || clean.length < 3) {
      return { available: false, message: 'Username must be at least 3 characters long' };
    }

    try {
      // 1. Try checking via database RPC function
      const { data: rpcResult, error: rpcError } = await supabase.rpc('check_username_availability', {
        check_username: clean,
        exclude_guest_id: excludeGuestId || null,
      });

      if (!rpcError && typeof rpcResult === 'boolean') {
        if (!rpcResult) {
          return { available: false, message: `Username "${clean}" is already taken! 🌸 Please pick another.` };
        }
        return { available: true, message: `Username "${clean}" is available! ✨` };
      }

      // 2. Direct table check on profiles table
      const { data: profileMatch } = await supabase
        .from('profiles')
        .select('id')
        .ilike('username', clean)
        .maybeSingle();

      if (profileMatch) {
        return { available: false, message: `Username "${clean}" is already registered! 🌸 Please pick another.` };
      }

      // 3. Direct table check on guest_sessions table
      const { data: guestMatch } = await supabase
        .from('guest_sessions')
        .select('guest_id, expires_at')
        .ilike('username', clean)
        .maybeSingle();

      if (guestMatch) {
        if (!excludeGuestId || guestMatch.guest_id !== excludeGuestId) {
          const now = new Date();
          const exp = new Date(guestMatch.expires_at || 0);
          if (now < exp) {
            return { available: false, message: `Username "${clean}" is already in use! 🌸 Please pick another.` };
          }
        }
      }

      return { available: true, message: `Username "${clean}" is available! ✨` };
    } catch (err) {
      return { available: true, message: `Username "${clean}" is available! ✨` };
    }
  };

  const generateNewGuestCredentials = () => {
    return generateGuestCredentials();
  };

  // Login as Guest and save credentials to database
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

    localStorage.setItem('vault_guest_session', JSON.stringify(newGuest));
    localStorage.removeItem('vault_registered_session');
    setGuestUser(newGuest);
    setRegisteredUser(null);
    setSupabaseUser(null);

    // Save to guest_sessions table in Supabase
    try {
      await supabase.from('guest_sessions').upsert(
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
    } catch (e) {
      console.warn('Guest session DB sync notice:', e);
    }

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
        localStorage.removeItem('vault_registered_session');
        setGuestUser(restoredGuest);
        setRegisteredUser(null);
        setSupabaseUser(null);
        return { success: true };
      }

      return { success: false, error: 'Invalid guest credentials. Please check your username and passkey.' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to authenticate guest session.' };
    }
  };

  // Sign Up with Email & Username (Permanent Account)
  const signUpWithEmail = async (email: string, pass: string, name: string) => {
    try {
      const cleanEmail = email.trim().toLowerCase();
      const cleanPass = pass.trim();
      const cleanName = name.trim();
      const cleanUsername = cleanName.toLowerCase().replace(/\s+/g, '_');

      if (!cleanEmail || !cleanPass || !cleanName) {
        return { success: false, error: 'Please provide an email, username, and password.' };
      }

      // Check username availability
      const check = await checkUsernameAvailable(cleanUsername);
      if (!check.available) {
        return { success: false, error: check.message };
      }

      // Check if email already exists in profiles
      const { data: existingEmail } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', cleanEmail)
        .maybeSingle();

      if (existingEmail) {
        return { success: false, error: 'An account with this email address already exists! Please log in instead.' };
      }

      const passHash = await hashPassword(cleanPass);
      const nowIso = new Date().toISOString();
      const generatedUserId = 'user_' + Math.random().toString(36).substring(2, 11) + Date.now().toString(36);

      // Attempt Supabase Auth signup
      let authUserId = generatedUserId;
      try {
        const { data: authData } = await supabase.auth.signUp({
          email: cleanEmail,
          password: cleanPass,
          options: {
            data: {
              display_name: cleanName,
              username: cleanUsername,
            },
          },
        });
        if (authData?.user?.id) {
          authUserId = authData.user.id;
          setSupabaseUser(authData.user);
        }
      } catch (e) {
        console.warn('Supabase Auth signup notice (proceeding with profile creation):', e);
      }

      // Insert record into public.profiles table
      const profileRecord = {
        user_id: authUserId,
        email: cleanEmail,
        username: cleanUsername,
        display_name: cleanName,
        password_hash: passHash,
        created_at: nowIso,
        last_sign_in_at: nowIso,
      };

      const { data: savedProfile, error: profileErr } = await supabase
        .from('profiles')
        .upsert([profileRecord], { onConflict: 'email' })
        .select()
        .maybeSingle();

      if (profileErr) {
        console.warn('Profile table insert warning:', profileErr.message);
      }

      const newRegisteredUser: RegisteredUser = {
        id: savedProfile?.id || savedProfile?.user_id || authUserId,
        email: cleanEmail,
        username: cleanUsername,
        displayName: cleanName,
        isGuest: false,
        createdAt: nowIso,
      };

      // Save persistent registered session
      localStorage.setItem('vault_registered_session', JSON.stringify(newRegisteredUser));
      localStorage.removeItem('vault_guest_session');
      setRegisteredUser(newRegisteredUser);
      setGuestUser(null);

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'An unexpected error occurred during signup.' };
    }
  };

  // Sign In with Email
  const signInWithEmail = async (email: string, pass: string) => {
    return signIn(email, pass);
  };

  // Unified Sign In (Works with Email Address, Registered Username, OR Guest Username!)
  const signIn = async (identifier: string, pass: string): Promise<{ success: boolean; error?: string }> => {
    const cleanId = identifier.trim();
    const cleanPass = pass.trim();

    if (!cleanId || !cleanPass) {
      return { success: false, error: 'Please enter your email/username and password.' };
    }

    try {
      const isEmail = cleanId.includes('@');
      const inputHash = await hashPassword(cleanPass);

      // 1. Check public.profiles for registered permanent user account (by email or username)
      let profileQuery = supabase.from('profiles').select('*');
      if (isEmail) {
        profileQuery = profileQuery.eq('email', cleanId.toLowerCase());
      } else {
        profileQuery = profileQuery.ilike('username', cleanId.toLowerCase());
      }

      const { data: profile, error: profileError } = await profileQuery.maybeSingle();

      if (!profileError && profile) {
        // Verify password
        const storedHash = profile.password_hash;
        const matches = storedHash ? (storedHash === inputHash) : true;

        // Also attempt background Supabase Auth sign in
        if (profile.email) {
          try {
            const { data: authData } = await supabase.auth.signInWithPassword({
              email: profile.email,
              password: cleanPass,
            });
            if (authData?.user) {
              setSupabaseUser(authData.user);
            }
          } catch (e) {
            // Supabase auth email confirmation bypass fallback
          }
        }

        if (matches) {
          const permanentUser: RegisteredUser = {
            id: profile.user_id || profile.id,
            email: profile.email,
            username: profile.username,
            displayName: profile.display_name || profile.username,
            isGuest: false,
            createdAt: profile.created_at,
          };

          localStorage.setItem('vault_registered_session', JSON.stringify(permanentUser));
          localStorage.removeItem('vault_guest_session');
          setRegisteredUser(permanentUser);
          setGuestUser(null);

          // Update last sign in timestamp
          supabase.from('profiles').update({ last_sign_in_at: new Date().toISOString() }).eq('id', profile.id);

          return { success: true };
        } else {
          return { success: false, error: 'Incorrect password. Please verify your password and try again.' };
        }
      }

      // 2. If not found in profiles, try direct Supabase Auth (for users created via Supabase dashboard / OAuth)
      if (isEmail) {
        try {
          const { data: authRes, error: authErr } = await supabase.auth.signInWithPassword({
            email: cleanId.toLowerCase(),
            password: cleanPass,
          });

          if (!authErr && authRes?.user) {
            setSupabaseUser(authRes.user);
            const permanentUser: RegisteredUser = {
              id: authRes.user.id,
              email: authRes.user.email || cleanId,
              username: authRes.user.user_metadata?.username || cleanId.split('@')[0],
              displayName: authRes.user.user_metadata?.display_name || authRes.user.user_metadata?.name || cleanId.split('@')[0],
              isGuest: false,
            };
            localStorage.setItem('vault_registered_session', JSON.stringify(permanentUser));
            localStorage.removeItem('vault_guest_session');
            setRegisteredUser(permanentUser);
            setGuestUser(null);
            return { success: true };
          }
        } catch (e) {}
      }

      // 3. If identifier is not found in profiles, check guest_sessions table
      const guestRes = await signInWithGuest(cleanId, cleanPass);
      if (guestRes.success) {
        return { success: true };
      }

      return {
        success: false,
        error: isEmail
          ? 'No account found with this email. Please check your spelling or sign up.'
          : 'Invalid username or password. Please verify your credentials or sign up.',
      };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to authenticate. Please try again.' };
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

  // Logout - Clears all sessions
  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.error('Sign out error', e);
    }
    localStorage.removeItem('vault_registered_session');
    localStorage.removeItem('vault_guest_session');
    setSupabaseUser(null);
    setRegisteredUser(null);
    setGuestUser(null);
  };

  // Active unified user resolution (Priority: Registered Permanent User > Supabase Auth User > Guest User)
  const activeUser: AuthUser | null = registeredUser
    ? {
        id: registeredUser.id,
        email: registeredUser.email,
        username: registeredUser.username,
        displayName: registeredUser.displayName || registeredUser.username,
        isGuest: false,
      }
    : supabaseUser
    ? {
        id: supabaseUser.id,
        email: supabaseUser.email,
        username: supabaseUser.user_metadata?.username || supabaseUser.email?.split('@')[0],
        displayName: supabaseUser.user_metadata?.display_name || supabaseUser.user_metadata?.name || supabaseUser.email?.split('@')[0] || 'Dear Lover',
        isGuest: false,
      }
    : guestUser
    ? {
        id: guestUser.id,
        username: guestUser.username,
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
        registeredUser,
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

