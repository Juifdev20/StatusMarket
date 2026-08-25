-- ============================================================================
-- Migration 008 — Orders, cart, notifications
-- ============================================================================

-- ---- order status enum -----------------------------------------------------
DO $$ BEGIN
  CREATE TYPE order_status AS ENUM ('PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ---- orders table ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.orders (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id      uuid           NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  customer_name text,
  customer_phone text          NOT NULL,
  customer_email text,
  address       text,
  status        order_status   NOT NULL DEFAULT 'PENDING',
  total         numeric(10,2)  NOT NULL DEFAULT 0,
  currency      text           NOT NULL DEFAULT 'USD',
  notes         text,
  created_at    timestamptz    NOT NULL DEFAULT now(),
  updated_at    timestamptz    NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_orders_store_id ON public.orders(store_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "orders_select_owner_or_admin"
  ON public.orders FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.stores s
      WHERE s.id = orders.store_id AND s.owner_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'SUPER_ADMIN'
    )
  );

CREATE POLICY "orders_insert_public_or_owner"
  ON public.orders FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    OR EXISTS (
      SELECT 1 FROM public.stores s
      WHERE s.id = orders.store_id AND s.owner_id = auth.uid()
    )
  );

CREATE POLICY "orders_update_owner_or_admin"
  ON public.orders FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.stores s
      WHERE s.id = orders.store_id AND s.owner_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'SUPER_ADMIN'
    )
  );

CREATE POLICY "orders_delete_owner_or_admin"
  ON public.orders FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.stores s
      WHERE s.id = orders.store_id AND s.owner_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'SUPER_ADMIN'
    )
  );

-- ---- order_items table -----------------------------------------------------
CREATE TABLE IF NOT EXISTS public.order_items (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id    uuid           NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id  uuid           NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity    integer        NOT NULL DEFAULT 1,
  price       numeric(10,2)  NOT NULL,
  currency    text           NOT NULL DEFAULT 'USD'
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON public.order_items(product_id);

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "order_items_select_owner_or_admin"
  ON public.order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      JOIN public.stores s ON s.id = o.store_id
      WHERE o.id = order_items.order_id AND s.owner_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'SUPER_ADMIN'
    )
  );

CREATE POLICY "order_items_insert_public_or_owner"
  ON public.order_items FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    OR EXISTS (
      SELECT 1 FROM public.orders o
      JOIN public.stores s ON s.id = o.store_id
      WHERE o.id = order_items.order_id AND s.owner_id = auth.uid()
    )
  );

-- ---- cart table (server cart for logged users) -----------------------------
CREATE TABLE IF NOT EXISTS public.cart_items (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id  uuid           REFERENCES public.profiles(id) ON DELETE CASCADE,
  store_id    uuid           NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  product_id  uuid           NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity    integer        NOT NULL DEFAULT 1,
  created_at  timestamptz    NOT NULL DEFAULT now(),
  UNIQUE (profile_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_cart_items_profile_id ON public.cart_items(profile_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_store_id ON public.cart_items(store_id);

ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cart_select_own_or_admin"
  ON public.cart_items FOR SELECT
  USING (
    profile_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'SUPER_ADMIN'
    )
  );

CREATE POLICY "cart_insert_own"
  ON public.cart_items FOR INSERT
  WITH CHECK (profile_id = auth.uid());

CREATE POLICY "cart_update_own"
  ON public.cart_items FOR UPDATE
  USING (profile_id = auth.uid());

CREATE POLICY "cart_delete_own"
  ON public.cart_items FOR DELETE
  USING (profile_id = auth.uid());

-- ---- notifications table ---------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notifications (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid           NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title       text           NOT NULL,
  body        text,
  link        text,
  is_read     boolean        NOT NULL DEFAULT false,
  created_at  timestamptz    NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(is_read);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notifications_select_own"
  ON public.notifications FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "notifications_insert_admin"
  ON public.notifications FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'SUPER_ADMIN'
    )
  );

CREATE POLICY "notifications_update_own"
  ON public.notifications FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "reports_insert_public"
  ON public.reports FOR INSERT
  WITH CHECK (true);

DROP TRIGGER IF EXISTS orders_updated_at ON public.orders;
CREATE TRIGGER orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
