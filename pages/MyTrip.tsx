import React, { useMemo, useState } from 'react';
import { motion as _motion, AnimatePresence } from 'framer-motion';
import {
  ScanLine,
  Plus,
  Play,
  Pause,
  Flag,
  XCircle,
  BookOpen,
  Route,
} from 'lucide-react';
import { SafeHavenCard } from '../components/wallet/SafeHavenCard';
import { TimelineEvent } from '../components/wallet/TimelineEvent';
import { TicketScanner } from '../components/wallet/TicketScanner';
import { StaticTripPicker } from '../components/trip/StaticTripPicker';
import { DailyRecapModal } from '../components/trip/DailyRecapModal';
import { useUserStore } from '../store/useUserStore';
import { TripEvent, TripLifecycleStatus } from '../types';
import { getTodaysEvents, sortEvents, todayIso } from '../utils/tripMapper';
import { displayJalaliDate } from '../utils/jalali';

const motion = _motion as any;

const STATUS_UI: Record<
  TripLifecycleStatus,
  { label: string; hint: string; color: string }
> = {
  planning: {
    label: 'در حال برنامه‌ریزی',
    hint: 'شهر، تاریخ و سلیقه را کامل کن یا از قالب آماده استفاده کن.',
    color: 'text-white/50',
  },
  upcoming: {
    label: 'آماده حرکت',
    hint: 'برنامه چیده شده — وقتی رسیدی سفر را شروع کن.',
    color: 'text-blue-400',
  },
  active: {
    label: 'سفر فعال',
    hint: 'برنامه امروز به ترتیب — شروع، مسیریابی، انجام یا رد.',
    color: 'text-yellow-500',
  },
  paused: {
    label: 'متوقف',
    hint: 'سفر روی Freeze است؛ هر وقت خواستی ادامه بده.',
    color: 'text-orange-400',
  },
  completed: {
    label: 'تمام شد',
    hint: 'این سفر وارد پاسپورتت شد.',
    color: 'text-green-400',
  },
  cancelled: {
    label: 'لغو شده',
    hint: 'می‌تونی از قالب‌ها دوباره شروع کنی.',
    color: 'text-red-400',
  },
};

