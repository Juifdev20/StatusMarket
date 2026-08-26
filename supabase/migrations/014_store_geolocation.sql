-- ============================================================================
-- Migration 014 — Store geolocation, map link, store front photo + order address required
-- ============================================================================

-- ---- Store location / map fields -------------------------------------------
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS latitude numeric(10, 7);
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS longitude numeric(10, 7);
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS map_link text;
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS store_front_image_url text;

-- ---- Make customer address required in orders from now on ------------------
-- (existing rows may be null; alter for new orders via app validation)
ALTER TABLE public.orders ALTER COLUMN customer_phone SET NOT NULL;
ALTER TABLE public.orders ALTER COLUMN address SET NOT NULL;
