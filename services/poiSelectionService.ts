/**
 * Shared POI selection — single path for curated markers, Google POIs, favorites, footprints.
 */
import { PlaceService } from './placeService';
import { useMapStore } from '../store/useMapStore';
import { GeoPoint } from '../utils/geoPoint';
import type { POI } from '../types';

export type POISelectionSource = 'curated' | 'google' | 'favorite' | 'footprint' | 'search' | 'tool';

export interface SelectPOIOptions {
  fetchEssentials?: boolean;
  map?: {
    panTo: (c: { lat: number; lng: number }) => void;
    getZoom?: () => number;
    setZoom?: (z: number) => void;
  } | null;
  source?: POISelectionSource;
}

let processing = false;

function panToPOI(map: SelectPOIOptions['map'], lat: number, lng: number) {
  if (!map || !lat || !lng) return;
  try {
    map.panTo({ lat, lng });
    const z = map.getZoom?.() ?? 14;
    if (z < 14) map.setZoom?.(15);
  } catch {
    /* map may be disposed */
  }
}

/**
 * Set active POI, open collapsed sheet, show essentials fast, load coords if needed, pan map.
 */
export async function selectPOI(
  partial: Partial<POI> & { id: string; name?: string },
  options: SelectPOIOptions = {},
): Promise<void> {
  const { setActivePOI, setFullDetailPOI, setLoadingDetails, setPOIError } = useMapStore.getState();

  setPOIError(null);
  setFullDetailPOI(null);

  const hasCoords =
    typeof partial.lat === 'number' &&
    typeof partial.lng === 'number' &&
    !(partial.lat === 0 && partial.lng === 0);

  const immediate: POI = {
    id: partial.id,
    name: partial.name || 'در حال شناسایی...',
    lat: hasCoords ? partial.lat! : 0,
    lng: hasCoords ? partial.lng! : 0,
    category: partial.category || 'loading',
    description: partial.description,
    image: partial.image,
    rating: partial.rating,
    is_curated: partial.is_curated,
    isGooglePOI: options.source === 'google' || partial.isGooglePOI,
    address: partial.address,
    moodTags: partial.moodTags,
  };

  setActivePOI(immediate);

  if (hasCoords) {
    panToPOI(options.map, immediate.lat, immediate.lng);
  }

  const needsFetch =
    options.fetchEssentials !== false &&
    (options.source === 'google' || !hasCoords || options.source === 'favorite');

  if (!needsFetch) return;

  if (processing && options.source === 'google') return;
  processing = true;
  setLoadingDetails(true);

  try {
    if (partial.id.startsWith('rava_syn_')) {
      const curated = await PlaceService.fetchHybridDetails(partial.id);
      const merged = { ...immediate, ...curated, id: partial.id } as POI;
      setActivePOI(merged);
      if (merged.lat && merged.lng) panToPOI(options.map, merged.lat, merged.lng);
      return;
    }

    const essentials = await PlaceService.fetchEssentials(partial.id);
    const geo = new GeoPoint(essentials.lat || partial.lat || 0, essentials.lng || partial.lng || 0);
    const merged: POI = {
      ...immediate,
      ...essentials,
      id: partial.id,
      lat: geo.lat,
      lng: geo.lng,
      name: essentials.name || immediate.name,
    };
    setActivePOI(merged);
    panToPOI(options.map, merged.lat, merged.lng);
  } catch (err) {
    console.error('[selectPOI]', err);
    setPOIError('جزئیات این مکان فعلاً در دسترس نیست.');
    if (!hasCoords) {
      setActivePOI(null);
    }
  } finally {
    setLoadingDetails(false);
    setTimeout(() => {
      processing = false;
    }, 400);
  }
}

export function isSyntheticPlaceId(id: string): boolean {
  return id.startsWith('rava_syn_');
}
