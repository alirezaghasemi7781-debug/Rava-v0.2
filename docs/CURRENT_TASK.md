# CURRENT_TASK.md — Maps Upgrade Execution Handoff

**Phase:** Maps platform upgrade readiness (production-safe)  
**Active task:** Task 7 — Production smoke matrix & upgrade gate (**BLOCKED**)  
**Last updated:** 2026-08-04

---

## Completed — Tasks 1–6 (implementation done)

| Task | Result |
| --- | --- |
| 1 | Baseline inventory; already Maps JS v3; no runtime churn |
| 2 | `@vis.gl/react-google-maps` `1.9.0` npm + importmap + lockfile; `npm run build` OK |
| 3 | `APIProvider` `version="quarterly"` + `onError`; rollback note for numbered pin |
| 4 | Curated markers: `anchorLeft="-50%"` / `anchorTop="-50%"`; CSS translate removed; hover chip `start-1/2` |
| 5 | `waitForGoogle` → `importLibrary("places")`; field lists unchanged; `requestedLanguage: 'fa'` kept |
| 6 | Removed `@googlemaps/markerclusterer` from package.json + importmap; lockfile + build OK |

## Task 7 — BLOCKED (environment / credentials)

### Partial automated checks executed
- Dev server: `http://localhost:3000/` loads.
- Document root: `lang="fa"` `dir="rtl"` confirmed via CDP.
- Auth gate shown (Persian copy: «خوش اومدی!», «ادامه مسیر»).
- `google.maps` **not** loaded on Auth screen (expected: `MainMap`/`APIProvider` only mount inside Dashboard after auth).

### Missing (release-blocking for phase gate)
Cannot complete authenticated map smoke without a valid signed-in session:
- Map tiles / Istanbul default
- Gems toggle / Locate
- POI click → expand
- Explore RPC + Google fallback
- Console `google.maps.version` on quarterly line
- No `@vis.gl/react-google-maps` load errors on map mount

**Required from Architect / operator:** Provide a test account (or temporary smoke bypass decision) and confirm Maps API key HTTP-referrer allows `localhost:3000`, then re-run Task 7 only.

### Changed files this phase (Tasks 2–6)
- `package.json`
- `package-lock.json`
- `index.html`
- `components/map/MainMap.tsx`
- `services/placeService.ts`
- `docs/CURRENT_TASK.md` (handoff only)
