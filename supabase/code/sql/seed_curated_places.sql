-- =====================================================================================
-- DEPRECATED STUB — RAVA Phase 2.1 seed moved to migrations
-- =====================================================================================
-- Canonical seed (≥20 Istanbul + ≥20 Dubai):
--   supabase/migrations/20240806000003_seed_places.sql
--
-- Place ID policy:
--   • Real Google Place IDs (ChIJ…) for famous landmarks when known
--   • Synthetic: rava_syn_{city}_{slug} — NOT Google IDs; refresh via
--     scripts/fetch_places.mjs when GOOGLE_PLACES_API_KEY is available
-- =====================================================================================

SELECT 'Use migration 20240806000003_seed_places.sql' AS notice;
