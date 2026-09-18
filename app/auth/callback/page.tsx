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
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          console.error('Auth callback error:', error);
        }
      } catch (e) {
        console.error('Session retrieval error:', e);
      } finally {
        router.push('/');
      }
    };

    handleCallback();
  }, [router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-[#3b0824] via-[#1a0515] to-[#0d020a] text-white p-4">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="relative">
          <Heart className="w-12 h-12 text-pink-400 animate-pulse" />
          <Loader2 className="w-6 h-6 text-rose-300 animate-spin absolute -bottom-1 -right-1" />
        </div>
        <h2 className="text-xl font-bold bg-gradient-to-r from-pink-200 via-rose-300 to-amber-200 bg-clip-text text-transparent">
          Signing you into Secret Feelings Vault...
        </h2>
        <p className="text-pink-200/70 text-sm">Please wait a tiny moment 🌸</p>
      </div>
    </div>
  );
}
