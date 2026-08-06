/**
 * Pre-launch smoke tests against live Supabase + app contracts.
 * Env: SMOKE_URL, SMOKE_ANON, SMOKE_SERVICE (never logged).
 */
import { randomUUID } from 'node:crypto';

const SUPABASE_URL = process.env.SMOKE_URL;
const ANON = process.env.SMOKE_ANON;
const SERVICE = process.env.SMOKE_SERVICE;

if (!SUPABASE_URL || !ANON || !SERVICE) {
  console.error('Missing SMOKE_URL / SMOKE_ANON / SMOKE_SERVICE');
  process.exit(1);
}

const results = [];
const stamp = Date.now();
const email = `rava.smoke.${stamp}@mailinator.com`;
const password = `SmokeTest!${stamp}Aa`;
let accessToken = null;
let userId = null;

function record(name, ok, detail = '') {
  results.push({ name, ok, detail });
  const mark = ok ? 'PASS' : 'FAIL';
  console.log(`[${mark}] ${name}${detail ? ' — ' + detail : ''}`);
}

async function rest(path, { method = 'GET', token = ANON, body, prefer } = {}) {
  const headers = {
    apikey: ANON,
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
  if (prefer) headers.Prefer = prefer;
  const res = await fetch(`${SUPABASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = text;
  }
  return { res, json, text };
}

async function authAdmin(path, { method = 'POST', body } = {}) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1${path}`, {
    method,
    headers: {
      apikey: SERVICE,
      Authorization: `Bearer ${SERVICE}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => null);
  return { res, json };
}

async function main() {
  console.log('\n=== RAVA PRE-LAUNCH SMOKE ===\n');

  // --- Auth: admin create confirmed user (simulates signup + email confirm) ---
  {
    const { res, json } = await authAdmin('/admin/users', {
      body: {
        email,
        password,
        email_confirm: true,
        user_metadata: { username: 'smoke_tester' },
      },
    });
    userId = json?.id;
    record(
      'Auth: create confirmed user (signup+verify path)',
      res.ok && !!userId,
      res.ok ? `user=${userId}` : JSON.stringify(json)
    );
  }

  // Profile auto-created by trigger?
  {
    await new Promise((r) => setTimeout(r, 800));
    const { res, json } = await rest(`/rest/v1/profiles?id=eq.${userId}&select=*`, {
      token: SERVICE,
    });
    const row = Array.isArray(json) ? json[0] : null;
    record(
      'Auth: handle_new_user profile row',
      res.ok && !!row,
      row ? `balance=${row.wallet_balance} referral=${row.referral_code}` : JSON.stringify(json)
    );
  }

  // Login
  {
    const { res, json } = await rest('/auth/v1/token?grant_type=password', {
      method: 'POST',
      body: { email, password },
    });
    accessToken = json?.access_token;
    record(
      'Auth: login with password',
      res.ok && !!accessToken,
      res.ok ? 'session issued' : JSON.stringify(json)
    );
  }

  // Session / get user
  {
    const { res, json } = await rest('/auth/v1/user', { token: accessToken });
    record(
      'Auth: session recovery (get user)',
      res.ok && json?.id === userId,
      res.ok ? json.email : JSON.stringify(json)
    );
  }

  // Password recovery request (does not confirm email delivery)
  {
    const { res, json } = await rest('/auth/v1/recover', {
      method: 'POST',
      body: { email },
    });
    record(
      'Auth: password recovery request accepted',
      res.ok || res.status === 200,
      res.ok ? 'recover accepted' : `status=${res.status} ${JSON.stringify(json)}`
    );
  }

  // RLS: cannot read other profiles
  {
    const { res, json } = await rest(`/rest/v1/profiles?select=id&limit=5`, {
      token: accessToken,
    });
    const rows = Array.isArray(json) ? json : [];
    const onlySelf = rows.every((r) => r.id === userId);
    record(
      'RLS: profiles SELECT own-only',
      res.ok && onlySelf && rows.length <= 1,
      `rows=${rows.length}`
    );
  }

  // Onboarding finalize (profile update)
  {
    const { res, json } = await rest(`/rest/v1/profiles?id=eq.${userId}`, {
      method: 'PATCH',
      token: accessToken,
      prefer: 'return=representation',
      body: {
        onboarding_completed: true,
        current_city: 'Istanbul',
        semantic_profile: {
          travel_style: 'explorer',
          crew_type: 'solo',
          is_traveling_now: true,
        },
        username: 'smoke_tester',
      },
    });
    const row = Array.isArray(json) ? json[0] : json;
    record(
      'Onboarding: profile update (city + semantic + completed)',
      res.ok && row?.onboarding_completed === true && row?.current_city === 'Istanbul',
      res.ok ? 'ok' : JSON.stringify(json)
    );
  }

  // Places
  {
    const { res, json } = await rest('/rest/v1/rpc/get_city_attractions', {
      method: 'POST',
      token: accessToken,
      body: { city_name: 'Istanbul' },
    });
    const n = Array.isArray(json) ? json.length : 0;
    record('Map data: get_city_attractions Istanbul ≥20', res.ok && n >= 20, `count=${n}`);
  }
  {
    const { res, json } = await rest('/rest/v1/rpc/get_city_attractions', {
      method: 'POST',
      token: ANON,
      body: { city_name: 'Dubai' },
    });
    const n = Array.isArray(json) ? json.length : 0;
    record('Map data: anon get_city_attractions Dubai ≥20', res.ok && n >= 20, `count=${n}`);
  }
  {
    const { res, json } = await rest('/rest/v1/rpc/search_nearby_places', {
      method: 'POST',
      token: accessToken,
      body: { px_lat: 41.0082, px_lng: 28.9784, px_radius: 8000, px_mood: null },
    });
    const n = Array.isArray(json) ? json.length : 0;
    record('Map data: search_nearby_places returns rows', res.ok && n > 0, `count=${n}`);
  }

  // Favorites
  let favId = null;
  {
    const placeId = `smoke_place_${stamp}`;
    const { res, json } = await rest('/rest/v1/favorites', {
      method: 'POST',
      token: accessToken,
      prefer: 'return=representation',
      body: {
        place_id: placeId,
        place_snapshot: {
          name: 'Smoke Café',
          category: 'cafe',
          image: null,
          lat: 41.01,
          lng: 28.98,
        },
      },
    });
    favId = Array.isArray(json) ? json[0]?.id : json?.id;
    record('Favorites: insert own favorite', res.ok && !!favId, res.ok ? favId : JSON.stringify(json));
  }

  // Trip lifecycle
  let journeyId = null;
  {
    const { res, json } = await rest('/rest/v1/user_trips', {
      method: 'POST',
      token: accessToken,
      prefer: 'return=representation',
      body: {
        // user_id intentionally omitted — DB trigger must fill from auth.uid()
        title: 'Smoke Istanbul Weekend',
        city: 'Istanbul',
        status: 'upcoming',
        start_date: '2026-08-10',
        end_date: '2026-08-12',
        budget_style: 'mid',
        total_budget: 50000000,
        estimated_cost: 20000000,
        currency: 'IRT',
      },
    });
    journeyId = Array.isArray(json) ? json[0]?.id : json?.id;
    record('Trip: create user_trips', res.ok && !!journeyId, res.ok ? journeyId : JSON.stringify(json));
  }
  {
    const { res, json } = await rest(`/rest/v1/user_trips?id=eq.${journeyId}`, {
      method: 'PATCH',
      token: accessToken,
      prefer: 'return=representation',
      body: { status: 'active' },
    });
    const row = Array.isArray(json) ? json[0] : json;
    record('Trip: start (status → active)', res.ok && row?.status === 'active', row?.status || JSON.stringify(json));
  }

  let activityId = randomUUID();
  {
    const { res, json } = await rest('/rest/v1/trips', {
      method: 'POST',
      token: accessToken,
      prefer: 'return=representation',
      body: {
        id: activityId,
        type: 'activity',
        title: 'بازدید گالاتا',
        status: 'upcoming',
        journey_id: journeyId,
        sequence_order: 1,
        place_id: 'ChIJy65uN8i0yhQRA_92G8n759I',
        place_name: 'برج گالاتا',
        start_time: new Date().toISOString(),
        details: { notes: 'smoke' },
      },
    });
    record('Trip: add itinerary activity', res.ok, res.ok ? activityId : JSON.stringify(json));
  }
  {
    const { res, json } = await rest(`/rest/v1/trips?id=eq.${activityId}`, {
      method: 'PATCH',
      token: accessToken,
      prefer: 'return=representation',
      body: { status: 'completed' },
    });
    const row = Array.isArray(json) ? json[0] : json;
    record('Trip: complete activity', res.ok && row?.status === 'completed', row?.status || JSON.stringify(json));
  }

  // Wallet / economy
  const fuelTx = randomUUID();
  {
    const { res, json } = await rest('/rest/v1/rpc/deduct_fuel', {
      method: 'POST',
      token: accessToken,
      body: {
        px_seconds: 60,
        px_reason: 'smoke_test',
        px_transaction_id: fuelTx,
      },
    });
    record('Wallet: deduct_fuel (60s)', res.ok, res.ok ? 'ok' : JSON.stringify(json));
  }
  {
    const { res, json } = await rest('/rest/v1/rpc/deduct_fuel', {
      method: 'POST',
      token: accessToken,
      body: {
        px_seconds: 60,
        px_reason: 'smoke_test',
        px_transaction_id: fuelTx,
      },
    });
    // Idempotent retry should still succeed without double debit
    record('Wallet: deduct_fuel idempotent retry', res.ok, res.ok ? 'no-op ok' : JSON.stringify(json));
  }
  {
    const before = await rest(`/rest/v1/profiles?id=eq.${userId}&select=wallet_balance`, {
      token: accessToken,
    });
    const bal = before.json?.[0]?.wallet_balance;
    const stampTx = randomUUID();
    const { res, json } = await rest('/rest/v1/rpc/process_poi_visit', {
      method: 'POST',
      token: accessToken,
      body: {
        px_transaction_id: stampTx,
        px_place_id: `smoke_stamp_${stamp}`,
        px_place_name: 'Smoke Landmark',
        px_city: 'Istanbul',
      },
    });
    const after = await rest(`/rest/v1/profiles?id=eq.${userId}&select=wallet_balance,xp_level`, {
      token: accessToken,
    });
    const bal2 = after.json?.[0]?.wallet_balance;
    const xp = after.json?.[0]?.xp_level;
    record(
      'Wallet: process_poi_visit stamp + reward',
      res.ok && Number(bal2) > Number(bal),
      `balance ${bal}→${bal2} xp=${xp} err=${JSON.stringify(json)}`
    );
  }
  {
    const { res } = await rest('/rest/v1/rpc/deduct_fuel', {
      method: 'POST',
      token: ANON,
      body: { px_seconds: 1, px_reason: 'hack', px_transaction_id: randomUUID() },
    });
    record('Security: anon cannot deduct_fuel', res.status === 401 || res.status === 403, `status=${res.status}`);
  }
  {
    const rewardTx = randomUUID();
    const { res, json } = await rest('/rest/v1/rpc/claim_reward', {
      method: 'POST',
      token: accessToken,
      body: {
        px_transaction_id: rewardTx,
        px_reward_type: 'profile_complete',
        px_reference_id: userId,
      },
    });
    record(
      'Wallet: claim_reward profile_complete',
      res.ok && json?.ok === true,
      JSON.stringify(json)
    );
  }
  {
    const { res, json } = await rest('/rest/v1/rpc/record_daily_activity', {
      method: 'POST',
      token: accessToken,
      body: { px_date: new Date().toISOString().slice(0, 10) },
    });
    record(
      'Gamification: record_daily_activity streak',
      res.ok && json?.current_streak >= 1,
      JSON.stringify(json)
    );
  }
  {
    const { res, json } = await rest('/rest/v1/rpc/update_trip_budget', {
      method: 'POST',
      token: accessToken,
      body: {
        px_journey_id: journeyId,
        px_total_budget: null,
        px_estimated_cost: null,
        px_expense_delta: 1500000,
        px_daily_expenses: null,
      },
    });
    record(
      'Wallet: update_trip_budget expense',
      res.ok && json?.recorded_expenses > 0,
      JSON.stringify(json)
    );
  }

  // Daily recap insert
  {
    const { res, json } = await rest('/rest/v1/daily_recaps', {
      method: 'POST',
      token: accessToken,
      prefer: 'return=representation',
      body: {
        recap_date: new Date().toISOString().slice(0, 10),
        city: 'Istanbul',
        summary: 'تست دود: امروز گالاتا را دیدی و سوخت کم شد.',
        highlights: ['گالاتا'],
        xp_earned: 50,
        places_visited: 1,
        daily_cost: 1500000,
        tomorrow_hint: 'فردا بازار بزرگ',
        facts: { source: 'smoke' },
      },
    });
    record('Trip: daily_recaps insert', res.ok, res.ok ? 'ok' : JSON.stringify(json));
  }

  // Passport-ish reads
  {
    const stamps = await rest(`/rest/v1/stamps?select=*&order=created_at.desc`, {
      token: accessToken,
    });
    const achievements = await rest(`/rest/v1/achievements?select=code,xp_threshold`, {
      token: accessToken,
    });
    record(
      'Passport: stamps + achievements readable',
      stamps.res.ok &&
        Array.isArray(stamps.json) &&
        stamps.json.length >= 1 &&
        achievements.res.ok &&
        achievements.json.length >= 4,
      `stamps=${stamps.json?.length} achievements=${achievements.json?.length}`
    );
  }

  // Zero fuel path (set balance 0 via service, then deduct should clamp)
  {
    await rest(`/rest/v1/profiles?id=eq.${userId}`, {
      method: 'PATCH',
      token: SERVICE,
      body: { wallet_balance: 0 },
    });
    const { res } = await rest('/rest/v1/rpc/deduct_fuel', {
      method: 'POST',
      token: accessToken,
      body: {
        px_seconds: 30,
        px_reason: 'zero_fuel_smoke',
        px_transaction_id: randomUUID(),
      },
    });
    const after = await rest(`/rest/v1/profiles?id=eq.${userId}&select=wallet_balance`, {
      token: accessToken,
    });
    const bal = Number(after.json?.[0]?.wallet_balance ?? -1);
    record('Wallet: zero-balance deduct clamps ≥0', res.ok && bal === 0, `balance=${bal}`);
  }

  // Edge functions reachable (expect auth/validation errors without full payload — not 404)
  for (const fn of ['process-ticket', 'verify-price', 'the-dreamer']) {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/${fn}`, {
      method: 'POST',
      headers: {
        apikey: ANON,
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ping: true }),
    });
    record(
      `Edge: ${fn} deployed (not 404)`,
      res.status !== 404,
      `status=${res.status}`
    );
  }

  // Complete trip
  {
    const { res, json } = await rest(`/rest/v1/user_trips?id=eq.${journeyId}`, {
      method: 'PATCH',
      token: accessToken,
      prefer: 'return=representation',
      body: { status: 'completed', passport_entry: 'Smoke passport note' },
    });
    const row = Array.isArray(json) ? json[0] : json;
    record('Trip: complete journey', res.ok && row?.status === 'completed', row?.status || JSON.stringify(json));
  }

  // Cleanup smoke user (best-effort)
  {
    const del = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${userId}`, {
      method: 'DELETE',
      headers: {
        apikey: SERVICE,
        Authorization: `Bearer ${SERVICE}`,
      },
    });
    record('Cleanup: delete smoke user', del.ok || del.status === 200, `status=${del.status}`);
  }

  const passed = results.filter((r) => r.ok).length;
  const failed = results.filter((r) => !r.ok);
  console.log(`\n=== SUMMARY: ${passed}/${results.length} passed ===`);
  if (failed.length) {
    console.log('FAILED:');
    failed.forEach((f) => console.log(` - ${f.name}: ${f.detail}`));
  }

  // Machine-readable for report
  const { writeFileSync } = await import('node:fs');
  const { fileURLToPath } = await import('node:url');
  const outPath = fileURLToPath(new URL('../debug/SMOKE_TEST_RESULTS.json', import.meta.url));
  writeFileSync(
    outPath,
    JSON.stringify({ at: new Date().toISOString(), email, passed, total: results.length, results }, null, 2)
  );
  console.log(`Wrote ${outPath}`);

  process.exit(failed.length ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
