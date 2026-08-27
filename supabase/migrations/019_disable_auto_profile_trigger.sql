-- ============================================================================
-- Migration 019 — Disable the old auto-create-profile trigger function
-- ============================================================================
-- The signup now goes through the API which creates the profile itself.
-- The old trigger would insert a second profile, causing a pkey conflict.
-- This keeps the trigger on auth.users but makes it a no-op.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Profile is now created by the API; do nothing here.
  RETURN NEW;
END;
$$;
