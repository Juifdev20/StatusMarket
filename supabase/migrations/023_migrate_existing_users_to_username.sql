-- ============================================================================
-- Migration 023 — Migrate existing accounts to username-only auth
-- ============================================================================
-- For every profile that has no username, generates a valid username from
-- full_name or email, updates the profile, and rewrites the Auth email to
-- username@statusmarket.app so the new login flow works.
--
-- IMPORTANT: Run this from a privileged session (postgres / service_role).
-- The dashboard SQL editor sometimes runs as 'supabase_admin' and can access
-- auth.users. If it fails, you can run the auth.users update in the
-- Supabase Dashboard: Authentication > Users > edit user email manually.
-- ============================================================================

DO $$
DECLARE
  rec RECORD;
  base_username text;
  new_username text;
  counter int;
  id_suffix text;
BEGIN
  FOR rec IN
    SELECT p.id, p.full_name, p.email, u.email as auth_email
    FROM public.profiles p
    JOIN auth.users u ON u.id = p.id
    WHERE p.username IS NULL
      OR p.username = ''
  LOOP
    -- Try to build a username from full_name, fallback to email local-part, then id
    IF rec.full_name IS NOT NULL AND length(trim(rec.full_name)) > 0 THEN
      base_username := lower(regexp_replace(rec.full_name, '[^a-z0-9]', '', 'g'));
    ELSIF rec.email IS NOT NULL AND position('@' in rec.email) > 0 THEN
      base_username := lower(regexp_replace(split_part(rec.email, '@', 1), '[^a-z0-9]', '', 'g'));
    ELSE
      base_username := 'user';
    END IF;

    -- Minimum 4 characters
    IF length(base_username) < 4 THEN
      id_suffix := replace(substring(rec.id::text, 1, 8), '-', '');
      base_username := base_username || id_suffix;
    END IF;

    -- Ensure valid max length 20
    base_username := substring(base_username, 1, 20);

    -- Ensure uniqueness and add digit suffix if needed
    new_username := base_username;
    counter := 1;
    WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = new_username) LOOP
      new_username := substring(base_username, 1, 20 - length(counter::text)) || counter::text;
      counter := counter + 1;
    END LOOP;

    -- Update profile
    UPDATE public.profiles
    SET username = new_username,
        email = NULL
    WHERE id = rec.id;

    -- Update auth user email so login by username works
    UPDATE auth.users
    SET email = new_username || '@statusmarket.app'
    WHERE id = rec.id;

    RAISE NOTICE 'Migrated user % -> username %, auth email %', rec.id, new_username, new_username || '@statusmarket.app';
  END LOOP;
END $$;
