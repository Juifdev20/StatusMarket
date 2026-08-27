-- ============================================================================
-- Migration 022 — Store setup notifications (incomplete / complete / reminder)
-- ============================================================================

-- Helper: check if store is fully configured
CREATE OR REPLACE FUNCTION public.store_is_complete(s public.stores)
RETURNS boolean
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  RETURN s.logo_url IS NOT NULL
     AND s.city IS NOT NULL
     AND s.quartier IS NOT NULL
     AND s.whatsapp_number IS NOT NULL
     AND s.store_front_image_url IS NOT NULL;
END;
$$;

-- Notify seller to finalize store config when store is created incomplete
CREATE OR REPLACE FUNCTION public.notify_store_incomplete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT public.store_is_complete(NEW) THEN
    INSERT INTO public.notifications (user_id, title, body, link)
    VALUES (
      NEW.owner_id,
      'Finalisez la configuration de votre boutique',
      'Ajoutez votre logo, votre adresse et vos informations pour une meilleure visibilité.',
      '/vendeur'
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS stores_notify_incomplete ON public.stores;
CREATE TRIGGER stores_notify_incomplete
  AFTER INSERT ON public.stores
  FOR EACH ROW EXECUTE FUNCTION public.notify_store_incomplete();

-- Notify seller when store becomes fully configured
CREATE OR REPLACE FUNCTION public.notify_store_complete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT public.store_is_complete(OLD) AND public.store_is_complete(NEW) THEN
    INSERT INTO public.notifications (user_id, title, body, link)
    VALUES (
      NEW.owner_id,
      'Félicitations ! 🎉',
      'Vous avez finalisé la configuration de votre boutique. Merci de faire partie de la plateforme StatusMarket !',
      '/vendeur'
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS stores_notify_complete ON public.stores;
CREATE TRIGGER stores_notify_complete
  AFTER UPDATE ON public.stores
  FOR EACH ROW EXECUTE FUNCTION public.notify_store_complete();

-- Allow sellers to insert their own "reminder" notifications via service role
-- (The API will use the service role key for the reminder)
