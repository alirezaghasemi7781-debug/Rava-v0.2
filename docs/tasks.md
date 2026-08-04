# tasks.md — Maps Upgrade Roadmap

**Phase goal:** Prepare and execute a production-safe maps stack upgrade.  
**Not in scope:** Unrelated bug fixes, feature completion, Map3D, routing features.  
**Architectural correction:** This is **not** Maps JS API v2→v3. The app is already on v3 + Places (New) + Advanced Markers. Upgrade `@vis.gl/react-google-maps` `1.1.0` → `1.9.0`, pin Maps release channel, modernize markers, harden Places loading.

**Execution rule:** Tasks are strictly sequential. Do not parallelize tasks that touch the same files.

### Global mandatory requirement (all tasks)
- The application must always use **Persian** as its primary interface language.
- The entire user interface must be **fully RTL**.
- All layouts, components, forms, navigation, typography, spacing, icons, and directional interactions touched by a task must be reviewed for correct RTL behavior.
- **LTR UI is not allowed**, except for inherently LTR technical content: code, URLs, email addresses, phone numbers, and numeric identifiers.
- Any task that modifies UI must not introduce LTR regressions or English-default user-facing copy.

---

## Task 1 — Confirm baseline & freeze upgrade inventory

### Technical Implementation Guide
1. Re-read `docs/PROJECT.md` and `docs/ARCHITECTURE.md` end-to-end before changing code.
2. Confirm in repo (no assumptions):
   - `@vis.gl/react-google-maps` is `1.1.0` in both `package.json` and `index.html` importmap.
   - Map stack uses `APIProvider`, `AdvancedMarker`, `mapId`, libraries `places` + `marker`.
   - `placeService.ts` uses `google.maps.places.Place` / `importLibrary("places")` — not `PlacesService`.
   - No `DirectionsService`, Drawing, Heatmap, or legacy `Marker` usage.
3. Write a short checklist comment in the PR/description only (do not create new doc files): list files that will change in later tasks.
4. Do not change runtime code in this task.

### Task-Specific Constraints
- MUST: Treat v2→v3 rewrite as out of scope.
- MUST NOT: Bump dependencies yet.
- MUST NOT: Refactor unrelated modules.
- MUST: Confirm `index.html` retains `lang="fa"` and `dir="rtl"` in inventory.
- Forbidden shortcut: Skipping full reads of map/Places files listed in CONTEXT_FILES.

### Acceptance Criteria
- Functional: N/A (documentation/verification only).
- Technical: Inventory matches ARCHITECTURE “files that need modification.”
- Architectural: Explicit statement recorded that project is already Maps JS v3.
- Localization/RTL: Inventory notes Persian/RTL root (`index.html`) and flags any UI files in later tasks for RTL review.
- Edge cases: Note unused `@googlemaps/markerclusterer` for Task 6.
- Quality: No code churn; no new markdown files outside the three brain files.

CONTEXT_FILES:
[
  "docs/PROJECT.md",
  "docs/ARCHITECTURE.md",
  "package.json",
  "index.html",
  "components/map/MainMap.tsx",
  "components/map/MapControls.tsx",
  "services/placeService.ts",
  "config.ts"
]

---

## Task 2 — Bump React Google Maps dependency (npm + importmap lockstep)

### Technical Implementation Guide
1. In `package.json`, set `"@vis.gl/react-google-maps": "1.9.0"` (exact pin preferred for production predictability).
2. In `index.html` importmap, change  
   `@vis.gl/react-google-maps` → `https://esm.sh/@vis.gl/react-google-maps@1.9.0`  
   so CDN/importmap path cannot drift from npm.
3. Run install to refresh `package-lock.json`.
4. Run `npm run build` and fix **only** TypeScript/compile errors caused by the bump (prop type renames, etc.). Do not redesign UI.
5. Leave `APIProvider` channel and marker CSS alone until Task 3–4.

### Task-Specific Constraints
- MUST: Update **both** `package.json` and `index.html` in the same task.
- MUST NOT: Jump to unrelated dependency major upgrades (React, Vite, Framer, GenAI).
- MUST NOT: Add a second maps library.
- MUST NOT: Remove or alter `lang="fa"` / `dir="rtl"` on `index.html`.
- Forbidden shortcut: Updating only npm and forgetting importmap (this repo uses both).

### Acceptance Criteria
- Functional: Dev server/build can compile with the new package.
- Technical: Both pins show `1.9.0`; lockfile updated.
- Architectural: Still only `@vis.gl/react-google-maps` for maps React bindings.
- Localization/RTL: Document root remains `lang="fa"` `dir="rtl"`; no LTR layout regressions from importmap edits.
- Edge cases: Peer deps still satisfied for React 19.
- Quality: No silent major version changes to other packages.

