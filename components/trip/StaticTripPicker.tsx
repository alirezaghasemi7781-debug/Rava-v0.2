import React, { useMemo, useState } from 'react';
import { motion as _motion } from 'framer-motion';
import { Copy, Loader2, MapPinned } from 'lucide-react';
import { getStaticTripsForCity } from '../../data/staticTrips';
import { useUserStore } from '../../store/useUserStore';
import { CityMode } from '../../types';
import { AudioGraph } from '../../services/audioGraph';

const motion = _motion as any;

interface StaticTripPickerProps {
  cityFilter?: CityMode;
  onCloned?: () => void;
}

export const StaticTripPicker: React.FC<StaticTripPickerProps> = ({ cityFilter, onCloned }) => {
  const { cityMode, cloneStaticTrip } = useUserStore();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const templates = useMemo(
    () => getStaticTripsForCity(cityFilter ?? cityMode),
    [cityFilter, cityMode]
  );

  const clone = async (id: string) => {
    if (busyId) return;
    setBusyId(id);
    setMsg(null);
    try {
      await cloneStaticTrip(id);
      AudioGraph.haptic(12);
      setMsg('برنامه کپی شد — در سفر من آماده‌ست');
      onCloned?.();
    } catch (e: any) {
      setMsg(e?.message || 'کپی نشد');
    } finally {
      setBusyId(null);
    }
  };

  if (templates.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <span className="text-white/30 text-[10px] font-black tracking-widest">قالب‌ها</span>
        <h3 className="text-white font-black text-lg">برنامه‌های آماده راوا</h3>
      </div>
      {msg && <p className="text-yellow-500/80 text-xs font-bold text-right">{msg}</p>}
      <div className="space-y-3">
        {templates.map((t) => (
          <motion.div
            key={t.id}
            layout
            className="glass rounded-[1.8rem] p-4 border border-white/5 text-right"
          >
            <div className="flex justify-between items-start gap-3 mb-2">
              <button
                onClick={() => clone(t.id)}
                disabled={!!busyId}
                className="shrink-0 px-3 py-2 rounded-xl bg-yellow-500 text-black text-[10px] font-black flex items-center gap-1 active:scale-95"
              >
                {busyId === t.id ? <Loader2 size={12} className="animate-spin" /> : <Copy size={12} />}
                کپی کن
              </button>
              <div>
                <h4 className="text-white font-black text-sm">{t.titleFa}</h4>
                <p className="text-white/35 text-[10px] mt-1 leading-relaxed">{t.description}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 justify-end mt-3">
              <span className="text-[9px] font-bold text-white/25 bg-white/5 px-2 py-1 rounded-lg flex items-center gap-1">
                <MapPinned size={10} /> {t.city}
              </span>
              <span className="text-[9px] font-bold text-white/25 bg-white/5 px-2 py-1 rounded-lg">
                {t.days} روز
              </span>
              <span className="text-[9px] font-bold text-yellow-500/70 bg-yellow-500/10 px-2 py-1 rounded-lg">
                {t.budgetStyle}
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
