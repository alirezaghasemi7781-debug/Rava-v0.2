
-- =====================================================================================
-- RAHNAMA DATA REPAIR: FIX MISSING DESTINATIONS (Phase 3)
-- =====================================================================================
-- این اسکریپت مطمئن می‌شود که شهرهای "Istanbul" و "Dubai" در جدول destinations وجود دارند.
-- اگر سید فایل قبلی اجرا نشده باشد یا نام شهرها اشتباه باشد، این فایل مشکل را حل می‌کند.

BEGIN;

-- ۱. تعمیر شهر استانبول
INSERT INTO public.destinations (name, center, is_active, manifest_version)
VALUES (
    'Istanbul', 
    ST_SetSRID(ST_MakePoint(28.9784, 41.0082), 4326), 
    TRUE, 
    1
)
ON CONFLICT (name) DO UPDATE 
SET 
    center = EXCLUDED.center,
    is_active = TRUE;

-- ۲. تعمیر شهر دبی
INSERT INTO public.destinations (name, center, is_active, manifest_version)
VALUES (
    'Dubai', 
    ST_SetSRID(ST_MakePoint(55.2708, 25.2048), 4326), 
    TRUE, 
    1
)
ON CONFLICT (name) DO UPDATE 
SET 
    center = EXCLUDED.center,
    is_active = TRUE;

-- ۳. لاگ موفقیت
DO $$
BEGIN
    RAISE NOTICE 'Destinations data repaired successfully for Istanbul and Dubai.';
END $$;

COMMIT;
