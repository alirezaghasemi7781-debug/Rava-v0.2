# ARCHITECTURE.md — System Anchor

**Phase:** Maps platform upgrade readiness  
**Review date:** 2026-08-04  
**Scope note:** Existing product. Do not redraw the entire repository tree. Document organization rules, data flow, and files touched by the maps upgrade.

---

## 0. Localization & RTL Architecture (Mandatory)

### Product requirement
- **Primary UI language:** Persian (Farsi).
- **Layout direction:** Full RTL across the application.
- **LTR allowed only for:** code, URLs, email addresses, phone numbers, and numeric identifiers — each wrapped/isolated, never as a default page layout.

### Current implementation anchors
| Concern | Location / pattern |
| --- | --- |
| Document RTL root | `index.html`: `<html lang="fa" dir="rtl">` |
| Persian typography | `index.html`: Vazirmatn font; body defaults |
| Page text direction | Widespread `text-right` on pages/components (e.g. `Dashboard`, `Explore`, `POIController`) |
| Places API language | `placeService.ts`: `requestedLanguage: 'fa'` on Place requests |
| Map chrome | `MapControls.tsx`: left-side floating controls — must remain usable in RTL context (verify positioning after any map upgrade) |

### RTL review scope (any UI-touching task)
When modifying components, verify:
- **Layouts:** flex/grid direction, absolute positioning, safe-area padding
- **Components:** modals, sheets, cards, toasts, map overlays, POI panels
- **Forms:** label/input alignment, validation messages, keyboard flow
- **Navigation:** tab bar, back buttons, drawer open direction
- **Typography:** Persian copy alignment, line height, truncation
- **Spacing:** margin/padding that should mirror under RTL
- **Icons:** directional icons (arrows, chevrons, navigation) mirrored or semantically correct for RTL
- **Directional interactions:** swipe gestures, slide-in animations, tooltip placement

### Architectural decisions
1. Persian copy is the default for all new user-facing strings.
2. Root `dir="rtl"` is authoritative; nested `dir="ltr"` only for allowed technical exceptions.
3. Maps upgrade work must not regress RTL on map-adjacent UI (`MapControls`, marker tooltips, POI sheets).
4. Google Maps map canvas is inherently neutral; surrounding chrome and labels remain Persian/RTL.

---

## 1. Current Maps Reality (Investigation Verdict)

### What the codebase already is
- **Maps JavaScript API v3** via `@vis.gl/react-google-maps` (`APIProvider` loads the API).
- **Advanced Markers** with cloud map styling (`mapId="8e589146f4837837"`).
- **Places (New)** in `services/placeService.ts` (`Place`, `fetchFields`, `Place.searchNearby`, `importLibrary("places")`).
- Map UI shell: `components/map/MainMap.tsx` + `components/map/MapControls.tsx`.
- Map state: `store/useMapStore.ts`; curated layer: `store/useDiscoveryStore.ts` + `services/discoveryService.ts`.
- POI UX: `components/poi/POIController.tsx` (hybrid curated + Google details).
- Host surface: `pages/Dashboard.tsx` always mounts `MainMap` under the home tab.

### What is NOT in scope as a “v2→v3 rewrite”
Maps JS API v2 has been dead since 2021. No `GMap2` / v2 script tags exist. Treating this as a v2 migration would waste effort and risk regressions for premium users.

### What IS the upgrade
| Gap | Evidence | Decision |
| --- | --- | --- |
| React Maps library ~2 years behind | `package.json` + `index.html` importmap pin `1.1.0`; npm latest **1.9.0** (2026-07-03) | Upgrade wrapper in lockstep in both places |
| No Maps release channel pin | `APIProvider` has no `version`/`channel` | Production: pin **`quarterly`** for predictability; allow temporary numbered rollback |
| Manual marker CSS translate | `MainMap` CuratedMarker uses `style={{ transform: 'translate(-50%, -50%)' }}` | After ≥1.6.0, prefer `anchorLeft` / `anchorTop` (Maps JS ≥3.62) |
| Dead clustering dependency | `@googlemaps/markerclusterer` unused | Remove dependency unless clustering is scheduled immediately after upgrade |
| Key hygiene | Fallback keys embedded in `config.ts` | Document restriction; do not expand; prefer env-only in production ops |

### Solution evaluation (upgrade strategy)

**Problem:** Bring maps stack current without harming hundreds of premium users.

