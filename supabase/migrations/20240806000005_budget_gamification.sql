-- =====================================================================================
-- RAVA Phase 4.2: Trip budget (separate from Fuel) + gamification rewards / streak
-- Client submits events; calculations happen in RPCs where possible.
-- NOTE: user_trips may be created fully in 00006; ensure table exists before ALTER
-- so this file can run before or after journey_logic.
-- =====================================================================================

-- -------------------------------------------------------------------------------------
-- 0. Ensure USER_TRIPS exists (idempotent; full RLS/status checks in 00006)
-- -------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_trips (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  city TEXT,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'planning'
    CHECK (status IN ('planning', 'upcoming', 'active', 'paused', 'completed', 'cancelled')),
  start_date DATE,
  end_date DATE,
  budget_style TEXT CHECK (budget_style IS NULL OR budget_style IN ('budget', 'mid', 'luxury')),
  interests JSONB DEFAULT '[]'::JSONB,
  template_id TEXT,
  passport_entry TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- -------------------------------------------------------------------------------------
-- 1. USER_TRIPS — monetary trip budget (NOT AI fuel)
-- -------------------------------------------------------------------------------------
ALTER TABLE public.user_trips
  ADD COLUMN IF NOT EXISTS total_budget DECIMAL DEFAULT 0;

ALTER TABLE public.user_trips
  ADD COLUMN IF NOT EXISTS daily_expenses DECIMAL DEFAULT 0;

ALTER TABLE public.user_trips
  ADD COLUMN IF NOT EXISTS recorded_expenses DECIMAL DEFAULT 0;

ALTER TABLE public.user_trips
  ADD COLUMN IF NOT EXISTS estimated_cost DECIMAL DEFAULT 0;

ALTER TABLE public.user_trips
  ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'IRT';

-- -------------------------------------------------------------------------------------
-- 2. PROFILES — streak tracking
-- -------------------------------------------------------------------------------------
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS last_active_date DATE;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS current_streak INTEGER DEFAULT 0;

-- -------------------------------------------------------------------------------------
-- 3. Alias: TopUpModal historically called increment_my_wallet
-- -------------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.increment_my_wallet(
  px_transaction_id UUID,
  px_amount DECIMAL,
  px_xp_amount INTEGER,
  px_reward_type TEXT DEFAULT 'topup'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.increment_wallet(px_transaction_id, px_amount, px_xp_amount, px_reward_type);
END;
$$;

GRANT EXECUTE ON FUNCTION public.increment_my_wallet TO authenticated;

-- -------------------------------------------------------------------------------------
-- 4. Unlock XP-threshold achievements (idempotent per achievement)
-- -------------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.unlock_xp_achievements(px_user_id UUID DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := COALESCE(px_user_id, auth.uid());
  v_xp INTEGER;
BEGIN
  IF v_uid IS NULL THEN
    RETURN;
  END IF;

  SELECT xp_level INTO v_xp FROM profiles WHERE id = v_uid;
  IF v_xp IS NULL THEN
    RETURN;
  END IF;

  INSERT INTO user_achievements (user_id, achievement_id)
  SELECT v_uid, a.id
  FROM achievements a
  WHERE a.xp_threshold <= v_xp
    AND NOT EXISTS (
      SELECT 1 FROM user_achievements ua
      WHERE ua.user_id = v_uid AND ua.achievement_id = a.id
    );
END;
$$;

-- Hook achievement unlock into increment_wallet
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

  PERFORM unlock_xp_achievements(auth.uid());
END;
$$;

-- -------------------------------------------------------------------------------------
-- 5. Generic reward event RPC (stamp / daily_complete / profile_complete / achievement)
-- Client only submits event type + stable transaction_id; amounts calculated server-side.
-- -------------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.claim_reward(
  px_transaction_id UUID,
  px_reward_type TEXT,
  px_reference_id TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_fuel DECIMAL := 0;
  v_xp INTEGER := 0;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  IF EXISTS (SELECT 1 FROM reward_ledger WHERE transaction_id = px_transaction_id) THEN
    RETURN jsonb_build_object('ok', true, 'idempotent', true, 'fuel', 0, 'xp', 0);
  END IF;

  CASE px_reward_type
    WHEN 'stamp' THEN
      v_fuel := 0.1;
      v_xp := 50;
    WHEN 'daily_itinerary' THEN
      v_fuel := 0.05;
      v_xp := 75;
    WHEN 'profile_complete' THEN
      v_fuel := 0.2;
      v_xp := 100;
    WHEN 'achievement' THEN
      v_fuel := 0.1;
      v_xp := 150;
    WHEN 'referral_bonus' THEN
      RAISE EXCEPTION 'Use claim_referral for referral rewards';
    ELSE
      RAISE EXCEPTION 'Unknown reward type: %', px_reward_type;
  END CASE;

  INSERT INTO reward_ledger (
    transaction_id, user_id, amount, xp_amount, reward_type, reference_id
  )
  VALUES (
    px_transaction_id, v_uid, v_fuel, v_xp, px_reward_type, px_reference_id
  );

  UPDATE profiles
  SET
    wallet_balance = wallet_balance + v_fuel,
    xp_level = xp_level + v_xp
  WHERE id = v_uid;

  PERFORM unlock_xp_achievements(v_uid);

  RETURN jsonb_build_object(
    'ok', true,
    'idempotent', false,
    'fuel', v_fuel,
    'xp', v_xp,
    'reward_type', px_reward_type
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.claim_reward TO authenticated;
GRANT EXECUTE ON FUNCTION public.unlock_xp_achievements TO authenticated;

-- -------------------------------------------------------------------------------------
-- 6. Streak ping — client submits activity day; server updates streak
-- -------------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.record_daily_activity(px_date DATE DEFAULT CURRENT_DATE)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_last DATE;
  v_streak INTEGER;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT last_active_date, COALESCE(current_streak, 0)
  INTO v_last, v_streak
  FROM profiles
  WHERE id = v_uid;

  IF v_last IS NOT NULL AND v_last = px_date THEN
    RETURN jsonb_build_object('current_streak', v_streak, 'last_active_date', v_last);
  END IF;

  IF v_last IS NOT NULL AND v_last = (px_date - 1) THEN
    v_streak := v_streak + 1;
  ELSE
    v_streak := 1;
  END IF;

  UPDATE profiles
  SET last_active_date = px_date, current_streak = v_streak
  WHERE id = v_uid;

  -- Small XP for maintaining streak (ledger-backed, date as stable key via hash)
  PERFORM increment_wallet(
    md5(v_uid::text || ':streak:' || px_date::text)::uuid,
    0,
    LEAST(10 + v_streak, 50),
    'streak'
  );

  RETURN jsonb_build_object('current_streak', v_streak, 'last_active_date', px_date);
END;
$$;

GRANT EXECUTE ON FUNCTION public.record_daily_activity TO authenticated;

-- -------------------------------------------------------------------------------------
-- 7. Trip budget helpers — monetary, not fuel
-- -------------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_trip_budget(
  px_journey_id UUID,
  px_total_budget DECIMAL DEFAULT NULL,
  px_estimated_cost DECIMAL DEFAULT NULL,
  px_expense_delta DECIMAL DEFAULT NULL,
  px_daily_expenses DECIMAL DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_row public.user_trips%ROWTYPE;
  v_remaining DECIMAL;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT * INTO v_row FROM user_trips WHERE id = px_journey_id AND user_id = v_uid;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Trip not found';
  END IF;

  UPDATE user_trips SET
    total_budget = COALESCE(px_total_budget, total_budget),
    estimated_cost = COALESCE(px_estimated_cost, estimated_cost),
    daily_expenses = COALESCE(px_daily_expenses, daily_expenses),
    recorded_expenses = GREATEST(0, COALESCE(recorded_expenses, 0) + COALESCE(px_expense_delta, 0)),
    updated_at = NOW()
  WHERE id = px_journey_id AND user_id = v_uid
  RETURNING * INTO v_row;

  v_remaining := COALESCE(v_row.total_budget, 0) - COALESCE(v_row.recorded_expenses, 0);

  RETURN jsonb_build_object(
    'total_budget', v_row.total_budget,
    'daily_expenses', v_row.daily_expenses,
    'recorded_expenses', v_row.recorded_expenses,
    'estimated_cost', v_row.estimated_cost,
    'remaining', v_remaining,
    'over_budget', v_remaining < 0
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_trip_budget TO authenticated;

-- Extra XP milestone badges
INSERT INTO public.achievements (code, title, title_fa, description, icon, xp_threshold)
VALUES
  ('streak_starter', 'Streak Starter', 'شروع رگبار', 'اولین روز فعالیت پیوسته', 'flame', 10),
  ('fuel_saver', 'Fuel Conscious', 'هوشمند سوخت', '۱۰۰ XP کسب کن', 'zap', 100),
  ('passport_pro', 'Passport Pro', 'حرفه‌ای پاسپورت', '۲۵۰ XP کسب کن', 'book', 250)
ON CONFLICT (code) DO NOTHING;
