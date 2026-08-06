import React, { useState } from 'react';
import { motion as _motion } from 'framer-motion';
import { Mail, Loader2, ChevronRight, CheckCircle2 } from 'lucide-react';
import { useAuthStore } from '../../../store/useAuthStore';
import { AudioGraph } from '../../../services/audioGraph';

const motion = _motion as any;

interface ForgotPasswordStepProps {
  email: string;
  onEmailChange: (val: string) => void;
  onBack: () => void;
}

export const ForgotPasswordStep: React.FC<ForgotPasswordStepProps> = ({
  email,
  onEmailChange,
  onBack,
}) => {
  const resetPassword = useAuthStore((s) => s.resetPassword);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes('@')) {
      setError('ایمیلت رو درست وارد کن.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await resetPassword(email);
      if (!result.success) {
        setError(result.message || 'خطا در ارسال ایمیل.');
        AudioGraph.haptic([50, 30, 50]);
      } else {
        setSent(true);
        AudioGraph.getInstance().playTickSound();
      }
    } catch {
      setError('ارتباط با سرور برقرار نشد.');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 20 }}
        className="space-y-8 text-center"
      >
        <div className="w-16 h-16 mx-auto rounded-3xl bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-500">
          <CheckCircle2 size={32} />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-black text-white">ایمیل ارسال شد</h2>
          <p className="text-white/40 text-xs font-bold leading-relaxed">
            لینک بازیابی رمز به{' '}
            <span className="text-white/70 font-mono" dir="ltr">
              {email}
            </span>{' '}
            فرستاده شد. اینباکس و اسپم رو چک کن.
          </p>
        </div>
        <button
          type="button"
          onClick={onBack}
          className="w-full bg-white text-black py-5 rounded-[1.5rem] font-black text-lg active:scale-[0.98] transition-all"
        >
          بازگشت به ورود
        </button>
      </motion.div>
    );
  }

  return (
    <motion.form
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      onSubmit={handleSubmit}
      className="space-y-8"
    >
      <div className="text-right space-y-3">
        <div className="flex justify-between items-center flex-row-reverse">
          <h2 className="text-2xl font-black text-white">بازیابی رمز</h2>
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1 text-[9px] font-black text-white/20 uppercase hover:text-yellow-500/60 transition-colors"
          >
            <span>بازگشت</span>
            <ChevronRight size={12} />
          </button>
        </div>
        <p className="text-white/40 text-xs font-bold leading-relaxed">
          لینک تنظیم رمز جدید برات ایمیل می‌شه.
        </p>
      </div>

      <div className="relative group">
        <input
          type="email"
          required
          dir="ltr"
          value={email}
          onChange={(e) => onEmailChange(e.target.value)}
          placeholder="example@mail.com"
          className="w-full bg-white/[0.02] border border-white/10 rounded-[1.5rem] py-5 px-6 text-white text-left outline-none focus:border-yellow-500/40 focus:bg-white/[0.05] transition-all font-mono text-sm ltr-island min-h-[52px]"
        />
        <Mail
          className="absolute end-5 top-1/2 -translate-y-1/2 text-white/10 group-focus-within:text-yellow-500/40 transition-colors pointer-events-none"
          size={18}
        />
      </div>

      {error && (
        <p className="text-red-400 text-[10px] font-bold text-right">{error}</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-yellow-500 text-black py-5 rounded-[1.5rem] font-black text-lg flex items-center justify-center gap-3 shadow-xl active:scale-[0.98] transition-all disabled:opacity-50"
      >
        {loading ? (
          <Loader2 className="animate-spin" size={20} />
        ) : (
          <span>ارسال لینک بازیابی</span>
        )}
      </button>
    </motion.form>
  );
};
