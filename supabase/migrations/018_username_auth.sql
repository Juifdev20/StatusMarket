-- ============================================================================
-- Migration 018 — Username and optional email fields for public profiles
-- ============================================================================

-- Add username and optional email to public profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS username text,
  ADD COLUMN IF NOT EXISTS email text;

-- Add a unique index on normalized username
CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_unique
  ON public.profiles (LOWER(username));

-- IMPORTANT: In the Supabase dashboard, disable "Enable email confirmations"
-- (Authentication > Email confirmations) so users can sign up with a username
-- without receiving a confirmation email.
