
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { POI, CityMode } from '../types';
import { discoveryService } from '../services/discoveryService';
import { PlaceService } from '../services/placeService';
import { migrateLocalStorageKey } from '../utils/storageMigration';

migrateLocalStorageKey('rahnam-discovery-storage-v5', 'rava-discovery-storage-v5');

interface DiscoveryState {
  discoveredPlaces: POI[];
  curatedPlaces: POI[];
  isSearching: boolean;
  feedError: string | null;
  activeMood: string | null;
  showCurated: boolean;
  lastFetchTime: number | null;
  cachedCity: CityMode | null; // اضافه شده: برای ترک کردن شهری که دیتاش کش شده
  
  setActiveMood: (mood: string | null) => void;
  toggleShowCurated: () => void;
  refreshFeed: (lat: number, lng: number) => Promise<void>;
  fetchCurated: (city: CityMode, force?: boolean) => Promise<void>;
  setDiscoveredPlaces: (places: POI[]) => void;
  clearFeedError: () => void;
}

export const useDiscoveryStore = create<DiscoveryState>()(
  persist(
    (set, get) => ({
      discoveredPlaces: [],
      curatedPlaces: [],
      isSearching: false,
      feedError: null,
      activeMood: null,
      showCurated: true,
      lastFetchTime: null,
      cachedCity: null,

      setActiveMood: (mood) => set({ activeMood: mood }),
      clearFeedError: () => set({ feedError: null }),
      
      toggleShowCurated: () => set((state) => ({ showCurated: !state.showCurated })),

      fetchCurated: async (city, force = false) => {
        if (!city) return;

        const { curatedPlaces, lastFetchTime, cachedCity } = get();
        const CACHE_TTL = 24 * 60 * 60 * 1000; // ۲۴ ساعت اعتبار کش
        const isExpired = !lastFetchTime || (Date.now() - lastFetchTime > CACHE_TTL);
        const isCityChanged = cachedCity !== city;

        // گارد پرفورمنس: اگر دیتا داریم، منقضی نشده و شهر عوض نشده، ریکوئست نزن
        if (curatedPlaces.length > 0 && !isExpired && !isCityChanged && !force) {
          console.log(`[Discovery] Using valid cached curated places for ${city}.`);
          return;
        }

        console.log(`[Discovery] Fetching curated places for ${city} (Expired: ${isExpired}, CityChanged: ${isCityChanged})`);

        try {
          // پاک کردن دیتای قبلی اگر شهر عوض شده تا کاربر گیج نشود
          if (isCityChanged) {
            set({ curatedPlaces: [] });
          }

          if (force) {
            const { assistantCache } = await import('../services/cache/assistantCache');
            await assistantCache.invalidate('curated_pois', city);
          }

          const places = await discoveryService.getCuratedPlaces(city);
          
          if (places && places.length > 0) {
            set({ 
              curatedPlaces: places, 
              lastFetchTime: Date.now(),
              cachedCity: city
            });
          }
        } catch (e) {
          console.warn("[Discovery] Network failed. Preserving last known curated markers.", e);
        }
      },

      refreshFeed: async (lat, lng) => {
        set({ isSearching: true, feedError: null });
        const mood = get().activeMood || undefined;
        
        try {
          let places = await discoveryService.searchNearby(lat, lng, 10000, mood);
          if (places.length === 0) {
            places = await PlaceService.fetchNearbyFallback(lat, lng, mood);
          }
          set({ discoveredPlaces: places, feedError: null });
        } catch (e) {
          console.error("[Discovery] Feed refresh failed:", e);
          set({
            feedError:
              e instanceof Error ? e.message : 'شبکه در دسترس نیست. دوباره تلاش کن.',
          });
        } finally {
          set({ isSearching: false });
        }
      },

      setDiscoveredPlaces: (places) => set({ discoveredPlaces: places })
    }),
    {
      name: 'rava-discovery-storage-v5',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ 
        curatedPlaces: state.curatedPlaces,
        showCurated: state.showCurated,
        lastFetchTime: state.lastFetchTime,
        cachedCity: state.cachedCity
      })
    }
  )
);
