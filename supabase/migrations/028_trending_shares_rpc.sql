-- ============================================================================
-- Migration 028 — Trending products/stores based on share activity
-- ============================================================================
-- `product_shares` (migration 010) restricts raw row SELECT to the store
-- owner/admin. These SECURITY DEFINER functions expose only aggregated
-- (id, count) rankings publicly, never the underlying rows.

CREATE OR REPLACE FUNCTION public.get_trending_products(days_back int DEFAULT 7, limit_count int DEFAULT 10)
RETURNS TABLE (product_id uuid, share_count bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT product_id, COUNT(*) AS share_count
  FROM public.product_shares
  WHERE created_at > now() - (days_back || ' days')::interval
  GROUP BY product_id
  ORDER BY share_count DESC
  LIMIT limit_count;
$$;

CREATE OR REPLACE FUNCTION public.get_trending_stores(days_back int DEFAULT 7, limit_count int DEFAULT 10)
RETURNS TABLE (store_id uuid, share_count bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT store_id, COUNT(*) AS share_count
  FROM public.product_shares
  WHERE created_at > now() - (days_back || ' days')::interval
  GROUP BY store_id
  ORDER BY share_count DESC
  LIMIT limit_count;
$$;

GRANT EXECUTE ON FUNCTION public.get_trending_products(int, int) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_trending_stores(int, int) TO anon, authenticated;
