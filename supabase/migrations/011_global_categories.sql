-- ============================================================================
-- Migration 011 — Global predefined categories (shared across all stores)
-- ============================================================================

-- ---- global_categories table -----------------------------------------------
CREATE TABLE IF NOT EXISTS public.global_categories (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text           NOT NULL UNIQUE,
  slug          text           NOT NULL UNIQUE,
  icon          text           NOT NULL DEFAULT '📦',
  sort_order    integer        NOT NULL DEFAULT 0,
  is_active     boolean        NOT NULL DEFAULT true,
  created_at    timestamptz   NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_global_categories_slug ON public.global_categories(slug);
CREATE INDEX IF NOT EXISTS idx_global_categories_active ON public.global_categories(is_active);

ALTER TABLE public.global_categories ENABLE ROW LEVEL SECURITY;

-- Everyone can read global categories
CREATE POLICY "global_categories_select_all"
  ON public.global_categories FOR SELECT
  USING (true);

-- Only admin can insert/update/delete
CREATE POLICY "global_categories_insert_admin"
  ON public.global_categories FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'SUPER_ADMIN'
    )
  );

CREATE POLICY "global_categories_update_admin"
  ON public.global_categories FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'SUPER_ADMIN'
    )
  );

CREATE POLICY "global_categories_delete_admin"
  ON public.global_categories FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'SUPER_ADMIN'
    )
  );

-- ---- Add global_category_id to products ------------------------------------
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS global_category_id uuid REFERENCES public.global_categories(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_products_global_category_id ON public.products(global_category_id);

-- ---- Seed predefined categories --------------------------------------------
INSERT INTO public.global_categories (name, slug, icon, sort_order) VALUES
  ('Mode', 'mode', '👗', 1),
  ('Téléphones', 'telephones', '📱', 2),
  ('Chaussures', 'chaussures', '👟', 3),
  ('Beauté', 'beaute', '💄', 4),
  ('Maison', 'maison', '🏠', 5),
  ('Restaurant', 'restaurant', '🍔', 6),
  ('Informatique', 'informatique', '💻', 7),
  ('Accessoires', 'accessoires', '🎁', 8),
  ('Électronique', 'electronique', '🔌', 9),
  ('Santé', 'sante', '💊', 10),
  ('Sports', 'sports', '⚽', 11),
  ('Bébé & Enfant', 'bebe-enfant', '👶', 12),
  ('Automobile', 'automobile', '🚗', 13),
  ('Alimentation', 'alimentation', '🛒', 14),
  ('Services', 'services', '🛠️', 16)
ON CONFLICT (slug) DO NOTHING;
