import React, { useState } from 'react';
import { motion as _motion } from 'framer-motion';
import { Globe, MapPin, Sparkles } from 'lucide-react';
import { useUserStore } from '../../store/useUserStore';
import { PassportPage } from '../social/PassportPage';
import { AudioGraph } from '../../services/audioGraph';

const motion = _motion as any;

export const PassportCard: React.FC = () => {
  const { wallet } = useUserStore();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => {
          AudioGraph.getInstance().playTickSound();
          setOpen(true);
        }}
        className="relative h-64 w-full text-left bg-[#111] rounded-[3.5rem] overflow-hidden border border-white/10 shadow-2xl group selection:bg-yellow-500/30 active:scale-[0.99] transition-transform"
      >
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage:
              'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
            backgroundSize: '24px 24px',
          }}
        />

        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-yellow-500/5 to-transparent pointer-events-none" />

        <div className="relative h-full p-8 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-yellow-500 shadow-lg">
                <Globe size={24} />
              </div>
              <div className="text-right">
                <h4 className="text-white font-black text-lg uppercase tracking-wider leading-none">
                  DIGITAL PASSPORT
                </h4>
                <p className="text-yellow-500/50 text-[7px] font-black uppercase tracking-[0.4em] mt-1.5">
                  Rava / راوا Digital ID
                </p>
              </div>
            </div>

            <div className="w-10 h-14 bg-white/5 rounded-lg border border-white/10 flex flex-col items-center justify-center gap-1 opacity-40">
              <div className="w-6 h-0.5 bg-white/20 rounded-full" />
              <div className="w-4 h-0.5 bg-white/20 rounded-full" />
              <div className="w-5 h-0.5 bg-white/20 rounded-full" />
            </div>
          </div>

          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
            {wallet.stamps.length === 0 ? (
              <div className="w-full flex items-center justify-center py-4 border border-dashed border-white/10 rounded-2xl opacity-20">
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">
                  No Active Visas Found
                </span>
              </div>
            ) : (
              wallet.stamps.slice(0, 4).map((stamp, i) => (
                <motion.div
                  key={stamp.id}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: i * 0.1 }}
                  className="w-20 h-20 shrink-0 rounded-2xl bg-white/[0.03] border border-white/10 flex flex-col items-center justify-center p-2 relative"
                >
                  <div className="absolute top-1.5 left-1.5 w-1.5 h-1.5 rounded-full bg-indigo-500/30" />
                  <MapPin size={20} className="text-white/20 mb-1" />
                  <span className="text-[8px] font-black text-white/80 text-center leading-tight truncate w-full px-1">
                    {stamp.placeName}
                  </span>
                </motion.div>
              ))
            )}
            {wallet.stamps.length > 4 && (
              <div className="w-20 h-20 shrink-0 rounded-2xl glass border-yellow-500/20 flex items-center justify-center text-yellow-500 font-black text-xs shadow-lg">
                +{wallet.stamps.length - 4}
              </div>
            )}
          </div>

          <div className="flex justify-between items-center opacity-40">
            <Sparkles size={14} className="text-yellow-500" />
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
              <span className="text-[9px] font-black text-white tracking-widest uppercase">
                Tap to open · راوا
              </span>
            </div>
          </div>
        </div>
      </button>

      {open && (
        <div className="fixed inset-0 z-[6000] bg-black/95 backdrop-blur-3xl overflow-y-auto no-scrollbar p-4 pb-24">
          <button
            onClick={() => setOpen(false)}
            className="sticky top-4 z-10 mb-4 px-4 py-2 rounded-2xl glass text-white/60 text-[10px] font-black uppercase tracking-widest"
          >
            بستن
          </button>
          <PassportPage />
        </div>
      )}
    </>
  );
};
