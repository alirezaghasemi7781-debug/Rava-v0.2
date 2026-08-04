
import { APIProvider, Map as GoogleMap, AdvancedMarker, useMap } from '@vis.gl/react-google-maps';
import React, { useEffect, useCallback, useRef, useMemo } from 'react';
import { useUserStore } from '../../store/useUserStore';
import { useMapStore } from '../../store/useMapStore';
import { useDiscoveryStore } from '../../store/useDiscoveryStore';
import { PlaceService } from '../../services/placeService';
import { GeoPoint } from '../../utils/geoPoint';
import { Footprints as StepIcon, Star } from 'lucide-react';
import { APP_CONFIG } from '../../config';
import { MapControls } from './MapControls';

const CuratedMarker = React.memo(({ poi, onClick }: { 
  poi: any, 
  onClick: (e: any) => void 
}) => {
  const position = useMemo(() => {
    const lat = Number(poi.lat);
    const lng = Number(poi.lng);
    
    if (isNaN(lat) || isNaN(lng)) return { lat: 0, lng: 0 };
    
    const geo = new GeoPoint(lat, lng);
    return geo.toGoogle();
  }, [poi.lat, poi.lng]);
  
  if (position.lat === 0 && position.lng === 0) return null;

  return (
    <AdvancedMarker 
      position={position} 
      onClick={onClick}
      zIndex={1000}
      anchorLeft="-50%"
      anchorTop="-50%"
    >
      <div className="relative cursor-pointer transition-transform active:scale-95 group">
        <div className="bg-white p-1 rounded-full shadow-[0_0_30px_rgba(234,179,8,0.6)] border-2 border-yellow-500 group-hover:scale-110 transition-transform">
          <div className="bg-yellow-500 p-2 rounded-full">
             <Star size={18} className="text-black fill-current" />
          </div>
        </div>
        <div className="absolute -bottom-8 start-1/2 -translate-x-1/2 glass px-3 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-[1000] pointer-events-none text-black">
           <span className="text-[10px] font-black">{poi.name}</span>
        </div>
      </div>
    </AdvancedMarker>
  );
});

const FootprintMarker = React.memo(({ fp }: { 
  fp: any
}) => {
  const position = useMemo(() => {
    const lat = Number(fp.lat);
    const lng = Number(fp.lng);
    const geo = GeoPoint.fromArray([lat, lng]);
    return geo?.toGoogle() || { lat: 0, lng: 0 };
  }, [fp.lat, fp.lng]);
  
  return (
    <AdvancedMarker 
      position={position}
      zIndex={500}
    >
      <div className={`relative transition-all ${fp.is_verified === false ? 'opacity-40 grayscale-[0.5]' : 'opacity-80'}`}>
        <div className="bg-white/10 backdrop-blur-md p-2 rounded-full border border-white/20 shadow-xl">
          <StepIcon size={14} className={fp.is_verified === false ? 'text-white' : 'text-yellow-500'} />
        </div>
      </div>
    </AdvancedMarker>
  );
});

