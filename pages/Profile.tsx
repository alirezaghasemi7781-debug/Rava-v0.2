import React, { useState } from 'react';
import { motion as _motion, AnimatePresence } from 'framer-motion';
import { Settings, Share2, Crown } from 'lucide-react';
import { useUIStore } from '../store/useUIStore';
import { ProfileHeader } from '../components/profile/ProfileHeader';
import { PassportCard } from '../components/profile/PassportCard';
import { TravelPersona } from '../components/profile/TravelPersona';
import { ActionMenu } from '../components/profile/ActionMenu';
import { SystemSettingsModal } from '../features/profile/modals/SystemSettingsModal';
import { AudioGraph } from '../services/audioGraph';
import { PageHeader, IconButton } from '../components/ui';

const motion = _motion as any;

export const Profile: React.FC = () => {
  const setActiveTab = useUIStore((s) => s.setActiveTab);
  const [showSettings, setShowSettings] = useState(false);

  const handleOpenSettings = () => {
    AudioGraph.getInstance().playTickSound();
    setShowSettings(true);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'راوا | دستیار هوشمند سفر',
          text: 'رفیق، این اپلیکیشن راوا رو ببین، کل سفر استانبول/دبی منو ردیف کرد!',
          url: window.location.origin,
        });
      } catch {
        // noop
      }
    }
  };

  return (
    <div className="page-pad h-full overflow-y-auto bg-rava-bg pt-0 no-scrollbar scroll-smooth selection:bg-rava-gold/30">
      <div className="sticky top-0 z-[100] border-b border-white/[0.03] bg-black/40 py-5 pt-safe backdrop-blur-xl">
        <PageHeader
          title="حساب کاربری"
          subtitle="مسافر تاییدشده · راوا"
          onBack={() => setActiveTab('home')}
          backLabel="بازگشت به نقشه"
          action={
            <div className="flex items-center gap-2">
              <IconButton icon={Share2} label="اشتراک‌گذاری" size="sm" onClick={handleShare} />
              <IconButton icon={Settings} label="تنظیمات" size="sm" onClick={handleOpenSettings} />
            </div>
          }
          className="mb-0"
        />
      </div>

      <div className="mt-6 space-y-8">
        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <ProfileHeader />
        </motion.section>

        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.6 }} className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2 text-rava-xs font-black tracking-[0.2em] text-white/35">
              <Crown size={12} className="text-rava-gold" /> پاسپورت هوشمند
            </div>
            <div className="ms-6 h-px flex-1 bg-gradient-to-l from-white/5 to-transparent" />
          </div>
          <PassportCard />
        </motion.section>

        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.6 }}>
          <TravelPersona />
        </motion.section>

        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.6 }}>
          <ActionMenu />
        </motion.section>

        <footer className="flex flex-col items-center gap-4 pb-4 pt-6 text-center opacity-15">
          <div className="flex gap-1.5">
            <div className="h-1.5 w-8 rounded-full bg-rava-gold" />
            <div className="h-1.5 w-1.5 rounded-full bg-white" />
            <div className="h-1.5 w-1.5 rounded-full bg-white" />
          </div>
          <p className="text-rava-xs font-black tracking-[0.35em] text-white">راوا · هسته v3.5</p>
        </footer>
      </div>

      <AnimatePresence>{showSettings && <SystemSettingsModal onClose={() => setShowSettings(false)} />}</AnimatePresence>
    </div>
  );
};
