import { supabase } from './supabaseClient';
import { POI } from '../types';
import { assistantCache, CACHE_TTL } from './cache/assistantCache';

export const discoveryService = {
  /**
   * جستجوی مکان‌های نزدیک کاربر بر اساس مختصات و مود (مکان‌های عمومی کش شده)
   */
  async searchNearby(lat: number, lng: number, radius: number = 5000, mood?: string): Promise<POI[]> {
    const cacheKey = `${lat.toFixed(3)}_${lng.toFixed(3)}_${radius}_${mood || 'any'}`;
    const cached = await assistantCache.get<POI[]>('recent_searches', cacheKey);
    if (cached?.length) return cached;

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

    const results: POI[] = (data || []).map((item: any) => ({
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

    await assistantCache.set('recent_searches', cacheKey, results, CACHE_TTL.recentSearches);
    return results;
  },

  /**
   * دریافت مکان‌های منتخب راوا (Curated POIs) بر اساس نام شهر
   */
  async getCuratedPlaces(cityName: string): Promise<POI[]> {
    console.log(`[DiscoveryService] Fetching curated places for: ${cityName}`);

    return assistantCache.getOrFetch('curated_pois', cityName, CACHE_TTL.curatedPois, async () => {
      try {
        const { data, error } = await supabase.rpc('get_city_attractions', {
          city_name: cityName
        });

        if (error) {
          console.error('[DiscoveryService] Failed to fetch attractions via RPC:', error);
          throw error;
        }

        const results: POI[] = (data || []).map((item: any) => ({
          id: item.place_id,
          name: item.name,
          lat: item.lat,
          lng: item.lng,
          category: item.category || 'historical',
          description: item.description || '',
          address: item.address || '',
          image: item.image || '',
          rating: item.rating ?? undefined,
          priceLevel: item.price_range ?? undefined,
          is_curated: true,
          moodTags: [
            item.category || 'historical',
            ...(item.is_premium ? ['Premium'] : []),
            ...(item.tags || []),
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
    });
  }
};
