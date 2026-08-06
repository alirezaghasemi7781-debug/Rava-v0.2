-- =====================================================================================
-- RAVA Phase 1: Core schema (consolidated from supabase/code/)
-- Idempotent: safe to re-run on existing databases via IF NOT EXISTS
-- =====================================================================================

CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -------------------------------------------------------------------------------------
-- 1. PROFILES
-- -------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  avatar_url TEXT,
  wallet_balance DECIMAL DEFAULT 2.0,
  xp_level INTEGER DEFAULT 1,
  reputation_score INTEGER DEFAULT 0,
  current_city TEXT CHECK (current_city IN ('Istanbul', 'Dubai', 'Tehran')),
  preferences JSONB DEFAULT '{}'::JSONB,
  semantic_profile JSONB DEFAULT '{}'::JSONB,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  last_summary_at TIMESTAMP WITH TIME ZONE,
  referral_code TEXT UNIQUE DEFAULT substring(md5(random()::text), 1, 6),
  referred_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Backfill columns if an older profiles table already exists
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS wallet_balance DECIMAL DEFAULT 2.0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS xp_level INTEGER DEFAULT 1;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS reputation_score INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS current_city TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{}'::JSONB;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS semantic_profile JSONB DEFAULT '{}'::JSONB;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_summary_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referral_code TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referred_by UUID;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

UPDATE public.profiles SET semantic_profile = '{}'::JSONB WHERE semantic_profile IS NULL;
ALTER TABLE public.profiles ALTER COLUMN semantic_profile SET DEFAULT '{}'::JSONB;

CREATE INDEX IF NOT EXISTS idx_profiles_preferences ON public.profiles USING GIN (preferences);
CREATE INDEX IF NOT EXISTS idx_profiles_semantic_vibe ON public.profiles USING GIN (semantic_profile);
CREATE INDEX IF NOT EXISTS idx_profiles_onboarding ON public.profiles (onboarding_completed);

