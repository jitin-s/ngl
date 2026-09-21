'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Loader2, Heart } from 'lucide-react';

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('Auth callback error:', error);
        } else if (session?.user) {
          const user = session.user;
          const email = (user.email || '').toLowerCase().trim();
          const name = user.user_metadata?.full_name || user.user_metadata?.name || email.split('@')[0] || 'Dear Lover';
          const cleanUsername = (user.user_metadata?.username || user.user_metadata?.preferred_username || email.split('@')[0] || 'user').toLowerCase().replace(/[^a-z0-9_]/g, '_');
          const nowIso = new Date().toISOString();

          // Check if profile exists
          let resolvedProfile: any = null;
          try {
            const { data: existingProfile } = await supabase
              .from('profiles')
              .select('*')
              .eq('email', email)
              .maybeSingle();

            if (existingProfile) {
              resolvedProfile = existingProfile;
              // Update last login & user_id
              await supabase
                .from('profiles')
                .update({ user_id: user.id, last_sign_in_at: nowIso })
                .eq('id', existingProfile.id);
            } else {
              // Create new profile record for Google User
              const newProfileRecord = {
                user_id: user.id,
                email,
                username: cleanUsername,
                display_name: name,
                created_at: nowIso,
                last_sign_in_at: nowIso,
              };

              const { data: createdProfile } = await supabase
                .from('profiles')
                .insert([newProfileRecord])
                .select()
                .maybeSingle();

              resolvedProfile = createdProfile || newProfileRecord;
            }
          } catch (profileErr) {
            console.warn('Profile sync notice during OAuth callback:', profileErr);
          }

          // Save registered session to localStorage
          const savedSession = {
            id: resolvedProfile?.id || resolvedProfile?.user_id || user.id,
            email,
            username: resolvedProfile?.username || cleanUsername,
            displayName: resolvedProfile?.display_name || name,
            isGuest: false,
            createdAt: resolvedProfile?.created_at || nowIso,
          };

          localStorage.setItem('vault_registered_session', JSON.stringify(savedSession));
          localStorage.removeItem('vault_guest_session');
        }
      } catch (e) {
        console.error('Session retrieval error:', e);
      } finally {
        setTimeout(() => {
          if (typeof window !== 'undefined') {
            window.location.href = '/';
          } else {
            router.push('/');
          }
        }, 400);
      }
    };

    handleCallback();
  }, [router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-[#3b0824] via-[#1a0515] to-[#0d020a] text-white p-4">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-xl shadow-pink-500/40 border border-pink-500/40 bg-black/60">
            <img
              src="/logo.jpg"
              alt="nglcrush logo"
              className="w-full h-full object-cover"
            />
          </div>
          <Loader2 className="w-6 h-6 text-rose-300 animate-spin absolute -bottom-2 -right-2 bg-black/80 rounded-full p-0.5 border border-pink-500/30 shadow-md" />
        </div>
        <h2 className="text-xl font-bold bg-gradient-to-r from-pink-200 via-rose-300 to-amber-200 bg-clip-text text-transparent">
          Signing you into nglcrush...
        </h2>
        <p className="text-pink-200/70 text-sm">Please wait a tiny moment 🌸</p>
      </div>
    </div>
  );
}
