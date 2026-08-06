
import React from 'react';
import { motion as _motion, AnimatePresence } from 'framer-motion';
import { X, Brain, Sparkles, Trash2, Info } from 'lucide-react';
import { GlassCard } from '../../../components/core/GlassCard';
import { useAuthStore } from '../../../store/useAuthStore';

const motion = _motion as any;

interface SemanticBrainModalProps {
  onClose: () => void;
}

export const SemanticBrainModal: React.FC<SemanticBrainModalProps> = ({ onClose }) => {
  const { semanticProfile, removeSemanticTag } = useAuthStore();

  const sections = [
    { key: 'food_preferences', label: 'ذائقه غذایی', color: 'bg-orange-500/10 text-orange-400' },
    { key: 'dislikes', label: 'خط قرمزها و تنفرات', color: 'bg-red-500/10 text-red-400' },
  ];

  return (
    <div className="fixed inset-0 z-[6000] bg-black/95 backdrop-blur-3xl flex items-center justify-center p-6">
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <GlassCard className="border-white/5 p-8 rounded-[4rem] relative overflow-hidden">
          <div className="absolute top-[-20px] right-[-20px] opacity-5"><Brain size={150} className="text-indigo-500" /></div>
          <button onClick={onClose} className="absolute top-6 left-6 text-white/20"><X /></button>

          <div className="flex flex-col items-center gap-2 mb-10 relative z-10">
            <div className="w-16 h-16 bg-indigo-600 rounded-3xl flex items-center justify-center text-white shadow-2xl shadow-indigo-600/30">
              <Sparkles size={32} />
            </div>
            <h3 className="text-2xl font-black text-white">مغزِ راوا</h3>
            <p className="text-white/30 text-[10px] font-bold uppercase tracking-[0.3em]">AI Semantic Context Viewer</p>
          </div>

          <div className="space-y-8 text-right relative z-10">
            <div className="bg-indigo-500/5 border border-indigo-500/10 p-5 rounded-3xl flex items-start gap-4">
               <Info size={20} className="text-indigo-400 shrink-0" />
               <p className="text-[10px] text-white/50 leading-relaxed font-bold">
                 رفیق، اینجا تگ‌هایی که راوا در طول مکالمات در مورد شخصیت تو یاد گرفته رو می‌بینی. اگه راوا در موردت اشتباه فکر می‌کنه، تگ غلط رو پاک کن تا رفتارش فوراً اصلاح بشه.
               </p>
            </div>

            {sections.map(section => {
              const tags = (semanticProfile as any)[section.key] || [];
              return (
                <div key={section.key} className="space-y-4">
                  <h4 className="text-white/40 text-xs font-black mr-2">{section.label}</h4>
                  <div className="flex flex-wrap gap-2 justify-end">
                    {tags.length === 0 ? (
                      <span className="text-white/10 text-[10px] font-bold italic">هنوز چیزی یاد نگرفته...</span>
                    ) : (
                      tags.map((tag: string) => (
                        <div key={tag} className={`flex items-center gap-2 px-4 py-2 rounded-2xl border border-white/5 ${section.color}`}>
                          <button onClick={() => removeSemanticTag(section.key as any, tag)} className="hover:text-white transition-colors">
                            <Trash2 size={12} />
                          </button>
                          <span className="text-xs font-black">{tag}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <button onClick={onClose} className="w-full mt-10 bg-white/5 border border-white/10 py-4 rounded-3xl text-white font-black text-sm active:scale-95 transition-all">بسیار خب</button>
        </GlassCard>
      </motion.div>
    </div>
  );
};
