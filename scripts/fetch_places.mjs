/**
 * scripts/fetch_places.mjs
 *
 * Upsert curated attractions from Google Places API (New) into Supabase.
 * API key must be SERVER-ONLY — never ship this key in the Vite client bundle.
 *
 * Usage:
 *   GOOGLE_PLACES_API_KEY=... SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
 *     node scripts/fetch_places.mjs --city Istanbul
 *
 * Without a key the script prints the planned upserts and exits 0 (dry-run stub).
 *
 * Synthetic place_id format used in seed SQL:
 *   rava_syn_{city_slug}_{place_slug}
 * Real Google Place IDs (ChIJ…) should replace synthetics when resolved.
 */

import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const CITY_QUERIES = {
  Istanbul: [
    { name: 'Galata Tower', category: 'attractions' },
    { name: 'Hagia Sophia', category: 'attractions' },
    { name: 'Topkapi Palace', category: 'attractions' },
    { name: 'Grand Bazaar Istanbul', category: 'shopping' },
    { name: 'Basilica Cistern', category: 'attractions' },
    { name: 'Spice Bazaar Istanbul', category: 'shopping' },
    { name: 'Ciya Sofrasi Kadikoy', category: 'food' },
    { name: 'Mandabatmaz', category: 'cafes' },
  ],
  Dubai: [
    { name: 'Burj Khalifa', category: 'attractions' },
    { name: 'The Dubai Mall', category: 'shopping' },
    { name: 'Museum of the Future Dubai', category: 'attractions' },
    { name: 'Al Fahidi Historical Neighbourhood', category: 'hidden_gems' },
    { name: 'Gold Souk Dubai', category: 'shopping' },
    { name: 'Ravi Restaurant Satwa', category: 'food' },
    { name: '% Arabica Souk Al Bahar', category: 'cafes' },
  ],
};

function loadEnvFromDotenv() {
  const envPath = resolve(process.cwd(), '.env.local');
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m && !process.env[m[1].trim()]) {
      process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '');
    }
  }
}

function parseArgs(argv) {
  const cityIdx = argv.indexOf('--city');
  const city = cityIdx >= 0 ? argv[cityIdx + 1] : 'Istanbul';
  const dry = argv.includes('--dry-run') || !process.env.GOOGLE_PLACES_API_KEY;
  return { city, dry };
}

async function textSearch(query, apiKey) {
  const url = 'https://places.googleapis.com/v1/places:searchText';
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask':
        'places.id,places.displayName,places.location,places.rating,places.priceLevel,places.photos,places.formattedAddress,places.regularOpeningHours,places.types',
    },
    body: JSON.stringify({ textQuery: query, languageCode: 'en', maxResultCount: 1 }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Places search failed (${res.status}): ${body}`);
  }
  const data = await res.json();
  return data.places?.[0] || null;
}

function toAttractionRow(place, city, category, destinationId) {
  const lat = place.location?.latitude;
  const lng = place.location?.longitude;
  const nameFa = place.displayName?.text || 'Unknown';
  return {
    place_id: place.id,
    destination_id: destinationId,
    name: nameFa,
    // PostGIS point as WKT for manual SQL; supabase-js uses geography via RPC preferably
    location_wkt: `SRID=4326;POINT(${lng} ${lat})`,
    lat,
    lng,
    static_data: {
      category,
      name_local: place.displayName?.text,
      description_fa: '',
      address: place.formattedAddress || '',
      rating: place.rating ?? null,
      price_range: place.priceLevel ? Number(String(place.priceLevel).replace(/\D/g, '')) || 2 : 2,
      opening_hours: place.regularOpeningHours?.weekdayDescriptions || [],
      tags: (place.types || []).slice(0, 5),
      city,
      country: city === 'Dubai' ? 'AE' : 'TR',
    },
    assets: { photos: [] },
    is_premium: category === 'attractions',
  };
}

async function upsertViaSupabase(rows) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.warn('[fetch_places] Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY — printing rows only.');
    console.log(JSON.stringify(rows, null, 2));
    return;
  }

  // Prefer a SQL RPC that accepts WKT; without it, log SQL for operator.
  console.log('[fetch_places] Service role present. Emitting upsert SQL:');
  for (const r of rows) {
    console.log(
      `INSERT INTO attractions (place_id, destination_id, name, location, static_data, assets, is_premium)
 VALUES ('${r.place_id}', '${r.destination_id}', $${JSON.stringify(r.name)}$$,
 ST_GeogFromText('${r.location_wkt}'), '${JSON.stringify(r.static_data)}'::jsonb,
 '${JSON.stringify(r.assets)}'::jsonb, ${r.is_premium})
 ON CONFLICT (place_id) DO UPDATE SET static_data = EXCLUDED.static_data, assets = EXCLUDED.assets, updated_at = NOW();`,
    );
  }
}

async function main() {
  loadEnvFromDotenv();
  const { city, dry } = parseArgs(process.argv);
  const queries = CITY_QUERIES[city];
  if (!queries) {
    console.error(`Unknown city "${city}". Supported: ${Object.keys(CITY_QUERIES).join(', ')}`);
    process.exit(1);
  }

  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  console.log(`[fetch_places] city=${city} dry=${dry} queries=${queries.length}`);

  if (dry || !apiKey) {
    console.log(`
DRY RUN — set GOOGLE_PLACES_API_KEY (server-only) to call Places API.
Planned queries for ${city}:
${queries.map((q) => `  - [${q.category}] ${q.name}`).join('\n')}

After fetch:
  1. Resolve destination_id from destinations.name = '${city}'
  2. Upsert attractions with real place_id (replace rava_syn_* when matched)
  3. Keep Persian name / description_fa from seed; refresh lat/lng/rating/hours from Google
`);
    process.exit(0);
  }

  const rows = [];
  for (const q of queries) {
    try {
      const place = await textSearch(`${q.name} ${city}`, apiKey);
      if (!place) {
        console.warn(`No result for: ${q.name}`);
        continue;
      }
      rows.push(toAttractionRow(place, city, q.category, `/* resolve destinations.id for ${city} */`));
      console.log(`✓ ${q.name} → ${place.id}`);
    } catch (err) {
      console.error(`✗ ${q.name}:`, err.message);
    }
  }

  await upsertViaSupabase(rows);
  console.log(`[fetch_places] Done. ${rows.length} places resolved.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
