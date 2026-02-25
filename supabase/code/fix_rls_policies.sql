
-- =====================================================================================
-- RAHNAMA DATABASE RESCUE: FIX RLS POLICIES (Phase 1)
-- =====================================================================================
-- این اسکریپت تضمین می‌کند که جداول اصلی برای همه کاربران (حتی لاگین نشده) قابل خواندن هستند.
-- اگر مشکل عدم نمایش مارکرها مربوط به دسترسی دیتابیس باشد، این فایل آن را حل می‌کند.

BEGIN;

-- ۱. اطمینان از فعال بودن RLS (امنیت پایه)
ALTER TABLE IF EXISTS public.destinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.attractions ENABLE ROW LEVEL SECURITY;

-- ۲. حذف سیاست‌های احتمالی قدیمی یا محدود (برای جلوگیری از تداخل)
DROP POLICY IF EXISTS "Public Read Destinations" ON public.destinations;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.destinations;

DROP POLICY IF EXISTS "Public Read Attractions" ON public.attractions;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.attractions;

-- ۳. ایجاد سیاست جدید و قطعی: دسترسی خواندن عمومی (SELECT)
CREATE POLICY "Public Read Destinations" 
ON public.destinations 
FOR SELECT 
USING (true); -- همه می‌توانند بخوانند

CREATE POLICY "Public Read Attractions" 
ON public.attractions 
FOR SELECT 
USING (true); -- همه می‌توانند بخوانند

-- ۴. لاگ برای اطمینان از اجرا
DO $$
BEGIN
    RAISE NOTICE 'RLS Policies for Destinations and Attractions have been reset to PUBLIC READ.';
END $$;

COMMIT;
