-- ============================================================================
-- Migration 016 — Dev convenience: reassign orphan demo store to an existing seller
-- ============================================================================

-- If 'Boutique Démo' exists but its owner does not match any profile,
-- assign it to the first SELLER profile found (local/dev use only).

UPDATE public.stores
SET owner_id = (
  SELECT id FROM public.profiles
  WHERE role = 'SELLER'
  ORDER BY created_at ASC
  LIMIT 1
)
WHERE name ILIKE '%démo%'
  AND owner_id NOT IN (SELECT id FROM public.profiles);
