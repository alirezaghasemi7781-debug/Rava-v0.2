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
      return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
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
    <div className="relative pl-6">
      {!isLast && (
        <div
          className={`absolute top-8 right-[7px] w-0.5 bottom-[-24px] ${
            isNow ? 'bg-gradient-to-b from-yellow-500 to-white/10' : 'bg-white/10'
          }`}
        />
      )}

      <div
        className={`absolute right-0 top-1 w-4 h-4 rounded-full border-2 z-10 ${
          isNow
            ? 'bg-yellow-500 border-yellow-200 shadow-[0_0_15px_rgba(234,179,8,0.6)] animate-pulse'
            : done
              ? 'bg-white/30 border-white/40'
              : 'bg-black border-white/20'
        }`}
      />

      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.05 }}
        className={`relative glass rounded-[1.8rem] p-5 border ${
          isNow ? 'border-yellow-500/30' : done ? 'border-white/5 opacity-70' : 'border-white/5'
        } overflow-hidden group`}
      >
        {isNow && (
          <div className="absolute top-0 right-0 w-16 h-16 bg-yellow-500/10 blur-xl rounded-full pointer-events-none" />
        )}

        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-2">
            <span
              className={`text-[10px] font-black tracking-widest bg-black/40 px-2 py-1 rounded-lg ${
                isNow ? 'text-yellow-500' : 'text-white/30'
              }`}
            >
              {event.time}
            </span>
            <span className="text-[9px] font-bold text-white/25 uppercase">
              {statusLabel[event.status] || event.status}
            </span>
          </div>
          <div className={`p-2 rounded-xl ${colorClass}`}>
            <Icon size={18} />
          </div>
        </div>

        <h4 className={`text-lg font-black mb-1 ${isNow ? 'text-white' : 'text-white/80'}`}>
          {event.title}
        </h4>

        {(event.placeName || event.details.address) && (
          <p className="text-white/40 text-[10px] leading-relaxed mb-3 truncate">
            {event.placeName || event.details.address}
          </p>
        )}

        <div className="grid grid-cols-2 gap-2 mt-3">
          {event.details.flightNo && (
            <div className="bg-white/5 rounded-xl p-2 text-center">
              <span className="block text-white/20 text-[8px] uppercase">Flight</span>
              <span className="block text-white font-mono text-xs tracking-wider">
                {event.details.flightNo}
              </span>
            </div>
          )}
          {event.details.gate && (
            <div className="bg-white/5 rounded-xl p-2 text-center">
              <span className="block text-white/20 text-[8px] uppercase">Gate</span>
              <span className="block text-white font-black text-xs">{event.details.gate}</span>
            </div>
          )}
          {event.details.seat && (
            <div className="bg-white/5 rounded-xl p-2 text-center">
              <span className="block text-white/20 text-[8px] uppercase">Seat</span>
              <span className="block text-yellow-500 font-black text-xs">{event.details.seat}</span>
            </div>
          )}
          {typeof event.details.price === 'number' && event.details.price > 0 && (
            <div className="bg-white/5 rounded-xl p-2 text-center">
              <span className="block text-white/20 text-[8px] uppercase">Cost</span>
              <span className="block text-white font-black text-xs">{event.details.price}</span>
            </div>
          )}
        </div>

        {open && (
          <div className="mt-4 pt-3 border-t border-white/5 flex flex-wrap gap-2 justify-end">
            {!isNow && (
              <button
                disabled={busy}
                onClick={() => run(() => startActivity(event.id))}
                className="text-[10px] font-bold px-3 py-2 rounded-xl bg-yellow-500/15 text-yellow-500 flex items-center gap-1"
              >
                <Play size={12} /> شروع
              </button>
            )}
            <button
              disabled={busy}
              onClick={navigateTo}
              className="text-[10px] font-bold px-3 py-2 rounded-xl bg-white/5 text-white/70 flex items-center gap-1"
            >
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
              className="text-[10px] font-bold px-3 py-2 rounded-xl bg-green-500/15 text-green-400 flex items-center gap-1"
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
              className="text-[10px] font-bold px-3 py-2 rounded-xl bg-white/5 text-white/40 flex items-center gap-1"
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
              className="text-[10px] font-bold px-3 py-2 rounded-xl bg-white/5 text-white/40 flex items-center gap-1"
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
              className="text-[10px] font-bold px-3 py-2 rounded-xl bg-white/5 text-white/40 flex items-center gap-1"
            >
              <RefreshCw size={12} /> عوض
            </button>
            <button
              disabled={busy}
              onClick={() => run(() => removeTripEvent(event.id))}
              className="text-[10px] font-bold px-3 py-2 rounded-xl bg-red-500/10 text-red-400 flex items-center gap-1"
            >
              <Trash2 size={12} /> حذف
            </button>
          </div>
        )}

        {done && event.coordinates && (
          <div className="mt-4 pt-3 border-t border-white/5 flex justify-end">
            <button
              onClick={showOnMap}
              className="text-[10px] font-bold text-white/60 flex items-center gap-1 group-hover:text-yellow-500 transition-colors"
            >
              مشاهده روی نقشه <ArrowLeft size={12} />
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
};
