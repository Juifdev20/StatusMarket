-- ============================================================================
-- Migration 031 — Actually enforce trial/subscription expiry
-- ============================================================================
-- Until now, trial_ends_at / expires_at were stored but never checked anywhere:
-- an expired seller could keep adding products and publishing statuses
-- indefinitely. This adds a real enforcement point at the RLS level (the layer
-- that actually matters here, since products/status_posts are written directly
-- from the browser via the Supabase client, not through the Express API).
--
-- Chosen behavior: the seller's PUBLIC STORE stays fully visible and orderable
-- (buyers are never affected). Only the seller's own ability to CREATE or EDIT
-- products, and to CREATE or EDIT status posts, is blocked once their trial or
-- paid subscription has lapsed. Admins are unaffected (can still manage any
-- store). Deleting existing products/posts remains allowed either way.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.store_owner_subscription_active(p_store_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (
      SELECT
        CASE sub.status
          WHEN 'ACTIVE' THEN sub.expires_at IS NULL OR sub.expires_at > now()
          WHEN 'TRIAL'  THEN sub.trial_ends_at IS NULL OR sub.trial_ends_at > now()
          ELSE false
        END
      FROM public.subscriptions sub
      JOIN public.stores s ON s.owner_id = sub.seller_id
      WHERE s.id = p_store_id
      ORDER BY sub.created_at DESC
      LIMIT 1
    ),
    false
  );
$$;

-- ---- products: block insert/update once the store owner's subscription has lapsed ----
DROP POLICY IF EXISTS "products_insert_owner_or_admin" ON public.products;
CREATE POLICY "products_insert_owner_or_admin"
  ON public.products FOR INSERT
  WITH CHECK (
    (
      EXISTS (SELECT 1 FROM public.stores s WHERE s.id = products.store_id AND s.owner_id = auth.uid())
      AND public.store_owner_subscription_active(products.store_id)
    )
    OR public.is_super_admin()
  );

DROP POLICY IF EXISTS "products_update_owner_or_admin" ON public.products;
CREATE POLICY "products_update_owner_or_admin"
  ON public.products FOR UPDATE
  USING (
    (
      EXISTS (SELECT 1 FROM public.stores s WHERE s.id = products.store_id AND s.owner_id = auth.uid())
      AND public.store_owner_subscription_active(products.store_id)
    )
    OR public.is_super_admin()
  );

-- ---- status_posts: same treatment ----
DROP POLICY IF EXISTS "status_posts_insert_owner" ON public.status_posts;
CREATE POLICY "status_posts_insert_owner"
  ON public.status_posts FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.stores s WHERE s.id = status_posts.store_id AND s.owner_id = auth.uid())
    AND public.store_owner_subscription_active(status_posts.store_id)
  );

DROP POLICY IF EXISTS "status_posts_update_owner" ON public.status_posts;
CREATE POLICY "status_posts_update_owner"
  ON public.status_posts FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.stores s WHERE s.id = status_posts.store_id AND s.owner_id = auth.uid())
    AND public.store_owner_subscription_active(status_posts.store_id)
  );
