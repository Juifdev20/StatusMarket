-- ============================================================================
-- Migration 012 — Store location fields + extra global categories
-- ============================================================================

-- ---- Add optional location fields to stores --------------------------------
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS quartier text;
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS numero_porte text;
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS avenue text;

-- ---- Insert additional global categories -----------------------------------
INSERT INTO public.global_categories (name, slug, icon, sort_order) VALUES
  ('Transport', 'transport', '🚕', 15),
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
