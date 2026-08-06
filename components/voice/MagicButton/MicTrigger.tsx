import React from 'react';
import { motion as _motion } from 'framer-motion';
import { Mic, Loader2, AudioWaveform as Waveform } from 'lucide-react';
import { useUIStore } from '../../../store/useUIStore';

const motion = _motion as any;

interface MicTriggerProps {
  onStart: () => void;
}

export const MicTrigger: React.FC<MicTriggerProps> = ({ onStart }) => {
  const isRecording = useUIStore((s) => s.isRecording);
  const isConnecting = useUIStore((s) => s.isConnecting);
  const isSpeaking = useUIStore((s) => s.isSpeaking);

  const buttonStyles = isRecording
    ? isSpeaking
      ? 'bg-blue-600 ring-2 ring-blue-500/20'
      : 'bg-white/5 ring-2 ring-white/5'
    : 'bg-rava-gold ring-4 ring-rava-gold/10 pulse-gold';

  return (
    <motion.button
      onClick={isRecording ? undefined : onStart}
      disabled={isConnecting}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.95 }}
      className={`relative z-10 flex h-16 w-16 items-center justify-center rounded-full shadow-glass transition-all duration-500 pointer-events-auto ${buttonStyles}`}
      aria-label="شروع مکالمه با راوا"
    >
      {isConnecting ? (
        <Loader2 size={24} className="animate-spin text-black" />
      ) : isRecording ? (
        <div className="flex items-center gap-1">
          {isSpeaking ? (
            <Waveform size={20} className="animate-pulse text-white" />
          ) : (
            <div className="h-1.5 w-1.5 animate-ping rounded-full bg-rava-danger" />
          )}
        </div>
      ) : (
        <Mic size={24} className="text-black" />
      )}
    </motion.button>
  );
};
