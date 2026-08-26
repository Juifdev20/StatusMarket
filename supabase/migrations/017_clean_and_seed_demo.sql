-- ============================================================================
-- Migration 017 — Clean test stores and seed a professional demo store
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Remove test stores and their data
-- ---------------------------------------------------------------------------
WITH test_stores AS (
  SELECT id, owner_id
  FROM public.stores
  WHERE name IN ('dmj', 'God is good', 'Boutique Démo', 'Ma boutique')
     OR name ILIKE '%test%'
     OR name ILIKE '%demo%'
     OR name ILIKE '%ma boutique%'
)
DELETE FROM public.products
WHERE store_id IN (SELECT id FROM test_stores);

WITH test_stores AS (
  SELECT id, owner_id
  FROM public.stores
  WHERE name IN ('dmj', 'God is good', 'Boutique Démo', 'Ma boutique')
     OR name ILIKE '%test%'
     OR name ILIKE '%demo%'
     OR name ILIKE '%ma boutique%'
)
DELETE FROM public.categories
WHERE store_id IN (SELECT id FROM test_stores);

WITH test_stores AS (
  SELECT id, owner_id
  FROM public.stores
  WHERE name IN ('dmj', 'God is good', 'Boutique Démo', 'Ma boutique')
     OR name ILIKE '%test%'
     OR name ILIKE '%demo%'
     OR name ILIKE '%ma boutique%'
)
DELETE FROM public.orders
WHERE store_id IN (SELECT id FROM test_stores);

WITH test_stores AS (
  SELECT id, owner_id
  FROM public.stores
  WHERE name IN ('dmj', 'God is good', 'Boutique Démo', 'Ma boutique')
     OR name ILIKE '%test%'
     OR name ILIKE '%demo%'
     OR name ILIKE '%ma boutique%'
)
DELETE FROM public.status_posts
WHERE store_id IN (SELECT id FROM test_stores);

DELETE FROM public.stores
WHERE name IN ('dmj', 'God is good', 'Boutique Démo', 'Ma boutique')
   OR name ILIKE '%test%'
   OR name ILIKE '%demo%'
   OR name ILIKE '%ma boutique%';

-- ---------------------------------------------------------------------------
-- 2. Seed a professional demo store
-- ---------------------------------------------------------------------------
WITH demo_owner AS (
  SELECT id
  FROM public.profiles
  WHERE role = 'SELLER'
  ORDER BY created_at ASC
  LIMIT 1
),
new_store AS (
  INSERT INTO public.stores (
    owner_id,
    name,
    slug,
    description,
    whatsapp_number,
    city,
    logo_url,
    store_front_image_url,
    is_active,
    is_suspended
  )
  SELECT
    d.id,
    'Boutique Élégance',
    'boutique-elegance',
    'Votre boutique de référence à Goma. Mode, accessoires et tendances soigneusement sélectionnés pour vous.',
    '+243990000000',
    'Goma',
    'https://images.unsplash.com/photo-1557800634-95f7f9c51066?w=200&h=200&fit=crop',
    'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&fit=crop',
    true,
    false
  FROM demo_owner d
  RETURNING id
)
INSERT INTO public.products (
  store_id,
  global_category_id,
  name,
  description,
  price,
  currency,
  image_url,
  images,
  is_available,
  is_promoted,
  stock
)
SELECT
  s.id,
  gc.id,
  p.name,
  p.description,
  p.price,
  p.currency,
  p.image_url,
  to_jsonb(ARRAY[p.image_url]),
  true,
  p.is_promoted,
  p.stock
FROM new_store s
CROSS JOIN (VALUES
  ('Baskets urban', 'Baskets confortables pour la ville.', 42000, 'CDF', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&fit=crop', 'chaussures', 15, false),
  ('Casquette premium', 'Casquette élégante, parfaite pour un look décontracté.', 12000, 'CDF', 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=600&fit=crop', 'accessoires', 30, false),
  ('T-shirt oversize', 'Coton doux, coupe moderne.', 18000, 'CDF', 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&fit=crop', 'mode', 25, false),
  ('Sac en cuir', 'Sac pratique et intemporel.', 85000, 'CDF', 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600&fit=crop', 'accessoires', 8, true),
  ('Lunettes de soleil', 'Protection UV, style affirmé.', 25000, 'CDF', 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=600&fit=crop', 'accessoires', 12, false),
  ('Smartphone ultra', 'Puissant, écran lumineux, autonomie optimale.', 250000, 'CDF', 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&fit=crop', 'telephones', 5, true)
) AS p(name, description, price, currency, image_url, category_slug, stock, is_promoted)
JOIN public.global_categories gc ON gc.slug = p.category_slug;
