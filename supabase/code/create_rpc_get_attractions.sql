
-- =====================================================================================
-- RAHNAMA RPC: GET CITY ATTRACTIONS (Final Fix for Marker Issue)
-- =====================================================================================
-- این تابع مشکل فرمت باینری PostGIS را با تبدیل سمت سرور حل می‌کند.
-- همچنین پرفورمنس را با کاهش حجم داده انتقالی بهبود می‌دهد.

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
    is_premium BOOLEAN
) 
LANGUAGE plpgsql
AS $$
DECLARE
    dest_id UUID;
BEGIN
    -- ۱. پیدا کردن آیدی شهر
    SELECT id INTO dest_id FROM public.destinations WHERE name = city_name LIMIT 1;
    
    IF dest_id IS NULL THEN
        RETURN; -- اگر شهر نبود، هیچی برنگردان (یا می‌توان خطا داد)
    END IF;

    -- ۲. بازگرداندن مکان‌ها با مختصات جدا شده
    RETURN QUERY
    SELECT 
        a.place_id,
        a.name,
        ST_Y(a.location::geometry) as lat, -- تبدیل ایمن به Float
        ST_X(a.location::geometry) as lng, -- تبدیل ایمن به Float
        a.static_data->>'category' as category,
        a.static_data->>'description_fa' as description,
        a.static_data->>'address' as address,
        -- استخراج اولین عکس از آرایه assets
        COALESCE(a.assets->'photos'->>0, NULL) as image,
        a.is_premium
    FROM 
        public.attractions a
    WHERE 
        a.destination_id = dest_id;
END;
$$;
