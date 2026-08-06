# Supabase Production Report — Rava

**Project:** `thmsfdugojokxtemnqdw` (Rava 1.0) · Region `eu-central-1` · Status `ACTIVE_HEALTHY`  
**Date:** 2026-08-06

## 1. Already correct

- Core tables present with **RLS enabled**: `profiles`, `trips`, `stamps`, `favorites`, `reward_ledger`, `chat_logs`, `footprints`, `price_reports`, `places_cache`, `destinations`, `attractions`, `narratives`
- PostGIS active; spatial indexes on places/trips/footprints
- Storage buckets existed: `avatars` (public), `tickets` (private), `narratives`, `price_proofs`
- Avatar storage policies (owner folder) already in place
- Working RPCs already live: `process_poi_visit`, `claim_referral`, `search_nearby_places`, `get_nearby_footprints`, `increment_my_wallet`, `admin_increment_wallet`
- Edge Functions already deployed: `process-ticket`, `verify-price`, `the-dreamer` (JWT verified)
- Email auth enabled; autoconfirm **off** (email verification required)

## 2. What changed

### Migrations applied (01→08)

| Migration | Purpose |
|-----------|---------|
| 01 core_schema | Missing tables/cols (`daily_recaps`, `achievements`, `user_achievements`, `avatar_url`, stamps `created_at` backfill) |
| 02 rls_and_rpcs | Owner CRUD policies; `increment_wallet`; economy RPCs |
| 03 seed_places | ≥20 POIs/city + rich `get_city_attractions` |
| 04 fuel_idempotent | Ledger-first `deduct_fuel` with stable `transaction_id` |
| 05 budget_gamification | Trip budget cols, streak, `claim_reward`, `record_daily_activity`, `update_trip_budget` |
| 06 journey_logic | `user_trips` + trip activity columns + RLS |
| 07 production_hardening | Policy cleanup, RPC grants/revokes, storage policies, improved nearby search |
| 08 production_hotfix | Fixed `get_city_attractions` name ambiguity; stamp `created_at`↔`stamped_at` sync |

### Other remote fixes

- Dropped legacy non-idempotent `deduct_fuel` overloads
- Hardened `claim_referral` (ledger for both parties)
- `admin_increment_wallet` revoked from `anon` / `authenticated`
- Public place RPCs granted to `anon` (map/explore before/without session)
- Auth redirect allow-list set for local dev URLs
- Edge functions **redeployed** from current repo sources
- Migration versions recorded in `supabase_migrations.schema_migrations`
- Project linked via Supabase CLI (`npx supabase link`)

### Repo tooling

- `scripts/apply_migrations.mjs` — idempotent remote apply with retries
- Fixed migration 05 dependency on `user_trips` (CREATE IF NOT EXISTS before ALTER)

## 3. Remaining issues / risks

| Priority | Item |
|----------|------|
| **High** | Auth **Site URL** is still `http://localhost:3000`. Before public launch, set production domain + add it to redirect allow-list (password recovery / magic links). |
| **High** | Rotate the Supabase **personal access token** shared in chat; treat it as compromised. |
| **Medium** | Some attraction Place IDs are synthetic (`rava_syn_*`); refresh via `npm run fetch:places` with a server-only Google key when ready. |
| **Medium** | Istanbul 31 / Dubai 28 include legacy 7+5 rows plus new seed (duplicates by different IDs possible). Optional cleanup later. |
| **Low** | Tailwind CDN / app UI residuals are outside Supabase scope (see Phase 5 debug report). |

## 4. Production readiness verdict

**Database / RLS / RPCs / storage / edge functions: YES — ready for launch** once the Auth Site URL is pointed at the production domain and the exposed access token is rotated.

Smoke-test auth (signup → confirm → onboarding) and one stamp / fuel deduct against the live project after Site URL update.
