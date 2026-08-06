import React, { useState } from 'react';
import { motion as _motion } from 'framer-motion';
import {
  Plane,
  Hotel,
  Utensils,
  MapPin,
  ArrowLeft,
  Play,
  Check,
  SkipForward,
  Trash2,
  Navigation,
  Clock,
  RefreshCw,
} from 'lucide-react';
import { TripEvent } from '../../types';
import { useMapStore } from '../../store/useMapStore';
import { useUIStore } from '../../store/useUIStore';
import { useUserStore } from '../../store/useUserStore';
import { GeoPoint } from '../../utils/geoPoint';
import { isActivityDone, isActivityOpen } from '../../utils/tripMapper';

const motion = _motion as any;

interface TimelineEventProps {
  event: TripEvent;
  isLast: boolean;
  index: number;
  onSuggestNext?: (next: TripEvent | null, action: 'complete' | 'skip') => void;
}

const getIcon = (type: string) => {
  switch (type) {
    case 'flight':
      return Plane;
    case 'hotel':
      return Hotel;
    case 'food':
      return Utensils;
    default:
      return MapPin;
  }
};

const getColor = (type: string) => {
  switch (type) {
    case 'flight':
      return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
    case 'hotel':
      return 'text-rava-gold bg-rava-gold/10 border-rava-gold/20';
    case 'food':
      return 'text-green-400 bg-green-400/10 border-green-400/20';
    default:
      return 'text-amber-400 bg-amber-400/10 border-amber-400/20';
  }
};

const statusLabel: Record<string, string> = {
  pending: 'در صف',
  upcoming: 'در صف',
  active: 'الان',
  now: 'الان',
  completed: 'انجام شد',
  skipped: 'رد شد',
};

const actionClass = 'flex items-center gap-1 rounded-rava-md px-3 py-2 text-rava-xs font-bold';

