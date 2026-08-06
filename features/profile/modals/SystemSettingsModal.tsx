import React, { useState, useEffect } from 'react';
import { motion as _motion } from 'framer-motion';
import { X, Settings, Database, Trash2, Globe, Check, Loader2, Languages } from 'lucide-react';
import { GlassCard } from '../../../components/core/GlassCard';
import { useSurvivalStore } from '../../../store/useSurvivalStore';
import { useAuthStore } from '../../../store/useAuthStore';
import { AudioGraph } from '../../../services/audioGraph';

const motion = _motion as any;

interface SystemSettingsModalProps {
  onClose: () => void;
}

export const SystemSettingsModal: React.FC<SystemSettingsModalProps> = ({ onClose }) => {
  const { activeCurrency, setActiveCurrency } = useSurvivalStore();
  const { semanticProfile, updatePreference } = useAuthStore();
  const [cacheSize, setCacheSize] = useState<string>('...');
  const [clearing, setClearing] = useState(false);
  const language = semanticProfile.language || 'fa';

  useEffect(() => {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      navigator.storage.estimate().then(estimate => {
        const sizeMB = (estimate.usage || 0) / (1024 * 1024);
        setCacheSize(sizeMB.toFixed(1) + ' MB');
      });
    }
  }, []);

  const handleClearCache = async () => {
    setClearing(true);
    AudioGraph.haptic([50, 100, 50]);
    
    try {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => caches.delete(name)));
      setTimeout(() => {
        setCacheSize('0.0 MB');
        setClearing(false);
      }, 1500);
    } catch (e) {
      setClearing(false);
    }
  };

  const currencies: { id: 'IRT' | 'TRY' | 'AED'; label: string; desc: string }[] = [
    { id: 'IRT', label: 'تومان (ایران)', desc: 'نمایش تمام قیمت‌ها به واحد وطن' },
    { id: 'TRY', label: 'لیر (ترکیه)', desc: 'مناسب برای مسافران استانبول' },
    { id: 'AED', label: 'درهم (امارات)', desc: 'مناسب برای مسافران دبی' },
  ];

  const languages: { id: 'fa' | 'en'; label: string; desc: string }[] = [
    { id: 'fa', label: 'فارسی', desc: 'رابط و پاسخ‌های پیش‌فرض فارسی' },
    { id: 'en', label: 'English', desc: 'Prefer English UI cues where available' },
  ];

  return (
    <div className="fixed inset-0 z-[6000] bg-black/95 backdrop-blur-3xl flex items-center justify-center p-6">
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">
        <GlassCard className="border-white/10 p-8 rounded-[4rem]">
          <button onClick={onClose} className="absolute top-8 left-8 text-white/20 active:scale-90 transition-transform">
            <X size={24} />
          </button>

          <div className="flex flex-col items-center gap-2 mb-10">
            <div className="w-16 h-16 bg-white/5 rounded-3xl flex items-center justify-center text-white border border-white/10 shadow-2xl">
              <Settings size={32} />
            </div>
            <h3 className="text-2xl font-black text-white">تنظیمات سیستم</h3>
            <p className="text-white/30 text-[10px] font-bold uppercase tracking-[0.3em]">Core System Control</p>
          </div>

          <div className="space-y-10 text-right max-h-[60vh] overflow-y-auto no-scrollbar">
            <div className="space-y-4">
               <div className="flex items-center justify-between px-2">
                  <Languages size={14} className="text-yellow-500" />
                  <h4 className="text-white/40 text-[10px] font-black uppercase tracking-widest">زبان ترجیحی</h4>
               </div>
               <div className="space-y-2">
                 {languages.map(lang => (
                   <button 
                     key={lang.id}
                     onClick={() => {
                       updatePreference('language', lang.id);
                       AudioGraph.getInstance().playTickSound();
                     }}
                     className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${language === lang.id ? 'bg-yellow-500/10 border-yellow-500/40 text-white' : 'bg-white/[0.02] border-white/5 text-white/40'}`}
                   >
                     {language === lang.id ? <Check size={18} className="text-yellow-500" /> : <div className="w-4" />}
                     <div className="text-right">
                        <span className="text-xs font-black block">{lang.label}</span>
                        <span className="text-[8px] font-bold opacity-60">{lang.desc}</span>
                     </div>
                   </button>
                 ))}
               </div>
            </div>

            <div className="space-y-4">
               <div className="flex items-center justify-between px-2">
                  <Globe size={14} className="text-indigo-400" />
                  <h4 className="text-white/40 text-[10px] font-black uppercase tracking-widest">واحد پول پیش‌فرض</h4>
               </div>
               <div className="space-y-2">
                 {currencies.map(curr => (
                   <button 
                     key={curr.id} onClick={() => { setActiveCurrency(curr.id); AudioGraph.getInstance().playTickSound(); }}
                     className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${activeCurrency === curr.id ? 'bg-indigo-500/10 border-indigo-500/40 text-white' : 'bg-white/[0.02] border-white/5 text-white/40'}`}
                   >
                     {activeCurrency === curr.id ? <Check size={18} className="text-indigo-400" /> : <div className="w-4" />}
                     <div className="text-right">
                        <span className="text-xs font-black block">{curr.label}</span>
                        <span className="text-[8px] font-bold opacity-60">{curr.desc}</span>
                     </div>
                   </button>
                 ))}
               </div>
            </div>

            <div className="space-y-4">
               <div className="flex items-center justify-between px-2">
                  <Database size={14} className="text-red-400" />
                  <h4 className="text-white/40 text-[10px] font-black uppercase tracking-widest">مدیریت تاب‌آوری و حافظه</h4>
               </div>
               <div className="glass p-5 rounded-3xl border-white/5 flex items-center justify-between">
                  <button 
                    onClick={handleClearCache} disabled={clearing}
                    className="flex items-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 px-4 py-2 rounded-xl transition-colors active:scale-95"
                  >
                    {clearing ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                    <span className="text-[10px] font-black uppercase">پاکسازی</span>
                  </button>
                  <div className="text-right">
                    <span className="text-white font-black text-sm block">دیتای ذخیره شده</span>
                    <span className="text-white/20 text-[9px] font-bold">{cacheSize} اشغال شده</span>
                  </div>
               </div>
            </div>

            <button onClick={onClose} className="w-full bg-white text-black py-5 rounded-3xl font-black text-lg shadow-xl active:scale-95 transition-all">تایید نهایی</button>
          </div>
        </GlassCard>
      </motion.div>
    </div>
  );
};
