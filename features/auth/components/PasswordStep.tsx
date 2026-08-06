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
    initial={{ opacity: 0, x: -16 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: 16 }}
    onSubmit={onSubmit}
    className="space-y-6"
  >
    <div className="text-right space-y-2.5">
      <div className="flex justify-between items-center">
        <h2 className="rava-page-title text-xl">
          {mode === 'login' ? 'ورود' : 'ثبت‌نام'}
        </h2>
        <button
          type="button"
          onClick={onBack}
          className="rava-btn-ghost flex items-center gap-1 px-2"
        >
          <ChevronRight size={14} />
          <span>تغییر ایمیل</span>
        </button>
      </div>
      <p className="text-white/35 text-xs font-mono truncate bg-white/[0.04] px-3 py-2 rounded-xl border border-white/5 ltr-island" dir="ltr">
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
        className="rava-input ltr-island pe-11"
      />
      <Lock
        className="absolute end-4 top-1/2 -translate-y-1/2 text-white/15 transition-colors group-focus-within:text-rava-gold/50 pointer-events-none"
        size={17}
      />
    </div>

    <div className="space-y-3">
      <button
        type="submit"
        disabled={loading}
        className="rava-btn rava-btn-primary w-full text-base"
      >
        {loading ? (
          <Loader2 className="animate-spin" size={18} />
        ) : (
          <>
            <span>{mode === 'login' ? 'بزن بریم تو' : 'تایید و شروع'}</span>
            <Sparkles size={18} />
          </>
        )}
      </button>

      {mode === 'login' && (
        <button
          type="button"
          onClick={onForgotPassword}
          className="rava-btn-ghost w-full text-rava-gold/70 hover:text-rava-gold"
        >
          رمزت رو فراموش کردی؟
        </button>
      )}

      <button
        type="button"
        onClick={onModeToggle}
        className="rava-btn-ghost w-full"
      >
        {mode === 'login' ? 'ساخت حساب جدید' : 'قبلاً عضو شدی؟ وارد شو'}
      </button>
    </div>
  </motion.form>
);
