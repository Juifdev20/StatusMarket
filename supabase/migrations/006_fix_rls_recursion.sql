-- ============================================================================
-- Fix: RLS recursion on all tables
-- ============================================================================
-- All policies that query public.profiles to check SUPER_ADMIN role cause
-- infinite RLS recursion. Replace with a SECURITY DEFINER function.
-- ============================================================================

-- Function to check if current user is SUPER_ADMIN (bypasses RLS)
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'SUPER_ADMIN'
  );
$$;

-- Helper for seller/admin check
CREATE OR REPLACE FUNCTION public.is_seller_or_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('SELLER', 'SUPER_ADMIN')
  );
$$;

-- ============================================================
-- profiles
-- ============================================================
DROP POLICY IF EXISTS "profiles_select_own_or_admin" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;

CREATE POLICY "profiles_select_own_or_admin"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id OR public.is_super_admin());

CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "profiles_insert_own"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ============================================================
-- platform_settings
-- ============================================================
DROP POLICY IF EXISTS "platform_settings_update_admin" ON public.platform_settings;
DROP POLICY IF EXISTS "platform_settings_insert_admin" ON public.platform_settings;

CREATE POLICY "platform_settings_update_admin"
  ON public.platform_settings FOR UPDATE
  USING (public.is_super_admin());

CREATE POLICY "platform_settings_insert_admin"
  ON public.platform_settings FOR INSERT
  WITH CHECK (public.is_super_admin());

-- ============================================================
-- subscription_plans
-- ============================================================
DROP POLICY IF EXISTS "subscription_plans_write_admin" ON public.subscription_plans;

CREATE POLICY "subscription_plans_write_admin"
  ON public.subscription_plans FOR ALL
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

-- ============================================================
-- stores
-- ============================================================
DROP POLICY IF EXISTS "stores_select_public_or_owner_or_admin" ON public.stores;
DROP POLICY IF EXISTS "stores_insert_owner" ON public.stores;
DROP POLICY IF EXISTS "stores_update_owner_or_admin" ON public.stores;
DROP POLICY IF EXISTS "stores_delete_owner_or_admin" ON public.stores;

CREATE POLICY "stores_select_public_or_owner_or_admin"
  ON public.stores FOR SELECT
  USING (
    (is_active = true AND is_suspended = false)
    OR owner_id = auth.uid()
    OR public.is_super_admin()
  );

CREATE POLICY "stores_insert_owner"
  ON public.stores FOR INSERT
  WITH CHECK (owner_id = auth.uid() AND public.is_seller_or_admin());

CREATE POLICY "stores_update_owner_or_admin"
  ON public.stores FOR UPDATE
  USING (owner_id = auth.uid() OR public.is_super_admin());

CREATE POLICY "stores_delete_owner_or_admin"
  ON public.stores FOR DELETE
  USING (owner_id = auth.uid() OR public.is_super_admin());

-- ============================================================
-- subscriptions
-- ============================================================
DROP POLICY IF EXISTS "subscriptions_select_own_or_admin" ON public.subscriptions;
DROP POLICY IF EXISTS "subscriptions_insert_own_or_admin" ON public.subscriptions;
DROP POLICY IF EXISTS "subscriptions_update_own_or_admin" ON public.subscriptions;

CREATE POLICY "subscriptions_select_own_or_admin"
  ON public.subscriptions FOR SELECT
  USING (seller_id = auth.uid() OR public.is_super_admin());

CREATE POLICY "subscriptions_insert_own_or_admin"
  ON public.subscriptions FOR INSERT
  WITH CHECK (seller_id = auth.uid() OR public.is_super_admin());

CREATE POLICY "subscriptions_update_own_or_admin"
  ON public.subscriptions FOR UPDATE
  USING (seller_id = auth.uid() OR public.is_super_admin());

-- ============================================================
-- categories
-- ============================================================
DROP POLICY IF EXISTS "categories_select_public_or_owner_or_admin" ON public.categories;
DROP POLICY IF EXISTS "categories_insert_owner_or_admin" ON public.categories;
DROP POLICY IF EXISTS "categories_update_owner_or_admin" ON public.categories;
DROP POLICY IF EXISTS "categories_delete_owner_or_admin" ON public.categories;

