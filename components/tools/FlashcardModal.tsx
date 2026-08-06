import React from 'react';
import { motion as _motion, AnimatePresence } from 'framer-motion';
import { X, Volume2, Languages } from 'lucide-react';
import { Flashcard } from '../../types';
import { ttsService } from '../../services/survival/ttsService';
import { useUserStore } from '../../store/useUserStore';
import { IconButton } from '../ui';

const motion = _motion as any;

interface FlashcardModalProps {
  card: Flashcard | null;
  onClose: () => void;
}

export const FlashcardModal: React.FC<FlashcardModalProps> = ({ card, onClose }) => {
  const cityMode = useUserStore((s) => s.cityMode);

  if (!card) return null;

  const handleSpeak = () => {
    const lang = cityMode === 'Istanbul' ? 'tr-TR' : 'ar-AE';
    ttsService.speak(card.local, lang);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[6000] flex flex-col justify-between bg-black p-8 pb-safe pt-safe text-center"
      >
        <div className="flex items-center justify-between">
          <div className="glass flex items-center gap-2 rounded-full border-white/10 px-4 py-2">
            <Languages size={14} className="text-rava-gold" />
            <span className="text-rava-xs font-black uppercase tracking-tighter text-white/60">Emergency Communication</span>
          </div>
          <IconButton icon={X} label="بستن" onClick={onClose} size="md" variant="solid" />
        </div>

        <div className="space-y-12">
          <div className="space-y-4">
            <p className="text-rava-lg font-bold uppercase tracking-widest text-rava-gold/60">{card.farsi}</p>
            <h2 className="text-5xl font-black leading-tight text-white md:text-7xl" dir="ltr">
              {card.local}
            </h2>
          </div>
          <div className="glass mx-auto inline-block rounded-rava-lg border-white/5 p-4">
            <p className="text-rava-sm italic text-white/40">تلفظ: {card.pronunciation}</p>
          </div>
        </div>

        <div className="mb-12 flex flex-col items-center gap-6">
          <motion.button
            type="button"
            whileTap={{ scale: 0.9 }}
            onClick={handleSpeak}
            className="flex h-32 w-32 items-center justify-center rounded-rava-modal bg-rava-gold text-black shadow-[0_20px_50px_rgba(234,179,8,0.4)]"
          >
            <Volume2 size={56} />
          </motion.button>
          <p className="text-rava-lg font-black text-white">پخش صوتی برای طرف مقابل</p>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
