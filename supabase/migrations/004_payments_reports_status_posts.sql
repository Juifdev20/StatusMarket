-- ============================================================================
-- Migration 004 — Payments, reports, status posts
-- ============================================================================

-- ---- Enums -----------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE payment_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE payment_mode AS ENUM ('MANUAL', 'GATEWAY');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE report_status AS ENUM ('OPEN', 'RESOLVED', 'DISMISSED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ---- payments table --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.payments (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id       uuid           NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  subscription_id uuid           REFERENCES public.subscriptions(id) ON DELETE SET NULL,
  plan_id         uuid           NOT NULL REFERENCES public.subscription_plans(id),
  amount          numeric(10,2) NOT NULL,
  currency        text           NOT NULL DEFAULT 'USD',
  status          payment_status NOT NULL DEFAULT 'PENDING',
  mode            payment_mode   NOT NULL DEFAULT 'MANUAL',
  proof_image_url text,
  reference       text,
  rejection_reason text,
  reviewed_by     uuid           REFERENCES public.profiles(id),
  reviewed_at     timestamptz,
  created_at      timestamptz   NOT NULL DEFAULT now(),
  updated_at      timestamptz   NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payments_seller_id ON public.payments(seller_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- RLS: seller can read own; admin can read/write all; seller can insert own
CREATE POLICY "payments_select_own_or_admin"
  ON public.payments FOR SELECT
  USING (
    seller_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'SUPER_ADMIN'
    )
  );

CREATE POLICY "payments_insert_own"
  ON public.payments FOR INSERT
  WITH CHECK (seller_id = auth.uid());

CREATE POLICY "payments_update_admin"
  ON public.payments FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'SUPER_ADMIN'
    )
  );

-- ---- status_posts table (generated status visuals) ------------------------
CREATE TABLE IF NOT EXISTS public.status_posts (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id      uuid           NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  product_id    uuid           REFERENCES public.products(id) ON DELETE SET NULL,
  image_url     text,
  caption       text,
  store_link    text,
  views         integer        NOT NULL DEFAULT 0,
  created_at    timestamptz   NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_status_posts_store_id ON public.status_posts(store_id);

ALTER TABLE public.status_posts ENABLE ROW LEVEL SECURITY;

-- RLS: owner/admin can read/write; public cannot (these are seller tools)
CREATE POLICY "status_posts_select_owner_or_admin"
  ON public.status_posts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.stores s
      WHERE s.id = status_posts.store_id AND s.owner_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'SUPER_ADMIN'
    )
  );

CREATE POLICY "status_posts_insert_owner"
  ON public.status_posts FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.stores s
      WHERE s.id = status_posts.store_id AND s.owner_id = auth.uid()
    )
  );

CREATE POLICY "status_posts_update_owner"
  ON public.status_posts FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.stores s
      WHERE s.id = status_posts.store_id AND s.owner_id = auth.uid()
    )
  );

CREATE POLICY "status_posts_delete_owner_or_admin"
  ON public.status_posts FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.stores s
      WHERE s.id = status_posts.store_id AND s.owner_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'SUPER_ADMIN'
    )
  );

-- ---- reports table (moderation) -------------------------------------------
CREATE TABLE IF NOT EXISTS public.reports (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id   uuid           REFERENCES public.profiles(id) ON DELETE SET NULL,
  target_type   text           NOT NULL,
  target_id     uuid           NOT NULL,
  reason        text           NOT NULL,
  status        report_status  NOT NULL DEFAULT 'OPEN',
  created_at    timestamptz   NOT NULL DEFAULT now(),
  updated_at    timestamptz   NOT NULL DEFAULT now()
);

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- RLS: any authenticated user can create a report; only admin can read/update
CREATE POLICY "reports_insert_authenticated"
  ON public.reports FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "reports_select_admin"
  ON public.reports FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'SUPER_ADMIN'
    )
  );

CREATE POLICY "reports_update_admin"
  ON public.reports FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'SUPER_ADMIN'
    )
  );

-- ---- Triggers --------------------------------------------------------------
DROP TRIGGER IF EXISTS payments_updated_at ON public.payments;
CREATE TRIGGER payments_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS reports_updated_at ON public.reports;
CREATE TRIGGER reports_updated_at
  BEFORE UPDATE ON public.reports
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
