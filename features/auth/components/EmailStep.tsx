import React from 'react';
import { motion as _motion } from 'framer-motion';
import { Mail, LogIn, UserPlus } from 'lucide-react';

const motion = _motion as any;

interface EmailStepProps {
  email: string;
  onChange: (val: string) => void;
  onChooseLogin: () => void;
  onChooseSignUp: () => void;
}

export const EmailStep: React.FC<EmailStepProps> = ({
  email,
  onChange,
  onChooseLogin,
  onChooseSignUp,
}) => {
  const valid = email.includes('@') && email.includes('.');

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="space-y-8"
    >
      <div className="text-right space-y-2">
        <h2 className="text-2xl font-black text-white">خوش اومدی!</h2>
        <p className="text-white/40 text-xs font-bold leading-relaxed">
          ایمیلت رو بزن، بعد ورود یا ثبت‌نام رو انتخاب کن.
        </p>
      </div>

      <div className="relative group">
        <input
          type="email"
          required
          dir="ltr"
          value={email}
          onChange={(e) => onChange(e.target.value)}
          placeholder="example@mail.com"
          className="w-full bg-white/[0.02] border border-white/10 rounded-[1.5rem] py-5 px-6 text-white text-left outline-none focus:border-yellow-500/40 focus:bg-white/[0.05] transition-all font-mono text-sm ltr-island min-h-[52px]"
        />
        <Mail
          className="absolute end-5 top-1/2 -translate-y-1/2 text-white/10 group-focus-within:text-yellow-500/40 transition-colors pointer-events-none"
          size={18}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          disabled={!valid}
          onClick={onChooseLogin}
          className="bg-yellow-500 text-black py-5 rounded-[1.5rem] font-black text-sm flex items-center justify-center gap-2 shadow-xl active:scale-[0.98] transition-all disabled:opacity-40"
        >
          <LogIn size={16} />
          <span>ورود</span>
        </button>
        <button
          type="button"
          disabled={!valid}
          onClick={onChooseSignUp}
          className="bg-white text-black py-5 rounded-[1.5rem] font-black text-sm flex items-center justify-center gap-2 shadow-xl active:scale-[0.98] transition-all disabled:opacity-40"
        >
          <UserPlus size={16} />
          <span>ثبت‌نام</span>
        </button>
      </div>
    </motion.div>
  );
};
