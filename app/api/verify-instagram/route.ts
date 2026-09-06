import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const username = searchParams.get('username')?.trim().replace(/^@/, '').toLowerCase();

  if (!username) {
    return NextResponse.json({ valid: false, message: 'Please enter an Instagram ID' }, { status: 400 });
  }

  // 1. Instagram username format validation
  const igRegex = /^(?!.*\.\.)(?!.*\.$)[^\W][\w.]{0,29}$/;
  if (!igRegex.test(username)) {
    return NextResponse.json({
      valid: false,
      message: 'Invalid Instagram username format. (Only letters, numbers, periods, underscores)',
    });
  }

  // 2. Reject obvious dummy strings
  const dummyList = ['test', 'dummy', 'asdf', 'qwerty', '12345', 'admin', 'instagram', 'none', 'null', 'na'];
  if (dummyList.includes(username) || /^([a-z0-9])\1{4,}$/.test(username)) {
    return NextResponse.json({
      valid: false,
      message: 'Dummy / placeholder ID detected. Please enter a real Instagram profile.',
    });
  }

  // 3. Probing Instagram URL using Crawler headers to detect true profile existence
  try {
    const targetUrl = `https://www.instagram.com/${username}/`;
    const res = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      redirect: 'follow',
      cache: 'no-store',
    });

    const html = await res.text();
    const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
    const rawTitle = titleMatch ? titleMatch[1] : '';
    const ogTitleMatch = html.match(/property="og:title"\s+content="([^"]+)"/i);
    const rawOgTitle = ogTitleMatch ? ogTitleMatch[1] : '';

    const decodedTitle = rawTitle.replace(/&#064;/g, '@').replace(/&#x2022;/g, '•');
    const decodedOg = rawOgTitle.replace(/&#064;/g, '@').replace(/&#x2022;/g, '•');

    // Real profile returns: "Name (@username) • Instagram photos and videos"
    const hasHandle = decodedTitle.toLowerCase().includes(`@${username}`) || decodedOg.toLowerCase().includes(`@${username}`);
    const isGenericOrMissing = decodedTitle.trim() === 'Instagram' || decodedTitle.includes("Page Not Found") || decodedTitle.includes("isn't available");

    if (hasHandle && !isGenericOrMissing) {
      // Extract profile name if possible
      const namePart = decodedTitle.split('(@')[0]?.trim();
      return NextResponse.json({
        valid: true,
        username: username,
        profileName: namePart || username,
        message: `Verified: @${username} exists on Instagram! ✅`,
      });
    } else {
      return NextResponse.json({
        valid: false,
        message: `@${username} does not exist on Instagram. Please enter a real ID. ❌`,
      });
    }
  } catch (err: any) {
    return NextResponse.json({
      valid: false,
      message: 'Could not connect to Instagram to verify. Please check spelling.',
    });
  }
}