| Option | Pros | Cons | Verdict |
| --- | --- | --- | --- |
| A. Ignore wrapper; only change Google Cloud console | Zero code risk short-term | Leaves known bugs/missing APIs; channel still uncontrolled | Reject |
| B. Jump to 1.9.0 + weekly channel + all marker/Places edits in one PR | Fast | Hard to bisect; weekly can break mid-week | Reject for production |
| C. Staged: inventory → dual pin (npm + importmap) to 1.9.0 → pin `quarterly` + `onError` → marker anchors → Places load hygiene → dead-dep cleanup → smoke matrix | Bisectable; reversible via version pin; matches existing architecture | Slightly longer | **Select** |

---

## 2. Database Schema (Maps-relevant + core)

Source of truth excerpts: `supabase/code/database_schema.txt` and later RPC/attraction layers. Coordinate rule is non-negotiable.

### Global rule
- PostGIS / GEOGRAPHY: **`(longitude, latitude)`**
- Google Maps / app UI / Zustand: **`(latitude, longitude)`**
- Conversion: only via `utils/geoPoint.ts`

### Core tables (summary)

#### `profiles`
- `id` UUID PK → `auth.users`
- `username` TEXT UNIQUE
- `wallet_balance` DECIMAL (AI hours; UI may show minutes ×60)
- `xp_level` INTEGER, `reputation_score` INTEGER
- `current_city` TEXT CHECK (`Istanbul` \| `Dubai` \| `Tehran`)
- `preferences` JSONB
- `created_at` timestamptz

#### `places_cache`
- `place_id` TEXT PK (Google Place ID)
- `name` TEXT NOT NULL
- `location` GEOGRAPHY(POINT, 4326) NOT NULL
- `category` TEXT, `google_types` TEXT[]
- `address`, `phone`, `opening_hours` JSONB
- `google_photo_refs` JSONB[], `crowd_photos` JSONB[]
- `vibe_summary` TEXT, `last_ai_analysis` timestamptz
- `updated_at` timestamptz  
- **Business rule:** Lazy refresh — if older than ~30 days, re-fetch Google essentials.

#### `footprints`
- `id` UUID PK
- `user_id` → `profiles`
- `place_id` → `places_cache`
- `location` GEOGRAPHY(POINT, 4326)
- `content`, `mood`, `upvotes`, `is_verified`, `created_at`

#### `price_reports`, `trips`
- Location-bearing contribution / itinerary entities; not direct Maps JS API objects.

#### Curated attractions layer (runtime)
- Discovery uses RPC `get_city_attractions` / table `attractions` + `narratives` (see `discoveryService` / `PlaceService.fetchHybridDetails`).
- Curated markers on the map are **not** Google Nearby results; they are first-party data with optional Google Place ID linkage.

---

## 3. API Routing & Data Flow

### 3.1 Authentication
- Supabase Auth via `store/useAuthStore.ts` + `features/auth/*`
- `App.tsx` → `initializeAuth()` then `AuthGuard`
- Maps keys are **not** user-scoped; they are app-scoped (`APP_CONFIG.GOOGLE.MAPS_API_KEY`)

### 3.2 Map boot sequence
1. `Dashboard` mounts `MainMap`.
2. `APIProvider` loads Maps JS with libraries `places` + `marker`.
3. `Map` renders with `mapId`, `colorScheme="DARK"`, `disableDefaultUI`, `gestureHandling="greedy"`.
4. `MapController` (inside map):
   - Ensures default `cityMode` (Istanbul)
   - Attaches native `map.addListener('click')` for Google POI `placeId`
   - On POI click: `e.stop()` → `PlaceService.fetchEssentials(placeId)` → `useMapStore.setActivePOI`
   - On city change: `fetchCurated(city)` + `panTo` / `setZoom`
   - Watches geolocation → `setUserLocation([lat, lng])`
5. Markers:
   - Curated from `useDiscoveryStore.curatedPlaces`
   - Footprints from `nearbyFootprints` + `pendingFootprints`
   - User location AdvancedMarker

### 3.3 Places data movement
```
User click / Explore mood
        │
        ▼
discoveryService (Supabase RPC) ──empty──► PlaceService.fetchNearbyFallback (Places New)
        │
        ▼
useDiscoveryStore.discoveredPlaces / curatedPlaces
        │
        ▼
POIController expand
        │
        ├─ PlaceService.fetchHybridDetails (Supabase attractions + cache)
        └─ PlaceService.fetchFullDetails (Places New fetchFields)
```

