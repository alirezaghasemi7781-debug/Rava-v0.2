
import { supabase } from './supabaseClient';
import { POI } from '../types';

export const discoveryService = {
  /**
   * جستجوی مکان‌های نزدیک کاربر بر اساس مختصات و مود (مکان‌های عمومی کش شده)
   */
  async searchNearby(lat: number, lng: number, radius: number = 5000, mood?: string): Promise<POI[]> {
    const { data, error } = await supabase.rpc('search_nearby_places', {
      px_lat: lat,
      px_lng: lng,
      px_radius: radius,
      px_mood: mood || null
    });

    if (error) {
      console.error('[DiscoveryService] searchNearby RPC failed:', error);
      throw error; 
    }

    return (data || []).map((item: any) => ({
      id: item.id,
      name: item.name,
      lat: item.lat, 
      lng: item.lng, 
      category: item.category,
      description: item.vibe_summary,
      image: item.image_url,
      priceLevel: item.price_level,
      moodTags: [item.category]
    }));
  },

  /**
   * دریافت مکان‌های منتخب رهنما (Curated POIs) بر اساس نام شهر
   */
  async getCuratedPlaces(cityName: string): Promise<POI[]> {
    console.log(`[DiscoveryService] Fetching curated places for: ${cityName}`);

    try {
      // استفاده از RPC اختصاصی برای دریافت دیتای تمیز و تبدیل شده سمت سرور
      // این روش مشکل فرمت باینری PostGIS (WKB) را به طور کامل دور می‌زند
      const { data, error } = await supabase.rpc('get_city_attractions', {
        city_name: cityName
      });

      if (error) {
        console.error('[DiscoveryService] Failed to fetch attractions via RPC:', error);
        throw error;
      }

      // دیتای خروجی از RPC دقیقاً با فرمت POI سازگار است (Float lat/lng)
      const results: POI[] = (data || []).map((item: any) => ({
        id: item.place_id,
        name: item.name,
        lat: item.lat, // تضمین شده Float
        lng: item.lng, // تضمین شده Float
        category: item.category || 'historical',
        description: item.description || '',
        address: item.address || '',
        image: item.image || '',
        is_curated: true,
        moodTags: [
          item.category || 'historical',
          ...(item.is_premium ? ['Premium'] : [])
        ]
      }));

      console.log(
        `[DiscoveryService] Successfully loaded ${results.length} curated places for ${cityName}`
      );
      return results;
      
    } catch (e) {
      console.error("[DiscoveryService] Critical error in getCuratedPlaces:", e);
      throw e;
    }
  }
};