-- Auto-create profile row on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, username, referral_code)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    substring(md5(random()::text || NEW.id::text), 1, 6)
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- -------------------------------------------------------------------------------------
-- 2. PLACES_CACHE
-- -------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.places_cache (
  place_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  location GEOGRAPHY(POINT, 4326) NOT NULL,
  category TEXT,
  google_types TEXT[],
  address TEXT,
  phone TEXT,
  opening_hours JSONB,
  google_photo_refs JSONB[],
  crowd_photos JSONB[] DEFAULT '{}',
  vibe_summary TEXT,
  last_ai_analysis TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS places_geo_idx ON public.places_cache USING GIST (location);
CREATE INDEX IF NOT EXISTS idx_places_cache_location ON public.places_cache USING GIST (location);

-- -------------------------------------------------------------------------------------
-- 3. FROZEN MEMORY: destinations / attractions / narratives
-- -------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.destinations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  center GEOGRAPHY(POINT, 4326) NOT NULL,
  manifest_version INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.attractions (
  place_id TEXT PRIMARY KEY,
  destination_id UUID REFERENCES public.destinations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  location GEOGRAPHY(POINT, 4326) NOT NULL,
  static_data JSONB DEFAULT '{}'::JSONB,
  assets JSONB DEFAULT '{ "photos": [], "3d_icon": null }'::JSONB,
  is_premium BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.narratives (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  place_id TEXT REFERENCES public.attractions(place_id) ON DELETE CASCADE,
  audio_url TEXT NOT NULL,
  transcript TEXT,
  trigger_type TEXT DEFAULT 'geofence' CHECK (trigger_type IN ('geofence', 'manual', 'entry')),
  voice_profile TEXT DEFAULT 'Kore',
  duration_seconds INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_destinations_center ON public.destinations USING GIST (center);
CREATE INDEX IF NOT EXISTS idx_attractions_location ON public.attractions USING GIST (location);
CREATE INDEX IF NOT EXISTS idx_attractions_destination ON public.attractions (destination_id);
CREATE INDEX IF NOT EXISTS idx_narratives_place ON public.narratives (place_id);

-- -------------------------------------------------------------------------------------
-- 4. TRIPS
-- -------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.trips (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('flight', 'hotel', 'activity', 'food')),
  title TEXT,
  start_time TIMESTAMP WITH TIME ZONE,
  end_time TIMESTAMP WITH TIME ZONE,
  location GEOGRAPHY(POINT, 4326),
  destination_address TEXT,
  details JSONB,
  status TEXT CHECK (status IN ('upcoming', 'completed', 'cancelled')) DEFAULT 'upcoming',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_trips_safe_haven ON public.trips (user_id, type, start_time);
CREATE INDEX IF NOT EXISTS idx_trips_location ON public.trips USING GIST (location);
CREATE INDEX IF NOT EXISTS idx_trips_user ON public.trips (user_id, created_at DESC);

-- -------------------------------------------------------------------------------------
-- 5. STAMPS (inferred from process_poi_visit + client selects)
-- -------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.stamps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  place_id TEXT NOT NULL,
  place_name TEXT NOT NULL,
  city TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (user_id, place_id)
);

-- Legacy stamps used stamped_at — add created_at and backfill
ALTER TABLE public.stamps ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE public.stamps ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE public.stamps ADD COLUMN IF NOT EXISTS stamped_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'stamps' AND column_name = 'stamped_at'
  ) THEN
    UPDATE public.stamps
    SET created_at = COALESCE(created_at, stamped_at, NOW())
    WHERE created_at IS NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_stamps_user ON public.stamps (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_stamps_city ON public.stamps (user_id, city);

-- -------------------------------------------------------------------------------------
-- 6. FAVORITES
-- -------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  place_id TEXT NOT NULL,
  place_snapshot JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (user_id, place_id)
);

CREATE INDEX IF NOT EXISTS idx_favorites_user ON public.favorites (user_id, created_at DESC);

-- -------------------------------------------------------------------------------------
-- 7. REWARD LEDGER
-- -------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.reward_ledger (
  transaction_id UUID PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount DECIMAL NOT NULL,
  xp_amount INTEGER NOT NULL DEFAULT 0,
  reward_type TEXT NOT NULL,
  reference_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.reward_ledger ADD COLUMN IF NOT EXISTS reference_id TEXT;

CREATE INDEX IF NOT EXISTS idx_reward_ledger_user ON public.reward_ledger (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reward_ledger_created_at ON public.reward_ledger (created_at DESC);

-- -------------------------------------------------------------------------------------
-- 8. FOOTPRINTS + PRICE_REPORTS
-- -------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.footprints (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id),
  place_id TEXT REFERENCES public.places_cache(place_id),
  location GEOGRAPHY(POINT, 4326),
  content TEXT,
  mood TEXT,
  upvotes INTEGER DEFAULT 0,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_footprints_location ON public.footprints USING GIST (location);
CREATE INDEX IF NOT EXISTS idx_footprints_user ON public.footprints (user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.price_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id),
  place_id TEXT REFERENCES public.places_cache(place_id),
  item_name TEXT,
  reported_price DECIMAL,
  currency TEXT,
  proof_image_url TEXT,
  ai_verification_status TEXT DEFAULT 'pending',
  ai_confidence_score DECIMAL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_price_reports_user ON public.price_reports (user_id, created_at DESC);

-- -------------------------------------------------------------------------------------
-- 9. CHAT LOGS
-- -------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.chat_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('user', 'model')),
  content TEXT,
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_logs_user_date ON public.chat_logs (user_id, created_at DESC);

-- -------------------------------------------------------------------------------------
-- 10. DAILY RECAPS + ACHIEVEMENTS
-- -------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.daily_recaps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  recap_date DATE NOT NULL DEFAULT CURRENT_DATE,
  city TEXT,
  summary TEXT,
  highlights JSONB DEFAULT '[]'::JSONB,
  xp_earned INTEGER DEFAULT 0,
  places_visited INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (user_id, recap_date)
);

CREATE INDEX IF NOT EXISTS idx_daily_recaps_user ON public.daily_recaps (user_id, recap_date DESC);

CREATE TABLE IF NOT EXISTS public.achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  title_fa TEXT,
  description TEXT,
  icon TEXT DEFAULT 'award',
  xp_threshold INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.user_achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (user_id, achievement_id)
);

CREATE INDEX IF NOT EXISTS idx_user_achievements_user ON public.user_achievements (user_id, unlocked_at DESC);

INSERT INTO public.achievements (code, title, title_fa, description, icon, xp_threshold)
VALUES
  ('first_steps', 'Junior Nomad', 'مسافر تازه‌کار', 'اولین تجربه XP را کسب کن', 'footprints', 0),
  ('city_walker', 'City Walker', 'گردشگر شهری', 'به ۵۰ XP برس', 'map', 50),
  ('world_traveler', 'World Traveler', 'جهانگرد', 'به ۵۰۰ XP برس', 'globe', 500),
  ('legendary', 'Legendary Explorer', 'کاوشگر افسانه‌ای', 'به ۱۰۰۰ XP برس', 'crown', 1000)
ON CONFLICT (code) DO NOTHING;
