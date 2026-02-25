
-- =====================================================================================
-- RAHNAMA SMART DATA REPAIR: AUTO-LINK ORPHAN ATTRACTIONS (Phase 4)
-- =====================================================================================
-- این اسکریپت هوشمند، مکان‌های بدون شهر (Orphan) را پیدا کرده و به نزدیک‌ترین شهر فعال وصل می‌کند.
-- این روش مقیاس‌پذیر است و برای تمام شهرهای آینده کار می‌کند.

BEGIN;

-- ۱. آپدیت هوشمند مکان‌های یتیم
WITH closest_city AS (
    SELECT 
        a.place_id,
        d.id AS dest_id,
        ST_Distance(a.location, d.center) as dist
    FROM 
        public.attractions a
    CROSS JOIN LATERAL (
        SELECT id, center 
        FROM public.destinations 
        WHERE is_active = TRUE
        ORDER BY a.location <-> center 
        LIMIT 1
    ) d
    WHERE 
        a.destination_id IS NULL -- فقط یتیم‌ها
        AND ST_DWithin(a.location, d.center, 50000) -- فقط اگر در شعاع ۵۰ کیلومتری شهر باشند
)
UPDATE public.attractions a
SET destination_id = c.dest_id
FROM closest_city c
WHERE a.place_id = c.place_id;

-- ۲. لاگ نتیجه
DO $$
DECLARE
    updated_count INTEGER;
BEGIN
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RAISE NOTICE 'Smart Relink Completed: % orphan attractions linked to their closest cities.', updated_count;
END $$;

COMMIT;
