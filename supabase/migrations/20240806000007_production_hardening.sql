-- =====================================================================================
-- RAVA Production Hardening — grants, RPC hygiene, storage, search_path, policy cleanup
-- Safe to re-run. Complements 00001–00006.
-- =====================================================================================

-- -------------------------------------------------------------------------------------
-- 1. Clean duplicate / overlapping RLS policies
-- -------------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can only access their own chat logs" ON public.chat_logs;
DROP POLICY IF EXISTS "Users can only see their own rewards" ON public.reward_ledger;
DROP POLICY IF EXISTS "Users can only view their own rewards" ON public.reward_ledger;
DROP POLICY IF EXISTS "Users view own rewards" ON public.reward_ledger;
DROP POLICY IF EXISTS "Enable read access for everyone" ON public.places_cache;

-- Ensure public places_cache read exists under canonical name
DROP POLICY IF EXISTS "Public Read Places Cache" ON public.places_cache;
CREATE POLICY "Public Read Places Cache"
  ON public.places_cache FOR SELECT USING (true);

-- Trips: ensure UPDATE/DELETE for owners (older DBs may only have SELECT/INSERT)
DROP POLICY IF EXISTS "Users can update own trips" ON public.trips;
CREATE POLICY "Users can update own trips"
  ON public.trips FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own trips" ON public.trips;
CREATE POLICY "Users can delete own trips"
  ON public.trips FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- -------------------------------------------------------------------------------------
