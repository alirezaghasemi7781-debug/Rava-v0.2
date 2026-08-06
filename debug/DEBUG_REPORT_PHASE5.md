# Phase 5 Debug Report — Rava UI/UX Polish

Generated from code inspection after Phase 5 work (not invented scenarios).
Priorities: **Critical** / **High** / **Medium** / **Low**.

Status legend: ✅ Mitigated · ⚠️ Partial · ❌ Open

---

## Critical

| Issue | Observation | Status |
|-------|-------------|--------|
| Gemini Live with zero fuel | `sessionManager.connect` blocks when `wallet.balance <= 0` and shows Persian `alert`. No in-app TopUp deep-link from the alert. | ⚠️ Partial |
| Auth persist key still on old brand | Was `rahnam-auth-storage-v3`. Migrated to `rava-auth-storage-v3` via `migrateLocalStorageKey`. | ✅ Mitigated |
| User-facing old brand (Rahnam / رهنما) | Runtime copy audited; remaining mentions are migration comments / persona “never use” rules. | ✅ Mitigated |

---

## High

| Issue | Observation | Status |
|-------|-------------|--------|
| Weak / offline network (discovery) | `refreshFeed` now sets `feedError`; Explore sections show `ErrorState` + Retry. Curated fetch still fails soft and keeps last cache (good for offline map). | ⚠️ Partial — curated errors not surfaced in UI |
| Gemini reconnect after drop | `connectionRecovery` exponential backoff, max 3 retries; then requires manual reconnect. Status can be `reconnecting`. No dedicated full-screen “reconnect failed” UX beyond MagicButton ring. | ⚠️ Partial |
| GPS denied / unavailable | `MainMap` `watchPosition` ignores `PERMISSION_DENIED` (code 1) silently; Explore needs location for feed and may stay empty without clear GPS CTA. Falls back to city center curated when city mode set. | ⚠️ Partial |
| Empty DB / empty Places | Nearby search → `PlaceService.fetchNearbyFallback`. Explore empty states per section. Seed SQL exists but empty remote DB still yields thin sections derived from same feed. | ⚠️ Partial |
| Rapid marker / POI clicks | `poiSelectionService` has a `processing` guard for Google fetches; `POIController` uses `activeRequestIdRef` to drop stale detail responses. | ✅ Mitigated |

---

## Medium

| Issue | Observation | Status |
|-------|-------------|--------|
| Zero balance voice UX | Alert only; Tools/TopUp exist but not auto-routed. | ⚠️ Partial |
| Stamp date format mix | New stamps use `formatJalaliShort`; older stamps may be `fa-IR` locale strings — `displayJalaliDate` preserves Persian-digit strings. | ✅ Mitigated |
| RTL icon / chrome | BottomBar/TopBar use `inset-x` + safe area; Explore/Profile back uses `ChevronRight` (RTL start). Some modals still use physical `left-*` for close buttons. | ⚠️ Partial |
| Vazirmatn CDN | Still Google Fonts CDN; comment in `index.html` notes self-host for PWA/offline. | ⚠️ Partial |
| Explore interest section | Derived from `semanticProfile.interests` + feed heuristics; weak when profile interests empty (falls back to category diversity). | ⚠️ Partial |
| POI sheet overflow on small phones | Sheet is `h-[95vh]` with `pb-safe`; horizontal `px-12` may feel tight on narrow devices. | ⚠️ Partial |
| Maps API load failure | `handleMapsApiError` logs only — no user-facing ErrorState on map. | ❌ Open |

---

## Low

| Issue | Observation | Status |
|-------|-------------|--------|
| English leftovers in niche modals | Phase 5 cleared Auth splash, Explore subtitle, Passport stats, Referral “OR”, VoiceLab, MyTrip Passport/XP labels. Residual English may remain in Tools / less-visited modals. | ⚠️ Partial |
| Tailwind via CDN | Production risk (CDN availability, class purge unpredictability). Tokens in CSS variables help brand consistency but do not replace a built Tailwind pipeline. | ❌ Open |
| Duplicate path casing on Windows | Git status shows both `pages/Explore.tsx` and `pages\Explore.tsx` style entries — same files; watch for case-only duplicates on case-sensitive CI. | ⚠️ Partial |
| MagicButton / fuel display | Minutes shown with Latin digits in some headers; Passport now uses Persian digits via `toPersianDigits`. | ⚠️ Partial |
| Static trip template titles | `titleFa` shown; English `title` still in data for AI/tools. | ✅ OK by design |

---

## Checklist — resilience scenarios

- [x] **Weak net — discovery:** Error + Retry on Explore sections (`feedError`)
- [ ] **Weak net — curated markers:** Still silent preserve-last-cache (consider toast)
- [x] **Gemini reconnect:** Backoff ×3 in `connectionRecovery`
- [ ] **Gemini reconnect exhausted:** Manual retry UX incomplete
- [x] **Zero balance:** Connect blocked + alert
- [ ] **Zero balance → TopUp:** No auto navigation
- [x] **GPS denied:** No crash; silent on deny
- [ ] **GPS denied UX:** No Persian permission CTA on Explore/Map
- [x] **Empty feed:** EmptyState copy per section
- [x] **Empty favorites:** Dedicated Saved empty state
- [x] **Rapid POI clicks:** Request-id guard on detail expand
- [x] **Auth storage rename:** `rava-auth-storage-v3` + migrate
- [x] **Jalali dates:** Helper + trip/stamp/recap UI
- [x] **LTR islands:** Email, referral codes, coords-ready `.ltr-island`

---

## Phase 5 delivered (summary)

1. Explore sections (Nearby, interests, Hidden Gems, Budget, Popular, Time-of-day, Saved) with Skeleton / Empty / Error+Retry  
2. Design tokens (`styles/tokens.css` + `index.css`) and shared `components/ui/*`  
3. RTL / Persian polish + `utils/jalali.ts`  
4. Brand/auth storage fix and this report  