export const TimelineEvent: React.FC<TimelineEventProps> = ({
  event,
  isLast,
  index,
  onSuggestNext,
}) => {
  const { setActivePOI } = useMapStore();
  const { setActiveTab } = useUIStore();
  const {
    startActivity,
    completeActivity,
    skipActivity,
    removeTripEvent,
    rescheduleActivity,
  } = useUserStore();
  const [busy, setBusy] = useState(false);

  const Icon = getIcon(event.type);
  const colorClass = getColor(event.type);
  const isNow = event.status === 'active' || event.status === 'now';
  const done = isActivityDone(event.status);
  const open = isActivityOpen(event.status);

  const navigateTo = () => {
    const geo = GeoPoint.fromArray(event.coordinates);
    const dest =
      event.details.address ||
      event.placeName ||
      (geo ? `${geo.lat},${geo.lng}` : null);
    if (dest) {
      window.open(
        `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(dest)}`,
        '_blank'
      );
    }
    if (geo) {
      setActivePOI({
        id: event.id,
        name: event.title,
        lat: geo.lat,
        lng: geo.lng,
        category: event.type,
        description: event.details.address,
      } as any);
    }
  };

  const showOnMap = () => {
    const geo = GeoPoint.fromArray(event.coordinates);
    if (geo) {
      setActivePOI({
        id: event.id,
        name: event.title,
        lat: geo.lat,
        lng: geo.lng,
        category: event.type,
        description: event.details.address,
      } as any);
      setActiveTab('home');
    }
  };

  const run = async (fn: () => Promise<void>) => {
    if (busy) return;
    setBusy(true);
    try {
      await fn();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative ps-6 pb-4">
      {!isLast && (
        <div
          className={`absolute top-8 start-[7px] bottom-[-24px] w-0.5 ${
            isNow ? 'bg-gradient-to-b from-rava-gold to-white/10' : 'bg-white/10'
          }`}
        />
      )}

      <div
        className={`absolute start-0 top-1 z-10 h-4 w-4 rounded-full border-2 ${
          isNow
            ? 'animate-pulse border-yellow-200 bg-rava-gold shadow-[0_0_15px_rgba(234,179,8,0.6)]'
            : done
              ? 'border-white/40 bg-white/30'
              : 'border-white/20 bg-black'
        }`}
      />

      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.05 }}
        className={`group relative overflow-hidden rounded-rava-xl border glass p-5 ${
          isNow ? 'border-rava-gold/30' : done ? 'border-white/5 opacity-70' : 'border-white/5'
        }`}
      >
        {isNow && (
          <div className="pointer-events-none absolute end-0 top-0 h-16 w-16 rounded-full bg-rava-gold/10 blur-xl" />
        )}

        <div className="mb-3 flex items-start justify-between">
          <div className={`rounded-xl border p-2 ${colorClass}`}>
            <Icon size={18} />
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`rounded-lg bg-black/40 px-2 py-1 text-rava-xs font-black tracking-widest ${
                isNow ? 'text-rava-gold' : 'text-white/30'
              }`}
            >
              {event.time}
            </span>
            <span className="text-rava-xs font-bold text-white/25">{statusLabel[event.status] || event.status}</span>
          </div>
        </div>

        <h4 className={`mb-1 text-lg font-black ${isNow ? 'text-white' : 'text-white/80'}`}>{event.title}</h4>

        {(event.placeName || event.details.address) && (
          <p className="mb-3 truncate text-rava-xs leading-relaxed text-white/40">
            {event.placeName || event.details.address}
          </p>
        )}

        <div className="mt-3 grid grid-cols-2 gap-2">
          {event.details.flightNo && (
            <div className="rounded-xl bg-white/5 p-2 text-center">
              <span className="block text-rava-xs uppercase text-white/20">Flight</span>
              <span className="block font-mono text-xs tracking-wider text-white">{event.details.flightNo}</span>
            </div>
          )}
          {event.details.gate && (
            <div className="rounded-xl bg-white/5 p-2 text-center">
              <span className="block text-rava-xs uppercase text-white/20">Gate</span>
              <span className="block text-xs font-black text-white">{event.details.gate}</span>
            </div>
          )}
          {event.details.seat && (
            <div className="rounded-xl bg-white/5 p-2 text-center">
              <span className="block text-rava-xs uppercase text-white/20">Seat</span>
              <span className="block text-xs font-black text-rava-gold">{event.details.seat}</span>
            </div>
          )}
          {typeof event.details.price === 'number' && event.details.price > 0 && (
            <div className="rounded-xl bg-white/5 p-2 text-center">
              <span className="block text-rava-xs uppercase text-white/20">Cost</span>
              <span className="block text-xs font-black text-white">{event.details.price}</span>
            </div>
          )}
        </div>

        {open && (
          <div className="mt-4 flex flex-wrap justify-end gap-2 border-t border-white/5 pt-3">
            {!isNow && (
              <button disabled={busy} onClick={() => run(() => startActivity(event.id))} className={`${actionClass} bg-rava-gold/15 text-rava-gold`}>
                <Play size={12} /> شروع
              </button>
            )}
            <button disabled={busy} onClick={navigateTo} className={`${actionClass} bg-white/5 text-white/70`}>
              <Navigation size={12} /> مسیریابی
            </button>
            <button
              disabled={busy}
              onClick={() =>
                run(async () => {
                  const { next } = await completeActivity(event.id);
                  onSuggestNext?.(next || null, 'complete');
                })
              }
              className={`${actionClass} bg-green-500/15 text-green-400`}
            >
              <Check size={12} /> انجام
            </button>
            <button
              disabled={busy}
              onClick={() =>
                run(async () => {
                  const { next } = await skipActivity(event.id);
                  onSuggestNext?.(next || null, 'skip');
                })
              }
              className={`${actionClass} bg-white/5 text-white/40`}
            >
              <SkipForward size={12} /> رد
            </button>
            <button
              disabled={busy}
              onClick={() => {
                const t = window.prompt('ساعت جدید (HH:MM)', event.time);
                if (t && /^\d{2}:\d{2}$/.test(t)) {
                  run(() => rescheduleActivity(event.id, t));
                }
              }}
              className={`${actionClass} bg-white/5 text-white/40`}
            >
              <Clock size={12} /> زمان
            </button>
            <button
              disabled={busy}
              onClick={() => {
                const title = window.prompt('جایگزین با چه برنامه‌ای؟', event.title);
                if (title?.trim()) {
                  run(() =>
                    useUserStore.getState().replaceActivity(event.id, {
                      title: title.trim(),
                      placeName: title.trim(),
                    })
                  );
                }
              }}
              className={`${actionClass} bg-white/5 text-white/40`}
            >
              <RefreshCw size={12} /> عوض
            </button>
            <button disabled={busy} onClick={() => run(() => removeTripEvent(event.id))} className={`${actionClass} bg-red-500/10 text-red-400`}>
              <Trash2 size={12} /> حذف
            </button>
          </div>
        )}

        {done && event.coordinates && (
          <div className="mt-4 flex justify-end border-t border-white/5 pt-3">
            <button onClick={showOnMap} className="flex items-center gap-1 text-rava-xs font-bold text-white/60 transition-colors group-hover:text-rava-gold">
              مشاهده روی نقشه <ArrowLeft size={12} />
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
};
