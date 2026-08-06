import React from 'react';
import { motion as _motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Navigation, Layers, Route, X } from 'lucide-react';
import { useDiscoveryStore } from '../../store/useDiscoveryStore';
import { useMapStore } from '../../store/useMapStore';
import { useRouteStore } from '../../store/useRouteStore';
import { useMap } from '@vis.gl/react-google-maps';
import { AudioGraph } from '../../services/audioGraph';

const motion = _motion as any;

export const MapControls: React.FC = () => {
  const map = useMap();
  const { showCurated, toggleShowCurated } = useDiscoveryStore();
  const {
    userLocation,
    locationPermissionDenied,
    mapsLoadError,
    setMapsLoadError,
    setLocationPermissionDenied,
  } = useMapStore();
  const { isActive, route, mode, setMode, recalculate, cancelRoute, isCalculating, error } = useRouteStore();

  const handleToggle = () => {
    AudioGraph.getInstance().playTickSound();
    AudioGraph.haptic(10);
    toggleShowCurated();
  };

  const handleRecenter = () => {
    if (!map || !userLocation) return;
    AudioGraph.getInstance().playTickSound();
    map.panTo({ lat: userLocation[0], lng: userLocation[1] });
    map.setZoom(15);
  };

  const cycleMode = () => {
    const order: Array<'walking' | 'driving' | 'transit'> = ['walking', 'driving', 'transit'];
    const next = order[(order.indexOf(mode) + 1) % order.length];
    setMode(next);
    recalculate();
  };

  const modeLabel =
    mode === 'walking' ? 'پیاده' : mode === 'driving' ? 'خودرو' : 'حمل‌ونقل';

  return (
    <div className="absolute left-6 top-24 z-[1000] flex flex-col gap-4">
      {(mapsLoadError || locationPermissionDenied) && (
        <div className="absolute left-16 top-0 w-56 glass px-3 py-2.5 rounded-2xl border border-red-500/30 space-y-1">
          {mapsLoadError && (
            <button
              type="button"
              className="text-right w-full"
              onClick={() => setMapsLoadError(null)}
            >
              <p className="text-red-300 text-[10px] font-bold leading-relaxed">{mapsLoadError}</p>
            </button>
          )}
          {locationPermissionDenied && (
            <button
              type="button"
              className="text-right w-full"
              onClick={() => setLocationPermissionDenied(false)}
            >
              <p className="text-amber-300 text-[10px] font-bold leading-relaxed">
                دسترسی موقعیت قطع است. از تنظیمات مرورگر GPS را فعال کن.
              </p>
            </button>
          )}
        </div>
      )}

      <button
        type="button"
        onClick={handleToggle}
        aria-label="نمایش مکان‌های راوا"
        className={`w-14 h-14 min-w-[44px] min-h-[44px] rounded-2xl flex flex-col items-center justify-center transition-all duration-500 border shadow-2xl relative group ${
          showCurated
            ? 'bg-yellow-500 border-yellow-400 text-black shadow-[0_0_30px_rgba(234,179,8,0.4)]'
            : 'bg-black/40 backdrop-blur-xl border-white/10 text-white/40 hover:text-white hover:border-white/20'
        }`}
      >
        <Sparkles size={22} className={showCurated ? 'animate-pulse' : ''} />
        <span className="text-[7px] font-black mt-1 tracking-tighter">جواهر</span>

        <div className="absolute right-full mr-4 glass px-3 py-1.5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
          <span className="text-white text-[9px] font-bold">نمایش لایه راوا</span>
        </div>
      </button>

      <button
        type="button"
        onClick={handleRecenter}
        aria-label="موقعیت من"
        className="w-14 h-14 min-w-[44px] min-h-[44px] rounded-2xl bg-black/40 backdrop-blur-xl border border-white/10 flex flex-col items-center justify-center text-white/60 hover:text-white active:scale-90 transition-all shadow-2xl"
      >
        <Navigation size={22} />
        <span className="text-[7px] font-black mt-1 tracking-tighter">من</span>
      </button>

      {isActive && (
        <>
          <button
            type="button"
            onClick={cycleMode}
            disabled={isCalculating}
            aria-label="تغییر حالت مسیر"
            className="w-14 h-14 min-w-[44px] min-h-[44px] rounded-2xl bg-yellow-500 border border-yellow-400 text-black flex flex-col items-center justify-center shadow-[0_0_30px_rgba(234,179,8,0.35)] active:scale-90 transition-all"
          >
            <Route size={22} className={isCalculating ? 'animate-pulse' : ''} />
            <span className="text-[7px] font-black mt-1 tracking-tighter">{modeLabel}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              AudioGraph.getInstance().playTickSound();
              cancelRoute();
            }}
            aria-label="لغو مسیر"
            className="w-14 h-14 min-w-[44px] min-h-[44px] rounded-2xl bg-red-500/90 border border-red-400 text-white flex flex-col items-center justify-center shadow-2xl active:scale-90 transition-all"
          >
            <X size={22} />
            <span className="text-[7px] font-black mt-1 tracking-tighter">توقف</span>
          </button>
        </>
      )}

      <button
        type="button"
        disabled
        aria-label="لایه ترکیبی (به‌زودی)"
        className="w-14 h-14 min-w-[44px] min-h-[44px] rounded-2xl bg-black/40 backdrop-blur-xl border border-white/10 flex flex-col items-center justify-center text-white/20 cursor-not-allowed"
      >
        <Layers size={22} />
        <span className="text-[7px] font-black mt-1 tracking-tighter">ترکیبی</span>
      </button>

      <AnimatePresence>
        {isActive && route && (
          <motion.div
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            className="absolute left-16 top-0 glass px-4 py-3 rounded-2xl border-yellow-500/30 min-w-[140px]"
          >
            <p className="text-yellow-400 text-[10px] font-black tracking-widest mb-1">مسیر راوا</p>
            <p className="text-white font-black text-sm">{route.durationText}</p>
            <p className="text-white/50 text-xs font-bold">{route.distanceText}</p>
            {error && <p className="text-red-400 text-[10px] mt-1">{error}</p>}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
