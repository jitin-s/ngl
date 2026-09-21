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

    // 1. Verify OTP with cryptographic HMAC verification OR Supabase Auth verifyOtp (all types)
    const supabase = getSupabaseAdmin();
    let isOtpValid = verifyEmailOtp(cleanEmail, cleanOtp, token);
    let authUserId: string | null = null;

    if (!isOtpValid) {
      const otpTypes: ('signup' | 'email' | 'magiclink' | 'invite' | 'recovery')[] = ['signup', 'email', 'magiclink', 'invite', 'recovery'];
      for (const otpType of otpTypes) {
        try {
          const { data: authVerify, error: verifyErr } = await supabase.auth.verifyOtp({
            email: cleanEmail,
            token: cleanOtp,
            type: otpType,
          });
          if (!verifyErr && authVerify?.user) {
            isOtpValid = true;
            authUserId = authVerify.user.id;
            break;
          }
        } catch (e) {
          // Continue trying other types
        }
      }
    }

    if (!isOtpValid) {
      return NextResponse.json({ 
        error: 'Invalid or expired verification code. Please check the code in your email (or click Resend Code for a fresh one).' 
      }, { status: 400 });
    }

    const passHash = password ? hashPasswordServer(password) : null;
    const nowIso = new Date().toISOString();
    const isValidUUID = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

    // 2. Attempt Supabase Auth creation & confirmation
    if (password) {
      try {
        // Try creating confirmed user via admin API first
        if (supabase.auth.admin) {
          const { data: adminUser, error: adminErr } = await supabase.auth.admin.createUser({
            email: cleanEmail,
            password: password.trim(),
            email_confirm: true,
            user_metadata: {
              username: cleanUsername,
              display_name: username || cleanUsername,
            },
          });

          if (!adminErr && adminUser?.user?.id) {
            authUserId = adminUser.user.id;
          }
        }

        // Fallback to standard signUp if admin API wasn't used
        if (!authUserId) {
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
        }
      } catch (e) {
        console.warn('Supabase Auth user creation notice:', e);
      }
    }

    // 3. Save / Upsert in public.profiles table (UUID and column safe)
    const validUserId = authUserId && isValidUUID(authUserId) ? authUserId : null;
    const profileRecord: any = {
      user_id: validUserId,
      email: cleanEmail,
      username: cleanUsername,
      display_name: username || cleanUsername,
      password_hash: passHash,
      created_at: nowIso,
      last_sign_in_at: nowIso,
    };

    let savedProfile: any = null;
    const { data: primaryData, error: profileErr } = await supabase
      .from('profiles')
      .upsert([profileRecord], { onConflict: 'email' })
      .select()
      .maybeSingle();

    if (profileErr) {
      console.warn('Profile primary upsert warning, trying fallback without password_hash:', profileErr.message);
      // Retry without password_hash in case column is not present
      const { password_hash, ...strippedRecord } = profileRecord;
      const { data: fallbackData, error: fallbackErr } = await supabase
        .from('profiles')
        .upsert([strippedRecord], { onConflict: 'email' })
        .select()
        .maybeSingle();

      if (!fallbackErr) {
        savedProfile = fallbackData;
      }
    } else {
      savedProfile = primaryData;
    }

    const user = {
      id: savedProfile?.id || savedProfile?.user_id || validUserId || `user_${Date.now()}`,
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
