# گزارش تحلیل فنی و برنامه نجات — فاز ۵ (Map & Data Rescue)
**پروژه:** رهنما (Rahnamaa)  
**تاریخ:** ۱۴۰۴  
**وضعیت:** بحرانی (Critical) — مشکلات نمایشی و تعاملی پایدار  
**مسیر فایل:** `/debug/debug5_map/analyze_and_plan.md`

---

## ۱. خلاصه وضعیت (Executive Summary)

علی‌رغم اصلاحات انجام شده در فاز ۴ (کشینگ شهرها و هندلینگ ایونت‌ها در React)، دو مشکل اصلی همچنان پابرجاست:
1.  **ناپدید بودن مارکرها:** مکان‌های منتخب (Curated) دبی و استانبول روی نقشه رندر نمی‌شوند.
2.  **پنجره سفید گوگل:** کلیک روی POIهای گوگل (رستوران‌ها و...) همچنان InfoWindow پیش‌فرض را باز می‌کند.

علاوه بر این، لاگ‌های کنسول نشان‌دهنده محدودیت‌های محیطی (`Permissions Policy`) برای Geolocation است که هرچند علت اصلی خرابی نقشه نیست، اما باید مدیریت شود.

---

## ۲. کالبدشکافی مشکلات (Step-by-Step Backtracing)

### ۲.۱. مشکل اول: مارکرهای نامرئی (The Ghost Markers)

**نقطه انهدام (Crash Point):**
هیچ خطای جاوااسکریپتی وجود ندارد، اما آرایه `visibleCurated` در عمل یا خالی است یا اگر پر است، مارکرها رندر نمی‌شوند.

**ردیابی جریان داده (Data Flow Tracking):**
1.  **Database:** داده‌ها توسط Seed تزریق شده‌اند (تایید شده).
2.  **API Request:** تابع `getCuratedPlaces` درخواست را به Supabase می‌فرستد.
3.  **Security Layer (RLS):** 🛑 **نقطه شکست احتمالی ۱.** جداول `attractions` و `destinations` ایجاد شده‌اند اما هیچ Policy برای دسترسی عمومی (`public` role) تعریف نشده است. در Supabase، رفتار پیش‌فرض در صورت فعال بودن RLS و نبودن Policy، بازگرداندن آرایه خالی `[]` بدون خطا است.
4.  **Client State:** اگر RLS مانع شود، استور خالی می‌ماند.
5.  **Rendering Layer:** اگر استور پر باشد ولی مارکر نباشد: 🛑 **نقطه شکست احتمالی ۲.** کامپوننت `AdvancedMarker` برای کارکرد صحیح نیاز به `Map ID` دارد که در Google Cloud Console به عنوان **Vector Map** پیکربندی شده باشد. اگر Map ID مربوط به Raster Map باشد، `AdvancedMarker` در برخی مرورگرها/نسخه‌ها اصلاً رندر نمی‌شود (Silent Failure).

**نتیجه تحلیل:** مشکل به احتمال ۹۰٪ **عدم دسترسی به داده (RLS Policy)** است. احتمال ۱۰٪ باقی‌مانده مربوط به **تنظیمات کنسول گوگل (Vector Map)** است.

---

### ۲.۲. مشکل دوم: پنجره سفید سمج (The Stubborn InfoWindow)

**نقطه انهدام (Crash Point):**
کلیک روی POI -> باز شدن InfoWindow گوگل -> عدم اجرای UI اختصاصی (یا اجرای آن زیر پنجره گوگل).

**ردیابی جریان داده:**
1.  **Native Event:** کاربر کلیک می‌کند. موتور گوگل مپ ایونت را پردازش می‌کند.
2.  **Internal Logic:** گوگل مپ به صورت Synchronous تصمیم می‌گیرد InfoWindow را باز کند.
3.  **React Wrapper:** کتابخانه `@vis.gl/react-google-maps` ایونت را دریافت کرده و به `onPoiClick` ما پاس می‌دهد.
4.  **Late Handling:** ما در React تابع `event.stop()` را صدا می‌زنیم، اما کار از کار گذشته است. ایونت اصلی قبلاً توسط گوگل مصرف شده است.

