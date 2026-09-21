import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { checkRateLimit, generateEmailOtp, sanitizeText } from '@/lib/security';

function getSupabaseAdmin() {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://rxhbuidfsedbvkyellum.supabase.co';
  const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '');
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  return createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false },
  });
}

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'default-ip';

    // IP Rate Limit: 10 OTP requests / 10 minutes
    const rateCheck = checkRateLimit(`ip:${ip}:send-otp`, 10, 10 * 60 * 1000);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: `Too many verification requests. Please wait ${rateCheck.resetInSec}s before requesting again.` },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { email, username } = body;

    const cleanEmail = sanitizeText(email, 120).trim().toLowerCase();
    const cleanUsername = sanitizeText(username, 50).trim().toLowerCase().replace(/\s+/g, '_');

    if (!cleanEmail || !cleanEmail.includes('@') || cleanEmail.length < 5) {
      return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
    }

    if (!cleanUsername || cleanUsername.length < 3) {
      return NextResponse.json({ error: 'Username must be at least 3 characters long.' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // 1. Check if username is already registered in profiles
    const { data: profileWithUsername } = await supabase
      .from('profiles')
      .select('id')
      .ilike('username', cleanUsername)
      .maybeSingle();

    if (profileWithUsername) {
      return NextResponse.json({ error: `Username "${cleanUsername}" is already registered! Please pick another.` }, { status: 400 });
    }

    // 2. Check if email is already registered in profiles
    const { data: profileWithEmail } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', cleanEmail)
      .maybeSingle();

    if (profileWithEmail) {
      return NextResponse.json({ error: 'An account with this email address already exists! Please log in instead.' }, { status: 400 });
    }

    // 3. Generate cryptographic 6-digit OTP and HMAC signed token
    const { otp, token, expiresAt } = generateEmailOtp(cleanEmail);

    // 4. Send email via Supabase Auth OTP service (if enabled)
    try {
      await supabase.auth.signInWithOtp({
        email: cleanEmail,
        options: {
          shouldCreateUser: true,
          data: {
            username: cleanUsername,
            display_name: username,
          },
        },
      });
    } catch (e) {
      console.warn('Supabase Auth OTP dispatch notice:', e);
    }

    return NextResponse.json({
      success: true,
      message: `A 6-digit verification code has been sent to ${cleanEmail}! Please check your inbox.`,
      token,
      expiresAt,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to send verification code.' }, { status: 500 });
  }
}
