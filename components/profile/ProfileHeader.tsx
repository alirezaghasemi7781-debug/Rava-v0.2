import React, { useState } from 'react';
// Fix: Added AnimatePresence to imports
import { motion as _motion, AnimatePresence } from 'framer-motion';
import { User, Zap, Star, ShieldCheck, Edit3 } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { useUserStore } from '../../store/useUserStore';
import { IdentityModal } from '../../features/profile/modals/IdentityModal';

const motion = _motion as any;

export const ProfileHeader: React.FC = () => {
  const { user } = useAuthStore();
  const { wallet } = useUserStore();
  const [showEdit, setShowEdit] = useState(false);

  const level = Math.floor(wallet.xp / 1000) + 1;
  const progress = (wallet.xp % 1000) / 10;

  return (
    <>
      <div className="flex flex-col items-center">
        <div className="relative mb-6">
          <div className="absolute inset-[-12px] rotate-[-90deg]">
            <svg className="w-32 h-32" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="48" className="fill-none stroke-white/[0.02]" strokeWidth="2" />
              <motion.circle 
                cx="50" cy="50" r="48" 
                className="fill-none stroke-yellow-500" 
                strokeWidth="2" 
                strokeDasharray="301.6" 
                initial={{ strokeDashoffset: 301.6 }}
                animate={{ strokeDashoffset: 301.6 - (301.6 * progress / 100) }}
                transition={{ duration: 2, ease: "easeOut" }}
                strokeLinecap="round"
              />
            </svg>
          </div>
          
          <div className="w-24 h-24 rounded-[2.5rem] bg-gradient-to-br from-neutral-800 to-black p-0.5 shadow-2xl relative z-10 overflow-hidden border border-white/10">
             <div className="w-full h-full bg-neutral-900 rounded-[2.4rem] flex items-center justify-center">
               {user?.user_metadata?.avatar_url ? (
                 <img src={user.user_metadata.avatar_url} className="w-full h-full object-cover" alt="User" />
               ) : (
                 <User size={40} className="text-white/5" />
               )}
             </div>
          </div>

          <button 
            onClick={() => setShowEdit(true)}
            className="absolute -bottom-1 -right-1 z-[25] bg-white text-black p-2.5 rounded-2xl shadow-xl active:scale-90 transition-all border-4 border-[#050505]"
          >
            <Edit3 size={14} />
          </button>

          <motion.div 
            initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.5, type: 'spring' }}
            className="absolute -bottom-2 -left-2 z-20 bg-yellow-500 text-black px-3 py-1 rounded-xl text-[10px] font-black shadow-xl border-2 border-[#050505]"
          >
            LVL {level}
          </motion.div>
        </div>

        <div className="space-y-1 mb-8 text-center">
          <h2 className="text-2xl font-black text-white tracking-tight">
            {user?.user_metadata?.username || user?.email?.split('@')[0] || 'مسافر ناشناس'}
          </h2>
          <div className="flex items-center justify-center gap-1.5 text-white/30">
            <ShieldCheck size={12} className="text-blue-500/50" />
            <span className="text-[10px] font-bold font-mono ltr-island" dir="ltr">{user?.email}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 w-full">
          <div className="glass p-5 rounded-[2.2rem] border-white/5 flex items-center justify-between group active:scale-95 transition-all">
             <div className="text-right">
               <span className="text-white font-black text-xl block leading-none">{Math.floor(wallet.balance * 60)}</span>
               <span className="text-white/20 text-[8px] font-black uppercase tracking-widest mt-1 block">دقیقه شارژ</span>
             </div>
             <div className="w-10 h-10 rounded-2xl bg-yellow-500/10 flex items-center justify-center text-yellow-500">
               <Zap size={20} fill="currentColor" className="opacity-80" />
             </div>
          </div>
          <div className="glass p-5 rounded-[2.2rem] border-white/5 flex items-center justify-between group active:scale-95 transition-all">
             <div className="text-right">
               <span className="text-white font-black text-xl block leading-none">{wallet.xp}</span>
               <span className="text-white/20 text-[8px] font-black uppercase tracking-widest mt-1 block">امتیاز تجربه</span>
             </div>
             <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
               <Star size={20} fill="currentColor" className="opacity-80" />
             </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showEdit && <IdentityModal onClose={() => setShowEdit(false)} />}
      </AnimatePresence>
    </>
  );
};