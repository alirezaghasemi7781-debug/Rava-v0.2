
import React, { useState } from 'react';
import { AnimatePresence, motion as _motion } from 'framer-motion';
import { useAuthStore } from '../store/useAuthStore';
import { Sparkles, Clock, MapPin, ChevronLeft } from 'lucide-react';
import { AudioGraph } from '../services/audioGraph';
import { CityMode } from '../types';
import { ProgressIndicator } from '../features/onboarding/components/ProgressIndicator';
import { CityStep } from '../features/onboarding/components/CityStep';
import { VibeStep } from '../features/onboarding/components/VibeStep';
import { CrewStep } from '../features/onboarding/components/CrewStep';

const motion = _motion as any;

export const Onboarding: React.FC = () => {
  const { finalizeOnboarding } = useAuthStore();
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [isTravelingNow, setIsTravelingNow] = useState(true);
  const [selection, setSelection] = useState({
    city: null as CityMode,
    vibe: null as string | null,
    crew: null as string | null
  });

  const handleNext = () => {
    AudioGraph.getInstance().playTickSound();
    setStep(s => s + 1);
  };

  const handleFinalize = async () => {
    if (!selection.city || !selection.vibe || !selection.crew) return;
    setLoading(true);
    AudioGraph.getInstance().playCoinSound();
    await finalizeOnboarding({ ...selection, isTravelingNow });
  };

  return (
    <div className="fixed inset-0 z-[5000] bg-[#050505] overflow-hidden flex flex-col p-8 pt-16">
      {/* Background Ambience */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-yellow-500/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/5 blur-[120px] rounded-full" />
      </div>

      <ProgressIndicator currentStep={step} />

      <div className="relative z-10 flex-1 flex flex-col no-scrollbar overflow-y-auto">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div 
              key="step1" 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="space-y-10"
            >
              <CityStep 
                selectedCity={selection.city} 
                onSelect={(city) => setSelection({...selection, city: city as any})} 
              />
              
              {selection.city && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                  <h4 className="text-white/60 font-black text-sm text-right px-1 tracking-tight">زمان سفر شما؟</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <button 
                      onClick={() => setIsTravelingNow(true)} 
                      className={`p-6 rounded-[2rem] border transition-all duration-500 flex flex-col items-center gap-3 ${isTravelingNow ? 'bg-yellow-500 border-yellow-500 text-black shadow-lg shadow-yellow-500/20' : 'bg-white/5 border-white/5 text-white/30 hover:border-white/10'}`}
                    >
                      <MapPin size={24} className={isTravelingNow ? 'animate-bounce' : ''} />
                      <span className="font-black text-[10px] uppercase">همین الان</span>
                    </button>
                    <button 
                      onClick={() => setIsTravelingNow(false)} 
                      className={`p-6 rounded-[2rem] border transition-all duration-500 flex flex-col items-center gap-3 ${!isTravelingNow ? 'bg-yellow-500 border-yellow-500 text-black shadow-lg shadow-yellow-500/20' : 'bg-white/5 border-white/5 text-white/30 hover:border-white/10'}`}
                    >
                      <Clock size={24} />
                      <span className="font-black text-[10px] uppercase">در آینده</span>
                    </button>
                  </div>
                  <button 
                    onClick={handleNext} 
                    className="w-full bg-white text-black py-5 rounded-[2rem] font-black text-lg shadow-2xl flex items-center justify-center gap-3 active:scale-[0.98] transition-all"
                  >
                    <span>تایید و ادامه</span>
                    <ChevronLeft size={20} />
                  </button>
                </motion.div>
              )}
            </motion.div>
          )}

          {step === 2 && (
            <VibeStep 
              key="step2"
              selectedVibe={selection.vibe} 
              onSelect={(vibe) => { setSelection({...selection, vibe}); handleNext(); }} 
              onBack={() => setStep(1)} 
            />
          )}

          {step === 3 && (
            <CrewStep 
              key="step3"
              selectedCrew={selection.crew} 
              loading={loading} 
              onSelect={(crew) => setSelection({...selection, crew})} 
              onBack={() => setStep(2)} 
              onFinalize={handleFinalize} 
            />
          )}
        </AnimatePresence>
      </div>

      <div className="pt-8 flex items-center justify-center gap-3 text-white/10 uppercase tracking-[0.4em] text-[7px] font-black pointer-events-none">
        <Sparkles size={10} /> منطق هویت راوا
      </div>
    </div>
  );
};
