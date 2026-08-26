-- ============================================================================
-- Migration 015 — Add share_message to status_posts
-- ============================================================================

ALTER TABLE public.status_posts ADD COLUMN IF NOT EXISTS share_message text;
