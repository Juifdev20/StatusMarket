-- ============================================================================
-- Migration 027 — Public rating aggregates for products and stores
-- ============================================================================
-- Views over the `reviews` table (migration 010) so the UI can show an
-- average rating + count without recomputing it client-side on every load.
-- `reviews_select_public` RLS is already USING (true), so these views
-- inherit public readability with no extra grants needed.

CREATE OR REPLACE VIEW public.product_rating_summary AS
  SELECT product_id, COUNT(*)::int AS review_count, ROUND(AVG(rating)::numeric, 1) AS avg_rating
  FROM public.reviews
  WHERE product_id IS NOT NULL
  GROUP BY product_id;

CREATE OR REPLACE VIEW public.store_rating_summary AS
  SELECT store_id, COUNT(*)::int AS review_count, ROUND(AVG(rating)::numeric, 1) AS avg_rating
  FROM public.reviews
  WHERE store_id IS NOT NULL
  GROUP BY store_id;
