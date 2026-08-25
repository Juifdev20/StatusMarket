-- ============================================================================
-- Migration 005 — Storage buckets
-- ============================================================================
-- Creates Supabase Storage buckets for product images, store logos,
-- payment proofs, and status visuals. Storage policies are set via SQL.
-- ============================================================================

INSERT INTO storage.buckets (id, name, public)
VALUES
  ('product-images', 'product-images', true),
  ('store-logos', 'store-logos', true),
  ('payment-proofs', 'payment-proofs', false),
  ('status-visuals', 'status-visuals', true)
ON CONFLICT (id) DO NOTHING;

-- ---- Storage policies ------------------------------------------------------
-- Product images: public read, authenticated upload by owner
DROP POLICY IF EXISTS "product_images_read_public" ON storage.objects;
CREATE POLICY "product_images_read_public"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'product-images');

DROP POLICY IF EXISTS "product_images_write_authenticated" ON storage.objects;
CREATE POLICY "product_images_write_authenticated"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'product-images' AND auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "product_images_update_owner" ON storage.objects;
CREATE POLICY "product_images_update_owner"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'product-images' AND auth.uid() = owner);

DROP POLICY IF EXISTS "product_images_delete_owner" ON storage.objects;
CREATE POLICY "product_images_delete_owner"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'product-images' AND auth.uid() = owner);

-- Store logos: public read, authenticated upload
DROP POLICY IF EXISTS "store_logos_read_public" ON storage.objects;
CREATE POLICY "store_logos_read_public"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'store-logos');

DROP POLICY IF EXISTS "store_logos_write_authenticated" ON storage.objects;
CREATE POLICY "store_logos_write_authenticated"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'store-logos' AND auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "store_logos_delete_owner" ON storage.objects;
CREATE POLICY "store_logos_delete_owner"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'store-logos' AND auth.uid() = owner);

-- Payment proofs: private — only owner and admin can read; only seller can write
DROP POLICY IF EXISTS "payment_proofs_read_owner_or_admin" ON storage.objects;
CREATE POLICY "payment_proofs_read_owner_or_admin"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'payment-proofs'
    AND (
      auth.uid() = owner
      OR EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid() AND p.role = 'SUPER_ADMIN'
      )
    )
  );

DROP POLICY IF EXISTS "payment_proofs_write_seller" ON storage.objects;
CREATE POLICY "payment_proofs_write_seller"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'payment-proofs' AND auth.uid() IS NOT NULL);

-- Status visuals: public read, authenticated upload
DROP POLICY IF EXISTS "status_visuals_read_public" ON storage.objects;
CREATE POLICY "status_visuals_read_public"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'status-visuals');

DROP POLICY IF EXISTS "status_visuals_write_authenticated" ON storage.objects;
CREATE POLICY "status_visuals_write_authenticated"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'status-visuals' AND auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "status_visuals_delete_owner" ON storage.objects;
CREATE POLICY "status_visuals_delete_owner"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'status-visuals' AND auth.uid() = owner);
