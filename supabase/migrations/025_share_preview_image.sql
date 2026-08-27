-- ============================================================================
-- Migration 025 — Add share_preview_image_url to products
-- ============================================================================
-- Allows sellers to choose which image is used for WhatsApp/Open Graph previews.
-- Falls back to image_url if not set.

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS share_preview_image_url text;
