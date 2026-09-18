import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { 
  timingSafeCompare, 
  checkRateLimit, 
  generateAdminSessionToken, 
  verifyAdminSessionToken 
} from '@/lib/security';

export interface SecurityAuditLog {
  id: string;
  timestamp: string;
  event: 'LOGIN_SUCCESS' | 'LOGIN_FAILED' | 'SESSION_AUTH' | 'READ_VAULT' | 'DELETE_RECORD' | 'DELETE_ALL' | 'LOCKOUT_TRIGGERED';
  ip: string;
  details: string;
  status: 'SUCCESS' | 'FAILED' | 'BLOCKED';
}

const failedAttempts = new Map<string, { count: number; lockedUntil: number }>();
const auditLogs: SecurityAuditLog[] = [];

function recordAudit(event: SecurityAuditLog['event'], ip: string, details: string, status: SecurityAuditLog['status']) {
  const newLog: SecurityAuditLog = {
    id: 'audit_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
    timestamp: new Date().toISOString(),
    event,
    ip,
    details,
    status,
  };
  auditLogs.unshift(newLog);
  if (auditLogs.length > 50) {
    auditLogs.pop();
  }
}

function verifyAdminAuth(passkey: string | undefined, sessionToken: string | undefined, ip: string): { valid: boolean; error?: string; remainingAttempts?: number; lockedSecs?: number } {
  const now = Date.now();
  const rateData = failedAttempts.get(ip);
  if (rateData && rateData.lockedUntil > now) {
    const remainingSecs = Math.ceil((rateData.lockedUntil - now) / 1000);
    recordAudit('LOCKOUT_TRIGGERED', ip, `Blocked during active ${remainingSecs}s lockout`, 'BLOCKED');
    return { valid: false, error: `Vault Locked. Maximum brute-force threshold reached. Try again in ${remainingSecs}s.`, lockedSecs: remainingSecs };
  }

  // 1. Verify via signed session token if provided
  if (sessionToken && verifyAdminSessionToken(sessionToken, ip)) {
    return { valid: true };
  }

  // 2. Verify via Master Passkey
  const adminSecret = process.env.ADMIN_SECRET_KEY || 'secret123';
  const isMatch = passkey ? timingSafeCompare(String(passkey), String(adminSecret)) : false;

  if (!isMatch) {
    const current = failedAttempts.get(ip) || { count: 0, lockedUntil: 0 };
    current.count += 1;
    if (current.count >= 5) {
      current.lockedUntil = now + 15 * 60 * 1000;
      recordAudit('LOCKOUT_TRIGGERED', ip, '15-minute lockout triggered after 5 failed attempts', 'BLOCKED');
    } else {
      recordAudit('LOGIN_FAILED', ip, `Invalid passkey attempt (${5 - current.count} remaining)`, 'FAILED');
    }
    failedAttempts.set(ip, current);
    const left = Math.max(0, 5 - current.count);
    return { 
      valid: false, 
      error: current.count >= 5 
        ? 'Vault Locked. 5 failed attempts reached. Locked out for 15 minutes.' 
        : `Unauthorized: Invalid Master Passkey. (${left} attempts remaining)`, 
      remainingAttempts: left 
    };
  }

  // Success: Clear failed attempts
  failedAttempts.delete(ip);
  recordAudit('LOGIN_SUCCESS', ip, 'Admin master vault unlocked successfully', 'SUCCESS');
  return { valid: true };
}

function getSupabaseAdmin() {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://rxhbuidfsedbvkyellum.supabase.co';
  const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '');
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  return createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false },
  });
}

