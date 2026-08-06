
import React from 'react';
import { useAuthStore } from '../../store/useAuthStore';
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
        className="mb-8 flex h-24 w-24 items-center justify-center rounded-rava-xl bg-rava-gold text-black shadow-[0_0_50px_rgba(234,179,8,0.3)]"
      >
        <Plane size={48} />
      </motion.div>
    </div>
    <h1 className="text-4xl font-black text-white tracking-widest">Rava</h1>
    <p className="mt-2 text-rava-sm font-black tracking-[0.4em] text-rava-gold/50">راوا</p>
    <p className="mt-4 flex items-center gap-2 text-rava-xs font-bold tracking-wide text-white/40">
      <Sparkles size={12} /> در حال آماده‌سازی هویت...
    </p>
  </motion.div>
);

export const AuthGuard: React.FC = () => {
  const { user, onboardingCompleted, isAuthInitialized, _hasHydrated } = useAuthStore();

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

  // ۵. داشبورد — همیشه با تب نقشه (Home) شروع می‌شود
  return <Dashboard key="main" />;
};
