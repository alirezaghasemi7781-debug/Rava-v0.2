import React from 'react';
import { motion as _motion, AnimatePresence } from 'framer-motion';
import { X, Hand } from 'lucide-react';
import { useUIStore } from '../../../store/useUIStore';

const motion = _motion as any;
const OFFSET = 78;

interface ControlActionsProps {
  onDisconnect: () => void;
  onInterrupt: () => void;
}

export const ControlActions: React.FC<ControlActionsProps> = ({ onDisconnect, onInterrupt }) => {
  const isRecording = useUIStore((s) => s.isRecording);
  const isSpeaking = useUIStore((s) => s.isSpeaking);

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <AnimatePresence>
        {isSpeaking && (
          <motion.button
            key="interrupt"
            initial={{ opacity: 0, x: 0, scale: 0.6 }}
            animate={{ opacity: 1, x: OFFSET, scale: 1 }}
            exit={{ opacity: 0, x: 0, scale: 0.6 }}
            onClick={onInterrupt}
            className="absolute flex min-h-tap min-w-tap flex-col items-center justify-center rounded-rava-xl border border-white/20 bg-indigo-600 px-2 text-white shadow-glass transition-all active:scale-90 pointer-events-auto"
            aria-label="قطع پاسخ راوا"
          >
            <Hand size={16} />
            <span className="mt-1 text-rava-xs font-black">بزن وسطش</span>
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isRecording && (
          <motion.button
            key="disconnect"
            initial={{ opacity: 0, x: 0, scale: 0.6 }}
            animate={{ opacity: 1, x: -OFFSET, scale: 1 }}
            exit={{ opacity: 0, x: 0, scale: 0.6 }}
            onClick={onDisconnect}
            className="absolute flex min-h-tap min-w-tap flex-col items-center justify-center rounded-rava-xl border border-rava-danger/40 bg-rava-danger/15 px-2 text-rava-danger shadow-glass transition-all active:scale-90 pointer-events-auto"
            aria-label="قطع مکالمه"
          >
            <X size={16} />
            <span className="mt-1 text-rava-xs font-black">قطع تماس</span>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
};
