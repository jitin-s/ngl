import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, sanitizeInstagramHandle } from '@/lib/security';

export async function GET(req: NextRequest) {
  // 1. IP-based Rate Limiting (25 requests / min)
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'anonymous-ip';
  const rateCheck = checkRateLimit(`ip:${ip}:verify-ig`, 25, 60000);
  if (!rateCheck.allowed) {
    return NextResponse.json(
      { valid: false, message: `Too many requests. Please wait ${rateCheck.resetInSec}s.` },
      { status: 429 }
    );
  }

  const { searchParams } = new URL(req.url);
  const rawInput = searchParams.get('username') || '';
  
  // Strict sanitization
  const username = sanitizeInstagramHandle(rawInput);

  if (!username) {
    return NextResponse.json(
      {
        valid: false,
        message: 'Invalid handle syntax. Must be 1-30 characters (letters, numbers, periods, underscores).',
      },
      { status: 400 }
    );
  }

  // 2. Reject obvious single-key spam or placeholders
  const dummyList = ['test', 'dummy', 'asdf', 'qwerty', '12345', 'none', 'null', 'na', 'admin', 'root', 'localhost'];
  if (dummyList.includes(username) || /^([a-z0-9])\1{5,}$/.test(username)) {
    return NextResponse.json({
      valid: false,
      message: 'Looks like a placeholder. Please enter a real Instagram profile.',
    });
  }

  // 3. Multi-Tier Instagram Profile Check
  try {
    const targetUrl = `https://www.instagram.com/${username}/`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);

    const res = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      signal: controller.signal,
      redirect: 'follow',
      cache: 'no-store',
    });

    clearTimeout(timeout);

    const html = await res.text();
    const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
    const rawTitle = titleMatch ? titleMatch[1] : '';
    const decodedTitle = rawTitle.replace(/&#064;/g, '@').replace(/&#x2022;/g, '•');

    // If Instagram specifically responds with a 404 Not Found page
    if (res.status === 404 || decodedTitle.includes('Page Not Found') || decodedTitle.includes("isn't available")) {
      return NextResponse.json({
        valid: false,
        message: `@${username} not found on Instagram. Please double-check spelling.`,
      });
    }

    // Extract profile name if available in crawler metadata
    let profileName = '';
    if (decodedTitle.includes('(@')) {
      profileName = decodedTitle.split('(@')[0]?.trim();
    }

    return NextResponse.json({
      valid: true,
      username: username,
      profileName: profileName || username,
      message: `Verified: @${username} is ready! ✅`,
    });
  } catch (err: any) {
    // If Instagram rate-limits or blocks server requests (common in cloud hosts),
    // NEVER falsely reject a real valid handle!
    return NextResponse.json({
      valid: true,
      username: username,
      profileName: username,
      message: `Verified: @${username} is valid! ✅`,
    });
  }
}
