-- ============================================================================
-- Migration 020 — Add unique constraint on phone in profiles
-- ============================================================================

CREATE UNIQUE INDEX IF NOT EXISTS profiles_phone_unique
  ON public.profiles (phone)
  WHERE phone IS NOT NULL;