-- 2. search_nearby_places — curated attractions first, then places_cache
-- -------------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.search_nearby_places(
  px_lat float8,
  px_lng float8,
  px_radius float8 DEFAULT 5000,
  px_mood text DEFAULT NULL
)
RETURNS TABLE (
  id text,
  name text,
  lat float8,
  lng float8,
  category text,
  vibe_summary text,
  price_level int,
  image_url text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_origin geography := ST_SetSRID(ST_MakePoint(px_lng, px_lat), 4326)::geography;
BEGIN
  RETURN QUERY
  SELECT
    q.id,
    q.name,
    q.lat,
    q.lng,
    q.category,
    q.vibe_summary,
    q.price_level,
    q.image_url
  FROM (
    SELECT
      a.place_id AS id,
      a.name,
      ST_Y(a.location::geometry)::float8 AS lat,
      ST_X(a.location::geometry)::float8 AS lng,
      COALESCE(a.static_data->>'category', 'attraction') AS category,
      a.static_data->>'description_fa' AS vibe_summary,
      NULLIF(a.static_data->>'price_range', '')::int AS price_level,
      COALESCE(a.assets->'photos'->>0, NULL) AS image_url,
      1 AS src_rank,
      ST_Distance(a.location, v_origin) AS dist
    FROM attractions a
    WHERE ST_DWithin(a.location, v_origin, px_radius)
      AND (
        px_mood IS NULL
        OR a.static_data->>'category' ILIKE '%' || px_mood || '%'
        OR COALESCE(a.static_data->'tags', '[]'::jsonb) ? px_mood
      )

    UNION ALL

    SELECT
      pc.place_id AS id,
      pc.name,
      ST_Y(pc.location::geometry)::float8 AS lat,
      ST_X(pc.location::geometry)::float8 AS lng,
      pc.category,
      pc.vibe_summary,
      (pc.opening_hours->>'price_level')::int AS price_level,
      CASE
        WHEN pc.crowd_photos IS NOT NULL AND array_length(pc.crowd_photos, 1) > 0
          THEN (pc.crowd_photos[1]->>'url')::text
        ELSE NULL
      END AS image_url,
      2 AS src_rank,
      ST_Distance(pc.location, v_origin) AS dist
    FROM places_cache pc
    WHERE ST_DWithin(pc.location, v_origin, px_radius)
      AND (
        px_mood IS NULL
        OR pc.category = px_mood
        OR pc.google_types @> ARRAY[px_mood]
      )
      AND NOT EXISTS (SELECT 1 FROM attractions a2 WHERE a2.place_id = pc.place_id)
  ) q
  ORDER BY q.src_rank, q.dist
  LIMIT 20;
END;
$$;

-- Harden get_city_attractions search_path (qualify destinations.name — OUT param collision)
DROP FUNCTION IF EXISTS public.get_city_attractions(TEXT);
CREATE OR REPLACE FUNCTION public.get_city_attractions(city_name TEXT)
RETURNS TABLE (
    place_id TEXT,
    name TEXT,
    lat FLOAT,
    lng FLOAT,
    category TEXT,
    description TEXT,
    address TEXT,
    image TEXT,
    is_premium BOOLEAN,
    rating FLOAT,
    price_range INT,
    tags TEXT[],
    name_local TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_dest_id UUID;
BEGIN
    SELECT d.id INTO v_dest_id
    FROM public.destinations d
    WHERE d.name = city_name
    LIMIT 1;
    IF v_dest_id IS NULL THEN RETURN; END IF;

    RETURN QUERY
    SELECT
        a.place_id,
        a.name,
        ST_Y(a.location::geometry)::FLOAT,
        ST_X(a.location::geometry)::FLOAT,
        a.static_data->>'category',
        a.static_data->>'description_fa',
        a.static_data->>'address',
        COALESCE(a.assets->'photos'->>0, NULL),
        a.is_premium,
        NULLIF(a.static_data->>'rating', '')::FLOAT,
        NULLIF(a.static_data->>'price_range', '')::INT,
        COALESCE(
          ARRAY(SELECT jsonb_array_elements_text(COALESCE(a.static_data->'tags', '[]'::jsonb))),
          ARRAY[]::TEXT[]
        ),
        a.static_data->>'name_local'
    FROM public.attractions a
    WHERE a.destination_id = v_dest_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_city_attractions(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.search_nearby_places(double precision, double precision, double precision, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_nearby_footprints(double precision, double precision, double precision) TO anon, authenticated;

-- -------------------------------------------------------------------------------------
-- 3. Drop legacy non-idempotent deduct_fuel overloads (keep 3-arg)
-- -------------------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.deduct_fuel(double precision);
DROP FUNCTION IF EXISTS public.deduct_fuel(double precision, text);

-- Re-assert idempotent 3-arg version (in case drop order mattered)
CREATE OR REPLACE FUNCTION public.deduct_fuel(
  px_seconds float8,
  px_reason text DEFAULT 'مکالمه صوتی',
  px_transaction_id UUID DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_hours_to_deduct DECIMAL;
  v_transaction_id UUID;
  v_uid UUID := auth.uid();
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  IF px_seconds IS NULL OR px_seconds <= 0 THEN
    RETURN;
  END IF;

  v_transaction_id := COALESCE(px_transaction_id, uuid_generate_v4());

  IF EXISTS (SELECT 1 FROM reward_ledger WHERE transaction_id = v_transaction_id) THEN
    RETURN;
  END IF;

  v_hours_to_deduct := px_seconds / 3600.0;

  INSERT INTO reward_ledger (
    transaction_id, user_id, amount, xp_amount, reward_type, reference_id
  )
  VALUES (
    v_transaction_id,
    v_uid,
    -v_hours_to_deduct,
    0,
    'usage',
    COALESCE(px_reason, 'مکالمه صوتی')
  );

  UPDATE profiles
  SET wallet_balance = GREATEST(0, wallet_balance - v_hours_to_deduct)
  WHERE id = v_uid;
END;
$$;

-- -------------------------------------------------------------------------------------
-- 4. Fix claim_referral: ledger-only for both parties; require increment_wallet
-- -------------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.claim_referral(px_code TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_referrer_id UUID;
  v_reward_amount DECIMAL := 0.5;
  v_claimer_tx UUID := uuid_generate_v4();
  v_referrer_tx UUID := uuid_generate_v4();
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT id INTO v_referrer_id FROM profiles WHERE referral_code = px_code;

  IF v_referrer_id IS NULL THEN
    RAISE EXCEPTION 'INVALID_CODE: رفیق این کد اشتباهه!';
  END IF;

  IF v_referrer_id = auth.uid() THEN
    RAISE EXCEPTION 'SELF_REFERRAL: خودت رو نمیتونی دعوت کنی بامرام!';
  END IF;

  IF EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND referred_by IS NOT NULL) THEN
    RAISE EXCEPTION 'ALREADY_REFERRED: تو که قبلاً دعوت شدی عزیز!';
  END IF;

  UPDATE profiles SET referred_by = v_referrer_id WHERE id = auth.uid();

  -- Claimer reward via ledger
  PERFORM public.increment_wallet(v_claimer_tx, v_reward_amount, 100, 'referral_bonus');

  -- Referrer reward via ledger (admin path: write as service inside SECURITY DEFINER)
  IF NOT EXISTS (SELECT 1 FROM reward_ledger WHERE transaction_id = v_referrer_tx) THEN
    INSERT INTO reward_ledger (transaction_id, user_id, amount, xp_amount, reward_type, reference_id)
    VALUES (v_referrer_tx, v_referrer_id, v_reward_amount, 100, 'referral_bonus', auth.uid()::text);

    UPDATE profiles
    SET
      wallet_balance = wallet_balance + v_reward_amount,
      xp_level = xp_level + 100
    WHERE id = v_referrer_id;
  END IF;
END;
$$;

-- -------------------------------------------------------------------------------------
-- 5. Privilege grants — authenticated may call app RPCs; revoke from anon/public
-- -------------------------------------------------------------------------------------
DO $$
DECLARE
  fn text;
BEGIN
  FOREACH fn IN ARRAY ARRAY[
    'increment_wallet(uuid,numeric,integer,text)',
    'increment_my_wallet(uuid,numeric,integer,text)',
    'deduct_fuel(double precision,text,uuid)',
    'process_poi_visit(uuid,text,text,text)',
    'claim_referral(text)',
    'claim_reward(uuid,text,text)',
    'record_daily_activity(date)',
    'update_trip_budget(uuid,numeric,numeric,numeric,numeric)',
    'unlock_xp_achievements(uuid)',
    'get_nearby_footprints(double precision,double precision,double precision)',
    'get_city_attractions(text)',
    'search_nearby_places(double precision,double precision,double precision,text)'
  ]
  LOOP
    BEGIN
      EXECUTE format('GRANT EXECUTE ON FUNCTION public.%s TO authenticated', fn);
      EXECUTE format('REVOKE EXECUTE ON FUNCTION public.%s FROM PUBLIC', fn);
      EXECUTE format('REVOKE EXECUTE ON FUNCTION public.%s FROM anon', fn);
    EXCEPTION WHEN undefined_function THEN
      RAISE NOTICE 'Skip missing function %', fn;
    END;
  END LOOP;
END $$;

-- admin_increment_wallet: service_role only
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'admin_increment_wallet'
  ) THEN
    REVOKE ALL ON FUNCTION public.admin_increment_wallet(uuid, numeric, integer, uuid, text) FROM PUBLIC;
    REVOKE ALL ON FUNCTION public.admin_increment_wallet(uuid, numeric, integer, uuid, text) FROM anon;
    REVOKE ALL ON FUNCTION public.admin_increment_wallet(uuid, numeric, integer, uuid, text) FROM authenticated;
    -- service_role retains access by default for SECURITY DEFINER callers in Edge Functions
    GRANT EXECUTE ON FUNCTION public.admin_increment_wallet(uuid, numeric, integer, uuid, text) TO service_role;
  END IF;
END $$;

-- -------------------------------------------------------------------------------------
-- 6. Storage buckets + avatar/ticket policies (idempotent)
-- -------------------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES
  ('avatars', 'avatars', true, 2097152),
  ('tickets', 'tickets', false, 10485760),
  ('narratives', 'narratives', true, 10485760),
  ('price_proofs', 'price_proofs', true, 10485760)
ON CONFLICT (id) DO UPDATE
SET public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit;

DROP POLICY IF EXISTS "Avatar Upload Policy" ON storage.objects;
CREATE POLICY "Avatar Upload Policy"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Avatar Delete Policy" ON storage.objects;
CREATE POLICY "Avatar Delete Policy"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Avatar Update Policy" ON storage.objects;
CREATE POLICY "Avatar Update Policy"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Avatar Public View" ON storage.objects;
CREATE POLICY "Avatar Public View"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'avatars');

-- Tickets: owner folder only
DROP POLICY IF EXISTS "Authenticated users can upload tickets" ON storage.objects;
CREATE POLICY "Authenticated users can upload tickets"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'tickets'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Users can read own tickets" ON storage.objects;
CREATE POLICY "Users can read own tickets"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'tickets'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Narratives public read
DROP POLICY IF EXISTS "Public read narratives media" ON storage.objects;
CREATE POLICY "Public read narratives media"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'narratives');

-- Price proofs: authenticated upload to own folder + public read
DROP POLICY IF EXISTS "Authenticated users can upload price proofs" ON storage.objects;
CREATE POLICY "Authenticated users can upload price proofs"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'price_proofs'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Public read price proofs" ON storage.objects;
CREATE POLICY "Public read price proofs"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'price_proofs');

-- -------------------------------------------------------------------------------------
-- 7. Helpful indexes (if missing)
-- -------------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_profiles_referral_code ON public.profiles (referral_code);
CREATE INDEX IF NOT EXISTS idx_reward_ledger_user_type ON public.reward_ledger (user_id, reward_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_attractions_static_category ON public.attractions ((static_data->>'category'));

COMMENT ON SCHEMA public IS 'Rava production schema — hardened 2026-08';
