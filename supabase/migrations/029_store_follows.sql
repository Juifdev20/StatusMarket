-- ============================================================================
-- Migration 029 — Follow a store + notify followers of new posts/products
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.store_follows (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  store_id   uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, store_id)
);

CREATE INDEX IF NOT EXISTS idx_store_follows_store_id ON public.store_follows(store_id);
CREATE INDEX IF NOT EXISTS idx_store_follows_user_id ON public.store_follows(user_id);

ALTER TABLE public.store_follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "store_follows_select_own"
  ON public.store_follows FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "store_follows_insert_own"
  ON public.store_follows FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "store_follows_delete_own"
  ON public.store_follows FOR DELETE
  USING (user_id = auth.uid());

-- Public-safe aggregate: follower count only, never follower identities.
CREATE OR REPLACE VIEW public.store_follower_counts AS
  SELECT store_id, COUNT(*)::int AS follower_count
  FROM public.store_follows
  GROUP BY store_id;

-- ============================================================================
-- Fan-out notifications: a single batch INSERT ... SELECT per trigger, not a
-- per-follower loop. Uses SECURITY DEFINER so it fires regardless of which
-- client wrote the row (status_posts/products are inserted directly from the
-- browser via the Supabase client, not through the Express API).
-- ============================================================================

CREATE OR REPLACE FUNCTION public.notify_followers_new_status_post()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_store_name text;
BEGIN
  SELECT name INTO v_store_name FROM public.stores WHERE id = NEW.store_id;

  INSERT INTO public.notifications (user_id, title, body, link)
  SELECT sf.user_id,
         'Nouvelle publication de ' || v_store_name,
         COALESCE(NEW.caption, 'Découvrez la nouvelle publication de ' || v_store_name || '.'),
         '/pub/' || NEW.slug
  FROM public.store_follows sf
  WHERE sf.store_id = NEW.store_id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS status_posts_notify_followers ON public.status_posts;
CREATE TRIGGER status_posts_notify_followers
  AFTER INSERT ON public.status_posts
  FOR EACH ROW EXECUTE FUNCTION public.notify_followers_new_status_post();

CREATE OR REPLACE FUNCTION public.notify_followers_new_product()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_store_name text;
  v_store_slug text;
BEGIN
  SELECT name, slug INTO v_store_name, v_store_slug FROM public.stores WHERE id = NEW.store_id;

  INSERT INTO public.notifications (user_id, title, body, link)
  SELECT sf.user_id,
         'Nouveau produit chez ' || v_store_name,
         NEW.name || ' est maintenant disponible.',
         '/boutique/' || v_store_slug
  FROM public.store_follows sf
  WHERE sf.store_id = NEW.store_id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS products_notify_followers ON public.products;
CREATE TRIGGER products_notify_followers
  AFTER INSERT ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.notify_followers_new_product();
