import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const failedAttempts = new Map<string, { count: number; lockedUntil: number }>();

function verifyPasskey(passkey: string, ip: string): { valid: boolean; error?: string } {
  const now = Date.now();
  const rateData = failedAttempts.get(ip);
  if (rateData && rateData.lockedUntil > now) {
    const remainingSecs = Math.ceil((rateData.lockedUntil - now) / 1000);
    return { valid: false, error: `Vault Locked. Too many failed attempts. Try again in ${remainingSecs}s.` };
  }

  const adminSecret = process.env.ADMIN_SECRET_KEY || 'secret123';
  const passBuffer = Buffer.from(String(passkey || ''));
  const secretBuffer = Buffer.from(String(adminSecret));

  let isMatch = false;
  if (passBuffer.length === secretBuffer.length) {
    isMatch = crypto.timingSafeEqual(passBuffer, secretBuffer);
  }

  if (!isMatch) {
    const current = failedAttempts.get(ip) || { count: 0, lockedUntil: 0 };
    current.count += 1;
    if (current.count >= 5) {
      current.lockedUntil = now + 15 * 60 * 1000;
    }
    failedAttempts.set(ip, current);
    return { valid: false, error: `Unauthorized: Invalid passkey. (${5 - current.count} attempts left)` };
  }

  failedAttempts.delete(ip);
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

// POST: Fetch submissions
export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') || 'default-ip';
    const { passkey } = await req.json();

    const auth = verifyPasskey(passkey, ip);
    if (!auth.valid) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin
      .from('crush_submissions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

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

    return NextResponse.json({ submissions: processed });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}

// DELETE: Delete a submission permanently
export async function DELETE(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') || 'default-ip';
    const { passkey, id, deleteAll } = await req.json();

    const auth = verifyPasskey(passkey, ip);
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

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true, count: data?.length || 0 });
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
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data || data.length === 0) {
      return NextResponse.json({
        success: false,
        warning: 'RLS_DELETE_BLOCKED',
        error: 'Database blocked deletion. Please run the SQL DELETE policy in Supabase (or add your SUPABASE_SERVICE_ROLE_KEY).'
      }, { status: 403 });
    }

    return NextResponse.json({ success: true, deletedId: id, deletedRow: data[0] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