CONTEXT_FILES:
[
  "package.json",
  "package-lock.json",
  "index.html",
  "components/map/MainMap.tsx",
  "docs/PROJECT.md"
]

---

## Task 3 — Pin Maps JS release channel & API load error handling

### Technical Implementation Guide
1. In `MainMap.tsx`, on `APIProvider`:
   - Set production-safe versioning: `version="quarterly"` (preferred) **or** document why a numbered pin is used temporarily.
   - Add `onError` handler that logs a clear client error (no PII) so map load failures are visible.
2. Keep `libraries={['places', 'marker']}` unchanged.
3. Do not change mapId, defaultCenter, or marker children in this task.
4. Ensure a rollback note is possible: if quarterly misbehaves after Google’s mid-quarter roll, temporarily set a numbered version supported by Google’s versioning page (e.g. `3.64` / `3.65` as applicable at execution time).

### Task-Specific Constraints
- MUST: Prefer `quarterly` over default weekly for premium production stability.
- MUST NOT: Use `beta` or `alpha` channels.
- MUST NOT: Add raw script tags for Maps.
- MUST NOT: Introduce English-only map error messages; user-visible errors remain Persian where shown in UI.
- Forbidden shortcut: Removing `libraries` array or dropping `marker` / `places`.

### Acceptance Criteria
- Functional: Map still loads with tiles and Advanced Markers.
- Technical: `APIProvider` has explicit version/channel + `onError`.
- Architectural: Single loader remains `APIProvider` inside `MainMap`.
- Localization/RTL: Map-adjacent UI (`MapControls`, POI flow) unchanged in Persian/RTL; no new LTR-only overlays.
- Edge cases: When API key invalid/network blocked, error path logs without crashing the whole React tree.
- Quality: No behavior change to POI click or curated fetch.

CONTEXT_FILES:
[
  "components/map/MainMap.tsx",
  "config.ts",
  "docs/ARCHITECTURE.md",
  "docs/PROJECT.md"
]

---

## Task 4 — Modernize AdvancedMarker anchoring (remove fragile CSS hacks)

### Technical Implementation Guide
1. In `MainMap.tsx` curated / custom markers that use CSS `transform: translate(-50%, -50%)` for geo alignment:
   - Replace with `@vis.gl/react-google-maps` AdvancedMarker anchor props (`anchorLeft` / `anchorTop`) appropriate to the custom HTML pin design.
2. Verify footprint markers and user-location marker alignment still look correct at zoom 13–15.
3. Keep `zIndex` semantics (curated high, footprints lower).
4. Do not change click handlers or store wiring.
5. Review marker tooltips/labels (e.g. curated name hover chip) for RTL: Persian text alignment, positioning (`left-1/2 -translate-x-1/2` vs logical centering), and readable direction.

### Task-Specific Constraints
- MUST: Keep `AdvancedMarker` only (no legacy `Marker`).
- MUST NOT: Remove `mapId`.
- MUST NOT: Introduce MarkerClusterer in this task.
- MUST: Preserve Persian labels on map markers; do not replace with English defaults.
- MUST: Verify tooltip/overlay positioning remains correct under RTL after anchor changes.
- Forbidden shortcut: Leaving both conflicting CSS translate and native anchors active in a way that double-offsets markers.

### Acceptance Criteria
- Functional: Curated pins, footprints, and user pulse appear on correct coordinates.
- Technical: Anchor uses library-supported props available in 1.9.0 / Maps ≥3.62.
- Architectural: Marker components remain inside `components/map/MainMap.tsx` unless a tiny extract is required for clarity (prefer in-file).
- Localization/RTL: Marker hover labels and any map overlay text remain Persian and visually correct in RTL (typography, spacing, tooltip placement).
- Edge cases: Invalid lat/lng still skipped (existing NaN guards remain).
- Quality: No visual double-offset; hover labels still usable.

CONTEXT_FILES:
[
  "components/map/MainMap.tsx",
  "utils/geoPoint.ts",
  "docs/ARCHITECTURE.md"
]

---

## Task 5 — Harden Places (New) readiness path in PlaceService

### Technical Implementation Guide
1. Read all of `services/placeService.ts`.
2. Align Google readiness with modern loading:
   - Prefer ensuring Places via `google.maps.importLibrary("places")` (already used in nearby fallback) rather than only polling `google.maps.places`.
   - Make `waitForGoogle` / init path consistent for `fetchEssentials`, `fetchFullDetails`, `fetchPlacePhotos`, and `fetchNearbyFallback`.
3. Keep using `Place` + `fetchFields` + field minimization.
4. Do not change Supabase hybrid curated logic except where required for compile.
5. Do not add Directions/Routes.

