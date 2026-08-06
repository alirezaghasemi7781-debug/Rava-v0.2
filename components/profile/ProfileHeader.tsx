import React, { useState } from 'react';
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
            <svg className="h-32 w-32" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="48" className="fill-none stroke-white/[0.02]" strokeWidth="2" />
              <motion.circle
                cx="50"
                cy="50"
                r="48"
                className="fill-none stroke-rava-gold"
                strokeWidth="2"
                strokeDasharray="301.6"
                initial={{ strokeDashoffset: 301.6 }}
                animate={{ strokeDashoffset: 301.6 - (301.6 * progress) / 100 }}
                transition={{ duration: 2, ease: 'easeOut' }}
                strokeLinecap="round"
              />
            </svg>
          </div>

          <div className="relative z-10 h-24 w-24 overflow-hidden rounded-rava-xl border border-white/10 bg-gradient-to-br from-neutral-800 to-black p-0.5 shadow-2xl">
            <div className="flex h-full w-full items-center justify-center rounded-rava-lg bg-neutral-900">
              {user?.user_metadata?.avatar_url ? (
                <img src={user.user_metadata.avatar_url} className="h-full w-full object-cover" alt="User" />
              ) : (
                <User size={40} className="text-white/5" />
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowEdit(true)}
            className="absolute -bottom-1 -end-1 z-[25] rounded-rava-lg border-4 border-rava-bg bg-white p-2.5 text-black shadow-xl transition-all active:scale-90"
          >
            <Edit3 size={14} />
          </button>

          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5, type: 'spring' }}
            className="absolute -bottom-2 -start-2 z-20 rounded-rava-md border-2 border-rava-bg bg-rava-gold px-3 py-1 text-rava-xs font-black text-black shadow-xl"
          >
            LVL {level}
          </motion.div>
        </div>

        <div className="mb-8 space-y-1 text-center">
          <h2 className="text-2xl font-black tracking-tight text-white">
            {user?.user_metadata?.username || user?.email?.split('@')[0] || 'مسافر ناشناس'}
          </h2>
          <div className="flex items-center justify-center gap-1.5 text-white/30">
            <ShieldCheck size={12} className="text-blue-500/50" />
            <span className="text-rava-xs font-bold font-mono ltr-island" dir="ltr">
              {user?.email}
            </span>
          </div>
        </div>

        <div className="grid w-full grid-cols-2 gap-3">
          <div className="glass flex items-center justify-between rounded-rava-xl border-white/5 p-5 transition-all active:scale-95">
            <div className="text-right">
              <span className="block text-xl font-black leading-none text-white">{Math.floor(wallet.balance * 60)}</span>
              <span className="mt-1 block text-rava-xs font-black uppercase tracking-widest text-white/20">دقیقه شارژ</span>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-rava-lg bg-rava-gold/10 text-rava-gold">
              <Zap size={20} fill="currentColor" className="opacity-80" />
            </div>
          </div>
          <div className="glass flex items-center justify-between rounded-rava-xl border-white/5 p-5 transition-all active:scale-95">
            <div className="text-right">
              <span className="block text-xl font-black leading-none text-white">{wallet.xp}</span>
              <span className="mt-1 block text-rava-xs font-black uppercase tracking-widest text-white/20">امتیاز تجربه</span>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-rava-lg bg-indigo-500/10 text-indigo-400">
              <Star size={20} fill="currentColor" className="opacity-80" />
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>{showEdit && <IdentityModal onClose={() => setShowEdit(false)} />}</AnimatePresence>
    </>
  );
};
