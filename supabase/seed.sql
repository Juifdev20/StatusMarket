-- Seed: Test users and sample data
-- Run this in Supabase SQL Editor AFTER creating the auth users via Dashboard
-- Test users already created:
--   1. admin@test.com    / Admin1234!
--   2. vendeur@test.com  / Test1234!

-- Then run this script to set their roles and create sample data.

-- ============================================================
-- 1. Set roles
-- ============================================================
UPDATE profiles
SET role = 'SUPER_ADMIN', full_name = 'Administrateur Test'
WHERE id = (SELECT id FROM auth.users WHERE email = 'admin@test.com');

UPDATE profiles
SET role = 'SELLER', full_name = 'Vendeur Test'
WHERE id = (SELECT id FROM auth.users WHERE email = 'vendeur@test.com');

-- ============================================================
-- 2. Create a demo store for the seller
-- ============================================================
INSERT INTO stores (owner_id, name, slug, description, whatsapp_number, is_active, is_suspended)
SELECT p.id, 'Boutique Démo', 'boutique-demo', 'Boutique de démonstration StatusMarket', '+243970000000', true, false
FROM profiles p
JOIN auth.users u ON u.id = p.id
WHERE u.email = 'vendeur@test.com'
AND NOT EXISTS (SELECT 1 FROM stores WHERE slug = 'boutique-demo');

-- ============================================================
-- 3. Create sample categories
-- ============================================================
INSERT INTO categories (store_id, name, slug)
SELECT s.id, 'Homme', 'homme'
FROM stores s
WHERE s.slug = 'boutique-demo'
AND NOT EXISTS (SELECT 1 FROM categories WHERE store_id = s.id AND slug = 'homme');

INSERT INTO categories (store_id, name, slug)
SELECT s.id, 'Femme', 'femme'
FROM stores s
WHERE s.slug = 'boutique-demo'
AND NOT EXISTS (SELECT 1 FROM categories WHERE store_id = s.id AND slug = 'femme');

-- ============================================================
-- 4. Create sample products
-- ============================================================
INSERT INTO products (store_id, category_id, name, description, price, currency, is_available, stock)
SELECT s.id, c.id, 'Chemise slim homme', 'Chemise élégante pour homme', 15000, 'CDF', true, 10
FROM stores s, categories c
WHERE s.slug = 'boutique-demo' AND c.slug = 'homme' AND c.store_id = s.id
AND NOT EXISTS (SELECT 1 FROM products WHERE name = 'Chemise slim homme' AND store_id = s.id);

INSERT INTO products (store_id, category_id, name, description, price, currency, is_available, stock)
SELECT s.id, c.id, 'Pantalon classique', 'Pantalon de qualité', 20000, 'CDF', true, 5
FROM stores s, categories c
WHERE s.slug = 'boutique-demo' AND c.slug = 'homme' AND c.store_id = s.id
AND NOT EXISTS (SELECT 1 FROM products WHERE name = 'Pantalon classique' AND store_id = s.id);

INSERT INTO products (store_id, category_id, name, description, price, currency, is_available, stock)
SELECT s.id, c.id, 'Robe élégante', 'Robe pour femme', 25000, 'CDF', true, 8
FROM stores s, categories c
WHERE s.slug = 'boutique-demo' AND c.slug = 'femme' AND c.store_id = s.id
AND NOT EXISTS (SELECT 1 FROM products WHERE name = 'Robe élégante' AND store_id = s.id);

-- ============================================================
-- 5. Create free subscription for the seller
-- ============================================================
INSERT INTO subscriptions (seller_id, plan_id, status, starts_at)
SELECT
  p.id,
  sp.id,
  'ACTIVE',
  NOW()
FROM profiles p
JOIN auth.users u ON u.id = p.id, subscription_plans sp
WHERE u.email = 'vendeur@test.com' AND sp.code = 'FREE'
AND NOT EXISTS (
  SELECT 1 FROM subscriptions sub WHERE sub.seller_id = p.id
);

-- ============================================================
-- 6. Ensure platform_settings row exists
-- ============================================================
INSERT INTO platform_settings (id, trial_duration_days, trial_alert_days)
VALUES (1, 7, 3)
ON CONFLICT (id) DO NOTHING;
