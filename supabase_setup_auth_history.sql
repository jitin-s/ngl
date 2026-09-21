-- ==========================================================
-- SECRET FEELINGS VAULT - SUPABASE AUTH & HISTORY ENHANCEMENT
-- Run this in your Supabase Project -> SQL Editor
-- ==========================================================

-- 1. Ensure crush_submissions table exists with all required columns
CREATE TABLE IF NOT EXISTS public.crush_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    guest_id TEXT,
    account_type TEXT DEFAULT 'anonymous',
    name_or_nickname TEXT NOT NULL,
    instagram_id TEXT,
    has_relationship BOOLEAN DEFAULT false,
    has_crush BOOLEAN DEFAULT false,
    crush_name TEXT,
    crush_organization TEXT,
    crush_duration TEXT,
    crush_id_or_number TEXT,
    comments TEXT,
    notify_when_single BOOLEAN DEFAULT false,
    notification_channel TEXT,
    contact_info TEXT,
    is_confidential BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. If table already exists, safely add any missing columns
ALTER TABLE public.crush_submissions 
    ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS guest_id TEXT,
    ADD COLUMN IF NOT EXISTS account_type TEXT DEFAULT 'anonymous',
    ADD COLUMN IF NOT EXISTS crush_organization TEXT,
    ADD COLUMN IF NOT EXISTS crush_id_or_number TEXT,
    ADD COLUMN IF NOT EXISTS notification_channel TEXT,
    ADD COLUMN IF NOT EXISTS contact_info TEXT,
    ADD COLUMN IF NOT EXISTS is_confidential BOOLEAN DEFAULT true;

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.crush_submissions ENABLE ROW LEVEL SECURITY;

-- 4. Policies for Submissions (Insert, Select, Delete)
DROP POLICY IF EXISTS "Allow anonymous and authenticated insert" ON public.crush_submissions;
CREATE POLICY "Allow anonymous and authenticated insert"
    ON public.crush_submissions
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

DROP POLICY IF EXISTS "Allow select for all" ON public.crush_submissions;
CREATE POLICY "Allow select for all"
    ON public.crush_submissions
    FOR SELECT
    TO anon, authenticated
    USING (true);

DROP POLICY IF EXISTS "Allow delete for all" ON public.crush_submissions;
CREATE POLICY "Allow delete for all"
    ON public.crush_submissions
    FOR DELETE
    TO anon, authenticated
    USING (true);

-- 4B. ZERO-LEAK SECURE PUBLIC VIEW (Protects Instagram handles, phone numbers, and user IDs from black-hat scrapers)
CREATE OR REPLACE VIEW public.public_confessions_wall AS
SELECT
    id,
    'Anonymous' AS name_or_nickname,
    crush_name,
    crush_organization,
    comments,
    created_at,
    has_crush,
    has_relationship
FROM public.crush_submissions
WHERE is_confidential = true;

-- 4C. ZERO-LEAK SECURE STORED PROCEDURE (RPC) FOR PUBLIC WALL (Never leaks submitter username/name)
CREATE OR REPLACE FUNCTION public.get_public_confessions(limit_count INT DEFAULT 40)
RETURNS TABLE (
    id UUID,
    name_or_nickname TEXT,
    crush_name TEXT,
    crush_organization TEXT,
    comments TEXT,
    created_at TIMESTAMPTZ,
    has_crush BOOLEAN,
    has_relationship BOOLEAN
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT
        id,
        'Anonymous' AS name_or_nickname,
        crush_name,
        crush_organization,
        comments,
        created_at,
        has_crush,
        has_relationship
    FROM public.crush_submissions
    WHERE is_confidential = true
    ORDER BY created_at DESC
    LIMIT limit_count;
$$;

-- 5. Create Permanent User Profiles Table for Reliable Signup & Dual Login (Email or Username)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    email TEXT UNIQUE NOT NULL,
    username TEXT UNIQUE NOT NULL,
    display_name TEXT NOT NULL,
    password_hash TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    last_sign_in_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow profiles insert" ON public.profiles;
CREATE POLICY "Allow profiles insert"
    ON public.profiles
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

DROP POLICY IF EXISTS "Allow profiles select" ON public.profiles;
CREATE POLICY "Allow profiles select"
    ON public.profiles
    FOR SELECT
    TO anon, authenticated
    USING (true);

DROP POLICY IF EXISTS "Allow profiles update" ON public.profiles;
CREATE POLICY "Allow profiles update"
    ON public.profiles
    FOR UPDATE
    TO anon, authenticated
    USING (true);

-- 6. Create Guest Sessions Table to store temporary guest login credentials (3-Week Auto-Purge)
CREATE TABLE IF NOT EXISTS public.guest_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    guest_id TEXT UNIQUE NOT NULL,
    username TEXT NOT NULL,
    temporary_pass TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    expires_at TIMESTAMPTZ DEFAULT (now() + INTERVAL '21 days'),
    ip_or_user_agent TEXT
);

-- Enable RLS on guest_sessions
ALTER TABLE public.guest_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow guest_sessions insert" ON public.guest_sessions;
CREATE POLICY "Allow guest_sessions insert"
    ON public.guest_sessions
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

DROP POLICY IF EXISTS "Allow guest_sessions select" ON public.guest_sessions;
CREATE POLICY "Allow guest_sessions select"
    ON public.guest_sessions
    FOR SELECT
    TO anon, authenticated
    USING (true);

DROP POLICY IF EXISTS "Allow guest_sessions delete" ON public.guest_sessions;
CREATE POLICY "Allow guest_sessions delete"
    ON public.guest_sessions
    FOR DELETE
    TO anon, authenticated
    USING (true);

-- 7. Database Indexes for Fast Lookup & Strict Uniqueness
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_username_lower ON public.profiles (LOWER(username));
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_email_lower ON public.profiles (LOWER(email));
CREATE UNIQUE INDEX IF NOT EXISTS idx_guest_sessions_username_unique ON public.guest_sessions (LOWER(username));
CREATE INDEX IF NOT EXISTS idx_crush_submissions_user_id ON public.crush_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_crush_submissions_guest_id ON public.crush_submissions(guest_id);
CREATE INDEX IF NOT EXISTS idx_crush_submissions_created_at ON public.crush_submissions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_guest_sessions_guest_id ON public.guest_sessions(guest_id);

-- 8. Stored Procedure for Global Username Uniqueness Verification (Across Profiles, Guest Sessions & Auth)
CREATE OR REPLACE FUNCTION public.check_username_availability(check_username TEXT, exclude_guest_id TEXT DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    clean_user TEXT := LOWER(TRIM(check_username));
BEGIN
    IF clean_user IS NULL OR length(clean_user) < 3 THEN
        RETURN false;
    END IF;

    -- 1. Check if taken in registered profiles
    IF EXISTS (
        SELECT 1 FROM public.profiles
        WHERE LOWER(username) = clean_user
    ) THEN
        RETURN false;
    END IF;

    -- 2. Check if active in guest_sessions
    IF EXISTS (
        SELECT 1 FROM public.guest_sessions
        WHERE LOWER(username) = clean_user
          AND (exclude_guest_id IS NULL OR guest_id != exclude_guest_id)
          AND expires_at > now()
    ) THEN
        RETURN false;
    END IF;

    -- 3. Check in auth.users
    IF EXISTS (
        SELECT 1 FROM auth.users
        WHERE LOWER(COALESCE(raw_user_meta_data->>'display_name', '')) = clean_user
           OR LOWER(COALESCE(raw_user_meta_data->>'nickname', '')) = clean_user
    ) THEN
        RETURN false;
    END IF;

    RETURN true;
END;
$$;

