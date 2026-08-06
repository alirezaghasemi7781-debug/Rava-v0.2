-- Phase 3 Journey Logic: user_trips lifecycle + itinerary activity columns

-- -------------------------------------------------------------------------------------
-- 1. USER_TRIPS (journey entity)
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

CREATE INDEX IF NOT EXISTS idx_user_trips_user ON public.user_trips (user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_trips_status ON public.user_trips (user_id, status);

ALTER TABLE public.user_trips ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own user_trips" ON public.user_trips;
CREATE POLICY "Users can view own user_trips"
  ON public.user_trips FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own user_trips" ON public.user_trips;
CREATE POLICY "Users can insert own user_trips"
  ON public.user_trips FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own user_trips" ON public.user_trips;
CREATE POLICY "Users can update own user_trips"
  ON public.user_trips FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own user_trips" ON public.user_trips;
CREATE POLICY "Users can delete own user_trips"
  ON public.user_trips FOR DELETE USING (auth.uid() = user_id);

-- -------------------------------------------------------------------------------------
-- 2. TRIPS (day activities) — journey link + sequence + place
-- -------------------------------------------------------------------------------------
ALTER TABLE public.trips
  ADD COLUMN IF NOT EXISTS journey_id UUID REFERENCES public.user_trips(id) ON DELETE SET NULL;

ALTER TABLE public.trips
  ADD COLUMN IF NOT EXISTS sequence_order INTEGER NOT NULL DEFAULT 0;

ALTER TABLE public.trips
  ADD COLUMN IF NOT EXISTS place_id TEXT;

ALTER TABLE public.trips
  ADD COLUMN IF NOT EXISTS place_name TEXT;

-- Expand activity status constraint (drop legacy check if present)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_schema = 'public'
      AND table_name = 'trips'
      AND constraint_name = 'trips_status_check'
  ) THEN
    ALTER TABLE public.trips DROP CONSTRAINT trips_status_check;
  END IF;
END $$;

ALTER TABLE public.trips
  ADD CONSTRAINT trips_status_check
  CHECK (
    status IS NULL OR status IN (
      'upcoming', 'pending', 'active', 'now', 'completed', 'skipped', 'cancelled'
    )
  );

CREATE INDEX IF NOT EXISTS idx_trips_journey ON public.trips (journey_id, sequence_order);
CREATE INDEX IF NOT EXISTS idx_trips_status ON public.trips (user_id, status);

-- -------------------------------------------------------------------------------------
-- 3. DAILY_RECAPS — cost + tomorrow hint
-- -------------------------------------------------------------------------------------
ALTER TABLE public.daily_recaps
  ADD COLUMN IF NOT EXISTS daily_cost DECIMAL DEFAULT 0;

ALTER TABLE public.daily_recaps
  ADD COLUMN IF NOT EXISTS tomorrow_hint TEXT;

ALTER TABLE public.daily_recaps
  ADD COLUMN IF NOT EXISTS facts JSONB DEFAULT '{}'::JSONB;

DROP POLICY IF EXISTS "Users can update own daily recaps" ON public.daily_recaps;
CREATE POLICY "Users can update own daily recaps"
  ON public.daily_recaps FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
