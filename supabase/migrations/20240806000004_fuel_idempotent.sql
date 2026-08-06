-- =====================================================================================
-- RAVA Phase 4.1: Idempotent deduct_fuel (client-stable transaction_id)
-- Balance changes ONLY via ledger; retries with same tx id are no-ops.
-- Fuel units: DECIMAL hours on profiles.wallet_balance (UI displays minutes × 60).
-- =====================================================================================

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

  -- Idempotency: same client transaction_id → skip (no double debit on outbox retry)
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

COMMENT ON FUNCTION public.deduct_fuel(float8, text, uuid) IS
  'Debit AI fuel (hours). Pass stable px_transaction_id for idempotent retries. Ledger-first.';