### 3.4 External integrations (maps)
- **Maps JS API** — map tiles, Advanced Markers, clickable POI icons
- **Places Library (New)** — essentials, full details, photos, nearby fallback
- **Cloud Map ID** — required for Advanced Markers / cloud styling
- **Gemini** — vibe summary only (not maps rendering)

### 3.5 Important architectural decisions
1. **Single maps entry:** Only `MainMap` owns `APIProvider`.
2. **Hybrid POI truth:** Curated DB wins when present; Google fills gaps.
3. **Field minimization:** Photos fetched only on demand (`fetchPlacePhotos`).
4. **GeoPoint as boundary:** Services/UI must not invent ad-hoc `{lat,lng}` parsers for PostGIS.
5. **Upgrade channel:** Production maps load must use **`version="quarterly"`** on `APIProvider` after upgrade (or explicit numbered version during incident rollback). Do not leave default weekly for premium production without a test window.

### 3.6 Official references used for this phase
- https://developers.google.com/maps/documentation/javascript/v2tov3 (historical; not applicable to this repo)
- https://developers.google.com/maps/deprecations
- https://developers.google.com/maps/documentation/javascript/versions
- https://developers.google.com/maps/documentation/javascript/legacy/places-migration-overview
- https://visgl.github.io/react-google-maps/docs/whats-new
- npm `@vis.gl/react-google-maps@1.9.0` (2026-07-03)

---

## 4. File Tree Rules (Existing Project)

### Organization rules
| Category | Location |
| --- | --- |
| Map React components | `components/map/` |
| POI sheet / detail UX | `components/poi/` |
| Google Places + hybrid fetch | `services/placeService.ts` |
| Supabase discovery RPCs | `services/discoveryService.ts` |
| Map / POI Zustand | `store/useMapStore.ts`, `store/useDiscoveryStore.ts` |
| Coordinate conversions | `utils/geoPoint.ts` |
| Env / API keys | `config.ts` only |
| App shell hosting map | `pages/Dashboard.tsx` |
| Dependency pins | `package.json` **and** `index.html` importmap (must stay synchronized for this project) |
| Brain docs | `docs/PROJECT.md`, `docs/ARCHITECTURE.md`, `docs/tasks.md` |
| RTL / locale root | `index.html` (`lang="fa"`, `dir="rtl"`) |
| Persian UI surfaces | `pages/*`, `components/*`, `features/*` |

### New files that may be created during upgrade
- Optional: `docs/` updates only via architect (already these three).
- Optional: thin `services/maps/` adapter **only if** Places wait/load logic grows enough to justify extraction — prefer not creating unless `placeService.ts` becomes unsafe to modify.
- Do **not** create a second map component tree.

### Existing files that need modification (upgrade phase)
| File | Why |
| --- | --- |
| `package.json` | Bump `@vis.gl/react-google-maps` to `1.9.0`; decide fate of unused markerclusterer |
| `package-lock.json` | Lockfile regenerate after bump |
| `index.html` | Sync importmap `@vis.gl/react-google-maps@1.9.0` |
| `components/map/MainMap.tsx` | `APIProvider` channel/`onError`; AdvancedMarker anchors; keep libraries |
| `components/map/MapControls.tsx` | Verify `useMap` still works after bump (likely no logic change) |
| `services/placeService.ts` | Align Google readiness with `importLibrary`; consistent Place access; no legacy APIs |
| `config.ts` | Only if env key wiring needs clarification — no new providers |

### Files that must NOT be rewritten “for maps”
- Auth, profile modals, voice pipeline, Edge Functions — out of scope unless a maps import breaks the build.
- `components/tools/SubwayMap.tsx` — static image subway overlay; not Google Maps JS.

---

## 5. Production Safety Rules for Coding Agents

1. Prefer **small sequential commits/PRs** matching `docs/tasks.md` order.
2. After library bump, verify: map tiles, curated markers, user marker, POI click → essentials, Explore fallback nearby.
3. Keep rollback path: pin `APIProvider` to previous numbered Maps version (`v=3.64` etc.) if a quarterly roll breaks behavior.
4. Never ship `channel="beta"` / `alpha` to production users.
5. Do not enable new billable Places fields “just in case.”
6. Do not break Persian/RTL: preserve `lang="fa"` / `dir="rtl"`, keep user-facing copy in Persian, and review any touched UI for RTL layout, icons, and directional interactions.
