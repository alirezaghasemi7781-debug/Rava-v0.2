-- =====================================================================================
-- RAVA Phase 1: RLS policies + economy RPCs (SECURITY DEFINER)
-- Consolidated from infrastructure_repair, phase4_security_rls, frozen_memory, patches
-- =====================================================================================

-- -------------------------------------------------------------------------------------
-- Enable RLS
-- -------------------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stamps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reward_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.footprints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.price_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_recaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.places_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.destinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attractions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.narratives ENABLE ROW LEVEL SECURITY;

-- -------------------------------------------------------------------------------------
-- PROFILES — own data only
-- -------------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- -------------------------------------------------------------------------------------
-- TRIPS — own data only
-- -------------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view own trips" ON public.trips;
CREATE POLICY "Users can view own trips"
  ON public.trips FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own trips" ON public.trips;
CREATE POLICY "Users can insert own trips"
  ON public.trips FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own trips" ON public.trips;
CREATE POLICY "Users can update own trips"
  ON public.trips FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own trips" ON public.trips;
CREATE POLICY "Users can delete own trips"
  ON public.trips FOR DELETE USING (auth.uid() = user_id);

-- -------------------------------------------------------------------------------------
-- STAMPS — own data only (writes via SECURITY DEFINER RPC)
-- -------------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view their own stamps" ON public.stamps;
CREATE POLICY "Users can view their own stamps"
  ON public.stamps FOR SELECT USING (auth.uid() = user_id);

-- -------------------------------------------------------------------------------------
-- FAVORITES — own data CRUD
-- -------------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can manage own favorites" ON public.favorites;
CREATE POLICY "Users can manage own favorites"
  ON public.favorites FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Ensure user_id defaults from session on insert (client may omit it)
CREATE OR REPLACE FUNCTION public.set_favorite_user_id()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.user_id IS NULL THEN
    NEW.user_id := auth.uid();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_favorites_user_id ON public.favorites;
CREATE TRIGGER trg_favorites_user_id
  BEFORE INSERT ON public.favorites
  FOR EACH ROW EXECUTE FUNCTION public.set_favorite_user_id();

-- -------------------------------------------------------------------------------------
-- REWARD LEDGER — read own rows
-- -------------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can only see their own rewards" ON public.reward_ledger;
DROP POLICY IF EXISTS "Users can only view their own rewards" ON public.reward_ledger;
DROP POLICY IF EXISTS "Users view own rewards" ON public.reward_ledger;
DROP POLICY IF EXISTS "Users can view own transactions" ON public.reward_ledger;
CREATE POLICY "Users can view own transactions"
  ON public.reward_ledger FOR SELECT
  USING (auth.uid() = user_id);

-- -------------------------------------------------------------------------------------
-- CHAT LOGS — own data
-- -------------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can only access their own chat logs" ON public.chat_logs;
DROP POLICY IF EXISTS "Users can view own chat logs" ON public.chat_logs;
DROP POLICY IF EXISTS "Users can insert own chat logs" ON public.chat_logs;
CREATE POLICY "Users can view own chat logs"
  ON public.chat_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own chat logs"
  ON public.chat_logs FOR INSERT WITH CHECK (auth.uid() = user_id);

