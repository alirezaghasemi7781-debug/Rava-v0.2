-- =====================================================================================
-- RAVA Smoke-test hotfixes (production-critical)
-- 1) gen_random_uuid() instead of uuid_generate_v4() under search_path=public
-- 2) Auto-set user_id on insert for user_trips / trips / daily_recaps
-- =====================================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Shared trigger: fill user_id from auth.uid() when omitted
CREATE OR REPLACE FUNCTION public.set_row_user_id()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.user_id IS NULL THEN
    NEW.user_id := auth.uid();
  END IF;
  IF NEW.user_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: user_id required';
  END IF;
  IF auth.uid() IS NOT NULL AND NEW.user_id <> auth.uid() THEN
    RAISE EXCEPTION 'Forbidden: cannot insert for another user';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_user_trips_user_id ON public.user_trips;
CREATE TRIGGER trg_user_trips_user_id
  BEFORE INSERT ON public.user_trips
  FOR EACH ROW EXECUTE FUNCTION public.set_row_user_id();

DROP TRIGGER IF EXISTS trg_trips_user_id ON public.trips;
CREATE TRIGGER trg_trips_user_id
  BEFORE INSERT ON public.trips
  FOR EACH ROW EXECUTE FUNCTION public.set_row_user_id();

DROP TRIGGER IF EXISTS trg_daily_recaps_user_id ON public.daily_recaps;
CREATE TRIGGER trg_daily_recaps_user_id
  BEFORE INSERT ON public.daily_recaps
  FOR EACH ROW EXECUTE FUNCTION public.set_row_user_id();

-- Keep favorites trigger
DROP TRIGGER IF EXISTS trg_favorites_user_id ON public.favorites;
CREATE TRIGGER trg_favorites_user_id
  BEFORE INSERT ON public.favorites
  FOR EACH ROW EXECUTE FUNCTION public.set_row_user_id();

-- -------------------------------------------------------------------------------------
-- Rebuild deduct_fuel with gen_random_uuid()
-- -------------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.deduct_fuel(
  px_seconds float8,
  px_reason text DEFAULT 'مکالمه صوتی',
  px_transaction_id UUID DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
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

  v_transaction_id := COALESCE(px_transaction_id, gen_random_uuid());

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
-- Fix claim_referral UUID generation
-- -------------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.claim_referral(px_code TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_referrer_id UUID;
  v_reward_amount DECIMAL := 0.5;
  v_claimer_tx UUID := gen_random_uuid();
  v_referrer_tx UUID := gen_random_uuid();
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

  PERFORM public.increment_wallet(v_claimer_tx, v_reward_amount, 100, 'referral_bonus');

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

-- Ensure handle_new_user uses gen_random_uuid-compatible referral codes (md5 already fine)
-- Broaden search_path on other economy funcs that may mint UUIDs
CREATE OR REPLACE FUNCTION public.increment_wallet(
  px_transaction_id UUID,
  px_amount DECIMAL,
  px_xp_amount INTEGER,
  px_reward_type TEXT DEFAULT 'general'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
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

  PERFORM unlock_xp_achievements(auth.uid());
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
SET search_path = public, extensions
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

  PERFORM unlock_xp_achievements(v_current_user);
END;
$$;

GRANT EXECUTE ON FUNCTION public.deduct_fuel(double precision, text, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.claim_referral(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_wallet(uuid, numeric, integer, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.process_poi_visit(uuid, text, text, text) TO authenticated;

COMMENT ON FUNCTION public.deduct_fuel(float8, text, uuid) IS
  'Debit AI fuel (hours). Uses gen_random_uuid when tx id omitted. Ledger-first.';
