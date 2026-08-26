-- ============================================================================
-- Migration 013 — Fix: ensure global_categories table exists and seed all categories
-- ============================================================================

-- ---- Create global_categories table if not already created -----------------
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

DO $$ BEGIN
  CREATE POLICY "global_categories_select_all"
    ON public.global_categories FOR SELECT
    USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "global_categories_insert_admin"
    ON public.global_categories FOR INSERT
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid() AND p.role = 'SUPER_ADMIN'
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "global_categories_update_admin"
    ON public.global_categories FOR UPDATE
    USING (
      EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid() AND p.role = 'SUPER_ADMIN'
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "global_categories_delete_admin"
    ON public.global_categories FOR DELETE
    USING (
      EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid() AND p.role = 'SUPER_ADMIN'
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ---- Add global_category_id to products if missing --------------------------
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS global_category_id uuid REFERENCES public.global_categories(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_products_global_category_id ON public.products(global_category_id);

-- ---- Add store location fields if missing ----------------------------------
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS quartier text;
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS numero_porte text;
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS avenue text;

-- ---- Seed ALL global categories (initial + extra) --------------------------
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
  ('Transport', 'transport', '🚕', 15),
  ('Services', 'services', '🛠️', 16),
  ('Logiciels & Applications', 'logiciels-applications', '💿', 17),
  ('Livres & Manuels', 'livres-manuels', '📚', 18),
  ('Agriculture', 'agriculture', '🌱', 19),
  ('Mode Homme', 'mode-homme', '👔', 20),
  ('Mode Femme', 'mode-femme', '👗', 21),
  ('Cosmétiques', 'cosmetiques', '💅', 22),
  ('Bijoux & Montres', 'bijoux-montres', '⌚', 23),
  ('Musique & Instruments', 'musique-instruments', '🎸', 24),
  ('Art & Artisanat', 'art-artisanat', '🎨', 25),
  ('Photographie', 'photographie', '📷', 26),
  ('Jardinerie', 'jardinerie', '🌿', 27),
  ('Bureautique', 'bureautique', '🖨️', 28),
  ('Vêtements Enfant', 'vetements-enfant', '🧒', 29),
  ('Pharmacie', 'pharmacie', '🏥', 30),
  ('Boulangerie', 'boulangerie', '🥖', 31),
  ('Boucherie', 'boucherie', '🥩', 32),
  ('Poissonnerie', 'poissonnerie', '🐟', 33),
  ('Quincaillerie', 'quincaillerie', '🔧', 34),
  ('Bricolage', 'bricolage', '🔨', 35)
ON CONFLICT (slug) DO NOTHING;
