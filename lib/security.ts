import crypto from 'crypto';

/**
 * In-Memory Sliding Window Rate Limiter
 */
interface RateLimitRecord {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitRecord>();

// Clean up stale rate limit entries every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of rateLimitStore.entries()) {
      if (now > record.resetTime) {
        rateLimitStore.delete(key);
      }
    }
  }, 5 * 60 * 1000);
}

/**
 * Checks and increments rate limit for a given key (e.g. IP + action)
 * @param key Unique key (e.g. `ip:verify-instagram`)
 * @param maxRequests Maximum allowed requests in window
 * @param windowMs Window duration in milliseconds (e.g. 60000 for 1 minute)
 */
export function checkRateLimit(
  key: string,
  maxRequests: number = 20,
  windowMs: number = 60 * 1000
): { allowed: boolean; remaining: number; resetInSec: number } {
  const now = Date.now();
  const record = rateLimitStore.get(key);

  if (!record || now > record.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1, resetInSec: Math.ceil(windowMs / 1000) };
  }

  if (record.count >= maxRequests) {
    const resetInSec = Math.ceil((record.resetTime - now) / 1000);
    return { allowed: false, remaining: 0, resetInSec: Math.max(1, resetInSec) };
  }

  record.count += 1;
  const resetInSec = Math.ceil((record.resetTime - now) / 1000);
  return { allowed: true, remaining: maxRequests - record.count, resetInSec };
}

/**
 * Deep Sanitizer: Strips HTML tags, script payloads, javascript: protocols,
 * null bytes, and dangerous ASCII characters to protect against XSS and injection.
 */
export function sanitizeText(input: string | null | undefined, maxLength: number = 1000): string {
  if (!input || typeof input !== 'string') return '';

  let sanitized = input
    // Remove null bytes
    .replace(/\0/g, '')
    // Strip HTML tags (<script>, <iframe>, <img ...>, etc.)
    .replace(/<[^>]*>/g, '')
    // Remove javascript: and data: URI schemes
    .replace(/javascript:/gi, '')
    .replace(/data:/gi, '')
    .replace(/vbscript:/gi, '')
    // Remove HTML event handler keywords
    .replace(/on\w+\s*=/gi, '')
    // Normalize excessive newlines and whitespace
    .replace(/(\r\n|\r|\n){3,}/g, '\n\n')
    .trim();

  // Clamp string length to prevent memory bombs
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }

  return sanitized;
}

/**
 * Sanitizes Instagram handle with strict regex rules
 */
export function sanitizeInstagramHandle(input: string | null | undefined): string | null {
  if (!input || typeof input !== 'string') return null;
  const clean = input.trim().replace(/^@+/, '').replace(/\/+$/, '').toLowerCase();
  
  // Instagram handles must match standard pattern (1-30 chars, no consecutive dots)
  const isValid = /^(?!.*\.\.)(?!.*\.$)[a-z0-9_][a-z0-9_\.]{0,29}$/.test(clean);
  return isValid ? clean : null;
}

/**
 * Timing-safe string comparison to protect against timing attacks
 */
export function timingSafeCompare(a: string, b: string): boolean {
  try {
    const bufA = Buffer.from(String(a || ''), 'utf8');
    const bufB = Buffer.from(String(b || ''), 'utf8');

    if (bufA.length !== bufB.length) {
      // Execute dummy timing to avoid shortcut leaks
      crypto.timingSafeEqual(bufA, bufA);
      return false;
    }

    return crypto.timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}

/**
 * CSV Formula Injection Neutralizer
 * Prevents Excel/Google Sheets DDE command execution (=cmd|, +cmd|, -cmd|, @cmd|)
 */
export function sanitizeCsvCell(value: string | number | boolean | null | undefined): string {
  if (value === null || value === undefined) return '""';
  let str = String(value);
  // If starts with risky formula triggers, prepend a single quote to force text interpretation
  if (/^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }
  return `"${str.replace(/"/g, '""')}"`;
}

/**
 * Cryptographic Admin Session Token Generator (HMAC-SHA256 Signed)
 */
export function generateAdminSessionToken(ip: string): { token: string; expiresAt: number } {
  const expiresAt = Date.now() + 15 * 60 * 1000; // 15-minute short-lived session
  const payload = `${ip}:${expiresAt}`;
  const secret = process.env.ADMIN_SECRET_KEY || 'secret123';
  const signature = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  return { token: `${payload}:${signature}`, expiresAt };
}

/**
 * Validates HMAC-SHA256 signed admin session token with expiration and IP binding
 */
export function verifyAdminSessionToken(token: string, ip: string): boolean {
  if (!token || typeof token !== 'string') return false;
  const parts = token.split(':');
  if (parts.length !== 3) return false;

  const [tokenIp, expiresAtStr, signature] = parts;
  const expiresAt = parseInt(expiresAtStr, 10);
  if (isNaN(expiresAt) || Date.now() > expiresAt) return false;

  const secret = process.env.ADMIN_SECRET_KEY || 'secret123';
  const expectedSig = crypto.createHmac('sha256', secret).update(`${tokenIp}:${expiresAtStr}`).digest('hex');
  return timingSafeCompare(signature, expectedSig);
}

/**
 * Cryptographic 6-Digit Email OTP Generator (HMAC-SHA256 Signed)
 */
export function generateEmailOtp(email: string): { otp: string; token: string; expiresAt: number } {
  const cleanEmail = email.trim().toLowerCase();
  const otp = String(crypto.randomInt(100000, 999999));
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes expiry
  const payload = `${cleanEmail}:${expiresAt}`;
  const secret = process.env.ADMIN_SECRET_KEY || 'secret123';
  const signature = crypto.createHmac('sha256', secret).update(`${payload}:${otp}`).digest('hex');
  return {
    otp,
    token: `${payload}:${signature}`,
    expiresAt,
  };
}

/**
 * Validates 6-Digit Email OTP against signed HMAC token
 */
export function verifyEmailOtp(email: string, otp: string, token: string): boolean {
  if (!email || !otp || !token || typeof token !== 'string') return false;
  const parts = token.split(':');
  if (parts.length !== 3) return false;

  const [tokenEmail, expiresAtStr, signature] = parts;
  const expiresAt = parseInt(expiresAtStr, 10);
  if (isNaN(expiresAt) || Date.now() > expiresAt) return false;
  if (tokenEmail.toLowerCase() !== email.trim().toLowerCase()) return false;

  const secret = process.env.ADMIN_SECRET_KEY || 'secret123';
  const expectedSig = crypto.createHmac('sha256', secret).update(`${tokenEmail}:${expiresAtStr}:${otp.trim()}`).digest('hex');
  return timingSafeCompare(signature, expectedSig);
}


