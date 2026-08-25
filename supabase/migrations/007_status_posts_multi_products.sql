-- ============================================================================
-- Migration 007 — Status posts: multi-product publications
-- ============================================================================
-- Adds slug, product_ids (jsonb array), cover_image_url to status_posts
-- so a publication can feature multiple products with a cover image.
-- Public can read status_posts (for shared links).
-- ============================================================================

ALTER TABLE public.status_posts
  ADD COLUMN IF NOT EXISTS slug text UNIQUE DEFAULT gen_random_uuid()::text,
  ADD COLUMN IF NOT EXISTS product_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS cover_image_url text;

CREATE INDEX IF NOT EXISTS idx_status_posts_slug ON public.status_posts(slug);

-- Drop old restrictive SELECT policy, allow public read
DROP POLICY IF EXISTS "status_posts_select_owner_or_admin" ON public.status_posts;
DROP POLICY IF EXISTS "status_posts_select_public" ON public.status_posts;

CREATE POLICY "status_posts_select_public"
  ON public.status_posts FOR SELECT
  USING (true);

-- Fix insert/update/delete policies with is_super_admin()
DROP POLICY IF EXISTS "status_posts_insert_owner" ON public.status_posts;
CREATE POLICY "status_posts_insert_owner"
  ON public.status_posts FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.stores s
      WHERE s.id = status_posts.store_id AND s.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "status_posts_update_owner" ON public.status_posts;
CREATE POLICY "status_posts_update_owner"
  ON public.status_posts FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.stores s
      WHERE s.id = status_posts.store_id AND s.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "status_posts_delete_owner_or_admin" ON public.status_posts;
CREATE POLICY "status_posts_delete_owner_or_admin"
  ON public.status_posts FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.stores s
      WHERE s.id = status_posts.store_id AND s.owner_id = auth.uid()
    )
    OR public.is_super_admin()
  );
