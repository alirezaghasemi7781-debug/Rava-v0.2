
import { GoogleGenAI } from "@google/genai";
import { POI, Narrative } from "../types";
import { dbService } from "./dbService";
import { supabase } from "./supabaseClient";
import { GeoPoint } from "../utils/geoPoint";
import { APP_CONFIG } from "../config";

const CACHE_EXPIRY = 30 * 24 * 60 * 60 * 1000;

declare const google: any;

class PlaceServiceProvider {
  private isInitialized: boolean = false;

  init() {
    this.isInitialized = true;
  }

  async waitForGoogle(): Promise<boolean> {
     if (typeof google !== 'undefined' && google.maps && google.maps.places) return true;
     
     return new Promise(resolve => {
        let attempts = 0;
        const interval = setInterval(() => {
           attempts++;
           if (typeof google !== 'undefined' && google.maps && google.maps.places) {
              clearInterval(interval);
              resolve(true);
           }
           if (attempts > 30) {
              clearInterval(interval);
              resolve(false);
           }
        }, 100);
     });
  }

  /**
   * استراتژی هیبریدی و کشینگ هوشمند فاز ۴:
   * ابتدا از IndexedDB می‌خواند، سپس در پس‌زمینه از Supabase بروزرسانی می‌کند.
   */
  async fetchHybridDetails(placeId: string): Promise<Partial<POI>> {
    const localCacheKey = `curated_${placeId}`;
    
    // ۱. بررسی کش محلی (IndexedDB)
    const cachedData = await dbService.get(localCacheKey);
    
    // اگر آنلاین هستیم، در پس‌زمینه دیتا را بروزرسانی کن (Revalidate)
    if (navigator.onLine) {
      this.refreshCuratedCache(placeId, localCacheKey).then();
    }

    if (cachedData) {
      return cachedData;
    }

    // ۲. اگر در کش نبود، مستقیم از سرور بگیر
    try {
      const { data: curated, error } = await supabase
        .from('attractions')
        .select('*, narratives(*)')
        .eq('place_id', placeId)
        .single();

      if (curated && !error) {
        const transformedPOI = this.transformCuratedToPOI(curated);
        await dbService.set(localCacheKey, transformedPOI);
        return transformedPOI;
      }
    } catch (e) {
      console.warn("Server Fetch Failed, trying Google fallback:", e);
    }

    // ۳. Fallback نهایی به گوگل
    return this.fetchEssentials(placeId);
  }

  private async refreshCuratedCache(placeId: string, key: string) {
    try {
      const { data: curated, error } = await supabase
        .from('attractions')
        .select('*, narratives(*)')
        .eq('place_id', placeId)
        .single();
      
      if (curated && !error) {
        const transformedPOI = this.transformCuratedToPOI(curated);
        await dbService.set(key, transformedPOI);
      }
    } catch (e) {}
  }

  private transformCuratedToPOI(curated: any): Partial<POI> {
    const geo = GeoPoint.fromPostGIS(curated.location);
    
    return {
      id: curated.place_id,
      name: curated.name,
      lat: geo?.lat || 0,
      lng: geo?.lng || 0,
      category: curated.static_data?.category || 'historical',
      description: curated.static_data?.description_fa || '',
      image: curated.assets?.photos?.[0] || curated.assets?.icon_3d,
      is_curated: true,
      narrative: curated.narratives?.[0] as Narrative
    };
  }

  async fetchNearbyFallback(lat: number, lng: number, mood?: string): Promise<POI[]> {
    const isReady = await this.waitForGoogle();
    if (!isReady) return [];

    try {
      const { Place, SearchNearbyRankPreference } = await google.maps.importLibrary("places");
      const center = new google.maps.LatLng(lat, lng);
      
      const request = {
        fields: ['displayName', 'location', 'formattedAddress', 'types', 'photos'],
        locationRestriction: { center, radius: 2000 },
        includedPrimaryTypes: this.mapMoodToGoogleTypes(mood),
        maxResultCount: 8,
        rankPreference: SearchNearbyRankPreference.POPULARITY,
      };

      const { places } = await Place.searchNearby(request);
      
      return (places || []).map((p: any) => ({
        id: p.id,
        name: p.displayName || "مکان ناشناخته",
        lat: p.location?.lat() || 0,
        lng: p.location?.lng() || 0,
        category: mood || p.types?.[0] || 'point_of_interest',
        description: p.formattedAddress,
        image: p.photos?.[0]?.getURI({ maxWidth: 800 }),
        isGooglePOI: true
      }));
    } catch (e) {
      console.error("Fallback Search Error:", e);
      return [];
    }
  }

