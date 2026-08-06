import React, { useState } from 'react';
import { motion as _motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronRight, Settings, Share2, Crown
} from 'lucide-react';
import { useUIStore } from '../store/useUIStore';
import { ProfileHeader } from '../components/profile/ProfileHeader';
import { PassportCard } from '../components/profile/PassportCard';
import { TravelPersona } from '../components/profile/TravelPersona';
import { ActionMenu } from '../components/profile/ActionMenu';
import { SystemSettingsModal } from '../features/profile/modals/SystemSettingsModal';
import { AudioGraph } from '../services/audioGraph';

const motion = _motion as any;

export const Profile: React.FC = () => {
  const setActiveTab = useUIStore(s => s.setActiveTab);
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
          url: window.location.origin
        });
      } catch (e) {}
    }
  };

  return (
    <div className="h-full bg-[#050505] overflow-y-auto no-scrollbar scroll-smooth page-pad pt-0 selection:bg-yellow-500/30">
      <div className="sticky top-0 z-[100] py-6 flex justify-between items-center bg-black/40 backdrop-blur-3xl border-b border-white/[0.03] flex-row pt-safe">
        
        <div className="flex items-center gap-3">
          <button 
            type="button"
            onClick={() => setActiveTab('home')} 
            className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-2xl glass border-yellow-500/20 flex items-center justify-center text-yellow-500 active:scale-90 transition-all bg-yellow-500/5"
            aria-label="بازگشت به نقشه"
          >
            <ChevronRight size={20} />
          </button>
          <div className="text-right">
            <h1 className="text-lg font-black text-white leading-none">حساب کاربری</h1>
            <span className="text-yellow-500 text-[8px] font-black tracking-[0.15em] mt-1 block">مسافر تأییدشده · راوا</span>
          </div>
        </div>

        <div className="flex gap-2">
           <button 
             type="button"
             onClick={handleShare}
             className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-2xl glass flex items-center justify-center text-white/40 active:scale-90 transition-all hover:text-white"
             aria-label="اشتراک‌گذاری"
           >
             <Share2 size={18} />
           </button>
           <button 
             type="button"
             onClick={handleOpenSettings}
             className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-2xl glass flex items-center justify-center text-white/40 active:scale-90 transition-all hover:text-white"
             aria-label="تنظیمات"
           >
             <Settings size={18} />
           </button>
        </div>
      </div>

      <div className="space-y-10 mt-8">
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <ProfileHeader />
        </motion.section>

        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.6 }}
          className="space-y-4"
        >
          <div className="flex items-center justify-between px-2">
             <div className="flex items-center gap-2 text-white/30 font-black text-[9px] uppercase tracking-[0.3em]">
               <Crown size={12} className="text-yellow-500" /> پاسپورت هوشمند
             </div>
             <div className="h-px flex-1 bg-gradient-to-r from-white/5 to-transparent mr-6" />
          </div>
          <PassportCard />
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.6 }}
        >
          <TravelPersona />
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          <ActionMenu />
        </motion.section>

        <footer className="text-center pt-8 pb-4 opacity-10 flex flex-col items-center gap-4">
           <div className="flex gap-1.5">
              <div className="w-8 h-1.5 rounded-full bg-yellow-500" />
              <div className="w-1.5 h-1.5 rounded-full bg-white" />
              <div className="w-1.5 h-1.5 rounded-full bg-white" />
           </div>
           <p className="text-[8px] font-black tracking-[0.4em] text-white">
             راوا · هسته v3.5
           </p>
        </footer>
      </div>

      <AnimatePresence>
        {showSettings && <SystemSettingsModal onClose={() => setShowSettings(false)} />}
      </AnimatePresence>
    </div>
  );
};
