import React, { useState } from 'react';
import { motion as _motion, AnimatePresence } from 'framer-motion';
import { Plane, ShieldCheck, Sparkles, AlertCircle } from 'lucide-react';
import { useAuthStore } from '../../../store/useAuthStore';
import { GlassCard } from '../../../components/core/GlassCard';
import { AudioGraph } from '../../../services/audioGraph';
import { EmailStep } from './EmailStep';
import { PasswordStep } from './PasswordStep';
import { VerificationSentStep } from './VerificationSentStep';
import { ForgotPasswordStep } from './ForgotPasswordStep';

const motion = _motion as any;

export const AuthScreen: React.FC = () => {
  const { login, signUp } = useAuthStore();

  const [step, setStep] = useState<'email' | 'password' | 'verified' | 'forgot'>('email');
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const goToPassword = (nextMode: 'login' | 'signup') => {
    if (!email.includes('@')) {
      setError('رفیق، ایمیلت رو درست وارد کن.');
      AudioGraph.haptic(50);
      return;
    }
    setError(null);
    setMode(nextMode);
    setPassword('');
    setStep('password');
    AudioGraph.getInstance().playTickSound();
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      setError('رمزت باید حداقل ۶ تا کاراکتر باشه عزیز.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (mode === 'login') {
        const result = await login(email, password);
        if (!result.success) {
          if (result.errorCode === 'EMAIL_NOT_CONFIRMED') {
            setStep('verified');
          } else if (result.errorCode === 'INVALID_CREDENTIALS') {
            setError("رمزت اشتباهه. اگه اکانت نداری، بزن روی 'ساخت حساب جدید'.");
            AudioGraph.haptic([50, 30, 50]);
          } else {
            setError(result.message || 'یه مشکل فنی پیش اومد.');
          }
        } else {
          AudioGraph.getInstance().playCoinSound();
        }
      } else {
        const result = await signUp(email, password);
        if (!result.success) {
          if (result.errorCode === 'USER_ALREADY_EXISTS') {
            setMode('login');
            setError('این ایمیل قبلاً هست، رمزت رو بزن.');
          } else {
            setError(result.message || 'خطا در ثبت‌نام');
          }
        } else {
          AudioGraph.getInstance().playCoinSound();
          setStep('verified');
        }
      }
    } catch {
      setError('ارتباط با سرور برقرار نشد.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[4000] flex flex-col items-center justify-center overflow-y-auto bg-black px-5 py-8 pt-safe pb-safe">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute start-[-10%] top-[-10%] h-[120%] w-[120%] bg-rava-bg" />
        <div className="absolute start-1/2 top-1/4 h-[70vw] max-h-md w-[70vw] max-w-md -translate-x-1/2 rounded-full bg-rava-gold/8 blur-[100px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-[340px] space-y-8 text-center"
      >
        <div className="space-y-3">
          <motion.div
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            className="mx-auto flex h-14 w-14 items-center justify-center rounded-rava-lg bg-rava-gold text-black shadow-[0_12px_32px_rgba(234,179,8,0.2)]"
          >
            <Plane size={28} />
          </motion.div>
          <h1 className="text-2xl font-black tracking-[0.12em] text-white">Rava</h1>
          <p className="text-rava-xs font-black tracking-[0.25em] text-rava-gold/60">راوا</p>
          <p className="text-rava-sm font-bold text-white/30">دستیار هوشمند سفر</p>
        </div>

        <GlassCard className="overflow-visible rounded-rava-xl border-white/5 p-6 shadow-2xl !backdrop-blur-xl">
          <AnimatePresence mode="wait">
            {step === 'email' && (
              <EmailStep
                key="email"
                email={email}
                onChange={setEmail}
                onChooseLogin={() => goToPassword('login')}
                onChooseSignUp={() => goToPassword('signup')}
              />
            )}
            {step === 'password' && (
              <PasswordStep
                key="password"
                email={email}
                password={password}
                mode={mode}
                loading={loading}
                onPasswordChange={setPassword}
                onModeToggle={() => {
                  setMode(mode === 'login' ? 'signup' : 'login');
                  setError(null);
                  setPassword('');
                }}
                onForgotPassword={() => {
                  setError(null);
                  setStep('forgot');
                }}
                onBack={() => {
                  setStep('email');
                  setError(null);
                }}
                onSubmit={handleFinalSubmit}
              />
            )}
            {step === 'forgot' && (
              <ForgotPasswordStep
                key="forgot"
                email={email}
                onEmailChange={setEmail}
                onBack={() => {
                  setMode('login');
                  setStep('password');
                  setError(null);
                }}
              />
            )}
            {step === 'verified' && (
              <VerificationSentStep
                key="verified"
                email={email}
                onBack={() => setStep('email')}
                onLogin={() => {
                  setMode('login');
                  setStep('password');
                  setError(null);
                }}
              />
            )}
          </AnimatePresence>

          {error && step !== 'verified' && step !== 'forgot' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-4 flex items-center gap-2.5 rounded-rava-lg border border-red-500/20 bg-red-500/10 p-3 text-rava-xs font-bold text-red-400"
            >
              <AlertCircle size={14} className="shrink-0" />
              <p className="flex-1 text-right leading-relaxed">{error}</p>
            </motion.div>
          )}
        </GlassCard>

        <div className="flex items-center justify-center gap-6 text-white/15">
          <ShieldCheck size={20} />
          <div className="h-5 w-px bg-white/10" />
          <Sparkles size={20} />
        </div>
      </motion.div>
    </div>
  );
};
