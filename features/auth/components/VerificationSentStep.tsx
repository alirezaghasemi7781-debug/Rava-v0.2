import React from 'react';
import { motion as _motion } from 'framer-motion';
import { MailCheck, ArrowRight, RefreshCw } from 'lucide-react';
import { Button } from '../../../components/ui';

const motion = _motion as any;

interface VerificationSentStepProps {
  email: string;
  onBack: () => void;
  onLogin?: () => void;
}

export const VerificationSentStep: React.FC<VerificationSentStepProps> = ({ email, onBack, onLogin }) => (
  <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }} className="space-y-6 text-center">
    <div className="relative mx-auto h-20 w-20">
      <motion.div animate={{ scale: [1, 1.08, 1] }} transition={{ duration: 2, repeat: Infinity }} className="absolute inset-0 rounded-full bg-green-500/20 blur-2xl" />
      <div className="relative flex h-20 w-20 items-center justify-center rounded-rava-modal bg-green-500 text-black shadow-[0_20px_40px_rgba(34,197,94,0.3)]">
        <MailCheck size={38} />
      </div>
    </div>

    <div className="space-y-2">
      <h2 className="rava-page-title text-2xl">ایمیل رو چک کن رفیق!</h2>
      <p className="text-rava-sm leading-relaxed text-white/40">
        یه لینک تایید فرستادیم به <span className="font-mono text-green-400">{email}</span>. بزن روش تا سفرمون رو شروع کنیم.
      </p>
    </div>

    <div className="space-y-3 pt-2">
      <Button fullWidth variant="secondary" size="lg" onClick={onLogin || (() => window.location.reload())} trailingIcon={<ArrowRight size={18} />}>
        تایید کردم، ورود
      </Button>
      <Button variant="ghost" size="sm" onClick={onBack} leadingIcon={<RefreshCw size={14} />} className="mx-auto">
        تغییر ایمیل یا ارسال مجدد
      </Button>
    </div>
  </motion.div>
);
