
import React, { useMemo } from 'react';
import { motion as _motion } from 'framer-motion';
import { useUIStore } from '../../../store/useUIStore';
import { useUserStore } from '../../../store/useUserStore';

const motion = _motion as any;

export const StatusRing: React.FC = () => {
  const isSpeaking = useUIStore(s => s.isSpeaking);
  const isRecording = useUIStore(s => s.isRecording);
  const balance = useUserStore(s => s.wallet.balance);
  const isOnline = useUserStore(s => s.isOnline);

  const fuelMinutes = Math.floor(balance * 60);
  const fuelPercentage = Math.min(100, (balance / 2.0) * 100); 
  
  const ringColor = useMemo(() => {
    if (!isOnline) return 'stroke-neutral-600'; // حالت آفلاین
    if (fuelMinutes > 20) return 'stroke-green-500';
    if (fuelMinutes > 5) return 'stroke-rava-gold';
    return 'stroke-red-500';
  }, [fuelMinutes, isOnline]);

  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (fuelPercentage / 100) * circumference;

  return (
    <div className="absolute inset-[-12px] pointer-events-none">
      <svg className="w-full h-full -rotate-90">
        <circle
          cx="50%" cy="50%" r="45"
          className="fill-none stroke-white/5"
          strokeWidth="4"
        />
        
        <motion.circle
          cx="50%" cy="50%" r="45"
          fill="none"
          strokeWidth="4"
          strokeLinecap="round"
          className={`transition-colors duration-1000 ${isRecording ? ringColor : 'stroke-white/10'}`}
          initial={{ strokeDasharray: circumference, strokeDashoffset: circumference }}
          animate={{ 
            strokeDashoffset,
            strokeDasharray: circumference
          }}
          transition={{ type: "spring", bounce: 0, duration: 1.5 }}
        />

        {fuelMinutes <= 5 && isRecording && isOnline && (
          <motion.circle
            cx="50%" cy="50%" r="45"
            className="fill-none stroke-red-500/30"
            strokeWidth="8"
            animate={{ opacity: [0, 0.4, 0], scale: [1, 1.05, 1] }}
            transition={{ duration: 0.8, repeat: Infinity }}
          />
        )}

        {isSpeaking && (
          <motion.circle
            cx="50%" cy="50%" r="52"
            className="fill-none stroke-blue-500/20"
            strokeWidth="1"
            animate={{ scale: [1, 1.2, 1], opacity: [0, 0.5, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        )}
      </svg>
    </div>
  );
};
