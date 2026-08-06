-- =====================================================================================
-- RAVA Phase 2.1 — Seed curated places (≥20 Istanbul + ≥20 Dubai)
-- =====================================================================================
-- Place ID policy:
--   • Real Google Place IDs used for well-known landmarks (ChIJ…).
--   • Synthetic IDs use format: rava_syn_{city}_{slug}
--     These are NOT Google Place IDs. PlaceService falls back to curated
--     row data; Google Details is skipped / fails soft for synthetic IDs.
--     Refresh real IDs via scripts/fetch_places.mjs when API key is available.
-- =====================================================================================

-- Ensure destinations exist
INSERT INTO public.destinations (name, center, is_active, manifest_version)
VALUES
  ('Istanbul', ST_SetSRID(ST_MakePoint(28.9784, 41.0082), 4326), TRUE, 2),
  ('Dubai', ST_SetSRID(ST_MakePoint(55.2708, 25.2048), 4326), TRUE, 2)
ON CONFLICT (name) DO UPDATE
SET center = EXCLUDED.center, is_active = TRUE, manifest_version = EXCLUDED.manifest_version;

-- Ensure get_city_attractions returns rich static fields used by the client
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

DO $$
DECLARE
    istanbul_id UUID;
    dubai_id UUID;
BEGIN
    SELECT id INTO istanbul_id FROM destinations WHERE name = 'Istanbul' LIMIT 1;
    SELECT id INTO dubai_id FROM destinations WHERE name = 'Dubai' LIMIT 1;

    -- ═══════════════════════════════════════════════════════════════════════════
    -- ISTANBUL (≥20 diverse POIs)
    -- ═══════════════════════════════════════════════════════════════════════════
    INSERT INTO public.attractions (place_id, destination_id, name, location, static_data, assets, is_premium)
    VALUES
    -- attractions / historical
    ('ChIJy65uN8i0yhQRA_92G8n759I', istanbul_id, 'برج گالاتا',
     ST_SetSRID(ST_MakePoint(28.9744, 41.0256), 4326),
     '{"category":"attractions","name_local":"Galata Kulesi","description_fa":"نماد قرون وسطی با ویوی ۳۶۰ درجه از دو قاره.","address":"Bereketzade, 34421 Beyoğlu","rating":4.5,"price_range":2,"opening_hours":["09:00-20:00"],"tags":["viewpoint","historical","instagrammable"],"city":"Istanbul","country":"TR"}'::jsonb,
     '{"photos":["https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=800"]}'::jsonb, true),

    ('ChIJ66fD3060yhQRu66-cR2hVbI', istanbul_id, 'ایاصوفیه',
     ST_SetSRID(ST_MakePoint(28.9802, 41.0086), 4326),
     '{"category":"attractions","name_local":"Ayasofya","description_fa":"شاهکار بیزانس؛ مسجد و موزه‌ای که تاریخ را عوض کرد.","address":"Sultan Ahmet, 34122 Fatih","rating":4.7,"price_range":2,"opening_hours":["09:00-19:00"],"tags":["mosque","unesco","must_see"],"city":"Istanbul","country":"TR"}'::jsonb,
     '{"photos":["https://images.unsplash.com/photo-1541432901042-2d8bd64b4a9b?w=800"]}'::jsonb, true),

    ('rava_syn_istanbul_topkapi', istanbul_id, 'کاخ توپکاپی',
     ST_SetSRID(ST_MakePoint(28.9833, 41.0115), 4326),
     '{"category":"attractions","name_local":"Topkapı Sarayı","description_fa":"اقامتگاه سلاطین عثمانی و گنجینه جواهرات سلطنتی.","address":"Cankurtaran, 34122 Fatih","rating":4.6,"price_range":3,"opening_hours":["09:00-18:00"],"tags":["palace","museum","historical"],"city":"Istanbul","country":"TR"}'::jsonb,
     '{"photos":["https://images.unsplash.com/photo-1590074288099-247596547668?w=800"]}'::jsonb, true),

    ('rava_syn_istanbul_cistern', istanbul_id, 'آب‌انبار باسیلیکا',
     ST_SetSRID(ST_MakePoint(28.9779, 41.0084), 4326),
     '{"category":"attractions","name_local":"Yerebatan Sarnıcı","description_fa":"آب‌انبار زیرزمینی با ستون‌های مدوسا و اتمسفر جادویی.","address":"Alemdar, Yerebatan Cd. 1/3","rating":4.6,"price_range":2,"opening_hours":["09:00-18:30"],"tags":["underground","historical","instagrammable"],"city":"Istanbul","country":"TR"}'::jsonb,
     '{"photos":["https://images.unsplash.com/photo-1566418858546-248f298f2441?w=800"]}'::jsonb, true),

    ('rava_syn_istanbul_blue_mosque', istanbul_id, 'مسجد آبی',
     ST_SetSRID(ST_MakePoint(28.9768, 41.0054), 4326),
     '{"category":"attractions","name_local":"Sultanahmet Camii","description_fa":"مسجد سلطان احمد با شش مناره و کاشی‌های آبی معروف.","address":"Sultan Ahmet, Atmeydanı Cd. No:7","rating":4.8,"price_range":1,"opening_hours":["08:30-18:00"],"tags":["mosque","free","family"],"city":"Istanbul","country":"TR"}'::jsonb,
     '{"photos":["https://images.unsplash.com/photo-1541432901042-2d8bd64b4a9b?w=800&sat=-20"]}'::jsonb, true),

    ('rava_syn_istanbul_maiden_tower', istanbul_id, 'برج دختر',
     ST_SetSRID(ST_MakePoint(29.0041, 41.0211), 4326),
     '{"category":"attractions","name_local":"Kız Kulesi","description_fa":"برج افسانه‌ای وسط آب‌های بسفور.","address":"Salacak, Üsküdar","rating":4.4,"price_range":2,"opening_hours":["09:00-22:00"],"tags":["viewpoint","romantic","ferry"],"city":"Istanbul","country":"TR"}'::jsonb,
     '{"photos":["https://images.unsplash.com/photo-1523413555809-0fb87ce971f1?w=800"]}'::jsonb, true),

    -- shopping
    ('rava_syn_istanbul_grand_bazaar', istanbul_id, 'بازار بزرگ',
     ST_SetSRID(ST_MakePoint(28.9682, 41.0106), 4326),
     '{"category":"shopping","name_local":"Kapalıçarşı","description_fa":"یکی از بزرگ‌ترین بازارهای سرپوشیده جهان؛ چانه‌زنی واجب است.","address":"Beyazıt, 34126 Fatih","rating":4.3,"price_range":2,"opening_hours":["10:00-19:00"],"tags":["bazaar","souvenirs","budget"],"city":"Istanbul","country":"TR"}'::jsonb,
     '{"photos":["https://images.unsplash.com/photo-1545562088-75f80783a31c?w=800"]}'::jsonb, false),

    ('rava_syn_istanbul_spice_bazaar', istanbul_id, 'بازار ادویه',
     ST_SetSRID(ST_MakePoint(28.9706, 41.0165), 4326),
     '{"category":"shopping","name_local":"Mısır Çarşısı","description_fa":"عطر زعفران و لوکوم؛ بهترین هدیه خوراکی استانبول.","address":"Rüstem Paşa, Eminönü","rating":4.4,"price_range":2,"opening_hours":["08:00-19:30"],"tags":["spice","food_gifts","family"],"city":"Istanbul","country":"TR"}'::jsonb,
     '{"photos":["https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=800"]}'::jsonb, false),

    ('rava_syn_istanbul_istiklal', istanbul_id, 'خیابان استقلال',
     ST_SetSRID(ST_MakePoint(28.9781, 41.0345), 4326),
     '{"category":"shopping","name_local":"İstiklal Caddesi","description_fa":"قلب مدرن استانبول با تراموای قرمز و ویترین‌های بی‌پایان.","address":"İstiklal Cd., Beyoğlu","rating":4.5,"price_range":2,"opening_hours":["00:00-23:59"],"tags":["street","nightlife_adjacent","family"],"city":"Istanbul","country":"TR"}'::jsonb,
     '{"photos":["https://images.unsplash.com/photo-1527838832700-5059252407fa?w=800"]}'::jsonb, false),

    -- food
    ('rava_syn_istanbul_balik_ekmek', istanbul_id, 'ساندویچ ماهی امینونو',
     ST_SetSRID(ST_MakePoint(28.9740, 41.0172), 4326),
     '{"category":"food","name_local":"Eminönü Balık Ekmek","description_fa":"ساندویچ ماهی تازه روی قایق — ارزان، خوشمزه، اصیل.","address":"Eminönü İskele, Fatih","rating":4.2,"price_range":1,"opening_hours":["10:00-22:00"],"tags":["street_food","budget","local"],"city":"Istanbul","country":"TR"}'::jsonb,
     '{"photos":["https://images.unsplash.com/photo-1559847844-5315695dadae?w=800"]}'::jsonb, false),

    ('rava_syn_istanbul_ciya', istanbul_id, 'چیا کباب',
     ST_SetSRID(ST_MakePoint(29.0545, 40.9905), 4326),
     '{"category":"food","name_local":"Ciya Sofrası","description_fa":"غذاهای آناتولی با دستورهای فراموش‌شده؛ کادیکوی.","address":"Caferağa, Güneşli Bahçe Sok. 43, Kadıköy","rating":4.6,"price_range":2,"opening_hours":["11:00-22:00"],"tags":["anatolian","local_gem","mid"],"city":"Istanbul","country":"TR"}'::jsonb,
     '{"photos":["https://images.unsplash.com/photo-1544025162-d766902238da?w=800"]}'::jsonb, false),

    ('rava_syn_istanbul_karakoy_lokanta', istanbul_id, 'لوکانتا کاراکوی',
     ST_SetSRID(ST_MakePoint(28.9749, 41.0241), 4326),
     '{"category":"food","name_local":"Karaköy Lokantası","description_fa":"غذای ترکی مدرن با فضای صنعتی شیک نزدیک اسکله.","address":"Kemankeş Karamustafa Paşa, Kemankeş Cd. 37","rating":4.5,"price_range":3,"opening_hours":["12:00-23:00"],"tags":["modern_turkish","instagrammable"],"city":"Istanbul","country":"TR"}'::jsonb,
     '{"photos":["https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800"]}'::jsonb, false),

    -- cafes
    ('rava_syn_istanbul_mandabatmaz', istanbul_id, 'کافه ماندا باتماز',
     ST_SetSRID(ST_MakePoint(28.9789, 41.0332), 4326),
     '{"category":"cafes","name_local":"Mandabatmaz","description_fa":"ترک قهوه‌ای غلیظ با کف اسطوره‌ای در کوچه استقلال.","address":"Olivia Geçidi No:1/A, Beyoğlu","rating":4.5,"price_range":1,"opening_hours":["09:00-20:00"],"tags":["coffee","budget","local"],"city":"Istanbul","country":"TR"}'::jsonb,
     '{"photos":["https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800"]}'::jsonb, false),

    ('rava_syn_istanbul_petra_roja', istanbul_id, 'پترا روجا',
     ST_SetSRID(ST_MakePoint(28.9855, 41.0478), 4326),
     '{"category":"cafes","name_local":"Petra Roasting Co.","description_fa":"Specialty coffee محبوب جیل سوم در بشی‌ک‌تاش/نیشانتاشی.","address":"Teşvikiye, Valikonağı Cd.","rating":4.6,"price_range":2,"opening_hours":["08:00-22:00"],"tags":["specialty","laptop_friendly"],"city":"Istanbul","country":"TR"}'::jsonb,
     '{"photos":["https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800"]}'::jsonb, false),

    -- nightlife
    ('rava_syn_istanbul_babylon', istanbul_id, 'بابیلون',
     ST_SetSRID(ST_MakePoint(28.9735, 41.0368), 4326),
     '{"category":"nightlife","name_local":"Babylon","description_fa":"سالن کنسرت و کلاب افسانه‌ای استانبول در بومونتی.","address":"Bomonti, Şişli","rating":4.4,"price_range":3,"opening_hours":["20:00-03:00"],"tags":["live_music","club","night"],"city":"Istanbul","country":"TR"}'::jsonb,
     '{"photos":["https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800"]}'::jsonb, false),

    ('rava_syn_istanbul_mikla', istanbul_id, 'میکلا بار',
     ST_SetSRID(ST_MakePoint(28.9742, 41.0289), 4326),
     '{"category":"nightlife","name_local":"Mikla","description_fa":"روف‌تاپ لوکس با ویوی بی‌نظیر بسفور و کوکتل.","address":"The Marmara Pera, Meşrutiyet Cd.","rating":4.7,"price_range":4,"opening_hours":["18:00-01:00"],"tags":["rooftop","luxury","views"],"city":"Istanbul","country":"TR"}'::jsonb,
     '{"photos":["https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=800"]}'::jsonb, true),

    -- hidden gems
    ('rava_syn_istanbul_fener_balat', istanbul_id, 'فنر و بالات',
     ST_SetSRID(ST_MakePoint(28.9485, 41.0295), 4326),
     '{"category":"hidden_gems","name_local":"Fener-Balat","description_fa":"کوچه‌های رنگی، کافه‌های محلی و کلیساهای پنهان — بهشت عکاسی.","address":"Balat, Fatih","rating":4.6,"price_range":1,"opening_hours":["00:00-23:59"],"tags":["neighborhood","instagrammable","walk"],"city":"Istanbul","country":"TR"}'::jsonb,
     '{"photos":["https://images.unsplash.com/photo-1527838832700-5059252407fa?w=800&sat=-40"]}'::jsonb, true),

    ('rava_syn_istanbul_princes_islands', istanbul_id, 'جزایر شاهزادگان',
     ST_SetSRID(ST_MakePoint(29.0945, 40.8745), 4326),
     '{"category":"hidden_gems","name_local":"Adalar / Büyükada","description_fa":"جزیره بدون ماشین با درشکه و ویلاهای عثمانی — فرار از شلوغی.","address":"Büyükada, Adalar","rating":4.5,"price_range":2,"opening_hours":["00:00-23:59"],"tags":["island","family","day_trip"],"city":"Istanbul","country":"TR"}'::jsonb,
     '{"photos":["https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800"]}'::jsonb, false),

    -- budget
    ('rava_syn_istanbul_simit_sariyer', istanbul_id, 'سیمیت ساحل ساری‌یر',
     ST_SetSRID(ST_MakePoint(29.0572, 41.1665), 4326),
     '{"category":"budget","name_local":"Sarıyer Simit","description_fa":"سیمیت گرم کنار بسفور — ارزان‌ترین ویوی لوکس شهر.","address":"Sarıyer Sahil","rating":4.3,"price_range":1,"opening_hours":["07:00-21:00"],"tags":["street_food","budget","views"],"city":"Istanbul","country":"TR"}'::jsonb,
     '{"photos":["https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800"]}'::jsonb, false),

    -- family
    ('rava_syn_istanbul_miniaturk', istanbul_id, 'مینیاتورک',
     ST_SetSRID(ST_MakePoint(28.9835, 41.0695), 4326),
     '{"category":"family","name_local":"Miniatürk","description_fa":"ماکت‌های ترکیه در فضای باز — عالی برای خانواده و کودک.","address":"Örnektepe, İmrahor Cd., Beyoğlu","rating":4.4,"price_range":2,"opening_hours":["09:00-19:00"],"tags":["kids","outdoor","family"],"city":"Istanbul","country":"TR"}'::jsonb,
     '{"photos":["https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800"]}'::jsonb, false),

    ('rava_syn_istanbul_gulhane', istanbul_id, 'پارک گلخانه',
     ST_SetSRID(ST_MakePoint(28.9812, 41.0135), 4326),
     '{"category":"family","name_local":"Gülhane Parkı","description_fa":"پارک تاریخی کنار توپکاپی؛ پیک‌نیک و استراحت خانوادگی.","address":"Cankurtaran, Alemdar Cd.","rating":4.5,"price_range":1,"opening_hours":["06:00-22:00"],"tags":["park","free","family"],"city":"Istanbul","country":"TR"}'::jsonb,
     '{"photos":["https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800"]}'::jsonb, false),

    -- transport
    ('rava_syn_istanbul_vapour_eminonu', istanbul_id, 'اسکله امینونو',
     ST_SetSRID(ST_MakePoint(28.9755, 41.0178), 4326),
     '{"category":"transport","name_local":"Eminönü İskelesi","description_fa":"هاب کشتی‌های شهری (Vapur) به اسکودار، کادیکوی و جزایر.","address":"Eminönü, Fatih","rating":4.4,"price_range":1,"opening_hours":["06:00-23:30"],"tags":["ferry","hub","istanbulkart"],"city":"Istanbul","country":"TR"}'::jsonb,
     '{"photos":["https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800"]}'::jsonb, false),

    -- essentials
    ('rava_syn_istanbul_taksim_pharmacy', istanbul_id, 'داروخانه تکسیم',
     ST_SetSRID(ST_MakePoint(28.9850, 41.0370), 4326),
     '{"category":"essentials","name_local":"Taksim Eczanesi","description_fa":"داروخانه ۲۴ ساعته نزدیک میدان تکسیم برای موارد اضطراری.","address":"Taksim Meydanı, Beyoğlu","rating":4.2,"price_range":2,"opening_hours":["00:00-23:59"],"tags":["pharmacy","24h","emergency"],"city":"Istanbul","country":"TR"}'::jsonb,
     '{"photos":["https://images.unsplash.com/photo-1585435557343-3b092031a831?w=800"]}'::jsonb, false),

    ('rava_syn_istanbul_istanbulkart', istanbul_id, 'مرکز استانبول‌کارت',
     ST_SetSRID(ST_MakePoint(28.9857, 41.0369), 4326),
     '{"category":"essentials","name_local":"İstanbulkart Merkezi","description_fa":"خرید و شارژ کارت حمل‌ونقل عمومی — اولین کار هر مسافر.","address":"Taksim Meydanı metro","rating":4.0,"price_range":1,"opening_hours":["07:00-22:00"],"tags":["transit_card","essential","budget"],"city":"Istanbul","country":"TR"}'::jsonb,
     '{"photos":["https://images.unsplash.com/photo-1544620341-1adc1b027bdb?w=800"]}'::jsonb, false)

    ON CONFLICT (place_id) DO UPDATE SET
      name = EXCLUDED.name,
      destination_id = EXCLUDED.destination_id,
      location = EXCLUDED.location,
      static_data = EXCLUDED.static_data,
      assets = EXCLUDED.assets,
      is_premium = EXCLUDED.is_premium,
      updated_at = NOW();

    -- ═══════════════════════════════════════════════════════════════════════════
    -- DUBAI (≥20 diverse POIs)
    -- ═══════════════════════════════════════════════════════════════════════════
    INSERT INTO public.attractions (place_id, destination_id, name, location, static_data, assets, is_premium)
    VALUES
    -- attractions
    ('ChIJ281v929vXz4R3qg9p45E_8Q', dubai_id, 'برج خلیفه',
     ST_SetSRID(ST_MakePoint(55.2744, 25.1972), 4326),
     '{"category":"attractions","name_local":"Burj Khalifa","description_fa":"بلندترین آسمان‌خراش جهان؛ ویوی At The Top فراموش‌نشدنی است.","address":"1 Sheikh Mohammed bin Rashid Blvd","rating":4.7,"price_range":4,"opening_hours":["08:30-23:00"],"tags":["skyscraper","must_see","views"],"city":"Dubai","country":"AE"}'::jsonb,
     '{"photos":["https://images.unsplash.com/photo-1582672097782-a042cd6bdeaf?w=800"]}'::jsonb, true),

    ('rava_syn_dubai_museum_future', dubai_id, 'موزه آینده',
     ST_SetSRID(ST_MakePoint(55.2819, 25.2191), 4326),
     '{"category":"attractions","name_local":"Museum of the Future","description_fa":"ساختمان حلقه‌ای با خط عربی؛ دریچه‌ای به ۲۰۷۱.","address":"Sheikh Zayed Rd, Trade Centre 2","rating":4.6,"price_range":3,"opening_hours":["10:00-19:00"],"tags":["museum","futuristic","instagrammable"],"city":"Dubai","country":"AE"}'::jsonb,
     '{"photos":["https://images.unsplash.com/photo-1647413944770-079730f6a27e?w=800"]}'::jsonb, true),

    ('rava_syn_dubai_frame', dubai_id, 'قاب دبی',
     ST_SetSRID(ST_MakePoint(55.3000, 25.2355), 4326),
     '{"category":"attractions","name_local":"Dubai Frame","description_fa":"قاب غول‌پیکر بین دبی قدیم و جدید؛ ویوی پانوراما.","address":"Zabeel Park","rating":4.4,"price_range":2,"opening_hours":["09:00-21:00"],"tags":["viewpoint","family","photo"],"city":"Dubai","country":"AE"}'::jsonb,
     '{"photos":["https://images.unsplash.com/photo-1518684079-3c830dcef090?w=800"]}'::jsonb, false),

    ('rava_syn_dubai_palm', dubai_id, 'نخل جمیرا',
     ST_SetSRID(ST_MakePoint(55.1389, 25.1124), 4326),
     '{"category":"attractions","name_local":"Palm Jumeirah","description_fa":"جزیره مصنوعی نخل‌شکل؛ اوج مهندسی و لوکس‌گرایی.","address":"Palm Jumeirah","rating":4.6,"price_range":3,"opening_hours":["00:00-23:59"],"tags":["island","luxury","monorail"],"city":"Dubai","country":"AE"}'::jsonb,
     '{"photos":["https://images.unsplash.com/photo-1544945582-1b64731df400?w=800"]}'::jsonb, true),

    ('rava_syn_dubai_burj_arab', dubai_id, 'برج العرب',
     ST_SetSRID(ST_MakePoint(55.1853, 25.1412), 4326),
     '{"category":"attractions","name_local":"Burj Al Arab","description_fa":"هتل بادبانی افسانه‌ای؛ نماد لوکس دبی (ویو از ساحل).","address":"Jumeirah St, Umm Suqeim 3","rating":4.8,"price_range":4,"opening_hours":["00:00-23:59"],"tags":["icon","luxury","photo"],"city":"Dubai","country":"AE"}'::jsonb,
     '{"photos":["https://images.unsplash.com/photo-1518684079-3c830dcef090?w=800&sat=10"]}'::jsonb, true),

    -- shopping
    ('ChIJ4174mH5vxz4R8Z0iVq12H-8', dubai_id, 'دبی مال',
     ST_SetSRID(ST_MakePoint(55.2785, 25.1985), 4326),
     '{"category":"shopping","name_local":"The Dubai Mall","description_fa":"یکی از بزرگ‌ترین مال‌های جهان با آکواریوم و فواره.","address":"Financial Center Rd, Downtown","rating":4.7,"price_range":3,"opening_hours":["10:00-00:00"],"tags":["mall","family","aquarium"],"city":"Dubai","country":"AE"}'::jsonb,
     '{"photos":["https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800"]}'::jsonb, false),

    ('rava_syn_dubai_souk_madinat', dubai_id, 'سوق مدینه جمیرا',
     ST_SetSRID(ST_MakePoint(55.1858, 25.1418), 4326),
     '{"category":"shopping","name_local":"Souk Madinat Jumeirah","description_fa":"بازار سنتی بازسازی‌شده کنار کانال و برج العرب.","address":"Al Sufouh Rd, Umm Suqeim","rating":4.5,"price_range":3,"opening_hours":["10:00-23:00"],"tags":["souk","souvenirs","romantic"],"city":"Dubai","country":"AE"}'::jsonb,
     '{"photos":["https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800"]}'::jsonb, false),

    ('rava_syn_dubai_gold_souk', dubai_id, 'بازار طلا',
     ST_SetSRID(ST_MakePoint(55.3055, 25.2705), 4326),
     '{"category":"shopping","name_local":"Gold Souk","description_fa":"درخشش طلا در دیره؛ چانه‌زنی و عکس‌های خیره‌کننده.","address":"Al Fahidi St, Deira","rating":4.3,"price_range":2,"opening_hours":["10:00-22:00"],"tags":["gold","old_dubai","budget_friendly_browse"],"city":"Dubai","country":"AE"}'::jsonb,
     '{"photos":["https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?w=800"]}'::jsonb, false),

    -- food
    ('rava_syn_dubai_al_fanar', dubai_id, 'الفنار',
     ST_SetSRID(ST_MakePoint(55.3345, 25.2285), 4326),
     '{"category":"food","name_local":"Al Fanar Restaurant","description_fa":"غذای اماراتی اصیل با فضای روستایی و لوکومادا.","address":"Festival City / multiple","rating":4.5,"price_range":2,"opening_hours":["12:00-23:00"],"tags":["emirati","local","family"],"city":"Dubai","country":"AE"}'::jsonb,
     '{"photos":["https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800"]}'::jsonb, false),

    ('rava_syn_dubai_ravi', dubai_id, 'راوی ساتوا',
     ST_SetSRID(ST_MakePoint(55.2615, 25.2198), 4326),
     '{"category":"food","name_local":"Ravi Restaurant","description_fa":"غذای پاکستانی ارزان و افسانه‌ای در ساتوا — صف طولانی ارزشش را دارد.","address":"Satwa Roundabout","rating":4.4,"price_range":1,"opening_hours":["05:00-03:00"],"tags":["budget","pakistani","local_legend"],"city":"Dubai","country":"AE"}'::jsonb,
     '{"photos":["https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800"]}'::jsonb, false),

    ('rava_syn_dubai_pierchic', dubai_id, 'پیرچیک',
     ST_SetSRID(ST_MakePoint(55.1850, 25.1405), 4326),
     '{"category":"food","name_local":"Pierchic","description_fa":"غذای دریایی لوکس روی اسکله با ویوی برج العرب.","address":"Al Qasr, Madinat Jumeirah","rating":4.7,"price_range":4,"opening_hours":["12:30-15:00","18:30-23:00"],"tags":["seafood","luxury","romantic"],"city":"Dubai","country":"AE"}'::jsonb,
     '{"photos":["https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800"]}'::jsonb, true),

    -- cafes
    ('rava_syn_dubai_arabica', dubai_id, '٪عربیکا',
     ST_SetSRID(ST_MakePoint(55.2740, 25.1978), 4326),
     '{"category":"cafes","name_local":"% Arabica","description_fa":"Specialty coffee با ویوی برج خلیفه — صف اینستاگرامی.","address":"Souk Al Bahar, Downtown","rating":4.5,"price_range":2,"opening_hours":["08:00-00:00"],"tags":["coffee","views","instagrammable"],"city":"Dubai","country":"AE"}'::jsonb,
     '{"photos":["https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800"]}'::jsonb, false),

    ('rava_syn_dubai_common_grounds', dubai_id, 'کامن گراندز',
     ST_SetSRID(ST_MakePoint(55.2702, 25.1865), 4326),
     '{"category":"cafes","name_local":"Common Grounds","description_fa":"کافه بزرگ با فضای کار و برانچ محبوب اکپات‌ها.","address":"City Walk / JLT locations","rating":4.4,"price_range":2,"opening_hours":["07:00-00:00"],"tags":["brunch","laptop","mid"],"city":"Dubai","country":"AE"}'::jsonb,
     '{"photos":["https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800"]}'::jsonb, false),

    -- nightlife
    ('rava_syn_dubai_white_dubai', dubai_id, 'وایت دبی',
     ST_SetSRID(ST_MakePoint(55.1475, 25.0785), 4326),
     '{"category":"nightlife","name_local":"WHITE Dubai","description_fa":"کلاب روف‌تاپ روی میراژ؛ موسیقی و نورپردازی بین‌المللی.","address":"Meydan Racecourse / seasonal venues","rating":4.3,"price_range":4,"opening_hours":["22:00-04:00"],"tags":["club","luxury","night"],"city":"Dubai","country":"AE"}'::jsonb,
     '{"photos":["https://images.unsplash.com/photo-1566417713940-ae4f9f8d2a8a?w=800"]}'::jsonb, false),

    ('rava_syn_dubai_base', dubai_id, 'بیس دبی',
     ST_SetSRID(ST_MakePoint(55.2748, 25.1970), 4326),
     '{"category":"nightlife","name_local":"BASE Dubai","description_fa":"کلاب زیر برج خلیفه با DJهای جهانی.","address":"d3 / Downtown venues","rating":4.4,"price_range":4,"opening_hours":["22:00-04:00"],"tags":["club","edm","luxury"],"city":"Dubai","country":"AE"}'::jsonb,
     '{"photos":["https://images.unsplash.com/photo-1571266028241-d34e78f9c9e4?w=800"]}'::jsonb, false),

    -- hidden gems
    ('rava_syn_dubai_al_fahidi', dubai_id, 'محله الفهیدی',
     ST_SetSRID(ST_MakePoint(55.3040, 25.2635), 4326),
     '{"category":"hidden_gems","name_local":"Al Fahidi Historical Neighbourhood","description_fa":"دبی قدیم با بادگیرها، گالری‌ها و چای عربی — فرار از مال‌ها.","address":"Al Fahidi, Bur Dubai","rating":4.6,"price_range":1,"opening_hours":["08:00-20:00"],"tags":["heritage","walk","culture"],"city":"Dubai","country":"AE"}'::jsonb,
     '{"photos":["https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&sat=-50"]}'::jsonb, true),

    ('rava_syn_dubai_hatta', dubai_id, 'حتا',
     ST_SetSRID(ST_MakePoint(56.1205, 24.7965), 4326),
     '{"category":"hidden_gems","name_local":"Hatta","description_fa":"دهکده کوهستانی با سد و کایاک — روز کامل خارج از شهر.","address":"Hatta, Dubai Emirate","rating":4.5,"price_range":2,"opening_hours":["00:00-23:59"],"tags":["day_trip","nature","family"],"city":"Dubai","country":"AE"}'::jsonb,
     '{"photos":["https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800"]}'::jsonb, false),

    -- budget
    ('rava_syn_dubai_abba_karak', dubai_id, 'چای کرک عبا',
     ST_SetSRID(ST_MakePoint(55.2735, 25.2530), 4326),
     '{"category":"budget","name_local":"Abra + Karak","description_fa":"عبور با قایق آبرا از دیره به بر دبی + چای کرک خیابانی.","address":"Deira Old Souk Abra Station","rating":4.5,"price_range":1,"opening_hours":["06:00-00:00"],"tags":["budget","local","must_do"],"city":"Dubai","country":"AE"}'::jsonb,
     '{"photos":["https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800"]}'::jsonb, false),

    -- family
    ('rava_syn_dubai_miracle_garden', dubai_id, 'باغ معجزه',
     ST_SetSRID(ST_MakePoint(55.2445, 25.0595), 4326),
     '{"category":"family","name_local":"Dubai Miracle Garden","description_fa":"میلیون‌ها گل به شکل حیوانات و بناها — فصلی ولی شگفت‌انگیز.","address":"Al Barsha South","rating":4.6,"price_range":2,"opening_hours":["09:00-21:00"],"tags":["garden","kids","seasonal"],"city":"Dubai","country":"AE"}'::jsonb,
     '{"photos":["https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=800"]}'::jsonb, false),

    ('rava_syn_dubai_aquarium', dubai_id, 'آکواریوم دبی مال',
     ST_SetSRID(ST_MakePoint(55.2795, 25.1980), 4326),
     '{"category":"family","name_local":"Dubai Aquarium","description_fa":"تونل زیر آب با کوسه و سفره‌ماهی — مناسب خانواده.","address":"The Dubai Mall","rating":4.5,"price_range":3,"opening_hours":["10:00-00:00"],"tags":["aquarium","kids","indoor"],"city":"Dubai","country":"AE"}'::jsonb,
     '{"photos":["https://images.unsplash.com/photo-1544552866-d3ed42536cfd?w=800"]}'::jsonb, false),

    -- transport
    ('rava_syn_dubai_metro_burjuman', dubai_id, 'مترو برجمان',
     ST_SetSRID(ST_MakePoint(55.3035, 25.2535), 4326),
     '{"category":"transport","name_local":"BurJuman Metro","description_fa":"ایستگاه تقاطع خط قرمز و سبز — هاب حمل‌ونقل مرکزی.","address":"Bur Dubai","rating":4.3,"price_range":1,"opening_hours":["05:00-00:00"],"tags":["metro","hub","nol_card"],"city":"Dubai","country":"AE"}'::jsonb,
     '{"photos":["https://images.unsplash.com/photo-1544620341-1adc1b027bdb?w=800"]}'::jsonb, false),

    -- essentials
    ('rava_syn_dubai_nol_card', dubai_id, 'مرکز کارت نول',
     ST_SetSRID(ST_MakePoint(55.2970, 25.2538), 4326),
     '{"category":"essentials","name_local":"Nol Card Center","description_fa":"خرید و شارژ کارت مترو/اتوبوس — ضروری برای هر مسافر.","address":"Union / major metro stations","rating":4.1,"price_range":1,"opening_hours":["06:00-22:00"],"tags":["transit_card","essential"],"city":"Dubai","country":"AE"}'::jsonb,
     '{"photos":["https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=800"]}'::jsonb, false),

    ('rava_syn_dubai_rashid_hospital', dubai_id, 'بیمارستان راشد',
     ST_SetSRID(ST_MakePoint(55.3205, 25.2475), 4326),
     '{"category":"essentials","name_local":"Rashid Hospital","description_fa":"بیمارستان اصلی دولتی با اورژانس ۲۴ ساعته.","address":"Oud Metha Rd","rating":4.0,"price_range":2,"opening_hours":["00:00-23:59"],"tags":["hospital","emergency","24h"],"city":"Dubai","country":"AE"}'::jsonb,
     '{"photos":["https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800"]}'::jsonb, false)

    ON CONFLICT (place_id) DO UPDATE SET
      name = EXCLUDED.name,
      destination_id = EXCLUDED.destination_id,
      location = EXCLUDED.location,
      static_data = EXCLUDED.static_data,
      assets = EXCLUDED.assets,
      is_premium = EXCLUDED.is_premium,
      updated_at = NOW();

    RAISE NOTICE 'RAVA Phase 2.1 seed: Istanbul + Dubai curated places upserted (≥20 each).';
END $$;