-- -------------------------------------------------------------------------------------
-- FOOTPRINTS — public verified read; own insert
-- -------------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Anyone can view verified footprints" ON public.footprints;
CREATE POLICY "Anyone can view verified footprints"
  ON public.footprints FOR SELECT
  USING (is_verified = TRUE OR auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own footprints" ON public.footprints;
CREATE POLICY "Users can insert their own footprints"
  ON public.footprints FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- -------------------------------------------------------------------------------------
-- PRICE REPORTS — own data
-- -------------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view their own price reports" ON public.price_reports;
CREATE POLICY "Users can view their own price reports"
  ON public.price_reports FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can submit price reports" ON public.price_reports;
CREATE POLICY "Users can submit price reports"
  ON public.price_reports FOR INSERT WITH CHECK (auth.uid() = user_id);

-- -------------------------------------------------------------------------------------
-- DAILY RECAPS / ACHIEVEMENTS
-- -------------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view own daily recaps" ON public.daily_recaps;
CREATE POLICY "Users can view own daily recaps"
  ON public.daily_recaps FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own daily recaps" ON public.daily_recaps;
CREATE POLICY "Users can insert own daily recaps"
  ON public.daily_recaps FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Public read achievements" ON public.achievements;
CREATE POLICY "Public read achievements"
  ON public.achievements FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can view own unlocked achievements" ON public.user_achievements;
CREATE POLICY "Users can view own unlocked achievements"
  ON public.user_achievements FOR SELECT USING (auth.uid() = user_id);

-- -------------------------------------------------------------------------------------
-- CURATED / CACHE PLACES — public read
-- -------------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Public Read Destinations" ON public.destinations;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.destinations;
CREATE POLICY "Public Read Destinations"
  ON public.destinations FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public Read Attractions" ON public.attractions;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.attractions;
CREATE POLICY "Public Read Attractions"
  ON public.attractions FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public Read Narratives" ON public.narratives;
CREATE POLICY "Public Read Narratives"
  ON public.narratives FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public Read Places Cache" ON public.places_cache;
CREATE POLICY "Public Read Places Cache"
  ON public.places_cache FOR SELECT USING (true);

-- -------------------------------------------------------------------------------------
-- ECONOMY RPCs (SECURITY DEFINER) — identity from auth.uid()
-- -------------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.increment_wallet(
  px_transaction_id UUID,
  px_amount DECIMAL,
  px_xp_amount INTEGER,
  px_reward_type TEXT DEFAULT 'general'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  IF EXISTS (SELECT 1 FROM reward_ledger WHERE transaction_id = px_transaction_id) THEN
    RETURN;
  END IF;

  INSERT INTO reward_ledger (transaction_id, user_id, amount, xp_amount, reward_type)
  VALUES (px_transaction_id, auth.uid(), px_amount, px_xp_amount, px_reward_type);

  UPDATE profiles
  SET
    wallet_balance = wallet_balance + px_amount,
    xp_level = xp_level + px_xp_amount
  WHERE id = auth.uid();
END;
$$;

CREATE OR REPLACE FUNCTION public.process_poi_visit(
  px_transaction_id UUID,
  px_place_id TEXT,
  px_place_name TEXT,
  px_city TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_reward_fuel DECIMAL := 0.1;
  v_reward_xp INTEGER := 50;
  v_current_user UUID;
BEGIN
  v_current_user := auth.uid();

  IF v_current_user IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: برای ثبت مهر باید لاگین باشی رفیق.';
  END IF;

  IF EXISTS (SELECT 1 FROM reward_ledger WHERE transaction_id = px_transaction_id) THEN
    RETURN;
  END IF;

  IF EXISTS (SELECT 1 FROM stamps WHERE user_id = v_current_user AND place_id = px_place_id) THEN
    RETURN;
  END IF;

  INSERT INTO stamps (user_id, place_id, place_name, city)
  VALUES (v_current_user, px_place_id, px_place_name, px_city);

  INSERT INTO reward_ledger (transaction_id, user_id, amount, xp_amount, reward_type, reference_id)
  VALUES (px_transaction_id, v_current_user, v_reward_fuel, v_reward_xp, 'stamp', px_place_id);

  UPDATE profiles
  SET
    wallet_balance = wallet_balance + v_reward_fuel,
    xp_level = xp_level + v_reward_xp
  WHERE id = v_current_user;
END;
$$;

CREATE OR REPLACE FUNCTION public.deduct_fuel(
  px_seconds float8,
  px_reason text DEFAULT 'مکالمه صوتی'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_hours_to_deduct DECIMAL;
  v_transaction_id UUID := uuid_generate_v4();
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  v_hours_to_deduct := px_seconds / 3600.0;

  UPDATE profiles
  SET wallet_balance = GREATEST(0, wallet_balance - v_hours_to_deduct)
  WHERE id = auth.uid();

  INSERT INTO reward_ledger (transaction_id, user_id, amount, xp_amount, reward_type, reference_id)
  VALUES (v_transaction_id, auth.uid(), -v_hours_to_deduct, 0, 'usage', px_reason);
END;
$$;

CREATE OR REPLACE FUNCTION public.claim_referral(px_code TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_referrer_id UUID;
  v_reward_amount DECIMAL := 0.5;
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

  PERFORM increment_wallet(uuid_generate_v4(), v_reward_amount, 100, 'referral_bonus');

  UPDATE profiles
  SET
    wallet_balance = wallet_balance + v_reward_amount,
    xp_level = xp_level + 100
  WHERE id = v_referrer_id;

  INSERT INTO reward_ledger (transaction_id, user_id, amount, xp_amount, reward_type, reference_id)
  VALUES (uuid_generate_v4(), v_referrer_id, v_reward_amount, 100, 'referral_bonus', auth.uid()::text);
END;
$$;

-- Nearby footprints helper (verified only)
CREATE OR REPLACE FUNCTION public.get_nearby_footprints(
  px_lat float8,
  px_lng float8,
  px_radius float8 DEFAULT 2000
)
RETURNS TABLE (
  id UUID,
  content TEXT,
  lat float8,
  lng float8,
  user_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    f.id,
    f.content,
    ST_Y(f.location::geometry) AS lat,
    ST_X(f.location::geometry) AS lng,
    p.username AS user_name,
    f.created_at
  FROM footprints f
  JOIN profiles p ON f.user_id = p.id
  WHERE
    ST_DWithin(
      f.location,
      ST_SetSRID(ST_MakePoint(px_lng, px_lat), 4326),
      px_radius
    )
    AND f.is_verified = TRUE
  ORDER BY f.created_at DESC
  LIMIT 50;
END;
$$;