### Task-Specific Constraints
- MUST: Remain on Places (New) `Place` API.
- MUST NOT: Reintroduce `PlacesService`.
- MUST NOT: Expand `fetchFields` lists without product need (billing risk).
- MUST: Keep `requestedLanguage: 'fa'` on Place requests; user-facing place names/descriptions remain Persian-preferring.
- Forbidden shortcut: Swallowing all errors into `{}` without at least console error on unexpected failures where currently silent — improve cautiously without changing UX contracts.

### Acceptance Criteria
- Functional: Map POI click still fills essentials; POI expand still merges hybrid + full details; Explore nearby fallback still returns POIs when RPC empty.
- Technical: All Places entry points share one reliable readiness strategy.
- Architectural: Places logic stays in `services/placeService.ts`.
- Localization/RTL: Persian `requestedLanguage: 'fa'` preserved; POI sheets (`POIController`) still render Persian copy and RTL layout after changes.
- Edge cases: Offline / Google not ready returns safe empty/fallback objects without throwing into React.
- Quality: No new billable fields.

CONTEXT_FILES:
[
  "services/placeService.ts",
  "store/useDiscoveryStore.ts",
  "components/map/MainMap.tsx",
  "components/poi/POIController.tsx",
  "docs/ARCHITECTURE.md"
]

---

## Task 6 — Resolve unused MarkerClusterer dependency

### Technical Implementation Guide
1. Confirm again there is zero import of `@googlemaps/markerclusterer` in TS/TSX.
2. **Selected solution:** Remove the unused dependency from `package.json` and its importmap entry in `index.html`, then refresh lockfile.
3. Alternative (rejected for this phase): Wire clustering now — rejected because it changes map UX and is not required for upgrade readiness.
4. If product later needs clustering for dense curated cities, add it in a dedicated feature task after this phase.

### Task-Specific Constraints
- MUST: Either remove cleanly or document intentional keep — default is **remove**.
- MUST NOT: Partially leave importmap pointing at a removed package.
- MUST NOT: Alter `lang="fa"` / `dir="rtl"` or Persian font loading while editing `index.html`.
- Forbidden shortcut: Leaving unused dependency “for later” without a dated follow-up task (this phase cleans the stack).

### Acceptance Criteria
- Functional: Map behavior unchanged.
- Technical: No remaining package/importmap references to markerclusterer.
- Architectural: No new clustering abstraction introduced.
- Localization/RTL: `index.html` RTL root and Vazirmatn font unchanged.
- Edge cases: Build still succeeds.
- Quality: Dependency tree smaller and honest.

CONTEXT_FILES:
[
  "package.json",
  "package-lock.json",
  "index.html",
  "docs/PROJECT.md"
]

---

## Task 7 — Production smoke matrix & upgrade gate

### Technical Implementation Guide
1. Manually verify (or scripted if already available — do not invent heavy E2E frameworks):
   - Map tiles load (Istanbul default).
   - City switch pans correctly if UI exposes it.
   - Curated “Gems” toggle shows/hides markers.
   - Locate recenters to user when permission granted.
   - Click Google POI icon → active POI sheet → expand details.
   - Explore mood feed: RPC path and empty→Google fallback path.
   - **Persian/RTL gate:** entire smoke pass in RTL — verify `dir="rtl"` on document, Persian labels on map controls/POI/Explore, correct text alignment, and no LTR-only layout regressions on touched surfaces.
2. Confirm in browser console: `google.maps.version` is on an expected quarterly/numbered line.
3. Confirm no console errors from `@vis.gl/react-google-maps` on load.
4. Mark phase complete only if all checks pass; otherwise fix within Tasks 3–5 scope only.

### Task-Specific Constraints
- MUST: Treat failures in map/Places as blockers for “phase complete.”
- MUST: Treat Persian/RTL regressions as blockers for “phase complete.”
- MUST NOT: Start feature work or broad bug hunts outside maps upgrade.
- Forbidden shortcut: Declaring success after build-only without runtime map checks.

### Acceptance Criteria
- Functional: All smoke checks pass on a real browser with a valid Maps key.
- Technical: Library `1.9.0`, channel pinned, Places New intact, Advanced Markers intact.
- Architectural: Matches PROJECT anti-patterns (no legacy Marker/PlacesService/v2).
- Localization/RTL: UI remains fully RTL; Persian is primary for all user-facing copy on verified screens; LTR appears only for allowed technical content (URLs, IDs, etc.).
- Edge cases: Denied geolocation does not break map; POI click without placeId ignored safely.
- Quality: Project is ready for subsequent bugfix / feature phases without maps platform debt from 1.1.0.

CONTEXT_FILES:
[
  "components/map/MainMap.tsx",
  "components/map/MapControls.tsx",
  "services/placeService.ts",
  "pages/Dashboard.tsx",
  "pages/Explore.tsx",
  "package.json",
  "index.html",
  "docs/ARCHITECTURE.md",
  "docs/PROJECT.md"
]
