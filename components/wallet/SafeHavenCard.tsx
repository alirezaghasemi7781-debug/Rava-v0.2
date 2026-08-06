import React, { useState, useMemo } from 'react';
import { motion as _motion, AnimatePresence } from 'framer-motion';
import { MapPin, Car, Eye, X, Volume2, Shield, AlertTriangle, Loader2 } from 'lucide-react';
import { GlassCard } from '../core/GlassCard';
import { useUserStore } from '../../store/useUserStore';
import { ttsService } from '../../services/survival/ttsService';
import { AudioGraph } from '../../services/audioGraph';
import { Button, IconButton } from '../ui';

const motion = _motion as any;

export const SafeHavenCard: React.FC = () => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [ttsError, setTtsError] = useState(false);

  const tripEvents = useUserStore((s) => s.tripEvents);
  const cityMode = useUserStore((s) => s.cityMode);

  const hotelEvent = useMemo(() => tripEvents.find((e) => e.type === 'hotel') || null, [tripEvents]);

  const hotelName = hotelEvent?.title || 'هنوز هتلی ثبت نشده';
  const hotelAddress = hotelEvent?.details?.address || 'آدرس هتل در دسترس نیست';

  const handleTTS = async () => {
    if (!hotelEvent || isSpeaking) return;
    setTtsError(false);
    setIsSpeaking(true);
    AudioGraph.getInstance().playTickSound();

    try {
      const lang = cityMode === 'Istanbul' ? 'tr-TR' : 'ar-AE';
      await ttsService.speak(hotelAddress, lang, 0.75);
    } catch {
      setTtsError(true);
    } finally {
      setIsSpeaking(false);
    }
  };

  const handleTaxiDeepLink = () => {
    const encodedAddress = encodeURIComponent(hotelAddress);
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}`, '_blank');
  };

  if (!hotelEvent) {
    return (
      <GlassCard className="border-dashed border-white/20 opacity-60">
        <div className="flex flex-col items-center gap-3 py-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/5">
            <Shield size={24} className="text-white/20" />
          </div>
          <div className="text-center">
            <p className="text-rava-sm font-bold text-white/60">جان‌پناه هوشمند</p>
            <p className="mt-1 text-rava-xs text-white/20">بلیط هتل را اسکن کنید تا فعال شود</p>
          </div>
        </div>
      </GlassCard>
    );
  }

  return (
    <>
      <GlassCard className="relative overflow-hidden border-s-4 border-rava-gold bg-gradient-to-r from-rava-gold/10 to-transparent">
        <div className="pointer-events-none absolute end-[-10px] top-[-10px] p-3 opacity-10">
          <Shield size={80} className="text-rava-gold" />
        </div>
        <div className="relative z-10 mb-6 flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-rava-lg bg-rava-gold text-black shadow-lg">
            <MapPin size={28} />
          </div>
          <div className="text-right">
            <h3 className="mb-0.5 text-rava-lg font-black text-white">{hotelName}</h3>
            <span className="flex items-center justify-end gap-2 text-rava-xs font-black uppercase tracking-widest text-rava-gold/80">
              Safe Haven Active <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-rava-gold" />
            </span>
          </div>
        </div>
        <div className="relative z-10 grid grid-cols-2 gap-4">
          <Button variant="secondary" size="sm" className="w-full" onClick={() => setIsFullscreen(true)} leadingIcon={<Eye size={16} />}>
            نمایش به راننده
          </Button>
          <Button size="sm" className="w-full" onClick={handleTaxiDeepLink} leadingIcon={<Car size={16} />}>
            درخواست اسنپ
          </Button>
        </div>
      </GlassCard>

      <AnimatePresence>
        {isFullscreen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-[6000] flex flex-col justify-between bg-black p-8 text-center"
          >
            <div className="flex items-center justify-between pt-safe">
              <div className="glass flex items-center gap-2 rounded-full border-white/10 px-4 py-2">
                <div className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
                <span className="text-rava-xs font-black uppercase tracking-tighter text-white/60">Emergency Taxi View</span>
              </div>
              <IconButton icon={X} label="بستن" onClick={() => setIsFullscreen(false)} size="md" />
            </div>
            <div className="max-h-[50vh] space-y-8 overflow-y-auto px-2 py-4 no-scrollbar">
              <div className="inline-block rounded-full bg-rava-gold px-6 py-2 text-rava-xs font-black uppercase tracking-[0.3em] text-black">
                ADDRESS FOR DRIVER
              </div>
              <h2 className="break-words text-4xl font-black leading-tight text-white md:text-6xl" style={{ direction: 'ltr' }}>
                {hotelAddress}
              </h2>
              <p className="mt-4 text-2xl font-bold text-rava-gold/60">{hotelName}</p>
            </div>
            <div className="mb-10 flex flex-col items-center gap-6">
              <motion.button
                type="button"
                whileTap={{ scale: 0.85 }}
                onClick={handleTTS}
                disabled={isSpeaking}
                className={`relative flex h-28 w-28 items-center justify-center rounded-rava-xl text-black shadow-2xl ${isSpeaking ? 'bg-indigo-500' : 'bg-white'}`}
              >
                {isSpeaking ? (
                  <Loader2 size={48} className="animate-spin text-white" />
                ) : ttsError ? (
                  <AlertTriangle size={48} className="text-red-500" />
                ) : (
                  <Volume2 size={48} />
                )}
              </motion.button>
              <p className="text-rava-lg font-black text-white">
                {isSpeaking ? 'در حال پخش...' : ttsError ? 'خطا در پخش صوتی' : 'پخش صوتی آدرس'}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
