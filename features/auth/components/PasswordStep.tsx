import React from 'react';
import { motion as _motion } from 'framer-motion';
import { Lock, Loader2, Sparkles, ChevronRight } from 'lucide-react';

const motion = _motion as any;

interface PasswordStepProps {
  email: string;
  password: string;
  mode: 'login' | 'signup';
  loading: boolean;
  onPasswordChange: (val: string) => void;
  onModeToggle: () => void;
  onForgotPassword: () => void;
  onBack: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const PasswordStep: React.FC<PasswordStepProps> = ({
  email,
  password,
  mode,
  loading,
  onPasswordChange,
  onModeToggle,
  onForgotPassword,
  onBack,
  onSubmit,
}) => (
  <motion.form
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: 20 }}
    onSubmit={onSubmit}
    className="space-y-8"
  >
    <div className="text-right space-y-3">
      <div className="flex justify-between items-center flex-row-reverse">
        <h2 className="text-2xl font-black text-white">
          {mode === 'login' ? 'ورود' : 'ثبت‌نام'}
        </h2>
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1 text-[9px] font-black text-white/20 uppercase hover:text-yellow-500/60 transition-colors"
        >
          <span>تغییر ایمیل</span>
          <ChevronRight size={12} />
        </button>
      </div>
      <p className="text-white/30 text-[10px] font-mono truncate bg-white/5 p-2 rounded-xl border border-white/5 ltr-island" dir="ltr">
        {email}
      </p>
    </div>

    <div className="relative group">
      <input
        type="password"
        required
        autoFocus
        dir="ltr"
        value={password}
        onChange={(e) => onPasswordChange(e.target.value)}
        placeholder="••••••••"
        className="w-full bg-white/[0.02] border border-white/10 rounded-[1.5rem] py-5 px-6 text-white text-left outline-none focus:border-yellow-500/40 focus:bg-white/[0.05] transition-all font-mono text-sm ltr-island min-h-[52px]"
      />
      <Lock
        className="absolute end-5 top-1/2 -translate-y-1/2 text-white/10 group-focus-within:text-yellow-500/40 transition-colors pointer-events-none"
        size={18}
      />
    </div>

    <div className="space-y-4">
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-yellow-500 text-black py-5 rounded-[1.5rem] font-black text-lg flex items-center justify-center gap-3 shadow-xl active:scale-[0.98] transition-all disabled:opacity-50"
      >
        {loading ? (
          <Loader2 className="animate-spin" size={20} />
        ) : (
          <>
            <span>{mode === 'login' ? 'بزن بریم تو' : 'تایید و شروع'}</span>
            <Sparkles size={20} className="mt-0.5" />
          </>
        )}
      </button>

      {mode === 'login' && (
        <button
          type="button"
          onClick={onForgotPassword}
          className="w-full text-yellow-500/70 font-black text-[10px] uppercase tracking-wider hover:text-yellow-500 transition-colors py-1"
        >
          رمزت رو فراموش کردی؟
        </button>
      )}

      <button
        type="button"
        onClick={onModeToggle}
        className="w-full text-white/30 font-black text-[10px] uppercase tracking-wider hover:text-white transition-colors py-2"
      >
        {mode === 'login' ? 'ساخت حساب جدید' : 'قبلاً عضو شدی؟ وارد شو'}
      </button>
    </div>
  </motion.form>
);
