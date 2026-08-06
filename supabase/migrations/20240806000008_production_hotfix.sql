-- =====================================================================================
-- RAVA Production Hotfix — get_city_attractions ambiguity, stamp timestamps, public RPCs
-- =====================================================================================

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

-- Legacy stamped_at ↔ created_at sync
ALTER TABLE public.stamps ADD COLUMN IF NOT EXISTS stamped_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE public.stamps ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

CREATE OR REPLACE FUNCTION public.sync_stamp_timestamps()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.created_at IS NULL AND NEW.stamped_at IS NOT NULL THEN
    NEW.created_at := NEW.stamped_at;
  ELSIF NEW.stamped_at IS NULL AND NEW.created_at IS NOT NULL THEN
    NEW.stamped_at := NEW.created_at;
  ELSIF NEW.created_at IS NULL AND NEW.stamped_at IS NULL THEN
    NEW.created_at := NOW();
    NEW.stamped_at := NOW();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_stamp_timestamps ON public.stamps;
CREATE TRIGGER trg_sync_stamp_timestamps
  BEFORE INSERT OR UPDATE ON public.stamps
  FOR EACH ROW EXECUTE FUNCTION public.sync_stamp_timestamps();

UPDATE public.stamps
SET created_at = COALESCE(created_at, stamped_at, NOW()),
    stamped_at = COALESCE(stamped_at, created_at, NOW())
WHERE created_at IS NULL OR stamped_at IS NULL;

ALTER TABLE public.reward_ledger ADD COLUMN IF NOT EXISTS reference_id TEXT;
