-- ============================================================================
-- Migration 030 — Public followers list (visibility/trust, like TikTok)
-- ============================================================================
-- Store follower COUNTS were already public (store_follower_counts, migration
-- 029). This adds the follower IDENTITIES (display name + avatar only — never
-- phone/email) so any visitor can see who follows a store, and the seller can
-- see their full followers list, not just the count.

CREATE OR REPLACE VIEW public.store_followers_public AS
  SELECT
    sf.store_id,
    sf.user_id,
    sf.created_at,
    COALESCE(p.full_name, p.username, 'Utilisateur') AS display_name,
    p.avatar_url
  FROM public.store_follows sf
  JOIN public.profiles p ON p.id = sf.user_id
  ORDER BY sf.created_at DESC;

GRANT SELECT ON public.store_followers_public TO anon, authenticated;
