# PROJECT.md — Project North Star

**Product:** رهنما (Rava / Rahnam) — Smart Tour Guide  
**Phase focus (current):** Maps platform upgrade readiness (production-safe)  
**Last architecture review:** 2026-08-04

---

## Business Goal

Deliver a premium, AI-assisted mobile web tour guide for travelers that turns city exploration into a reliable map-first experience: curated places, social footprints, voice narration, and discovery — without breaking maps for existing paying users during platform upgrades.

---

## Target Persona

Persian-speaking travelers (and expats) visiting major cities (Istanbul, Dubai, Tehran) who want a luxury, low-friction guide: discover nearby places, open rich POI details, leave footprints, and use survival tools — on a phone browser, often on imperfect networks.

---

## Localization & RTL (Mandatory — All Phases)

The application is **Persian-first** and **RTL-only** for user-facing UI. This is a non-negotiable product requirement, not a cosmetic preference.

### Primary language
- **Persian (Farsi)** is the primary and default interface language for all user-visible copy: labels, buttons, navigation, errors, empty states, tooltips, modals, and AI-generated user-facing text.
- English may appear only where it is product-intentional (e.g. brand names, city names in data) or where content is inherently technical/LTR (see exceptions below).

### RTL layout
- The entire user interface must be **fully RTL** (`dir="rtl"`, `lang="fa"` at document root — already set in `index.html`).
- All layouts, components, forms, navigation, typography, spacing, icons, and directional interactions must be reviewed for correct RTL behavior.
- Default text alignment, flex/grid flow, padding/margin direction, drawer/sheet motion, back/forward affordances, and icon mirroring must follow RTL conventions unless an exception applies.

### Allowed LTR exceptions (only)
LTR UI is **not allowed** except for inherently LTR technical content:
- Source code snippets
- URLs
- Email addresses
- Phone numbers
- Numeric identifiers (IDs, codes, coordinates when displayed as raw values)

These exceptions must remain visually isolated (e.g. `dir="ltr"` on a span) and must not flip surrounding layout to LTR.

### Coding-agent rule
Any change — including maps upgrades — that touches UI must **preserve or improve** Persian/RTL correctness. Introducing LTR-default layouts, left-aligned Persian body text, or unmirrored directional controls is a defect.

---

## Tech Stack

### Frameworks & languages
- **React** `^19.2.3` + **React DOM** `^19.2.3`
- **TypeScript** `~5.8.2`
- **Vite** `^6.2.0` (bundler / dev server)

### UI & client libraries
- **Zustand** `^5.0.11` (all client state)
- **Framer Motion** `^12.29.0`
- **Lucide React** `^0.563.0`
- **Tailwind CSS** via CDN (`cdn.tailwindcss.com` in `index.html`) + local `index.css`
- **Vazirmatn** (Google Fonts)

### Maps stack (CRITICAL — corrected 2026-08-04)
| Layer | Current in repo | Target for upgrade phase |
| --- | --- | --- |
| Google Maps JavaScript API | **v3** (already; loaded via React wrapper) | Stay on **v3**; pin release channel |
| React wrapper | `@vis.gl/react-google-maps` **`1.1.0`** (pinned) | Upgrade to **`1.9.0`** (latest as of 2026-07-03) |
| Markers | `AdvancedMarker` + `mapId` | Keep Advanced Markers; adopt modern anchor props |
| Places | Places library + **`google.maps.places.Place`** (New) | Keep Places (New); harden load/error patterns |
| Clustering package | `@googlemaps/markerclusterer` `^2.6.2` (declared, **unused**) | Remove or intentionally wire — do not leave dead |

**Official Google status (as of 2026-08-04 research):**
- Maps JS API **v2 is decommissioned** (since 2021-05-26). This project does **not** use v2.
- Weekly channel ≈ **3.65**; quarterly ≈ **3.64**; mid-August 2026 rolls weekly → **3.66**.
- Legacy `google.maps.Marker` deprecated (prefer Advanced Markers) — project already compliant.
- Legacy `PlacesService` deprecated for new customers (prefer `Place`) — project already on `Place`.
- Drawing Library & Heatmap Layer unavailable as of May 2026 — project does not use them.
- `DirectionsService` / `DistanceMatrixService` deprecated 2026-02-25 (replacement: Routes library `Route` / `RouteMatrix`) — project does not use them today.

### Backend & data
- **Supabase** (Auth, Postgres + PostGIS, RPC, Realtime, Edge Functions)
- Local IndexedDB-style cache via `dbService` for place payloads

### AI / voice
- **`@google/genai`** `^1.38.0` (Gemini)
- Custom `AudioGraph` + Gemini Live hooks

