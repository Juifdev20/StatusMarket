-- ============================================================================
-- Migration 032 — Paid-only AI generation, configurable trial duration units,
-- and hiding expired sellers' shops/products from the public.
-- ============================================================================

-- ---- platform_settings: flexible trial duration + AI daily limit ----------
ALTER TABLE public.platform_settings
  DROP COLUMN IF EXISTS trial_duration_days;

ALTER TABLE public.platform_settings
  ADD COLUMN IF NOT EXISTS trial_duration_value integer NOT NULL DEFAULT 7,
  ADD COLUMN IF NOT EXISTS trial_duration_unit text NOT NULL DEFAULT 'days',
  ADD COLUMN IF NOT EXISTS ai_daily_limit integer NOT NULL DEFAULT 5;

DO $$ BEGIN
  ALTER TABLE public.platform_settings
    ADD CONSTRAINT platform_settings_trial_unit_check
    CHECK (trial_duration_unit IN ('minutes', 'hours', 'days', 'years'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ---- subscriptions: track whether the "expiring soon" alert was sent ------
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS trial_alert_sent boolean NOT NULL DEFAULT false;

-- ---- ai_generation_logs: usage log backing the daily AI limit -------------
CREATE TABLE IF NOT EXISTS public.ai_generation_logs (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id   uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  store_id    uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  kind        text NOT NULL CHECK (kind IN ('caption', 'description')),
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_generation_logs_seller_created ON public.ai_generation_logs(seller_id, created_at);

ALTER TABLE public.ai_generation_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ai_generation_logs_select_own_or_admin" ON public.ai_generation_logs;
CREATE POLICY "ai_generation_logs_select_own_or_admin"
  ON public.ai_generation_logs FOR SELECT
  USING (seller_id = auth.uid() OR public.is_super_admin());

-- Intentionally no INSERT policy for anon/authenticated: only the Express API,
-- using the service-role key, may write usage logs. This guarantees every AI
-- generation actually went through the paid-plan + daily-limit checks below.

-- ---- strict "paid, non-trial, active" check (distinct from the broader ----
-- ---- store_owner_subscription_active() from migration 031, which also  ----
-- ---- treats TRIAL as active — AI generation must NOT be available on   ----
-- ---- the free trial, only on a paid ACTIVE subscription).              ----
CREATE OR REPLACE FUNCTION public.store_owner_has_paid_subscription(p_store_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (
      SELECT sub.status = 'ACTIVE' AND (sub.expires_at IS NULL OR sub.expires_at > now())
      FROM public.subscriptions sub
      JOIN public.stores s ON s.owner_id = sub.seller_id
      WHERE s.id = p_store_id
      ORDER BY sub.created_at DESC
      LIMIT 1
    ),
    false
  );
$$;

-- ---- notify seller when they hit their daily AI generation limit ---------
CREATE OR REPLACE FUNCTION public.notify_ai_limit_reached()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_limit integer;
  v_count integer;
BEGIN
  SELECT ai_daily_limit INTO v_limit FROM public.platform_settings WHERE id = 1;
  SELECT count(*) INTO v_count FROM public.ai_generation_logs
    WHERE seller_id = NEW.seller_id AND created_at >= date_trunc('day', now());

  IF v_limit IS NOT NULL AND v_count = v_limit THEN
    INSERT INTO public.notifications (user_id, title, body, link)
    VALUES (
      NEW.seller_id,
      'Limite de générations IA atteinte',
      'Vous avez atteint votre limite quotidienne de générations IA. Elle sera renouvelée demain.',
      '/vendeur/produits'
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS ai_generation_logs_notify_limit ON public.ai_generation_logs;
CREATE TRIGGER ai_generation_logs_notify_limit
  AFTER INSERT ON public.ai_generation_logs
  FOR EACH ROW EXECUTE FUNCTION public.notify_ai_limit_reached();

-- ---- notify seller when their trial is about to end -----------------------
CREATE OR REPLACE FUNCTION public.notify_trial_expiring_soon()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.trial_alert_sent = true AND OLD.trial_alert_sent = false THEN
    INSERT INTO public.notifications (user_id, title, body, link)
    VALUES (
      NEW.seller_id,
      'Votre essai se termine bientôt',
      'Votre période d''essai touche à sa fin. Passez à un abonnement payant pour continuer à vendre sans interruption.',
      '/vendeur/abonnement'
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS subscriptions_notify_trial_expiring ON public.subscriptions;
CREATE TRIGGER subscriptions_notify_trial_expiring
  AFTER UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.notify_trial_expiring_soon();

-- ---- hide an expired seller's store/products from the public -------------
-- The owner (auth.uid() = owner_id) and admins keep full visibility either
-- way — only the "public" branch gains the subscription-active requirement.
DROP POLICY IF EXISTS "stores_select_public_or_owner_or_admin" ON public.stores;
CREATE POLICY "stores_select_public_or_owner_or_admin"
  ON public.stores FOR SELECT
  USING (
    (is_active = true AND is_suspended = false AND public.store_owner_subscription_active(id))
    OR owner_id = auth.uid()
    OR public.is_super_admin()
  );

DROP POLICY IF EXISTS "products_select_public_or_owner_or_admin" ON public.products;
CREATE POLICY "products_select_public_or_owner_or_admin"
  ON public.products FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.stores s
      WHERE s.id = products.store_id
        AND (
          (s.is_active = true AND s.is_suspended = false AND public.store_owner_subscription_active(s.id))
          OR s.owner_id = auth.uid()
          OR public.is_super_admin()
        )
    )
  );
