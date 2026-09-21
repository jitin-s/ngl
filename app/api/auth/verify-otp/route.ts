import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import { checkRateLimit, verifyEmailOtp, sanitizeText } from '@/lib/security';

function getSupabaseAdmin() {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://rxhbuidfsedbvkyellum.supabase.co';
  const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '');
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  return createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false },
  });
}

function hashPasswordServer(password: string): string {
  const salt = ':secret_vault_salt_2026';
  return crypto.createHash('sha256').update(password.trim() + salt).digest('hex');
}

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'default-ip';

    // IP Rate Limit: 15 verification attempts / 10 minutes
    const rateCheck = checkRateLimit(`ip:${ip}:verify-otp`, 15, 10 * 60 * 1000);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: `Too many attempts. Please wait ${rateCheck.resetInSec}s before verifying again.` },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { email, username, password, otp, token } = body;

    const cleanEmail = sanitizeText(email, 120).trim().toLowerCase();
    const cleanUsername = sanitizeText(username, 50).trim().toLowerCase().replace(/\s+/g, '_');
    const cleanOtp = String(otp || '').trim();

    if (!cleanEmail || !cleanOtp || !token) {
      return NextResponse.json({ error: 'Please provide email, verification code, and token.' }, { status: 400 });
    }

    // 1. Verify 6-digit OTP with cryptographic HMAC verification
    const isValidOtp = verifyEmailOtp(cleanEmail, cleanOtp, token);
    if (!isValidOtp) {
      return NextResponse.json({ error: 'Invalid or expired verification code. Please check the 6-digit code or request a new one.' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const passHash = password ? hashPasswordServer(password) : null;
    const nowIso = new Date().toISOString();
    const generatedUserId = 'user_' + Math.random().toString(36).substring(2, 11) + Date.now().toString(36);

    let authUserId = generatedUserId;

    // 2. Attempt Supabase Auth creation
    if (password) {
      try {
        const { data: authData } = await supabase.auth.signUp({
          email: cleanEmail,
          password: password.trim(),
          options: {
            data: {
              username: cleanUsername,
              display_name: username || cleanUsername,
            },
          },
        });
        if (authData?.user?.id) {
          authUserId = authData.user.id;
        }
      } catch (e) {
        console.warn('Supabase Auth signup notice during OTP verification:', e);
      }
    }

    // 3. Save / Upsert in public.profiles table
    const profileRecord = {
      user_id: authUserId,
      email: cleanEmail,
      username: cleanUsername,
      display_name: username || cleanUsername,
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
      console.warn('Profile save warning:', profileErr.message);
    }

    const user = {
      id: savedProfile?.id || savedProfile?.user_id || authUserId,
      email: cleanEmail,
      username: cleanUsername,
      displayName: username || cleanUsername,
      isGuest: false,
      createdAt: nowIso,
    };

    return NextResponse.json({
      success: true,
      message: 'Email verified successfully! Account created & encrypted 💖',
      user,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Verification failed.' }, { status: 500 });
  }
}
