import React from 'react';
import { motion as _motion, AnimatePresence } from 'framer-motion';
import { Zap, Sparkles } from 'lucide-react';
import { useUIStore } from '../../store/useUIStore';

const motion = _motion as any;

export const RewardToast: React.FC = () => {
  const rewardNotify = useUIStore((s) => s.rewardNotify);

  return (
    <AnimatePresence>
      {rewardNotify?.show && (
        <motion.div
          initial={{ opacity: 0, y: -50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9, y: -20 }}
          className="pointer-events-none fixed inset-x-6 top-24 z-[6000] pt-safe"
        >
          <div className="glass flex items-center gap-4 rounded-rava-xl border-rava-gold/40 bg-rava-gold/90 p-6 shadow-[0_20px_60px_rgba(234,179,8,0.4)]">
            <div className="flex h-14 w-14 items-center justify-center rounded-rava-lg bg-black text-rava-gold shadow-xl">
              <Zap size={28} fill="currentColor" />
            </div>
            <div className="flex-1 text-right">
              <p className="flex items-center justify-end gap-1 text-rava-xs font-black uppercase tracking-tighter text-black">
                Reward Received <Sparkles size={10} />
              </p>
              <h4 className="text-rava-lg font-black leading-tight text-black">{rewardNotify.amount} واریز شد!</h4>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