### Infrastructure / tooling
- Vite build (`npm run build`)
- Supabase Edge Functions under `supabase/functions/`
- PWA pieces: `manifest.json`, `sw.js`

### External services
- Google Maps Platform (Maps JS API, Places Library / Places API New, Map ID cloud styling)
- Google Gemini / GenAI
- Supabase cloud project
- Unsplash (image URLs where curated assets use it)

---

## Architectural Correction (Technology Conflict Rule)

**User belief:** “We are on Google Maps API v2 and must move to v3.x.”

**Codebase reality:** The app already runs on **Maps JavaScript API v3** through `@vis.gl/react-google-maps`, using:
- `APIProvider` + `Map` with **`mapId`**
- **`AdvancedMarker`**
- Places (New): `Place`, `fetchFields`, `Place.searchNearby`, `importLibrary("places")`

**Preserved architecture decision:** Do **not** perform a v2→v3 rewrite. Adapt the upgrade to the existing stack:

1. Bump **React Maps library** `1.1.0` → `1.9.0`
2. Pin Maps JS **release channel** for production predictability (`quarterly`)
3. Modernize marker anchoring to library/API-native props
4. Harden Places (New) loading and failure modes
5. Explicitly ban reintroduction of decommissioned/deprecated Google Maps surfaces

---

## Critical: Anti-Patterns & Hard Restrictions

### Maps — absolute bans
- **Do not** load or reference Maps JavaScript API **v2** (`maps.google.com/maps`, `GMap2`, global `G*` APIs).
- **Do not** use legacy `google.maps.Marker`. Use only `AdvancedMarker` / `google.maps.marker.AdvancedMarkerElement`.
- **Do not** use legacy `google.maps.places.PlacesService`. Use only `google.maps.places.Place` (and related New Places APIs).
- **Do not** introduce Drawing Library, Heatmap Layer, or KmlLayer.
- **Do not** introduce `DirectionsService` / `DistanceMatrixService`. If routing is ever needed, use Maps JS **Routes** library (`Route` / `RouteMatrix`) behind a dedicated service module — not inline in UI.
- **Do not** remove or change the cloud **`mapId`** without verifying Advanced Markers still render.
- **Do not** load Maps via raw `<script src="maps.googleapis.com/...">` outside `APIProvider` (single loader ownership).
- **Do not** use `beta` / `alpha` Maps channels in production builds.
- **Do not** call `map.setTilt(45)` expecting 45° imagery (removed as of Maps JS 3.65 / May 2026).

### State & UI
- **Do not** introduce Redux, MobX, Jotai, Recoil, or Context-as-global-store. **Zustand only.**
- **Do not** add another maps React wrapper (`@react-google-maps/api`, `google-map-react`, etc.). Keep **`@vis.gl/react-google-maps` only.**
- Prefer Tailwind utility classes already used in the project; avoid inventing a second CSS architecture. Do not expand inline style usage beyond necessary map marker geometry.

### Localization & RTL — absolute bans
- **Do not** ship LTR-first layouts, `dir="ltr"` on root/body, or English-default UI copy for user-facing strings.
- **Do not** use physical directional Tailwind/CSS (`left-*`, `right-*`, `ml-*`, `mr-*`, `pl-*`, `pr-*`, `text-left`) for layout that should mirror in RTL — prefer logical properties (`start`/`end`, `ms`/`me`, `ps`/`pe`, `text-right` for Persian body) or verify RTL correctness explicitly.
- **Do not** add unmirrored chevrons, back arrows, or slide animations that assume LTR without RTL review.
- **Do not** remove or weaken `lang="fa"` / `dir="rtl"` on `index.html`.
- **Do not** replace Persian user-facing strings with English during refactors unless the string is an allowed LTR exception (URL, email, phone, ID, code).

### Data & coordinates
- **Do not** invent a second coordinate type. All lat/lng conversions go through `utils/geoPoint.ts` (`GeoPoint`).
- **Do not** store PostGIS points as `(lat, lng)`. PostGIS is `(lng, lat)`.

### Security / production
- **Do not** commit new hardcoded API keys. Prefer `VITE_*` env via `config.ts` `getEnv`.
- **Do not** expand client-side Google billing surface area without field minimization (Places `fetchFields` must request only needed fields).
- **Do not** big-bang unrelated refactors during the maps upgrade phase.

### Scope of this phase
- **Do not** mix feature completion or unrelated bug fixes into maps upgrade tasks unless a fix is required to keep maps working.
- **Do not** introduce Map3D / geometry components from `@vis.gl/react-google-maps` 1.8+ unless a product requirement explicitly asks — upgrade first, expand later.
