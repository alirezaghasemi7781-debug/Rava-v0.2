import React from 'react';
import { WifiOff, CloudOff } from 'lucide-react';
import { motion as _motion, AnimatePresence } from 'framer-motion';
import { useUserStore } from '../../store/useUserStore';

const motion = _motion as any;

export const OfflineIndicator: React.FC = () => {
  const isOnline = useUserStore((s) => s.isOnline);

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.85 }}
          className="glass flex min-h-tap items-center gap-2 rounded-full border-rava-danger/30 bg-rava-danger/10 px-3 py-1.5"
        >
          <div className="relative">
            <WifiOff size={14} className="text-rava-danger" />
            <motion.div
              animate={{ opacity: [0, 1, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="absolute inset-0 text-red-400"
            >
              <CloudOff size={14} />
            </motion.div>
          </div>
          <span className="text-rava-xs font-black text-rava-danger">حالت آفلاین</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