  private mapMoodToGoogleTypes(mood?: string): string[] {
    switch (mood) {
      case 'luxury': return ['fine_dining', 'restaurant', 'hotel'];
      case 'budget': return ['park', 'museum', 'tourist_attraction'];
      case 'instagrammable': return ['observation_deck', 'museum', 'point_of_interest'];
      case 'hidden_gem': return ['art_gallery', 'cafe'];
      default: return ['tourist_attraction', 'point_of_interest'];
    }
  }

  async fetchEssentials(placeId: string): Promise<Partial<POI>> {
    const cacheKey = `ess_v2_${placeId}`;
    const cached = await dbService.get(cacheKey);
    if (cached && (Date.now() - cached.updatedAt < CACHE_EXPIRY)) return cached.data;

    const isReady = await this.waitForGoogle();
    if (!isReady) return { name: "خطا در اتصال" };

    try {
      const place = new google.maps.places.Place({ id: placeId, requestedLanguage: 'fa' });
      await place.fetchFields({ fields: ['displayName', 'location', 'types', 'formattedAddress'] });

      const data = {
        id: placeId,
        name: place.displayName,
        lat: place.location?.lat() || 0,
        lng: place.location?.lng() || 0,
        category: place.types?.[0],
        description: place.formattedAddress,
      };

      await dbService.set(cacheKey, { data, updatedAt: Date.now() });
      return data;
    } catch (error) { return {}; }
  }

  async fetchFullDetails(placeId: string): Promise<Partial<POI>> {
    const cacheKey = `full_v2_${placeId}`;
    const cached = await dbService.get(cacheKey);
    if (cached && (Date.now() - cached.updatedAt < CACHE_EXPIRY)) return cached.data;

    const isReady = await this.waitForGoogle();
    if (!isReady) return {};

    try {
      const place = new google.maps.places.Place({ id: placeId, requestedLanguage: 'fa' });
      await place.fetchFields({ fields: ['rating', 'userRatingCount', 'priceLevel', 'regularOpeningHours', 'photos', 'reviews', 'editorialSummary'] });

      const fullData = {
        rating: place.rating,
        userRatingCount: place.userRatingCount,
        priceLevel: place.priceLevel,
        openingHours: place.regularOpeningHours?.weekdayDescriptions,
        reviews: place.reviews,
        editorialSummary: place.editorialSummary?.text || place.editorialSummary,
        image: place.photos?.[0]?.getURI({ maxWidth: 1200 })
      };

      await dbService.set(cacheKey, { data: fullData, updatedAt: Date.now() });
      return fullData;
    } catch (error) { return {}; }
  }

  async getAIVibeCheck(reviews: any[]): Promise<string> {
    if (!reviews || reviews.length === 0) return "هنوز نظری ثبت نشده، بیا اولین ردپا رو تو بذار!";
    
    // اصلاح: استفاده از APP_CONFIG به جای process.env
    const ai = new GoogleGenAI({ apiKey: APP_CONFIG.GOOGLE.GEMINI_API_KEY });
    
    const reviewText = reviews.slice(0, 5).map(r => r.text || "").join("\n");
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-1.5-flash', // آپدیت مدل به نسخه پایدارتر
        contents: `تحلیلگر Vibe مکان (رهنما): این نظرات را بخوان و اتمسفر مکان را در یک پاراگراف کوتاه (حداکثر ۲ جمله) به زبان فارسی صمیمی خلاصه کن:\n\n${reviewText}`,
        config: { temperature: 0.7 }
      });
      return response.text || "جای باحالی به نظر میاد!";
    } catch (e) { 
        console.warn("[AI] Vibe check failed:", e);
        return "توریست‌ها حس مثبتی به اینجا دارن."; 
    }
  }
}

export const PlaceService = new PlaceServiceProvider();
