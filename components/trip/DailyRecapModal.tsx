import React, { useState } from 'react';
import { motion as _motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Loader2, MapPin, Coins, Zap, Sunrise } from 'lucide-react';
import { useUserStore } from '../../store/useUserStore';
import { supabase } from '../../services/supabaseClient';
import { recapService } from '../../services/recapService';
import { RecapResult } from '../../types';
import { todayIso } from '../../utils/tripMapper';
import { displayJalaliDate } from '../../utils/jalali';
import { AudioGraph } from '../../services/audioGraph';

const motion = _motion as any;

interface DailyRecapModalProps {
  open: boolean;
  onClose: () => void;
}

export const DailyRecapModal: React.FC<DailyRecapModalProps> = ({ open, onClose }) => {
  const { wallet, tripEvents, cityMode, activeTrip, claimReward, setActiveTripLocal, trips } =
    useUserStore();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RecapResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generate = async () => {
    setLoading(true);
    setError(null);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const date = todayIso();
      const chatHighlights = user
        ? await recapService.fetchTodayChatHighlights(user.id, date)
        : [];

      const facts = recapService.collectRecapFacts({
        stamps: wallet.stamps,
        tripEvents,
        city: activeTrip?.city || cityMode,
        date,
        chatHighlights,
      });

      const recap = await recapService.generateDailyRecap(facts);
      setResult(recap);

      if (user) {
        await recapService.saveDailyRecap(user.id, facts, recap);
        await claimReward('daily_itinerary', `recap:${date}`);
      }

      if (activeTrip && recap.passportItem && !activeTrip.passportEntry) {
        const updated = { ...activeTrip, passportEntry: recap.passportItem };
        setActiveTripLocal(updated);
        useUserStore.setState({
          trips: trips.map((t) => (t.id === updated.id ? updated : t)),
        });
      }

      AudioGraph.getInstance().playCoinSound();
    } catch (e: any) {
      setError(e?.message || 'خلاصه ساخته نشد');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[7000] bg-black/90 backdrop-blur-xl flex items-end sm:items-center justify-center p-4"
        >
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            className="w-full max-w-md glass rounded-[2.5rem] border border-white/10 p-6 text-right relative"
          >
            <button
              onClick={onClose}
              className="absolute top-5 left-5 w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center text-white/50"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3 justify-end mb-6">
              <div>
                <h3 className="text-white font-black text-xl">خلاصه امروز</h3>
                <p className="text-white/30 text-[10px] font-bold">
                  راوا · {displayJalaliDate(todayIso())} · فقط بر پایه واقعیت‌های ثبت‌شده
                </p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-yellow-500/20 text-yellow-500 flex items-center justify-center">
                <Sparkles size={22} />
              </div>
            </div>

            {!result ? (
              <div className="space-y-4">
                <p className="text-white/50 text-sm leading-relaxed">
                  مهرها، هزینه‌های برنامه، آیتم‌های ردشده و باقی‌مانده امروز را جمع می‌کنیم — بدون داستان‌سازی.
                </p>
                {error && <p className="text-red-400 text-xs">{error}</p>}
                <button
                  onClick={generate}
                  disabled={loading}
                  className="w-full py-4 rounded-2xl bg-yellow-500 text-black font-black flex items-center justify-center gap-2 active:scale-95 transition-transform"
                >
                  {loading ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}
                  ساخت خلاصه امروز
                </button>
              </div>
            ) : (
              <div className="space-y-5">
                <p className="text-white text-sm leading-relaxed">{result.summary}</p>

                {result.highlights.length > 0 && (
                  <ul className="space-y-2">
                    {result.highlights.map((h, i) => (
                      <li
                        key={i}
                        className="text-xs text-white/60 bg-white/5 rounded-xl px-3 py-2 flex items-start gap-2"
                      >
                        <MapPin size={12} className="mt-0.5 text-yellow-500 shrink-0" />
                        {h}
                      </li>
                    ))}
                  </ul>
                )}

                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-white/5 rounded-2xl p-3 text-center">
                    <Coins size={14} className="mx-auto text-yellow-500 mb-1" />
                    <span className="block text-white font-black text-sm">{result.dailyCost}</span>
                    <span className="text-[8px] text-white/30 font-bold">هزینه</span>
                  </div>
                  <div className="bg-white/5 rounded-2xl p-3 text-center">
                    <Zap size={14} className="mx-auto text-yellow-500 mb-1" />
                    <span className="block text-white font-black text-sm">+{result.xpEarned}</span>
                    <span className="text-[8px] text-white/30 font-bold">XP</span>
                  </div>
                  <div className="bg-white/5 rounded-2xl p-3 text-center">
                    <MapPin size={14} className="mx-auto text-yellow-500 mb-1" />
                    <span className="block text-white font-black text-sm">{result.placesVisited}</span>
                    <span className="text-[8px] text-white/30 font-bold">مکان</span>
                  </div>
                </div>

                {result.tomorrowHint && (
                  <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-2xl p-4 flex gap-3 items-start">
                    <Sunrise size={16} className="text-yellow-500 mt-0.5" />
                    <p className="text-yellow-500/90 text-xs font-bold leading-relaxed">
                      {result.tomorrowHint}
                    </p>
                  </div>
                )}

                {result.passportItem && (
                  <p className="text-white/30 text-[10px] font-mono text-center">{result.passportItem}</p>
                )}

                <button
                  onClick={onClose}
                  className="w-full py-3 rounded-2xl bg-white/10 text-white font-black text-sm"
                >
                  بستن
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
