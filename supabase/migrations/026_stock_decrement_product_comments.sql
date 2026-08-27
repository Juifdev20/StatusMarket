-- ============================================================================
-- Migration 026 — Stock decrement on order confirm + product comments
-- ============================================================================

-- ============================================================================
-- 1. STOCK DECREMENT TRIGGER
-- When an order status changes to CONFIRMED, decrement stock for each item.
-- When stock reaches 0, mark product as unavailable.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.decrement_stock_on_confirm()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only act when status transitions TO 'CONFIRMED' (and wasn't already)
  IF NEW.status = 'CONFIRMED' AND (OLD.status IS DISTINCT FROM 'CONFIRMED') THEN
    UPDATE public.products p
      SET stock = GREATEST(p.stock - oi.quantity, 0),
          is_available = CASE WHEN p.stock - oi.quantity <= 0 THEN false ELSE p.is_available END,
          updated_at = now()
      FROM public.order_items oi
      WHERE oi.order_id = NEW.id AND oi.product_id = p.id;
  END IF;

  -- If order is cancelled after being confirmed, restock
  IF NEW.status = 'CANCELLED' AND OLD.status = 'CONFIRMED' THEN
    UPDATE public.products p
      SET stock = p.stock + oi.quantity,
          is_available = CASE WHEN p.stock + oi.quantity > 0 THEN true ELSE p.is_available END,
          updated_at = now()
      FROM public.order_items oi
      WHERE oi.order_id = NEW.id AND oi.product_id = p.id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS orders_decrement_stock ON public.orders;
CREATE TRIGGER orders_decrement_stock
  AFTER UPDATE OF status ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.decrement_stock_on_confirm();

-- ============================================================================
-- 2. PRODUCT COMMENTS TABLE
-- Public comments on products, like Facebook.
-- Registered users with a store show their store name.
-- Anonymous users provide a display name.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.product_comments (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id    uuid           NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  profile_id    uuid           REFERENCES public.profiles(id) ON DELETE SET NULL,
  store_id      uuid           REFERENCES public.stores(id) ON DELETE SET NULL,
  author_name   text           NOT NULL DEFAULT 'Visiteur',
  content       text           NOT NULL,
  created_at    timestamptz    NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_product_comments_product_id ON public.product_comments(product_id);
CREATE INDEX IF NOT EXISTS idx_product_comments_created_at ON public.product_comments(created_at);

ALTER TABLE public.product_comments ENABLE ROW LEVEL SECURITY;

-- Anyone can read comments (public)
CREATE POLICY "product_comments_select_all"
  ON public.product_comments FOR SELECT
  USING (true);

-- Anyone can insert comments (public, no auth required)
CREATE POLICY "product_comments_insert_all"
  ON public.product_comments FOR INSERT
  WITH CHECK (true);

-- Only the comment author can delete their own comment
CREATE POLICY "product_comments_delete_own"
  ON public.product_comments FOR DELETE
  USING (profile_id = auth.uid());

-- Store owner can delete comments on their products
CREATE POLICY "product_comments_delete_store_owner"
  ON public.product_comments FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.products p
      JOIN public.stores s ON s.id = p.store_id
      WHERE p.id = product_comments.product_id AND s.owner_id = auth.uid()
    )
  );