const MapController = () => {
  const map = useMap();
  const { cityMode, setCityMode } = useUserStore(); 
  const { fetchCurated } = useDiscoveryStore();
  const { setUserLocation } = useMapStore();
  const { setActivePOI, setFullDetailPOI, setLoadingDetails } = useMapStore();
  
  const processingClickRef = useRef<boolean>(false);
  const isCityInitialized = useRef<boolean>(false);

  // ۱. مدیریت مقدار اولیه شهر (فقط یک بار در شروع)
  useEffect(() => {
    if (!cityMode && !isCityInitialized.current) {
        console.log("[MapController] Initializing default city: Istanbul");
        isCityInitialized.current = true;
        setCityMode('Istanbul');
    }
  }, [cityMode, setCityMode]);

  // ۲. مدیریت Native Event Listener
  useEffect(() => {
    if (!map) return;

    // console.debug("[MapController] Attaching native listener");

    const clickListener = map.addListener('click', async (e: any) => {
      if (e.placeId) {
        // console.debug("[MapController] POI Click:", e.placeId);
        e.stop(); 

        if (processingClickRef.current) return;
        processingClickRef.current = true;

        try {
          setLoadingDetails(true);
          setFullDetailPOI(null);
          setActivePOI({ id: e.placeId, name: "در حال شناسایی...", lat: 0, lng: 0, category: 'loading' } as any);

          const essentials = await PlaceService.fetchEssentials(e.placeId);
          const geo = new GeoPoint(essentials.lat || 0, essentials.lng || 0);
          
          setActivePOI({ ...essentials, id: e.placeId, lat: geo.lat, lng: geo.lng } as any);
        } catch (err) {
          console.error("[MapController] Error:", err);
          setActivePOI(null);
        } finally {
          setLoadingDetails(false);
          setTimeout(() => { processingClickRef.current = false; }, 500);
        }
      }
    });

    return () => {
      if (clickListener) google.maps.event.removeListener(clickListener);
    };
  }, [map, setActivePOI, setFullDetailPOI, setLoadingDetails]);

  // ۳. مدیریت تغییر شهر و فچ کردن دیتا
  useEffect(() => {
    if (!map || !cityMode) return;

    PlaceService.init();
    // console.log(`[MapController] Active City: ${cityMode}`);
    
    fetchCurated(cityMode).catch(err => console.error("Fetch curated failed:", err));
    
    const center = cityMode === 'Istanbul' 
      ? new GeoPoint(41.0082, 28.9784) 
      : new GeoPoint(25.2048, 55.2708);
      
    map.panTo(center.toGoogle());
    map.setZoom(13);
    
  }, [cityMode, map, fetchCurated]);

  // ۴. مدیریت Geolocation
  useEffect(() => {
    if (!navigator.geolocation) return;

    try {
      const watchId = navigator.geolocation.watchPosition(
        (pos) => setUserLocation([pos.coords.latitude, pos.coords.longitude]),
        (err) => {
          if (err.code !== 1) { 
             console.warn("Geolocation error:", err);
          }
        },
        { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
      );
      return () => navigator.geolocation.clearWatch(watchId);
    } catch (e) {
      // console.error("Geolocation setup failed:", e);
    }
  }, [setUserLocation]);

  return null;
};

const GOOGLE_LIBRARIES: ("places" | "marker")[] = ['places', 'marker'];

/** Rollback: if quarterly misbehaves after a mid-quarter Google roll, set version to a numbered pin (e.g. "3.64" or "3.65"). */
const MAPS_JS_VERSION = 'quarterly';

const handleMapsApiError = (error: unknown) => {
  console.error('[MainMap] Google Maps JavaScript API failed to load:', error);
};

export const MainMap: React.FC = () => {
  const { curatedPlaces, showCurated } = useDiscoveryStore();
  const { nearbyFootprints, pendingFootprints, userLocation, setActivePOI, setFullDetailPOI } = useMapStore();
  
  const visibleCurated = useMemo(() => {
    if (!showCurated) return [];
    return curatedPlaces;
  }, [showCurated, curatedPlaces]);

  const handleCuratedClick = useCallback((poi: any) => {
    // console.log("Curated Click:", poi.name);
    setFullDetailPOI(null);
    setActivePOI(poi);
  }, [setFullDetailPOI, setActivePOI]);

  const userGeo = useMemo(() => GeoPoint.fromArray(userLocation), [userLocation]);

  return (
    <div className="w-full h-full relative map-container">
      <APIProvider
        apiKey={APP_CONFIG.GOOGLE.MAPS_API_KEY}
        libraries={GOOGLE_LIBRARIES}
        version={MAPS_JS_VERSION}
        onError={handleMapsApiError}
      >
        <GoogleMap
          defaultCenter={{ lat: 41.0082, lng: 28.9784 }}
          defaultZoom={13}
          mapId="8e589146f4837837" 
          disableDefaultUI={true}
          clickableIcons={true}
          className="w-full h-full"
          gestureHandling={'greedy'}
          colorScheme="DARK"
        >
          <MapController />
          
          {visibleCurated.map(poi => (
            <CuratedMarker 
              key={poi.id} 
              poi={poi} 
              onClick={() => handleCuratedClick(poi)} 
            />
          ))}

          {[...nearbyFootprints, ...(pendingFootprints || [])].map(fp => (
            <FootprintMarker 
              key={fp.id} 
              fp={fp} 
            />
          ))}

          {userGeo && (
            <AdvancedMarker position={userGeo.toGoogle()}>
               <div className="relative">
                 <div className="absolute inset-0 bg-blue-500 rounded-full animate-ping opacity-30" />
                 <div className="relative w-5 h-5 bg-blue-500 rounded-full border-2 border-white shadow-xl flex items-center justify-center">
                    <div className="w-1.5 h-1.5 bg-white rounded-full" />
                 </div>
               </div>
            </AdvancedMarker>
          )}

          <MapControls />
        </GoogleMap>
      </APIProvider>
    </div>
  );
};
