# Pre-Launch Smoke Test Report — Rava

**Date:** 2026-08-06  
**Environment:** Local Vite `http://localhost:3000` + live Supabase `thmsfdugojokxtemnqdw`  
**Checklist source:** `docs/LAUNCH_CHECKLIST.md`  
**API results file:** `debug/SMOKE_TEST_RESULTS.json`

---

## 1. Tests performed

### A. Automated API / RPC suite (`scripts/smoke_test.mjs`)
End-to-end against live Supabase with a temporary confirmed user:

| Area | Checks |
|------|--------|
| Auth | Admin create+confirm, login, get user/session, password recovery request, cleanup delete |
| RLS | Profiles SELECT own-only; anon blocked from `deduct_fuel` |
| Onboarding | Profile upsert city + semantic + `onboarding_completed` |
| Map data | `get_city_attractions` Istanbul/Dubai ≥20; `search_nearby_places` |
| Favorites | Insert with auto `user_id` |
| Trip lifecycle | Create `user_trips` → active → add activity → complete → complete journey |
| Wallet | `deduct_fuel` + idempotent retry, `process_poi_visit`, `claim_reward`, streak, trip budget, zero-balance clamp |
| Passport | Stamps + achievements readable; daily_recaps insert |
| Edge | `process-ticket`, `verify-price`, `the-dreamer` reachable (not 404) |

### B. Browser UI validation
- Auth screen branding (**Rava / راوا**)
- Login → onboarding (city / vibe / crew) → dashboard
- Tabs: نقشه، کشف، سفر من، ابزارها، پروفایل
- Explore sections + empty states + static trip templates
- Profile fuel/XP/persona signals
- Map shell + curated layer control (Google Maps tiles blocked without API key)

### C. Production fixes applied during smoke
See section 3.

---

## 2. Passed items

### API suite (after hotfixes): **30/30** on first green run; **29/30** on immediate re-run (recovery hit email rate limit — not a functional regression)

- Signup+verify path, login, session recovery  
- Password recovery request accepted (when under rate limit)  
- RLS own-profile; anon cannot debit fuel  
- Onboarding profile write  
- Places: Istanbul **31**, Dubai **28**, nearby search returns rows  
- Favorites / user_trips / trips / daily_recaps  
- Idempotent fuel debit, stamps+rewards, claim_reward, streak, trip budget  
- Zero-balance clamp  
- Edge functions deployed  
- Journey complete  

### UI

- Branding Rava/راوا on auth + chrome  
- Login + onboarding completion (after race fix) persists and survives reload  
- Dashboard tabs navigate; My Trip shows «راوا · سفر من»  
- Explore shows all required section headings + empty states without GPS  
- Static trip templates listed  
- Profile shows fuel minutes / XP / persona  
- Map controls («جواهر»، «من») present; curated POI data loads from Supabase  

---

## 3. Failed items and fixes applied

| Failure (initial smoke) | Root cause | Fix |
|-------------------------|------------|-----|
| `user_trips` / `trips` / `daily_recaps` INSERT RLS 42501 | `user_id` omitted → policy reject | Migration `09`: `set_row_user_id` BEFORE INSERT triggers |
| `deduct_fuel` → `uuid_generate_v4() does not exist` | `search_path=public` hides `uuid-ossp` | Use `gen_random_uuid()` + `search_path=public, extensions` |
| Onboarding UI bounce back to city step | Race: optimistic `onboardingCompleted=true` then `hydrateFromProfile` read stale `false` | Write profile **before** flipping flag; hydrate re-read; don’t downgrade completed→false |
| Password recovery `@example.com` rejected | Supabase email validation | Use real-shaped domains in tests (`mailinator.com`) |
| Results JSON write crash | Env const named `URL` shadowed global `URL` | Renamed to `SUPABASE_URL` |

**Migrations added/applied:** `20240806000009_smoke_hotfixes.sql` (live)

---

## 4. Remaining blockers before public launch

| Priority | Blocker | Notes |
|----------|---------|-------|
| **Critical** | No `VITE_GOOGLE_MAPS_API_KEY` in env | Map shows Google billing/“can't load correctly”; markers/tiles/Directions unavailable in this environment |
| **Critical** | No `VITE_GEMINI_API_KEY` in env | Gemini Live connect / barge-in / reconnect **not executable** here |
| **High** | Auth Site URL still `http://localhost:3000` | Password recovery / magic links need production domain + redirect allow-list |
| **High** | Rotate shared Supabase personal access token | Exposed in prior chat |
| **Medium** | Explore “nearby” empty without GPS | Expected empty state; needs location permission on device |
| **Medium** | Edge `process-ticket` / `verify-price` return 500 on empty ping | Expected without valid payload; not 404 — full OCR/payload E2E still recommended |
| **Low** | Email send rate limit | Supabase mailer throttling during repeated recovery tests |

---

## Verdict

**Backend (Auth / RLS / Trips / Wallet / Places / Passport):** production-ready after smoke hotfixes — **validated live**.

**Frontend shell (Auth UI, Onboarding, Tabs, Explore empty states, Profile metrics):** validated in browser.

**Map tiles + Gemini Live:** **blocked in this environment** until Maps + Gemini API keys are provided in `.env.local` and Auth Site URL is set for production.

### Recommended next commands

```bash
# .env.local
VITE_SUPABASE_URL=https://thmsfdugojokxtemnqdw.supabase.co
VITE_SUPABASE_ANON_KEY=…
VITE_GOOGLE_MAPS_API_KEY=…
VITE_GEMINI_API_KEY=…

npm run dev
# then re-test Map POI click, Directions, MagicButton Live

SMOKE_URL=… SMOKE_ANON=… SMOKE_SERVICE=… npm run smoke
```
