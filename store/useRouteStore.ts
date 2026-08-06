import { create } from 'zustand';
import type { POI } from '../types';
import { routingService, type RouteMode, type RouteResult } from '../services/routingService';
import { useMapStore } from './useMapStore';

export interface RouteState {
  isActive: boolean;
  isCalculating: boolean;
  error: string | null;
  mode: RouteMode;
  origin: { lat: number; lng: number } | null;
  destination: { lat: number; lng: number; name?: string; placeId?: string } | null;
  route: RouteResult | null;

  setMode: (mode: RouteMode) => void;
  startRoute: (destination?: POI | null, mode?: RouteMode) => Promise<void>;
  recalculate: () => Promise<void>;
  cancelRoute: () => void;
}

export const useRouteStore = create<RouteState>((set, get) => ({
  isActive: false,
  isCalculating: false,
  error: null,
  mode: 'walking',
  origin: null,
  destination: null,
  route: null,

  setMode: (mode) => set({ mode }),

  startRoute: async (destination, mode) => {
    const userLocation = useMapStore.getState().userLocation;
    const active = destination || useMapStore.getState().activePOI || useMapStore.getState().fullDetailPOI;

    if (!userLocation) {
      set({ error: 'موقعیت GPS در دسترس نیست. از تنظیمات مرورگر دسترسی موقعیت را فعال کن.', isActive: false, isCalculating: false });
      return;
    }
    if (!active || (active.lat === 0 && active.lng === 0)) {
      set({ error: 'مختصات مقصد هنوز آماده نیست. چند لحظه صبر کن یا دوباره مکان را انتخاب کن.', isActive: false, isCalculating: false });
      return;
    }

    const nextMode = mode || get().mode;
    const origin = { lat: userLocation[0], lng: userLocation[1] };
    const dest = {
      lat: active.lat,
      lng: active.lng,
      name: active.name,
      placeId: active.id,
    };

    set({
      isCalculating: true,
      error: null,
      isActive: true,
      mode: nextMode,
      origin,
      destination: dest,
    });

    try {
      const route = await routingService.calculateRoute(origin, dest, nextMode);
      set({ route, isCalculating: false, error: null });
    } catch (err: any) {
      console.error('[RouteStore]', err);
      set({
        isCalculating: false,
        isActive: true,
        error: err?.message || 'مسیریابی ناموفق بود.',
        route: null,
      });
    }
  },

  recalculate: async () => {
    const { destination, mode } = get();
    if (!destination) return;
    const poi = {
      id: destination.placeId || 'dest',
      name: destination.name || 'مقصد',
      lat: destination.lat,
      lng: destination.lng,
      category: 'route',
    } as POI;
    await get().startRoute(poi, mode);
  },

  cancelRoute: () => {
    routingService.clear();
    set({
      isActive: false,
      isCalculating: false,
      error: null,
      origin: null,
      destination: null,
      route: null,
    });
  },
}));