**نتیجه تحلیل:** انتزاع (Abstraction) کتابخانه React باعث تأخیر در هندلینگ ایونت می‌شود. راه حل‌های React-based (`stopPropagation` در کامپوننت) در برابر لاجیک داخلی گوگل مپ ناتوان هستند.

---

### ۲.۳. مشکل فرعی: خطای Geolocation

**لاگ خطا:** `Geolocation has been disabled in this document by permissions policy.`
**تحلیل:** این اپلیکیشن احتمالاً در یک محیط Iframe (مانند StackBlitz، Replit یا IDX Preview) اجرا می‌شود که دسترسی لوکیشن را بسته است.
**تاثیر:** ویژگی "مکان من" کار نمی‌کند، اما نباید باعث خرابی کل نقشه شود.
**راه حل:** اضافه کردن هندلینگ خطا (Graceful Degradation) تا اپلیکیشن کرش نکند.

---

## ۳. برنامه عملیاتی درمان (Surgical Execution Plan)

ما باید در سه لایه (دیتابیس، نقشه Native، و رندرینگ) اصلاحات انجام دهیم.

### گام ۱: باز کردن شریان‌های حیاتی داده (Database Fix)
**هدف:** رفع مشکل RLS که باعث می‌شود آرایه خالی برگردد.
**اقدام:**
ایجاد و اجرای یک فایل SQL جدید (`supabase/code/fix_rls_policies.sql`) که:
1.  RLS را روی جداول `attractions` و `destinations` فعال کند (اگر نیست).
2.  یک Policy با نام `Enable read access for all users` ایجاد کند که اجازه `SELECT` به `public` بدهد.

### گام ۲: تله‌گذاری بومی (Native Event Trap)
**هدف:** رفع مشکل پنجره سفید با دور زدن React Wrapper.
**اقدام:**
در فایل `components/map/MainMap.tsx`:
1.  حذف پراپ `onPoiClick` از کامپوننت `<GoogleMap>`.
2.  استفاده از هوک `useEffect` برای دسترسی به اینستنس `map`.
3.  اضافه کردن یک Listener مستقیم روی ایونت `click`:
    ```typescript
    useEffect(() => {
      if (!map) return;
      const listener = map.addListener('click', (e: any) => {
        // اگر کلیک روی POI بود (دارای placeId)
        if (e.placeId) {
          e.stop(); // توقف آنی رفتار گوگل
          // فراخوانی لاجیک بیزنس ما به صورت دستی
          handlePoiClick({ ...e, detail: { placeId: e.placeId } }); 
        }
      });
      return () => google.maps.event.removeListener(listener);
    }, [map]);
    ```

### گام ۳: تضمین سلامت رندرینگ (Rendering Assurance)
**هدف:** جلوگیری از عدم نمایش مارکرها در صورت وجود داده.
**اقدام:**
1.  **Type Casting:** در `MainMap.tsx`، هنگام پاس دادن مختصات به `AdvancedMarker`، حتماً از `Number()` استفاده شود: `lat: Number(poi.lat)`.
2.  **Logging:** اضافه کردن `console.log` در ۳ مرحله:
    *   دریافت داده از سرویس (تعداد رکورد).
    *   تغییر `visibleCurated` در کامپوننت.
    *   داخل کامپوننت `CuratedMarker` (برای اطمینان از Mount شدن).

### گام ۴: مدیریت خطای محیطی
**اقدام:** در `MapController`، کد `navigator.geolocation` را داخل `try-catch` یا شرط بررسی `permissions` قرار می‌دهیم تا ارور قرمز در کنسول ندهد.

---

## ۴. دستورالعمل تست نهایی (Verification Checklist)

پس از اجرای کدها، موارد زیر باید چک شوند:

1.  [ ] **تست دیتابیس:** آیا کوئری مستقیم به Supabase دیتا برمی‌گرداند؟
2.  [ ] **تست نقشه:**
    *   آیا مارکرهای زرد در دبی/استانبول ظاهر شدند؟
    *   اگر نشدند، آیا لاگ `[Map] Rendering Marker` در کنسول هست؟ (اگر هست ولی دیده نمی‌شود -> مشکل Vector Map ID).
3.  [ ] **تست کلیک:**
    *   آیا کلیک روی رستوران‌های گوگل، پنجره سفید را باز نمی‌کند؟
    *   آیا کارت "در حال شناسایی..." ظاهر می‌شود؟

---
**پایان گزارش**
