
import { supabase } from './supabaseClient';
import { POI } from '../types';
import { GeoPoint } from '../utils/geoPoint';

export const discoveryService = {
  /**
   * جستجوی مکان‌های نزدیک کاربر بر اساس مختصات و مود (مکان‌های عمومی کش شده)
   */
  async searchNearby(lat: number, lng: number, radius: number = 5000, mood?: string): Promise<POI[]> {
    // PostGIS: ST_MakePoint(longitude, latitude) — ترتیب صحیح است
    // px_lat = عرض جغرافیایی (Latitude) | px_lng = طول جغرافیایی (Longitude)
    // تابع SQL در دیتابیس از ST_MakePoint(px_lng, px_lat) استفاده می‌کند که استاندارد PostGIS است
    
    const { data, error } = await supabase.rpc('search_nearby_places', {
      px_lat: lat,
      px_lng: lng,
      px_radius: radius,
      px_mood: mood || null
    });

    if (error) {
      console.error('[DiscoveryService] searchNearby RPC failed:', error);
      throw error; // caller باید بداند که خطا بوده
    }

    return (data || []).map((item: any) => ({
      id: item.id,
      name: item.name,
      lat: item.lat, // خروجی RPC به صورت ST_Y (Lat) است، پس مستقیم استفاده می‌کنیم
      lng: item.lng, // خروجی RPC به صورت ST_X (Lng) است
      category: item.category,
      description: item.vibe_summary,
      image: item.image_url,
      priceLevel: item.price_level,
      moodTags: [item.category]
    }));
  },

  /**
   * دریافت مکان‌های منتخب رهنما (Curated POIs) بر اساس نام شهر
   * استراتژی اصلاح شده: استفاده از روش Two-Step Query برای اطمینان از صحت فیلتر
   */
  async getCuratedPlaces(cityName: string): Promise<POI[]> {
    console.log(`[DiscoveryService] Fetching curated places for: ${cityName}`);

    try {
      // مرحله ۱: دریافت ID شهر از destinations
      // دلیل استفاده از این روش به جای join:
      // در Supabase PostgREST، .eq('related_table.column', value) روی جداول
      // join شده به درستی فیلتر نمی‌کند. روش دو مرحله‌ای ۱۰۰٪ قابل اطمینان است.
      const { data: dest, error: destError } = await supabase
        .from('destinations')
        .select('id')
        .eq('name', cityName)
        .single();

      if (destError || !dest) {
        console.error(
          `[DiscoveryService] City "${cityName}" not found in destinations table`,
          destError
        );
        throw new Error(`City not found: ${cityName}`);
      }

      // مرحله ۲: گرفتن attractions آن شهر با destination_id
      const { data, error } = await supabase
        .from('attractions')
        .select('place_id, name, location, static_data, assets, is_premium')
        .eq('destination_id', dest.id);

      if (error) {
        console.error('[DiscoveryService] Failed to fetch attractions:', error);
        throw error; // به لایه بالاتر (store) propagate کن
      }

      const results: POI[] = [];

      for (const item of data || []) {
        const geo = GeoPoint.fromPostGIS(item.location);

        if (!geo) {
          // لاگ برای دیباگ — این مکان بی‌صدا حذف می‌شود
          console.warn(
            `[DiscoveryService] Could not parse location for attraction: "${item.name}"`,
            { raw_location: item.location }
          );
          continue; // این مکان را رد کن، بقیه را ادامه بده
        }

        results.push({
          id: item.place_id,
          name: item.name,
          lat: geo.lat,
          lng: geo.lng,
          category: item.static_data?.category || 'historical',
          description: item.static_data?.description_fa || '',
          address: item.static_data?.address || '',
          image: item.assets?.photos?.[0] || '',
          is_curated: true,
          // ساختار یکپارچه moodTags (هماهنگ با searchNearby)
          moodTags: [
            item.static_data?.category || 'historical',
            ...(item.is_premium ? ['Premium'] : [])
          ]
        });
      }

      console.log(
        `[DiscoveryService] Successfully loaded ${results.length} curated places for ${cityName}`
      );
      return results;
      
    } catch (e) {
      // فقط لاگ کن و Rethrow کن تا هوک‌ها بتوانند وضعیت خطا را نمایش دهند
      console.error("[DiscoveryService] Critical error in getCuratedPlaces:", e);
      throw e;
    }
  }
};
