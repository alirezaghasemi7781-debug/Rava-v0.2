
import React from 'react';
import { BargainCalculator } from '../components/tools/BargainCalculator';
import { FlashcardGrid } from '../components/tools/FlashcardGrid';
import { FlashcardModal } from '../components/tools/FlashcardModal';
import { SubwayMap } from '../components/tools/SubwayMap';
import { GlassCard } from '../components/core/GlassCard';
import { useSurvivalStore } from '../store/useSurvivalStore';
import { Phone, ShieldCheck } from 'lucide-react';

export const Tools: React.FC = () => {
  const { activeFlashcard, setActiveFlashcard } = useSurvivalStore();

  return (
    <div className="h-full overflow-y-auto px-6 pb-44 pt-6 space-y-12 no-scrollbar scroll-smooth">
      <div className="space-y-4">
        <div className="flex justify-between items-end px-2">
          <div className="text-right">
            <h2 className="text-3xl font-black text-white mb-1">ابزارهای بقا</h2>
            <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest">Traveler's Survival Toolkit</p>
          </div>
          <ShieldCheck size={28} className="text-yellow-500/40" />
        </div>
      </div>

      <div className="space-y-8">
        <BargainCalculator />
        <SubwayMap />
        <FlashcardGrid />
      </div>

      <div className="space-y-4">
        <h4 className="text-white/20 text-[10px] font-black uppercase tracking-widest px-2 text-right">Emergency Support</h4>
        <GlassCard className="bg-red-500/10 border-red-500/20 py-8 relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-full bg-red-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
          <div className="flex items-center justify-between mb-4 relative z-10">
            <div className="w-12 h-12 bg-red-500 rounded-2xl flex items-center justify-center text-white shadow-lg animate-pulse">
               <Phone size={24} />
            </div>
            <div className="text-right">
              <h4 className="text-red-500 font-black text-lg">پشتیبانی فوری راوا</h4>
              <span className="text-red-500/40 text-[10px] font-bold uppercase">24/7 Priority Line</span>
            </div>
          </div>
          <p className="text-white/60 text-xs leading-relaxed mb-6 text-right relative z-10">
            اگر مشکلی با پلیس یا راننده داری یا نیاز به ترجمه فوری در بیمارستان داری، رفقای ما آماده کمک هستن.
          </p>
          <button className="w-full bg-red-500 text-white font-black py-4 rounded-2xl shadow-[0_10px_30px_rgba(239,68,68,0.3)] active:scale-95 transition-all relative z-10">
            تماس اضطراری (رایگان)
          </button>
        </GlassCard>
      </div>

      <FlashcardModal 
        card={activeFlashcard} 
        onClose={() => setActiveFlashcard(null)} 
      />
    </div>
  );
};
