-- ============================================================================
-- Migration 024 — Add recovery PIN for secure password reset
-- ============================================================================

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS recovery_pin text;

-- Default recovery pin for migrated accounts: phone is known only to them,
-- but we want existing users to set a PIN via account page.