CREATE POLICY "categories_select_public_or_owner_or_admin"
  ON public.categories FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.stores s
      WHERE s.id = categories.store_id
        AND (
          (s.is_active = true AND s.is_suspended = false)
          OR s.owner_id = auth.uid()
          OR public.is_super_admin()
        )
    )
  );

CREATE POLICY "categories_insert_owner_or_admin"
  ON public.categories FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.stores s
      WHERE s.id = categories.store_id AND s.owner_id = auth.uid()
    )
    OR public.is_super_admin()
  );

CREATE POLICY "categories_update_owner_or_admin"
  ON public.categories FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.stores s
      WHERE s.id = categories.store_id AND s.owner_id = auth.uid()
    )
    OR public.is_super_admin()
  );

CREATE POLICY "categories_delete_owner_or_admin"
  ON public.categories FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.stores s
      WHERE s.id = categories.store_id AND s.owner_id = auth.uid()
    )
    OR public.is_super_admin()
  );

-- ============================================================
-- products
-- ============================================================
DROP POLICY IF EXISTS "products_select_public_or_owner_or_admin" ON public.products;
DROP POLICY IF EXISTS "products_insert_owner_or_admin" ON public.products;
DROP POLICY IF EXISTS "products_update_owner_or_admin" ON public.products;
DROP POLICY IF EXISTS "products_delete_owner_or_admin" ON public.products;

CREATE POLICY "products_select_public_or_owner_or_admin"
  ON public.products FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.stores s
      WHERE s.id = products.store_id
        AND (
          (s.is_active = true AND s.is_suspended = false)
          OR s.owner_id = auth.uid()
          OR public.is_super_admin()
        )
    )
  );

CREATE POLICY "products_insert_owner_or_admin"
  ON public.products FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.stores s
      WHERE s.id = products.store_id AND s.owner_id = auth.uid()
    )
    OR public.is_super_admin()
  );

CREATE POLICY "products_update_owner_or_admin"
  ON public.products FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.stores s
      WHERE s.id = products.store_id AND s.owner_id = auth.uid()
    )
    OR public.is_super_admin()
  );

CREATE POLICY "products_delete_owner_or_admin"
  ON public.products FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.stores s
      WHERE s.id = products.store_id AND s.owner_id = auth.uid()
    )
    OR public.is_super_admin()
  );

-- ============================================================
-- store_views
-- ============================================================
DROP POLICY IF EXISTS "store_views_select_owner_or_admin" ON public.store_views;

CREATE POLICY "store_views_select_owner_or_admin"
  ON public.store_views FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.stores s
      WHERE s.id = store_views.store_id AND s.owner_id = auth.uid()
    )
    OR public.is_super_admin()
  );

-- ============================================================
-- payments
-- ============================================================
DROP POLICY IF EXISTS "payments_select_own_or_admin" ON public.payments;
DROP POLICY IF EXISTS "payments_update_admin" ON public.payments;

CREATE POLICY "payments_select_own_or_admin"
  ON public.payments FOR SELECT
  USING (seller_id = auth.uid() OR public.is_super_admin());

CREATE POLICY "payments_update_admin"
  ON public.payments FOR UPDATE
  USING (public.is_super_admin());

-- ============================================================
-- status_posts
-- ============================================================
DROP POLICY IF EXISTS "status_posts_select_owner_or_admin" ON public.status_posts;
DROP POLICY IF EXISTS "status_posts_delete_owner_or_admin" ON public.status_posts;

CREATE POLICY "status_posts_select_owner_or_admin"
  ON public.status_posts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.stores s
      WHERE s.id = status_posts.store_id AND s.owner_id = auth.uid()
    )
    OR public.is_super_admin()
  );

CREATE POLICY "status_posts_delete_owner_or_admin"
  ON public.status_posts FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.stores s
      WHERE s.id = status_posts.store_id AND s.owner_id = auth.uid()
    )
    OR public.is_super_admin()
  );

-- ============================================================
-- reports
-- ============================================================
DROP POLICY IF EXISTS "reports_select_admin" ON public.reports;
DROP POLICY IF EXISTS "reports_update_admin" ON public.reports;

CREATE POLICY "reports_select_admin"
  ON public.reports FOR SELECT
  USING (public.is_super_admin());

CREATE POLICY "reports_update_admin"
  ON public.reports FOR UPDATE
  USING (public.is_super_admin());
