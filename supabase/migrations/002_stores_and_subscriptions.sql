-- ============================================================================
-- Migration 002 — Stores, subscription plans, subscriptions
-- ============================================================================
-- Creates stores (shops), subscription_plans (FREE/PRO/BUSINESS stored in DB
-- so admins can adjust), and subscriptions linking a seller to a plan with
-- trial support. RLS enabled on all tables.
-- ============================================================================

-- ---- Enums -----------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE plan_code AS ENUM ('FREE', 'PRO', 'BUSINESS');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE subscription_status AS ENUM ('TRIAL', 'ACTIVE', 'EXPIRED', 'CANCELLED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ---- subscription_plans table ---------------------------------------------
CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code            plan_code      NOT NULL UNIQUE,
  name            text           NOT NULL,
  description     text,
  price_usd       numeric(10,2) NOT NULL DEFAULT 0,
  duration_days   integer        NOT NULL DEFAULT 30,
  max_products    integer,         -- NULL = unlimited
  max_stores      integer        NOT NULL DEFAULT 1,
  features        jsonb         NOT NULL DEFAULT '[]'::jsonb,
  is_active       boolean        NOT NULL DEFAULT true,
  sort_order      integer        NOT NULL DEFAULT 0,
  created_at      timestamptz   NOT NULL DEFAULT now(),
  updated_at      timestamptz   NOT NULL DEFAULT now()
);

ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

-- RLS: anyone can read plans (public display); only admin can write
CREATE POLICY "subscription_plans_select_all"
  ON public.subscription_plans FOR SELECT
  USING (true);

CREATE POLICY "subscription_plans_write_admin"
  ON public.subscription_plans FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'SUPER_ADMIN'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'SUPER_ADMIN'
    )
  );

-- Seed default plans
INSERT INTO public.subscription_plans (code, name, description, price_usd, duration_days, max_products, max_stores, features, sort_order)
VALUES
  ('FREE', 'Free', '1 boutique, lien personnalisé, 10-15 produits, catégories, bouton WhatsApp', 0, 0, 15, 1,
    '["custom_link","categories","whatsapp_order"]'::jsonb, 0),
  ('PRO', 'Pro', 'Produits illimités, statistiques, générateur de statuts, promotions, suppression branding, gestion stock, collections', 10, 30, NULL, 1,
    '["unlimited_products","stats","status_generator","promotions","no_branding","stock_management","collections"]'::jsonb, 1),
  ('BUSINESS', 'Business', 'Plan Business — à définir', 25, 30, NULL, 5,
    '[]'::jsonb, 2)
ON CONFLICT (code) DO NOTHING;

-- ---- stores table ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.stores (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id      uuid           NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name          text           NOT NULL,
  slug          text           NOT NULL UNIQUE,
  logo_url      text,
  description   text,
  whatsapp_number text,
  is_active     boolean        NOT NULL DEFAULT true,
  is_suspended  boolean        NOT NULL DEFAULT false,
  created_at    timestamptz   NOT NULL DEFAULT now(),
  updated_at    timestamptz   NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_stores_owner_id ON public.stores(owner_id);
CREATE INDEX IF NOT EXISTS idx_stores_slug ON public.stores(slug);

ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;

-- RLS: public can read active, non-suspended stores; owner can read/write own;
-- admin can read/write all
CREATE POLICY "stores_select_public_or_owner_or_admin"
  ON public.stores FOR SELECT
  USING (
    (is_active = true AND is_suspended = false)
    OR owner_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'SUPER_ADMIN'
    )
  );

CREATE POLICY "stores_insert_owner"
  ON public.stores FOR INSERT
  WITH CHECK (
    owner_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role IN ('SELLER', 'SUPER_ADMIN')
    )
  );

CREATE POLICY "stores_update_owner_or_admin"
  ON public.stores FOR UPDATE
  USING (
    owner_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'SUPER_ADMIN'
    )
  );

CREATE POLICY "stores_delete_owner_or_admin"
  ON public.stores FOR DELETE
  USING (
    owner_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'SUPER_ADMIN'
    )
  );

-- ---- subscriptions table ---------------------------------------------------
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id       uuid           NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  plan_id         uuid           NOT NULL REFERENCES public.subscription_plans(id),
  status          subscription_status NOT NULL DEFAULT 'TRIAL',
  trial_ends_at   timestamptz,
  starts_at       timestamptz,
  expires_at      timestamptz,
  created_at      timestamptz   NOT NULL DEFAULT now(),
  updated_at      timestamptz   NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_seller_id ON public.subscriptions(seller_id);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS: seller can read/write own; admin can read/write all
CREATE POLICY "subscriptions_select_own_or_admin"
  ON public.subscriptions FOR SELECT
  USING (
    seller_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'SUPER_ADMIN'
    )
  );

CREATE POLICY "subscriptions_insert_own_or_admin"
  ON public.subscriptions FOR INSERT
  WITH CHECK (
    seller_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'SUPER_ADMIN'
    )
  );

CREATE POLICY "subscriptions_update_own_or_admin"
  ON public.subscriptions FOR UPDATE
  USING (
    seller_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'SUPER_ADMIN'
    )
  );

-- ---- Triggers --------------------------------------------------------------
DROP TRIGGER IF EXISTS stores_updated_at ON public.stores;
CREATE TRIGGER stores_updated_at
  BEFORE UPDATE ON public.stores
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS subscriptions_updated_at ON public.subscriptions;
CREATE TRIGGER subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS subscription_plans_updated_at ON public.subscription_plans;
CREATE TRIGGER subscription_plans_updated_at
  BEFORE UPDATE ON public.subscription_plans
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
