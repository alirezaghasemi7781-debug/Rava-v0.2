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

  const [step, setStep] = useState<'email' | 'password' | 'verified' | 'forgot'>(
    'email'
  );
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
            setError(
              "رمزت اشتباهه. اگه اکانت نداری، بزن روی 'ساخت حساب جدید'."
            );
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
    <div className="fixed inset-0 z-[4000] bg-black flex flex-col items-center justify-center p-6 overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[120%] h-[120%] bg-[#050505]" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[80vw] h-[80vw] bg-yellow-500/10 blur-[120px] rounded-full animate-pulse" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm space-y-10 text-center relative z-10"
      >
        <div className="space-y-4">
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            className="w-16 h-16 bg-yellow-500 rounded-[1.8rem] mx-auto flex items-center justify-center text-black shadow-[0_20px_50px_rgba(234,179,8,0.2)]"
          >
            <Plane size={32} />
          </motion.div>
          <h1 className="text-3xl font-black text-white tracking-[0.15em]">
            Rava
          </h1>
          <p className="text-yellow-500/60 text-sm font-black tracking-[0.3em]">
            راوا
          </p>
          <p className="text-white/30 text-[10px] font-bold tracking-wide">
            دستیار هوشمند سفر
          </p>
        </div>

        <GlassCard className="p-8 border-white/5 shadow-2xl overflow-visible">
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
              className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-400 text-[10px] font-bold"
            >
              <AlertCircle size={14} className="shrink-0" />
              <p className="text-right flex-1">{error}</p>
            </motion.div>
          )}
        </GlassCard>

        <div className="flex items-center justify-center gap-8 text-white/5">
          <ShieldCheck size={24} />
          <div className="w-px h-6 bg-white/5" />
          <Sparkles size={24} />
        </div>
      </motion.div>
    </div>
  );
};
