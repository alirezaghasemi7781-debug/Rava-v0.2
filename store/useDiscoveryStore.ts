
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { POI, CityMode } from '../types';
import { discoveryService } from '../services/discoveryService';
import { PlaceService } from '../services/placeService';

interface DiscoveryState {
  discoveredPlaces: POI[];
  curatedPlaces: POI[];
  isSearching: boolean;
  activeMood: string | null;
  showCurated: boolean;
  lastFetchTime: number | null;
  cachedCity: CityMode | null; // اضافه شده: برای ترک کردن شهری که دیتاش کش شده
  
  setActiveMood: (mood: string | null) => void;
  toggleShowCurated: () => void;
  refreshFeed: (lat: number, lng: number) => Promise<void>;
  fetchCurated: (city: CityMode, force?: boolean) => Promise<void>;
  setDiscoveredPlaces: (places: POI[]) => void;
}

export const useDiscoveryStore = create<DiscoveryState>()(
  persist(
    (set, get) => ({
      discoveredPlaces: [],
      curatedPlaces: [],
      isSearching: false,
      activeMood: null,
      showCurated: true,
      lastFetchTime: null,
      cachedCity: null,

      setActiveMood: (mood) => set({ activeMood: mood }),
      
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
        set({ isSearching: true });
        const mood = get().activeMood || undefined;
        
        try {
          let places = await discoveryService.searchNearby(lat, lng, 10000, mood);
          if (places.length === 0) {
            places = await PlaceService.fetchNearbyFallback(lat, lng, mood);
          }
          set({ discoveredPlaces: places });
        } catch (e) {
          console.error("[Discovery] Feed refresh failed:", e);
        } finally {
          set({ isSearching: false });
        }
      },

      setDiscoveredPlaces: (places) => set({ discoveredPlaces: places })
    }),
    {
      name: 'rahnam-discovery-storage-v5', // ورژن استوریج را بالا بردم تا کش قبلی invalidate شود
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
