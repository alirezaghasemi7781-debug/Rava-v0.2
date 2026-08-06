
import React, { useMemo } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { useUserStore } from '../../store/useUserStore';
import { Onboarding } from '../../pages/Onboarding';
import { Dashboard } from '../../pages/Dashboard';
import { AuthScreen } from './components/AuthScreen';
import { Plane, Sparkles } from 'lucide-react';
import { motion as _motion } from 'framer-motion';

const motion = _motion as any;

// اسپلش اسکرین داخلی برای زمان‌هایی که وضعیت هنوز مشخص نیست
const LoadingSplash = () => (
  <motion.div 
    initial={{ opacity: 1 }} 
    exit={{ opacity: 0 }} 
    className="fixed inset-0 bg-black z-[5000] flex flex-col items-center justify-center"
  >
    <div className="relative">
      <motion.div 
        animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }} 
        transition={{ duration: 3, repeat: Infinity }} 
        className="w-24 h-24 bg-yellow-500 rounded-[2.5rem] flex items-center justify-center text-black mb-8 shadow-[0_0_50px_rgba(234,179,8,0.3)]"
      >
        <Plane size={48} />
      </motion.div>
    </div>
    <h1 className="text-4xl font-black text-white tracking-widest">Rava</h1>
    <p className="text-yellow-500/50 mt-2 font-black tracking-[0.4em] text-sm">راوا</p>
    <p className="text-white/40 mt-4 font-bold tracking-wide text-[10px] flex items-center gap-2">
      <Sparkles size={12} /> در حال آماده‌سازی هویت...
    </p>
  </motion.div>
);

export const AuthGuard: React.FC = () => {
  const { user, onboardingCompleted, isAuthInitialized, _hasHydrated } = useAuthStore();
  const { tripEvents } = useUserStore();
  const hasActiveTrip = useUserStore((s) => s.hasActiveTrip);
  const activeTrip = useUserStore((s) => s.activeTrip);

  // ۱. منطق تشخیص سفر فعال (Active Trip)
  const isActuallyTravelingNow = useMemo(() => {
    if (activeTrip?.status === 'active' || activeTrip?.status === 'paused') return true;
    if (hasActiveTrip()) return true;
    if (!tripEvents || tripEvents.length === 0) return false;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return tripEvents.some(event => {
      if (event.status === 'now' || event.status === 'active') return true;
      
      const startDate = new Date(event.date);
      startDate.setHours(0, 0, 0, 0);
      
      const endDate = event.end_time ? new Date(event.end_time) : new Date(startDate.getTime() + 24 * 60 * 60 * 1000);
      endDate.setHours(23, 59, 59, 999);

      return today >= startDate && today <= endDate;
    });
  }, [tripEvents, activeTrip, hasActiveTrip]);

  // ۲. گارد حیاتی: تا زمانی که وضعیت مشخص نیست، لودینگ نشان بده
  // این خط دقیقاً همان چیزی است که جلوی پرش به صفحه لاگین را می‌گیرد وقتی توکن در URL است
  if (!_hasHydrated || !isAuthInitialized) {
    return <LoadingSplash />;
  }

  // ۳. سناریوی ورود
  if (!user) {
    return <AuthScreen />;
  }

  // ۴. سناریوی آنبوردینگ
  if (!onboardingCompleted) {
    return <Onboarding />;
  }

  // ۵. روتینگ نهایی (Survival vs Veteran)
  if (isActuallyTravelingNow) {
    return <Dashboard key="active" />;
  } else {
    // کاربر قدیمی که الان سفر ندارد -> هدایت به ابزارها/پاسپورت
    return <Dashboard key="veteran" defaultTab="tools" />;
  }
};