// POST: Authenticate & Fetch submissions + Audit Logs
export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'default-ip';
    
    // IP Rate Limit (20 requests / min)
    const rateCheck = checkRateLimit(`ip:${ip}:admin-post`, 20, 60000);
    if (!rateCheck.allowed) {
      recordAudit('READ_VAULT', ip, 'Rate limit exceeded on admin query', 'BLOCKED');
      return NextResponse.json({ error: `Rate limit exceeded. Please wait ${rateCheck.resetInSec}s.` }, { status: 429 });
    }

    const body = await req.json();
    const { passkey, sessionToken, action } = body;

    const auth = verifyAdminAuth(passkey, sessionToken, ip);
    if (!auth.valid) {
      return NextResponse.json({ 
        error: auth.error, 
        remainingAttempts: auth.remainingAttempts,
        lockedSecs: auth.lockedSecs 
      }, { status: 401 });
    }

    // Generate fresh HMAC session token
    const newSession = generateAdminSessionToken(ip);

    // If client specifically requested audit logs
    if (action === 'get_audit_logs') {
      return NextResponse.json({ auditLogs, sessionToken: newSession.token });
    }

    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin
      .from('crush_submissions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      recordAudit('READ_VAULT', ip, `Database query failed: ${error.message}`, 'FAILED');
      return NextResponse.json({ error: 'Failed to retrieve vault records from database.' }, { status: 500 });
    }

    recordAudit('READ_VAULT', ip, `Loaded ${data?.length || 0} encrypted confessions`, 'SUCCESS');

    const submissions = data || [];
    const processed = submissions.map((sub: any) => {
      const myIg = sub.instagram_id?.toLowerCase();
      const targetIg = (sub.crush_id_or_number || sub.crush_name || '').toLowerCase().replace(/[@\[\]]/g, '').trim();

      const targetSub = submissions.find((other: any) => {
        const otherIg = other.instagram_id?.toLowerCase();
        return otherIg && targetIg && otherIg === targetIg;
      });

      let isMutualMatch = false;
      let targetCurrentStatus = null;

      if (targetSub) {
        targetCurrentStatus = targetSub.has_relationship ? 'Committed' : 'Single';
        const otherTarget = (targetSub.crush_id_or_number || targetSub.crush_name || '').toLowerCase();
        if (myIg && otherTarget.includes(myIg)) {
          isMutualMatch = true;
        }
      }

      return {
        ...sub,
        isMutualMatch,
        targetCurrentStatus,
      };
    });

    return NextResponse.json({ 
      submissions: processed, 
      sessionToken: newSession.token,
      expiresAt: newSession.expiresAt,
      auditLogs 
    });
  } catch (err: any) {
    return NextResponse.json({ error: 'Server error processing secure request' }, { status: 500 });
  }
}

// DELETE: Delete a submission permanently with audit trail
export async function DELETE(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'default-ip';

    // IP Rate Limit (10 deletes / min)
    const rateCheck = checkRateLimit(`ip:${ip}:admin-delete`, 10, 60000);
    if (!rateCheck.allowed) {
      return NextResponse.json({ error: `Rate limited. Please wait ${rateCheck.resetInSec}s.` }, { status: 429 });
    }

    const { passkey, sessionToken, id, deleteAll } = await req.json();

    const auth = verifyAdminAuth(passkey, sessionToken, ip);
    if (!auth.valid) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    const supabaseAdmin = getSupabaseAdmin();

    if (deleteAll) {
      const { data, error } = await supabaseAdmin
        .from('crush_submissions')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000')
        .select();

      if (error) {
        recordAudit('DELETE_ALL', ip, `Bulk purge failed: ${error.message}`, 'FAILED');
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      recordAudit('DELETE_ALL', ip, `Purged all ${data?.length || 0} confessions`, 'SUCCESS');
      return NextResponse.json({ success: true, count: data?.length || 0, auditLogs });
    }

    if (!id) {
      return NextResponse.json({ error: 'Missing submission ID to delete' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('crush_submissions')
      .delete()
      .eq('id', id)
      .select();

    if (error) {
      recordAudit('DELETE_RECORD', ip, `Delete failed for ID ${id}: ${error.message}`, 'FAILED');
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data || data.length === 0) {
      recordAudit('DELETE_RECORD', ip, `Delete blocked by RLS for ID ${id}`, 'FAILED');
      return NextResponse.json({
        success: false,
        warning: 'RLS_DELETE_BLOCKED',
        error: 'Database blocked deletion. Please run the SQL DELETE policy in Supabase (or add your SUPABASE_SERVICE_ROLE_KEY).'
      }, { status: 403 });
    }

    recordAudit('DELETE_RECORD', ip, `Permanently deleted submission ID ${id}`, 'SUCCESS');
    return NextResponse.json({ success: true, deletedId: id, deletedRow: data[0], auditLogs });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}

