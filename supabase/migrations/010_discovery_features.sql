-- ============================================================================
-- Migration 010 — Discovery features: favorites, reviews, product shares,
--   store city, product promotions
-- ============================================================================

-- ---- Add city column to stores ---------------------------------------------
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS city text;

-- ---- Add promotion fields to products --------------------------------------
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS discount_price numeric(10,2);
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_promoted boolean NOT NULL DEFAULT false;

-- ---- favorites table (products + stores) -----------------------------------
CREATE TABLE IF NOT EXISTS public.favorites (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid           NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  product_id   uuid           REFERENCES public.products(id) ON DELETE CASCADE,
  store_id     uuid           REFERENCES public.stores(id) ON DELETE CASCADE,
  created_at   timestamptz    NOT NULL DEFAULT now(),
  CONSTRAINT fav_target CHECK (product_id IS NOT NULL OR store_id IS NOT NULL),
  CONSTRAINT fav_unique_product UNIQUE (user_id, product_id),
  CONSTRAINT fav_unique_store UNIQUE (user_id, store_id)
);

CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON public.favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_product_id ON public.favorites(product_id);
CREATE INDEX IF NOT EXISTS idx_favorites_store_id ON public.favorites(store_id);

ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "favorites_select_own"
  ON public.favorites FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "favorites_insert_own"
  ON public.favorites FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "favorites_delete_own"
  ON public.favorites FOR DELETE
  USING (user_id = auth.uid());

-- ---- reviews table (store + product reviews with rating 1-5) ---------------
CREATE TABLE IF NOT EXISTS public.reviews (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid           NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  store_id     uuid           REFERENCES public.stores(id) ON DELETE CASCADE,
  product_id   uuid           REFERENCES public.products(id) ON DELETE CASCADE,
  rating       integer        NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment      text,
  created_at   timestamptz    NOT NULL DEFAULT now(),
  updated_at   timestamptz    NOT NULL DEFAULT now(),
  CONSTRAINT review_target CHECK (store_id IS NOT NULL OR product_id IS NOT NULL),
  CONSTRAINT review_unique_product UNIQUE (user_id, product_id),
  CONSTRAINT review_unique_store UNIQUE (user_id, store_id)
);

CREATE INDEX IF NOT EXISTS idx_reviews_store_id ON public.reviews(store_id);
CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON public.reviews(product_id);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reviews_select_public"
  ON public.reviews FOR SELECT
  USING (true);

CREATE POLICY "reviews_insert_auth"
  ON public.reviews FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "reviews_update_own"
  ON public.reviews FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "reviews_delete_own"
  ON public.reviews FOR DELETE
  USING (user_id = auth.uid());

DROP TRIGGER IF EXISTS reviews_updated_at ON public.reviews;
CREATE TRIGGER reviews_updated_at
  BEFORE UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ---- product_shares table (track sharing activity for trending) ------------
CREATE TABLE IF NOT EXISTS public.product_shares (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id   uuid           NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  store_id     uuid           NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  platform     text           DEFAULT 'whatsapp',
  created_at   timestamptz    NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_product_shares_product_id ON public.product_shares(product_id);

ALTER TABLE public.product_shares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "product_shares_insert_all"
  ON public.product_shares FOR INSERT
  WITH CHECK (true);

CREATE POLICY "product_shares_select_owner_or_admin"
  ON public.product_shares FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.stores s
      WHERE s.id = product_shares.store_id AND s.owner_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'SUPER_ADMIN'
    )
  );

-- ---- Update store_views to allow public read for trending calc -------------
-- (We need public read on store_views for trending, but we'll create a separate policy)
CREATE POLICY "store_views_select_public_limited"
  ON public.store_views FOR SELECT
  USING (true);