export const MyTrip: React.FC = () => {
  const {
    tripEvents,
    wallet,
    activeTrip,
    startTrip,
    pauseTrip,
    resumeTrip,
    completeTrip,
    cancelTrip,
  } = useUserStore();
  const [showScanner, setShowScanner] = useState(false);
  const [showRecap, setShowRecap] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [suggest, setSuggest] = useState<{ title: string; action: string } | null>(null);

  const status: TripLifecycleStatus = activeTrip?.status || (tripEvents.length ? 'upcoming' : 'planning');
  const meta = STATUS_UI[status];

  const todaysList = useMemo(() => {
    const today = todayIso();
    const scoped = activeTrip
      ? tripEvents.filter((e) => !e.journeyId || e.journeyId === activeTrip.id)
      : tripEvents;
    const todays = getTodaysEvents(scoped, today);
    if (todays.length > 0) return todays;
    return sortEvents(scoped);
  }, [tripEvents, activeTrip]);

  const handleSuggest = (next: TripEvent | null, action: 'complete' | 'skip') => {
    if (!next) {
      setSuggest({ title: 'آفرین — برنامه امروز تموم شد', action });
      return;
    }
    setSuggest({
      title: action === 'complete' ? `بعدی: ${next.title}` : `پیشنهاد بعدی: ${next.title}`,
      action,
    });
    setTimeout(() => setSuggest(null), 4000);
  };

  return (
    <div className="h-full overflow-y-auto page-pad pt-6 no-scrollbar">
      <div className="flex justify-between items-end mb-6">
        <div className="text-right">
          <h2 className="text-white/40 text-xs font-black tracking-widest mb-1">
            راوا · سفر من
          </h2>
          <div className="flex items-center gap-2 justify-end">
            <span className="text-white text-3xl font-black tracking-tighter ltr-island" dir="ltr">
              {wallet.xp}
            </span>
            <span className="text-yellow-500 font-black text-xs">امتیاز</span>
          </div>
          <p className={`text-[11px] font-black mt-2 ${meta.color}`}>{meta.label}</p>
          {activeTrip && (
            <p className="text-white/30 text-[10px] mt-1">
              {activeTrip.title} · {activeTrip.city}
              {(activeTrip.startDate || activeTrip.endDate) && (
                <span className="block mt-0.5">
                  {displayJalaliDate(activeTrip.startDate)}
                  {activeTrip.endDate ? ` — ${displayJalaliDate(activeTrip.endDate)}` : ''}
                </span>
              )}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={() => setShowScanner(true)}
          className="glass p-4 min-w-[52px] min-h-[52px] rounded-3xl text-yellow-500 border-yellow-500/20 active:scale-95 transition-transform flex items-center justify-center"
          aria-label="اسکن بلیط"
        >
          <ScanLine size={24} />
        </button>
      </div>

      <p className="text-white/35 text-xs leading-relaxed mb-6 text-right">{meta.hint}</p>

      {/* Lifecycle controls */}
      <div className="flex flex-wrap gap-2 justify-end mb-6">
        {(status === 'upcoming' || status === 'planning') && activeTrip && (
          <button
            onClick={() => startTrip()}
            className="px-4 py-2 rounded-2xl bg-yellow-500 text-black text-[11px] font-black flex items-center gap-1"
          >
            <Play size={14} /> شروع سفر
          </button>
        )}
        {status === 'active' && (
          <>
            <button
              onClick={() => pauseTrip()}
              className="px-4 py-2 rounded-2xl bg-white/10 text-white text-[11px] font-black flex items-center gap-1"
            >
              <Pause size={14} /> توقف
            </button>
            <button
              onClick={() => completeTrip()}
              className="px-4 py-2 rounded-2xl bg-green-500/20 text-green-400 text-[11px] font-black flex items-center gap-1"
            >
              <Flag size={14} /> پایان سفر
            </button>
          </>
        )}
        {status === 'paused' && (
          <button
            onClick={() => resumeTrip()}
            className="px-4 py-2 rounded-2xl bg-yellow-500 text-black text-[11px] font-black flex items-center gap-1"
          >
            <Play size={14} /> ادامه سفر
          </button>
        )}
        {activeTrip && status !== 'completed' && status !== 'cancelled' && (
          <button
            onClick={() => cancelTrip()}
            className="px-4 py-2 rounded-2xl bg-red-500/10 text-red-400 text-[11px] font-black flex items-center gap-1"
          >
            <XCircle size={14} /> لغو
          </button>
        )}
        <button
          onClick={() => setShowRecap(true)}
          className="px-4 py-2 rounded-2xl bg-white/10 text-white/80 text-[11px] font-black flex items-center gap-1"
        >
          <BookOpen size={14} /> خلاصه امروز
        </button>
        <button
          onClick={() => setShowTemplates((v) => !v)}
          className="px-4 py-2 rounded-2xl bg-white/5 text-white/50 text-[11px] font-black flex items-center gap-1"
        >
          <Route size={14} /> قالب‌ها
        </button>
      </div>

      <AnimatePresence>
        {suggest && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mb-4 bg-yellow-500/15 border border-yellow-500/30 rounded-2xl px-4 py-3 text-yellow-500 text-xs font-bold text-right"
          >
            {suggest.title}
          </motion.div>
        )}
      </AnimatePresence>

      {showTemplates && (
        <div className="mb-10">
          <StaticTripPicker onCloned={() => setShowTemplates(false)} />
        </div>
      )}

      {(status === 'planning' || !activeTrip) && !showTemplates && tripEvents.length === 0 && (
        <div className="mb-10">
          <StaticTripPicker />
        </div>
      )}

      <SafeHavenCard />

      <div className="mt-12">
        <div className="flex justify-between items-center mb-8">
          <button
            onClick={() => setShowScanner(true)}
            className="p-2 bg-white/5 rounded-xl text-white/40 hover:text-white hover:bg-white/10 transition-colors"
          >
            <Plus size={20} />
          </button>
          <h3 className="text-white font-black text-xl">
            {status === 'active' ? 'برنامه امروز' : 'تایم‌لاین سفر شما'}
          </h3>
        </div>

        <div className="relative border-r-2 border-dashed border-white/5 mr-4 pr-8 space-y-6 pb-12">
          {todaysList.length === 0 ? (
            <div className="text-center py-10 opacity-50">
              <p className="text-white/40 text-sm">هنوز برنامه‌ای نچیدی!</p>
            </div>
          ) : (
            todaysList.map((event, idx) => (
              <TimelineEvent
                key={event.id}
                event={event}
                index={idx}
                isLast={idx === todaysList.length - 1}
                onSuggestNext={handleSuggest}
              />
            ))
          )}

          <div className="relative opacity-30 pt-4">
            <div className="absolute -right-[43px] top-4 w-3 h-3 rounded-full bg-white/20" />
            <button
              onClick={() => setShowScanner(true)}
              className="w-full border-2 border-dashed border-white/10 rounded-[2rem] p-6 text-center hover:bg-white/5 transition-colors"
            >
              <p className="text-white/40 text-xs font-bold">+ افزودن برنامه جدید</p>
            </button>
          </div>
        </div>
      </div>

      {activeTrip?.status === 'completed' && activeTrip.passportEntry && (
        <div className="mb-8 glass rounded-[2rem] p-5 border border-green-500/20 text-right">
          <p className="text-green-400 text-[10px] font-black mb-2">پاسپورت</p>
          <p className="text-white font-bold text-sm">{activeTrip.passportEntry}</p>
        </div>
      )}

      {showScanner && <TicketScanner onClose={() => setShowScanner(false)} />}
      <DailyRecapModal open={showRecap} onClose={() => setShowRecap(false)} />
    </div>
  );
};
