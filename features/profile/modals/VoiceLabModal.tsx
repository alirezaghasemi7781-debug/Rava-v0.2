
import React from 'react';
import { motion as _motion } from 'framer-motion';
import { X, Mic2, Play, Check, Headphones } from 'lucide-react';
import { GlassCard } from '../../../components/core/GlassCard';
import { useAuthStore } from '../../../store/useAuthStore';
import { AudioGraph } from '../../../services/audioGraph';

const motion = _motion as any;

const VOICES = [
  { id: 'Kore', name: 'کُور (مردانه - صمیمی)', desc: 'صدای گرم و محاوره‌ای' },
  { id: 'Zephyr', name: 'زفیر (زنانه - باوقار)', desc: 'صدای آرام و شمرده' },
  { id: 'Puck', name: 'پاک (شاداب)', desc: 'انرژی بالا برای ماجراجویی' },
];

interface VoiceLabModalProps {
  onClose: () => void;
}

export const VoiceLabModal: React.FC<VoiceLabModalProps> = ({ onClose }) => {
  const { semanticProfile, updateVoiceSettings } = useAuthStore();
  const currentVoice = semanticProfile.voice_config?.voiceName || 'Kore';
  const currentRate = semanticProfile.voice_config?.speechRate || 0.8;

  const handleSelect = (id: string) => {
    updateVoiceSettings(id, currentRate);
    AudioGraph.getInstance().playTickSound();
  };

  const handleRateChange = (rate: number) => {
    updateVoiceSettings(currentVoice, rate);
  };

  return (
    <div className="fixed inset-0 z-[6000] bg-black/95 backdrop-blur-3xl flex items-center justify-center p-6">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-sm">
        <GlassCard className="border-white/5 p-8 rounded-[4rem]">
          <button onClick={onClose} className="absolute top-6 left-6 text-white/20"><X /></button>

          <div className="flex flex-col items-center gap-2 mb-10">
            <div className="w-16 h-16 bg-yellow-500 rounded-3xl flex items-center justify-center text-black shadow-2xl">
              <Headphones size={32} />
            </div>
            <h3 className="text-2xl font-black text-white">لابراتوار حنجره</h3>
            <p className="text-white/30 text-[10px] font-bold tracking-widest">تنظیم صدای راوا</p>
          </div>

          <div className="space-y-6 text-right">
            <h4 className="text-white/40 text-xs font-black mr-2 uppercase tracking-widest">انتخاب پرسونا</h4>
            <div className="space-y-3">
              {VOICES.map(voice => (
                <button 
                  key={voice.id} onClick={() => handleSelect(voice.id)}
                  className={`w-full flex items-center justify-between p-5 rounded-3xl border transition-all ${currentVoice === voice.id ? 'bg-yellow-500/10 border-yellow-500/40' : 'bg-white/5 border-white/5 opacity-50'}`}
                >
                  {currentVoice === voice.id ? <Check className="text-yellow-500" size={20} /> : <Play className="text-white/20" size={16} />}
                  <div className="text-right">
                    <span className="text-white font-black text-sm block">{voice.name}</span>
                    <span className="text-white/40 text-[10px] font-bold">{voice.desc}</span>
                  </div>
                </button>
              ))}
            </div>

            <div className="pt-6 space-y-6">
              <div className="flex justify-between items-center px-2">
                <span className="text-yellow-500 font-mono font-black">{currentRate}x</span>
                <h4 className="text-white/40 text-xs font-black uppercase tracking-widest">سرعت صحبت</h4>
              </div>
              <input 
                type="range" min="0.5" max="1.5" step="0.1" 
                value={currentRate} onChange={e => handleRateChange(parseFloat(e.target.value))}
                className="w-full accent-yellow-500 bg-white/5 h-2 rounded-full appearance-none cursor-pointer"
              />
              <div className="flex justify-between px-1 text-[8px] font-black text-white/10 uppercase tracking-tighter">
                <span>Fast</span>
                <span>Normal</span>
                <span>Relaxed</span>
              </div>
            </div>

            <button onClick={onClose} className="w-full bg-white text-black py-5 rounded-3xl font-black text-lg shadow-xl active:scale-95 transition-all mt-4">بسیار خب</button>
          </div>
        </GlassCard>
      </motion.div>
    </div>
  );
};
