-- ============================================================================
-- Migration 003 — Categories, products, product images, store views
-- ============================================================================

-- ---- categories table ------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.categories (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id      uuid           NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  name          text           NOT NULL,
  slug          text           NOT NULL,
  created_at    timestamptz   NOT NULL DEFAULT now(),
  updated_at    timestamptz   NOT NULL DEFAULT now(),
  UNIQUE (store_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_categories_store_id ON public.categories(store_id);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- RLS: public can read categories of active stores; owner/admin can write
CREATE POLICY "categories_select_public_or_owner_or_admin"
  ON public.categories FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.stores s
      WHERE s.id = categories.store_id
        AND (
          (s.is_active = true AND s.is_suspended = false)
          OR s.owner_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid() AND p.role = 'SUPER_ADMIN'
          )
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
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'SUPER_ADMIN'
    )
  );

CREATE POLICY "categories_update_owner_or_admin"
  ON public.categories FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.stores s
      WHERE s.id = categories.store_id AND s.owner_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'SUPER_ADMIN'
    )
  );

CREATE POLICY "categories_delete_owner_or_admin"
  ON public.categories FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.stores s
      WHERE s.id = categories.store_id AND s.owner_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'SUPER_ADMIN'
    )
  );

-- ---- products table --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.products (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id      uuid           NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  category_id   uuid           REFERENCES public.categories(id) ON DELETE SET NULL,
  name          text           NOT NULL,
  description   text,
  price         numeric(10,2) NOT NULL,
  currency      text           NOT NULL DEFAULT 'USD',
  image_url     text,
  images        jsonb         NOT NULL DEFAULT '[]'::jsonb,
  is_available  boolean        NOT NULL DEFAULT true,
  stock         integer        DEFAULT 0,
  created_at    timestamptz   NOT NULL DEFAULT now(),
  updated_at    timestamptz   NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_products_store_id ON public.products(store_id);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON public.products(category_id);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- RLS: public can read products of active stores; owner/admin can write
CREATE POLICY "products_select_public_or_owner_or_admin"
  ON public.products FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.stores s
      WHERE s.id = products.store_id
        AND (
          (s.is_active = true AND s.is_suspended = false)
          OR s.owner_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid() AND p.role = 'SUPER_ADMIN'
          )
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
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'SUPER_ADMIN'
    )
  );

CREATE POLICY "products_update_owner_or_admin"
  ON public.products FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.stores s
      WHERE s.id = products.store_id AND s.owner_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'SUPER_ADMIN'
    )
  );

CREATE POLICY "products_delete_owner_or_admin"
  ON public.products FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.stores s
      WHERE s.id = products.store_id AND s.owner_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'SUPER_ADMIN'
    )
  );

-- ---- store_views table (analytics) ----------------------------------------
CREATE TABLE IF NOT EXISTS public.store_views (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id      uuid           NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  product_id    uuid           REFERENCES public.products(id) ON DELETE CASCADE,
  visitor_ip    text,
  created_at    timestamptz   NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_store_views_store_id ON public.store_views(store_id);
CREATE INDEX IF NOT EXISTS idx_store_views_product_id ON public.store_views(product_id);

ALTER TABLE public.store_views ENABLE ROW LEVEL SECURITY;

-- RLS: anyone can insert a view (public browsing); only owner/admin can read
CREATE POLICY "store_views_insert_all"
  ON public.store_views FOR INSERT
  WITH CHECK (true);

CREATE POLICY "store_views_select_owner_or_admin"
  ON public.store_views FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.stores s
      WHERE s.id = store_views.store_id AND s.owner_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'SUPER_ADMIN'
    )
  );

-- ---- Triggers --------------------------------------------------------------
DROP TRIGGER IF EXISTS categories_updated_at ON public.categories;
CREATE TRIGGER categories_updated_at
  BEFORE UPDATE ON public.categories
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS products_updated_at ON public.products;
CREATE TRIGGER products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
