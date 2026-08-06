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
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 16 }}
      className="space-y-6"
    >
      <div className="text-right space-y-1.5">
        <h2 className="rava-page-title text-2xl">خوش اومدی!</h2>
        <p className="rava-page-subtitle leading-relaxed">
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
          className="rava-input ltr-island pe-11"
        />
        <Mail
          className="absolute end-4 top-1/2 -translate-y-1/2 text-white/15 transition-colors group-focus-within:text-rava-gold/50 pointer-events-none"
          size={17}
        />
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        <button
          type="button"
          disabled={!valid}
          onClick={onChooseLogin}
          className="rava-btn rava-btn-primary py-3"
        >
          <LogIn size={16} />
          <span>ورود</span>
        </button>
        <button
          type="button"
          disabled={!valid}
          onClick={onChooseSignUp}
          className="rava-btn rava-btn-secondary py-3"
        >
          <UserPlus size={16} />
          <span>ثبت‌نام</span>
        </button>
      </div>
    </motion.div>
  );
};
