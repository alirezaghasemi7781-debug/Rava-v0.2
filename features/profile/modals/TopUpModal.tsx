
import React, { useState } from 'react';
import { motion as _motion, AnimatePresence } from 'framer-motion';
import { X, Zap, CreditCard, ShieldCheck, Check, Loader2, Sparkles } from 'lucide-react';
import { GlassCard } from '../../../components/core/GlassCard';
import { useSurvivalStore } from '../../../store/useSurvivalStore';
import { AudioGraph } from '../../../services/audioGraph';
import { supabase } from '../../../services/supabaseClient';

const motion = _motion as any;

const PACKAGES = [
  { id: '1h', mins: 60, price: 5, label: 'پکیج پایه', desc: 'مناسب برای گشت‌وگذار سریع' },
  { id: '5h', mins: 300, price: 20, label: 'پکیج کاشف', desc: 'محبوب‌ترین انتخاب مسافران', badge: 'Best Value' },
  { id: '10h', mins: 600, price: 35, label: 'پکیج الیت', desc: 'تجربه سفر کاملاً خودمختار' },
];

interface TopUpModalProps {
  onClose: () => void;
}

export const TopUpModal: React.FC<TopUpModalProps> = ({ onClose }) => {
  const { rates, activeCurrency } = useSurvivalStore();
  const [selectedId, setSelectedId] = useState('5h');
  const [isProcessing, setIsProcessing] = useState(false);

  const getPrice = (usdPrice: number) => {
    const rate = activeCurrency === 'AED' ? rates.AED : rates.TRY;
    const finalPrice = usdPrice * rate; // شبیه‌سازی: قیمت‌ها بر اساس نرخ ارز تبدیل می‌شوند
    const formatter = new Intl.NumberFormat('fa-IR');
    return `${formatter.format(Math.floor(finalPrice))} ${activeCurrency === 'AED' ? 'درهم' : activeCurrency === 'TRY' ? 'لیر' : 'تومان'}`;
  };

  const handleCharge = async () => {
    setIsProcessing(true);
    AudioGraph.getInstance().playTickSound();
    
    // شبیه‌ساز پرداخت و واریز اتمیک
    try {
      const pkg = PACKAGES.find(p => p.id === selectedId);
      if (!pkg) return;

      const { error } = await supabase.rpc('increment_wallet', {
        px_transaction_id: crypto.randomUUID(),
        px_amount: pkg.mins / 60.0,
        px_xp_amount: pkg.mins * 2,
        px_reward_type: 'topup',
      });

      if (error) throw error;

      AudioGraph.getInstance().playCoinSound();
      setTimeout(onClose, 1500);
    } catch (e) {
      alert("خطا در برقراری ارتباط با درگاه بانکی");
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[6000] bg-black/95 backdrop-blur-3xl flex items-center justify-center p-6">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-sm">
        <GlassCard className="border-white/10 p-8 rounded-[4rem] relative overflow-hidden">
          <button onClick={onClose} className="absolute top-8 left-8 text-white/20"><X size={24} /></button>

          <div className="flex flex-col items-center gap-2 mb-8">
            <div className="w-16 h-16 bg-green-500/10 rounded-3xl flex items-center justify-center text-green-500 border border-green-500/20 shadow-[0_0_30px_rgba(34,197,94,0.1)]">
              <Zap size={32} fill="currentColor" />
            </div>
            <h3 className="text-2xl font-black text-white">شارژ سوخت الیت</h3>
            <p className="text-white/30 text-[10px] font-bold uppercase tracking-[0.2em]">Purchase Talking Time</p>
          </div>

          <div className="space-y-3">
            {PACKAGES.map((pkg) => (
              <button 
                key={pkg.id} 
                onClick={() => setSelectedId(pkg.id)}
                className={`w-full relative p-5 rounded-[2rem] border transition-all duration-500 flex items-center justify-between overflow-hidden group ${
                  selectedId === pkg.id ? 'bg-yellow-500 border-yellow-500 text-black shadow-2xl' : 'bg-white/[0.02] border-white/5 text-white hover:border-white/10'
                }`}
              >
                {pkg.badge && (
                   <span className={`absolute top-0 right-10 px-3 py-1 rounded-b-xl text-[7px] font-black uppercase tracking-tighter ${selectedId === pkg.id ? 'bg-black text-yellow-500' : 'bg-yellow-500 text-black'}`}>
                     {pkg.badge}
                   </span>
                )}
                
                <div className="text-right">
                  <h4 className="font-black text-sm">{pkg.label}</h4>
                  <p className={`text-[9px] font-bold mt-0.5 ${selectedId === pkg.id ? 'text-black/60' : 'text-white/20'}`}>{pkg.desc}</p>
                </div>

                <div className="flex flex-col items-end">
                   <div className="flex items-center gap-1.5">
                     <span className="text-lg font-black leading-none">{pkg.mins}</span>
                     <span className="text-[8px] font-black uppercase tracking-widest mt-1 opacity-60">Min</span>
                   </div>
                   <span className={`text-[10px] font-bold mt-1.5 ${selectedId === pkg.id ? 'text-black/80' : 'text-yellow-500/80'}`}>
                     {getPrice(pkg.price)}
                   </span>
                </div>
              </button>
            ))}
          </div>

          <div className="mt-8 space-y-4">
             <div className="flex items-center justify-center gap-2 text-white/20">
                <ShieldCheck size={14} />
                <span className="text-[9px] font-black uppercase tracking-widest">Secure Payment Gateway</span>
             </div>
             
             <button 
                onClick={handleCharge} disabled={isProcessing}
                className="w-full bg-white text-black py-6 rounded-[2.2rem] font-black text-xl flex items-center justify-center gap-4 shadow-[0_20px_50px_rgba(255,255,255,0.1)] active:scale-95 transition-all"
              >
                {isProcessing ? (
                  <Loader2 size={24} className="animate-spin" />
                ) : (
                  <>
                    <span className="mt-1">تایید و پرداخت</span>
                    <CreditCard size={24} />
                  </>
                )}
             </button>
          </div>
        </GlassCard>
      </motion.div>
    </div>
  );
};
