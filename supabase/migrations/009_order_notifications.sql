-- ============================================================================
-- Migration 009 — Order notifications and public cart fixes
-- ============================================================================

-- Allow anonymous (public) checkout to create orders
DROP POLICY IF EXISTS "orders_insert_public_or_owner" ON public.orders;
CREATE POLICY "orders_insert_public"
  ON public.orders FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Allow anonymous (public) checkout to create order items
DROP POLICY IF EXISTS "order_items_insert_public_or_owner" ON public.order_items;
CREATE POLICY "order_items_insert_public"
  ON public.order_items FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Allow public report submissions
DROP POLICY IF EXISTS "reports_insert_public" ON public.reports;
CREATE POLICY "reports_insert_public"
  ON public.reports FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Function to notify store owner when a new order is created
CREATE OR REPLACE FUNCTION public.notify_new_order()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  owner uuid;
BEGIN
  SELECT s.owner_id INTO owner
  FROM public.stores s
  WHERE s.id = NEW.store_id;

  IF owner IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, title, body, link)
    VALUES (
      owner,
      'Nouvelle commande',
      'Une nouvelle commande a été passée dans votre boutique.',
      '/vendeur/commandes'
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS orders_notify_new ON public.orders;
CREATE TRIGGER orders_notify_new
  AFTER INSERT ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.notify_new_order();
