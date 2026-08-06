
import React, { useState } from 'react';
import { motion as _motion, AnimatePresence } from 'framer-motion';
import { X, Gift, Share2, Copy, Check, Loader2, Sparkles, UserPlus } from 'lucide-react';
import { GlassCard } from '../../../components/core/GlassCard';
import { useUserStore } from '../../../store/useUserStore';
import { AudioGraph } from '../../../services/audioGraph';

const motion = _motion as any;

interface ReferralModalProps {
  onClose: () => void;
}

export const ReferralModal: React.FC<ReferralModalProps> = ({ onClose }) => {
  const { wallet, claimReferral } = useUserStore();
  const [code, setCode] = useState('');
  const [claiming, setClaiming] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!wallet.referralCode) return;
    navigator.clipboard.writeText(wallet.referralCode);
    setCopied(true);
    AudioGraph.getInstance().playTickSound();
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'دعوت‌نامه اختصاصی راوا',
          text: `رفیق، با این کد دعوت وارد اپلیکیشن راوا شو تا هر دومون ۳۰ دقیقه شارژ هوش مصنوعی هدیه بگیریم! کد من: ${wallet.referralCode}`,
          url: window.location.origin
        });
      } catch (e) {}
    }
  };

  const handleClaim = async () => {
    if (!code.trim()) return;
    setClaiming(true);
    try {
      await claimReferral(code.trim());
      alert("ایول! ۳۰ دقیقه شارژ هدیه به حسابت واریز شد.");
      onClose();
    } catch (e: any) {
      alert(e.message || "کد نامعتبر است.");
    } finally {
      setClaiming(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[6000] bg-black/95 backdrop-blur-3xl flex items-center justify-center p-6">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-sm">
        <GlassCard className="border-yellow-500/20 p-8 rounded-[4rem] relative overflow-hidden bg-gradient-to-br from-yellow-500/5 to-transparent">
          <div className="absolute top-[-20px] right-[-20px] opacity-10 rotate-12"><Gift size={150} className="text-yellow-500" /></div>
          <button onClick={onClose} className="absolute top-6 left-6 text-white/20"><X /></button>

          <div className="flex flex-col items-center gap-3 mb-10 relative z-10">
            <div className="w-16 h-16 bg-yellow-500 rounded-3xl flex items-center justify-center text-black shadow-2xl shadow-yellow-500/20">
              <UserPlus size={32} />
            </div>
            <h3 className="text-2xl font-black text-white">دعوت از رفقا</h3>
            <p className="text-yellow-500 text-[9px] font-black tracking-[0.2em]">برنامه دعوت ویژه</p>
          </div>

          <div className="space-y-8 relative z-10">
            {/* بخش کد خود کاربر */}
            <div className="space-y-4">
              <h4 className="text-white/40 text-[10px] font-black tracking-widest text-center">کد دعوت اختصاصی شما</h4>
              <div className="glass p-6 rounded-[2.5rem] border-yellow-500/20 flex flex-col items-center gap-4 bg-white/[0.02]">
                 <span className="text-4xl font-black tracking-[0.3em] text-white font-mono uppercase ltr-island" dir="ltr">{wallet.referralCode || '------'}</span>
                 <div className="flex gap-3 w-full">
                    <button 
                      type="button"
                      onClick={handleCopy}
                      className="flex-1 min-h-[44px] bg-white/5 py-3 rounded-2xl flex items-center justify-center gap-2 text-white/60 text-[10px] font-black active:scale-95 transition-all"
                    >
                      {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                      {copied ? 'کپی شد' : 'کپی کد'}
                    </button>
                    <button 
                      type="button"
                      onClick={handleShare}
                      className="flex-1 min-h-[44px] bg-yellow-500 py-3 rounded-2xl flex items-center justify-center gap-2 text-black text-[10px] font-black active:scale-95 transition-all"
                    >
                      <Share2 size={14} /> اشتراک‌گذاری
                    </button>
                 </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
               <div className="h-px flex-1 bg-white/5" />
               <span className="text-white/10 font-black text-[9px] tracking-widest">یا</span>
               <div className="h-px flex-1 bg-white/5" />
            </div>

            {/* بخش وارد کردن کد معرف */}
            {!wallet.isReferred ? (
              <div className="space-y-4">
                <h4 className="text-white/40 text-[10px] font-black tracking-widest text-center">کد معرف داری؟</h4>
                <div className="relative">
                  <input 
                    placeholder="کد دعوت رو اینجا بزن..."
                    dir="ltr"
                    value={code} onChange={e => setCode(e.target.value.toUpperCase())}
                    className="w-full min-h-[52px] bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-center text-white font-mono font-black uppercase outline-none focus:border-yellow-500/40 transition-all ltr-island"
                  />
                  <button 
                    type="button"
                    onClick={handleClaim} disabled={claiming || !code}
                    className="w-full mt-3 min-h-[44px] bg-white text-black py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-30"
                  >
                    {claiming ? <Loader2 size={16} className="animate-spin" /> : <><Sparkles size={16} /> ثبت کد و دریافت جایزه</>}
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-2xl text-center">
                 <p className="text-green-500 font-black text-[10px] uppercase">شما قبلاً پاداش دعوت را دریافت کرده‌اید ✨</p>
              </div>
            )}
          </div>
        </GlassCard>
      </motion.div>
    </div>
  );
};
