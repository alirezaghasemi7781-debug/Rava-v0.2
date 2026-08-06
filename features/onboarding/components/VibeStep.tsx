import React from 'react';
import { motion as _motion } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';
import { GlassCard } from '../../../components/core/GlassCard';

const motion = _motion as any;

const VIBES = [
  { id: 'luxury', label: 'پولدار طور', icon: '🤑', desc: 'بهترین هتل‌ها و رستوران‌های خاص' },
  { id: 'budget', label: 'مفت گردی', icon: '🎒', desc: 'تجربه‌های باحال با کمترین هزینه' },
  { id: 'hidden_gem', label: 'کشف ناشناخته‌ها', icon: '🕵️', desc: 'جاهایی که توریست‌ها نمیشناسن' },
  { id: 'instagrammable', label: 'خوراک استوری', icon: '📸', desc: 'زیباترین لوکیشن‌ها برای عکاسی' },
];

interface VibeStepProps {
  selectedVibe: string | null;
  onSelect: (vibe: string) => void;
  onBack: () => void;
}

export const VibeStep: React.FC<VibeStepProps> = ({ selectedVibe, onSelect, onBack }) => (
  <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-10">
    <div className="space-y-2 text-right">
      <h1 className="rava-page-title text-4xl leading-tight">فازِ سفرت چیه؟</h1>
      <p className="rava-page-subtitle">دوست داری چطور بگذره؟</p>
    </div>

    <div className="grid max-h-[55vh] grid-cols-1 gap-4 overflow-y-auto pb-10 pe-2 no-scrollbar">
      {VIBES.map((vibe) => (
        <button key={vibe.id} type="button" onClick={() => onSelect(vibe.id)} className="w-full text-right outline-none">
          <GlassCard
            className={`flex items-center justify-between border-white/5 p-6 transition-all duration-300 active:scale-[0.98] ${
              selectedVibe === vibe.id ? 'border-rava-gold/30 bg-rava-gold/10 ring-1 ring-rava-gold/20' : 'hover:border-white/10'
            }`}
          >
            <span className="text-4xl drop-shadow-xl">{vibe.icon}</span>
            <div className="flex-1 pe-6 text-right">
              <h3 className={`text-rava-lg font-black transition-colors ${selectedVibe === vibe.id ? 'text-rava-gold' : 'text-white'}`}>
                {vibe.label}
              </h3>
              <p className="mt-1 text-rava-xs font-bold uppercase tracking-tighter text-white/30">{vibe.desc}</p>
            </div>
          </GlassCard>
        </button>
      ))}
    </div>

    <div className="flex items-center justify-between pt-4">
      <button
        type="button"
        onClick={onBack}
        className="group flex items-center gap-2 text-rava-xs font-black uppercase tracking-widest text-white/20 transition-colors hover:text-white"
      >
        <span>مرحله قبل</span>
        <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
      </button>
      <div className="flex items-center gap-2 text-rava-gold/20">
        <Sparkles size={16} />
        <div className="h-px w-8 bg-current" />
      </div>
    </div>
  </motion.div>
);
